# Security Code Review Report

**Project:** MCP Agents Hub (MCP Marketplace)
**Date:** March 5, 2026
**Reviewer:** Automated Security Analysis

---

## Executive Summary

This security review of the MCP Agents Hub codebase identified **22 vulnerabilities** across dependencies and several **critical security issues** in the application code. The most severe findings include:

- **CRITICAL**: Hardcoded Application Insights connection string with instrumentation key exposed in frontend source code
- **HIGH**: Multiple outdated dependencies with known vulnerabilities (axios, react-router-dom, vite, rollup)
- **HIGH**: Unrestricted CORS configuration allowing any origin
- **HIGH**: No authentication/authorization on API endpoints
- **MEDIUM**: Sensitive data logging (partial API key exposure)
- **MEDIUM**: Path traversal potential in file operations

### Risk Rating Overview

| Severity | Count | Status |
|----------|-------|--------|
| Critical | 1 | Requires Immediate Action |
| High | 10 | Requires Prompt Action |
| Medium | 7 | Should Be Addressed |
| Low | 5 | Recommended to Fix |

---

## Detailed Findings

### 1. Critical Security Issues

#### 1.1 Hardcoded Credentials in Source Code

**Severity:** CRITICAL
**Location:** `client/src/main.tsx:13`
**CWE:** CWE-798 (Use of Hard-coded Credentials)

```typescript
const appInsights = new ApplicationInsights({
  config: {
    connectionString: 'InstrumentationKey=43485096-3cae-436a-84ea-6f813c67476b;IngestionEndpoint=https://southeastasia-1.in.applicationinsights.azure.com/;LiveEndpoint=https://southeastasia.livediagnostics.monitor.azure.com/;ApplicationId=14d289ca-9e97-4472-8636-8525948fce3c',
    ...
  }
});
```

**Impact:**
- The instrumentation key and connection details are publicly exposed in the built JavaScript bundle
- Attackers can use this key to send malicious telemetry data
- Potential for data injection into monitoring systems
- Azure subscription and resource exposure

**Recommendation:**
- Move the connection string to environment variables
- Use a build-time configuration system that injects values at deployment
- Consider using Azure Managed Identities for authentication

```typescript
// Recommended fix
const appInsights = new ApplicationInsights({
  config: {
    connectionString: import.meta.env.VITE_APPINSIGHTS_CONNECTION_STRING,
    ...
  }
});
```

---

### 2. High Severity Issues

#### 2.1 Unrestricted CORS Configuration

**Severity:** HIGH
**Location:** `server/src/server.ts:10`
**CWE:** CWE-942 (Overly Permissive CORS Policy)

```typescript
app.use(cors());
```

**Impact:**
- Allows requests from any origin
- Enables cross-site request forgery (CSRF) attacks
- Sensitive data can be accessed by malicious websites

**Recommendation:**
- Restrict CORS to known origins
- Implement origin whitelist based on environment

```typescript
// Recommended fix
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];

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

#### 2.2 Missing Authentication/Authorization

**Severity:** HIGH
**Location:** `server/src/routes/hub.ts`, `server/src/routes/mcp.ts`
**CWE:** CWE-306 (Missing Authentication for Critical Function)

**Impact:**
- All API endpoints are publicly accessible without authentication
- The `/v1/hub/servers/submit` endpoint allows unauthenticated server submissions
- No rate limiting to prevent abuse

**Recommendation:**
- Implement API key authentication for administrative endpoints
- Add rate limiting middleware
- Consider JWT-based authentication for sensitive operations

```typescript
// Example: Add authentication middleware
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/v1/hub', limiter);
```

#### 2.3 Vulnerable Dependencies (npm audit results)

**Severity:** HIGH
**Location:** `package.json` files

The following high-severity vulnerabilities were identified:

| Package | Vulnerability | Severity | Fix Available |
|---------|--------------|----------|---------------|
| axios | SSRF via baseURL | High | Yes |
| react-router-dom | XSS via Open Redirects | High | Yes |
| @remix-run/router | XSS via Open Redirects | High | Yes |
| rollup | Path Traversal | High | Yes |
| glob | Command Injection | High | Yes |
| form-data | Insecure Random | Critical | Yes |
| minimatch | ReDoS | High | Yes |

**Recommendation:**
Run `npm audit fix` to apply available fixes, then manually review and update remaining packages:

```bash
npm audit fix
npm update react-router-dom axios vite
```

#### 2.4 Server-Side Request Forgery (SSRF) Risk

**Severity:** HIGH
**Location:** `server/src/lib/githubEnrichment.ts:189-207`
**CWE:** CWE-918 (Server-Side Request Forgery)

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

**Impact:**
- The `else` branch allows arbitrary URL fetching
- Could be exploited to access internal services
- Potential for data exfiltration

**Recommendation:**
- Restrict URL fetching to allowed domains only
- Implement URL validation and sanitization
- Block private IP ranges (RFC 1918)

```typescript
// Recommended fix
const ALLOWED_DOMAINS = ['github.com', 'raw.githubusercontent.com'];

