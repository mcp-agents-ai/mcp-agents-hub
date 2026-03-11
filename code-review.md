# Security Code Review Report

**Project:** MCP Agents Hub (MCP Marketplace)
**Review Date:** March 11, 2026
**Reviewer:** Security Analysis

---

## Executive Summary

This security-focused code review identified **15 security issues** across the codebase, ranging from **Critical** to **Low** severity. The most pressing concerns involve exposed credentials in client-side code, permissive CORS configuration, and lack of input validation/rate limiting on API endpoints.

### Risk Matrix

| Severity | Count |
|----------|-------|
| Critical | 1 |
| High | 3 |
| Medium | 5 |
| Low | 6 |

---

## Critical Issues

### 1. Hardcoded Application Insights Connection String

**Location:** `client/src/main.tsx:13`

**Severity:** Critical

**Description:**
The Azure Application Insights connection string, including the instrumentation key, is hardcoded in the client-side code. This exposes sensitive telemetry configuration to all users and could be abused for data exfiltration or telemetry spoofing.

```typescript
const appInsights = new ApplicationInsights({
  config: {
    connectionString: 'InstrumentationKey=43485096-3cae-436a-84ea-6f813c67476b;IngestionEndpoint=https://southeastasia-1.in.applicationinsights.azure.com/;...',
    // ...
  }
});
```

**Impact:**
- Exposed telemetry credentials allow attackers to:
  - Send fraudulent telemetry data to your Application Insights instance
  - Potentially access monitoring data
  - Incur unexpected Azure costs

**Recommendation:**
- Move the connection string to environment variables
- Use `import.meta.env.VITE_APP_INSIGHTS_CONNECTION_STRING` for client-side configuration
- Create an `.env.example` with placeholder values
- Never commit actual connection strings to version control

```typescript
const appInsights = new ApplicationInsights({
  config: {
    connectionString: import.meta.env.VITE_APP_INSIGHTS_CONNECTION_STRING || '',
    // ...
  }
});
```

---

## High Severity Issues

### 2. Overly Permissive CORS Configuration

**Location:** `server/src/server.ts:10`

**Severity:** High

**Description:**
CORS is configured to allow requests from any origin without restrictions.

```typescript
app.use(cors());
```

**Impact:**
- Allows any website to make API requests to your backend
- Enables CSRF attacks from malicious websites
- Facilitates data exfiltration through cross-origin requests
- Allows malicious sites to enumerate your API

**Recommendation:**
Configure CORS with explicit allowed origins:

```typescript
import cors from 'cors';

const allowedOrigins = [
  'https://mcpagents.dev',
  'https://www.mcpagents.dev',
  process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : ''
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

### 3. Sensitive Information Logged to Console

**Location:** `server/src/lib/config.ts:23-29, 47-49`

**Severity:** High

**Description:**
API key prefixes and other sensitive information are logged to the console during startup.

```typescript
console.log(`API key in .env: ${apiKeyValue ? `defined (${apiKeyValue.substring(0, 3)}...)` : 'empty'}`);
console.log('Raw API Key from process.env:', rawApiKey ? `exists (${rawApiKey.substring(0, 3)}...)` : 'undefined or empty');
```

**Impact:**
- Sensitive key fragments may be captured in logs
- In production, logs may be accessible to unauthorized users
- Violates security best practices for credential handling

**Recommendation:**
- Remove all logging of API key information, even partial
- Only log boolean status (`true`/`false`) for credential validation

```typescript
console.log(`- API Key defined: ${config.openai.apiKeyIsValid}`);
// Remove all other API key logging
```

### 4. No Rate Limiting on API Endpoints

**Location:** `server/src/routes/hub.ts`, `server/src/routes/mcp.ts`

**Severity:** High

**Description:**
All API endpoints lack rate limiting, making them vulnerable to abuse and denial-of-service attacks.

**Impact:**
- Attackers can make unlimited API requests
- Potential for DoS attacks exhausting server resources
- Uncontrolled LLM API usage could lead to significant costs
- Brute force attacks on submission endpoint

**Recommendation:**
Implement rate limiting using `express-rate-limit`:

```typescript
import rateLimit from 'express-rate-limit';

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later'
});

const submissionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // limit each IP to 5 submissions per hour
  message: 'Too many submissions, please try again later'
});

