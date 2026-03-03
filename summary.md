# MCP Agents Hub - 项目概述

## 项目简介

**MCP Agents Hub**（原名 MCP Marketplace）是一个开源的 Model Context Protocol (MCP) 生态系统平台，用于构建、发现和部署 MCP 服务器和客户端，主要面向企业环境。

- **仓库地址**: https://github.com/mcp-agents-ai/mcp-agents-hub
- **许可证**: Apache 2.0

---

## 目录结构

```
workspace/
├── client/                   # React 前端应用
│   ├── src/
│   │   ├── components/       # React 组件
│   │   ├── contexts/         # React Context (语言管理)
│   │   ├── data/             # 数据获取层
│   │   ├── locale/           # 国际化翻译文件
│   │   ├── pages/            # 页面组件
│   │   └── App.tsx           # 应用入口
│   ├── Dockerfile
│   └── package.json
├── server/                   # Express.js 后端服务
│   ├── src/
│   │   ├── data/             # 数据处理脚本和数据文件
│   │   │   └── split/        # 分割的服务器数据 (1837个文件)
│   │   ├── lib/              # 核心业务逻辑库
│   │   ├── routes/           # API 路由
│   │   └── server.ts         # 服务器入口
│   ├── tests/                # 测试文件
│   └── Dockerfile
├── docker-compose.yml        # Docker Compose 配置
└── package.json              # Monorepo 根配置
```

---

## 技术栈

### 前端
| 技术 | 版本 | 用途 |
|------|------|------|
| React | ^18.3.1 | UI 框架 |
| React Router DOM | ^6.22.3 | 客户端路由 |
| TypeScript | ^5.5.3 | 类型安全 |
| Vite | ^5.4.2 | 构建工具 |
| Tailwind CSS | ^3.4.1 | 样式框架 |
| Lucide React | ^0.344.0 | 图标库 |

### 后端
| 技术 | 版本 | 用途 |
|------|------|------|
| Express.js | ^4.21.2 | Web 框架 |
| TypeScript | ^5.5.3 | 类型安全 |
| OpenAI SDK | ^4.20.0 | LLM 集成 |
| Axios | ^1.6.0 | HTTP 客户端 |
| Vitest | ^1.5.3 | 测试框架 |

### 部署
- Docker & Docker Compose
- Nginx (反向代理)
- Node.js 22.16.0

---

## 核心数据模型

### McpServer 接口

```typescript
interface McpServer {
  mcpId: string;              // MCP 唯一标识符
  githubUrl: string;          // GitHub 仓库地址
  name: string;               // 服务器名称
  author: string;             // 作者
  description: string;        // 描述
  codiconIcon: string;        // 图标代码
  logoUrl: string;            // Logo URL
  category: string;           // 分类
  tags: string[];             // 标签
  requiresApiKey: boolean;    // 是否需要 API Key
  isRecommended: boolean;     // 是否推荐
  isOfficialIntegration: boolean;  // 是否官方集成
  isReferenceServer: boolean;      // 是否参考服务器
  isCommunityServer: boolean;      // 是否社区服务器
  githubStars: number;        // GitHub Stars 数
  downloadCount: number;      // 下载次数
  createdAt: string;          // 创建时间
  updatedAt: string;          // 更新时间
  hubId: string;              // Hub 唯一 ID
  githubForks?: number;       // Fork 数
  licenseType?: string;       // 许可证类型
}
```

### 服务器分类

- browser-automation
- cloud-platforms
- communication
- databases
- file-systems
- knowledge-memory
- location-services
- monitoring
- search
- version-control
- integrations
- other-tools
- developer-tools

---

## API 端点

### MCP 路由 (`/v1/mcp`)
| 方法 | 端点 | 描述 |
|------|------|------|
| GET | `/servers` | 获取所有服务器 (支持 locale 参数) |
| POST | `/download` | 获取服务器详情含 README 内容 |

### Hub 路由 (`/v1/hub`)
| 方法 | 端点 | 描述 |
|------|------|------|
| GET | `/servers` | 获取服务器列表 (含 hubId) |
| POST | `/search_servers` | 搜索/过滤服务器 (支持分页、分类、关键词搜索) |
| GET | `/servers/:hubId` | 获取单个服务器详情 |
| POST | `/servers/submit` | 提交新服务器 |
| GET | `/server_categories` | 获取服务器分类列表 |

---

## 主要功能模块

### 前端页面
| 页面 | 文件 | 功能描述 |
|------|------|----------|
| Home | `pages/Home.tsx` | 首页，展示推荐服务器、官方集成、分类浏览 |
| Listing | `pages/Listing.tsx` | 服务器列表页，支持搜索、过滤、分页 |
| ServerDetails | `pages/ServerDetails.tsx` | 服务器详情页，展示安装说明、使用指南等 |
| Submit | `pages/Submit.tsx` | 服务器提交页面 |

### 后端核心模块
| 模块 | 文件 | 功能描述 |
|------|------|----------|
| mcpServers.ts | `lib/mcpServers.ts` | 服务器数据管理，缓存策略 (TTL 1小时) |
| githubEnrichment.ts | `lib/githubEnrichment.ts` | GitHub API 集成，README 解析，数据增强 |
| llm.ts | `lib/llm.ts` | OpenAI LLM 调用封装 |
| llmTools.ts | `lib/llmTools.ts` | 翻译、分类判断等 LLM 工具 |

### 数据处理管道
```
爬取官方 MCP 仓库 → GitHub 信息增强 → 本地化翻译 → 分类处理 → 分割存储
```

---

## 国际化 (i18n)

支持 6 种语言：
- `en` - English
- `zh-hans` - 简体中文
- `zh-hant` - 繁體中文
- `ja` - 日本語
- `es` - Español
- `de` - German

---

## 缓存策略

- **服务端缓存**: 内存缓存，TTL 1 小时，按语言独立缓存
- **GitHub 数据缓存**: 缓存 README 解析结果

---

## 配置管理

### 环境变量
| 变量 | 描述 |
|------|------|
| `OPENAI_API_KEY` | OpenAI API 密钥 |
| `OPENAI_BASE_URL` | OpenAI API 基础 URL |
| `MODEL_NAME` | 使用的模型名称 |
| `GITHUB_API_TOKEN` | GitHub API Token |
| `CACHE_TTL` | 缓存 TTL (默认 3600000ms) |
| `PORT` | 服务端口 (默认 3001) |

---

## 开发命令

```bash
# 开发
npm run dev                   # 同时启动前后端
npm run client:dev            # 仅启动前端
npm run server:dev            # 仅启动后端

# 构建
npm run build                 # 构建生产版本
npm run lint                  # 运行 ESLint

# 测试
npm run test                  # 运行所有测试

# 数据处理
cd server && npm run crawl-servers           # 爬取 MCP 服务器
cd server && npm run process_githubinfo      # 增强 GitHub 信息
cd server && npm run process_locales         # 处理本地化
```

---

## 关键特性

1. **AI 驱动的信息提取**: 使用 LLM 从 GitHub README 中自动提取服务器信息
2. **多语言支持**: 支持 6 种语言的界面和数据翻译
3. **智能分类**: 基于 LLM 自动判断服务器分类
4. **GitHub 集成**: 实时获取 stars、forks、license 等信息
5. **高性能缓存**: 多层缓存策略优化性能
6. **企业级部署**: 支持 Docker 和 on-premise 部署

---

## 数据统计

- **MCP 服务器数量**: 1837 个
- **数据存储位置**: `/server/src/data/split/`
- **存储格式**: 每个服务器一个 JSON 文件
