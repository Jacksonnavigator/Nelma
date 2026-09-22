# Development CORS/preflight fix ? 2026-09-08

## Exact cause

The effective local backend settings were APP_ENV=development and cors_origins=[]. There was no backend .env; the example file was not loaded. app/main.py guarded middleware registration with `if settings.cors_origins`, so CORSMiddleware was entirely disabled. Live preflights for auth/register and settings/public returned 405 before this change.

The old CORS_ORIGINS field also depended on a before-validator for comma-separated input, but pydantic-settings normally JSON-decodes list environment variables before that validator. It now uses NoDecode and explicitly handles CSV, JSON arrays and empty values.

## Changes

- backend/app/main.py: install CORSMiddleware even with an empty explicit list; shared configure_cors function tested with development and production configurations.
- backend/app/core/config.py: development-only local/private-network origin pattern; reliable CSV/JSON CORS_ORIGINS parsing. Production still requires explicit non-wildcard origins and does not enable the development regex.
- backend/.env.example and backend/README.md: describe development defaults, explicit production origins and preflight headers.
- backend/tests/test_cors.py: six regressions covering allowed/rejected origins, methods/headers, production restrictions, environment parsing, successful registration and unrelated 422 validation.
- backend/app/core/http_status.py: compatible named HTTP_422_UNPROCESSABLE_CONTENT=422. The test environment has Starlette 0.41.3, which does not export the newer name, while the live server uses a newer version.
- Replaced deprecated constant references only in backend/app/core/exceptions.py, backend/app/utils/phone.py, and backend/app/services/{business_service,pricing_service,payment_service,order_service}. Status values and response behavior remain 422.

No auth schema, permissions, roles, mobile screens, or device IP constants were changed.

## Allowed origins and headers

Only when APP_ENV=development: http, https, exp and exps origins using localhost, 127.0.0.1, IPv6 ::1, or RFC1918 private addresses (10/8, 172.16/12, 192.168/16), with any port. An origin cannot append an external-domain suffix to a private address. Additional explicit origins remain configurable using CORS_ORIGINS.

Production: only explicit CORS_ORIGINS; no development origin regex, and empty/wildcard production lists remain rejected by settings validation.

Allowed methods: OPTIONS, GET, HEAD, POST, PATCH, PUT, DELETE. Allowing a CORS method does not create an API route for that method.

Allowed headers include Authorization, Content-Type and Idempotency-Key. Responses echo the accepted origin and vary by Origin; credentials remain supported. No wildcard production setting was introduced.

## Live results

The existing Uvicorn server had --reload and loaded the fix automatically. Requests used Origin plus Access-Control-Request-Method and Access-Control-Request-Headers, as a real preflight must.

| Request | Before | After |
|---|---|---|
| OPTIONS /api/v1/auth/register, requested POST | 405 | 200, Access-Control-Allow-Origin present |
| OPTIONS /api/v1/settings/public, requested GET | 405 | 200, Access-Control-Allow-Origin present |
| Valid POST /api/v1/auth/register with Origin | Not performed pre-fix | 201, role USER, audience mobile, CORS header present |
| Deliberately mismatched-password localhost POST | 422 in earlier probe | 422 VALIDATION_ERROR, Passwords must match |

The live valid POST created a uniquely named temporary USER, logged it out, and removed only that exact fixture account after verifying its returned ID/name/role in the database. The registration audit event was retained. Password/token values were not printed. Native phone interaction itself was not automated.

The previous localhost 422 was the explicitly malformed validation probe recorded in USER_AUTH_AUDIT.md: password and confirmPassword differed. It reached backend validation, so it was unrelated to preflight. The accepted valid POST confirms no registration schema mismatch for that tested payload. A bare OPTIONS request without preflight headers may still return 405; that is not a CORS failure.

## Automated verification

`python -m ruff check .`: PASS. `python -m pytest -q`: PASS ? 50 tests in 73.16 seconds. Initial test failures exposed the old Starlette missing the new 422 name; the compatibility constant corrects this without upgrading dependencies or changing response codes.
