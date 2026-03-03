# MCP Agents Hub - 代码库总结

## 项目概述

**MCP Agents Hub** 是一个开源的 Model Context Protocol (MCP) 服务器和客户端市场与发现平台。该项目提供了一个中心化的枢纽，让组织可以发现、分享和管理企业环境中的 MCP 资源。

### 什么是 MCP？
Model Context Protocol 是一个开放标准，支持数据源与 AI 驱动工具之间的安全双向连接。它允许 AI 系统在不同工具和数据集之间维护上下文。

---

## 1. 项目结构

### 目录布局
```
/workspace/
├── client/              # React 前端应用
├── server/              # Express.js 后端应用
├── .github/             # GitHub Actions 工作流
├── .bolt/               # Bolt 配置
├── public/              # 公共资源
├── package.json         # 根 package.json (工作区配置)
├── tsconfig.json        # TypeScript 配置
├── docker-compose.yml   # Docker 编排
├── setup.sh            # 自动化环境设置脚本
├── CLAUDE.md           # Claude Code 开发指南
└── README.md           # 项目文档
```

### Monorepo 结构
这是一个 **monorepo 工作区**，包含两个主要包：

#### 客户端 (`/client/`)
| 技术 | 版本 | 用途 |
|------|------|------|
| React | 18.3.1 | 前端框架 |
| Vite | 5.4.2 | 构建工具 |
| Tailwind CSS | 3.4.1 | 样式框架 |
| React Router DOM | 6.22.3 | 路由管理 |
| Lucide React | 0.344.0 | 图标库 |

**关键目录**:
- `src/components/` - 可复用 UI 组件
- `src/pages/` - 路由级页面组件
- `src/contexts/` - React Context 状态管理
- `src/data/` - 数据获取工具
- `src/locale/` - 国际化文件 (6种语言)
- `public/images/` - 静态图片资源

#### 服务端 (`/server/`)
| 技术 | 版本 | 用途 |
|------|------|------|
| Express | 4.21.2 | Web 框架 |
| Axios | 1.6.0 | HTTP 客户端 |
| OpenAI | 4.20.0 | LLM 集成 |
| Vitest | 1.5.3 | 测试框架 |
| tsx | 4.19.3 | TypeScript 执行器 |

**关键目录**:
- `src/lib/` - 核心业务逻辑
- `src/routes/` - API 路由处理器
- `src/data/` - 数据管理和处理脚本
- `src/data/split/` - 1,837 个独立 JSON 文件 (7.4MB)
- `tests/` - 集成测试和模拟测试

---

## 2. 入口点与核心模块

### 客户端入口
- `/client/src/main.tsx` - React 应用启动
- `/client/src/App.tsx` - 主应用组件与路由

### 服务端入口
- `/server/src/server.ts` - Express 服务器初始化

### 核心后端模块 (`/server/src/lib/`)

| 模块 | 功能描述 |
|------|----------|
| `mcpServers.ts` | MCP 服务器数据管理，支持本地化缓存，从分割的 JSON 文件加载数据 |
| `githubEnrichment.ts` | GitHub API 集成，获取仓库元数据（stars、forks、commits、license） |
| `llm.ts` & `llmTools.ts` | LLM 集成，支持6种语言的翻译服务，AI 分类判断 |
| `config.ts` | 环境配置管理（OpenAI API、GitHub API Token、缓存 TTL） |
| `mcpCategories.ts` | 服务器类别定义（13个类别） |

---

## 3. 主要功能

### 核心功能

#### 服务器发现与市场
- 浏览 1,837+ 个 MCP 服务器
- 按类别筛选（13个类别）
- 关键词搜索功能
- 查看带 GitHub 元数据的服务器详情
- 推荐、官方、参考服务器徽章

#### 国际化支持
支持 6 种语言：
- 英语 (en)
- 简体中文 (zh-hans)
- 繁体中文 (zh-hant)
- 日语 (ja)
- 西班牙语 (es)
- 德语 (de)

#### 服务器提交
- 通过 GitHub URL 提交新 MCP 服务器
- 使用 LLM 自动解析 README
- AI 驱动的类别判断
- 多语言翻译生成

### API 端点

#### MCP 路由 (`/v1/mcp`)
| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/servers` | 列出所有服务器（无 hubId） |
| POST | `/download` | 下载服务器及 README |

#### Hub 路由 (`/v1/hub`)
| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/servers` | 列出所有服务器（含 hubId） |
| POST | `/search_servers` | 搜索/筛选服务器（分页） |
| GET | `/servers/:hubId` | 获取服务器详情 |
| POST | `/servers/submit` | 提交新服务器 |
| GET | `/server_categories` | 列出所有类别 |

