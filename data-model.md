# MCP Agents Hub - Data Model Documentation

This document describes the data model for the MCP Agents Hub application, a marketplace for discovering, submitting, and managing MCP (Model Context Protocol) servers.

## Table of Contents

- [Core Entities](#core-entities)
  - [McpServer](#mcpserver)
  - [EnrichedMcpServer](#enrichedmcpserver)
  - [ReadmeExtractedInfo](#readmeextractedinfo)
  - [GithubRepoInfo](#githubrepoinfo)
  - [ServerInfo (Crawler)](#serverinfo-crawler)
- [Enumerations & Constants](#enumerations--constants)
  - [Server Types](#server-types)
  - [Categories](#categories)
  - [Supported Languages](#supported-languages)
- [API Types](#api-types)
- [Configuration](#configuration)
- [Data Relationships](#data-relationships)
- [Data Storage](#data-storage)
- [Data Flow Pipeline](#data-flow-pipeline)

---

## Core Entities

### McpServer

The primary data model representing an MCP server entry in the marketplace.

#### Server-side Definition (`server/src/lib/mcpServers.ts`)

```typescript
export interface McpServer {
  mcpId: string;                    // Unique identifier (e.g., "github.com/owner/repo")
  githubUrl?: string;               // GitHub repository URL
  name: string;                     // Server name
  author: string;                   // Author/owner name
  description: string;              // Server description
  codiconIcon?: string;             // VS Code codicon icon name
  logoUrl?: string;                 // URL to server logo image
  category?: string;                // Category key
  tags?: string[];                  // Array of tags
  requiresApiKey?: boolean;         // Whether API key is required
  isRecommended?: boolean;          // Recommended server flag
  githubStars?: number;             // GitHub star count
  downloadCount?: number;           // Download count
  createdAt?: string;               // ISO timestamp
  updatedAt?: string;               // ISO timestamp
  hubId: string;                    // UUID for internal identification
  isOfficialIntegration?: boolean;  // Official integration flag
  isReferenceServer?: boolean;      // Reference server flag
  isCommunityServer?: boolean;      // Community server flag
  githubLatestCommit?: string;      // Latest commit SHA
  githubForks?: number;             // Fork count
  licenseType?: string | null;      // SPDX license ID
  [key: string]: string | number | boolean | string[] | null | undefined;
}
```

#### Client-side Definition (`client/src/types.ts`)

```typescript
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
  hubId?: string;
  Installation_instructions?: string;
  Usage_instructions?: string;
  features?: string[];
  prerequisites?: string[];
  lastEnrichmentTime?: number;
  githubLatestCommit?: string;
  githubForks?: number;
  licenseType?: string | null;
}
```

#### Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `hubId` | string (UUID) | Yes | Internal unique identifier |
| `mcpId` | string | Yes | Public identifier in format `github.com/{author}/{repo}` |
| `githubUrl` | string | No | Full GitHub repository URL |
| `name` | string | Yes | Display name of the MCP server |
| `author` | string | Yes | Owner/author name |
| `description` | string | Yes | Brief description of the server |
| `codiconIcon` | string | No | VS Code codicon icon identifier |
| `logoUrl` | string | No | URL to the server's logo image |
| `category` | string | No | Category key from predefined list |
| `tags` | string[] | No | Array of searchable tags |
| `requiresApiKey` | boolean | No | Indicates if API key is needed to use |
| `isRecommended` | boolean | No | Featured/recommended flag |
| `githubStars` | number | No | Star count from GitHub |
| `downloadCount` | number | No | Installation/download count |
| `createdAt` | string | No | ISO 8601 timestamp of creation |
| `updatedAt` | string | No | ISO 8601 timestamp of last update |
| `isOfficialIntegration` | boolean | No | Official integration designation |
| `isReferenceServer` | boolean | No | Reference server designation |
| `isCommunityServer` | boolean | No | Community server designation |
| `githubLatestCommit` | string | No | Latest commit SHA from GitHub |
| `githubForks` | number | No | Fork count from GitHub |
| `licenseType` | string \| null | No | SPDX license identifier |

---

### EnrichedMcpServer

Extended server data enriched with information extracted from GitHub README files.

#### Definition (`server/src/lib/githubEnrichment.ts`)

```typescript
export interface EnrichedMcpServer extends McpServer {
  Installation_instructions?: string;
  Usage_instructions?: string;
  features?: string[];
  prerequisites?: string[];
  lastEnrichmentTime?: number;
  latest_update_time?: string;       // ISO timestamp
  latest_commit_id?: string;         // Commit SHA
  fork_count?: number;
  owner_name?: string;
  license_type?: string | undefined;
}
```

---

### ReadmeExtractedInfo

Structured data extracted from GitHub README files during enrichment.

#### Definition (`server/src/lib/githubEnrichment.ts`)

```typescript
export interface ReadmeExtractedInfo {
  name: string;
  description: string;
  Installation_instructions: string;
  Usage_instructions: string;
  features: string[];
  prerequisites: string[];
}
```

---

### GithubRepoInfo

Repository metadata fetched from GitHub API.

#### Definition (`server/src/lib/githubEnrichment.ts`)

```typescript
export interface GithubRepoInfo {
  stars_count: number;
  latest_update_time: string;       // ISO timestamp of latest commit
  latest_commit_id: string;         // Latest commit SHA
  fork_count: number;
  owner_name: string;
  license_type: string | undefined; // SPDX license ID or undefined
}
```

---

### ServerInfo (Crawler)

Raw server data extracted from the official MCP repository during crawling.

#### Definition (`server/src/data/mcp_servers_crawler.ts`)

```typescript
interface ServerInfo {
  githubUrl: string;
  name?: string;
  type: string;                     // Server type classification
  description?: string;
}
```

---

## Enumerations & Constants

### Server Types

Classification of MCP servers by their origin and maintenance status.

```typescript
const SERVER_TYPES = {
  REFERENCE_SERVER: 'Reference Server',
  OFFICIAL_INTEGRATION: 'Official Integration',
  COMMUNITY_SERVER: 'Community Server',
  FRAMEWORK: 'Framework',
  RESOURCE: 'Resource',
  UNKNOWN: 'Unknown'
};
```

| Type | Description |
|------|-------------|
| Reference Server | Official MCP reference implementations |
| Official Integration | Maintained by the platform/service provider |
| Community Server | Community-contributed servers |
| Framework | Frameworks for building MCP servers |
| Resource | Resource-type servers |

---

### Categories

Predefined categories for organizing MCP servers.

```typescript
export const MCP_SERVER_CATEGORIES = [
  "browser-automation",
  "cloud-platforms",
  "communication",
  "databases",
  "file-systems",
  "knowledge-memory",
  "location-services",
  "monitoring",
  "search",
  "version-control",
  "integrations",
  "other-tools",
  "developer-tools"
];
```

---

### Supported Languages

Languages/locales supported for internationalization.

```typescript
export const LANGUAGES: Record<string, string> = {
  'en': 'English',
  'zh-hans': 'Simplified Chinese',
  'zh-hant': 'Traditional Chinese',
  'ja': 'Japanese',
  'es': 'Spanish',
  'de': 'German'
};
```

```typescript
export type SupportedLanguage = 'en' | 'zh-hans' | 'zh-hant' | 'ja' | 'es' | 'de';
```

---

## API Types

### Search Servers

**Request** (`POST /v1/hub/search_servers`)

```typescript
interface SearchServersRequest {
  categoryKey?: string;
  locale?: string;
  page?: number;
  size?: number;
  search_for?: string;
  isRecommended?: boolean;
  isOfficialIntegration?: boolean;
  isReferenceServer?: boolean;
  isCommunityServer?: boolean;
}
```

**Response**

```typescript
interface SearchServersResponse {
  servers: McpServer[];
  totalItems: number;
  currentPage?: number;
  totalPages?: number;
}
```

---

### Download Server

**Request** (`POST /v1/mcp/download`)

```typescript
interface DownloadRequest {
  mcpId: string;
}
```

**Response**

```typescript
interface DownloadResponse extends McpServer {
  readmeContent: string;
}
```

---

### Submit Server

**Request** (`POST /v1/hub/servers/submit`)

```typescript
interface SubmitServerRequest {
  githubUrl: string;
}
```

**Response**

```typescript
interface SubmitServerResponse {
  message: string;
  server: McpServer;
}
```

---

## Configuration

Application runtime configuration loaded from environment variables.

```typescript
export const config = {
  openai: {
    apiKey: string;
    apiKeyIsValid: boolean;
    baseURL: string;
    modelName: string | undefined;
    modelCharLimit: number;          // Default: 100000
  },
  github: {
    apiToken: string;
    apiTokenIsValid: boolean;
  },
  cache: {
    ttl: number;                     // Default: 3600000 (1 hour)
  },
  server: {
    port: number;                    // Default: 3001
  }
};
```

---

## Data Relationships

```
┌─────────────────────────────────────────────────────────────────┐
│                        McpServer                                 │
│  (Core entity stored in split/*.json files)                      │
├─────────────────────────────────────────────────────────────────┤
│  hubId (UUID) ─────────────────────────────────────────────────┐ │
│  mcpId (e.g., github.com/owner/repo)                           │ │
│  githubUrl ───────────────────┐                                │ │
│  category ────────────────────┼──► MCP_SERVER_CATEGORIES       │ │
│  tags[]                       │                                │ │
│  isReferenceServer ───────────┼──► SERVER_TYPES                │ │
│  isOfficialIntegration ───────┤                                │ │
│  isCommunityServer ───────────┘                                │ │
│  locale ───────────────────────► LANGUAGES (for translations)  │ │
└─────────────────────────────────────────────────────────────────┘ │
                                                                    │
┌─────────────────────────────────────────────────────────────────┐ │
│                    EnrichedMcpServer                             │ │
│  (Runtime, enriched with README data)                            │ │
├─────────────────────────────────────────────────────────────────┤ │
│  extends McpServer                                               │ │
│  + ReadmeExtractedInfo (Installation_instructions, etc.)         │ │
│  + GithubRepoInfo (stars, forks, license)                        │ │
│  + lastEnrichmentTime (cache timestamp)                          │ │
└─────────────────────────────────────────────────────────────────┘ │
                                                                    │
┌─────────────────────────────────────────────────────────────────┘ │
│                     Cache System                                  │
├─────────────────────────────────────────────────────────────────┤
│  mcpServersCache: Record<locale, McpServer[]>                    │
│  lastCacheUpdate: Record<locale, timestamp>                      │
│  CACHE_TTL: 1 hour                                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Storage

| Location | Purpose | Format |
|----------|---------|--------|
| `server/src/data/split/*.json` | Individual server files (English) | McpServer JSON |
| `server/src/data/split/{locale}/*.json` | Localized server files | McpServer JSON |
| `server/src/data/cached/*.json` | Enriched server cache | EnrichedMcpServer JSON |
| `server/src/data/mcp-servers.json` | Combined server list | McpServer[] JSON |
| `server/src/data/mcp_servers_official_list.json` | Crawler output | CrawlerOutput JSON |
| `client/src/locale/*.json` | UI translations | TranslationRecord JSON |

### Processing Log Structure

```typescript
interface ProcessedLog {
  lastProcessed: string;             // ISO timestamp
  processedFiles: string[];          // Array of hubIds
  errors: Record<string, string>;    // Errors by filename
}
```

---

## Data Flow Pipeline

```
1. CRAWLING
   mcp_servers_crawler.ts
   └── Fetches servers from official MCP repository
   └── Outputs to mcp_servers_official_list.json

2. GITHUB ENRICHMENT
   process_githubinfo.ts
   └── Adds stars, forks, commits, license info
   └── Updates split/*.json files

3. CATEGORIZATION
   process_categories.ts
   └── Uses LLM or keyword matching
   └── Updates category field

4. LOCALIZATION
   process_locales.ts
   └── Translates name/description using LLM
   └── Creates locale subdirectories

5. STORAGE
   split/*.json (individual files per server)
   └── Enables efficient caching and partial loading

6. SERVING
   API routes (hub.ts, mcp.ts)
   └── In-memory cache with TTL
   └── Locale-aware responses
```

---

## Validation Rules

| Field | Validation/Logic |
|-------|-----------------|
| `hubId` | UUID v4, auto-generated on submission |
| `mcpId` | Format: `github.com/{author}/{repo}` |
| `githubUrl` | Must start with `https://github.com/` |
| `category` | Must be one of MCP_SERVER_CATEGORIES |
| `licenseType` | SPDX license identifier from GitHub API |
| `requiresApiKey` | Boolean flag for authentication requirements |
| Server type flags | Mutually exclusive (isReferenceServer, isOfficialIntegration, isCommunityServer) |
| `lastEnrichmentTime` | Cache validity timestamp (TTL: 1 hour) |
