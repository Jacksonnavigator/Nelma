# Render + Supabase Deployment

This deployment keeps the current NELMA backend architecture:

- Render runs the FastAPI API.
- Supabase stores the PostgreSQL database.
- FastAPI still owns authentication, roles, authorization, order workflow, payments, and notifications.
- Supabase Auth is not used by the mobile app.

## What Is Already Prepared

- `render.yaml` defines a Render web service named `nelma-api`.
- `backend/.python-version` pins Python 3.11 for Render.
- `psycopg` is installed for PostgreSQL connections.
- `python -m app.scripts.prepare_database` runs Alembic migrations and seeds public settings before each paid Render deploy.
- Production settings reject unsafe defaults such as SQLite, wildcard CORS, debug mode, short JWT secrets, and the development payment provider.

## 1. Create The Supabase Database

1. Create a Supabase project.
2. Open the Supabase project dashboard and click `Connect`.
3. For Render, copy the `Session pooler` connection string unless your Supabase project has the IPv4 add-on and you choose the direct connection.
4. Replace `[YOUR-PASSWORD]` with the database password.
5. Make sure the URL uses SSL. If Supabase did not include it, append:

```text
?sslmode=require
```

Use the session pooler for Render because this FastAPI service is a persistent backend and Render may be on an IPv4-only network. Do not use the transaction pooler for migrations.

Because the mobile and admin apps talk to FastAPI, not directly to Supabase, disable the Supabase Data API unless you know you need it for a separate tool:

1. Open Supabase Dashboard.
2. Go to the Data API integration overview.
3. Turn `Enable Data API` off.

The migration also enables row-level security on the app tables. FastAPI connects through PostgreSQL and enforces the application permissions itself.

## 2. Create The Render Service

The repository already has `render.yaml` at the project root. On Render, create a new Blueprint from this repository, or create a web service manually with these values:

```text
Root directory: backend
Runtime: Python
Build command: pip install .
Pre-deploy command: python -m app.scripts.prepare_database
Start command: uvicorn app.main:app --host 0.0.0.0 --port $PORT --proxy-headers --forwarded-allow-ips="*"
Health check path: /api/v1/ready
```

Use a paid Render instance if you want the pre-deploy migration command to run automatically. If you use a plan that does not support pre-deploy commands, run the same migration command from Render Shell before starting production traffic.

## 3. Set Render Environment Variables

Set these in Render. Do not put production secrets in local files.

```env
APP_ENV=production
DEBUG=false
DATABASE_URL=postgresql://postgres.<project-ref>:<password>@<pooler-host>:5432/postgres?sslmode=require
DATABASE_POOL_SIZE=3
DATABASE_MAX_OVERFLOW=2
JWT_SECRET_KEY=<generate at least 32 characters>
INTERNAL_ADMIN_TOKEN=<generate at least 32 characters>
CORS_ORIGINS=https://your-admin-domain.example,https://your-web-domain.example
PAYMENT_PROVIDER=cash
RATE_LIMIT_ENABLED=true
TRUST_PROXY_HEADERS=true
NOTIFICATION_PROVIDER=smtp_twilio
SMTP_HOST=<your smtp host>
SMTP_PORT=587
SMTP_SECURITY=starttls
SMTP_USERNAME=<optional smtp username>
SMTP_PASSWORD=<optional smtp password>
SMTP_FROM_EMAIL=<sender email>
TWILIO_ACCOUNT_SID=<your Twilio account SID>
TWILIO_AUTH_TOKEN=<your Twilio auth token>
TWILIO_FROM_NUMBER=<E.164 sender number>
```

If you use a Twilio Messaging Service instead of a sender number, set `TWILIO_MESSAGING_SERVICE_SID` and leave `TWILIO_FROM_NUMBER` empty.

For `CORS_ORIGINS`, include only browser origins such as the admin web app domain. Expo native mobile calls do not use browser CORS, but Expo Web and admin dashboards do.

## 4. Deploy And Migrate

Trigger a Render deploy. The deploy should:

1. Install the backend package.
2. Run `python -m app.scripts.prepare_database`.
3. Start Uvicorn on Render's `$PORT`.
4. Pass `/api/v1/ready`.

Check these URLs after Render finishes:

```text
https://<your-render-service>.onrender.com/health
https://<your-render-service>.onrender.com/api/v1/health
https://<your-render-service>.onrender.com/api/v1/ready
```

If the migration did not run automatically, open Render Shell and run:

```bash
python -m app.scripts.prepare_database
```

## 5. Create The First System Admin

Open Render Shell for the backend service and run:

```bash
python -m app.scripts.create_system_admin --full-name "NELMA Admin" --phone "+255700000000" --email "admin@nelma.example"
```

The script asks for a password securely. Public mobile registration still creates only `USER` accounts.

## 6. Point The Mobile App At Render

Update the mobile `.env`:

```env
EXPO_PUBLIC_USE_MOCKS=false
EXPO_PUBLIC_API_URL=https://<your-render-service>.onrender.com/api/v1
```

Restart Expo after changing `.env`.

Then verify:

1. Register a new customer.
2. Log in as that customer.
3. Log out.
4. Log in as a driver.
5. Log out.
6. Log in as the customer again.

## 7. Operational Notes

- Keep `PAYMENT_PROVIDER=cash` until a real payment provider contract is implemented.
- Keep `NOTIFICATION_PROVIDER=smtp_twilio` in production because password reset delivery needs real email or SMS.
- Never use the local SQLite database for Render production.
- Keep `CORS_ORIGINS` explicit. Do not use `*` in production.
- If you increase Render instance count, lower `DATABASE_POOL_SIZE` or confirm the Supabase connection limit first.
