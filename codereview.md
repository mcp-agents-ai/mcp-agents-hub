# 代码安全审查报告

**项目名称**: MCP Marketplace  
**项目类型**: Node.js/TypeScript 全栈应用  
**前端**: React + Vite  
**后端**: Express.js  
**扫描时间**: 2026年3月30日

---

## 概述

本次安全扫描对 MCP Marketplace 项目进行了全面的代码安全审查，共发现 **13 个安全问题**，其中高风险 **2 个**、中等风险 **6 个**、低风险 **5 个**。

---

## 发现的安全漏洞

### 1. 敏感信息泄露 (高风险) :rotating_light:

#### 1.1 日志中泄露 API 密钥信息

**文件**: `server/src/lib/config.ts:23-48`

**问题代码**:
```typescript
const apiKeyLine = envFileContent.split('\n').find(line => line.startsWith('OPENAI_API_KEY='));
if (apiKeyLine) {
  const apiKeyValue = apiKeyLine.split('=')[1];
  console.log(`API key in .env: ${apiKeyValue ? `defined (${apiKeyValue.substring(0, 3)}...)` : 'empty'}`);
}

const rawApiKey = process.env.OPENAI_API_KEY;
console.log('Raw API Key from process.env:', rawApiKey ? `exists (${rawApiKey.substring(0, 3)}...)` : 'undefined or empty');
```

**问题描述**: 虽然只打印了 API 密钥的前3个字符，但在生产环境中，任何 API 密钥信息的泄露都是不安全的，日志可能被未授权人员访问。

**修复建议**:
```typescript
// 完全移除这些调试日志，或仅在开发环境中启用
if (process.env.NODE_ENV !== 'production') {
  console.log('API key status:', rawApiKey ? 'configured' : 'not configured');
}
```

---

#### 1.2 nohup.out 文件提交到仓库

**文件**: `nohup.out` (817KB)

**问题描述**: `nohup.out` 文件被提交到代码库中，可能包含运行时的敏感日志信息。

**修复建议**:
- 将 `nohup.out` 添加到 `.gitignore`
- 从代码库历史中删除此文件: `git rm --cached nohup.out`

---

### 2. CORS 配置过于宽松 (中等风险) :warning:

**文件**: `server/src/server.ts:10`

**问题代码**:
```typescript
app.use(cors());
```

**问题描述**: CORS 配置使用默认设置，允许任何来源的跨域请求，这在生产环境中可能导致 CSRF 攻击。

**修复建议**:
```typescript
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['https://yourdomain.com'],
  credentials: true,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

---

### 3. 缺少安全 HTTP 头 (中等风险) :warning:

**文件**: `server/src/server.ts`

**问题描述**: Express 服务器没有配置安全相关的 HTTP 头，如：
- Content-Security-Policy (CSP)
- X-Frame-Options
- X-XSS-Protection
- X-Content-Type-Options
- Strict-Transport-Security (HSTS)

**修复建议**: 使用 `helmet` 中间件：
```typescript
import helmet from 'helmet';
app.use(helmet());
```

---

### 4. 缺少速率限制 (中等风险) :warning:

**文件**: `server/src/server.ts`

**问题描述**: API 端点没有实施速率限制，可能导致 DoS 攻击或资源滥用。

**修复建议**: 使用 `express-rate-limit` 中间件：
```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100 // 每个IP最多100个请求
});
app.use(limiter);
```

---

### 5. SSRF (服务端请求伪造) 风险 (中等风险) :warning:

**文件**: `server/src/lib/githubEnrichment.ts:189-206`

**问题代码**:
```typescript
export async function fetchReadmeContent(url: string): Promise<string> {
  try {
    if (url.startsWith('https://github.com')) {
      const rawReadmeUrl = convertToRawReadmeUrl(url);
      const response = await axios.get(rawReadmeUrl);
      return response.data;
    } else {
      // Try to fetch content from the URL directly
      const response = await axios.get(url);
      return response.data;
    }
  }
}
```

**问题描述**: `fetchReadmeContent` 函数虽然验证了 GitHub URL，但在 `else` 分支中允许从任意 URL 获取内容，可能被利用进行 SSRF 攻击。

**修复建议**:
```typescript
const ALLOWED_DOMAINS = ['github.com', 'raw.githubusercontent.com'];

