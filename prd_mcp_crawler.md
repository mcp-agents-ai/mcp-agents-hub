# PRD: MCP 资源动态抓取与新资源审核流程

## 1. 文档概述

### 1.1 文档信息
| 项目名称 | MCP 资源动态抓取与审核系统 |
|---------|-------------------------|
| 版本 | v1.0 |
| 创建日期 | 2026-03-19 |
| 状态 | 草稿 |

### 1.2 修订历史
| 版本 | 日期 | 修订内容 | 作者 |
|-----|------|---------|------|
| v1.0 | 2026-03-19 | 初始版本 | - |

---

## 2. 项目背景

### 2.1 业务背景
MCP Agents Hub 是一个开源的 MCP（Model Context Protocol）生态系统平台，用于发现、构建和部署 MCP 服务器。目前平台已收录超过 200+ MCP 服务器资源，数据来源于手动维护和定期抓取。

### 2.2 现状分析
当前系统存在以下问题：
- **数据更新滞后**：依赖手动执行抓取脚本，无法及时发现新资源
- **缺乏自动化流程**：新资源发现后需要人工介入处理
- **审核流程缺失**：新抓取的资源直接入库，缺乏质量把控机制
- **数据一致性风险**：缺少变更追踪和审核记录

### 2.3 项目目标
1. 实现 MCP 资源的自动化定时抓取
2. 建立 GitHub Actions 驱动的 CI/CD 抓取流水线
3. 构建完善的新资源审核工作流
4. 保证数据质量与平台可信度

---

## 3. 功能需求

### 3.1 核心功能模块

```
┌─────────────────────────────────────────────────────────────┐
│                    MCP 资源抓取与审核系统                      │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  定时触发器  │  │  抓取引擎   │  │    审核工作流       │  │
│  │ (GitHub     │──│ (Crawler)   │──│  (Review Process)   │  │
│  │  Actions)   │  │             │  │                     │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│         │                │                    │              │
│         ▼                ▼                    ▼              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  调度配置   │  │  变更检测   │  │  PR 自动创建        │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│                          │                    │              │
│                          ▼                    ▼              │
│                  ┌─────────────┐  ┌─────────────────────┐   │
│                  │  差异报告   │  │  人工审核           │   │
│                  └─────────────┘  └─────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 功能详细说明

#### 3.2.1 GitHub Actions 定时抓取

**需求描述**：通过 GitHub Actions 实现定时自动抓取 MCP 资源列表。

**功能要点**：
- 支持配置抓取频率（默认每日执行一次）
- 从官方 MCP 服务器仓库获取最新资源列表
- 支持多数据源抓取（官方仓库、社区仓库等）
- 抓取失败自动重试机制

**数据源配置**：
| 数据源 | URL | 类型 | 优先级 |
|-------|-----|------|-------|
| MCP 官方服务器 | `https://github.com/modelcontextprotocol/servers` | README.md | 高 |
| 社区服务器列表 | 可扩展 | JSON/API | 中 |

**工作流配置**：
```yaml
# .github/workflows/mcp-crawler.yml
name: MCP Server Crawler

on:
  schedule:
    # UTC 时间每日 00:00 执行（北京时间 08:00）
    - cron: '0 0 * * *'
  workflow_dispatch:
    # 支持手动触发
    inputs:
      source:
        description: 'Data source to crawl'
        required: false
        default: 'official'
```

#### 3.2.2 抓取脚本增强

**需求描述**：增强现有 `mcp_servers_crawler.ts` 脚本功能。

**新增功能**：
1. **增量抓取支持**
   - 记录上次抓取时间戳
   - 只处理新增/变更的资源
   - 生成变更差异报告

2. **数据验证**
   - GitHub URL 格式验证
   - 必填字段完整性检查
   - 重复资源检测

3. **扩展数据采集**
   - GitHub Stars 数量
   - 最近更新时间
   - License 信息
   - Fork 数量

**输出格式**：
```json
{
  "crawlMetadata": {
    "timestamp": "2026-03-19T00:00:00Z",
    "source": "official",
    "triggeredBy": "scheduled"
  },
  "summary": {
    "totalServers": 150,
    "newServers": 5,
    "updatedServers": 3,
    "removedServers": 1
  },
  "newServers": [...],
  "updatedServers": [...],
  "removedServers": [...]
}
```

#### 3.2.3 变更检测与差异报告

