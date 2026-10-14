# Security verification record

## Passed on this source revision
- TypeScript `tsc --noEmit`.
- Vitest: **57 tests in 7 files**, including 43 added security tests and 14 existing regression tests. Tests cover API origin/path confinement, production config, unknown roles/inactive accounts, memory-only credentials, logout/login races, malformed sessions, retry boundaries, cancellation, header/body timeout, response size limit, error redaction, CSP/headers, passwords, image checks, CSV and chart injection.
- `npm audit --audit-level=moderate`: **0 known vulnerabilities reported** for the installed lockfile at review time. This is not proof that dependencies have no vulnerabilities.
- API-mode Node production build with a same-origin `/api/v1` configuration; browser asset scan passed (known demo identity/password signatures, public source maps, environment files).
- Negative build gates: ordinary mock release, unencrypted production API, and unapproved public environment variable rejected.
- Real Chromium against a locally built production SSR server via an isolated self-signed HTTPS test proxy: security headers present; CSP nonce matched inline framework scripts; an injected non-nonce inline script was blocked; forged legacy storage did not sign in; an inactive fixture account was rejected; valid synthetic login and profile navigation hydrated; neither credential appeared in localStorage/sessionStorage; reload returned to sign-in; no page JavaScript errors.

## Scope of browser checks
API responses were intercepted with synthetic accounts, tokens and denial responses. Dashboard data endpoints used denial fixtures rather than real records. No production backend, real credentials, SMS/email provider, database, payment provider or deployment was contacted. The test proxy is outside the archive and is not a deployment component. Behind that TLS proxy, the SSR server sees HTTP; edge HSTS still needs hosting configuration, while the HTTPS helper policy is unit-tested.

The Node adapter initially exposed a proxied-Request incompatibility during testing; the SSR wrapper now rebuilds a native request from primitive properties, preserving method/body/signal. Production browser checks passed after the fix.

The neutral visual design is retained. Earlier visual preview checks remain documented separately in REDESIGN.md. These checks are not a full route/mutation regression, independent penetration test, whole-app lint certification, accessibility audit, or infrastructure security assessment. Backend and hosting release blockers remain in RELEASE-CHECKLIST.md.

## Reproduce
```sh
npm ci
npm run security:check
# Set the actual HTTPS API URL or reviewed proxy path before building.
VITE_DATA_MODE=api VITE_API_URL=/api/v1 NITRO_PRESET=node-server npm run build
npm run security:verify-assets
```
Repeat against your actual deployment and authoritative backend. Do not weaken TLS/CSP to make a test pass. Self-signed certificates were accepted only for this isolated local test.
