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
        // Killing process using port
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
      // Starting test server
      
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

      // Start the server directly without shell script
      const serverPath = new URL('../../../permiso-server/dist/bin/server.js', import.meta.url).pathname;
      
      this.process = spawn('node', [serverPath], {
        env,
        stdio: ['ignore', 'pipe', 'inherit'], // Show stderr output directly
        cwd: new URL('../../../permiso-server/', import.meta.url).pathname
      });

      let serverStarted = false;

      this.process.stdout?.on('data', (data) => {
        const output = data.toString();
        // Server output received
        
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
          // Test server is ready
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
      return new Promise((resolve) => {
        let resolved = false;
        
        const cleanup = () => {
          if (!resolved) {
            resolved = true;
            this.process = null;
            resolve();
          }
        };
        
        // Set up exit handler
        this.process!.on('exit', cleanup);
        
        // Try graceful shutdown
        this.process!.kill('SIGTERM');
        
        // Force kill after 2 seconds and resolve
        setTimeout(async () => {
          if (this.process && !resolved) {
            this.process.kill('SIGKILL');
            // Also kill any process on the port just to be sure
            await this.killProcessOnPort();
            // Give it a moment to actually die
            setTimeout(cleanup, 100);
          }
        }, 2000);
      });
    }
  }
}