**需求描述**：自动检测资源变更并生成差异报告。

**检测维度**：
- 新增资源
- 资源信息变更（名称、描述、分类等）
- 资源下线/移除
- GitHub 元数据变更（Stars、更新时间等）

**差异报告格式**：
```markdown
# MCP 资源变更报告 - 2026-03-19

## 新增资源 (5)
| 名称 | GitHub URL | 类型 |
|-----|------------|------|
| New MCP Server | https://github.com/xxx/new-mcp-server | Community |

## 信息变更 (3)
| 名称 | 变更字段 | 旧值 | 新值 |
|-----|---------|------|------|
| GitHub Server | description | ... | ... |

## 移除资源 (1)
| 名称 | 原因 |
|-----|------|
| Deprecated Server | 仓库已归档 |

## 统计信息
- 总资源数：245
- 本次变更：9
```

#### 3.2.4 新资源审核工作流

**需求描述**：建立新资源的自动化审核与人工审核相结合的工作流。

**审核流程**：

```
新资源发现
    │
    ▼
┌──────────────────┐
│  自动化预审      │
│  - URL 有效性    │
│  - 仓库公开性    │
│  - 基本信息完整  │
└────────┬─────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
 通过      不通过
    │         │
    │         ▼
    │   ┌──────────┐
    │   │ 自动关闭 │
    │   │ 标注原因 │
    │   └──────────┘
    │
    ▼
┌──────────────────┐
│  创建审核 PR     │
│  - 包含差异报告  │
│  - 自动分类建议  │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  人工审核        │
│  - 内容审核      │
│  - 分类确认      │
│  - 质量评估      │
└────────┬─────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
 批准      拒绝
    │         │
    ▼         ▼
自动合并   关闭 PR
```

**审核清单**：
```markdown
## 新资源审核清单

### 基础信息
- [ ] GitHub URL 有效且仓库公开
- [ ] 仓库 README 包含清晰的安装说明
- [ ] 资源名称无误导性

### 内容质量
- [ ] 描述准确，无夸大宣传
- [ ] 分类标签合理
- [ ] 无安全风险（恶意代码、敏感数据收集等）

### 社区评估
- [ ] GitHub Stars >= 阈值（可选：Community >= 10）
- [ ] 最近有维护活动
- [ ] Issue 响应及时

### 合规性
- [ ] License 合规
- [ ] 无版权争议
```

#### 3.2.5 Pull Request 自动创建

**需求描述**：当检测到新资源或变更时，自动创建审核 PR。

**PR 内容**：
1. 标题格式：`[Auto] MCP 资源更新 - YYYY-MM-DD`
2. 包含完整的差异报告
3. 自动添加新资源的 JSON 文件到 `server/src/data/pending/` 目录
4. 关联标签：`auto-crawler`, `needs-review`

**PR 模板**：
```markdown
## 自动抓取报告

**抓取时间**: 2026-03-19T00:00:00Z
**触发方式**: 定时任务
**数据源**: MCP 官方仓库

### 变更摘要
- 新增资源: 5 个
- 信息更新: 3 个
- 资源移除: 1 个

### 详细报告
[查看完整差异报告](./reports/2026-03-19.md)

### 审核指南
1. 检查新资源的基本信息
2. 验证资源描述的准确性
3. 确认分类标签合理
4. 通过后合并此 PR

---
*此 PR 由自动化系统创建，请审核后合并*
```

---

## 4. 技术方案

### 4.1 系统架构

```
┌─────────────────────────────────────────────────────────────────┐
│                        GitHub Repository                         │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   .github/workflows/                      │   │
│  │  ┌─────────────────┐    ┌────────────────────────────┐   │   │
│  │  │ mcp-crawler.yml │    │ mcp-review-auto.yml        │   │   │
│  │  │ (定时抓取)      │    │ (审核辅助)                 │   │   │
│  │  └─────────────────┘    └────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   server/src/data/                        │   │
│  │  ┌─────────────────┐    ┌────────────────────────────┐   │   │
│  │  │ split/          │    │ pending/                   │   │   │
│  │  │ (已审核资源)    │    │ (待审核资源)               │   │   │
│  │  └─────────────────┘    └────────────────────────────┘   │   │
│  │                                                           │   │
│  │  ┌─────────────────┐    ┌────────────────────────────┐   │   │
│  │  │ reports/        │    │ cache/                     │   │   │
│  │  │ (差异报告)      │    │ (抓取缓存)                 │   │   │
│  │  └─────────────────┘    └────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 GitHub Actions 工作流设计

#### 4.2.1 抓取工作流 (mcp-crawler.yml)

```yaml
name: MCP Server Crawler

