# 安全漏洞代码评审报告

**项目:** asdm-core-assets
**评审日期:** 2026年3月6日
**评审重点:** 安全漏洞

---

## 目录

1. [项目概述](#项目概述)
2. [严重漏洞 (CRITICAL)](#严重漏洞-critical)
3. [高危漏洞 (HIGH)](#高危漏洞-high)
4. [中危漏洞 (MEDIUM)](#中危漏洞-medium)
5. [低危漏洞 (LOW)](#低危漏洞-low)
6. [安全亮点](#安全亮点)
7. [修复建议汇总](#修复建议汇总)

---

## 项目概述

### 技术栈

| 组件 | 技术 |
|------|------|
| 后端 | Node.js + Express.js + TypeScript |
| 前端 | React + TypeScript + Vite |
| 样式 | Tailwind CSS |
| 部署 | Docker + Nginx |

### API 端点

- `GET /v1/mcp/servers` - 获取服务器列表
- `POST /v1/mcp/download` - 获取服务器数据
- `GET /v1/hub/servers` - 获取带 hubId 的服务器
- `POST /v1/hub/search_servers` - 搜索服务器
- `GET /v1/hub/servers/:hubId` - 获取服务器详情
- `POST /v1/hub/servers/submit` - 提交新服务器
- `GET /v1/hub/server_categories` - 获取分类

---

## 严重漏洞 (CRITICAL)

### 1. 硬编码的 API 密钥泄露

**严重等级:** CRITICAL
**文件:** `client/src/main.tsx:11-14`

```typescript
const appInsights = new ApplicationInsights({
  config: {
    connectionString: 'InstrumentationKey=43485096-3cae-436a-84ea-6f813c67476b;IngestionEndpoint=https://southeastasia-1.in.applicationinsights.azure.com/...',
```

**风险:**
- Azure Application Insights 密钥暴露在客户端代码中
- 攻击者可利用此密钥发送虚假遥测数据
- 可能访问敏感的分析数据

**修复建议:**
```typescript
// 使用环境变量
const appInsights = new ApplicationInsights({
  config: {
    connectionString: import.meta.env.VITE_APPINSIGHTS_CONNECTION_STRING,
```

---

### 2. CORS 配置过于宽松

**严重等级:** CRITICAL
**文件:** `server/src/server.ts:10`

```typescript
app.use(cors());
```

**风险:**
- 允许任何源发起请求
- 易受跨站请求伪造 (CSRF) 攻击
- 可能导致敏感数据泄露

**修复建议:**
```typescript
import cors from 'cors';

const allowedOrigins = [
  'https://your-domain.com',
  'https://www.your-domain.com'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
```

---

### 3. 缺少安全响应头

**严重等级:** CRITICAL
**文件:** `server/src/server.ts`

**风险:**
缺少以下关键安全头:
- `X-Content-Type-Options: nosniff` - 防止 MIME 类型嗅探
- `X-Frame-Options: DENY` - 防止点击劫持
- `X-XSS-Protection: 1; mode=block` - XSS 过滤器
- `Content-Security-Policy` - 内容安全策略
- `Strict-Transport-Security` - HTTPS 强制

**修复建议:**
```typescript
import helmet from 'helmet';

app.use(helmet());
```

安装: `npm install helmet`

---

### 4. 缺少速率限制

**严重等级:** CRITICAL
**文件:** `server/src/server.ts`

**风险:**
- 易受拒绝服务 (DoS) 攻击
- 易受暴力破解攻击
- 资源耗尽风险

**修复建议:**
```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分钟
  max: 100, // 每个 IP 最多 100 个请求
  message: '请求过于频繁，请稍后再试'
});

app.use('/v1/', limiter);
```

安装: `npm install express-rate-limit`

---

## 高危漏洞 (HIGH)

### 5. 服务端请求伪造 (SSRF) 漏洞

**严重等级:** HIGH
**文件:** `server/src/routes/hub.ts:277-405`

```typescript
const readmeContent = await fetchReadmeContent(githubUrl);
```

**风险:**
- 攻击者可能通过构造特殊 URL 访问内部服务
- 可探测内网基础设施
- 可能访问云服务元数据端点 (如 AWS 169.254.169.254)

**修复建议:**
```typescript
import { URL } from 'url';

// 检查 URL 是否指向内部网络
function isInternalIP(hostname: string): boolean {
  const internalPatterns = [
    /^127\./,
    /^10\./,
    /^192\.168\./,
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
    /^169\.254\./,
    /^localhost$/i,
    /^0\.0\.0\.0$/
  ];
  return internalPatterns.some(pattern => pattern.test(hostname));
}

async function validateGitHubUrl(urlString: string): Promise<string> {
  const parsedUrl = new URL(urlString);

  // 严格验证域名
  if (parsedUrl.hostname !== 'github.com') {
    throw new Error('只允许 github.com 域名');
  }

  // 禁止内部 IP
  if (isInternalIP(parsedUrl.hostname)) {
    throw new Error('禁止访问内部地址');
  }

  // 确保是 HTTPS
  if (parsedUrl.protocol !== 'https:') {
    throw new Error('只允许 HTTPS 协议');
  }

  return urlString;
}
```

---

### 6. GitHub URL 验证薄弱

**严重等级:** HIGH
**文件:** `server/src/routes/hub.ts:288-291`

```typescript
if (!githubUrl.startsWith('https://github.com/')) {
  res.status(400).json({ error: 'Invalid GitHub URL format...' });
```

**风险:**
可被以下方式绕过:
- 大小写变体: `https://GITHUB.COM/`
- URL 编码: `https://%67ithub.com/`
- 子域名欺骗: `https://github.com.evil.com/`
- 其他协议: `https://github.com@evil.com/`

**修复建议:**
使用 `URL` 对象进行严格解析 (参见上面 SSRF 修复建议)

---

### 7. 敏感数据日志记录

**严重等级:** HIGH
**文件:** `server/src/lib/config.ts:23-29`

```typescript
console.log(`API key in .env: ${apiKeyValue ? `defined (${apiKeyValue.substring(0, 3)}...)` : 'empty'}`);
```

**风险:**
- API 密钥部分信息泄露
- 日志可能被未授权访问
- 违反安全最佳实践

**修复建议:**
```typescript
// 仅记录是否配置，不暴露任何值
console.log(`API key in .env: ${apiKeyValue ? 'configured' : 'not configured'}`);
```

---

### 8. 缺少输入验证/清理

**严重等级:** HIGH
**文件:** `server/src/routes/hub.ts`

**风险:**
- 用户输入 (如 `searchFor`, `categoryKey`, `hubId`) 未经验证
- 潜在的注入攻击风险
- 数据完整性问题

**修复建议:**
```typescript
import { z } from 'zod';

// 定义验证 schema
const submitServerSchema = z.object({
  githubUrl: z.string().url().max(500),
  name: z.string().min(1).max(100).regex(/^[a-zA-Z0-9\-_.\s]+$/),
  description: z.string().max(1000).optional(),
  category: z.string().max(50).optional()
});

// 在路由中使用
const validatedData = submitServerSchema.parse(req.body);
```

安装: `npm install zod`

---

## 中危漏洞 (MEDIUM)

### 9. 缺少身份认证/授权

**严重等级:** MEDIUM
**文件:** `server/src/server.ts`

**风险:**
- `/servers/submit` 端点允许匿名提交
- 可能导致垃圾数据提交
- 恶意内容注入风险

**修复建议:**
```typescript
import rateLimit from 'express-rate-limit';

// 为提交端点添加更严格的限制
const submitLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 小时
  max: 5 // 每个 IP 每小时最多 5 次提交
});

app.post('/v1/hub/servers/submit', submitLimiter, async (req, res) => {
  // 可选: 添加 API Key 或 JWT 认证
});
```

---

### 10. 不安全的文件写入操作

**严重等级:** MEDIUM
**文件:** `server/src/routes/hub.ts:370-375`

```typescript
const sanitizedName = extractedInfo.name.toLowerCase().replace(/[^a-z0-9]/g, '');
const filename = `${hubId}_${sanitizedName}.json`;
const filePath = path.join(splitDirPath, filename);
await fs.writeFile(filePath, JSON.stringify(newServer, null, 2), 'utf8');
```

**风险:**
- 文件名来自 LLM 提取，可能被操纵
- 潜在的路径遍历风险

**修复建议:**
```typescript
import path from 'path';
import crypto from 'crypto';

// 使用 UUID 作为文件名
const filename = `${hubId}.json`;
const filePath = path.join(splitDirPath, filename);

// 确保路径在预期目录内
const resolvedPath = path.resolve(filePath);
const expectedDir = path.resolve(splitDirPath);
if (!resolvedPath.startsWith(expectedDir)) {
  throw new Error('路径遍历攻击检测');
}
```

---

### 11. Docker 安全配置问题

**严重等级:** MEDIUM
**文件:** `server/Dockerfile`

**风险:**
- 默认以 root 用户运行
- 无健康检查
- 使用 `npm install` 而非 `npm ci`

**修复建议:**
```dockerfile
# 使用非 root 用户
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# 添加健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# 使用 npm ci 替代 npm install
RUN npm ci --only=production
```

---

### 12. docker-compose 环境文件路径问题

**严重等级:** MEDIUM
**文件:** `docker-compose.yml:13-14`

```yaml
env_file:
  - ../.github-private/env_files/.env
```

**风险:**
- 引用工作区外的敏感文件路径
- 可能暴露环境变量

**修复建议:**
将 `.env` 文件放置在工作区内，并使用 Docker secrets 或环境变量管理。

---

### 13. 缺少 CSRF 保护

**严重等级:** MEDIUM
**文件:** `server/src/server.ts`

**风险:**
- POST 端点无 CSRF token 保护
- 可能被恶意网站利用发起请求

**修复建议:**
```typescript
import csrf from 'csurf';

const csrfProtection = csrf({ cookie: true });
app.use(csrfProtection);

// 提供 CSRF token 给前端
app.get('/api/csrf-token', (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});
```

---

## 低危漏洞 (LOW)

### 14. 详细错误信息泄露

**严重等级:** LOW
**文件:** `server/src/routes/hub.ts`

**风险:**
错误信息可能暴露内部实现细节

**修复建议:**
```typescript
// 使用通用错误消息
res.status(500).json({ error: '服务器错误，请稍后重试' });

// 详细错误仅记录到日志
console.error('Detailed error:', error);
```

---

### 15. Nginx 缺少 Content-Security-Policy

**严重等级:** LOW
**文件:** `client/nginx.conf`

**修复建议:**
```nginx
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://api.github.com https://southeastasia-1.in.applicationinsights.azure.com;" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "DENY" always;
add_header X-XSS-Protection "1; mode=block" always;
```

---

### 16. 依赖项漏洞审计

**严重等级:** LOW
**文件:** 各 `package.json` 文件

**修复建议:**
```bash
# 定期运行依赖审计
npm audit
npm audit fix

# 或使用更严格的审计
npm audit --audit-level=moderate
```

---

## 安全亮点

以下安全措施已到位:

1. **无 `dangerouslySetInnerHTML`** - 未在代码中发现
2. **无 `eval()` 或 `new Function()`** - 未在代码中发现
3. **无 SQL 注入风险** - 使用 JSON 文件存储，无数据库
4. **.env 在 .gitignore 中** - 环境文件被忽略
5. **UUID 使用** - 使用 UUID v4 生成唯一标识符
6. **HTTPS 强制** - Nginx 重定向 HTTP 到 HTTPS

---

## 修复建议汇总

| 优先级 | 问题 | 修复方案 |
|--------|------|----------|
| CRITICAL | API 密钥硬编码 | 移至环境变量 |
| CRITICAL | CORS 过于宽松 | 限制允许的源 |
| CRITICAL | 缺少安全头 | 添加 helmet 中间件 |
| CRITICAL | 无速率限制 | 添加 express-rate-limit |
| HIGH | SSRF 漏洞 | 严格验证 URL，阻止内部 IP |
| HIGH | URL 验证薄弱 | 使用 URL 对象严格解析 |
| HIGH | 敏感数据日志 | 移除日志中的敏感信息 |
| HIGH | 缺少输入验证 | 添加 zod 验证 |
| MEDIUM | 无认证机制 | 添加认证或更严格的速率限制 |
| MEDIUM | 文件写入安全 | 使用 UUID 文件名，验证路径 |
| MEDIUM | Docker 安全 | 非 root 用户，添加健康检查 |
| MEDIUM | 无 CSRF 保护 | 添加 csurf 中间件 |
| LOW | 错误信息泄露 | 使用通用错误消息 |
| LOW | 缺少 CSP | 在 Nginx 中添加 CSP 头 |
| LOW | 依赖漏洞 | 定期运行 npm audit |

---

## 快速修复清单

### 服务器端 (server/)

```bash
# 安装安全相关依赖
npm install helmet express-rate-limit zod
npm install --save-dev @types/node
```

### 修改 server/src/server.ts

```typescript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

const app = express();

// 安全头
app.use(helmet());

// CORS 限制
const allowedOrigins = ['https://your-domain.com'];
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

// 速率限制
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use('/v1/', limiter);
```

### 客户端 (client/)

将敏感配置移至环境变量:

```bash
# .env.local
VITE_APPINSIGHTS_CONNECTION_STRING=your-connection-string-here
```

---

**报告生成时间:** 2026年3月6日
**建议复核周期:** 每季度或每次重大更新后
