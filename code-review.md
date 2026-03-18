# 安全代码评审报告

**项目名称**: MCP Agents Hub
**评审日期**: 2026年3月18日
**评审范围**: 全栈应用安全评审
**技术栈**: TypeScript, React, Express, Node.js, Docker

---

## 一、评审摘要

| 类别 | 状态 | 说明 |
|------|------|------|
| **整体安全评级** | 中等 | 存在几个需要关注的安全问题 |
| **发现的问题数** | 12 | 4个高风险, 5个中风险, 3个低风险 |
| **合规性** | 基本符合 | 敏感信息处理需改进 |

---

## 二、安全问题详情

### 2.1 高风险问题

#### [HIGH-001] 敏感凭证硬编码在前端代码中

**文件位置**: `client/src/main.tsx:13`

**问题描述**:
Application Insights 连接字符串硬编码在前端代码中，包含 Instrumentation Key、Ingestion Endpoint 等敏感信息。

**代码片段**:
```typescript
const appInsights = new ApplicationInsights({
  config: {
    connectionString: 'InstrumentationKey=43485096-3cae-436a-84ea-6f813c67476b;IngestionEndpoint=https://southeastasia-1.in.applicationinsights.azure.com/;...',
  }
});
```

**风险影响**:
- API密钥暴露在客户端，可能被恶意利用
- 攻击者可使用该密钥发送虚假遥测数据
- 可能导致资源滥用和额外费用

**修复建议**:
1. 将连接字符串移至环境变量 `VITE_APP_INSIGHTS_CONNECTION_STRING`
2. 在构建时注入配置
3. 考虑使用服务器端代理发送遥测数据

```typescript
// 修复示例
const appInsights = new ApplicationInsights({
  config: {
    connectionString: import.meta.env.VITE_APP_INSIGHTS_CONNECTION_STRING || '',
  }
});
```

---

#### [HIGH-002] CORS 配置过于宽松

**文件位置**: `server/src/server.ts:10`

**问题描述**:
服务器使用默认的 CORS 配置，允许所有来源访问 API。

**代码片段**:
```typescript
app.use(cors());
```

**风险影响**:
- 任何网站都可以向 API 发送请求
- 可能导致 CSRF 攻击
- 敏感数据可能被恶意网站获取

**修复建议**:
```typescript
import cors from 'cors';

const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['https://mcpagents.dev'],
  methods: ['GET', 'POST'],
  credentials: true,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
```

---

#### [HIGH-003] GitHub Actions 使用过时版本

**文件位置**: `.github/workflows/docker-build.yml:18`

**问题描述**:
GitHub Actions 使用过时的 checkout@v2 版本，可能存在已知安全漏洞。

**代码片段**:
```yaml
- uses: actions/checkout@v2
```

**风险影响**:
- 旧版本可能存在安全漏洞
- 缺少新版本的安全修复

**修复建议**:
```yaml
- uses: actions/checkout@v4
```

---

#### [HIGH-004] Docker 镜像以 root 用户运行

**文件位置**: `server/Dockerfile`, `client/Dockerfile`

**问题描述**:
Docker 容器默认以 root 用户运行，存在安全风险。

**风险影响**:
- 容器逃逸后可能获得主机 root 权限
- 增加攻击面

**修复建议**:
```dockerfile
# 在 server/Dockerfile 中添加
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
WORKDIR /app
COPY --chown=appuser:appgroup . .
USER appuser
```

---

### 2.2 中风险问题

#### [MEDIUM-001] 缺少请求速率限制

**文件位置**: `server/src/server.ts`

**问题描述**:
API 端点没有实现速率限制，可能遭受 DoS 攻击或滥用。

**风险影响**:
- 服务可能被大量请求压垮
- LLM API 可能被滥用导致高额费用
- GitHub API 配额可能被耗尽

**修复建议**:
```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 每个IP最多100个请求
  message: { error: 'Too many requests, please try again later.' }
});

app.use('/v1/', limiter);
```

---

#### [MEDIUM-002] 缺少输入验证库

**文件位置**: `server/src/routes/hub.ts`

**问题描述**:
手动进行输入验证，存在遗漏风险。建议使用专业的验证库。

**当前实现**:
```typescript
if (!githubUrl.startsWith('https://github.com/')) {
  res.status(400).json({ error: 'Invalid GitHub URL format...' });
  return;
}
```

**风险影响**:
- 输入验证可能不完整
- 可能导致注入攻击或数据污染

**修复建议**:
使用 `joi` 或 `zod` 进行结构化验证：
```typescript
import { z } from 'zod';

const SubmitSchema = z.object({
  githubUrl: z.string().url().startsWith('https://github.com/')
});

const result = SubmitSchema.safeParse(req.body);
if (!result.success) {
  res.status(400).json({ error: 'Invalid input', details: result.error });
  return;
}
```

---

#### [MEDIUM-003] 错误信息泄露实现细节

**文件位置**: `server/src/lib/config.ts:24-48`

**问题描述**:
配置文件中输出了敏感的调试信息，包括 API Key 的部分内容。