function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (!ALLOWED_DOMAINS.some(domain => parsed.hostname.endsWith(domain))) {
      return false;
    }
    // Block private IP ranges
    const hostname = parsed.hostname;
    if (hostname === 'localhost' || hostname.startsWith('127.') ||
        hostname.startsWith('10.') || hostname.startsWith('192.168.') ||
        hostname.match(/^172\.(1[6-9]|2[0-9]|3[0-1])\./)) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}
```

#### 2.5 Path Traversal Risk

**Severity:** HIGH
**Location:** `server/src/routes/hub.ts:370-375`
**CWE:** CWE-22 (Path Traversal)

```typescript
const splitDirPath = path.join(__dirname, '..', 'data', 'split');
const sanitizedName = extractedInfo.name.toLowerCase().replace(/[^a-z0-9]/g, '');
const filename = `${hubId}_${sanitizedName}.json`;
const filePath = path.join(splitDirPath, filename);
```

**Impact:**
- While there is some sanitization, `hubId` is generated via UUID and not validated
- Potential for directory traversal if `hubId` is manipulated

**Recommendation:**
- Validate that the resolved path is within the expected directory
- Use path.resolve and check the result

```typescript
// Recommended fix
const filePath = path.join(splitDirPath, filename);
const resolvedPath = path.resolve(filePath);
const resolvedDir = path.resolve(splitDirPath);

if (!resolvedPath.startsWith(resolvedDir + path.sep)) {
  throw new Error('Invalid file path');
}
```

---

### 3. Medium Severity Issues

#### 3.1 Sensitive Data Logging

**Severity:** MEDIUM
**Location:** `server/src/lib/config.ts:26-27, 48`
**CWE:** CWE-532 (Information Exposure Through Log Files)

```typescript
console.log(`API key in .env: ${apiKeyValue ? `defined (${apiKeyValue.substring(0, 3)}...)` : 'empty'}`);
console.log('Raw API Key from process.env:', rawApiKey ? `exists (${rawApiKey.substring(0, 3)}...)` : 'undefined or empty');
```

**Impact:**
- Partial API key exposure in logs
- Logs may be accessible to unauthorized users
- Information leakage aids attackers

**Recommendation:**
- Remove sensitive data from log statements
- Use secure logging practices

```typescript
// Recommended fix
console.log(`API key in .env: ${apiKeyValue ? 'defined' : 'empty'}`);
console.log('Raw API Key from process.env:', rawApiKey ? 'exists' : 'undefined or empty');
```

#### 3.2 Verbose Error Messages

**Severity:** MEDIUM
**Location:** `server/src/routes/hub.ts`, `server/src/routes/mcp.ts`
**CWE:** CWE-209 (Information Exposure Through Error Message)

```typescript
} catch (error) {
  console.error('Error serving MCP servers:', error);
  res.status(500).json({ error: 'Internal server error' });
}
```

While the client response is generic, console.error may log sensitive stack traces.

**Recommendation:**
- Implement structured error logging
- Ensure error details are not exposed to clients
- Use error IDs for tracking without exposing internals

#### 3.3 No Input Size Limits

**Severity:** MEDIUM
**Location:** `server/src/routes/hub.ts:276-405`
**CWE:** CWE-770 (Allocation of Resources Without Limits)

**Impact:**
- No validation on README content size
- Potential for memory exhaustion attacks
- Large payloads could crash the server

**Recommendation:**
- Implement maximum content size limits
- Add request body size limits

```typescript
// Add to express configuration
app.use(express.json({ limit: '1mb' }));
```

#### 3.4 Missing Security Headers

**Severity:** MEDIUM
**Location:** `server/src/server.ts`
**CWE:** CWE-693 (Protection Mechanism Failure)

**Impact:**
- Missing HTTP security headers (HSTS, CSP, X-Frame-Options, etc.)
- Increased attack surface for XSS, clickjacking

**Recommendation:**
- Use Helmet.js middleware

```typescript
import helmet from 'helmet';

app.use(helmet());
```

#### 3.5 Insecure Docker Configuration

**Severity:** MEDIUM
**Location:** `server/Dockerfile`, `client/Dockerfile`
**CWE:** CWE-1104 (Use of Unmaintained Third Party Components)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
```

**Impact:**
- Running as root user by default
- No health checks defined
- Secrets may be included in image layers

**Recommendation:**
- Add non-root user
- Use multi-stage builds properly
- Add health checks

```dockerfile
FROM node:18-alpine
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
WORKDIR /app
COPY --chown=nodejs:nodejs package.json ./
RUN npm ci --only=production
COPY --chown=nodejs:nodejs . .
USER nodejs
HEALTHCHECK --interval=30s CMD node healthcheck.js
```

#### 3.6 Environment Variable Handling

**Severity:** MEDIUM
**Location:** `server/src/lib/config.ts`

The code has proper API key validation, but could be improved:

```typescript
apiKey: process.env.OPENAI_API_KEY || '',
apiKeyIsValid: Boolean(process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim() !== ''),
```

**Recommendation:**
- Fail fast on missing required secrets
- Use a configuration validation library like Joi or Zod

