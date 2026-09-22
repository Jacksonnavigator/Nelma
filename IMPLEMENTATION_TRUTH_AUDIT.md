# NELMA implementation truth audit — 2026-09-07

## A. Current Implementation Audit (before fixes)

This is an audit of the source in this workspace, not confirmation of the binary on the phone. No mobile `.env` or shell `EXPO_PUBLIC_*` overrides were present. Only `.env.example` existed; it sets mocks to true and contains an example hosted URL. EAS profiles contain no data-mode settings. No Git repository is available here. Backend health on `127.0.0.1:8000` returned OK; its OpenAPI exposes the current auth routes. A read-only aggregate of `backend/nelma.db` found one active DRIVER, one SYSTEM_ADMIN and two USERs. The root `nelma.db` has no users table. Account credentials and the phone's compiled environment were not available.

### Authentication contract and identity

- API implementation: `services/auth.ts:login` posts to `${EXPO_PUBLIC_API_URL}/auth/login`; normal base prefix is `/api/v1`. JSON request: `identifier` (3–255 characters), `password` (8–128). No requested role or audience is accepted/needed for login.
- Backend: `backend/app/api/routes/auth.py:login` → `AuthService.login` → `_issue_session`. It looks up the normalized email/phone, checks password and active status, allows USER/DRIVER on mobile, and returns `AuthSession(user=user_to_read(user), tokens=...)`. Dashboard roles use `/auth/dashboard/login` and audience `dashboard`.
- Response schema: `{user: {id, fullName, phone, email, role, isActive, avatarUrl, preferredLanguage, addressLocationPreference, notificationPreferences: {orderUpdates,paymentUpdates,promotions,systemAnnouncements}, createdAt}, tokens: {accessToken,refreshToken,expiresAt,audience}}`. Email/avatar can be null. The mobile User type incorrectly requires a string email and omits isActive, but the API repository does not transform the JSON or change role.
- `backend/app/services/serializers.py:user_to_read` serializes `user.role.value` with a USER fallback only for an empty value. A real database DRIVER serializes as `"DRIVER"`. `_issue_session` explicitly supplies `SessionAudience.MOBILE`; both signed JWTs have `aud: "mobile"`. JWT claims contain sub/type/aud/jti/iat/exp, **not role**. Role comes from the database user, not token decoding in the app.
- `GET /api/v1/users/me` uses `CurrentUser` (mobile audience, database lookup), `UserService.read_current`, and the same serializer. It does not force USER. The misleading “customer profile” endpoint summary is not an authorization restriction.

### Actual mobile runtime selection

`config/env.ts` originally used `process.env.EXPO_PUBLIC_USE_MOCKS !== "false"`. Missing configuration therefore means **MOCK MODE**. `repositories/index.ts` selects `mockRepositories`; the configured example URL is not loaded automatically from `.env.example`. `AuthProvider` calls this repository, not authService directly. The real API adapter in `repositories/api.ts` preserves the entire session and delegates me to `userService.me` without role mapping.

`repositories/mock/index.ts:auth.login()` takes no arguments, ignores credentials, reads `mockStorage.getUser()`, and returns fake tokens with mobile audience. `repositories/mock/storage.ts` reads `nelma.mock.user` from AsyncStorage; if missing it seeds `mockUser` from `mock-data.ts`: id `user_001`, name Jackson Mrema, role USER. Stored uppercase DRIVER is preserved, but unknown/lowercase mock roles become USER. Mock logout does not remove this identity. This is a substitute login, not successful backend authentication followed by an overwritten backend response.

### Store, logout and restore

`store/auth-context.tsx:login` validates mobile audience and exact USER/DRIVER role, saves tokens, sets `user` to `session.user`, sets authenticated, and returns that same user. No USER fallback exists in this API login path. Register uses the same checks.

