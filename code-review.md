# 代码安全评审报告

## 评审范围
对项目过去 10 个代码提交进行安全性评审。

**评审日期**: 2026-03-13

**评审的提交记录**:
1. `6c075108` - docs: Add comprehensive CLAUDE.md for development guidance
2. `467e9137` - Merge pull request #64 (feat/leixu/improve-setup)
3. `87182e22` - fix: Ensure script exits on error and use npm ci
4. `0b48a077` - feat: Enhance project setup with nvm instructions
5. `909611db` - Merge pull request #63 (feat/leixu/mcp_server_info_enrich)
6. `7ee4ec3b` - update github info
7. `24352cd7` - feat: Add batch size option to process_githubinfo script
8. `a27b4837` - fix: Rename update-server-types script
9. `a7365b53` - Merge pull request #62
10. `d8d0a801` - feat: Add githubLatestCommit and githubForks fields

---

## 安全问题汇总

### 1. 高风险问题

#### 1.1 敏感信息日志泄露 (HIGH)
**位置**: `server/src/lib/config.ts:23-49`

**问题描述**: 配置模块在加载时会将 API 密钥的部分内容打印到日志中。虽然只显示了前3个字符，但这种日志输出在生产环境中是不安全的做法。

```typescript
// 有风险的代码
console.log(`API key in .env: ${apiKeyValue ? `defined (${apiKeyValue.substring(0, 3)}...)` : 'empty'}`);
console.log('Raw API Key from process.env:', rawApiKey ? `exists (${rawApiKey.substring(0, 3)}...)` : 'undefined or empty');
```

**建议修复**:
- 在生产环境中移除所有敏感信息的日志输出
- 使用环境变量控制是否输出调试信息
- 完全移除 API 密钥的任何日志输出

---

#### 1.2 SSRF (服务端请求伪造) 风险 (HIGH)
**位置**: `server/src/lib/githubEnrichment.ts:189-207` 和 `server/src/routes/hub.ts:277-405`

**问题描述**: `POST /servers/submit` 接口接受用户提供的 URL，并使用 `axios.get()` 获取内容。虽然有 GitHub URL 的基本验证，但 `fetchReadmeContent` 函数会尝试获取任意 URL 的内容。

```typescript
// fetchReadmeContent 函数会获取任意 URL
} else {
  // Try to fetch content from the URL directly
  const response = await axios.get(url);
  return response.data;
}
```

**风险**:
- 攻击者可以利用服务器作为代理访问内网资源
- 可能泄露云环境中的元数据端点 (如 AWS 169.254.169.254)
- 可能导致拒绝服务攻击

**建议修复**:
1. 实现 URL 白名单机制，只允许访问 GitHub 和受信任的域名
2. 阻止对私有 IP 地址 (10.x.x.x, 172.16-31.x.x, 192.168.x.x, 127.x.x.x) 的请求
3. 阻止对云元数据端点的请求
4. 设置请求超时和响应大小限制

---

### 2. 中风险问题

#### 2.1 输入验证不充分 (MEDIUM)
**位置**: `server/src/routes/hub.ts:102-240`

**问题描述**: `POST /search_servers` 接口对用户输入的处理缺少严格的验证：

```typescript
const categoryKey = req.body.categoryKey as string;
const requestedLocale = (req.body.locale as string) || 'en';
const searchFor = req.body.search_for as string;
```

**风险**:
- `searchFor` 参数直接用于字符串匹配，未进行长度限制或特殊字符过滤
- `locale` 参数可用于路径遍历攻击（虽然有 `normalizeLocale` 函数，但验证不够严格）

**建议修复**:
1. 对所有字符串输入添加长度限制
2. 使用正则表达式验证 `locale` 格式
3. 对 `categoryKey` 使用白名单验证
4. 实现请求体大小限制

---

#### 2.2 文件操作路径注入风险 (MEDIUM)
**位置**: `server/src/routes/hub.ts:370-375`

**问题描述**: 文件名生成使用用户提供的 `name` 字段：

```typescript
const sanitizedName = extractedInfo.name.toLowerCase().replace(/[^a-z0-9]/g, '');
const filename = `${hubId}_${sanitizedName}.json`;
```

虽然有基本的清理（移除非字母数字字符），但缺少对文件名长度的限制。

