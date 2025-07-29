import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mcpHostManager } from '../../src/lib/mcpHost.js';

describe('MCP Host Manager', () => {
  let initialServerCount = 0;

  beforeEach(() => {
    // Track initial state
    initialServerCount = mcpHostManager.getAllServers().length;
  });

  afterEach(async () => {
    // Clean up all servers created during the test
    const servers = mcpHostManager.getAllServers();
    for (const server of servers) {
      await mcpHostManager.stopServer(server.sessionId);
    }
    
    // Wait for cleanup
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  it('should create a new server session with npm package', async () => {
    const request = {
      serverId: 'test-server',
      serverName: 'Test Server',
      npmPackage: 'echo-mcp-server'
    };

    const result = await mcpHostManager.startServer(request);
    
    expect(result).toHaveProperty('sessionId');
    expect(result).toHaveProperty('status');
    expect(result).toHaveProperty('url');
    expect(result).toHaveProperty('eventStreamUrl');
    expect(result.url).toContain('/v1/host/events/');
  });

  it('should create a new server session with custom command', async () => {
    const request = {
      serverId: 'test-server-2',
      serverName: 'Test Server 2',
      command: 'echo',
      args: ['Hello World']
    };

    const result = await mcpHostManager.startServer(request);
    
    expect(result).toHaveProperty('sessionId');
    expect(result.status).toBe('starting');
    
    // Verify server is tracked (should be initialServerCount + 1)
    const servers = mcpHostManager.getAllServers();
    expect(servers.length).toBeGreaterThan(initialServerCount);
    
    const testServer = servers.find(s => s.serverId === 'test-server-2');
    expect(testServer).toBeDefined();
  });

  it('should reject request with neither npmPackage nor command', async () => {
    const request = {
      serverId: 'test-server-3',
      serverName: 'Test Server 3'
    };

    await expect(mcpHostManager.startServer(request)).rejects.toThrow(
      'Either npmPackage or command must be provided'
    );
  });

  it('should get server status', async () => {
    const request = {
      serverId: 'test-server-4',
      serverName: 'Test Server 4',
      command: 'sleep',
      args: ['1']
    };

    const result = await mcpHostManager.startServer(request);
    const status = mcpHostManager.getServerStatus(result.sessionId);
    
    expect(status).not.toBeNull();
    expect(status?.sessionId).toBe(result.sessionId);
    expect(status?.serverId).toBe('test-server-4');
  });

  it('should return null for non-existent server status', () => {
    const status = mcpHostManager.getServerStatus('non-existent-id');
    expect(status).toBeNull();
  });

  it('should stop a server', async () => {
    const request = {
      serverId: 'test-server-5',
      serverName: 'Test Server 5',
      command: 'sleep',
      args: ['10']
    };

    const result = await mcpHostManager.startServer(request);
    const stopped = await mcpHostManager.stopServer(result.sessionId);
    
    expect(stopped).toBe(true);
  });

  it('should return false when stopping non-existent server', async () => {
    const stopped = await mcpHostManager.stopServer('non-existent-id');
    expect(stopped).toBe(false);
  });

  it('should get event emitter for server', async () => {
    const request = {
      serverId: 'test-server-6',
      serverName: 'Test Server 6',
      command: 'echo',
      args: ['test']
    };

    const result = await mcpHostManager.startServer(request);
    const eventEmitter = mcpHostManager.getServerEventEmitter(result.sessionId);
    
    expect(eventEmitter).not.toBeNull();
    expect(typeof eventEmitter?.emit).toBe('function');
  });

  it('should return null for non-existent server event emitter', () => {
    const eventEmitter = mcpHostManager.getServerEventEmitter('non-existent-id');
    expect(eventEmitter).toBeNull();
  });
});