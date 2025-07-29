import { spawn, ChildProcess } from 'child_process';
import fetch from 'node-fetch';

export class TestServer {
  private process: ChildProcess | null = null;
  private port: number;
  private maxRetries: number = 30;
  private retryDelay: number = 1000;

  constructor(port: number = 5002) {
    this.port = port;
  }

  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log(`Starting test server on port ${this.port}...`);
      
      // Set environment variables for test server
      const env = {
        ...process.env,
        NODE_ENV: 'test',
        PERMISO_SERVER_PORT: this.port.toString(),
        PERMISO_TEST_DB_HOST: process.env.PERMISO_TEST_DB_HOST || 'localhost',
        PERMISO_TEST_DB_PORT: process.env.PERMISO_TEST_DB_PORT || '5432',
        PERMISO_TEST_DB_NAME: process.env.PERMISO_TEST_DB_NAME || 'permiso_test',
        PERMISO_TEST_DB_USER: process.env.PERMISO_TEST_DB_USER || 'postgres',
        PERMISO_TEST_DB_PASSWORD: process.env.PERMISO_TEST_DB_PASSWORD || 'postgres',
      };

      // Start the server from the project root
      const projectRoot = process.cwd().replace('/node/packages/permiso-integration-tests', '');
      
      this.process = spawn('npm', ['start'], {
        env,
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: true,
        cwd: projectRoot
      });

      let serverStarted = false;

      this.process.stdout?.on('data', (data) => {
        const output = data.toString();
        
        // Check if server is ready
        if (output.includes('Server started') || output.includes('listening on')) {
          serverStarted = true;
        }
      });

      this.process.stderr?.on('data', (data) => {
        console.error('Server error:', data.toString());
      });

      this.process.on('error', (error) => {
        console.error('Failed to start server:', error);
        reject(error);
      });

      this.process.on('exit', (code) => {
        if (!serverStarted && code !== 0) {
          reject(new Error(`Server exited with code ${code}`));
        }
      });

      // Wait for server to be ready
      this.waitForServer()
        .then(() => {
          console.log('Test server is ready');
          resolve();
        })
        .catch(reject);
    });
  }

  private async waitForServer(): Promise<void> {
    for (let i = 0; i < this.maxRetries; i++) {
      try {
        const response = await fetch(`http://localhost:${this.port}/graphql`, {
          method: 'GET',
          headers: { 'Accept': 'text/html' }
        });
        
        if (response.ok) {
          return;
        }
      } catch (error) {
        // Server not ready yet
      }
      
      await new Promise(resolve => setTimeout(resolve, this.retryDelay));
    }
    
    throw new Error(`Server failed to start after ${this.maxRetries} attempts`);
  }

  async stop(): Promise<void> {
    if (this.process) {
      console.log('Stopping test server...');
      
      return new Promise((resolve) => {
        this.process!.on('exit', () => {
          console.log('Test server stopped');
          this.process = null;
          resolve();
        });
        
        this.process!.kill('SIGTERM');
        
        // Force kill after 5 seconds
        setTimeout(() => {
          if (this.process) {
            this.process.kill('SIGKILL');
          }
        }, 5000);
      });
    }
  }
}