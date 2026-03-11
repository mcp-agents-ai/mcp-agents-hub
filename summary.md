# MCP Agents Hub - Codebase Summary

## Project Overview

**MCP Agents Hub** is an open-source ecosystem for building, discovering, and deploying Model Context Protocol (MCP) servers and clients for enterprise environments. It serves as a central marketplace where organizations can discover, share, and manage MCP resources.

### What is MCP?
The Model Context Protocol (MCP) is an open standard that enables developers to build secure, two-way connections between their data sources and AI-powered tools. The architecture allows AI systems to maintain context as they move between different tools and datasets.

---

## Project Structure

This is a **monorepo workspace** containing two main packages:

```
workspace/
├── client/                 # React frontend application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── contexts/      # React Context (LanguageContext)
│   │   ├── data/          # Data fetching utilities
│   │   ├── locale/        # Internationalization files (6 languages)
│   │   ├── pages/         # Page components (Home, Listing, ServerDetails, etc.)
│   │   ├── types.ts       # TypeScript interfaces
│   │   └── App.tsx        # Main application with routing
│   ├── package.json
│   ├── vite.config.ts
│   └── Dockerfile
├── server/                 # Express.js backend application
│   ├── src/
│   │   ├── data/          # Data files and processing scripts
│   │   │   ├── split/     # 1,837 individual JSON files (one per server)
│   │   │   ├── mcp_servers_crawler.ts
│   │   │   ├── process_githubinfo.ts
│   │   │   ├── process_locales.ts
│   │   │   └── process_categories.ts
│   │   ├── lib/           # Core business logic
│   │   │   ├── mcpServers.ts      # Server data management with caching
│   │   │   ├── githubEnrichment.ts # GitHub API integration
│   │   │   ├── llm.ts             # LLM integration
│   │   │   ├── llmTools.ts        # Translation and categorization
│   │   │   ├── mcpCategories.ts   # Category definitions
│   │   │   └── config.ts          # Environment configuration
│   │   ├── routes/        # API route handlers
│   │   │   ├── mcp.ts     # MCP server endpoints
│   │   │   └── hub.ts     # Hub-specific endpoints
│   │   └── server.ts      # Main Express application
│   ├── tests/
│   │   ├── integration/   # Integration tests
│   │   └── mock/          # Unit/mock tests
│   ├── package.json
│   ├── vitest.config.ts
│   └── Dockerfile
├── .github/
│   └── workflows/
│       └── docker-build.yml  # CI/CD pipeline
├── package.json            # Root workspace config
├── docker-compose.yml      # Docker orchestration
├── tsconfig.json           # TypeScript configuration
├── README.md
└── CLAUDE.md               # Development guidelines
```

---

## Technology Stack

### Frontend (Client)
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.3.1 | UI framework |
| React Router DOM | 6.22.3 | Client-side routing |
| Vite | 5.4.2 | Build tool and dev server |
| TypeScript | 5.5.3 | Type safety |
| Tailwind CSS | 3.4.1 | Styling |
| Lucide React | 0.344.0 | Icon library |
| Application Insights | 18.3.6 | Azure monitoring |

### Backend (Server)
| Technology | Version | Purpose |
|------------|---------|---------|
| Express.js | 4.21.2 | Web framework |
| TypeScript | 5.5.3 | Type safety |
| tsx | 4.19.3 | TypeScript execution |
| Axios | 1.6.0 | HTTP client |
| OpenAI SDK | 4.20.0 | LLM integration |
| Vitest | 1.5.3 | Testing framework |
| UUID | 11.1.0 | Unique ID generation |

### Infrastructure
| Technology | Purpose |
|------------|---------|
| Docker | Containerization |
| Docker Compose | Service orchestration |
| GitHub Actions | CI/CD pipeline |
| NVM | Node.js version management |

---

## Core Features

### 1. Server Discovery & Browsing
- Browse 1,837+ MCP servers across 13 categories
- Filter by:
  - Category (browser-automation, databases, cloud-platforms, etc.)
  - Server type (Official Integration, Reference Server, Community Server)
  - Recommendation status
- Keyword search across name, description, author, and tags
- Pagination support

### 2. Internationalization (i18n)
- **Supported Languages**: English, Simplified Chinese, Traditional Chinese, Japanese, Spanish, German
- Automatic browser language detection
- Translated server descriptions and UI elements
- Locale-specific category translations

### 3. Server Submission
- One-click GitHub repository submission
- AI-powered information extraction from README
- Automatic category determination using LLM
- Automatic translation to all supported languages

### 4. GitHub Integration
- Repository metadata enrichment (stars, forks, commits)
- README content fetching and parsing
- License information extraction
- Commit history tracking

---

## API Endpoints

### Hub API (`/v1/hub`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/servers` | GET | Get all servers (with locale support) |
| `/servers/:hubId` | GET | Get specific server details |
| `/servers/submit` | POST | Submit new MCP server |
| `/search_servers` | POST | Search/filter servers |
| `/server_categories` | GET | Get available categories |

### MCP API (`/v1/mcp`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/servers` | GET | Get servers (cleaned data without hubId) |
| `/download` | POST | Get server with README content |

### Query Parameters

**Locale Support**: Most endpoints accept `?locale=en|de|es|ja|zh-hans|zh-hant`

**Search Parameters** (`POST /search_servers`):
- `categoryKey`: Filter by category
- `locale`: Language preference
- `page` / `size`: Pagination
- `search_for`: Keyword search
- `isRecommended`, `isOfficialIntegration`, `isReferenceServer`, `isCommunityServer`: Boolean filters

---

## Data Management