SecureStore (`storage/secure-token-storage.ts`) persists accessToken, refreshToken, expiresAt and audience only; **no user or role is stored there**. Missing/unknown stored audience is normalized to mobile. On restart hydrate loads tokens, rejects dashboard audience, calls selected `repositories.auth.getCurrentUser()`, validates role, and restores that user. In API mode this is `/users/me`; in mock mode it is the local mock identity. Login itself does not call me. On 401 the API client rotates via `/auth/refresh`, saves returned tokens and retries me. Refresh does not apply its returned user to auth state during ordinary requests. On hydrate failure the session is cleared. If SecureStore is unavailable (including ordinary web use), save is a no-op and restart cannot restore a session.

Logout attempts server refresh-token revocation, suppresses its error, clears all four secure keys, and clears auth user/status. It does **not** clear mock identity, order/address/draft state, cart, favorites, or notification caches: those providers sit above route groups and are not keyed by account. These stale caches cannot directly change `auth.user.role`, but can show prior-account content. In-flight profile/me requests lack session-generation checks and can set state late; this is a separate potential race, not evidence of the reported failure.

### Routing graph and guards

| Entry / condition | Actual route or behavior |
|---|---|
| `app/index.tsx`, authenticated | `mobileLandingForUser(user)` |
| `app/(auth)/login.tsx:submit` | `const nextUser = await login(input); router.replace(mobileLandingForUser(nextUser))` |
| `app/(auth)/register.tsx` | Same returned-user landing helper |
| `app/(auth)/_layout.tsx`, authenticated | Redirect through same helper |
| `utils/role-routing.ts` | `role === "DRIVER" ? "/driver/(tabs)/deliveries" : "/(tabs)/home"` |
| `app/_layout.tsx` | Automatic Expo Stack, no unconditional customer initialRouteName |
| `app/(tabs)/_layout.tsx` | Loading screen, unauthenticated → login, exact DRIVER → deliveries; otherwise customer Tabs |
| `app/driver/_layout.tsx` and driver tab layout | Loading screen, unauthenticated → login, non-DRIVER → customer Home, DRIVER → Stack/Tabs |
| `app/driver/index.tsx` | Driver deliveries redirect |
| Customer order/orders layouts, cart, checkout, favorites, products | Explicit DRIVER rejection to deliveries |
| Customer profile layout | DRIVER → Driver profile |
| Support/legal layouts | Shared authenticated routes |
| `app/business/_layout.tsx` | Always redirects to mobile landing; business index's customer-profile redirect cannot expose a dashboard |

Thus USER startup/login/restore selects customer Home; DRIVER startup/login/restore selects Driver deliveries if the stored auth user is DRIVER. No current authenticated DRIVER path through customer tabs permits Home to mount. Unknown/null authenticated roles default to customer in helpers/guards, but normal login/hydration rejects those values.

Driver tabs explicitly register `deliveries`, `history`, `notifications`, `profile`. Driver Stack exposes `delivery/[id]`, `profile/edit`, `profile/security`. Deliveries and history cards push `/driver/delivery/[id]`; Driver notifications push the same detail route; profile links expose edit/security. These are connected routes, not just files. Native push response handling in `store/app-providers.tsx` instead always pushes `/orders/[id]`; the customer guard then redirects a Driver to deliveries, losing the selected detail.

Customer-only redirects remain in order index/quantity/payment/summary/success, business index and customer order error states. Their parent guards prevent DRIVER Home access. They are not the successful-login routing path.

### Role representations

Canonical account roles in TS types, Python enum/schema, auth/store guards and persisted model: USER, DRIVER, SALES_MANAGER, SYSTEM_ADMIN. Backend `coerce_role` uppercases inputs and falls back to USER for unknowns; mock normalization only recognizes exact uppercase privileged roles and otherwise falls back to USER. UI “Driver”, route segment `driver`, message sender `customer`/`nelma`/`system`, and order source USER_MOBILE/SALES_MANAGER_DASHBOARD are labels/domains, not alternate auth roles. Audience is separately lowercase mobile/dashboard. No API adapter lowercases DRIVER.

