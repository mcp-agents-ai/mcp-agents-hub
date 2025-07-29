export interface MCPServer {
  mcpId: string;
  githubUrl: string;
  name: string;
  author: string;
  description: string;
  codiconIcon: string;
  logoUrl: string;
  category: string;
  tags: string[];
  requiresApiKey: boolean;
  isRecommended: boolean;
  isOfficialIntegration?: boolean;
  isReferenceServer?: boolean;
  isCommunityServer?: boolean;
  githubStars: number;
  downloadCount: number;
  createdAt: string;
  updatedAt: string;
  hubId?: string; // Added hubId field for server details navigation
  Installation_instructions?: string;
  Usage_instructions?: string;
  features?: string[];
  prerequisites?: string[];
  lastEnrichmentTime?: number;
  githubLatestCommit?: string;
  githubForks?: number;
  licenseType?: string | null;
}

export interface MCPHostSession {
  sessionId: string;
  serverId: string;
  status: 'starting' | 'running' | 'stopping' | 'stopped' | 'error';
  url?: string;
  startTime: string;
  lastActivity: string;
  uptime?: number;
  hasOutput?: boolean;
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

export interface MCPHostEvent {
  type: 'connected' | 'stdout' | 'stderr' | 'status' | 'error' | 'exit' | 'ping';
  sessionId?: string;
  data?: string;
  status?: string;
  error?: string;
  code?: number | null;
  signal?: string | null;
  timestamp?: number;
}