on:
  schedule:
    - cron: '0 0 * * *'  # 每日 UTC 00:00
  workflow_dispatch:
    inputs:
      full_scan:
        description: 'Perform full scan (ignore cache)'
        required: false
        default: 'false'
        type: boolean

env:
  NODE_VERSION: '22'

jobs:
  crawl:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          cache-dependency-path: server/package-lock.json

      - name: Install dependencies
        working-directory: ./server
        run: npm ci

      - name: Run crawler
        working-directory: ./server
        run: |
          npm run crawl-servers
        env:
          CRAWLER_MODE: ${{ github.event.inputs.full_scan == 'true' && 'full' || 'incremental' }}

      - name: Run post-process
        working-directory: ./server
        run: npm run crawl-servers-postprocess

      - name: Detect changes
        id: detect
        run: |
          # 检查是否有新资源需要审核
          if [ -d "server/src/data/pending" ] && [ "$(ls -A server/src/data/pending 2>/dev/null)" ]; then
            echo "has_pending=true" >> $GITHUB_OUTPUT
            echo "pending_count=$(ls server/src/data/pending/*.json 2>/dev/null | wc -l)" >> $GITHUB_OUTPUT
          else
            echo "has_pending=false" >> $GITHUB_OUTPUT
          fi

      - name: Generate diff report
        if: steps.detect.outputs.has_pending == 'true'
        run: |
          npm run generate-report

      - name: Create Pull Request
        if: steps.detect.outputs.has_pending == 'true'
        uses: peter-evans/create-pull-request@v6
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          commit-message: "chore: add pending MCP servers for review"
          title: "[Auto] MCP 资源更新 - $(date '+%Y-%m-%d')"
          body-path: server/src/data/reports/latest.md
          branch: auto/mcp-crawler-$(date '+%Y%m%d')
          labels: |
            auto-crawler
            needs-review
          assignees: ${{ vars.REVIEW_ASSIGNEES }}

      - name: Upload artifacts
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: crawler-report-${{ github.run_id }}
          path: |
            server/src/data/reports/
            server/src/data/cache/
          retention-days: 30
```

#### 4.2.2 审核辅助工作流 (mcp-review-auto.yml)

```yaml
name: MCP Review Automation

on:
  pull_request:
    types: [opened, synchronize]
    paths:
      - 'server/src/data/pending/**'

jobs:
  auto-review:
    runs-on: ubuntu-latest
    permissions:
      pull-requests: write
      contents: read

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
          cache-dependency-path: server/package-lock.json

      - name: Install dependencies
        working-directory: ./server
        run: npm ci

      - name: Run auto review
        working-directory: ./server
        run: npm run auto-review -- --pr-number ${{ github.event.pull_request.number }}

      - name: Comment review results
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const report = fs.readFileSync('server/src/data/reviews/pr-${{ github.event.pull_request.number }}.md', 'utf8');
            await github.rest.issues.createComment({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: ${{ github.event.pull_request.number }},
              body: report
            });
```

### 4.3 数据结构设计

#### 4.3.1 待审核资源结构 (pending/*.json)

```typescript
interface PendingServer {
  // 基础信息（来自爬虫）
  mcpId: string;
  githubUrl: string;
  name: string;
  description: string;
  type: 'Reference Server' | 'Official Integration' | 'Community Server';

  // 元数据
  crawlMetadata: {
    discoveredAt: string;
    source: string;
    crawlJobId: string;
  };

  // 自动填充建议
  suggestions: {
    category: string;
    tags: string[];
    codiconIcon: string;
  };

  // 自动审核结果
  autoReview: {
    passed: boolean;
    checks: {
      name: string;
      status: 'passed' | 'failed' | 'warning';
      message: string;
    }[];
  };

