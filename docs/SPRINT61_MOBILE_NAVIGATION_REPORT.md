# Sprint 6.1 — Mobile Navigation Report

The mobile navigation was rendered but appeared off-screen because its class list included both `fixed` and a trailing `relative`; the production CSS cascade applied `position: relative`. Removing that conflicting class restores the existing fixed bottom bar without changing the desktop layout.

Verification at 390×844: Chromium E2E asserts computed `position: fixed`, nonzero height, top within the viewport, and bottom within 2px of the viewport edge. WebKit mobile emulation measured top 774px, bottom 838px, height 64px and stayed fixed after navigating from Overview to Tasks. The visual comparison is [`baseline_mobile_390.png`](evidence/sprint61/baseline_mobile_390.png) and [`mobile-nav-restored.png`](evidence/sprint61/mobile-nav-restored.png).

Physical iPhone Safari and installed-PWA safe-area/keyboard behavior were not tested. The scripted WebKit viewport is supporting browser evidence, not a substitute for a device check.

The broader responsive suite initially exposed the desktop header tabs overflowing at 768px and the demo-mode chip pushing profile controls out of the 320px viewport. The tablet header now uses its intended two-row grid layout, and the duplicate demo chip is hidden below 480px while the full demo banner remains available. The desktop and mobile route-reflow and 320px form checks passed after these fixes.