### Driver backend endpoints and actual screen wiring

All paths below have `/api/v1` prefix. Since pre-fix workspace defaults select mocks, these are **IMPLEMENTED BUT NOT USED BY MOBILE** in that mode. In explicit API mode all six are wired and qualify as IMPLEMENTED AND USED at source level (device execution remains unverified).

| Capability | Backend implementation | Mobile call |
|---|---|---|
| Assigned deliveries | GET `/driver/deliveries`; permission plus assignedDriverId query | Deliveries and History → repositories.driver.listDeliveries → services/driver.ts |
| Detail | GET `/driver/deliveries/{id}`; assignment-scoped lookup, 404 for another driver | `app/driver/delivery/[id].tsx` → getDelivery |
| Update | PATCH `/driver/deliveries/{id}/status`; restricted transitions and assignment | Detail → updateStatus |
| Receipt | POST `/driver/deliveries/{id}/received`; delivered prerequisite, records confirming actor | Detail → confirmReceived |
| Notifications | Shared GET `/notifications`, PATCH `/{id}/read`, POST `/read-all`; owner-scoped | Driver notifications → shared notification context/repository; filters driver_* and system_announcement |
| Profile | Shared GET/PATCH `/users/me`, PATCH `/users/me/security` | Auth user in profile; Driver edit/security → auth context → user repository |

Driver history filters the same assigned-delivery list locally, with client-side search/date/paging. Delivered remains active until received; received/cancelled are history. Backend returns an unpaginated list despite the client's pagination query parameters. Maps are external geo/Apple/Google URLs, not live vehicle tracking. Call customer uses `Linking.openURL("tel:" + sanitizedPhone)`; launch failures are swallowed. Both use delivery details, no separate backend integration.

### Full status table

Status below describes the **pre-fix system**, not promises of production readiness. WORKING means a concrete backend/local implementation exists; mobile PARTIALLY WORKING means UI/repository wiring exists but real API execution is disconnected by defaults and/or device verification is missing.

