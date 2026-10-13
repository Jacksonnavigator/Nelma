# NELMA — UI/UX redesign handoff

## What changed

The existing TanStack Start application was refined in place. Its routes, service repositories, backend integration, original brand assets, and role permission map are retained. This is a source-code deliverable, not a replacement static mockup.

- **Workspace shell:** navigation grouped into Operations, Business, Administration, and Workspace; stronger active-page indication; mobile drawer; skip-to-content link.
- **Page navigation search:** permission-filtered destinations, mouse and keyboard selection, Ctrl/Command K shortcut, and a clear no-results message. This searches pages, not customer records.
- **Appearance:** Light, Dark, and Use device theme options. Selection is saved locally when browser storage is available; device-theme changes are observed.
- **Dashboard:** clearer primary versus secondary metrics, more readable panels, permission-aware quick actions, full metric values rather than truncated amounts, and per-panel request errors with retry actions.
- **Order table:** reduced from 12 columns to 8 by grouping customer/phone, product/quantity, delivery/date window, and payment/status. Existing fields remain available. Sorting retains the original behavior: it sorts the current page, not the entire backend result set.
- **Sign-in:** branded split layout, responsive mobile layout, password-visibility control, loading feedback, and announced error feedback.
- **Shared controls:** stronger focus indicators, 44px standard button/input/select controls, more readable filters and statuses, roomier tables, contained modal scrolling, reduced-motion support, and improved pagination semantics.
- **Cards and charts:** readable supporting text, wrapping card headers, and refined chart framing. Existing chart data and chart types are preserved.

No new runtime dependency was added. An npm lockfile is included for reproducible installation.

## Run safely in demo mode

1. Install Node.js 22.12+ (Node 24 was used for verification).
2. In the `admin` directory, run `npm ci`.
3. Copy `.env.example` to `.env`.
4. Set `VITE_DATA_MODE=mock` in `.env` before running the app.
5. Run `npm run dev` and open the local URL printed by Vite.

The bundled mock repository contains demo-only staff accounts. See `DEMO_IDENTITIES` in `src/services/mock/index.ts`. Mock mutations are in-memory and are discarded on reload. The mock sign-in session is retained by the app's existing local-storage implementation.

For the real backend, use your existing local `.env` configuration and set `VITE_DATA_MODE=api`. The original `.env` was intentionally **not** included in this deliverable. Keep your configuration backed up when replacing source files. Live API integration was not exercised during this redesign.

## Verification status

- TypeScript: `npm run typecheck` passed.
- Unit/regression tests: `npm test` passed all 14 tests (9 existing plus 5 interface-foundation tests).
- Production compilation: `npm run build` passed in mock mode.
- Core color pairs were calculated for contrast. Sample ratios: light body on card 15.29:1; light secondary on card 5.77:1; primary-button text 5.86:1; light input boundary 3.22:1; dark secondary on card 7.33:1; dark input boundary 4.82:1. These are sampled token checks, **not** a complete accessibility audit.
- **Browser visual and interaction QA is pending.** Starting a local preview was blocked by a safety gate and requires user approval. No screenshots were reviewed, and no claim is made that every route or interaction has been visually verified.

## Finish-before-release checklist

After approving or running the local preview:

- Inspect all routes at desktop and approximately 390px mobile widths; also smoke-test 320px.
- Check both roles, all sidebar groups, collapsed navigation, the mobile drawer, and page-search keyboard/focus behavior.
- Check Light, Dark, and Use device theme, including reopening the app and storage-disabled behavior.
- Exercise sign-in errors, password visibility, sign-out, and password reset.
- Exercise order search, filters, current-page sorting, pagination, details, and create-order validation.
- Verify driver assignment and all permitted operational mutations against a test backend.
- Check every chart, tooltip, loading state, empty state, request-error state, dialog, and confirmation state.
- Confirm no clipped text, overlaps, page-level horizontal overflow, or lost keyboard focus.
- Run a complete contrast, keyboard, and screen-reader accessibility review.

## Packaging

Included: app source, existing public assets and documentation, `package-lock.json`, and this handoff.
Excluded: `.env`, installed dependencies, generated build output, deployment caches, and local preview artifacts. Rebuild using your chosen environment before deployment; a prebuilt demo bundle is not included.
