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

  private async killProcessOnPort(): Promise<void> {
    try {
      // Find process using the port
      const { execSync } = await import('child_process');
      const pid = execSync(`lsof -ti:${this.port} || true`).toString().trim();
      
      if (pid) {
        console.log(`Killing process ${pid} using port ${this.port}...`);
        execSync(`kill -9 ${pid}`);
        // Wait a bit for the process to die
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch {
      // Ignore errors - port might already be free
    }
  }

  async start(): Promise<void> {
    // Kill any process using the port first
    await this.killProcessOnPort();
    
    return new Promise((resolve, reject) => {
      console.log(`Starting test server on port ${this.port}...`);
      
      // Set environment variables for test server
      // Override the PERMISO database name for tests
      const env = {
        ...process.env,
        NODE_ENV: 'test',
        PERMISO_SERVER_PORT: this.port.toString(),
        PERMISO_DB_HOST: process.env.PERMISO_DB_HOST || 'localhost',
        PERMISO_DB_PORT: process.env.PERMISO_DB_PORT || '5432',
        PERMISO_DB_NAME: 'permiso_test', // Use test database
        PERMISO_DB_USER: process.env.PERMISO_DB_USER || 'postgres',
        PERMISO_DB_PASSWORD: process.env.PERMISO_DB_PASSWORD || 'postgres',
        // Include API key settings if present
        PERMISO_API_KEY: process.env.PERMISO_API_KEY || '',
        PERMISO_API_KEY_ENABLED: process.env.PERMISO_API_KEY_ENABLED || 'false',
      };

      // Start the server from the project root
      const projectRoot = new URL('../../../../../', import.meta.url).pathname;
      
      this.process = spawn('./start.sh', [], {
        env,
        stdio: ['ignore', 'pipe', 'inherit'], // Show stderr output directly
        shell: true,
        cwd: projectRoot
      });

      let serverStarted = false;

      this.process.stdout?.on('data', (data) => {
        const output = data.toString();
        console.log('Server output:', output); // Debug output
        
        // Check if server is ready
        if (output.includes('GraphQL server running') || output.includes('Server running at')) {
          serverStarted = true;
          resolve(); // Resolve immediately when server is ready
        }
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
      } catch {
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
        let resolved = false;
        
        const cleanup = () => {
          if (!resolved) {
            resolved = true;
            console.log('Test server stopped');
            this.process = null;
            resolve();
          }
        };
        
        // Set up exit handler
        this.process!.on('exit', cleanup);
        
        // Try graceful shutdown
        this.process!.kill('SIGTERM');
        
        // Force kill after 2 seconds and resolve
        setTimeout(() => {
          if (this.process && !resolved) {
            console.log('Force killing test server...');
            this.process.kill('SIGKILL');
            // Give it a moment to actually die
            setTimeout(cleanup, 100);
          }
        }, 2000);
      });
    }
  }
}