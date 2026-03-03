# Developer Guide

This guide provides comprehensive information for developers who want to contribute to or extend the MCP Agents Hub project.

## Table of Contents

- [Getting Started](#getting-started)
- [Project Architecture](#project-architecture)
- [Development Workflow](#development-workflow)
- [API Reference](#api-reference)
- [Data Management](#data-management)
- [Internationalization](#internationalization)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing Guidelines](#contributing-guidelines)

## Getting Started

### Prerequisites

- **Node.js**: Version 22.16.0 (specified in `.nvmrc`)
- **nvm**: Node Version Manager for managing Node.js versions
- **Docker** (optional): For containerized deployment
- **Git**: For version control

### Environment Setup

#### Quick Setup

Run the automated setup script:

```bash
./setup.sh
```

This script handles nvm installation and dependency setup.

#### Manual Setup

1. Install and use the correct Node.js version:
   ```bash
   nvm install  # Installs version from .nvmrc if not present
   nvm use      # Switches to the correct version
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment file (copy from example if available):
   ```bash
   cp .env.example .env
   ```

### Environment Variables

Create a `.env` file in the project root with the following variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENAI_API_KEY` | OpenAI API key for LLM features | - |
| `OPENAI_BASE_URL` | OpenAI API base URL | `https://ark.cn-beijing.volces.com/api/v3` |
| `MODEL_NAME` | Model name for LLM operations | - |
| `MODEL_CHAR_LIMIT` | Character limit for model input | `100000` |
| `GITHUB_API_TOKEN` | GitHub API token for enrichment | - |
| `CACHE_TTL` | Cache time-to-live in milliseconds | `3600000` (1 hour) |
| `PORT` | Server port | `3001` |
| `BACKEND_API_URL` | Backend URL for client proxy | `http://localhost:3001` |
| `SERVER_PORT` | Vite dev server port | `3000` |

## Project Architecture

### Monorepo Structure

This project uses npm workspaces with two main packages:

```
workspace/
├── client/          # React frontend
├── server/          # Express.js backend
├── package.json     # Root workspace configuration
└── tsconfig.json    # TypeScript configuration
```

### Backend Architecture (server/)

```
server/
├── src/
│   ├── server.ts           # Express app entry point
│   ├── routes/
│   │   ├── mcp.ts          # MCP server endpoints
│   │   └── hub.ts          # Hub-specific endpoints
│   ├── lib/
│   │   ├── config.ts       # Environment configuration
│   │   ├── mcpServers.ts   # Server data management & caching
│   │   ├── githubEnrichment.ts  # GitHub API integration
│   │   ├── llm.ts          # OpenAI integration
│   │   ├── llmTools.ts     # LLM tool definitions
│   │   └── mcpCategories.ts    # Category definitions
│   └── data/
│       ├── split/          # Individual server JSON files
│       ├── mcp-servers.json    # Combined server data
│       └── process_*.ts    # Data processing scripts
└── tests/
    ├── integration/        # Integration tests
    └── mock/               # Unit/mock tests
```

### Frontend Architecture (client/)

```
client/
├── src/
│   ├── main.tsx            # App entry point
│   ├── App.tsx             # Router configuration
│   ├── components/         # Reusable UI components
│   ├── contexts/
│   │   └── LanguageContext.tsx  # i18n provider
│   ├── pages/
│   │   ├── Home.tsx        # Landing page
│   │   ├── Listing.tsx     # Server browsing
│   │   ├── ServerDetails.tsx   # Server details
│   │   └── Submit.tsx      # Server submission
│   ├── locale/             # Translation files
│   ├── data/               # Static data imports
│   └── types.ts            # TypeScript interfaces
├── vite.config.ts          # Vite configuration
├── nginx.conf              # Production nginx config
└── Dockerfile              # Multi-stage Docker build
```

## Development Workflow

### Available Scripts

#### Root Level

| Command | Description |
|---------|-------------|
| `npm run dev` | Start both client and server in development mode |
| `npm run client:dev` | Start only the React client (Vite) |
| `npm run server:dev` | Start only the Express server with hot reload |
| `npm run build` | Build both client and server for production |
| `npm run lint` | Run ESLint across the entire project |
| `npm run preview` | Preview production build of client |

#### Server Scripts

```bash
cd server

npm run dev              # Development mode with hot reload
npm run build            # TypeScript compilation
npm run start            # Run production build

# Testing
npm run test             # Run all tests
npm run test:watch       # Watch mode
npm run test:integration # Integration tests only
npm run test:mock        # Mock/unit tests only

# Data Processing
npm run crawl-servers           # Crawl MCP servers from official repo
npm run crawl-servers-postprocess # Post-process crawled data
npm run clean-duplicates        # Remove duplicate entries
npm run process_categories      # Organize by category
npm run process_locales         # Generate translations
npm run process_githubinfo      # Enrich with GitHub metadata
```

#### Client Scripts

```bash
cd client

npm run dev      # Start Vite development server
npm run build    # Production build
npm run preview  # Preview production build
```

### Development Ports

| Service | Port |
|---------|------|
| Client (Vite) | 3000 |
| Server (Express) | 3001 |

The Vite dev server proxies `/v1/mcp` and `/v1/hub` requests to the backend automatically.

## API Reference

### Base URL

- Development: `http://localhost:3001`
- Production: Configured via environment variables

### MCP Endpoints (`/v1/mcp`)

#### GET `/v1/mcp/servers`

Retrieve all MCP servers.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `locale` | string | `en` | Language code (en, de, es, ja, zh-hans, zh-hant) |

**Response:** Array of server objects (without `hubId`)

#### POST `/v1/mcp/download`

Get detailed server data including README content.

**Request Body:**
```json
{
  "mcpId": "github.com/owner/repo"
}
```

**Response:** Server object with `readmeContent` field

### Hub Endpoints (`/v1/hub`)

#### GET `/v1/hub/servers`

Retrieve all servers with full data including `hubId`.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `locale` | string | `en` | Language code |

#### POST `/v1/hub/search_servers`

Search and filter servers with pagination.

**Request Body:**
```json
{
  "locale": "en",
  "categoryKey": "database",
  "search_for": "postgres",
  "isRecommended": true,
  "isOfficialIntegration": false,
  "isReferenceServer": false,
  "isCommunityServer": false,
  "page": 1,
  "size": 20
}
```

**Response:**
```json
{
  "servers": [...],
  "totalItems": 42,
  "currentPage": 1,
  "totalPages": 3
}
```

#### GET `/v1/hub/servers/:hubId`

Get detailed server information by ID with GitHub README enrichment.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `locale` | string | `en` | Language code |

#### POST `/v1/hub/servers/submit`

Submit a new MCP server.

**Request Body:**
```json
{
  "githubUrl": "https://github.com/owner/repo"
}
```

**Response:** Created server object with `hubId`

#### GET `/v1/hub/server_categories`

Get available server categories.

**Response:** Array of category objects

## Data Management

### Data Pipeline

The server data follows this processing pipeline:

```
1. Crawling        → Extract servers from official MCP repository
2. GitHub Enrichment → Add stars, forks, commits, license info
3. Localization    → Generate translated versions
4. Categorization  → Organize servers by category
5. Split Storage   → Store as individual JSON files
```

### Data Storage

- **Individual Files**: `server/src/data/split/*.json`
- **Combined Data**: `server/src/data/mcp-servers.json`

Each server is stored as a separate JSON file for efficient caching and partial loading.

### Server Data Model

```typescript
interface McpServer {
  mcpId: string;           // Unique identifier (e.g., github.com/owner/repo)
  hubId: string;           // UUID for internal use
  githubUrl: string;       // Repository URL
  name: string;            // Display name
  author: string;          // Repository owner
  description: string;     // Server description
  category: string;        // Category key
  tags: string[];          // Searchable tags
  codiconIcon: string;     // VS Code icon reference
  logoUrl: string;         // Logo image URL
  requiresApiKey: boolean; // API key requirement flag
  isRecommended: boolean;  // Recommendation status
  isOfficialIntegration: boolean;
  isReferenceServer: boolean;
  isCommunityServer: boolean;
  githubStars: number;     // Star count
  downloadCount: number;   // Download statistics
  createdAt: string;       // ISO timestamp
  updatedAt: string;       // ISO timestamp
}
```

### Caching Strategy

- **In-memory cache** with configurable TTL (default: 1 hour)
- **Locale-aware storage**: Separate cache per language
- **Automatic refresh**: Cache refreshes on expiry
- **Force refresh**: Available via `forceRefreshCache()` function

## Internationalization

### Supported Languages

| Code | Language |
|------|----------|
| `en` | English |
| `de` | German |
| `es` | Spanish |
| `ja` | Japanese |
| `zh-hans` | Simplified Chinese |
| `zh-hant` | Traditional Chinese |

### Translation Files

- **UI Translations**: `client/src/locale/*.json`
- **Category Translations**: `server/src/data/category-*.json`
- **Server Translations**: Auto-generated per server in locale subdirectories

### Adding a New Language

1. Add locale code to `LANGUAGES` in `server/src/lib/llmTools.ts`
2. Create translation file in `client/src/locale/{code}.json`
3. Add category translations in `server/src/data/category-{code}.json`
4. Run `npm run process_locales` to generate server translations

## Testing

### Test Structure

```
server/tests/
├── integration/    # Tests requiring external APIs
│   └── *.test.ts
└── mock/           # Isolated unit tests
    └── *.test.ts
```

### Running Tests

```bash
cd server

# Run all tests
npm run test

# Run specific test types
npm run test:integration
npm run test:mock

# Watch mode for development
npm run test:watch
```

### Writing Tests

Tests use Vitest framework. Example:

```typescript
import { describe, it, expect } from 'vitest';

describe('MyModule', () => {
  it('should work correctly', () => {
    expect(true).toBe(true);
  });
});
```

## Deployment

### Docker Deployment

#### Using Docker Compose

```bash
docker-compose up -d
```

This starts both services:
- **Server**: Port 3001
- **Client**: Ports 80 and 443 (with SSL)

#### Manual Docker Build

```bash
# Build server
docker build -t mcp-hub-server ./server

# Build client
docker build -t mcp-hub-client ./client
```

### GitHub Container Registry

Images are automatically built and pushed via GitHub Actions:

- `ghcr.io/mcp-agents-ai/mcp-agents-hub-server:latest`
- `ghcr.io/mcp-agents-ai/mcp-agents-hub-client:latest`

### Production Configuration

1. Set environment variables in `.env` file
2. Configure SSL certificates (mounted to `/etc/nginx/ssl`)
3. Set up volume mounts for data persistence:
   - `./server/src/data/split:/app/dist/data/split/`
   - `./data/cached:/app/dist/data/cached/`

## Contributing Guidelines

### Code Style

- Use TypeScript for all new code
- Follow existing ESLint configuration
- Use meaningful variable and function names
- Add JSDoc comments for public functions

### Commit Messages

Follow conventional commit format:

```
type(scope): description

[optional body]

[optional footer]
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

### Pull Request Process

1. Fork the repository
2. Create a feature branch
3. Make changes and add tests
4. Ensure all tests pass
5. Update documentation if needed
6. Submit pull request

### Branch Naming

- Feature: `feature/description`
- Fix: `fix/description`
- Documentation: `docs/description`

## Troubleshooting

### Common Issues

#### Node Version Mismatch

```bash
nvm use  # Switch to correct version
```

#### Port Already in Use

Check what's using the port:
```bash
lsof -i :3001  # Check port 3001
```

#### Cache Issues

Clear the in-memory cache by restarting the server, or call `forceRefreshCache()`.

#### Missing Dependencies

```bash
rm -rf node_modules
npm install
```

### Debugging

Enable debug logging by setting:
```bash
DEBUG=* npm run dev
```

### Getting Help

- MCP: [https://github.com/modelcontextprotocol](https://github.com/modelcontextprotocol)
- MCP Agents Hub: [https://github.com/mcp-agents-ai/mcp-agents-hub](https://github.com/mcp-agents-ai/mcp-agents-hub)
