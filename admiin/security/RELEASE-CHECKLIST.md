# Security release checklist

**All unchecked backend/hosting items are blockers, not claims of implemented protection.** Obtain the actual backend and deployment configuration for review. Do not use demo mode as a real staff system.

## Backend and identity — requires implementation/review
- [ ] Server-side authentication and deny-by-default permission checks on every endpoint; active-account checks; object/tenant/record authorization with negative tests for both roles and forged IDs.
- [ ] Administrator MFA and secure enrollment/recovery; least privilege, no shared staff accounts, removal of bootstrap/default accounts.
- [ ] Short-lived access tokens; refresh rotation, token-family reuse detection, server logout/password-change/deactivation revocation, idle and absolute expiry. Reject stale permissions server-side.
- [ ] Parameterized database access; bounded validated request schemas; reject unknown/extra authority fields; server-calculated pricing and approved order/payment transitions.
- [ ] Backend password policy, Argon2id (or reviewed equivalent) hashing, breached-password screening, login/reset rate limits and account-enumeration-safe responses. Reset tokens must be cryptographically random, short-lived, single-use and never logged.
- [ ] Exact CORS origin/method/header allowlists. If switching to cookies, add Secure/HttpOnly/SameSite cookies plus CSRF tokens/origin validation and a reviewed BFF. The current bearer client omits cookies.
- [ ] Atomic financial/stock updates and unique idempotency keys for writes; reject unauthorized requests before side effects. No double orders/payments under races/retries.
- [ ] Upload limits at edge and server, decoded dimensions/pixel limits, safe re-encoding, malware screening where appropriate, isolated storage/content types, no executable uploads. Review any remote image fetching for SSRF/DNS rebinding.
- [ ] Append-only access-controlled audit events for login, recovery, role/account changes, pricing, payments, orders and assignments, including actor/resource/time/request ID. Never log passwords/tokens/customer data unnecessarily.

## Hosting and operational resilience — requires review
- [ ] HTTPS-only redirects, valid TLS certificates, edge HSTS (review subdomain impact before includeSubDomains/preload), nosniff, frame protection and referrer policy across responses/static assets/errors.
- [ ] Preserve SSR CSP nonce per response; never cache/reuse private HTML or nonce-bearing responses. Do not add unsafe-eval/unsafe-inline scripts to make an integration work. Test integrations under enforced CSP.
- [ ] Restrict network exposure; database/private services not publicly reachable; least-privilege service identities and secret manager, credential rotation and incident revocation procedures.
- [ ] Edge/API request size limits, rate limiting, concurrency/deadline limits, abuse monitoring and DDoS/WAF controls appropriate to deployment.
- [ ] Encrypted backups with tested restore; immutable/offline recovery copies, least-privilege backup access, retention policy and disaster-recovery objectives.
- [ ] Redacted structured monitoring, alerts, availability checks, audit review and an incident-response owner/runbook. Configure CSP violation reporting only after privacy review.
- [ ] Dependency updates and vulnerability triage; locked reproducible build, secret scanning, artifact checks, SBOM/signing policy and independent penetration test.

## Source/build gates
- [x] Typecheck and regression tests include client security boundaries.
- [x] API assets checked for known demo signatures/environment files/public source maps.
- [x] Production configuration rejects demo mode unless explicitly marked for a non-production demo.
- [ ] Run all gates in your own CI; check final artifact and actual deployed headers/permissions, not only source.

Example production build (set your real reviewed API/proxy):
```sh
npm ci
npm run security:check
VITE_DATA_MODE=api VITE_API_URL=https://your-api.example/api/v1 npm run build
npm run security:verify-assets
```
On PowerShell set `$env:VITE_DATA_MODE` and `$env:VITE_API_URL` before `npm.cmd run build`. No secrets may enter `VITE_*`. The `.env.example` loopback URL is development-only and is rejected for API release builds. If no same-origin proxy is installed, do not configure `/api/v1`.

Report vulnerabilities privately to your designated security/administration contact. Do not post credentials, customer records or exploit details to public issues. Rotate suspected compromised credentials and preserve redacted evidence.
