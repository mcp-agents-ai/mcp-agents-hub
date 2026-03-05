# Data Transmission Report: MCP Agents Hub

**Generated:** March 5, 2026
**Project:** MCP Agents Hub (mcp-marketplace)

---

## Executive Summary

This report details all data that leaves the local execution environment when running the MCP Agents Hub application. The application transmits data to three primary external services: **Azure Application Insights** (telemetry/analytics), **OpenAI-compatible APIs** (content processing), and **GitHub API** (repository metadata).

---

## 1. Azure Application Insights (User Telemetry)

### Destination
- **Ingestion Endpoint:** `https://southeastasia-1.in.applicationinsights.azure.com/`
- **Live Diagnostics:** `https://southeastasia.livediagnostics.monitor.azure.com/`
- **Region:** Southeast Asia (Azure)
- **Application ID:** `14d289ca-9e97-4472-8636-8525948fce3c`

### Data Transmitted
| Data Type | Description |
|-----------|-------------|
| Page views | URLs and navigation paths visited |
| User sessions | Session IDs and duration |
| Browser information | User agent, browser version, OS |
| Device information | Screen resolution, device type |
| Performance metrics | Page load times, network latency |
| Errors and exceptions | JavaScript errors, stack traces |
| Navigation history | React Router history (via plugin) |

### Code Location
- `client/src/main.tsx` - Application Insights initialization

### Configuration
The connection string is **hardcoded** in the client source code:
```
InstrumentationKey=43485096-3cae-436a-84ea-6f813c67476b
```

---

## 2. OpenAI-Compatible API (Content Processing)

### Destination
- **Default Base URL:** `https://ark.cn-beijing.volces.com/api/v3` (Volces/ByteDance)
- **Configurable via:** `OPENAI_BASE_URL` environment variable

### Data Transmitted
| Data Type | Purpose |
|-----------|---------|
| README content | Extracting structured information from repository READMEs |
| Server names | Translation to multiple languages |
| Server descriptions | Translation and categorization |
| Repository metadata | Category determination and feature extraction |

### Code Location
- `server/src/lib/llm.ts` - LLM API client

### Configuration
Required environment variables:
```
OPENAI_API_KEY={{your_api_key_here}}
OPENAI_BASE_URL={{your_base_url_here}}
MODEL_NAME={{your_model_name_here}}
```

---

## 3. GitHub API (Repository Metadata)

### Destination
- **Primary API:** `https://api.github.com/`
- **Raw Content:** `https://raw.githubusercontent.com/`

### Data Transmitted
Only **outbound requests** are made. No user data is sent to GitHub.

| Request Type | Endpoint | Data Sent |
|--------------|----------|-----------|
| Repository info | `/repos/{owner}/{repo}` | None (URL parameters only) |
| Commit history | `/repos/{owner}/{repo}/commits` | None (URL parameters only) |
| README content | `/raw/...` | None (URL parameters only) |

### Code Location
- `server/src/lib/githubEnrichment.ts` - GitHub API client
- `server/src/data/mcp_servers_crawler.ts` - MCP servers list crawler

### Configuration
Optional authentication:
```
GITHUB_API_TOKEN={{your_token_here}}
```

---

## 4. Backend API (Internal/Local)

The frontend makes API calls to the backend server. These are **internal** to the execution environment when running locally.

| Endpoint | Method | Data Sent |
|----------|--------|-----------|
| `/v1/hub/servers` | GET | None |
| `/v1/hub/search_servers` | POST | Search filters, pagination params |
| `/v1/hub/servers/:hubId` | GET | None |
| `/v1/hub/servers/submit` | POST | GitHub URL, server metadata |
| `/v1/hub/server_categories` | GET | None |
| `/v1/mcp/servers` | GET | None |
| `/v1/mcp/download` | POST | Server identifier |

---

## 5. Data Flow Summary

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        LOCAL EXECUTION ENVIRONMENT                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────┐     ┌──────────────┐     ┌────────────────────────────┐ │
│  │   Frontend   │────▶│   Backend    │────▶│   External Services        │ │
│  │   (React)    │     │   (Express)  │     │                            │ │
│  └──────┬───────┘     └──────┬───────┘     │  • GitHub API              │ │
│         │                    │             │  • OpenAI-compatible API   │ │
│         │                    │             │                            │ │
│         ▼                    │             └────────────────────────────┘ │
│  ┌──────────────────┐        │                                            │
│  │ Azure App        │        │                                            │
│  │ Insights         │        │                                            │
│  └──────────────────┘        │                                            │
│                              │                                            │
└──────────────────────────────┼────────────────────────────────────────────┘
                               │
                               ▼
                    EXTERNAL DATA TRANSMISSION
```

---

## 6. External Data Transmission Checklist

| Data Type | Leaves Environment? | Destination | User Controllable? |
|-----------|---------------------|-------------|-------------------|
| Page views & navigation | ✅ Yes | Azure Application Insights | No (hardcoded) |
| Browser/device info | ✅ Yes | Azure Application Insights | No (hardcoded) |
| Performance metrics | ✅ Yes | Azure Application Insights | No (hardcoded) |
| Error logs | ✅ Yes | Azure Application Insights | No (hardcoded) |
| Repository READMEs | ✅ Yes | OpenAI-compatible API | Yes (via env vars) |
| Server descriptions | ✅ Yes | OpenAI-compatible API | Yes (via env vars) |
| GitHub repo requests | ✅ Yes | GitHub API | Yes (token optional) |
| Search queries | ❌ No | Backend (local) | N/A |
| Server submissions | ❌ No* | Backend (local) | N/A |

*Server submissions are stored locally; if the backend is deployed externally, this data would be transmitted.

---

## 7. Security Considerations

1. **Hardcoded Telemetry Key:** The Application Insights instrumentation key is hardcoded in `client/src/main.tsx`. This cannot be disabled without modifying the source code.

2. **External LLM Processing:** README content from GitHub repositories is sent to external LLM APIs for processing. The default endpoint is Volces/ByteDance in Beijing.

3. **No User Consent Mechanism:** Telemetry is sent automatically without user consent or opt-out capability.

4. **API Key Exposure Risk:** API keys are configured via environment variables. The server logs the existence of keys (first 3 characters) for debugging purposes.

---

## 8. Recommendations

1. **Move telemetry configuration to environment variables** to allow users to disable or configure telemetry endpoints.

2. **Implement user consent** for analytics collection.

3. **Document external data flows** in user-facing documentation.

4. **Consider local-only mode** for users who need complete data isolation.

---

## References

| File | Purpose |
|------|---------|
| `client/src/main.tsx` | Application Insights initialization |
| `server/src/lib/llm.ts` | OpenAI API client for translations |
| `server/src/lib/githubEnrichment.ts` | GitHub API integration |
| `server/src/lib/config.ts` | Environment configuration |
| `client/.env.example` | Frontend environment template |
| `server/.env.example` | Backend environment template |
