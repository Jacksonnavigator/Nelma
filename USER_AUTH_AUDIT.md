# USER authentication audit and targeted fixes

Audit date: 2026-09-07. The mobile environment remains real API mode. This report supersedes the earlier audit only for the USER authentication/session changes described here.

## Findings and exact causes

1. **Confirmed registration blocker:** `app/(auth)/register.tsx:setField` used `setLocation(current => ({...current, phone: current.phone || value}))` each time the account phone changed. Typing `0710000003` character by character set delivery phone to `0` on the first keystroke and kept it there. `submit` then validated `location.phone || form.phone`; the truthy `0` prevented fallback to the completed account phone. `validateDeliveryAddress` failed and the method returned before making an HTTP request. The registration-screen regression failed before the fix and succeeds afterward. This is not forbidden-field rejection by FastAPI.
2. **Confirmed email mismatch:** frontend `validateRegistration` required an email; backend accepts omitted/null/empty email. Blank-email signup was therefore blocked locally. The validator trimmed for checking while the service sent the original value; the service now trims/lowercases email and sends empty string for a blank field, which the backend converts to null. `User.email` now reflects the nullable backend response.
3. **Feedback problem:** local registration errors were attached to fields above the final submit button, with only haptics at the point of submission. Login also returned early on local validation. Both screens now show the first local error by the Submit button. Backend validation errors previously became a generic message despite having field details; these now include field path/message. Incorrect credentials retain their explicit message.
4. **Confirmed session-isolation defects:** all order/address/draft/cart/favorite/notification providers survived logout and account changes. Old profile/me responses could still call setUser; an in-flight refresh could write DRIVER tokens after USER login. Providers are now remounted by authenticated identity, auth/API operations reject responses from previous sessions, and secure-storage operations are serialized. Tests delay real HTTP responses across the account switch and verify neither old identity nor old tokens win.
5. **Existing USER login: no general backend defect reproduced.** Real password-checked USER login succeeds by phone and email before and after DRIVER switching. `AuthService.login` uses the same lookup/password/active checks for USER and DRIVER; it does not deny USER. The user reported no displayed error but supplied no account identifier or origin, so the specific account's existence/password/active state cannot be established. A mock-created account has no automatic counterpart in FastAPI, but that is a possibility, not a verified explanation for this account. No passwords were reset, real accounts modified, mock fallback added, or backend authentication bypassed.

## Exact API schema and mobile payload

Endpoints are `POST /api/v1/auth/register` and `POST /api/v1/auth/login`, relative to the configured API base URL. Sources: `backend/app/api/routes/auth.py`, `backend/app/schemas/auth.py`, `backend/app/schemas/address.py`.

| Register JSON field | Backend requirement |
|---|---|
| fullName (also full_name accepted) | Required string, 2–160 characters |
| phone | Required string, 9–24 characters before normalization; valid Tanzanian mobile number |
| email | Optional EmailStr/null; empty string converts to null |
| password | Required string, 8–128 characters |
| confirmPassword (also confirm_password) | Required string, 8–128; must equal password |
| preferredLanguage | en or sw; default en; snake_case alias accepted |
| addressLocationPreference | single or multiple; default single; snake_case alias accepted |
| signupAddress | Optional/null DeliveryAddressPayload; snake_case alias accepted |

`signupAddress` fields: deliveryAddress (5–500 chars; fullAddress/full_address aliases), area (2–120), phone (9–24; contactPhone/contact_phone aliases), optional deliveryInstructions (max 800), nullable latitude (-90..90) and longitude (-180..180). Backend signup allows no address or coordinates. The existing mobile signup design asks for complete first-address fields and a pin; missing details are visible at Submit.

Actual screen request keys, asserted during an HTTP registration:

```text
fullName, phone, email, password, confirmPassword,
preferredLanguage, addressLocationPreference, signupAddress
```