| Feature | Status | Evidence | Notes |
|---|---|---|---|
| MOBILE USER — login | BROKEN | mock auth.login ignores input | Real credentials are not checked under default configuration |
| Registration | PARTIALLY WORKING | auth context; API register; mock register | Mock registration only persists local user |
| Customer routing | WORKING | entry/auth/customer tab guards | Correct for an actual USER auth identity |
| Order flow | PARTIALLY WORKING | order context; services/orders; backend order_service | Current mock persistence; actual /order flow wired; generic checkout is a redirect/instruction screen |
| Addresses | PARTIALLY WORKING | addresses repository/service/routes | CRUD implemented, default mode local |
| Payment screen | PARTIALLY WORKING | order/payment; payment_methods; provider factory | No real payment provider; mobile-money disabled in UI |
| Order tracking | PARTIALLY WORKING | orders/[id]; OrderProvider.getOrder | Cache-first detail, no live GPS/polling; can remain stale |
| Notifications | PARTIALLY WORKING | notification context/routes/service | Inbox implemented; native push delivery not connected |
| Profile | PARTIALLY WORKING | auth updateProfile; users/me | Mock profile and no-op mock password change by default |
| MOBILE DRIVER — login | BROKEN | repository selection + mock login | Existing backend DRIVER never consulted by mock login |
| Driver routing | NOT CONNECTED | helper and Driver/customer guards | Correct routes exist, default identity is USER |
| Deliveries list | PARTIALLY WORKING | driver deliveries screen + repository | Mock seeds have no driver assignment; API adapter implemented |
| Delivery details | PARTIALLY WORKING | driver detail + getDelivery | Assignment error handling implemented; default local data |
| Status update | PARTIALLY WORKING | detail actions + updateStatus | Backend validates transition/ownership; default local mutation |
| Maps | PARTIALLY WORKING | openLocation/buildExternalMapUrl | External app launch; no device launch verified, no live tracking |
| Call customer | PARTIALLY WORKING | detail callCustomer/tel URL | Dialer handoff only; not device tested |
| Receipt confirmation | PARTIALLY WORKING | detail confirmReceived + backend actor fields | Implemented in both adapters |
| History | PARTIALLY WORKING | filterDriverHistory/listDeliveries | Current assignment list, not immutable assignment history |
| Notifications | PARTIALLY WORKING | driver inbox + shared service | Assignment/reassignment events generated; other driver event templates have no demonstrated emitters |
| Profile | PARTIALLY WORKING | driver profile/edit/security | Real user endpoints wired; default mock data |
| BACKEND — USER auth | WORKING | auth_service + test_auth | Password verification, registration, refresh/revoke implemented |
| DRIVER auth | WORKING | mobile login allowlist + role tests | Driver user serialized unchanged |
| SALES_MANAGER auth | WORKING | dashboard login + role tests | Mobile login rejected |
| SYSTEM_ADMIN auth | WORKING | dashboard login + role tests | Mobile login rejected |
| Mobile audience | WORKING | security/dependencies/auth_service | Signed aud and database role enforced |
| Dashboard audience | WORKING | separate login/refresh/dependency | Cross-surface tokens rejected |
| Driver account creation | WORKING | drivers routes/account_service | Sales Manager/System Admin management; forced DRIVER role |
| Driver assignment | WORKING | business order driver patch | Active DRIVER validation, notifications, audit |
| Driver delivery endpoints | WORKING | driver routes/order_service | Assignment boundaries, ordered status changes, receipt actor |
| Pricing | WORKING | pricing_service/settings_service | Server recalculates product and delivery charges |
| Orders | WORKING | order_service/repository/routes | Ownership, snapshots, transitions, customer/business creation |
| Notifications | PARTIALLY WORKING | notification_service + development provider | Database inbox works; real push dispatch missing |
| Audit logs | PARTIALLY WORKING | audit_service/account/pricing/assignment events | Admin read API works; not all delivery/receipt actions audited |
| Sales reporting | PARTIALLY WORKING | business_service.dashboard | Today/month aggregates; UTC periods, queues capped at 25 from latest 200, no arbitrary-period export |
| Dashboard accounts | WORKING | admin/accounts + account_service | SYSTEM_ADMIN management; no dashboard frontend here |
| DASHBOARD BACKEND READINESS — order APIs | PARTIALLY WORKING | business/orders + dashboard queues | Create/detail/status exist; comprehensive paginated operational list missing |
| Delivery APIs | PARTIALLY WORKING | business status/driver + dashboard queues | Operations exist; no complete dedicated delivery list/history API |
| Driver APIs | WORKING | /drivers CRUD/activate/deactivate | Deletion deliberately returns 405 |
| Pricing APIs | WORKING | GET settings/public, PATCH settings/pricing | Concrete persistence + permission checks |
| Admin account APIs | WORKING | /admin/accounts | Concrete management endpoints |
| Audit APIs | WORKING | GET /audit-logs | Admin-only bounded list, not an advanced audit explorer |
| Reporting APIs | PARTIALLY WORKING | GET /business/dashboard | Fixed daily/monthly reports only |

Production payment integration: NOT IMPLEMENTED (factory supports development only). Push registration helper: NOT CONNECTED (no caller or mobile POST push-token registration). Production password-reset delivery: NOT IMPLEMENTED. Separate web dashboard frontend: NOT IMPLEMENTED in this workspace. Database inbox and delivery services are not mere scaffolds.

### Existing tests (before additions)

`__tests__/driver-deliveries.test.ts` has six tests: landing helper, transition predicates, labels, delivery filtering, history grouping, map URL construction. All are pure utilities with constructed Order objects. None mounts auth, runs a route guard, uses the real API repository, or contacts FastAPI. Other frontend tests cover address/delivery/pricing/status/validation utilities.

