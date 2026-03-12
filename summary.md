# MCP Agents Hub - 代码库概览

## 1. 项目简介

**MCP Agents Hub**（又名 "mcp-marketplace"）是一个开源生态系统，用于构建、发现和部署企业环境中的 **Model Context Protocol (MCP)** 服务器和客户端。MCP 是一个开放标准，支持数据源与 AI 工具之间的安全双向连接。

## 2. 项目结构

本项目是一个 **monorepo 工作空间**，目录结构如下：

```
/workspace/
├── client/                    # React 前端 (Vite + TypeScript)
│   ├── src/
│   │   ├── components/        # 可复用的 UI 组件
│   │   ├── contexts/          # React 上下文 (LanguageContext)
│   │   ├── data/              # 数据获取工具
│   │   ├── locale/            # 国际化文件 (6种语言)
│   │   ├── pages/             # 页面组件
│   │   └── types.ts           # TypeScript 接口定义
│   └── package.json
│
├── server/                    # Express.js 后端 (TypeScript + Node.js)
│   ├── src/
│   │   ├── data/              # 数据处理脚本和存储
│   │   │   └── split/         # 每个 MCP 服务器的独立 JSON 文件
│   │   ├── lib/               # 核心业务逻辑库
│   │   └── routes/            # API 路由处理器
│   ├── tests/                 # 测试文件 (集成测试 & Mock)
│   └── package.json
│
├── .github/workflows/         # GitHub Actions CI/CD
├── docker-compose.yml         # Docker 部署配置
├── package.json               # 根 package.json (工作空间)
├── tsconfig.json              # TypeScript 配置
└── README.md                  # 项目文档
```

## 3. 主要技术和框架

| 层级 | 技术 |
|------|------|
| **前端** | React 18, React Router, Vite, Tailwind CSS, Lucide React (图标) |
| **后端** | Express.js, Node.js, TypeScript |
| **数据存储** | 基于文件的 JSON 存储 (每个服务器独立文件) |
| **AI/LLM** | OpenAI API (用于翻译、README 提取、分类) |
| **API 集成** | GitHub API (stars, forks, commits), Axios |
| **测试** | Vitest |
| **部署** | Docker, GitHub Container Registry |
| **监控** | Azure Application Insights |
| **Node.js 版本** | 22.16.0 |

## 4. 核心源文件说明

### 后端核心文件

| 文件 | 用途 |
|------|------|
| `/server/src/server.ts` | Express 应用主入口，设置路由 |
| `/server/src/routes/mcp.ts` | MCP 服务器端点 (`/v1/mcp/*`) - 基础服务器列表 |
| `/server/src/routes/hub.ts` | Hub 端点 (`/v1/hub/*`) - 完整功能 API，含搜索、提交 |
| `/server/src/lib/mcpServers.ts` | MCP 服务器数据管理，支持语言缓存 |
| `/server/src/lib/config.ts` | 环境配置 (OpenAI, GitHub API tokens) |
| `/server/src/lib/githubEnrichment.ts` | GitHub API 集成，获取元数据 (stars, forks, README) |
| `/server/src/lib/llm.ts` | OpenAI/LLM 集成，文本处理 |
| `/server/src/lib/llmTools.ts` | 翻译和分类工具 |
| `/server/src/lib/mcpCategories.ts` | 服务器类别定义 |

### 前端核心文件

| 文件 | 用途 |
|------|------|
| `/client/src/App.tsx` | 主 React 应用，路由配置 |
| `/client/src/main.tsx` | 入口文件，集成 Azure Application Insights |
| `/client/src/contexts/LanguageContext.tsx` | 国际化上下文 (6种语言) |
| `/client/src/pages/Home.tsx` | 首页，服务器发现 |
| `/client/src/pages/Listing.tsx` | 分类服务器浏览，支持过滤 |
| `/client/src/pages/ServerDetails.tsx` | 服务器详情页 |
| `/client/src/pages/Submit.tsx` | 服务器提交表单 |
| `/client/src/components/ServerList.tsx` | 分页服务器列表，支持搜索 |
| `/client/src/components/ServerCard.tsx` | 单个服务器卡片组件 |
| `/client/src/data/servers.ts` | API 客户端，获取服务器数据 |

## 5. 配置文件

| 文件 | 用途 |
|------|------|
| `/package.json` | 根工作空间配置，npm 脚本 |
| `/tsconfig.json` | TypeScript 项目引用 |
| `/docker-compose.yml` | Docker 部署配置 (server + client 容器) |
| `/.nvmrc` | Node.js 版本规范 (22.16.0) |
| `/eslint.config.js` | ESLint 配置 (TypeScript/React) |
| `/.github/workflows/docker-build.yml` | CI/CD 管道，Docker 镜像构建 |

## 6. 入口点和主要功能