`signupAddress` is produced by `normalizeDeliveryAddress`. No `role`, `audience`, `is_active`, `is_verified`, or equivalent camel-case privileged fields are constructed by the screen. Backend RegisterRequest forbids unknown top-level fields; tests verify forbidden fields are rejected with 422. That protection remains intact.

Login request: `{identifier, password}`; identifier length 3–255; password length 8–128. No role/audience is sent. The service posts with `authenticated=false`, so the previous Driver access token is not attached to login or registration.

Both successful responses are `{user, tokens}`. USER registration forces `Role.USER` in `AuthService.register`. The session contains `user.role="USER"`, `tokens.audience="mobile"`, and access/refresh JWTs with `aud="mobile"`. No role is decoded from JWTs in the mobile app. The user is returned by the shared backend serializer, saved directly into auth state, and returned to the screen for routing.

## Phone, email and password handling

`backend/app/utils/phone.py:normalize_tanzanian_phone` strips non-digits, removes an initial 00, and accepts `0[67]` plus eight digits, `[67]` plus eight digits, or `255[67]` plus eight digits. All normalize to +255 followed by nine mobile digits. Login normalizes phone using the same function as registration. Frontend phone checking now accepts those same forms, including formatting accepted by the backend, and rejects non-Tanzanian numbers. Length limits still apply to the raw backend request.

Backend email lookup trims/lowercases the login identifier; registration lowercases the validated email. Frontend registration trims/lowercases email, allows blank, and retains validation of a nonblank email. Backend null email is represented accurately in mobile User typing. The mock customer-record adapter still uses an empty display email for a null value; it is not selected in real API mode.

Passwords are not trimmed, case-folded or weakened. Frontend checks minimum 8 and now maximum 128, plus registration confirmation equality. Backend enforces the same length/equality and verifies the stored password hash during login. Existing wrong-password/inactive/missing-user checks remain unchanged.

## Error mapping

`services/api.ts:buildApiError` continues to unwrap backend detail.code/message and maps INVALID_CREDENTIALS to “Phone/email or password is incorrect.” PHONE_ALREADY_EXISTS and EMAIL_ALREADY_EXISTS remain distinct 409 errors. Validation field paths/messages now reach the screen instead of always displaying the generic 422 message.

`backend/app/core/exceptions.py:validation_exception_handler` previously put `exc.errors()` directly into JSONResponse. Model-level password mismatch can include a ValueError in ctx, which is not JSON serializable. The handler now returns only loc/msg/type. The regression checks HTTP 422 for mismatch and that neither password is echoed. Forbidden fields still return 422. This is an error-response correction, not a change to accepted roles or credentials.

## Repository, logout, caches and routing

`repositories/index.ts` selects apiRepositories because EXPO_PUBLIC_USE_MOCKS=false. `repositories/api.ts` delegates directly to services/auth and services/user, without coercing USER/DRIVER. There is no network-error fallback to mock authentication.

`AuthProvider.login/register` validate mobile audience and supported role, save tokens, set the returned user, and mark authenticated. A session-generation check prevents a superseded auth operation from applying state. Hydration restores through `/users/me`, which reads the database role.

Logout reads the existing refresh token, invalidates the local session and clears secure storage, then attempts remote revocation. Failure of remote revocation does not retain local login. All four token keys are cleared; queued storage reads/writes prevent mixed-session tokens. Profile/me and refresh responses from an older session are rejected. A subsequent login validates and stores only its own response.

`SessionProviders` in `store/app-providers.tsx` keys the subtree holding OrderProvider, CartProvider, FavoritesProvider and NotificationProvider by the current authenticated user ID, or unauthenticated/loading status. Logout and account change discard prior order, saved-address, draft, cart, favorite and notification state. Old promises belong to unmounted providers and cannot populate the next account's caches.