export async function fetchReadmeContent(url: string): Promise<string> {
  const parsedUrl = new URL(url);
  if (!ALLOWED_DOMAINS.includes(parsedUrl.hostname)) {
    throw new Error('URL domain not allowed');
  }
  // 继续处理...
}
```

---

### 6. 输入验证不足 (中等风险) :warning:

**文件**: `server/src/routes/hub.ts:277-405`

**问题代码**:
```typescript
const { githubUrl } = req.body;
if (!githubUrl) {
  res.status(400).json({ error: 'GitHub URL is required' });
  return;
}
if (!githubUrl.startsWith('https://github.com/')) {
  res.status(400).json({ error: 'Invalid GitHub URL format...' });
  return;
}
```

**问题描述**: 
1. GitHub URL 验证过于简单，只检查前缀
2. 其他输入字段没有进行验证或清理
3. 没有防止恶意构造的 URL

**修复建议**: 使用 `express-validator` 或 `joi` 进行更严格的输入验证：
```typescript
const githubUrlRegex = /^https:\/\/github\.com\/[a-zA-Z0-9\-_.]+\/[a-zA-Z0-9\-_.]+(\/)?$/;
if (!githubUrlRegex.test(githubUrl)) {
  res.status(400).json({ error: 'Invalid GitHub URL format' });
  return;
}
```

---

### 7. 依赖项安全风险 (中等风险) :warning:

**文件**: `package.json`

**问题描述**: 以下依赖项可能存在已知漏洞：

| 依赖项 | 当前版本 | 说明 |
|--------|----------|------|
| axios | ^1.6.0 | 需要检查是否有更新版本修复安全漏洞 |
| express | ^4.21.2 | 建议定期更新 |
| vite | ^5.4.2 | 开发依赖，需保持更新 |

**修复建议**: 
```bash
npm audit
npm audit fix
npm update
```

---

### 8. 环境变量处理不当 (中等风险) :warning:

**文件**: `server/src/lib/config.ts`

**问题描述**: 
1. 直接读取并打印环境变量文件内容
2. 缺少对敏感环境变量的加密存储

**修复建议**:
- 使用 AWS Secrets Manager 或 HashiCorp Vault 管理敏感配置
- 确保生产环境中不打印配置信息

---

### 9. 缺少输入大小限制 (低风险)

**文件**: `server/src/server.ts:11`

**问题代码**:
```typescript
app.use(express.json());
```

**问题描述**: JSON body 解析没有设置大小限制，可能导致大 payload 攻击。

**修复建议**:
```typescript
app.use(express.json({ limit: '1mb' }));
```

---

### 10. GitHub Actions 安全问题 (低风险)

**文件**: `.github/workflows/docker-build.yml:18`

**问题代码**:
```yaml
uses: actions/checkout@v2
```

**问题描述**: 使用旧版本的 GitHub Actions，可能存在已知漏洞。

**修复建议**:
```yaml
uses: actions/checkout@v4
```

---

### 11. Docker 安全配置 (低风险)

**文件**: 
- `client/Dockerfile`
- `server/Dockerfile`

**问题描述**: 
1. 使用 `node:18-alpine` 基础镜像，建议定期更新
2. 没有明确指定非 root 用户运行

**修复建议**:
```dockerfile
# 添加非 root 用户
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser
```

---

### 12. Nginx 配置缺少安全头 (低风险)

**文件**: `client/nginx.conf`

**问题描述**: Nginx 配置缺少安全相关的 HTTP 头。

**修复建议**: 添加以下配置：
```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Content-Security-Policy "default-src 'self';" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

---

### 13. 路径遍历潜在风险 (低风险)

**文件**: `server/src/routes/hub.ts:370-375`

**问题代码**:
```typescript
const splitDirPath = path.join(__dirname, '..', 'data', 'split');
const sanitizedName = extractedInfo.name.toLowerCase().replace(/[^a-z0-9]/g, '');
const filename = `${hubId}_${sanitizedName}.json`;
const filePath = path.join(splitDirPath, filename);
await fs.writeFile(filePath, JSON.stringify(newServer, null, 2), 'utf8');
```

**问题描述**: 虽然使用了正则表达式清理文件名，但最好添加额外验证确保路径在预期目录内。

**修复建议**:
```typescript
const resolvedPath = path.resolve(splitDirPath, filename);
if (!resolvedPath.startsWith(splitDirPath)) {
  throw new Error('Invalid file path');
}
```

---

## 未发现的安全漏洞

以下安全漏洞模式在本次扫描中**未发现**：

| 漏洞类型 | 状态 |
|----------|------|
| SQL 注入 | 未发现（不使用数据库） |
| XSS (跨站脚本攻击) | 未发现（React 自动转义） |
| 命令注入 | 未发现（无 `child_process` 使用） |
| 不安全的随机数生成 | 未发现（使用 `uuid` 库） |
| 不安全的反序列化 | 未发现 |
| XXE (外部实体注入) | 未发现 |
| ReDoS (正则表达式拒绝服务) | 未发现（正则表达式简单） |
| 文件上传漏洞 | 未发现（无文件上传功能） |
| 开放重定向 | 未发现 |
| dangerouslySetInnerHTML | 未发现 |

---

## 修复优先级建议

### 高优先级 (立即修复)
1. :rotating_light: 移除或保护敏感信息日志输出
2. :rotating_light: 将 `nohup.out` 添加到 `.gitignore` 并从仓库中删除

### 中优先级 (尽快修复)
3. :warning: 配置严格的 CORS 策略
4. :warning: 添加安全 HTTP 头 (使用 helmet)
5. :warning: 实施速率限制
6. :warning: 加强 SSRF 防护
7. :warning: 改进输入验证
8. :warning: 运行 `npm audit` 检查依赖项漏洞

### 低优先级 (建议修复)
9. 设置 JSON body 大小限制
10. 更新 GitHub Actions 版本
11. Docker 容器使用非 root 用户
12. Nginx 添加安全头
13. 添加路径验证

---

## 附录：安全加固命令

```bash
# 1. 检查依赖项漏洞
npm audit
npm audit fix

# 2. 更新依赖项
npm update

# 3. 安装安全相关依赖
npm install helmet express-rate-limit

# 4. 从仓库删除敏感文件
git rm --cached nohup.out
echo "nohup.out" >> .gitignore
git commit -m "security: remove sensitive log file and add to gitignore"
```

---

**扫描工具**: CodeBuddy Code Security Scanner
