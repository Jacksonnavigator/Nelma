# NELMA admin dashboard

The web dashboard NELMA staff use to run the business. It talks to the FastAPI backend in `../backend`.

**Sales managers** handle day-to-day work: confirm and dispatch orders, assign drivers, reply to customer messages, cancel orders, record cash, and manage products and prices.

**System administrators** manage people and settings: staff and driver accounts, every user account (deactivate, set a new password), business contacts, delivery zones, fees and time windows, and the audit log.

## Run it locally

See [SETUP.md](SETUP.md) for the backend and admin steps. In short, with the backend running on port 8000:

```powershell
bun install
bun run dev -- --host 127.0.0.1 --port 3100
```

`admin/.env`:

```dotenv
VITE_API_URL=http://127.0.0.1:8000/api/v1
VITE_DATA_MODE=api
```

Set `VITE_DATA_MODE=mock` for an offline demo with sample data (sign in as `admin` / `nelma1234`). Nothing is saved in demo mode.

## Deploy (Render)

Node web service, root directory `admin`:

- Build: `bun install && bun run build`
- Start: `node .output/server/index.mjs`
- Environment: `NITRO_PRESET=node-server`, `NODE_VERSION=22`, `VITE_API_URL=https://<backend>/api/v1`, `VITE_DATA_MODE=api`

Add the dashboard's address to the backend's `CORS_ORIGINS`, or sign-in will fail.

## Checks

```powershell
bun run typecheck
bun run lint
bun run test
bun run build
```

More: [PAYMENTS-AND-RESET.md](PAYMENTS-AND-RESET.md) covers cash collection and password-reset delivery.