`backend/tests/test_role_authorization.py` has eight tests: explicit permission matrix (pure logic); mobile/dashboard login separation; audience separation; privileged-field injection; account management permissions; business-order/admin restrictions; driver assignment/ownership/transitions/receipt/notifications; audit/settings/pricing permissions. The latter seven use real FastAPI TestClient, password hashes, JWTs and a reset SQLite test DB. They are backend integration tests, not mobile tests. `test_auth.py` tests customer login/refresh/logout; `test_order_business_features.py` tests signup preferences/address and real reporting; neither proves mobile Driver routing. No original test verifies phone login, SecureStore restoration, account switching or rendered Expo navigation.

## B. Exact Cause of Driver Routing Bug

Confirmed workspace-default path:

1. Missing `.env` → `config/env.ts:env.useMocks` evaluates true.
2. `repositories/index.ts` selects mockRepositories.
3. `AuthProvider.login` → `mockRepositories.auth.login()` ignores entered DRIVER credentials.
4. `mockStorage.getUser` → stored mock identity or seeded `mockUser.role = "USER"`.
5. Auth store saves that USER session; `LoginScreen.submit` passes returned USER to `mobileLandingForUser`.
6. `isDriverRole("USER")` is false → `router.replace("/(tabs)/home")`; customer guard permits USER.

There is no backend response in this failing path. Claiming a verified real DRIVER response becomes USER in current routing code would be false. This diagnosis applies to the current workspace defaults; if the installed app really has mocks=false, its bundle/environment/session must be inspected separately.

## C. What Is Truly Complete

Concrete mobile role routing and guarded Driver screens exist. The API adapters preserve role. Backend mobile/dashboard auth, assigned-delivery operations, account management, orders, pricing and database inbox operations have executable implementations and backend integration coverage. “Complete” here does not mean deployed or verified on the user's device.

## D. What Is Only Scaffolded / Waiting

Real mobile API configuration and native end-to-end verification; production payment/reset/push providers; push registration and role-aware push deep links; account-scoped cache cleanup; reliably fresh customer tracking; broader dashboard list/report APIs and a separate dashboard UI. API and UI work should not be rebuilt merely because mock configuration disconnected them.

## Recommended Fix Order

1. Fix this incident only: make mock mode explicit opt-in; configure the actual reachable API base URL; restart Metro/rebuild an installed app so changed Expo public variables take effect. Keep existing role routing intact.
2. Verify real repository → auth state → route guards with USER/DRIVER switching and restoration, including token refresh. Distinguish simulated native storage/navigation from a physical-device run.
3. Separately scope account cache/in-flight request isolation and role-aware notification links.
4. Build production payment/push/reset integrations and reliable tracking refresh.
5. Expand operational dashboard APIs/reporting, then connect a separate dashboard frontend.

## E. Minimal Fixes Applied

The audit above was completed and written before application changes. The user subsequently confirmed Expo Go/local Metro on Android and supplied the reachable LAN base URL.

- Created mobile `.env` with the user-provided base URL, `EXPO_PUBLIC_USE_MOCKS=false`, and timeout 15000. The actual LAN IP is configured only in `.env`, not application code.
- Changed only the mock-selection predicate in `config/env.ts` to `process.env.EXPO_PUBLIC_USE_MOCKS === "true"`. Missing configuration now chooses the API adapter; absent API URL produces the existing configuration error instead of fake successful login.
- Updated `.env.example` to API mode with a blank URL and platform examples; demo mocks remain explicit opt-in.
- Kept existing auth role mapping, store and routing unchanged: they already preserve DRIVER and select the correct interface.
- Added `__tests__/data-mode.test.ts`, `__tests__/auth-routing.integration.test.ts`, and isolated `backend/tests/mobile_trace_server.py`. Added matching React test renderer/type development dependencies and lockfile updates. No real accounts or passwords were modified. The backend trace creates fresh USER/DRIVER fixtures in a temporary database on a separate dynamically allocated loopback port.
- Started Metro with `--clear --lan --port 8081`; log confirms `.env` was loaded. Configured LAN backend health returned HTTP 200 from this computer. This does not prove the phone's network access.

