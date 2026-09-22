# Immediate logout after successful login ? 2026-09-08

The supplied log shows successful login/public requests followed by 401s on protected endpoints. A weak-key warning is separate from token persistence: the warning itself does not strip the bearer header.

## Reproduced bug

storage/secure-token-storage.ts previously made save() a silent no-op whenever Expo SecureStore.isAvailableAsync() was false. getAccessToken()/get() then returned null. AuthProvider still accepted the successful login and marked the user authenticated. The API client sent protected requests without Authorization; a 401 could not be refreshed because no refresh token existed, and the unauthorized handler cleared auth state.

The installed Expo SecureStore web implementation is empty and reports unavailable. This explains the failure in that runtime; the user's exact phone runtime has not been confirmed. The regression reproduced null access-token storage immediately after a real password-checked login on an isolated FastAPI fixture server. Existing backend accounts were not accessed.

## Fix

- storage/secure-token-storage.ts retains tokens in module memory when SecureStore is unavailable. Protected requests and refresh use this same session. Logout clears it. No fallback tokens are placed in localStorage or AsyncStorage.
- Native SecureStore persistence and serialized storage operations remain unchanged.
- Memory-only sessions last for the current JavaScript runtime. A browser page reload requires a fresh login; native persisted-session restore remains supported.
- __tests__/auth-routing.integration.test.ts now covers SecureStore unavailable, login, authenticated profile/orders/address loading, access-token refresh and logout against the real isolated FastAPI server.

## Signing-key warning

Created a random key of more than 32 bytes in ignored backend/.env; the value is never printed. backend/app/core/config.py now resolves that environment file relative to the backend directory. Previously a root-directory process could load the mobile .env instead and retain the short default key. Signing verification using the backend virtual environment now reports key length sufficient and zero key warnings. The existing auto-reloading server picks up the configuration change. Rotating this key invalidates old tokens once: sign in again.

## Verification

- Before-fix regression: failed because access token was null immediately after successful login.
- Mobile suite: 46 tests passed (8 files), including secure native storage and memory-only storage paths.
- npm run typecheck: passed.
- Backend Ruff: passed.
- Backend full pytest: 50 passed in 88.35 seconds (final verification 2026-09-09). Output: output/audit/session-backend-tests.log.

Native phone interaction was not automated. No role checks, password verification or protected endpoint authorization were weakened.
