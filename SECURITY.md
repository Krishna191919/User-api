# Security Report — users-api

## OWASP Top 10 (2021) Defenses

| #   | Category                                     | How users-api defends against it                                                                                                                                                                                                |
| --- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A01 | **Broken Access Control**                    | Every `/users` route runs `authenticate` → `requireRole` (RBAC) or `requirePermission` (ABAC ownership check). Customers can only read, update, or delete themselves. Admins can do everything except delete their own account. |
| A02 | **Cryptographic Failures**                   | Passwords are hashed with scrypt (never stored in plaintext). Access tokens are HS256-signed JWTs with a 15-minute expiry. Refresh cookies are `httpOnly` + `SameSite=Strict`, and HTTPS-only in production.                    |
| A03 | **Injection**                                | All request bodies are parsed by Zod schemas with strict types (objects where strings are expected return 400). Names use an allow-list regex that rejects `<script>`, SQL fragments, and template payloads.                    |
| A04 | **Insecure Design**                          | Refresh tokens rotate on every use with reuse detection (a replayed token revokes the whole token family). Login is rate-limited to 5 failed attempts per IP + email per 15 minutes.                                            |
| A05 | **Security Misconfiguration**                | Helmet sets CSP, HSTS, `nosniff`, and `SAMEORIGIN`, and removes `X-Powered-By`. CORS is an allow-list (only configured frontend origins). `.env` is gitignored and never committed.                                             |
| A06 | **Vulnerable and Outdated Components**       | `npm audit` reports 0 vulnerabilities. Dependabot alerts are enabled to flag new CVEs automatically.                                                                                                                            |
| A07 | **Identification & Authentication Failures** | Failed logins are rate-limited (IP + email key). Password policy requires 8–72 characters with at least one letter and one digit. Wrong password and unknown email return the same error message (no user enumeration).         |
| A08 | **Software and Data Integrity Failures**     | GitHub OAuth uses PKCE (S256) plus the `state` parameter to block code interception and login forgery. JWT verification pins `algorithms: ["HS256"]` to stop alg-swap attacks.                                                  |
| A09 | **Security Logging and Monitoring Failures** | Every request gets an `X-Request-Id` and is logged with method, path, status, and duration via the request-logger middleware.                                                                                                   |
| A10 | **Server-Side Request Forgery (SSRF)**       | The only outbound requests go to fixed GitHub OAuth URLs built from config. No user-supplied URL is ever fetched by the server.                                                                                                 |

## Remaining Weakness

**Rate limiting uses an in-memory store.** `express-rate-limit`'s default `MemoryStore` resets on every server restart and is not shared between instances — a determined attacker could wait for a deploy/restart to clear their counter, or bypass the limit entirely in a multi-instance deployment.

**How to fix:** swap in a shared store such as `rate-limit-redis` backed by Redis (or Upstash), so counters survive restarts and are consistent across all instances. This also enables centralised monitoring of brute-force attempts.
