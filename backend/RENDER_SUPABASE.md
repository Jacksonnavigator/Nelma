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

## 2. Create The Render Service Without Blueprint

You do not need Render Blueprint to host this API.

Create a normal Render Web Service manually:

1. Open Render Dashboard.
2. Click `New`.
3. Choose `Web Service`.
4. Connect your GitHub repository.
5. Select the branch you want to deploy.
6. Fill in these values.

For the simplest no-subscription setup, use this start command so migrations run before the API starts:

```text
Root directory: backend
Runtime: Python
Build command: pip install .
Start command: python -m app.scripts.prepare_database && uvicorn app.main:app --host 0.0.0.0 --port $PORT --proxy-headers --forwarded-allow-ips="*"
Health check path: /api/v1/ready
```

That is acceptable for a single Render web service because Alembic migrations are idempotent once the database is already at the latest version.

If you later move to a paid production instance, use this cleaner start command and put `python -m app.scripts.prepare_database` in Render's pre-deploy command instead:

```text
Start command: uvicorn app.main:app --host 0.0.0.0 --port $PORT --proxy-headers --forwarded-allow-ips="*"
Pre-deploy command: python -m app.scripts.prepare_database
```

Leave `Pre-deploy command` empty if your Render plan does not support it. Render says pre-deploy commands are available for paid web services, private services, and background workers. Without that feature, you will run migrations manually.

The `render.yaml` file in the project is only a ready-made reference. You can ignore it when creating the service manually.

## 3. Set Render Environment Variables

Set these in Render. Do not put production secrets in local files.

Replace every example value with your real value. Do not paste angle-bracket placeholders like `<sender email>` into Render, because the backend validates production settings before it starts.

```env
APP_ENV=production
DEBUG=false
DATABASE_URL=postgresql://postgres.PROJECTREF:YOUR_PASSWORD@POOLER_HOST:5432/postgres?sslmode=require
DATABASE_POOL_SIZE=3
DATABASE_MAX_OVERFLOW=2
JWT_SECRET_KEY=replace-with-a-random-secret-at-least-32-characters
INTERNAL_ADMIN_TOKEN=replace-with-a-random-token-at-least-32-characters
CORS_ORIGINS=https://your-admin-domain.example,https://your-web-domain.example
PAYMENT_PROVIDER=cash
RATE_LIMIT_ENABLED=true
TRUST_PROXY_HEADERS=true
NOTIFICATION_PROVIDER=smtp_twilio
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
SMTP_SECURITY=starttls
SMTP_USERNAME=
SMTP_PASSWORD=
SMTP_FROM_EMAIL=admin@your-domain.example
TWILIO_ACCOUNT_SID=AC00000000000000000000000000000000
TWILIO_AUTH_TOKEN=replace-with-your-real-twilio-token
TWILIO_FROM_NUMBER=+255700000000
```

If you use a Twilio Messaging Service instead of a sender number, set `TWILIO_MESSAGING_SERVICE_SID` and leave `TWILIO_FROM_NUMBER` empty.

For `CORS_ORIGINS`, include only browser origins such as the admin web app domain. Expo native mobile calls do not use browser CORS, but Expo Web and admin dashboards do.

## 4. Deploy And Migrate

Trigger a Render deploy. The deploy should:

1. Install the backend package.
2. Start Uvicorn on Render's `$PORT`.
3. Pass `/api/v1/ready` after the database is migrated.

If you did not configure a pre-deploy command, run migrations from your local machine against Supabase:

```powershell
cd backend
$env:APP_ENV="production"
$env:DEBUG="false"
$env:DATABASE_URL="postgresql://postgres.PROJECTREF:YOUR_PASSWORD@POOLER_HOST:5432/postgres?sslmode=require"
$env:JWT_SECRET_KEY="temporary-local-migration-secret-with-32-chars"
$env:INTERNAL_ADMIN_TOKEN="temporary-local-migration-token-with-32-chars"
$env:CORS_ORIGINS="https://temporary.example"
$env:PAYMENT_PROVIDER="cash"
$env:NOTIFICATION_PROVIDER="smtp_twilio"
$env:SMTP_HOST="smtp.example.com"
$env:SMTP_FROM_EMAIL="admin@example.com"
$env:TWILIO_ACCOUNT_SID="AC00000000000000000000000000000000"
$env:TWILIO_AUTH_TOKEN="temporary-twilio-token"
$env:TWILIO_FROM_NUMBER="+255700000000"
python -m app.scripts.prepare_database
```

Use real Render environment values where possible. The command does not create demo accounts; it only applies migrations and seeds public catalog settings.

If you do have access to Render Shell after the service is created, you can also run:

```bash
python -m app.scripts.prepare_database
```

Check these URLs after Render finishes:

```text
https://<your-render-service>.onrender.com/health
https://<your-render-service>.onrender.com/api/v1/health
https://<your-render-service>.onrender.com/api/v1/ready
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
