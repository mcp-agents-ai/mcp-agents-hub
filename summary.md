# MCP Agents Hub - 项目总结文档

## 项目概述

**项目名称**: MCP Agents Hub (mcp-marketplace)

**项目定位**: 开源的 Model Context Protocol (MCP) 服务器和客户端生态系统中心/市场平台，帮助企业环境构建、发现和部署 MCP 服务器与客户端。

**核心价值**:
- 类似于"AI 界的 USB-C"标准，为 AI 应用与数据源之间提供标准化的连接方式
- 使 AI 系统能够在不同工具和数据集之间保持上下文
- 支持企业内部部署，确保安全性和合规性

---

## 技术栈

### 前端 (client/)

| 技术 | 版本 | 用途 |
|------|------|------|
| React | 18.3.1 | UI 框架 |
| TypeScript | 5.5.3 | 类型安全 |
| Vite | 5.4.2 | 构建工具和开发服务器 |
| Tailwind CSS | 3.4.1 | 样式框架 |
| React Router DOM | 6.22.3 | 客户端路由 |
| Lucide React | 0.344.0 | 图标库 |

### 后端 (server/)

| 技术 | 版本 | 用途 |
|------|------|------|
| Express | 4.21.2 | Web 框架 |
| TypeScript | 5.5.3 | 类型安全 |
| OpenAI SDK | 4.20.0 | LLM 集成 (README 解析) |
| Axios | 1.6.0 | HTTP 客户端 |
| Vitest | 1.5.3 | 测试框架 |

### 基础设施

- **容器化**: Docker + Docker Compose
- **CI/CD**: GitHub Actions
- **Web 服务器**: Nginx (前端静态文件服务)

---

## 项目架构

```
workspace/
├── client/                    # React 前端应用
│   ├── src/
│   │   ├── components/       # 可复用的 UI 组件
│   │   ├── contexts/         # React Context (语言国际化)
│   │   ├── data/             # 数据获取逻辑
│   │   ├── locale/           # 多语言翻译文件
│   │   ├── pages/            # 页面组件
│   │   └── App.tsx           # 主应用入口
│   └── Dockerfile            # Docker 构建文件
│
├── server/                    # Express 后端服务
│   ├── src/
│   │   ├── data/             # 数据文件和处理脚本
│   │   │   └── split/        # 分割的 MCP 服务器 JSON 文件 (约 1800+ 个)
│   │   ├── lib/              # 核心业务逻辑
│   │   ├── routes/           # API 路由
│   │   └── server.ts         # 服务入口
│   └── tests/                # 测试文件
│
├── .github/workflows/         # GitHub Actions CI/CD
├── docker-compose.yml         # Docker Compose 编排
└── package.json              # Monorepo 根配置
```

---

## 核心功能模块

### 前端页面

| 页面 | 文件 | 功能 |
|------|------|------|
| 主页 | `Home.tsx` | 服务器发现、分类浏览、推荐展示 |
| 列表页 | `Listing.tsx` | 分类筛选、搜索、分页 |
| 详情页 | `ServerDetails.tsx` | 显示安装/使用说明 |
| 提交页 | `Submit.tsx` | GitHub URL 提交新服务器 |
| 关于页 | `About.tsx` | 项目介绍 |
| 文档页 | `Docs.tsx` | 使用文档 |

### 后端 API 路由

| 路由 | 方法 | 功能 |
|------|------|------|
| `/v1/mcp/servers` | GET | 获取 MCP 服务器列表 (支持 locale) |
| `/v1/mcp/download` | POST | 下载服务器详情 (含 README) |
| `/v1/hub/servers` | GET | 获取完整服务器数据 |
| `/v1/hub/servers/:hubId` | GET | 获取单个服务器详情 |
| `/v1/hub/servers/submit` | POST | 提交新服务器 |
| `/v1/hub/search_servers` | POST | 搜索/筛选服务器 |
| `/v1/hub/server_categories` | GET | 获取分类列表 |

---

## 数据模型

### McpServer 接口

```typescript
interface McpServer {
  mcpId: string;              // MCP 唯一标识
  githubUrl?: string;         // GitHub 仓库 URL
  name: string;               // 服务器名称
  author: string;             // 作者
  description: string;        // 描述
  category?: string;          // 分类
  tags?: string[];            // 标签
  hubId: string;              // Hub 内部 ID

  // 状态标记
  isRecommended?: boolean;
  isOfficialIntegration?: boolean;
  isReferenceServer?: boolean;
  isCommunityServer?: boolean;

  // GitHub 元数据
  githubStars?: number;
  githubForks?: number;
  licenseType?: string | null;

  // 详情信息 (从 README 提取)
  Installation_instructions?: string;
  Usage_instructions?: string;
  features?: string[];
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

## 国际化支持

支持 6 种语言:
- English (en)
- 简体中文 (zh-CN)
- 繁体中文 (zh-TW)
- 日本語 (ja)
- Español (es)
- Deutsch (de)

---

## 部署配置

### 环境变量

```bash
# OpenAI API (用于 README 解析)
OPENAI_API_KEY=xxx
OPENAI_BASE_URL=https://ark.cn-beijing.volces.com/api/v3
MODEL_NAME=xxx

# GitHub API (用于元数据获取)
GITHUB_API_TOKEN=xxx

# 缓存配置
CACHE_TTL=3600000  # 1 小时

# 服务器配置
PORT=3001
```

### Docker 部署

```bash
docker-compose up -d
```

---

## 关键文件路径

| 类别 | 文件路径 |
|------|----------|
| 项目说明 | `README.md` |
| 开发指南 | `CLAUDE.md` |
| 前端入口 | `client/src/App.tsx` |
| 后端入口 | `server/src/server.ts` |
| API 路由 | `server/src/routes/` |
| 数据存储 | `server/src/data/split/` |
| 国际化文件 | `client/src/locale/` |
| Docker 配置 | `docker-compose.yml` |

---

## 项目特点

1. **企业级部署支持**: 支持本地部署，满足安全和合规需求
2. **AI 驱动的数据处理**: 使用 LLM 自动从 README 提取结构化信息
3. **多语言国际化**: 6 种语言的完整翻译支持
4. **高效的缓存策略**: 内存缓存 + TTL + 文件分割存储
5. **开发者友好**: TypeScript 全栈、完善的开发文档
6. **活跃的数据源**: 从官方 MCP 仓库自动同步服务器数据