**建议修复**:
- 添加文件名长度限制（如最大 255 字符）
- 验证生成的路径在预期目录内

---

#### 2.3 命令行参数注入风险 (MEDIUM)
**位置**: `server/src/data/process_githubinfo.ts:16-26`

**问题描述**: 命令行参数解析虽然简单，但 `parseInt` 的结果可能导致意外行为：

```typescript
const batchSize = parseInt(args[i + 1], 10);
if (!isNaN(batchSize) && batchSize > 0) {
  BATCH_SIZE = batchSize;
}
```

**建议修复**:
- 添加最大值限制以防止资源耗尽
- 验证输入为有效整数

---

### 3. 低风险问题

#### 3.1 详细的错误信息泄露 (LOW)
**位置**: 多处

**问题描述**: 多个端点在错误响应中返回详细的错误信息：

```typescript
console.error('Error serving hub MCP servers:', error);
res.status(500).json({ error: 'Internal server error' });
```

虽然响应中是通用消息，但控制台日志可能包含敏感堆栈信息。

**建议修复**:
- 在生产环境中使用结构化日志
- 避免在日志中记录敏感的请求参数

---

#### 3.2 缺少速率限制 (LOW)
**位置**: `server/src/routes/hub.ts`

**问题描述**: API 端点缺少速率限制，可能导致：
- 暴力枚举攻击
- 资源耗尽
- API 配额消耗（GitHub API）

**建议修复**:
- 实现基于 IP 和用户的速率限制
- 对 `POST /servers/submit` 等敏感端点设置更严格的限制

---

#### 3.3 缺少 HTTPS 重定向 (LOW)
**位置**: 服务器配置

**问题描述**: 未发现强制 HTTPS 的配置。

**建议修复**:
- 在生产环境中强制 HTTPS
- 设置 HSTS 头

---

### 4. 代码质量与最佳实践

#### 4.1 setup.sh 安全性改进 (POSITIVE)
**提交**: `87182e22`

**正面评价**: 该提交添加了 `set -e` 并将 `npm install` 改为 `npm ci`：
```bash
set -e
npm ci
```

这是一个良好的安全实践：
- `set -e` 确保脚本在出错时立即退出，避免在错误状态下继续执行
- `npm ci` 比 `npm install` 更安全，因为它严格按照 `package-lock.json` 安装，防止依赖篡改

---

#### 4.2 环境变量配置 (NEEDS IMPROVEMENT)
**位置**: `server/.env.example`

**问题**: `.env.example` 文件模板中使用了明文占位符，但注释格式可能引起混淆：
```
OPENAI_API_KEY={{your your_api_key_here}}
```

**建议**:
- 使用更明确的占位符格式
- 添加安全注释说明

---

#### 4.3 TypeScript 类型安全 (POSITIVE)
**提交**: `d8d0a801`

**正面评价**: 使用 TypeScript 接口定义数据结构，提高了类型安全性：

```typescript
export interface McpServer {
  githubLatestCommit?: string;
  githubForks?: number;
  licenseType?: string | null;
  [key: string]: string | number | boolean | string[] | null | undefined;
}
```

但索引签名 `[key: string]` 可能绕过类型检查，建议考虑更严格的类型定义。

---

## 修复优先级建议

| 优先级 | 问题 | 建议修复时间 |
|--------|------|--------------|
| P0 | SSRF 风险 | 立即修复 |
| P0 | 敏感信息日志泄露 | 立即修复 |
| P1 | 输入验证不充分 | 1周内 |
| P1 | 文件操作路径注入 | 1周内 |
| P2 | 命令行参数验证 | 2周内 |
| P2 | 速率限制 | 2周内 |
| P3 | 其他低风险问题 | 迭代修复 |

---

## 总结

本次评审发现 **2 个高风险问题**、**3 个中风险问题** 和 **3 个低风险问题**。

主要安全风险集中在：
1. **SSRF 漏洞** - 最关键的问题，需要立即修复
2. **敏感信息泄露** - 日志中可能暴露 API 密钥
3. **输入验证** - 多个端点缺少严格的输入验证

建议在部署到生产环境前优先修复高风险和中风险问题。项目整体代码结构清晰，使用了 TypeScript 提高类型安全性，setup.sh 的改进也体现了对安全的关注。

---

**评审人**: CodeBuddy Code Security Review
**评审完成日期**: 2026-03-13