### 服务端入口点
- **文件**: `/server/src/server.ts`
- **端口**: 3001 (可通过 PORT 环境变量配置)
- **API 路由**:
  - `GET /v1/mcp/servers` - 获取所有服务器 (不含 hubId)
  - `GET /v1/hub/servers` - 获取所有服务器 (含 hubId)
  - `POST /v1/hub/search_servers` - 搜索/过滤服务器，支持分页
  - `GET /v1/hub/servers/:hubId` - 获取特定服务器详情
  - `POST /v1/hub/servers/submit` - 提交新的 MCP 服务器
  - `GET /v1/hub/server_categories` - 获取可用分类
  - `POST /v1/mcp/download` - 获取服务器数据及 README 内容

### 客户端入口点
- **文件**: `/client/src/main.tsx`
- **路由**:
  - `/` - 首页 (服务器发现)
  - `/listing/:categoryKey` - 分类服务器列表
  - `/server/:hubId` - 服务器详情页
  - `/submit` - 服务器提交表单
  - `/docs` - 文档页面
  - `/about` - 关于页面

## 7. 主要功能和特性

### 数据处理管道
1. **爬取** (`mcp_servers_crawler.ts`): 从官方 GitHub 仓库提取 MCP 服务器
2. **GitHub 信息增强** (`process_githubinfo.ts`): 添加 stars、forks、提交信息、许可证
3. **本地化** (`process_locales.ts`): 生成 6 种语言的翻译
4. **分类** (`process_categories.ts`): 按类别组织服务器
5. **分片存储**: 每个服务器独立 JSON 文件，提高缓存效率

### 支持的语言
- English (en)
- 简体中文 (zh-hans)
- 繁体中文 (zh-hant)
- 日本語 (ja)
- Español (es)
- Deutsch (de)

### 服务器分类
- browser-automation (浏览器自动化)
- cloud-platforms (云平台)
- communication (通讯)
- databases (数据库)
- file-systems (文件系统)
- knowledge-memory (知识记忆)
- location-services (位置服务)
- monitoring (监控)
- search (搜索)
- version-control (版本控制)
- integrations (集成)
- other-tools (其他工具)
- developer-tools (开发者工具)

### MCP 服务器类型
- Reference Server (参考服务器)
- Official Integration (官方集成)
- Community Server (社区服务器)
- Framework (框架)
- Resource (资源)

## 8. 数据模型

**MCPServer 接口** (来自 `/client/src/types.ts`):

```typescript
interface MCPServer {
  mcpId: string;           // GitHub 仓库标识
  githubUrl: string;       // 仓库 URL
  name: string;            // 服务器名称
  author: string;          // 作者/组织
  description: string;     // 描述
  category: string;        // 分类键
  tags: string[];          // 标签 (用于过滤)
  requiresApiKey: boolean; // 是否需要 API key
  isRecommended: boolean;  // 推荐状态
  isOfficialIntegration?: boolean;
  isReferenceServer?: boolean;
  isCommunityServer?: boolean;
  githubStars: number;     // Star 数量
  downloadCount: number;   // 下载次数
  hubId?: string;          // 路由唯一标识
  // ... 其他增强数据字段
}
```

## 9. 缓存策略

- **内存缓存**，TTL 为 1 小时
- **语言特定缓存** (每种语言独立缓存)
- **基于文件的数据存储**，位于 `/server/src/data/split/`
- **README 缓存** 用于增强服务器数据

## 10. 部署

- **Docker 部署**，客户端和服务端分离容器
- 镜像发布至 GitHub Container Registry (`ghcr.io`)
- CI/CD 通过 GitHub Actions，推送到 main 分支触发
- 支持企业安全的本地化部署

## 11. 开发命令

```bash
# 环境设置
./setup.sh                 # 自动化环境配置
nvm use                    # 切换到正确的 Node 版本
npm ci                     # 安装依赖

# 开发
npm run dev                # 同时启动客户端和服务端
npm run client:dev         # 仅启动客户端
npm run server:dev         # 仅启动服务端

# 构建
npm run build              # 生产环境构建

# 测试 (在 server 目录下)
npm run test               # 运行所有测试
npm run test:integration   # 集成测试
npm run test:mock          # Mock/单元测试

# 数据处理 (在 server 目录下)
npm run crawl-servers      # 从 GitHub 爬取 MCP 服务器
npm run process_githubinfo # 增强 GitHub 元数据
npm run process_locales    # 生成翻译
```

## 12. 项目特色

- **企业就绪**: 支持本地部署，满足企业安全需求
- **全栈 TypeScript**: 前后端类型安全
- **AI 驱动**: 使用 LLM 进行自动翻译和分类
- **完整国际化**: 支持 6 种语言
- **现代前端**: React 18 + Vite + Tailwind CSS
- **可扩展架构**: 分片存储支持大量服务器数据