Routing is unchanged: `app/(auth)/login.tsx` and register.tsx call `router.replace(mobileLandingForUser(nextUser))`. `utils/role-routing.ts` selects USER -> `/(tabs)/home`, DRIVER -> `/driver/(tabs)/deliveries`. Actual customer and Driver layout guards are exercised after the real screen submits. No unconditional USER rejection or Driver-only login endpoint exists.

## Verification

The expanded `__tests__/auth-routing.integration.test.ts` uses an actual Uvicorn FastAPI server with isolated SQLite fixtures and real fetch/password verification/JWTs. It renders the actual registration/login React components, AuthProvider, account providers, and route guards. Native views, SecureStore/AsyncStorage, haptics, map input and Expo navigator primitives are test substitutes. Response-delay tests hold real HTTP responses; they do not fabricate authentication results.

Sequence exercised:

```text
Type registration fields in the mobile screen
-> POST /auth/register -> USER/mobile
-> auth store USER -> customer Home route
-> logout, secure storage empty
-> Login screen POST /auth/login for new USER -> customer Home route
-> logout
-> Login screen POST /auth/login for DRIVER -> Driver deliveries route
-> logout
-> Login screen POST /auth/login for the same new USER -> customer Home route
```

Additional cases: exact request keys; normalized saved delivery phone; optional whitespace-only email -> backend null; explicitly entered delivery phone preserved; USER phone/email login and backend-accepted phone formats; wrong password; duplicate phone; malformed registration; visible local errors; USER/DRIVER restore and expired Driver access-token refresh; account caches cleared; late Driver me/refresh responses cannot overwrite USER. Backend tests also cover forbidden fields and JSON-safe validation errors.

Final verification completed 2026-09-08:

| Check | Result |
|---|---|
| `npm run test -- --maxWorkers=1 --reporter=verbose` | PASS: 45 tests, 8 files; full trace in output/audit/user-auth-tests.log |
| `python -m pytest -q` (backend) | PASS: 44 tests |
| `python -m ruff check .` (backend) | PASS |
| `npm run typecheck` (after nullable-email display fixes) | PASS |
| `npm run doctor` (final resumed check) | 20/21: dependency patch mismatch; expected Expo ~57.0.21 / Expo Router ~57.0.20, installed 57.0.20 / 57.0.19. No dependency upgrade made. |
| Configured LAN API health, after refreshing .env address | HTTP 200 |
| Live existing FastAPI registration with deliberately mismatched fixture passwords | HTTP 422 VALIDATION_ERROR; validation-only probe, no account created |

Initial runs included a reproduced pre-fix registration failure, native test-stub setup corrections, and resource-related backend-start/data-mode timeouts. The final single-worker suite has no skipped tests. The renderer emits deprecation/effect-flushing warnings; these tests verify real API behavior and rendered route decisions, not a physical Android navigation session or the unidentified existing USER account.

On resumption the configured LAN hostname was stale after the computer's Wi-Fi address changed. Only `.env` was updated to the detected current Wi-Fi address, preserving port 8000, /api/v1 and API mode; no LAN IP was hardcoded in source. The configured URL now responds. Metro was restarted with a cleared cache and LAN mode. Reload Expo Go for the updated environment and auth/session code.

## Files changed in this follow-up

- app/(auth)/register.tsx; app/(auth)/login.tsx: phone fallback and visible validation feedback.
- utils/validation.ts; services/auth.ts; types/user.ts; repositories/mock/index.ts; repositories/mock/mock-data.ts; customer/Driver profile email inputs: API-compatible phone/email/password handling and nullable response typing.
- services/api.ts; store/auth-context.tsx; storage/secure-token-storage.ts; store/app-providers.tsx: session isolation and validation error mapping.
- backend/app/core/exceptions.py: JSON-safe validation errors.
- __tests__/auth-routing.integration.test.ts; __tests__/validation.test.ts; backend/tests/test_auth.py: targeted regression coverage.

No features, account migration, account creation in the user's database, role permissions or routing redesign were added. The API-mode/port/path configuration was preserved; the stale LAN hostname was refreshed only in .env on resumption.
