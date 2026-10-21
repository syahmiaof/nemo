# Sprint 5.4 — Playwright Regression Report

## Final run

Final full run: `npm run test:e2e` — **50/50 passed** (25 Desktop Chrome, 25 Pixel 7 emulation). This includes the Ask Nemo active-project natural-language case on both viewports.

The project uses `http://localhost:4173`, served by local Vite Preview. Browser evidence covers the local production build, not the public production deployment.

## Failure analysis and repairs

An earlier full run on the changed code produced 41/48. Seven failures were: two Demo-copy assertions, two old `.workspace-status` selectors, two incorrect assumptions that End focuses “Demo Mode” rather than the final “About & Notice” tab, and one real reduced-motion stale-opacity defect. Assertions were updated to the current visible UI/semantics; none were skipped or removed. The real defect was fixed in `RouteTransition.tsx` and verified by six focused desktop/mobile motion cases.

The new Ask Nemo test initially ran against a preview bundle built before the intent patch; after rebuilding the production bundle it passed focused on desktop/mobile and then passed again in the final full run.

## Coverage in the full suite

Academic/calendar/goal flows, database persistence, demo isolation, malformed backup rejection, route motion, offline PWA, overview/insights, zero-egress privacy checks, project/task lifecycle, responsive layouts, mobile sheet focus, 320px form access, brand assets, and reduced motion. The suite runs desktop and Pixel 7 viewport projects.

## Separate checks

- `npm test`: 115/115 Vitest tests (23 files), including the Ask Nemo intent/result assertion.
- `npm run typecheck`: pass.
- `npm run build`: pass; Vite warns that the ~1.05 MB main bundle exceeds 500 KB.
- Browser tests do not cover real Supabase auth or cross-account sync because no staging project/disposable users exist.
