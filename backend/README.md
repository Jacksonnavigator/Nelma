# NELMA API Backend

FastAPI backend for the NELMA Drinking Water customer application.

## Stack

- FastAPI
- SQLAlchemy 2.x
- Alembic
- Pydantic v2 and pydantic-settings
- SQLite for development, PostgreSQL-ready through `DATABASE_URL`
- JWT access tokens plus rotating refresh sessions
- Argon2 password hashing
- pytest, httpx, and Ruff for quality checks

## Local Setup

```powershell
cd backend
python -m pip install -e .[dev]
Copy-Item .env.example .env
python -m alembic upgrade head
python -m app.scripts.seed
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Interactive docs are available at `http://127.0.0.1:8000/docs`.

## Environment

Important variables:

- `APP_ENV`: `development`, `test`, or `production`
- `DEBUG`: must be `false` in production
- `DATABASE_URL`: SQLite for local development, PostgreSQL or another production database for production
- `JWT_SECRET_KEY`: at least 32 characters and never the development default in production
- `PAYMENT_PROVIDER`: `development` for local/test only
- `PAYMENT_PROVIDER_API_KEY`: live or sandbox provider API key when using a real provider
- `PAYMENT_PROVIDER_MERCHANT_ID`: real provider merchant/account identifier
- `PAYMENT_PROVIDER_WEBHOOK_SECRET`: secret used to verify real provider callbacks
- `DEVELOPMENT_WEBHOOK_SECRET`: local/test callback guard for the development provider
- `CORS_ORIGINS`: comma-separated frontend origins or a JSON array. Production requires an explicit non-wildcard list.
- With `APP_ENV=development`, CORS additionally permits HTTP/HTTPS/Expo origins on localhost, loopback (`127.0.0.1`, `[::1]`), and private LAN ranges (`10/8`, `172.16/12`, `192.168/16`), with any port. This development allowance is disabled in test/production; production uses only `CORS_ORIGINS`.
- Preflights must include `Origin` and `Access-Control-Request-Method`; bare OPTIONS requests are not CORS preflights. Allowed methods: OPTIONS, GET, HEAD, POST, PATCH, PUT, DELETE. Allowed request headers include Authorization, Content-Type and Idempotency-Key.
- `RATE_LIMIT_ENABLED`: enables in-process rate limiting
- `TRUST_PROXY_HEADERS`: only set true when the API is behind a trusted proxy that owns `X-Forwarded-For`
- `INTERNAL_ADMIN_TOKEN`: operations token for internal order state transitions; must be long and secret in production
- `FIRST_PURCHASE_PRICE`, `REFILL_PRICE`, `CURRENCY`, `MAX_ORDER_QUANTITY`: server-authoritative catalog settings

Production startup rejects insecure combinations such as `DEBUG=true`, SQLite, the development JWT secret, the development payment provider, missing payment credentials, wildcard CORS, and the default internal operations token.

## Migrations And Database

Run migrations with:

```powershell
python -m alembic upgrade head
```

The current schema creates:

- `users`
- `addresses`
- `orders`
- `order_items`
- `payments`
- `notifications`
- `refresh_sessions`
- `password_reset_tokens`
- `app_settings`
- `device_push_tokens`
- `idempotency_keys`

Integrity rules include foreign-key enforcement in SQLite development/test, one default delivery address per customer, unique provider payment references, server-calculated order totals, order address snapshots, and customer ownership checks on addresses, orders, payments, and notifications.

For Render hosting with Supabase PostgreSQL, see [Render + Supabase Deployment](./RENDER_SUPABASE.md).

## Backup Strategy

For SQLite development databases, stop the API before copying the `.db` file or use SQLite's online backup tooling. Do not treat local SQLite files as production backups.

For production PostgreSQL, configure automated daily logical backups with point-in-time recovery where available. Before each migration, take a database snapshot or logical dump, record the app version being deployed, and test restore into a staging database on a regular schedule.

## API Areas

All app endpoints are under `/api/v1`.

