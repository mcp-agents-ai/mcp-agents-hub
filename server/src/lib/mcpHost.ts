import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';

export interface HostedMCPServer {
  sessionId: string;
  serverId: string;
  process: ChildProcess;
  status: 'starting' | 'running' | 'stopping' | 'stopped' | 'error';
  url?: string;
  startTime: Date;
  lastActivity: Date;
  eventEmitter: EventEmitter;
  stdout: string;
  stderr: string;
}

export interface MCPHostStartRequest {
  serverId: string;
  serverName: string;
  gitUrl?: string;
  npmPackage?: string;
  command?: string;
  args?: string[];
}

export interface MCPHostStartResponse {
  sessionId: string;
  status: string;
  url: string;
  eventStreamUrl: string;
}

class MCPHostManager {
  private hostedServers: Map<string, HostedMCPServer> = new Map();
  private readonly MAX_SERVERS = 10; // Limit concurrent servers
  private readonly IDLE_TIMEOUT = 30 * 60 * 1000; // 30 minutes

  constructor() {
    // Clean up idle servers periodically
    setInterval(() => {
      this.cleanupIdleServers();
    }, 5 * 60 * 1000); // Check every 5 minutes
  }

  /**
   * Start a new MCP server instance
   */
  async startServer(request: MCPHostStartRequest): Promise<MCPHostStartResponse> {
    // Check server limit
    if (this.hostedServers.size >= this.MAX_SERVERS) {
      throw new Error('Maximum number of hosted servers reached');
    }

    const sessionId = uuidv4();
    const eventEmitter = new EventEmitter();
    
    // For MVP, we'll support npm packages and basic commands
    let command: string;
    let args: string[] = [];
    
    if (request.npmPackage) {
      // Install and run npm package
      command = 'npx';
      args = [request.npmPackage];
    } else if (request.command) {
      // Run custom command
      command = request.command;
      args = request.args || [];
    } else {
      throw new Error('Either npmPackage or command must be provided');
    }

    try {
      const childProcess = spawn(command, args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, NODE_ENV: 'production' }
      });

      const hostedServer: HostedMCPServer = {
        sessionId,
        serverId: request.serverId,
        process: childProcess,
        status: 'starting',
        startTime: new Date(),
        lastActivity: new Date(),
        eventEmitter,
        stdout: '',
        stderr: ''
      };

      this.hostedServers.set(sessionId, hostedServer);

      // Handle process output
      childProcess.stdout?.on('data', (data) => {
        const output = data.toString();
        hostedServer.stdout += output;
        hostedServer.lastActivity = new Date();
        eventEmitter.emit('stdout', output);
        
        // Update status when server is ready
        if (output.includes('Server listening') || output.includes('MCP server started')) {
          hostedServer.status = 'running';
          eventEmitter.emit('status', 'running');
        }
      });

      childProcess.stderr?.on('data', (data) => {
        const output = data.toString();
        hostedServer.stderr += output;
        hostedServer.lastActivity = new Date();
        eventEmitter.emit('stderr', output);
      });

      childProcess.on('exit', (code, signal) => {
        hostedServer.status = code === 0 ? 'stopped' : 'error';
        eventEmitter.emit('exit', { code, signal });
        
        // Clean up after a delay
        setTimeout(() => {
          this.hostedServers.delete(sessionId);
        }, 60000); // Keep for 1 minute after exit for status queries
      });

      childProcess.on('error', (error) => {
        hostedServer.status = 'error';
        eventEmitter.emit('error', error.message);
        console.error(`MCP server ${sessionId} error:`, error);
      });

      // Generate URL for the hosted server (SSE endpoint)
      const baseUrl = process.env.BASE_URL || 'http://localhost:3001';
      const url = `${baseUrl}/v1/host/events/${sessionId}`;
      hostedServer.url = url;

      // Set status to running after a short delay (optimistic)
      setTimeout(() => {
        if (hostedServer.status === 'starting') {
          hostedServer.status = 'running';
          eventEmitter.emit('status', 'running');
        }
      }, 3000);

      return {
        sessionId,
        status: hostedServer.status,
        url,
        eventStreamUrl: url
      };

    } catch (error) {
      this.hostedServers.delete(sessionId);
      throw error;
    }
  }

  /**
   * Stop a hosted MCP server
   */
  async stopServer(sessionId: string): Promise<boolean> {
    const server = this.hostedServers.get(sessionId);
    if (!server) {
      return false;
    }

    server.status = 'stopping';
    server.eventEmitter.emit('status', 'stopping');

    try {
      // Try graceful shutdown first
      server.process.kill('SIGTERM');
      
      // Force kill after timeout
      setTimeout(() => {
        if (server.process && !server.process.killed) {
          server.process.kill('SIGKILL');
        }
      }, 5000);

      return true;
    } catch (error) {
      console.error(`Error stopping server ${sessionId}:`, error);
      return false;
    }
  }

  /**
   * Get server status
   */
  getServerStatus(sessionId: string): HostedMCPServer | null {
    return this.hostedServers.get(sessionId) || null;
  }

  /**
   * Get all hosted servers
   */
  getAllServers(): HostedMCPServer[] {
    return Array.from(this.hostedServers.values());
  }

  /**
   * Get event emitter for a server
   */
  getServerEventEmitter(sessionId: string): EventEmitter | null {
    const server = this.hostedServers.get(sessionId);
    return server ? server.eventEmitter : null;
  }

  /**
   * Clean up idle servers
   */
  private cleanupIdleServers(): void {
    const now = new Date();
    
    for (const [sessionId, server] of this.hostedServers) {
      const idleTime = now.getTime() - server.lastActivity.getTime();
      
      if (idleTime > this.IDLE_TIMEOUT && server.status === 'running') {
        console.log(`Cleaning up idle server ${sessionId}`);
        this.stopServer(sessionId);
      }
    }
  }

  /**
   * Send input to a hosted server's stdin
   */
  sendInput(sessionId: string, input: string): boolean {
    const server = this.hostedServers.get(sessionId);
    if (!server || !server.process.stdin) {
      return false;
    }

    try {
      server.process.stdin.write(input);
      server.lastActivity = new Date();
      return true;
    } catch (error) {
      console.error(`Error sending input to server ${sessionId}:`, error);
      return false;
    }
  }
}

// Singleton instance
export const mcpHostManager = new MCPHostManager();