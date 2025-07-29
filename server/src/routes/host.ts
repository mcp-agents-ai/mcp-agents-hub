import { Router, Request, Response } from 'express';
import { mcpHostManager, MCPHostStartRequest } from '../lib/mcpHost.js';

const router = Router();

// POST /start - Start a new MCP server instance
router.post('/start', async (req: Request, res: Response): Promise<void> => {
  try {
    const startRequest: MCPHostStartRequest = req.body;
    
    // Validate request
    if (!startRequest.serverId || !startRequest.serverName) {
      res.status(400).json({ error: 'serverId and serverName are required' });
      return;
    }

    if (!startRequest.npmPackage && !startRequest.command) {
      res.status(400).json({ error: 'Either npmPackage or command must be provided' });
      return;
    }

    console.log(`Starting MCP server: ${startRequest.serverName} (${startRequest.serverId})`);
    
    const result = await mcpHostManager.startServer(startRequest);
    
    res.status(201).json(result);
    console.log(`MCP server started successfully: ${result.sessionId}`);
  } catch (error) {
    console.error('Error starting MCP server:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to start MCP server';
    res.status(500).json({ error: errorMessage });
  }
});

// GET /status/:sessionId - Get status of a hosted server
router.get('/status/:sessionId', (req: Request, res: Response): void => {
  try {
    const { sessionId } = req.params;
    
    const server = mcpHostManager.getServerStatus(sessionId);
    
    if (!server) {
      res.status(404).json({ error: 'Server session not found' });
      return;
    }

    // Return status without sensitive process information
    const status = {
      sessionId: server.sessionId,
      serverId: server.serverId,
      status: server.status,
      url: server.url,
      startTime: server.startTime,
      lastActivity: server.lastActivity,
      uptime: Date.now() - server.startTime.getTime(),
      hasOutput: server.stdout.length > 0 || server.stderr.length > 0
    };

    res.json(status);
  } catch (error) {
    console.error('Error getting server status:', error);
    res.status(500).json({ error: 'Failed to get server status' });
  }
});

// DELETE /stop/:sessionId - Stop a hosted server
router.delete('/stop/:sessionId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.params;
    
    const success = await mcpHostManager.stopServer(sessionId);
    
    if (!success) {
      res.status(404).json({ error: 'Server session not found or already stopped' });
      return;
    }

    res.json({ message: 'Server stop requested', sessionId });
    console.log(`Stop requested for MCP server: ${sessionId}`);
  } catch (error) {
    console.error('Error stopping MCP server:', error);
    res.status(500).json({ error: 'Failed to stop server' });
  }
});

// GET /events/:sessionId - SSE endpoint for server events
router.get('/events/:sessionId', (req: Request, res: Response): void => {
  try {
    const { sessionId } = req.params;
    
    const eventEmitter = mcpHostManager.getServerEventEmitter(sessionId);
    
    if (!eventEmitter) {
      res.status(404).json({ error: 'Server session not found' });
      return;
    }

    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Cache-Control');

    // Send initial connection event
    res.write(`data: ${JSON.stringify({ type: 'connected', sessionId })}\n\n`);

    // Set up event listeners
    const onStdout = (data: string) => {
      res.write(`data: ${JSON.stringify({ type: 'stdout', data })}\n\n`);
    };

    const onStderr = (data: string) => {
      res.write(`data: ${JSON.stringify({ type: 'stderr', data })}\n\n`);
    };

    const onStatus = (status: string) => {
      res.write(`data: ${JSON.stringify({ type: 'status', status })}\n\n`);
    };

    const onError = (error: string) => {
      res.write(`data: ${JSON.stringify({ type: 'error', error })}\n\n`);
    };

    const onExit = (exitInfo: { code: number | null; signal: NodeJS.Signals | null }) => {
      res.write(`data: ${JSON.stringify({ type: 'exit', ...exitInfo })}\n\n`);
      res.end();
    };

    // Attach event listeners
    eventEmitter.on('stdout', onStdout);
    eventEmitter.on('stderr', onStderr);
    eventEmitter.on('status', onStatus);
    eventEmitter.on('error', onError);
    eventEmitter.on('exit', onExit);

    // Send current server status
    const server = mcpHostManager.getServerStatus(sessionId);
    if (server) {
      res.write(`data: ${JSON.stringify({ type: 'status', status: server.status })}\n\n`);
      
      // Send any existing output
      if (server.stdout) {
        res.write(`data: ${JSON.stringify({ type: 'stdout', data: server.stdout })}\n\n`);
      }
      if (server.stderr) {
        res.write(`data: ${JSON.stringify({ type: 'stderr', data: server.stderr })}\n\n`);
      }
    }

    // Clean up listeners when client disconnects
    req.on('close', () => {
      eventEmitter.removeListener('stdout', onStdout);
      eventEmitter.removeListener('stderr', onStderr);
      eventEmitter.removeListener('status', onStatus);
      eventEmitter.removeListener('error', onError);
      eventEmitter.removeListener('exit', onExit);
    });

    // Keep connection alive with periodic pings
    const pingInterval = setInterval(() => {
      res.write(`data: ${JSON.stringify({ type: 'ping', timestamp: Date.now() })}\n\n`);
    }, 30000); // Every 30 seconds

    req.on('close', () => {
      clearInterval(pingInterval);
    });

  } catch (error) {
    console.error('Error setting up SSE:', error);
    res.status(500).json({ error: 'Failed to establish event stream' });
  }
});

// POST /input/:sessionId - Send input to a hosted server
router.post('/input/:sessionId', (req: Request, res: Response): void => {
  try {
    const { sessionId } = req.params;
    const { input } = req.body;
    
    if (typeof input !== 'string') {
      res.status(400).json({ error: 'Input must be a string' });
      return;
    }

    const success = mcpHostManager.sendInput(sessionId, input);
    
    if (!success) {
      res.status(404).json({ error: 'Server session not found or input not available' });
      return;
    }

    res.json({ message: 'Input sent successfully' });
  } catch (error) {
    console.error('Error sending input to server:', error);
    res.status(500).json({ error: 'Failed to send input' });
  }
});

// GET /list - List all hosted servers
router.get('/list', (req: Request, res: Response): void => {
  try {
    const servers = mcpHostManager.getAllServers().map(server => ({
      sessionId: server.sessionId,
      serverId: server.serverId,
      status: server.status,
      startTime: server.startTime,
      lastActivity: server.lastActivity,
      uptime: Date.now() - server.startTime.getTime()
    }));

    res.json({ servers, count: servers.length });
  } catch (error) {
    console.error('Error listing servers:', error);
    res.status(500).json({ error: 'Failed to list servers' });
  }
});

export default router;