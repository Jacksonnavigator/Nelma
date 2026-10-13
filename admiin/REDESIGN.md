# NELMA — Taste-informed redesign, second pass

This pass replaces the dashboard composition rather than only restyling its components.

## Skills actually used

- **design-taste-frontend**: read the complete bundled SKILL.md; generated three directions; chose `product-performs` / The product performs, seed **1987354453**; read composition, copy, and critique references; ran the source linter.
- **UI/UX Pro Max**: read the bundled skill and professional rules; verified the **Logistics/Delivery** product match (Minimalism & Swiss Style + Flat Design; Real-Time Monitoring + Route Analytics). The generic marketing pattern from the first design-system result was rejected as inappropriate. Both React stack queries returned no matches; no stack-dataset match is claimed.

Taste explicitly excludes dashboards. Its concept, hierarchy, flat-tone treatment, and composition principles inform this app, while app usability comes from Pro Max and the existing workflows. Its marketing hero, photograph quota, and motion quota are not applied to staff work screens.

## Visible changes

- A **navy navigation rail**, rather than the old all-white sidebar.
- A **blue revenue summary**, followed by quieter supporting figures, rather than eight equal competing metric cards.
- A reorganized **main working area and dispatch desk**.
- **Pending orders / Assign drivers** switcher, populated by the existing services. The assignment action opens the existing deliveries workflow; it does not simulate driver assignment.
- A **Week / Month** sales-period switcher, connected to the real sales-service contract.
- A compact delivery-flow summary, recent-order table, and activity rail.
- Mobile-specific metric and order-list layouts.
- Order search and status remain readily available; **advanced filters are expandable**, with an active-filter count and Clear all action.
- The sign-in screen has a new flat-blue typographic composition; the earlier three-icon feature formula was removed.

All original routes, service repositories, backend modes, roles, permission checks, and public brand assets remain. This is the existing app's source, not a separate mockup.

## Direction and decisions

Detailed inventory, copy, tokens, and adaptation decisions are in `design-system/nelma-operations/MASTER.md`. The generated direction sheet is in `.taste-skill/direction.json`. No script redraw was used. The app-scoped composition adaptation is explicit in the master document.

## Checks performed

- TypeScript check passed; all **14 tests** passed; mock-mode production build passed.
- Real local Chromium screenshots reviewed individually at 1440px, 768px and 390px for dashboard/sign-in; major admin routes reviewed at desktop, orders and create-order at mobile.
- Browser checks: Week/Month, dispatch queue switch, mobile drawer, expandable filters, empty-search state, Ctrl/Cmd K navigation, persisted dark mode, sales-table Next, sales-manager Create order, and assignment-dialog opening.
- No page JavaScript errors or horizontal overflow in the recorded checks. Switch targets measured 48 × 44px.
- Scoped Taste source lint: **five core sources, zero findings**. This is not a whole-app lint pass. The sign-in browser inspector passed with documented application exceptions: few-pictures, no-footage, focal-point, still-page, eyebrow. Staff sign-in and brand marks are not a marketing campaign.
- Independent static login render: no failed resources, console errors, clipping or viewport overflow.
- Screenshot review caught and fixed the dark-background cascade, undersized/stale chart painting, mobile task ordering, rotated refill photo, and overly long sales records.
- Sales records now paginate in groups of 20; CSV continues to include the full filtered dataset.

**Scope:** all previews use the existing demo services, prominently labelled Demo data. Live API sign-in, SMS/email recovery, payments, data persistence, security, full mutation workflows, screen-reader behaviour, cross-browser compatibility and a complete accessibility audit remain unverified. This is an improved source package, not a production deployment or a claim of perfection. Existing mock settings and sample addresses remain demo values.

QA details and the three-round critique are in `design-system/nelma-operations/QA.md`; actual captures are in `previews/`.

## Local setup

1. Run `npm ci` inside `admin`.
2. Keep your existing `.env` backed up; it is excluded from this deliverable.
3. For a safe demo, copy `.env.example` to `.env` and set `VITE_DATA_MODE=mock`.
4. Run `npm run dev`; open the URL Vite prints.
5. Demo identities are in `src/services/mock/index.ts`.

For your backend, restore your own configuration and use `VITE_DATA_MODE=api`. Rebuild for the chosen environment. Mock mutations are in-memory and reset on reload; a mock build is not a live deployment.

MIT notices from both design-resource bundles are included. No third-party photographs, fonts, or motion packages were added.
