# MCP Agents Hub - 项目索引

## 项目概述

MCP Agents Hub 是一个开源的 MCP (Model Context Protocol) 服务器市场和管理平台，旨在帮助企业发现、分享和部署 MCP 服务器。

## 目录结构

```
workspace/
├── .bolt/                    # Bolt 配置目录
├── .github/
│   └── workflows/
│       └── docker-build.yml  # GitHub Actions CI/CD 工作流
├── client/                   # 前端应用
│   ├── public/
│   │   └── images/          # 静态图片资源
│   ├── src/
│   │   ├── components/      # React 组件
│   │   ├── contexts/        # React Context
│   │   ├── data/            # 数据服务
│   │   ├── locale/          # 国际化翻译文件
│   │   ├── pages/           # 页面组件
│   │   └── main.tsx         # 入口文件
│   ├── Dockerfile           # 前端 Docker 配置
│   ├── nginx.conf           # Nginx 配置
│   ├── package.json
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── vite.config.ts
├── server/                   # 后端服务
│   ├── src/
│   │   ├── data/
│   │   │   └── split/       # MCP 服务器数据 (1837+ JSON 文件)
│   │   ├── lib/             # 核心库
│   │   └── routes/          # API 路由
│   ├── Dockerfile           # 后端 Docker 配置
│   └── package.json
├── docker-compose.yml       # Docker 编排配置
├── package.json             # 根项目配置 (workspaces)
├── tsconfig.json            # TypeScript 配置
├── eslint.config.js         # ESLint 配置
├── README.md
└── LICENSE
```

## 技术栈

### 前端技术

| 技术 | 版本 | 用途 |
|------|------|------|
| React | 18.3.1 | UI 框架 |
| TypeScript | 5.5.3 | 类型安全 |
| Vite | 5.4.2 | 构建工具 |
| Tailwind CSS | 3.4.1 | 样式框架 |
| React Router DOM | 6.22.3 | 路由管理 |
| Lucide React | 0.344.0 | 图标库 |
| Application Insights | 18.3.6 | 应用监控 |

### 后端技术

| 技术 | 版本 | 用途 |
|------|------|------|
| Node.js | 22.16.0 | 运行时环境 |
| Express | 4.21.2 | Web 框架 |
| TypeScript | 5.5.3 | 类型安全 |
| OpenAI SDK | 4.20.0 | LLM 集成 |
| Axios | 1.6.0 | HTTP 客户端 |
| Vitest | 1.5.3 | 测试框架 |
| tsx | 4.19.3 | TypeScript 执行器 |

### DevOps 工具

| 技术 | 用途 |
|------|------|
| Docker | 容器化部署 |
| Nginx | 前端静态服务器/反向代理 |
| GitHub Actions | CI/CD 自动化 |
| ESLint | 代码质量检查 |

## 核心功能

### 1. MCP 服务器发现
- 浏览和搜索 MCP 服务器
- 按分类、推荐状态、官方集成等筛选
- 支持 6 种语言的国际化界面 (英语、简体中文、繁体中文、日语、西班牙语、德语)

### 2. 服务器详情展示
- 自动从 GitHub README 提取信息
- 使用 LLM 智能提取安装说明、使用方法、功能特性
- 展示 GitHub Stars、Forks、许可证等信息

### 3. 服务器提交
- 一键提交 GitHub 仓库 URL
- AI 自动分析 README 并提取信息
- 自动分类和标签生成

### 4. 数据增强
- GitHub 仓库信息获取
- LLM 驱动的信息提取
- 多语言翻译支持

### 5. 企业级部署
- Docker 容器化
- 支持本地部署
- GitHub Actions CI/CD 自动化

## 模块详情

### 前端模块

#### 页面组件 (`client/src/pages/`)
| 页面 | 文件 | 功能描述 |
|------|------|----------|
| Home | `Home.tsx` | 首页，展示推荐服务器、分类、搜索功能 |
| Listing | `Listing.tsx` | 服务器列表页，支持分类筛选、搜索、分页 |
| ServerDetails | `ServerDetails.tsx` | 服务器详情页，展示安装说明、使用方法 |
| Submit | `Submit.tsx` | 提交新 MCP 服务器的表单页面 |
| Docs | `Docs.tsx` | 文档页面，介绍 MCP 协议和使用方法 |
| About | `About.tsx` | 关于页面，项目介绍 |

