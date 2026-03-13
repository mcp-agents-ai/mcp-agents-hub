# MCP Agents Hub 项目总结

## 项目概述

**MCP Agents Hub** 是一个开源生态系统，用于构建、发现和部署企业环境中的模型上下文协议（Model Context Protocol, MCP）服务器和客户端。

### 仓库信息
- **仓库地址**: https://github.com/mcp-agents-ai/mcp-agents-hub
- **许可证**: Apache License 2.0
- **版本**: 0.0.0

## 什么是模型上下文协议 (MCP)？

MCP 是一个开放标准，使开发者能够在数据源和 AI 工具之间构建安全的双向连接。架构包括：
- **MCP 规范**: 开放标准协议定义
- **MCP 服务器**: 暴露数据源、工具和 API 的连接器
- **MCP 客户端**: 连接到 MCP 服务器的 AI 应用程序

## 项目结构

这是一个 **monorepo 工作区**，包含两个主要包：

```
mcp-agents-hub/
├── client/           # React 前端 (Vite + TypeScript + Tailwind CSS)
│   ├── src/
│   │   ├── components/   # 可复用组件
│   │   ├── pages/        # 页面组件 (Home, Listing, ServerDetails, Submit)
│   │   ├── contexts/     # React Context (LanguageContext)
│   │   ├── data/         # 静态数据
│   │   ├── locale/       # 国际化文件
│   │   └── App.tsx       # 主应用入口
│   └── package.json
├── server/           # Express.js 后端 (TypeScript + Node.js)
│   ├── src/
│   │   ├── routes/       # API 路由处理器
│   │   ├── lib/          # 核心业务逻辑
│   │   ├── data/         # 数据文件 (split/ 目录存储单独的服务器 JSON)
│   │   └── server.ts     # Express 应用入口
│   ├── tests/            # 测试文件
│   └── package.json
├── package.json      # 根工作区配置
├── docker-compose.yml
└── setup.sh          # 环境设置脚本
```

## 技术栈

### 前端 (client/)
- React
- Vite
- TypeScript
- Tailwind CSS
- Lucide React (图标)
- React Router (客户端路由)

### 后端 (server/)
- Express.js
- TypeScript
- Node.js
- Vitest (测试框架)

### 其他
- Concurrently (并行运行开发服务器)
- ESLint (代码检查)
- Docker (容器化部署)

## 主要功能

1. **服务器构建**: 模板、示例和最佳实践，加速 MCP 服务器开发
2. **客户端开发**: 构建利用 MCP 协议的 AI 应用程序
3. **工具发现**: 发现企业系统的预构建 MCP 服务器
4. **企业级部署**: 支持本地部署以增强安全性和合规性

## 开发命令

### 环境设置
```bash
# 快速设置（推荐）
./setup.sh

# 或手动设置
nvm use          # 使用 Node.js 22.16.0
npm install      # 安装依赖
```

### 开发
```bash
npm run dev              # 同时启动客户端和服务器
npm run client:dev       # 仅启动前端
npm run server:dev       # 仅启动后端
```

### 构建
```bash
npm run build            # 构建生产版本
npm run lint             # 运行代码检查
npm run preview          # 预览生产构建
```

### 测试 (server/)
```bash
npm run test             # 运行所有测试
npm run test:watch       # 监听模式
npm run test:integration # 集成测试
npm run test:mock        # 单元测试
```

### 数据处理脚本 (server/)
```bash
npm run crawl-servers              # 从官方仓库爬取 MCP 服务器
npm run crawl-servers-postprocess  # 后处理爬取的数据
npm run clean-duplicates           # 清理重复条目
npm run process_categories         # 处理分类数据
npm run process_locales            # 处理国际化数据
npm run process_githubinfo         # 丰富 GitHub 元数据
```

## 数据流水线

1. **爬取**: `mcp_servers_crawler.ts` 从官方 MCP 仓库提取服务器信息
2. **GitHub 丰富**: 添加 stars、forks、commits、license 信息
3. **本地化**: 生成多语言版本
4. **分类**: 按类别组织服务器
5. **分割存储**: 单独的 JSON 文件实现高效加载

## 国际化支持

支持的语言：
- English (en)
- German (de)
- Spanish (es)
- Japanese (ja)
- Simplified Chinese (zh-hans)
- Traditional Chinese (zh-hant)

## 缓存策略

- 服务端内存缓存，TTL 为 1 小时
- 特定语言存储
- 使用分割文件实现部分加载策略

## 部署

项目支持 Docker 部署：
- `docker-compose.yml` 用于容器编排
- 前端使用 nginx 配置
- 需要配置 GitHub API token 用于数据丰富

## 社区

- MCP 官方: https://github.com/modelcontextprotocol
- MCP Agents Hub: https://github.com/mcp-agents-ai/mcp-agents-hub

---

*本文件由 CodeBuddy Code 自动生成*
