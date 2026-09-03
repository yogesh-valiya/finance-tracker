---
trigger: always_on
---

# Development & Architecture Standards — REQUIRED

- **Architecture**: Enforce single responsibility; separate presentation from business hooks/services; no monolithic components.
- **Deep Linking**: Direct URLs for all primary views, step flows, and drawer detail routes; query params for filters/sort; native deep links map to web routes.
- **Online Support**: Currently app is online only app, no offline support is intended in intial version.
- **PocketBase Client**: Use centralized singleton client (`src/lib/pocketbase.ts`); bind `pb.authStore` to storage; enforce typed collections; use safe filter formatting.
- **Forms & Numpad**: Deterministic arithmetic parser for inline equations (no `eval`); `zod` + `react-hook-form` validation; debounce submission buttons.
- **Charts & Visualizations**: Honor user color schemes (`Set A` vs `Set B`); touch-friendly pinned inspection badges (no hover tooltips); handle zero/empty data gracefully.
- **Testing & Verification**: 100% unit test coverage on all financial/ledger math utilities; deterministic fixtures; test leap-year and month-end boundary cases.
- **Billing Periods**: Dynamic monthly calculation based on user start date setting (e.g. 25th → 24th); standard date-fns usage.
- **Auth & Data Isolation**: Strict login-only access (immediate redirect to `/login` if unauthenticated); all PocketBase queries scoped to `@request.auth.id`; never store sensitive plaintext secrets in local storage.
- **Financial Integrity**: Zero floating-point arithmetic on currency (use integer minor units or precision math helpers); atomic double-entry transfer parity; safe account deletion without silent cascade.
- **Mobile-First UX**: Design for 360–430px viewports first; minimum 44x44px touch targets; no hover-only flows; prevent accidental horizontal overflow.