#### 核心组件 (`client/src/components/`)
| 组件 | 文件 | 功能描述 |
|------|------|----------|
| Header | `Header.tsx` | 导航栏，包含语言切换 |
| Footer | `Footer.tsx` | 页脚 |
| ServerCard | `ServerCard.tsx` | 服务器卡片组件 |
| ServerList | `ServerList.tsx` | 服务器列表组件，支持分页 |
| SearchBar | `SearchBar.tsx` | 搜索栏组件 |
| CategoriesDropdown | `CategoriesDropdown.tsx` | 分类下拉菜单 |

### 后端模块

#### API 路由 (`server/src/routes/`)

**Hub 路由 (`/v1/hub/`)**
| 端点 | 方法 | 功能描述 |
|------|------|----------|
| `/servers` | GET | 获取所有服务器列表（含 hubId） |
| `/search_servers` | POST | 搜索/筛选服务器，支持分页 |
| `/servers/:hubId` | GET | 获取单个服务器详情 |
| `/servers/submit` | POST | 提交新服务器 |
| `/server_categories` | GET | 获取服务器分类列表 |

**MCP 路由 (`/v1/mcp/`)**
| 端点 | 方法 | 功能描述 |
|------|------|----------|
| `/servers` | GET | 获取服务器列表（不含 hubId） |
| `/download` | POST | 获取服务器数据和 README 内容 |

#### 核心库 (`server/src/lib/`)
| 模块 | 文件 | 功能描述 |
|------|------|----------|
| mcpServers | `mcpServers.ts` | MCP 服务器数据加载、缓存管理 |
| githubEnrichment | `githubEnrichment.ts` | GitHub 仓库信息获取、README 解析、数据增强 |
| llm | `llm.ts` | OpenAI/LLM API 调用封装 |
| llmTools | `llmTools.ts` | 翻译、分类确定等 LLM 工具函数 |
| mcpCategories | `mcpCategories.ts` | MCP 服务器分类定义 |
| config | `config.ts` | 配置管理，环境变量加载 |

## 服务器分类

项目支持 13 个服务器分类：

| 分类 ID | 分类名称 |
|---------|----------|
| browser-automation | 浏览器自动化 |
| cloud-platforms | 云平台 |
| communication | 通信 |
| databases | 数据库 |
| file-systems | 文件系统 |
| knowledge-memory | 知识记忆 |
| location-services | 位置服务 |
| monitoring | 监控 |
| search | 搜索 |
| version-control | 版本控制 |
| integrations | 集成 |
| other-tools | 其他工具 |
| developer-tools | 开发者工具 |

## 配置文件说明

| 文件 | 路径 | 用途 |
|------|------|------|
| package.json | 根目录 | Workspace 配置，定义 monorepo 结构 |
| vite.config.ts | `client/` | Vite 构建配置，API 代理设置 |
| tailwind.config.js | `client/` | Tailwind CSS 配置 |
| tsconfig.json | 根目录/子目录 | TypeScript 编译配置 |
| eslint.config.js | 根目录 | ESLint 代码检查配置 |
| docker-compose.yml | 根目录 | Docker 编排配置 |
| .env | `server/` | 环境变量配置（API密钥等） |
| .nvmrc | 根目录/子目录 | Node.js 版本锁定 (22.16.0) |

## 环境变量配置

```typescript
// 服务端配置项
{
  openai: {
    apiKey: string;        // OpenAI API 密钥
    baseURL: string;       // API 基础 URL
    modelName: string;     // 模型名称
    modelCharLimit: number; // 字符限制
  },
  github: {
    apiToken: string;      // GitHub API Token
  },
  cache: {
    ttl: number;           // 缓存 TTL (默认 1 小时)
  },
  server: {
    port: number;          // 服务端口 (默认 3001)
  }
}
```

## 数据规模

- **1837+** 个 MCP 服务器数据文件
- 每个服务器包含完整的元数据（名称、描述、标签、GitHub 信息等）
- 支持多语言数据存储

## 架构特点

1. **前后端分离**
   - 前端：React SPA，使用 Vite 构建
   - 后端：Express REST API

2. **Monorepo 结构**
   - 使用 npm workspaces 管理多包
   - 共享开发依赖和配置

3. **智能缓存**
   - 服务器数据内存缓存 (TTL: 1小时)
   - GitHub 数据文件缓存

4. **LLM 集成**
   - 自动从 README 提取结构化信息
   - 多语言翻译
   - 智能分类

## 快速开始

### 环境要求
- Node.js 22.16.0+
- npm 或 yarn

### 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

### Docker 部署

```bash
# 构建并启动
docker-compose up -d
```

## 许可证

MIT License
