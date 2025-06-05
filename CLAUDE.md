# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

### Environment Setup
- **Node Version Management**: This project requires Node.js 22.16.0 (specified in `.nvmrc`)
  - Always run `nvm use` when switching to this project
  - Use `./setup.sh` for automated environment setup including nvm and dependencies
  - Alternative: manually run `nvm use` followed by `npm ci`

### Development Commands
- `npm run dev` - Start both client and server in development mode (uses concurrently)
- `npm run client:dev` - Start only the React client (Vite dev server)
- `npm run server:dev` - Start only the Express server with tsx watch mode
- `npm run build` - Build both client and server for production
- `npm run lint` - Run ESLint across the entire project
- `npm run preview` - Preview production build of client

### Testing
- `cd server && npm run test` - Run all tests with Vitest
- `cd server && npm run test:watch` - Run tests in watch mode
- `cd server && npm run test:integration` - Run integration tests only
- `cd server && npm run test:mock` - Run mock/unit tests only

### Data Processing Scripts (Server)
- `cd server && npm run crawl-servers` - Crawl MCP servers from the main repository
- `cd server && npm run crawl-servers-postprocess` - Post-process crawled server data
- `cd server && npm run clean-duplicates` - Remove duplicate entries
- `cd server && npm run process_categories` - Process and organize category data
- `cd server && npm run process_locales` - Process internationalization data
- `cd server && npm run process_githubinfo` - Enrich servers with GitHub metadata

## Architecture Overview

### Project Structure
This is a **monorepo workspace** with two main packages:
- **client/**: React frontend (Vite + TypeScript + Tailwind CSS)
- **server/**: Express.js backend (TypeScript + Node.js)

### Backend Architecture (server/)

#### Core Server Files
- **server.ts**: Main Express application with route registration
- **routes/**: API route handlers
  - `mcp.ts`: MCP server-related endpoints
  - `hub.ts`: Hub-specific endpoints
- **lib/**: Core business logic
  - `mcpServers.ts`: MCP server data management with locale-aware caching
  - `config.ts`: Environment configuration
  - `githubEnrichment.ts`: GitHub API integration for server metadata
  - `llm.ts` & `llmTools.ts`: LLM integration for data processing

#### Data Management
- **src/data/split/**: Individual JSON files for each MCP server (enables efficient caching)
- **Caching Strategy**: In-memory cache with TTL (1 hour) and locale-specific storage
- **Data Processing Pipeline**: Crawling → GitHub enrichment → Localization → Split storage

#### Key Data Structures
- **McpServer Interface**: Primary server data model with GitHub metadata
- **Locale Support**: Multi-language support (en, de, es, ja, zh-hans, zh-hant)
- **Server Types**: Reference Server, Official Integration, Community Server, Framework, Resource

### Frontend Architecture (client/)

#### Core Structure
- **React Router**: Client-side routing with pages in `src/pages/`
- **Context API**: `LanguageContext` for internationalization
- **Component Structure**: Reusable components in `src/components/`
- **Data Management**: Static imports from `src/data/servers.ts`

#### Key Pages
- **Home**: Main landing with server discovery
- **Listing**: Categorized server browsing with filtering
- **ServerDetails**: Detailed server information (uses hubId routing)
- **Submit**: Server submission form

### Data Flow

#### Server Data Pipeline
1. **Crawling**: `mcp_servers_crawler.ts` extracts servers from official MCP repository
2. **GitHub Enrichment**: `process_githubinfo.ts` adds stars, forks, commits, license info
3. **Localization**: `process_locales.ts` generates translated versions
4. **Categorization**: `process_categories.ts` organizes servers by category
5. **Split Storage**: Individual JSON files for efficient loading

#### API Layer
- **Locale-aware endpoints**: All server endpoints support locale parameter
- **Caching**: Server-side caching with automatic TTL refresh
- **Error Handling**: Graceful fallbacks to default locale

## Development Guidelines

### Working with MCP Server Data
- Server data is split into individual files under `server/src/data/split/`
- Always use the caching functions in `mcpServers.ts` rather than direct file access
- When adding new server data, run the processing pipeline to maintain consistency
- GitHub enrichment requires valid GitHub API access

### Internationalization
- Locale files are in `client/src/locale/` and category translations in `category-*.json`
- Server data supports locale-specific descriptions and content
- Always test with multiple locales when modifying server data

### Testing Strategy
- Integration tests verify GitHub API functionality and data processing
- Mock tests for isolated unit testing
- Use `vitest` for all server-side testing

### Environment Variables
- Server requires GitHub API token for enrichment processes
- Configuration managed through `config.ts` with environment variable support
- Production deployment uses Docker with external environment files

### Performance Considerations
- MCP server data uses in-memory caching to avoid file system overhead
- Individual server files enable partial loading strategies
- Client uses static imports for core server data to leverage Vite bundling