**代码片段**:
```typescript
console.log(`API key in .env: ${apiKeyValue ? `defined (${apiKeyValue.substring(0, 3)}...)` : 'empty'}`);
```

**风险影响**:
- 日志中可能泄露敏感配置信息
- 帮助攻击者了解系统内部结构

**修复建议**:
1. 移除生产环境的详细日志输出
2. 使用环境变量控制日志级别
```typescript
if (process.env.NODE_ENV !== 'production') {
  console.log('Debug info...');
}
```

---

#### [MEDIUM-004] Nginx 缺少安全头配置

**文件位置**: `client/nginx.conf`

**问题描述**:
Nginx 配置缺少重要的安全响应头。

**风险影响**:
- XSS 攻击风险
- 点击劫持风险
- MIME 类型嗅探风险

**修复建议**:
```nginx
server {
    # 添加安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # HSTS (已启用 SSL)
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
}
```

---

#### [MEDIUM-005] 提交端点缺少身份验证

**文件位置**: `server/src/routes/hub.ts:277`

**问题描述**:
`POST /servers/submit` 端点没有身份验证，任何人都可以提交服务器。

**风险影响**:
- 可能被滥用提交垃圾内容
- LLM API 调用可能被恶意消耗
- 数据污染风险

**修复建议**:
1. 添加 API Key 或 JWT 身份验证
2. 结合速率限制
3. 添加验证码或审核流程

---

### 2.3 低风险问题

#### [LOW-001] 缺少依赖版本锁定策略

**文件位置**: `package.json` 文件

**问题描述**:
部分依赖使用 `^` 版本范围，可能导致版本不一致。

**修复建议**:
- 使用 `npm ci` 代替 `npm install`
- 考虑使用精确版本号

---

#### [LOW-002] 控制台日志包含敏感路径

**文件位置**: 多个文件

**问题描述**:
控制台日志输出了内部路径和配置信息。

**修复建议**:
使用专业的日志库（如 winston 或 pino），并根据环境控制日志级别。

---

#### [LOW-003] .gitignore 可扩展

**文件位置**: `.gitignore`

**问题描述**:
`.gitignore` 文件可以添加更多敏感文件类型的忽略规则。

**建议添加**:
```
# Additional security ignores
*.pem
*.key
*.crt
secrets/
credentials/
.npmrc
```

---

## 三、积极的安全实践

项目已实施以下良好安全实践：

### 3.1 敏感信息保护
- 使用 `.env` 文件管理环境变量，并通过 `.gitignore` 排除
- 提供了 `.env.example` 示例文件，不包含真实凭证
- GitHub Token 和 API Key 通过环境变量配置

### 3.2 网络安全
- 强制 HTTPS 重定向 (`nginx.conf:6`)
- 使用 SSL/TLS 证书加密通信
- API 代理配置使用内部网络

### 3.3 代码安全
- 使用 TypeScript 提供类型安全
- 没有发现 `eval()`, `Function()`, `innerHTML`, `dangerouslySetInnerHTML` 等危险用法
- 没有发现 SQL 注入风险（项目不使用数据库）

### 3.4 构建安全
- 使用 Docker 多阶段构建（客户端）
- 使用私有仓库存储敏感配置

---

## 四、安全最佳实践建议

### 4.1 立即修复（高风险）
1. 将 Application Insights 连接字符串移至环境变量
2. 配置严格的 CORS 策略
3. 更新 GitHub Actions 版本
4. 为 Docker 容器创建非 root 用户

### 4.2 短期改进（中风险）
1. 实现请求速率限制
2. 使用专业输入验证库
3. 配置 Nginx 安全响应头
4. 为提交端点添加身份验证
5. 移除生产环境调试日志

### 4.3 长期规划
1. 实施安全审计日志
2. 添加 API 版本控制和废弃策略
3. 建立 OWASP 安全检查流程
4. 配置依赖漏洞扫描（如 Dependabot）
5. 实施 CSP (Content Security Policy)

---

## 五、合规性检查

| 检查项 | 状态 | 说明 |
|--------|------|------|
| 无硬编码密钥 | 需改进 | 前端存在硬编码密钥 |
| 环境变量管理 | 通过 | 正确使用 .env 文件 |
| HTTPS 强制 | 通过 | Nginx 配置重定向 |
| 输入验证 | 部分通过 | 建议使用验证库 |
| 错误处理 | 通过 | 不暴露敏感堆栈信息 |
| 依赖安全 | 需检查 | 建议添加漏洞扫描 |

---

## 六、总结

MCP Agents Hub 项目整体安全状况良好，代码质量较高，采用了现代化的技术栈和开发实践。主要安全问题集中在配置管理和网络安全层面。

**关键发现**:
- 前端代码中硬编码的 Application Insights 密钥是最紧迫的安全问题
- CORS 配置过于宽松需要尽快修复
- 建议添加速率限制以防止 API 滥用

**风险评估**:
- 当前风险等级：中等
- 修复高优先级问题后：低

建议开发团队优先处理高风险问题，并建立定期的安全代码评审流程。

---

**评审人**: CodeBuddy Code Security Review
**评审工具版本**: GLM-5.0
**文档版本**: 1.0