---

## 4. 架构模式

### 后端架构

#### 分层架构
```
Routes (API 层)
    ↓
Lib (业务逻辑层)
    ↓
Data Layer (文件系统/缓存)
```

#### 数据管理模式
- **分割存储**: 每个服务器独立 JSON 文件（高效缓存）
- **内存缓存**: 支持本地化，带 TTL
- **懒加载**: 按需刷新缓存
- **强制刷新**: 手动缓存失效

#### 缓存策略
- TTL: 1 小时（可配置）
- 本地化缓存键: `${hubId}_${locale}`

### 前端架构

#### 组件化架构
- 可复用 UI 组件（`ServerCard`、`ServerList`、`SearchBar`）
- 页面组件用于路由
- Context API 用于全局状态

#### 路由结构
| 路由 | 页面 |
|------|------|
| `/` | 首页（精选服务器） |
| `/listing/:categoryKey` | 类别浏览 |
| `/server/:hubId` | 服务器详情 |
| `/submit` | 服务器提交表单 |
| `/docs` | 文档 |
| `/about` | 关于页面 |

### 设计模式

#### 后端模式
1. **仓储模式**: `mcpServers.ts` 抽象数据访问
2. **配置对象模式**: 集中配置管理
3. **中间件模式**: Express 中间件链
4. **工厂模式**: 提交时服务器对象创建

#### 前端模式
1. **Provider 模式**: LanguageProvider 用于国际化
2. **容器/展示模式**: 逻辑与 UI 分离
3. **组合模式**: 组件组合
4. **Hook 模式**: 自定义 hooks 用于数据获取

---

## 5. 数据规模

| 指标 | 数值 |
|------|------|
| MCP 服务器条目 | 1,837 |
| 服务器数据总量 | 7.4MB |
| JSON 数据总行数 | 51,377 |
| 支持语言数 | 6 |
| 服务器类别数 | 13 |

### 服务器类别
1. browser-automation（浏览器自动化）
2. databases（数据库）
3. knowledge-memory（知识记忆）
4. development-tools（开发工具）
5. file-system（文件系统）
6. web-search（网络搜索）
7. communication（通信）
8. cloud-services（云服务）
9. data-visualization（数据可视化）
10. ai-ml（AI/机器学习）
11. security（安全）
12. monitoring（监控）
13. other（其他）

---

## 6. 开发与部署

### 开发命令
```bash
# 安装依赖
npm install

# 开发模式（客户端 + 服务端）
npm run dev

# 仅开发客户端
npm run dev:client

# 仅开发服务端
npm run dev:server

# 构建生产版本
npm run build

# 运行测试
npm run test
```

### 环境变量
| 变量 | 描述 |
|------|------|
| `OPENAI_API_KEY` | LLM API 密钥 |
| `OPENAI_BASE_URL` | LLM API 端点 |
| `MODEL_NAME` | LLM 模型标识符 |
| `GITHUB_API_TOKEN` | GitHub API 认证 |
| `PORT` | 服务器端口（默认: 3001） |
| `CACHE_TTL` | 缓存过期时间 |

### Docker 部署
- 多阶段 Docker 构建
- 客户端和服务端独立容器
- Nginx 服务前端
- Docker Compose 编排
- GitHub Actions CI/CD

---

## 7. 技术亮点

### 现代技术栈
- **TypeScript** 全栈类型安全
- **React 18** 与 Hooks
- **Vite** 快速开发与构建
- **Tailwind CSS** 实用优先的样式
- **Express** 异步/等待模式

### AI 集成
- OpenAI 兼容的 LLM 集成
- 自动 README 解析
- AI 驱动的分类判断
- 多语言翻译

### 企业级特性
- 本地部署能力
- Docker 容器化
- 环境变量配置
- Application Insights 集成（Azure 监控）

---

## 8. 性能优化

### 后端优化
- 分割 JSON 文件实现高效部分加载
- 带 TTL 的内存缓存
- 本地化缓存键
- GitHub API 限流处理

### 前端优化
- Vite 内置代码分割
- 核心数据静态导入
- 基于路由的懒加载代码分割
- 优化的依赖打包

---

## 许可证

Apache License 2.0