  // GitHub 信息
  githubInfo: {
    stars: number;
    forks: number;
    lastUpdate: string;
    license: string;
    isArchived: boolean;
  };
}
```

#### 4.3.2 抓取缓存结构 (cache/crawl-cache.json)

```typescript
interface CrawlCache {
  lastCrawlTime: string;
  lastFullScanTime: string;
  knownServers: {
    mcpId: string;
    lastSeen: string;
    hash: string;  // 内容哈希，用于检测变更
  }[];
  failedUrls: {
    url: string;
    error: string;
    retryCount: number;
  }[];
}
```

### 4.4 新增脚本说明

| 脚本名称 | 路径 | 功能 |
|---------|------|------|
| `mcp_auto_review.ts` | `server/src/data/` | 自动审核待处理资源 |
| `mcp_diff_report.ts` | `server/src/data/` | 生成差异报告 |
| `mcp_pr_generator.ts` | `server/src/data/` | 生成 PR 内容 |
| `mcp_enricher.ts` | `server/src/data/` | 获取 GitHub 元数据 |

---

## 5. 非功能需求

### 5.1 性能要求
- 单次抓取完成时间 < 5 分钟
- 支持并发获取 GitHub 元数据（限制并发数避免 API 限流）
- 差异报告生成时间 < 30 秒

### 5.2 可靠性要求
- GitHub API 调用失败自动重试（最多 3 次）
- 抓取失败时发送告警通知
- 支持手动触发全量扫描

### 5.3 安全要求
- 使用 GitHub App Token 或 PAT 进行认证
- 敏感配置存储在 GitHub Secrets
- PR 创建使用最小权限原则

### 5.4 可维护性要求
- 完整的日志记录
- 清晰的错误信息
- 支持配置化（抓取频率、审核规则等）

---

## 6. 实施计划

### 6.1 阶段规划

| 阶段 | 内容 | 优先级 |
|-----|------|-------|
| Phase 1 | GitHub Actions 定时抓取基础实现 | P0 |
| Phase 2 | 变更检测与差异报告 | P0 |
| Phase 3 | PR 自动创建 | P0 |
| Phase 4 | 自动审核规则实现 | P1 |
| Phase 5 | 审核工作流优化 | P1 |
| Phase 6 | 监控与告警 | P2 |

### 6.2 文件清单

**新增文件**：
```
.github/workflows/
├── mcp-crawler.yml          # 抓取工作流
└── mcp-review-auto.yml      # 审核辅助工作流

server/src/data/
├── pending/                  # 待审核资源目录
├── reports/                  # 差异报告目录
├── cache/                    # 抓取缓存目录
├── mcp_auto_review.ts       # 自动审核脚本
├── mcp_diff_report.ts       # 差异报告脚本
└── mcp_enricher.ts          # 元数据获取脚本

server/src/types/
└── crawler.ts               # 类型定义
```

**修改文件**：
```
server/src/data/mcp_servers_crawler.ts  # 增强现有爬虫
server/package.json                      # 新增脚本命令
```

---

## 7. 风险评估

| 风险 | 影响 | 概率 | 缓解措施 |
|-----|------|------|---------|
| GitHub API 限流 | 高 | 中 | 使用缓存、控制并发、配置 GitHub App |
| 错误资源入库 | 高 | 低 | 多层审核机制、人工复核 |
| 抓取源变更 | 中 | 低 | 监控抓取结果、支持多数据源 |
| PR 垃圾堆积 | 中 | 中 | 自动关闭超时未处理的 PR |

---

## 8. 验收标准

### 8.1 功能验收
- [ ] GitHub Actions 能按计划自动执行抓取
- [ ] 新资源能正确检测并放入 pending 目录
- [ ] 差异报告准确反映变更内容
- [ ] PR 能自动创建并包含必要信息
- [ ] 自动审核能正确识别问题资源

### 8.2 性能验收
- [ ] 抓取任务在 5 分钟内完成
- [ ] GitHub API 调用未触发限流

### 8.3 文档验收
- [ ] README 更新使用说明
- [ ] 脚本包含必要的注释
- [ ] 审核流程文档完整

---

## 9. 附录

### 9.1 相关文档
- [MCP 官方仓库](https://github.com/modelcontextprotocol/servers)
- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [peter-evans/create-pull-request](https://github.com/peter-evans/create-pull-request)

### 9.2 配置示例

**审核规则配置 (review-rules.json)**：
```json
{
  "rules": {
    "githubStars": {
      "community": { "min": 10, "warn": 50 }
    },
    "lastUpdate": {
      "maxDays": 365
    },
    "license": {
      "allowed": ["MIT", "Apache-2.0", "GPL-3.0", "BSD-3-Clause"],
      "warning": ["GPL-2.0", "LGPL"]
    }
  }
}
```
