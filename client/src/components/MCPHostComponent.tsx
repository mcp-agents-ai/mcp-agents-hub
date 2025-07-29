import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, Copy, Terminal, WifiOff, Wifi, Clock, Activity, ExternalLink } from 'lucide-react';
import { MCPServer, MCPHostSession, MCPHostStartRequest, MCPHostStartResponse, MCPHostEvent } from '../types';

interface MCPHostComponentProps {
  server: MCPServer;
  className?: string;
}

export function MCPHostComponent({ server, className = '' }: MCPHostComponentProps) {
  const [session, setSession] = useState<MCPHostSession | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [output, setOutput] = useState<Array<{ type: 'stdout' | 'stderr' | 'info' | 'error'; text: string; timestamp: Date }>>([]);
  const [showOutput, setShowOutput] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  
  const eventSourceRef = useRef<EventSource | null>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  // Clean up event source on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  // Auto-scroll output to bottom
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  const addOutput = (type: 'stdout' | 'stderr' | 'info' | 'error', text: string) => {
    setOutput(prev => [...prev, { type, text, timestamp: new Date() }]);
  };

  const connectToEventStream = (sessionId: string) => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    setConnectionStatus('connecting');
    const eventSource = new EventSource(`/v1/host/events/${sessionId}`);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setConnectionStatus('connected');
      addOutput('info', 'Connected to MCP server event stream');
    };

    eventSource.onmessage = (event) => {
      try {
        const data: MCPHostEvent = JSON.parse(event.data);
        
        switch (data.type) {
          case 'connected':
            addOutput('info', `Connected to session ${data.sessionId}`);
            break;
          case 'stdout':
            if (data.data) {
              addOutput('stdout', data.data);
            }
            break;
          case 'stderr':
            if (data.data) {
              addOutput('stderr', data.data);
            }
            break;
          case 'status':
            if (data.status) {
              setSession(prev => prev ? { ...prev, status: data.status as any } : null);
              addOutput('info', `Status: ${data.status}`);
            }
            break;
          case 'error':
            if (data.error) {
              addOutput('error', `Error: ${data.error}`);
            }
            break;
          case 'exit':
            addOutput('info', `Process exited with code ${data.code} (signal: ${data.signal || 'none'})`);
            setSession(prev => prev ? { ...prev, status: 'stopped' } : null);
            setConnectionStatus('disconnected');
            break;
          case 'ping':
            // Ignore ping messages
            break;
        }
      } catch (error) {
        console.error('Error parsing SSE message:', error);
      }
    };

    eventSource.onerror = () => {
      setConnectionStatus('disconnected');
      addOutput('error', 'Lost connection to MCP server');
    };
  };

  const startServer = async () => {
    setIsStarting(true);
    setOutput([]);
    
    try {
      // For MVP, we'll try to determine the npm package from the GitHub URL
      let npmPackage = '';
      let command = '';
      let args: string[] = [];

      // Extract package name from GitHub URL or use a simple approach
      if (server.githubUrl) {
        const parts = server.githubUrl.split('/');
        const repoName = parts[parts.length - 1];
        // Try common MCP server patterns
        if (repoName.includes('mcp-server') || repoName.includes('mcp-')) {
          npmPackage = repoName;
        } else {
          npmPackage = `@${parts[parts.length - 2]}/${repoName}`;
        }
      }

      // Fallback to a simple echo command for demo
      if (!npmPackage) {
        command = 'node';
        args = ['-e', 'console.log("MCP Server simulation - This would run an actual MCP server"); process.stdin.resume();'];
      }

      const startRequest: MCPHostStartRequest = {
        serverId: server.hubId || server.mcpId,
        serverName: server.name,
        ...(npmPackage ? { npmPackage } : { command, args })
      };

      addOutput('info', `Starting MCP server: ${server.name}`);
      if (npmPackage) {
        addOutput('info', `Using npm package: ${npmPackage}`);
      } else {
        addOutput('info', `Using command: ${command} ${args.join(' ')}`);
      }

      const response = await fetch('/v1/host/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(startRequest),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to start server');
      }

      const result: MCPHostStartResponse = await response.json();
      
      const newSession: MCPHostSession = {
        sessionId: result.sessionId,
        serverId: startRequest.serverId,
        status: result.status as any,
        url: result.url,
        startTime: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
      };

      setSession(newSession);
      connectToEventStream(result.sessionId);
      
      addOutput('info', `Server started successfully!`);
      addOutput('info', `Session ID: ${result.sessionId}`);
      
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      addOutput('error', `Failed to start server: ${message}`);
    } finally {
      setIsStarting(false);
    }
  };

  const stopServer = async () => {
    if (!session) return;

    try {
      const response = await fetch(`/v1/host/stop/${session.sessionId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        addOutput('info', 'Stop signal sent to server');
      } else {
        const error = await response.json();
        addOutput('error', `Failed to stop server: ${error.error}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      addOutput('error', `Error stopping server: ${message}`);
    }
  };

  const copyUrl = async () => {
    if (!session?.url) return;

    try {
      await navigator.clipboard.writeText(session.url);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Failed to copy URL:', error);
    }
  };

  const formatUptime = (startTime: string) => {
    const start = new Date(startTime);
    const now = new Date();
    const diffMs = now.getTime() - start.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);

    if (diffHour > 0) {
      return `${diffHour}h ${diffMin % 60}m`;
    } else if (diffMin > 0) {
      return `${diffMin}m ${diffSec % 60}s`;
    } else {
      return `${diffSec}s`;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'text-green-600 bg-green-100';
      case 'starting': return 'text-yellow-600 bg-yellow-100';
      case 'stopping': return 'text-orange-600 bg-orange-100';
      case 'stopped': return 'text-gray-600 bg-gray-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getConnectionIcon = () => {
    switch (connectionStatus) {
      case 'connected': return <Wifi className="h-4 w-4 text-green-600" />;
      case 'connecting': return <Activity className="h-4 w-4 text-yellow-600 animate-pulse" />;
      default: return <WifiOff className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Terminal className="h-5 w-5" />
          MCP Host
        </h3>
        {getConnectionIcon()}
      </div>

      {!session ? (
        <div className="space-y-4">
          <p className="text-gray-600 text-sm">
            Start this MCP server online with one click. You'll get a remote URL that you can use locally.
          </p>
          <button
            onClick={startServer}
            disabled={isStarting}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isStarting ? (
              <>
                <Activity className="animate-spin -ml-1 mr-2 h-4 w-4" />
                Starting...
              </>
            ) : (
              <>
                <Play className="-ml-1 mr-2 h-4 w-4" />
                Start Server
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(session.status)}`}>
                {session.status}
              </span>
              {session.startTime && (
                <span className="text-sm text-gray-500 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatUptime(session.startTime)}
                </span>
              )}
            </div>
            <button
              onClick={stopServer}
              disabled={session.status === 'stopped' || session.status === 'stopping'}
              className="inline-flex items-center px-3 py-1 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Square className="-ml-1 mr-1 h-3 w-3" />
              Stop
            </button>
          </div>

          {session.url && (
            <div className="bg-gray-50 rounded-md p-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                MCP Server URL
              </label>
              <div className="flex items-center space-x-2">
                <code className="flex-1 text-sm bg-white border rounded px-2 py-1 text-gray-800 font-mono">
                  {session.url}
                </code>
                <button
                  onClick={copyUrl}
                  className="inline-flex items-center px-2 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Copy className="h-3 w-3" />
                </button>
                {copySuccess && (
                  <span className="text-sm text-green-600">Copied!</span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Use this URL in your MCP client to connect to the hosted server.
              </p>
            </div>
          )}

          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowOutput(!showOutput)}
              className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Terminal className="-ml-1 mr-1 h-3 w-3" />
              {showOutput ? 'Hide' : 'Show'} Output
            </button>
            
            {output.length > 0 && (
              <span className="text-sm text-gray-500">
                {output.length} message{output.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {showOutput && (
            <div className="bg-black rounded-md p-3 text-white text-sm font-mono h-64 overflow-y-auto" ref={outputRef}>
              {output.length === 0 ? (
                <div className="text-gray-400">No output yet...</div>
              ) : (
                output.map((line, index) => (
                  <div key={index} className={`mb-1 ${
                    line.type === 'error' ? 'text-red-400' : 
                    line.type === 'stderr' ? 'text-yellow-400' :
                    line.type === 'info' ? 'text-blue-400' : 
                    'text-white'
                  }`}>
                    <span className="text-gray-500 text-xs">
                      {line.timestamp.toLocaleTimeString()}
                    </span>{' '}
                    {line.text}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}