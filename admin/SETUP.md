# Run the admin dashboard

The dashboard now uses the FastAPI backend for authentication, accounts, profiles, settings, orders, deliveries, drivers, pricing, reports, audit logs and notifications.

## Backend

From `backend`, install dependencies and configure `backend/.env` using its example if it does not exist. The backend reads its own `.env`, not the repository root `.env`. Keep any existing database configuration.

```powershell
python -m pip install -e ".[dev]"
python -m alembic upgrade head
python -m app.scripts.seed
python -m app.scripts.create_system_admin --full-name "NELMA Admin" --phone "+255700000000" --email "admin@nelma.example"
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Replace the example contacts. The account command securely prompts for a password; run it only when you need the initial administrator. Existing administrators can create staff in Admin accounts. Sales managers handle operational orders; system administrators manage accounts and settings.

## Admin

`admin/.env` should contain:

```dotenv
VITE_API_URL=http://127.0.0.1:8000/api/v1
VITE_DATA_MODE=api
```

From `admin`:

```powershell
npm.cmd install
npm.cmd run dev -- --host 127.0.0.1 --port 3100
```

Open http://127.0.0.1:3100 and sign in with your administrator credentials. Restart Vite after environment changes. Configure explicit backend CORS origins when deploying. Do not place secrets in `VITE_` variables: they are public browser configuration.

`VITE_DATA_MODE=mock` switches to in-memory demo repositories; mock changes do not provide backend persistence or real account credentials.

## Verification

```powershell
# From admin
npm.cmd run typecheck
npm.cmd run lint
npm.cmd test
npm.cmd run build
# From backend
python -m ruff check app tests
python -m pytest -q
```

See VERIFICATION.md for coverage and known limits. `scripts/serve_verification.py` runs a development-only fixture API on port 8011 with an isolated database under `admin/output`; do not deploy it. To use it, create `admin/output`, run the script from the repository root, and start Vite with `VITE_API_URL=http://127.0.0.1:8011/api/v1` in that terminal environment.

Sales managers can record cash received on delivered orders. See PAYMENTS-AND-RESET.md for collection and production setup. Mobile money remains disabled. Email and SMS password-reset delivery are implemented using SMTP and Twilio; configure their credentials in backend/.env. Development reset codes are for local testing. Account last-login timestamps are not tracked and display as unavailable.