- Auth: register, login, refresh rotation, logout revocation, forgot/reset password
- Users: profile read/update and password change
- Addresses: saved delivery addresses with optional `latitude` and `longitude`
- Orders: first-time purchase/refill, quantity, delivery snapshot, payment method, tracking status
- Internal operations: token-protected order status transitions for delivery workflow
- Payments: server-authoritative amount calculation, development provider, webhook entry point, idempotency support
- Notifications: list, mark one read, mark all read
- Settings: public pricing and currency for the app

Paginated endpoints return `items`, `page`, `pageSize`, `total`, `totalPages`, `hasNext`, and `hasPrevious`.

## Frontend Connection

Set the Expo app to use the backend:

```env
EXPO_PUBLIC_USE_MOCKS=false
EXPO_PUBLIC_API_URL=http://127.0.0.1:8000/api/v1
```

For Android emulator use `http://10.0.2.2:8000/api/v1`. For a physical device use your computer LAN IP and start Uvicorn with `--host 0.0.0.0`.

The frontend API client refreshes tokens once on a `401`, sends `Idempotency-Key` on order/payment creation, and maps backend error codes into customer-friendly messages.

## Payment Boundary

The development provider exists only for local development and automated tests. It is blocked by production settings validation. Mobile-money payments are simulated as paid, while cash starts pending so webhook/status retry paths can be tested.

A real payment launch still needs the provider contract completed in `app/integrations/payments/` with:

- provider name and API base URL
- merchant/account ID
- API key or signed credential pair
- webhook signing secret and verification algorithm
- callback URL registered with the provider
- sandbox and live credentials
- settlement, currency, expiry, retry, and refund rules
- mapping from provider states into `pending`, `processing`, `paid`, `failed`, `cancelled`, or `refunded`

Provider callbacks must never trust client-supplied amounts. The persisted order total is the payment amount source of truth.

## Push Notification Boundary

Database notifications are implemented and exposed to the app. Expo push dependencies and the `device_push_tokens` table prepare the shape for push, but real push delivery still requires:

- Expo project ID and EAS credentials
- runtime registration of device push tokens
- backend push provider integration
- opt-in and opt-out handling from notification preferences
- retry and invalid-token cleanup
- delivery logging that excludes secrets and message credentials

Until that provider is wired, the app should rely on in-app notification listing and read/read-all state.

## Security And Operations

- Passwords are hashed with Argon2 and never returned by the API.
- Refresh tokens are stored hashed, rotated, and revoked on logout/password reset.
- Password reset tokens are stored hashed; development/test may return the reset token for local flows only.
- Protected routes reject missing, invalid, expired, and wrong-type tokens.
- Rate limiting is available in-process for auth and payment entry points. Production should also use a reverse proxy, WAF, or API gateway rate limit keyed by trusted client IP.
- `TRUST_PROXY_HEADERS` is false by default. Enable it only behind trusted infrastructure.
- Logs must not include access tokens, refresh tokens, payment secrets, webhook secrets, API keys, or plaintext passwords.

## Quality Commands

```powershell
python -m ruff format .
python -m ruff check .
python -m pytest
python -m alembic upgrade head
```

## No Bottle Management

Bottle Management is intentionally outside this application. The backend does not implement bottle ownership tracking, customer bottle inventory, bottle IDs, bottle exchange tracking, QR/RFID scanning, bottle lifecycle management, or bottle-related API resources.
## Bootstrap the first System Admin

Create the first dashboard administrator from the backend folder after running migrations:

```bash
python -m app.scripts.create_system_admin --full-name "NELMA Admin" --phone "+255700000000" --email "admin@nelma.example"
```

The command prompts for a password if `--password` is omitted. Public registration always creates a mobile `USER`; driver, sales manager, and system admin accounts are protected backend operations only.


## Cash collection and production password resets

The dashboard supports recording cash received for delivered orders and sending password-reset codes through SMTP email or Twilio SMS. See [configuration and verification](../admin/PAYMENTS-AND-RESET.md). Use `PAYMENT_PROVIDER=cash` for cash-only production and configure `NOTIFICATION_PROVIDER=smtp_twilio` with the variables in `.env.example`.
