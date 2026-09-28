# NELMA Drinking Water

Ordering and delivery of 20-litre drinking water in Arusha and NM-AIST.

| Folder | What it is |
| --- | --- |
| `Nelma-app/` | Expo mobile app. Customers order and track water; drivers run their deliveries. |
| `backend/` | FastAPI API and PostgreSQL (Supabase) database. Everything goes through it. |
| `admin/` | Web dashboard for sales managers and administrators. |

## How the pieces fit

`Mobile app / Admin dashboard -> FastAPI (/api/v1) -> PostgreSQL`

The apps never talk to the database directly. The backend owns sign-in, roles, prices, delivery fees and the order workflow, so the price a customer sees is always recomputed and checked on the server.

Staff control the business from the dashboard, and the app picks the changes up on its next refresh:

- **Products:** add products, change names, prices and pictures, hide or show them.
- **System Settings:** support phone, email, address and hours (shown on the app's Contact and About screens); delivery zones and fees; delivery time windows.
- **Orders:** confirm, assign a driver, reply to customer messages, cancel, record cash.
- **Users:** every account; deactivate or set a new password.

## Mobile app

From `Nelma-app/`:

```powershell
npm install --legacy-peer-deps
Copy-Item .env.example .env   # then set EXPO_PUBLIC_API_URL
npx expo start
```

- `EXPO_PUBLIC_API_URL`: the backend's `/api/v1` address, for example `https://your-service.onrender.com/api/v1`.
- `EXPO_PUBLIC_USE_MOCKS=true` runs the app offline with sample data.
- Checks: `npm run typecheck` and `npm test`.

The first request after the free Render server has been idle can take up to a minute; the app wakes the server at launch and retries reads and sign-in once with a longer wait.

### Push notifications (one-time setup)

Phone alerts only work in a real build (not Expo Go):

1. In `Nelma-app/`, run `npx eas init` to link the project to your Expo account (this adds the project ID to `app.json`).
2. For Android, add Firebase credentials in EAS (`npx eas credentials`, then choose Google Service Account / FCM V1).
3. On the backend in Render, set `EXPO_PUSH_ENABLED=true` (and optionally `EXPO_PUSH_ACCESS_TOKEN`).
4. Build with `npx eas build -p android --profile preview`.

Customers can switch order and payment alerts off in Profile > Notifications & settings; the in-app inbox (bell icon) always keeps a copy.

## Backend

From `backend/`:

```powershell
python -m pip install -e .[dev]
Copy-Item .env.example .env
python -m alembic upgrade head
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

- Checks: `python -m ruff check app tests` and `python -m pytest`.
- Deploying to Render with Supabase: see [backend/RENDER_SUPABASE.md](backend/RENDER_SUPABASE.md).
- First administrator: `python -m app.scripts.create_system_admin --full-name "..." --phone "..." --email "..."`. Admins then create sales managers and drivers from the dashboard.

## Admin dashboard

See [admin/README.md](admin/README.md).

## Before going to the Play Store

- Have the Terms & Conditions and Privacy Policy in the app (Profile > Legal) reviewed; they describe what the app actually does but are not legal advice.
- Set the real support phone and email in the dashboard's System Settings.
- Customers can delete their account in Profile > Password & security, which Google Play requires.

## Not built yet

- **Mobile money:** customers pay cash on delivery. Adding M-Pesa, Tigo Pesa or Airtel Money needs a payment provider account (for example Selcom or AzamPay) connected to the backend.
- **Bottle tracking:** there is no per-customer bottle inventory or exchange tracking.