Shared cache cleanup, push routing and production providers are explicitly left for separate work, as requested.

## F. Verification Results

| Command | Final result |
|---|---|
| `npm run typecheck` | PASS |
| `npm run test` | PASS ? 37 tests, 8 files |
| `npm run doctor` | PASS ? 21/21 checks |
| `python -m ruff check .` (backend) | PASS |
| `python -m pytest -q` (backend) | PASS ? 43 tests |

Initial verification caught test-harness typing, unused-noqa and React-effect flushing issues; these were corrected before the final passes. React's test renderer emits a deprecation warning; the tests pass, but this harness is not a replacement for native end-to-end tooling. The new integration suite requires the backend Python dependencies to be installed (`PYTHON` may select the interpreter).

Executable trace: real selected API repository ? real fetch over HTTP ? isolated FastAPI/password verification/SQLite/JWTs ? actual React AuthProvider ? actual index/auth/customer/Driver layout conditions. SecureStore and AsyncStorage are in-memory substitutes; Expo Redirect/Stack/Tabs and icons are host test components. This verifies rendered guard decisions, **not native Expo navigation or the physical phone's final screen**. The Login screen's submit call is source-inspected; the test invokes the same provider login directly.

```text
BEFORE: mock login -> backend request absent -> USER -> /(tabs)/home
AFTER: API login -> USER / mobile -> auth store USER -> /(tabs)/home
RESTORE: USER -> /users/me -> /(tabs)/home
AFTER: API login -> DRIVER / mobile -> auth store DRIVER -> /driver/(tabs)/deliveries
RESTORE: DRIVER -> /users/me -> 401 -> refresh -> /users/me -> /driver/(tabs)/deliveries
AFTER: API login -> USER / mobile -> auth store USER -> /(tabs)/home
RESTORE: USER -> /users/me -> /(tabs)/home
```

Between every role the test logs out, checks auth user is null and secure storage is empty, and confirms the backend rejects reuse of the revoked refresh token. A stale local mock USER remains present throughout the real API trace and does not replace DRIVER. Both access and refresh JWT payloads were checked for `aud=mobile`. No passwords or token values were logged.

Actual DRIVER user returned in the final isolated HTTP trace (fixture, not the user's existing account):

```json
{"id":"629d072d-d993-488d-9d83-392d4d3d6ae5","fullName":"Trace DRIVER","phone":"+255710000002","email":"driver@trace.example.com","role":"DRIVER","isActive":true,"avatarUrl":null,"preferredLanguage":"en","addressLocationPreference":"single","notificationPreferences":{"orderUpdates":true,"paymentUpdates":true,"promotions":false,"systemAnnouncements":true},"createdAt":"2026-09-07T16:14:01.639250+00:00"}
```

Metro also served the Android SDK 57 manifest and successfully compiled the Android development bundle (3544 modules). The configured API URL is present in the generated bundle, and its virtual environment sets EXPO_PUBLIC_USE_MOCKS to false. This confirms the new configuration is served by Metro, without claiming a device login.

Full frontend verification output: `output/audit/mobile-tests.log`. Existing backend account credentials were not available, so its authenticated response and on-device USER/DRIVER switching/restart are **not claimed as verified**. Reload Expo Go from the cleared Metro session and sign in; stale mock tokens will be rejected by the real API and hydration will clear them.

## G. What Should Be Built Next

After the routing/configuration fix, prioritize session data isolation and production integration gaps above. Do not label production payments, push or the dashboard as complete based on the existing stubs or utility tests.
