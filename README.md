# NELMA Drinking Water

Production-ready Expo React Native customer app foundation for ordering NELMA 20-liter drinking water, paired with a FastAPI backend in `backend/`.

## Frontend Commands

- Install dependencies: `npm install --legacy-peer-deps`
- Start development: `npm run start`
- Start Android: `npm run android`
- Run tests: `npm run test`
- Run TypeScript checks: `npm run typecheck`
- Expo validation: `npm run doctor`
- Android export: `npx expo export --platform android --output-dir dist`

## Backend Commands

From `backend/`:

- Install backend dependencies: `python -m pip install -e .[dev]`
- Copy environment file: `Copy-Item .env.example .env`
- Run migrations: `python -m alembic upgrade head`
- Seed local development data: `python -m app.scripts.seed`
- Start API: `python -m uvicorn app.main:app --host 127.0.0.1 --port 8000`
- Run backend tests: `python -m pytest`
- Run backend lint: `python -m ruff check .`
- Format backend: `python -m ruff format .`

## Environment

Copy `.env.example` to `.env` and configure the mobile app:

- `EXPO_PUBLIC_API_URL`: FastAPI v1 base URL
- `EXPO_PUBLIC_USE_MOCKS`: `true` for local mock repositories, `false` for FastAPI repositories
- `EXPO_PUBLIC_API_TIMEOUT_MS`: API request timeout

Local API examples:

```env
EXPO_PUBLIC_USE_MOCKS=false
EXPO_PUBLIC_API_URL=http://127.0.0.1:8000/api/v1
```

Android emulator example:

```env
EXPO_PUBLIC_USE_MOCKS=false
EXPO_PUBLIC_API_URL=http://10.0.2.2:8000/api/v1
```

Physical device example:

```env
EXPO_PUBLIC_USE_MOCKS=false
EXPO_PUBLIC_API_URL=http://YOUR_COMPUTER_LAN_IP:8000/api/v1
```

For a physical Android device, start Uvicorn with `--host 0.0.0.0` and ensure the phone can reach the computer on the same network.

No API secrets, payment secrets, database credentials, webhook secrets, internal admin tokens, or plaintext passwords belong in this mobile app.

## Customer Flow

Open app -> splash -> login/register -> home -> order water -> first-time purchase/refill -> quantity -> delivery address/location -> payment method -> order summary -> place order -> delivery tracking.

Delivery location can be entered manually or optionally enriched with GPS coordinates through Expo Location. GPS is never mandatory, and coordinates may be null.

## Backend Endpoint Base

The backend exposes endpoints under `/api/v1`:

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /users/me`
- `PATCH /users/me`
- `PATCH /users/me/security`
- `GET /addresses`
- `POST /addresses`
- `GET /addresses/{id}`
- `PATCH /addresses/{id}`
- `DELETE /addresses/{id}`
- `GET /orders`
- `POST /orders`
- `GET /orders/{id}`
- `POST /orders/{id}/cancel`
- `PATCH /internal/orders/{id}/status`
- `GET /notifications`
- `PATCH /notifications/{id}/read`
- `POST /notifications/read-all`
- `GET /payments/methods`
- `POST /payments/initialize`
- `GET /payments/{id}`
- `POST /payments/webhooks/{provider}`
- `GET /settings/public`

Paginated endpoints return `items`, `page`, `pageSize`, `total`, `totalPages`, `hasNext`, and `hasPrevious`.

## Order Delivery Payload

Orders can include:

- `deliveryAddress.deliveryAddress`
- `deliveryAddress.area`
- `deliveryAddress.phone`
- `deliveryAddress.deliveryInstructions`
- `deliveryAddress.latitude`
- `deliveryAddress.longitude`

The backend stores an order-time delivery snapshot so editing a saved address later does not rewrite old orders.

## Architecture

The app keeps UI, state, repositories, services, and business logic separate:

`Screen -> Store/Hook -> Repository -> API Client -> FastAPI`

For frontend development without a backend:

`Screen -> Store/Hook -> Repository -> Mock Repository -> AsyncStorage`

Pricing is server-authoritative in the backend. Frontend mock pricing exists only for mock mode.

## Production Boundaries

- Real payments require a production payment provider implementation, live/sandbox credentials, signed webhook verification, callback URLs, and provider-state mapping.
- Push notification delivery requires Expo/EAS project configuration, device token registration, backend provider sending, retry handling, and invalid-token cleanup.
- Production API deployments should use PostgreSQL or another managed production database, automated backups, explicit CORS origins, strong JWT and internal admin secrets, and proxy/API-gateway rate limiting.

Bottle Management is intentionally not implemented. There is no bottle ownership tracking, inventory per customer, bottle IDs, QR/RFID scanning, exchange tracking, or lifecycle management.

Legal/about text is intentionally placeholder content until NELMA supplies approved copy.