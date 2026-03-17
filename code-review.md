# 代码安全审查报告

**项目**: asdm-core-assets (MCP Agents Hub)
**审查范围**: 最近10个commit (6c07510 -> d8d0a80)
**审查日期**: 2026年3月17日
**审查重点**: 安全问题

---

## 执行摘要

本次审查覆盖了最近10个commit，主要涉及：
- 项目配置和文档改进
- 环境设置脚本优化
- MCP服务器数据类型扩展
- GitHub信息批处理功能增强

**总体安全评级**: ⚠️ 中等风险

发现若干需要关注的安全问题，主要集中在敏感信息处理、输入验证和外部API交互方面。

---

## Commit 概览

| Commit | 描述 | 安全影响 |
|--------|------|----------|
| 6c07510 | 添加 CLAUDE.md 开发指南 | 低风险 |
| 467e913 | 合并PR #64 | N/A |
| 87182e2 | 修复脚本退出机制和npm ci | ✅ 安全改进 |
| 0b48a07 | 添加环境设置脚本 | ⚠️ 中等风险 |
| 909611d | 合并PR #63 | N/A |
| 7ee4ec3 | 更新GitHub信息数据 | 低风险 |
| 24352cd | 添加批处理选项 | ⚠️ 中等风险 |
| a27b483 | 重命名脚本和更新数据 | 低风险 |
| a7365b5 | 合并PR #62 | N/A |
| d8d0a80 | 扩展MCPServer接口和排序功能 | ⚠️ 中等风险 |

---

## 发现的安全问题

### 1. 🔴 高优先级：敏感信息日志泄露

**位置**: `server/src/lib/config.ts:22-49`

**问题描述**:
配置文件在加载时会将API密钥的前几个字符输出到日志中，这在生产环境中可能导致敏感信息泄露。

```typescript
// 问题代码 (config.ts:26)
console.log(`API key in .env: ${apiKeyValue ? `defined (${apiKeyValue.substring(0, 3)}...)` : 'empty'}`);

// 问题代码 (config.ts:48)
console.log('Raw API Key from process.env:', rawApiKey ? `exists (${rawApiKey.substring(0, 3)}...)` : 'undefined or empty');
```

**风险评估**:
- 虽然只输出前3个字符，但日志可能被未授权人员访问
- 在容器化环境中，日志可能被集中存储并暴露给更多人员
- 攻击者可能利用部分信息确认密钥格式或进行推测攻击

**建议修复**:
```typescript
// 只输出密钥是否存在，不输出任何字符
console.log('API key in .env:', apiKeyValue ? 'defined' : 'empty');
console.log('Raw API Key from process.env:', rawApiKey ? 'exists' : 'undefined or empty');
```

---

### 2. 🟡 中等优先级：服务器端请求伪造 (SSRF) 风险

**位置**: `server/src/lib/githubEnrichment.ts:189-207`

**问题描述**:
`fetchReadmeContent` 函数可以接受任意URL并直接请求，除了检查是否以 `https://github.com` 开头外，对于其他URL缺乏验证。

```typescript
// 问题代码 (githubEnrichment.ts:197-201)
} else {
  // Try to fetch content from the URL directly
  const response = await axios.get(url);
  console.log(`Successfully fetched content from ${url}`);
  return response.data;
}
```

**风险评估**:
- 攻击者可能通过提交端点提供恶意URL
- 可能导致对内部服务的未授权访问
- 可能暴露内部网络信息

**建议修复**:
```typescript
// 添加URL白名单验证
const ALLOWED_DOMAINS = ['github.com', 'raw.githubusercontent.com'];

export async function fetchReadmeContent(url: string): Promise<string> {
  try {
    const parsedUrl = new URL(url);

    // 验证域名
    if (!ALLOWED_DOMAINS.some(domain => parsedUrl.hostname.endsWith(domain))) {
      throw new Error(`URL domain not allowed: ${parsedUrl.hostname}`);
    }

    // 禁止访问私有IP地址
    if (isPrivateIP(parsedUrl.hostname)) {
      throw new Error('Access to private IP addresses is not allowed');
    }

    // ... rest of the code
  } catch (error) {
    console.error(`Error fetching content from ${url}:`, error);
    return '';
  }
}
```

---

### 3. 🟡 中等优先级：输入验证不足

**位置**: `server/src/routes/hub.ts:277-405`

**问题描述**:
`/servers/submit` 端点对输入的验证较为简单，可能接受恶意构造的数据。

```typescript
// 当前验证 (hub.ts:287-291)
if (!githubUrl.startsWith('https://github.com/')) {
  res.status(400).json({ error: 'Invalid GitHub URL format. URL must start with https://github.com/' });
  return;
}
```

**风险评估**:
- 只验证URL前缀，不验证URL格式是否有效
- 可能接受 `https://github.com.evil.com` 等恶意URL
- 未对GitHub仓库路径深度进行限制

**建议修复**:
```typescript
// 更严格的URL验证
function validateGitHubUrl(url: string): { valid: boolean; owner?: string; repo?: string; error?: string } {
  try {
    const parsedUrl = new URL(url);

    // 严格检查域名
    if (parsedUrl.hostname !== 'github.com') {
      return { valid: false, error: 'URL must be exactly github.com' };
    }

    // 解析路径
    const pathParts = parsedUrl.pathname.split('/').filter(Boolean);

    // GitHub仓库URL格式: /owner/repo
    if (pathParts.length < 2 || pathParts.length > 5) {
      return { valid: false, error: 'Invalid GitHub repository path format' };
    }

    const owner = pathParts[0];
    const repo = pathParts[1];

    // 验证owner和repo名称格式 (GitHub命名规则)
    if (!/^[a-zA-Z0-9_-]+$/.test(owner) || !/^[a-zA-Z0-9._-]+$/.test(repo)) {
      return { valid: false, error: 'Invalid owner or repository name format' };
    }

    return { valid: true, owner, repo };
  } catch (error) {
    return { valid: false, error: 'Invalid URL format' };
  }
}
```