app.use(generalLimiter);
app.use('/v1/hub/servers/submit', submissionLimiter);
```

---

## Medium Severity Issues

### 5. Insufficient Input Validation

**Location:** `server/src/routes/hub.ts:277-405` (POST /servers/submit)

**Severity:** Medium

**Description:**
The server submission endpoint has minimal input validation. Only basic GitHub URL format is checked.

```typescript
if (!githubUrl.startsWith('https://github.com/')) {
  res.status(400).json({ error: 'Invalid GitHub URL format. URL must start with https://github.com/' });
  return;
}
```

**Impact:**
- Invalid or malicious URLs could cause unexpected behavior
- URL parsing with `split('/')` is fragile and could be exploited
- No validation of URL length, special characters, or path traversal attempts

**Recommendation:**
Use a proper URL validation library and schema validation:

```typescript
import { z } from 'zod';

const submitSchema = z.object({
  githubUrl: z.string()
    .url()
    .max(500)
    .refine(url => url.startsWith('https://github.com/'), {
      message: 'Must be a valid GitHub repository URL'
    })
});

// In the route handler:
const result = submitSchema.safeParse(req.body);
if (!result.success) {
  res.status(400).json({ error: 'Invalid input', details: result.error.errors });
  return;
}
```

### 6. No Authentication/Authorization

**Location:** `server/src/server.ts`, all routes

**Severity:** Medium

**Description:**
All API endpoints are publicly accessible without any authentication mechanism.

**Impact:**
- Anyone can submit new servers to the marketplace
- No audit trail for who made changes
- Potential for spam or malicious content submissions
- No access control for administrative operations

**Recommendation:**
Implement authentication for sensitive operations:
- Use API keys for write operations
- Consider OAuth2/OIDC for user authentication
- Add admin-only endpoints for content moderation

### 7. Missing Security Headers (Helmet.js)

**Location:** `server/src/server.ts`

**Severity:** Medium

**Description:**
The Express server doesn't use Helmet.js or similar middleware to set security-related HTTP headers.

**Impact:**
- Missing protections against common web vulnerabilities:
  - X-Content-Type-Options: Prevents MIME sniffing
  - X-Frame-Options: Prevents clickjacking
  - Content-Security-Policy: Mitigates XSS
  - X-XSS-Protection: XSS filter

**Recommendation:**
Install and configure Helmet:

```typescript
import helmet from 'helmet';

app.use(helmet());
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", "data:", "https:"],
    connectSrc: ["'self'", "https://api.github.com"],
  }
}));
```

### 8. Potential SSRF via URL Fetching

**Location:** `server/src/lib/githubEnrichment.ts:189-206`

**Severity:** Medium

**Description:**
The `fetchReadmeContent` function can fetch content from arbitrary URLs if they don't start with `https://github.com`.

```typescript
} else {
  // Try to fetch content from the URL directly
  const response = await axios.get(url);
  console.log(`Successfully fetched content from ${url}`);
  return response.data;
}
```

**Impact:**
- Server-Side Request Forgery (SSRF) potential
- Could be used to access internal services
- Potential for data exfiltration
- Could be used to scan internal networks

**Recommendation:**
- Restrict URL fetching to known domains only
- Implement URL allowlisting
- Block internal IP ranges (10.x.x.x, 192.168.x.x, 172.16-31.x.x)

```typescript
export async function fetchReadmeContent(url: string): Promise<string> {
  // Only allow GitHub URLs
  if (!url.startsWith('https://github.com/') && !url.startsWith('https://raw.githubusercontent.com/')) {
    throw new Error('Only GitHub URLs are allowed');
  }
  // ... rest of function
}
```

### 9. Unsafe Dynamic File Path Construction

**Location:** `server/src/routes/hub.ts:370-375`

**Severity:** Medium

**Description:**
File paths are constructed using user-provided data without proper sanitization.

```typescript
const sanitizedName = extractedInfo.name.toLowerCase().replace(/[^a-z0-9]/g, '');
const filename = `${hubId}_${sanitizedName}.json`;
const filePath = path.join(splitDirPath, filename);
```

**Impact:**
- While basic sanitization exists, relying on name sanitization alone is insufficient
- UUID provides some protection but defense-in-depth is recommended

**Recommendation:**
Add additional validation:

```typescript
const sanitizedName = extractedInfo.name
  .toLowerCase()
  .replace(/[^a-z0-9]/g, '')
  .substring(0, 50); // Limit length

const filename = `${hubId}_${sanitizedName}.json`;

// Verify the resolved path is within the expected directory
const resolvedPath = path.resolve(splitDirPath, filename);
if (!resolvedPath.startsWith(path.resolve(splitDirPath))) {
  throw new Error('Invalid file path');
}
```

---

## Low Severity Issues

### 10. Verbose Error Messages

**Location:** Multiple files in `server/src/routes/`

**Severity:** Low

**Description:**
Error responses may contain internal details that could aid attackers.

