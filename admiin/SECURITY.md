# NELMA security hardening — frontend and SSR scope

**Release status: backend and deployment security review required before production.**
No application can be guaranteed unhackable, tamper-proof or failure-proof. This package hardens the supplied React/TanStack dashboard and its SSR wrapper. The FastAPI backend, database, identity provider, infrastructure and live deployment were not supplied or tested. UI permission checks are not a security boundary.

## Implemented

- API mode is the default; no silent demo fallback. Builds reject unknown public environment variables, non-HTTPS production API configuration and ordinary demo releases. API build replaces the demo module and scans browser assets for known demo signatures, source maps and environment files.
- Access/refresh tokens stay in browser-tab memory, not localStorage/sessionStorage; old stored tokens and demo sessions are removed. Tokens are not shared through SSR or cross-tab messages. Logout clears local credentials and query data immediately; pending login/data responses cannot restore a cleared session. Refresh is single-flight and validates credential pairs before replacement. Supported browsers propagate logout using BroadcastChannel.
- Active account and supported role validation before login acceptance. Local inactivity clears a session after approximately 15 minutes (30-second timer granularity). Server-side revocation and expiry are still required.
- API requests constrain origin, endpoint paths and record IDs. HTTPS is required in production; development HTTP is loopback-only. Requests omit ambient cookies/referrers, reject redirects and avoid HTTP caching. Header and JSON-body reads have deadlines; JSON bodies have an 8 MiB limit. Only GET network failures have one client retry. Writes/login/refresh are not automatically replayed on network failures. A 401 can trigger one credential refresh and one replay; backend authorization must reject before making a change.
- SSR responses use a fresh cryptographic CSP nonce, disallow inline/event-handler JavaScript without a nonce, deny embedding, disable object/base injection, restrict connections, and set nosniff, no-referrer, private/no-store and restrictive Permissions-Policy. Nonces are generated internally, not accepted from client headers. Built-in server-function CSRF middleware is retained.
- Generic server errors and production console redaction reduce stack/credential leakage; external development error reporting is disabled in production. This is not a complete operational audit/logging system.
- Password creation/reset/change requires 15–128 characters in the client and service adapter. Login accepts existing credentials. Backend policy enforcement, breached-password checks and secure hashing are not implemented here.
- CSV formula cells are neutralized; chart style inputs are allowlisted. Image URLs are restricted; upload MIME/signature and 5 MiB size checks reject common disguised/oversized files. Backend upload scanning, decoding/re-encoding and dimension limits remain required.

## Deliberate limitations and migration effects

1. **A full reload or new tab requires sign-in again in API mode.** This replaces persistent browser token storage. Implement a reviewed HttpOnly/Secure/SameSite cookie + BFF contract if persistent sessions are needed; do not restore localStorage tokens. In-memory tokens can still be stolen by successful XSS or malicious browser extensions.
2. Local logout cannot revoke a token on an unreachable backend. Server-side token families/reuse detection, revocation and short expiry are mandatory. Background-tab timers are not authoritative.
3. CSP allows inline **styles** for existing Radix/Recharts styling; it does not allow arbitrary inline scripts. HTTPS product images are allowed and can make third-party requests; no-referrer is applied. Tighten image hosts when the actual storage/CDN is known. Client URL checks do not defend a backend image fetcher against DNS rebinding/SSRF.
4. SSR headers do not automatically cover Nitro-served static assets, CDN error pages, backend responses, or hosting redirects. Configure and verify those separately. HSTS is emitted by the SSR helper only when its request URL is HTTPS; a TLS-terminating proxy must emit HSTS itself if upstream URLs are HTTP. Do not blindly trust forwarded headers.
5. A same-origin `/api/v1` configuration assumes a reviewed proxy exists. This package does not create one. It does not add MFA, rate limiting, encryption-at-rest, immutable audit trails, WAF or backups.
6. No server trusts a client-supplied role merely because the UI allows an action. Backend enforcement must validate every request, resource scope, current account status and price/payment transition.
7. Zero dependency advisories does not establish absence of vulnerabilities. Asset scans check known patterns, not all possible secrets. Have an independent security review and penetration test before release.

See `security/RELEASE-CHECKLIST.md` for blocking backend/hosting requirements and `security/VERIFICATION.md` for the actual verification scope. This archive contains no private `.env` or generated deployment artifacts.