### Data Pipeline
```
1. Crawling (mcp_servers_crawler.ts)
   └── Extracts servers from official MCP repository README
   
2. GitHub Enrichment (process_githubinfo.ts)
   └── Adds stars, forks, commits, license info
   
3. Localization (process_locales.ts)
   └── Translates server descriptions using LLM
   
4. Categorization (process_categories.ts)
   └── Organizes servers by category
   
5. Split Storage
   └── Individual JSON files for efficient loading
```

### Data Storage Structure
- **Split files**: `server/src/data/split/*.json` (1,837 files)
- **Locale-specific**: `split/zh-hans/`, `split/ja/`, etc.
- **Caching**: In-memory cache with 1-hour TTL

### Server Data Model
```typescript
interface McpServer {
  mcpId: string;              // GitHub repository ID
  hubId: string;              // Unique marketplace ID
  githubUrl: string;          // Repository URL
  name: string;
  author: string;
  description: string;
  category: string;
  tags: string[];
  
  // Metadata
  githubStars: number;
  githubForks: number;
  licenseType: string;
  githubLatestCommit: string;
  
  // Classification flags
  isRecommended: boolean;
  isOfficialIntegration: boolean;
  isReferenceServer: boolean;
  isCommunityServer: boolean;
  requiresApiKey: boolean;
  
  // Enriched data
  Installation_instructions?: string;
  Usage_instructions?: string;
  features?: string[];
  prerequisites?: string[];
}
```

---

## Categories

The marketplace organizes servers into 13 categories:

1. **browser-automation** - Web scraping and automation
2. **cloud-platforms** - Cloud service integrations
3. **communication** - Messaging and collaboration tools
4. **databases** - Database connectors
5. **file-systems** - File storage and management
6. **knowledge-memory** - Knowledge base integrations
7. **location-services** - Maps and location APIs
8. **monitoring** - System monitoring tools
9. **search** - Search engine integrations
10. **version-control** - Git and version control
11. **integrations** - Third-party integrations
12. **other-tools** - Miscellaneous tools
13. **developer-tools** - Development utilities

---

## Key Components

### Frontend Components

| Component | Purpose |
|-----------|---------|
| `Home` | Landing page with featured servers |
| `Listing` | Server browser with filtering |
| `ServerDetails` | Detailed server information page |
| `Submit` | Server submission form |
| `ServerList` | Reusable server list component |
| `ServerCard` | Individual server card |
| `SearchBar` | Keyword search input |
| `Header` / `Footer` | Navigation and site info |
| `LanguageContext` | i18n state management |

### Backend Libraries

| Library | Purpose |
|---------|---------|
| `mcpServers.ts` | Server data loading and caching |
| `githubEnrichment.ts` | GitHub API integration |
| `llm.ts` | OpenAI/LLM integration |
| `llmTools.ts` | Translation and categorization utilities |
| `config.ts` | Environment configuration |

---

## Development Scripts

### Root Level
```bash
npm run dev           # Start both client and server
npm run build         # Build for production
npm run lint          # Run ESLint
```

### Server Scripts
```bash
npm run dev           # Start server with hot reload
npm run build         # Compile TypeScript
npm run test          # Run all tests
npm run test:integration  # Run integration tests
npm run test:mock     # Run unit tests
npm run crawl-servers # Crawl MCP servers from GitHub
npm run process_githubinfo  # Enrich with GitHub data
npm run process_locales     # Generate translations
npm run process_categories  # Process categories
```

---

## Environment Configuration

### Required Environment Variables

```env
# Server Configuration
PORT=3001

# OpenAI API (for translations and categorization)
OPENAI_API_KEY=your-api-key
OPENAI_BASE_URL=https://api.openai.com/v1
MODEL_NAME=gpt-4
MODEL_CHAR_LIMIT=100000

# GitHub API (for enrichment)
GITHUB_API_TOKEN=your-github-token

# Cache Configuration
CACHE_TTL=3600000  # 1 hour in milliseconds
```

---

## Testing

### Test Structure
- **Integration Tests**: `tests/integration/`
  - `githubEnrichment.integration.test.ts`
  - `mcp-download.test.ts`
- **Mock/Unit Tests**: `tests/mock/`
  - `github-url-conversion.test.ts`
  - `githubEnrichment.test.ts`

### Running Tests
```bash
cd server
npm run test              # All tests
npm run test:watch        # Watch mode
npm run test:integration  # Integration only
npm run test:mock         # Unit tests only
```

---

## Deployment

### Docker Deployment
The project includes Docker configuration for containerized deployment:

```bash
# Build and run with Docker Compose
docker-compose up -d
```

### Services
1. **server**: Node.js backend (port 3001)
2. **client**: Nginx serving React build (ports 80, 443)

### CI/CD Pipeline
- Triggered on push to `main` branch
- Builds Docker images for both client and server
- Pushes to GitHub Container Registry (`ghcr.io`)

---

## Key Design Patterns

### 1. Locale-Aware Caching
- Separate cache entries per locale
- 1-hour TTL with automatic refresh
- Fallback to default locale (English)

### 2. Split Data Storage
- Individual JSON files per server
- Enables partial loading strategies
- Improves caching efficiency

### 3. API Proxy Configuration
- Vite dev server proxies `/v1/*` to backend
- Enables seamless local development

### 4. Context-Based State Management
- `LanguageContext` for i18n
- Avoids prop drilling for language state

---

## Project Statistics

- **Total MCP Servers**: 1,837
- **Supported Languages**: 6
- **Categories**: 13
- **API Endpoints**: 7
- **React Components**: 19 TypeScript/TSX files
- **Backend Libraries**: 6 core modules

---

## License

Apache License 2.0

---

## Related Links

- **MCP Specification**: https://github.com/modelcontextprotocol
- **MCP Agents Hub**: https://github.com/mcp-agents-ai/mcp-agents-hub