#### 3.7 Debug Information in Production

**Severity:** MEDIUM
**Location:** `server/src/routes/hub.ts`, various console.log statements

Multiple console.log statements print detailed request information that could leak sensitive data.

**Recommendation:**
- Use a proper logging library (Winston, Pino)
- Set log levels based on environment
- Remove or protect debug logs in production

---

### 4. Low Severity Issues

#### 4.1 Outdated Dependencies

**Severity:** LOW-MEDIUM
**Location:** `client/package.json`, `server/package.json`

Several packages have newer major versions available:
- React 18.3.1 (latest: 19.x)
- Vite 5.4.2 (latest: 6.x)
- Express 4.21.2 (latest: 5.x)

**Recommendation:** Plan updates for these packages, prioritizing security patches.

#### 4.2 Missing CSRF Protection

**Severity:** LOW
**Location:** `server/src/server.ts`

The application doesn't implement CSRF tokens for state-changing operations.

**Recommendation:** Implement CSRF protection using csurf or similar middleware.

#### 4.3 Insecure Direct Object References

**Severity:** LOW
**Location:** `server/src/routes/mcp.ts:27-70`

The `/download` endpoint accepts `mcpId` without validation that the user has access.

**Recommendation:** Implement access control checks if server data should be restricted.

#### 4.4 Missing Content-Type Validation

**Severity:** LOW
**Location:** `server/src/routes/hub.ts:277`

The submit endpoint doesn't validate Content-Type header.

**Recommendation:** Add explicit content-type validation.

#### 4.5 No Request Timeout Configuration

**Severity:** LOW
**Location:** `server/src/lib/githubEnrichment.ts`

External API calls (GitHub, LLM) have no timeout configuration.

**Recommendation:**
```typescript
const response = await axios.get(url, { timeout: 30000 });
```

---

### 5. Dependency Vulnerability Summary

Based on `npm audit`:

| Package | Version | Vulnerability | Severity |
|---------|---------|--------------|----------|
| form-data | 4.0.0-4.0.3 | Insecure random for boundary | Critical |
| axios | 1.6.0 | SSRF via baseURL | High |
| react-router-dom | 6.22.3 | XSS via Open Redirects | High |
| rollup | 4.0.0-4.58.0 | Path Traversal | High |
| glob | 10.2.0-10.4.5 | Command Injection | High |
| minimatch | <9.0.7 | ReDoS | High |
| vite | 5.0.0-5.4.20 | Multiple vulnerabilities | Moderate |
| lodash | 4.17.21 | Prototype Pollution | Moderate |
| nanoid | <3.3.8 | Predictable ID Generation | Moderate |
| js-yaml | 4.0.0-4.1.0 | Prototype Pollution | Moderate |
| @babel/helpers | <7.26.10 | ReDoS | Moderate |
| ajv | <6.14.0 | ReDoS | Moderate |
| qs | <=6.14.1 | DoS | Moderate |

**Total Vulnerabilities:** 22
- Critical: 1
- High: 8
- Moderate: 8
- Low: 5

---

## 6. Recommendations Summary

### Immediate Actions (Critical/High)

1. **Remove hardcoded credentials** from `client/src/main.tsx` and use environment variables
2. **Run `npm audit fix`** to address vulnerable dependencies
3. **Restrict CORS** to specific allowed origins
4. **Add rate limiting** to prevent abuse
5. **Implement authentication** for administrative endpoints
6. **Add security headers** using Helmet.js

### Short-Term Actions (Medium)

1. Remove sensitive data from log statements
2. Add input size limits and validation
3. Implement SSRF protection for URL fetching
4. Secure Docker configuration (non-root user, health checks)
5. Add request timeouts for external API calls

### Long-Term Actions (Low)

1. Update to latest major versions of dependencies
2. Implement CSRF protection
3. Add comprehensive input validation using a schema library
4. Set up proper logging infrastructure
5. Implement security monitoring and alerting

---

## 7. Security Checklist

- [ ] Remove hardcoded credentials
- [ ] Fix vulnerable dependencies
- [ ] Restrict CORS configuration
- [ ] Add authentication/authorization
- [ ] Implement rate limiting
- [ ] Add security headers (Helmet.js)
- [ ] Remove sensitive data from logs
- [ ] Add input validation and size limits
- [ ] Implement SSRF protection
- [ ] Secure Docker configuration
- [ ] Add request timeouts
- [ ] Implement CSRF protection
- [ ] Set up security logging
- [ ] Add health checks
- [ ] Document security procedures

---

## 8. Conclusion

The MCP Agents Hub codebase has several significant security issues that require attention, with the hardcoded credentials being the most critical. The good news is that most issues have straightforward fixes available. The codebase structure is well-organized, which will facilitate implementing these security improvements.

**Priority should be given to:**
1. Removing the hardcoded Application Insights connection string
2. Updating vulnerable dependencies
3. Implementing proper CORS and authentication controls

After addressing these issues, the application will have a significantly improved security posture.

---

*This report was generated by an automated security analysis. Manual review and testing are recommended for all findings.*
