# Sprint 6.1 — Motion Rescue Report

**Status: PARTIAL — local changes ready for owner review; no push or deployment.**

## What changed

- Removed the Overview spline chart's 60 FPS React `setState` loop. Geometry now derives from chart data and the SVG reveal remains GSAP-driven.
- Moved the 15-second clock state into a small header child so the application shell and route tree do not rerender on each clock tick.
- Rebuilt quote transitions around cached DOM-font glyph samples, a bounded particle buffer, one color-grouped drawing pass, a 1.7-second GSAP tween, visibility/viewport/hover pausing, and cleanup on interruption/unmount. The existing DOM quote stays accessible and returns after the morph.
- Fixed the mobile navigation utility conflict that overrode `position: fixed` with `position: relative`; added a viewport-boundary regression check.
- Added animated Quick Add tab indicator and content changes, keyboard arrow/Home/End controls, and independent drafts per type.

## Forensic findings

The reproducible responsiveness defect was in `TavolaSplineChart`: every GSAP update rebuilt chart arrays and SVG geometry through React state. The app-level clock also scheduled unrelated shell rerenders every 15 seconds. The particle engine had unbounded repeated glyph sampling and its short completion timer could interrupt the longer tween. The mobile nav class list included both fixed and relative positioning utilities; production CSS order left it relative and it scrolled out of view.

The old canvas did not continuously draw while idle in the baseline sample, so the idle loop was not the observed root cause. It did perform repeated raster reads when a quote changed. Current evidence records zero draw/read calls for a one-second idle window and for reduced-motion mode.

## Verification and evidence

- `npm run typecheck`: passed.
- `npm test -- --reporter=dot`: 25 files, 136 tests passed.
- `npm run build`: passed; Vite still reports the existing ~1.08 MB main JS chunk warning.
- Focused Playwright on desktop and mobile Chromium: 7 passed, 1 intentionally skipped (the long particle capture is desktop-only); includes Quick Add, mobile nav, active morph, reduced motion.
- Full Playwright was run once: 62 passed, 3 responsive failures, 1 intentionally skipped. After fixing tablet header layout, the narrow-phone demo chip, and waiting for modal motion to settle in the assertion, the four targeted desktop/mobile responsive tests passed. The full suite has not been rerun after those fixes.
- Existing visual theme checks passed for Midnight, Daylight, and Aurora on desktop and mobile emulation.
- Separate WebKit mobile emulation smoke: nav computed `fixed`, top 774, bottom 838, height 64 at 390×844; remained fixed after route to Tasks.
- Browser video: [`quote-morph.webm`](evidence/sprint61/quote-morph.webm); before/after nav evidence: [`baseline_mobile_390.png`](evidence/sprint61/baseline_mobile_390.png), [`mobile-nav-restored.png`](evidence/sprint61/mobile-nav-restored.png).

## Remaining acceptance gaps

No physical iPhone Safari run was available. The 50 quote / 30 desktop-nav / 30 mobile-nav / 20 Quick Add stress matrix, CPU-throttled comparison, memory-growth trace, and full Playwright rerun after the responsive fixes remain outstanding. Do not treat this as production-ready release evidence until those checks and owner visual review are complete. Branch: `fix/sprint61-motion-performance-rescue`; base commit: `b6aa78dd04377c5c7215c7317a6525036cc03413`; changes remain uncommitted.
