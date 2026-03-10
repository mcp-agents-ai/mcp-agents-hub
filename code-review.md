# Code Security Review Report

**Project:** asdm-core-assets (MCP Marketplace)
**Review Date:** 2026-03-10
**Commits Reviewed:** Last 10 commits (6c07510 to d8d0a80)

---

## Executive Summary

This security review analyzed the last 10 commits in the codebase, focusing on identifying potential security vulnerabilities in TypeScript, Shell scripts, and configuration files. The review found **7 security issues** ranging from low to medium severity, with no critical vulnerabilities detected.

---

## Commits Reviewed

| Commit | Description |
|--------|-------------|
| `6c07510` | docs: Add comprehensive CLAUDE.md for development guidance |
| `467e913` | Merge PR #64 - feat/leixu/improve-setup |
| `87182e2` | fix: Ensure script exits on error and use npm ci |
| `0b48a07` | feat: Enhance project setup with nvm instructions |
| `909611d` | Merge PR #63 - feat/leixu/mcp_server_info_enrich |
| `7ee4ec3` | update github info |
| `24352cd` | feat: Add batch size option to process_githubinfo script |
| `a27b483` | fix: Rename update-server-types script |
| `a7365b5` | Merge PR #62 - feat/leixu/mcp_server_info_enrich |
| `d8d0a80` | feat: Add githubLatestCommit and githubForks fields |

---

## Security Findings

### 1. Sensitive Information Exposure in Logs (Medium)

**Location:** `server/src/lib/config.ts:47-49`

**Description:** The configuration module logs partial API key information to the console during startup. While only the first 3 characters are logged, this practice could inadvertently expose sensitive credential patterns in production logs.

```typescript
console.log('Raw API Key from process.env:', rawApiKey ? `exists (${rawApiKey.substring(0, 3)}...)` : 'undefined or empty');
console.log('Raw OPENAI_BASE_URL from process.env:', process.env.OPENAI_BASE_URL || 'undefined or empty');
```

**Risk:** Information disclosure through log files, potential for credential pattern recognition.

**Recommendation:**
- Remove API key logging entirely in production environments
- Use environment-based conditional logging
- Implement a secure logging mechanism that masks all sensitive data

```typescript
// Recommended approach
if (process.env.NODE_ENV !== 'production') {
  console.log('API Key configured:', rawApiKey ? 'YES' : 'NO');
}
```

---

### 2. CORS Configuration Too Permissive (Medium)

**Location:** `server/src/server.ts:10`

**Description:** The CORS middleware is configured with default settings (`app.use(cors())`), which allows requests from any origin. This creates a potential security risk for cross-origin attacks.

```typescript
app.use(cors());
```

**Risk:** Cross-Origin Resource Sharing (CORS) misconfiguration could allow unauthorized domains to access the API.

**Recommendation:**
- Configure CORS with explicit allowed origins
- Implement origin validation based on environment

```typescript
// Recommended approach
import cors from 'cors';

const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? process.env.ALLOWED_ORIGINS?.split(',') || []
    : '*',
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
```

---

### 3. Missing Rate Limiting (Medium)

**Location:** `server/src/server.ts`, `server/src/routes/hub.ts`

**Description:** The API endpoints lack rate limiting protection. Public endpoints like `/v1/hub/servers/submit` accept GitHub URL submissions without any rate limiting, making them vulnerable to abuse and potential DoS attacks.

**Affected Endpoints:**
- `POST /v1/hub/servers/submit` - Server submission endpoint
- `GET /v1/hub/servers/:hubId` - Server details endpoint
- `POST /v1/hub/search_servers` - Search endpoint

**Risk:** API abuse, resource exhaustion, potential denial of service.

**Recommendation:**
- Implement rate limiting using packages like `express-rate-limit`
- Apply different limits for different endpoint types

```typescript
import rateLimit from 'express-rate-limit';

const submitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: 'Too many submissions, please try again later'
});

app.post('/v1/hub/servers/submit', submitLimiter, handler);
```

---

### 4. Input Validation Insufficient for GitHub URL (Low)

**Location:** `server/src/routes/hub.ts:287-291`

**Description:** The server submission endpoint validates GitHub URLs using only a simple string prefix check (`startsWith`). This validation is insufficient and could allow malformed or malicious URLs to pass.

```typescript
// Check if URL is a valid GitHub URL
if (!githubUrl.startsWith('https://github.com/')) {
  res.status(400).json({ error: 'Invalid GitHub URL format. URL must start with https://github.com/' });
  return;
}
```

