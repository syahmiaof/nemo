# Mobile and responsive audit

**Result:** no document-level horizontal overflow in 64 Chromium route/viewport states, but this is not a physical-device pass. Actual viewport matrix: 320×568, 360×800, 375×812, 390×844, 430×932, 768×1024, 1440×900, 1920×1080 across Overview, Projects, Tasks, Calendar, Academics, Goals, Insights and Settings. `artifacts/audit-measurements.json` holds per-screen width, headings and geometry. Firefox and WebKit 390×844 Overview smoke captures also loaded without document overflow.

The 390×844 captures show the bottom five-item bar fixed at y780/h64, with the page content continuing underneath as expected until scrolled. Actual More sheet opens with `Workspace Utilities & Modules`, wraps Tab from last Settings link to Close, closes with Escape and restores opener focus: `artifacts/more-sheet-390.png` and `interaction-results.json`. This disproves the stale More E2E failure as an app failure. 320px forms and settings keyboard tabs passed the repository Playwright regression on the initial snapshot.

Visual findings:

- **N4C-07 P2:** at 390px Nemo's first Overview card is 569px tall vs Tavola's 434px. Chart occupies most of the initial scroll experience; the next Nemo content starts below the first viewport. See `midnight-390-overview.png` and live reference capture.
- **N4C-01 P1:** Daylight Ask Nemo dialog is navy but message/help text inherits dark text tokens; screenshots show the information is close to invisible. On mobile it covers the viewport, so this blocks the assistant rather than a small decorative area. See `ask-nemo-daylight-390.png`.
- **N4C-03 P2:** at 390px, Settings theme cards make Midnight/Aurora labels low-contrast in Daylight. See `daylight-settings-full-390.png`.
- Tasks, calendar agenda, academics subject list, goals and insights visibly stack without sideways clipping in 390 screenshots. Screenshots: `midnight-390-*.png` and `daylight-*-390-themecheck.png`.

The element-boundary probe reports some offscreen `.mesh__*` decoration and toast-container boxes, but none caused document scrolling or was an interactive control. It is not evidence of a broken layout. Modal scrolling, soft keyboard occlusion, safe-area padding, touch precision and performance on **physical Android/iOS** remain unverified; Playwright viewports and desktop engine emulation cannot replace those tests.
