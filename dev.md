# MCP Agents Hub - Development Guide

## Project Overview

MCP Agents Hub is an open-source ecosystem for building, discovering, and deploying Model Context Protocol (MCP) servers and clients for enterprise environments.

### Technology Stack
- **Runtime**: Node.js 22.16.0 (managed via nvm)
- **Language**: TypeScript
- **Frontend**: React 18 + Vite + Tailwind CSS + Lucide React
- **Backend**: Express.js + Node.js
- **Testing**: Vitest
- **Build Tools**: Vite, tsx, TypeScript compiler

## Project Structure

```
.
├── client/                 # React frontend application
│   ├── src/
│   │   ├── components/    # Reusable React components
│   │   ├── pages/         # Route pages (Home, Listing, ServerDetails, Submit)
│   │   ├── locale/        # Internationalization files
│   │   └── data/          # Static server data imports
│   └── package.json
├── server/                 # Express.js backend application
│   ├── src/
│   │   ├── data/          # Data processing scripts & storage
│   │   │   └── split/     # Individual JSON files per MCP server
│   │   ├── routes/        # API route handlers (mcp.ts, hub.ts)
│   │   └── lib/           # Core business logic
│   ├── tests/             # Vitest test files
│   └── package.json
├── package.json           # Root workspace configuration
├── .nvmrc                 # Node.js version specification
└── setup.sh               # Automated environment setup script
```

## Getting Started

### Prerequisites
- nvm (Node Version Manager)
- Node.js 22.16.0

### Quick Setup
```bash
./setup.sh
```

### Manual Setup
```bash
nvm use          # Switch to Node.js 22.16.0
npm install      # Install dependencies
```

## Development Commands

### Root Workspace
| Command | Description |
|---------|-------------|
| `npm run dev` | Start both client and server in development mode |
| `npm run build` | Build both client and server for production |
| `npm run lint` | Run ESLint across the entire project |
| `npm run preview` | Preview production build |

### Client-only Commands
| Command | Description |
|---------|-------------|
| `npm run client:dev` | Start Vite dev server |
| `npm run client:build` | Build client for production |

### Server-only Commands
| Command | Description |
|---------|-------------|
| `npm run server:dev` | Start Express server with hot reload |
| `npm run server:build` | Compile TypeScript to JavaScript |

### Testing
| Command | Description |
|---------|-------------|
| `cd server && npm run test` | Run all tests |
| `cd server && npm run test:watch` | Run tests in watch mode |
| `cd server && npm run test:integration` | Run integration tests |
| `cd server && npm run test:mock` | Run mock/unit tests |

## Data Processing Scripts

The server includes scripts for maintaining MCP server data:

| Script | Description |
|--------|-------------|
| `crawl-servers` | Crawl MCP servers from official repository |
| `crawl-servers-postprocess` | Post-process crawled data |
| `clean-duplicates` | Remove duplicate server entries |
| `process_categories` | Organize servers by category |
| `process_locales` | Generate translations |
| `process_githubinfo` | Enrich servers with GitHub metadata |

### Running Background Processes
```bash
cd server && nohup npm run process_locales > process_locales.log 2>&1 &
tail -f process_locales.log
```

## Architecture

### Backend
- **Express.js** server with TypeScript
- **Caching**: In-memory cache with 1-hour TTL, locale-specific storage
- **Data Storage**: Individual JSON files per server under `server/src/data/split/`
- **API**: Locale-aware endpoints with graceful fallbacks

### Frontend
- **React 18** with React Router for client-side routing
- **Tailwind CSS** for styling
- **Context API** for state management (LanguageContext)
- **Static imports** for leveraging Vite bundling

### Data Pipeline
1. **Crawling**: Extract servers from official MCP repository
2. **GitHub Enrichment**: Add stars, forks, commits, license info
3. **Localization**: Generate translated versions (en, de, es, ja, zh-hans, zh-hant)
4. **Categorization**: Organize by category
5. **Split Storage**: Individual files for efficient loading

## Internationalization

Supported locales:
- English (en)
- German (de)
- Spanish (es)
- Japanese (ja)
- Simplified Chinese (zh-hans)
- Traditional Chinese (zh-hant)

Locale files are located in:
- `client/src/locale/` - UI translations
- `server/src/data/` - Category translations

## Environment Variables

Server requires GitHub API token for enrichment processes. Configuration is managed through environment variables.

## Key Files

| File | Purpose |
|------|---------|
| `server/src/server.ts` | Main Express application |
| `server/src/routes/mcp.ts` | MCP server endpoints |
| `server/src/routes/hub.ts` | Hub-specific endpoints |
| `server/src/lib/mcpServers.ts` | MCP server data management |
| `server/src/lib/config.ts` | Environment configuration |
| `client/src/pages/` | Route pages |

## Development Guidelines

1. Always use `nvm use` before working to ensure correct Node.js version
2. Use caching functions in `mcpServers.ts` rather than direct file access
3. Test with multiple locales when modifying server data
4. Run the data processing pipeline when adding new server data

## Community

- MCP: https://github.com/modelcontextprotocol
- MCP Agents Hub: https://github.com/mcp-agents-ai/mcp-agents-hub