**Risk:** URL injection, potential for SSRF-like attacks if the URL is used for internal operations.

**Recommendation:**
- Implement proper URL validation using a URL parsing library or regex
- Validate the URL structure more thoroughly

```typescript
import { URL } from 'url';

function isValidGitHubUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.hostname === 'github.com' &&
           parsedUrl.protocol === 'https:' &&
           /^\/[^/]+\/[^/]+/.test(parsedUrl.pathname);
  } catch {
    return false;
  }
}
```

---

### 5. Error Messages May Leak Implementation Details (Low)

**Location:** `server/src/routes/hub.ts:403`, `server/src/lib/githubEnrichment.ts:167`

**Description:** Error responses include detailed error messages and stack traces in some cases, which could reveal internal implementation details to attackers.

```typescript
catch (error) {
  console.error('Error submitting new server:', error);
  res.status(500).json({ error: 'Internal server error while submitting server' });
}
```

**Risk:** Information disclosure through error messages.

**Recommendation:**
- Return generic error messages to clients
- Log detailed errors server-side only

---

### 6. Missing Security Headers (Low)

**Location:** `server/src/server.ts`

**Description:** The Express server does not implement security headers such as Content-Security-Policy, X-Frame-Options, or X-Content-Type-Options. These headers help protect against common web vulnerabilities.

**Risk:** XSS, clickjacking, MIME type sniffing attacks.

**Recommendation:**
- Use `helmet` middleware to add security headers

```typescript
import helmet from 'helmet';

app.use(helmet());
```

---

### 7. File System Operations Without Path Validation (Low)

**Location:** `server/src/routes/hub.ts:370-375`

**Description:** File paths are constructed using user-provided data (extracted name from GitHub README) without sufficient path traversal validation. While some sanitization exists, it may not be comprehensive.

```typescript
const splitDirPath = path.join(__dirname, '..', 'data', 'split');
const sanitizedName = extractedInfo.name.toLowerCase().replace(/[^a-z0-9]/g, '');
const filename = `${hubId}_${sanitizedName}.json`;
const filePath = path.join(splitDirPath, filename);
```

**Risk:** Potential for path traversal if sanitization is bypassed.

**Recommendation:**
- Validate the final path is within the expected directory
- Add explicit path traversal checks

```typescript
function isPathSafe(baseDir: string, targetPath: string): boolean {
  const resolved = path.resolve(baseDir, targetPath);
  return resolved.startsWith(path.resolve(baseDir));
}
```

---

## Positive Security Practices Observed

1. **Environment Variable Usage:** API keys and sensitive configuration are properly stored in environment variables using dotenv.

2. **.env Files Excluded:** The `.env.example` files provide templates without actual credentials, and actual `.env` files are not tracked in git.

3. **Script Exit on Error:** The `setup.sh` script properly uses `set -e` to exit on errors (commit 87182e2).

4. **npm ci for Consistent Dependencies:** Using `npm ci` instead of `npm install` ensures consistent dependency versions (commit 87182e2).

5. **Input Sanitization:** File names are sanitized to remove special characters before use in paths.

6. **UUID for Identifiers:** Using UUID for hubId generation prevents predictable IDs.

---

## Summary Table

| # | Finding | Severity | Status |
|---|---------|----------|--------|
| 1 | Sensitive Information in Logs | Medium | Needs Fix |
| 2 | Permissive CORS Configuration | Medium | Needs Fix |
| 3 | Missing Rate Limiting | Medium | Needs Fix |
| 4 | Insufficient GitHub URL Validation | Low | Needs Fix |
| 5 | Error Message Information Disclosure | Low | Needs Fix |
| 6 | Missing Security Headers | Low | Needs Fix |
| 7 | File Path Validation | Low | Needs Fix |

---

## Recommendations Priority

### High Priority
1. Configure CORS properly with allowed origins
2. Implement rate limiting on public endpoints
3. Remove sensitive data from production logs

### Medium Priority
4. Add helmet middleware for security headers
5. Implement robust URL validation
6. Sanitize error messages sent to clients

### Low Priority
7. Add comprehensive path validation for file operations

---

## Conclusion

The codebase demonstrates good security awareness in several areas, including proper environment variable handling and input sanitization. However, there are important security improvements needed, particularly around CORS configuration, rate limiting, and logging of sensitive information. Implementing the recommended fixes will significantly improve the security posture of the application.

---

*Report generated by automated security review process.*
