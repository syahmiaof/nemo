# Sprint 6.1 — Playwright Results

## Completed

- Vitest: 25 files / 136 tests passed.
- TypeScript: `npm run typecheck` passed.
- Production build: passed; existing large-main-chunk warning remains.
- Focused desktop + mobile Chromium: 7 passed, 1 skipped. The desktop-only long quote capture is intentionally skipped on the mobile project; reduced-motion runs on both.
- Full suite first run: 62 passed, 3 failed responsive cases, 1 skipped. The failures were tablet top-nav clipping, a narrow-phone demo chip clipping the avatar, and a width assertion taken before a modal entrance tween settled. After fixes, the four desktop/mobile responsive cases all passed; the full 66-test suite was not rerun afterward.
- Existing visual checks for Midnight, Daylight, and Aurora passed for desktop and mobile emulation.
- Additional focused Quick Add submission test: all four commitment types passed in both desktop and mobile Chromium (2/2).
- WebKit mobile emulation: fixed nav visible at 390×844 and remains fixed after route navigation.
- Screenshots and browser recording are stored under `docs/evidence/sprint61/`.

## Not yet run

The full suite did run once (see above), and the targeted 320/360/375/390/430 route-reflow checks and offline/PWA suite passed during that run. The complete 66-test rerun after responsive fixes, seven desktop routes forward/backward at 30 repetitions, 30 mobile nav interactions, 20 Quick Add switches, 50 quote cycles, throttled CPU, repeated route memory trace, physical iPhone Safari, and modal soft keyboard remain outstanding. No production deployment or push was performed.

The test evidence supports a **partial** acceptance only. Do not convert this report into a release claim without closing the remaining checks.
