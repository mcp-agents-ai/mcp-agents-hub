# MCP Agents Hub 项目概览

## 项目简介

**MCP Agents Hub** 是一个开源生态系统，用于构建、发现和部署 Model Context Protocol (MCP) 服务器和客户端。这是一个企业级的 MCP 市场平台，允许用户发现、分享和管理 MCP 资源。

- **项目名称**: `mcp-marketplace`
- **项目仓库**: https://github.com/mcp-agents-ai/mcp-agents-hub
- **许可证**: Apache License 2.0
- **Node.js 版本**: 22.16.0

## 目录结构

```
workspace/
├── client/                   # 前端应用 (React + Vite)
│   ├── src/
│   │   ├── components/       # React 组件
│   │   ├── contexts/         # React Context (语言管理)
│   │   ├── data/             # API 数据获取
│   │   ├── locale/           # 国际化翻译文件 (6种语言)
│   │   └── pages/            # 页面组件
│   ├── Dockerfile
│   └── nginx.conf
├── server/                   # 后端 API 服务器 (Express)
│   ├── src/
│   │   ├── data/             # 数据存储 (~1837个MCP服务器)
│   │   ├── lib/              # 核心库
│   │   ├── routes/           # API 路由
│   │   └── server.ts         # 服务器入口
│   └── tests/                # 测试文件
├── .github/workflows/        # CI/CD 配置
├── docker-compose.yml        # 容器编排
└── setup.sh                  # 环境设置脚本
```

## 技术栈

### 前端
| 技术 | 版本 | 用途 |
|------|------|------|
| React | ^18.3.1 | UI 框架 |
| React Router DOM | ^6.22.3 | 路由管理 |
| Vite | ^5.4.2 | 构建工具 |
| TypeScript | ^5.5.3 | 类型安全 |
| Tailwind CSS | ^3.4.1 | 样式框架 |

### 后端
| 技术 | 版本 | 用途 |
|------|------|------|
| Express | ^4.21.2 | Web 框架 |
| TypeScript | ^5.5.3 | 类型安全 |
| OpenAI | ^4.20.0 | LLM API 集成 |
| Vitest | ^1.5.3 | 测试框架 |

## 主要功能

### 前端页面
| 页面 | 路由 | 功能 |
|------|------|------|
| Home | `/` | 首页，展示推荐服务器、官方集成 |
| Listing | `/listing/:categoryKey` | 服务器列表，支持搜索、筛选、分页 |
| ServerDetails | `/server/:hubId` | 服务器详情，安装说明 |
| Submit | `/submit` | 提交新的 MCP 服务器 |

### 后端 API
- `GET /v1/mcp/servers` - 获取 MCP 服务器列表
- `GET /v1/hub/servers` - 获取完整服务器列表
- `POST /v1/hub/search_servers` - 高级搜索
- `GET /v1/hub/servers/:hubId` - 获取服务器详情
- `POST /v1/hub/servers/submit` - 提交新服务器

## 服务器分类

项目支持 13 个 MCP 服务器分类：
- browser-automation (浏览器自动化)
- cloud-platforms (云平台)
- communication (通信)
- databases (数据库)
- file-systems (文件系统)
- knowledge-memory (知识记忆)
- location-services (位置服务)
- monitoring (监控)
- search (搜索)
- version-control (版本控制)
- integrations (集成)
- developer-tools (开发者工具)
- other-tools (其他工具)

## 国际化支持

支持 6 种语言：
- English (en)
- 简体中文 (zh-hans)
- 繁体中文 (zh-hant)
- 日本語 (ja)
- Español (es)
- Deutsch (de)

## 数据规模

- **MCP 服务器数量**: 1837 个
- **主数据文件**: mcp-servers.json (~1.5MB)

## 环境配置

主要环境变量：
- `OPENAI_API_KEY` - OpenAI API 密钥
- `GITHUB_API_TOKEN` - GitHub API Token
- `PORT` - 服务器端口（默认 3001）
- `CACHE_TTL` - 缓存有效期（默认 1 小时）

## 核心特性

1. **服务器发现** - 浏览和搜索 MCP 服务器
2. **智能分类** - 基于 LLM 的自动分类
3. **多语言支持** - 6 种语言的自动翻译
4. **GitHub 集成** - 自动获取仓库信息
5. **AI 增强** - 使用 LLM 提取安装说明
6. **企业部署** - 支持 Docker 容器化部署

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 或使用 Docker
docker-compose up -d
```