```typescript
res.status(500).json({ error: 'Internal server error while submitting server' });
```

**Impact:**
- In development mode, stack traces might be exposed
- Internal error details could reveal system architecture

**Recommendation:**
- Use generic error messages in production
- Log detailed errors server-side only
- Consider an error handling middleware

### 11. No Request Size Limits

**Location:** `server/src/server.ts:11`

**Severity:** Low

**Description:**
The JSON body parser doesn't specify size limits.

```typescript
app.use(express.json());
```

**Impact:**
- Large payloads could exhaust server memory
- Potential for DoS through large request bodies

**Recommendation:**
```typescript
app.use(express.json({ limit: '10kb' }));
```

### 12. Cache Files May Contain Sensitive Data

**Location:** `server/src/lib/githubEnrichment.ts` (cache directory)

**Severity:** Low

**Description:**
Enriched server data is cached to files in `server/src/data/cached/`. These files may accumulate and contain potentially sensitive extracted content.

**Impact:**
- Disk space exhaustion over time
- Cached data could contain sensitive information from READMEs

**Recommendation:**
- Implement cache cleanup based on TTL
- Exclude sensitive patterns from cached content
- Consider in-memory caching with Redis instead

### 13. Docker Images May Contain Vulnerabilities

**Location:** `client/Dockerfile`, `server/Dockerfile`

**Severity:** Low

**Description:**
Dockerfiles use `node:18-alpine` but don't include security updates or vulnerability scanning.

```dockerfile
FROM node:18-alpine
```

**Impact:**
- Base images may contain known vulnerabilities
- No automated security scanning in CI/CD

**Recommendation:**
- Use specific image versions (e.g., `node:18.19.0-alpine`)
- Add dependency vulnerability scanning to CI/CD
- Consider using `node:18-alpine` with regular `apk upgrade`

### 14. GitHub Actions Using Outdated Actions

**Location:** `.github/workflows/docker-build.yml:18`

**Severity:** Low

**Description:**
The workflow uses an outdated version of the checkout action.

```yaml
uses: actions/checkout@v2
```

**Impact:**
- Older action versions may have known vulnerabilities
- Missing security fixes and features

**Recommendation:**
```yaml
uses: actions/checkout@v4
```

### 15. Development Server Binding to All Interfaces

**Location:** `client/vite.config.ts:20`

**Severity:** Low

**Description:**
The Vite development server binds to all network interfaces.

```typescript
server: {
  host: '0.0.0.0', // Allow access from any IP address
```

**Impact:**
- Development server accessible from any network in development
- Potential exposure of development environment

**Recommendation:**
- Only bind to all interfaces when necessary
- Consider environment-based configuration:
```typescript
host: process.env.NODE_ENV === 'development' ? 'localhost' : '0.0.0.0'
```

---

## Dependency Security

### Recommended Security Packages

Consider adding these packages to improve security posture:

```json
{
  "dependencies": {
    "helmet": "^7.1.0",
    "express-rate-limit": "^7.1.5",
    "express-validator": "^7.0.1",
    "zod": "^3.22.4"
  }
}
```

### Package Audit Recommendation

Run regular security audits:

```bash
npm audit
npm audit fix
```

---

## Security Best Practices Summary

### Immediate Actions Required

1. **Remove hardcoded connection string** from `client/src/main.tsx`
2. **Configure CORS properly** to restrict allowed origins
3. **Remove API key logging** from `server/src/lib/config.ts`
4. **Add rate limiting** to all API endpoints

### Short-term Improvements

1. Implement input validation with schema validation library
2. Add Helmet.js for security headers
3. Fix SSRF vulnerability in URL fetching
4. Add request size limits

### Long-term Security Enhancements

1. Implement authentication/authorization system
2. Add comprehensive logging and monitoring
3. Set up automated vulnerability scanning in CI/CD
4. Implement Content Security Policy
5. Add CSRF protection for state-changing operations

---

## Conclusion

The MCP Agents Hub codebase has several security vulnerabilities that should be addressed before production deployment. The most critical issue is the exposed Application Insights connection string, which should be remediated immediately. Implementing the recommendations in this report will significantly improve the security posture of the application.

**Priority Order for Remediation:**
1. Remove hardcoded credentials (Critical)
2. Configure CORS properly (High)
3. Remove sensitive logging (High)
4. Add rate limiting (High)
5. Implement input validation (Medium)
6. Add security headers (Medium)
7. Fix SSRF vulnerability (Medium)
8. Address remaining issues (Low)

---

*This report was generated as part of a security-focused code review. All findings should be validated and remediation plans developed in collaboration with the development team.*