---

### 4. 🟡 中等优先级：批处理脚本缺少速率限制

**位置**: `server/src/data/process_githubinfo.ts` (commit 24352cd)

**问题描述**:
新增的批处理功能允许处理大量文件，但没有实现GitHub API的速率限制保护。

```typescript
// 当前代码缺少速率限制
for (const [index, file] of filesToProcessInThisBatch.entries()) {
  try {
    const hubId = getHubIdFromFilename(file);
    // ... 直接调用GitHub API，无速率限制
  }
}
```

**风险评估**:
- 可能触发GitHub API速率限制导致服务中断
- 大量请求可能被GitHub标记为滥用
- API密钥可能被暂时禁用

**建议修复**:
```typescript
import { setTimeout as sleep } from 'timers/promises';

const RATE_LIMIT_DELAY = 1000; // 1秒延迟

for (const [index, file] of filesToProcessInThisBatch.entries()) {
  try {
    const hubId = getHubIdFromFilename(file);

    // 添加速率限制
    if (index > 0) {
      await sleep(RATE_LIMIT_DELAY);
    }

    // ... process file
  }
}
```

---

### 5. 🟢 低优先级：setup.sh 脚本安全性

**位置**: `setup.sh` (commit 0b48a07 和 87182e2)

**改进点**:
commit 87182e2 添加了 `set -e` 并将 `npm install` 改为 `npm ci`，这是良好的安全改进。

**剩余风险**:
```bash
# 问题：从网络下载并执行nvm安装脚本 (setup.sh:14-15)
echo "   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash"
```

**建议改进**:
```bash
# 添加校验和验证
NVM_VERSION="v0.40.1"
NVM_INSTALL_URL="https://raw.githubusercontent.com/nvm-sh/nvm/${NVM_VERSION}/install.sh"
EXPECTED_SHA256="<checksum_here>"

# 下载并验证
curl -o /tmp/nvm_install.sh "$NVM_INSTALL_URL"
ACTUAL_SHA256=$(sha256sum /tmp/nvm_install.sh | cut -d' ' -f1)

if [ "$ACTUAL_SHA256" != "$EXPECTED_SHA256" ]; then
    echo "❌ SHA256 verification failed! Aborting."
    exit 1
fi

bash /tmp/nvm_install.sh
```

---

### 6. 🟢 低优先级：JSON解析无防护

**位置**: `server/src/lib/githubEnrichment.ts:253`

**问题描述**:
直接使用 `JSON.parse` 解析LLM返回的内容，可能导致解析错误。

```typescript
// 当前代码 (githubEnrichment.ts:253)
return JSON.parse(jsonMatch[0]);
```

**建议修复**:
```typescript
try {
  return JSON.parse(jsonMatch[0]);
} catch (parseError) {
  console.error('Failed to parse LLM response as JSON:', parseError);
  // 返回默认结构而不是可能导致崩溃
  return {
    name: '',
    description: '',
    Installation_instructions: '',
    Usage_instructions: '',
    features: [],
    prerequisites: []
  };
}
```

---

## 数据文件变更审查

commit 7ee4ec3 修改了大量JSON数据文件。经审查，这些变更主要是添加GitHub元数据字段，未发现安全问题。

**注意**: 确保这些JSON文件不被版本控制中的敏感信息污染。

---

## 环境变量安全检查

**当前配置** (`server/src/lib/config.ts`):

| 变量 | 处理方式 | 安全状态 |
|------|----------|----------|
| OPENAI_API_KEY | 从.env加载 | ✅ 正确 |
| OPENAI_BASE_URL | 有默认值和验证 | ✅ 正确 |
| GITHUB_API_TOKEN | 从.env加载 | ✅ 正确 |
| MODEL_NAME | 直接使用 | ✅ 无敏感信息 |
| CACHE_TTL | 数字解析 | ✅ 安全 |
| PORT | 数字解析 | ✅ 安全 |

**建议**:
- 添加 `.env.example` 文件作为模板
- 确保 `.env` 文件在 `.gitignore` 中

---

## 依赖安全检查

建议运行以下命令检查已知漏洞：

```bash
npm audit
npm audit fix
```

---

## 安全改进建议汇总

### 立即修复 (高优先级)
1. 移除config.ts中敏感信息的日志输出
2. 实现SSRF防护机制

### 短期修复 (中等优先级)
3. 加强URL输入验证
4. 添加GitHub API速率限制
5. 改进JSON解析的错误处理

### 长期改进 (建议)
6. 实现请求速率限制中间件
7. 添加输入消毒功能
8. 实现API密钥轮换机制
9. 添加安全审计日志
10. 考虑实施内容安全策略(CSP)

---

## 结论

本次审查发现的多数问题属于中等风险级别，主要与输入验证和敏感信息处理有关。建议按照优先级顺序修复上述问题，并考虑实施定期的安全审查流程。

**审查完成时间**: 2026年3月17日
