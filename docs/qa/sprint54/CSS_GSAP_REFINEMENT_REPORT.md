# Sprint 5.4 — CSS and GSAP Refinement

## Confirmed repairs

- **Route exit sequencing:** exit cards and outlet opacity now share one timeline; route content swaps on timeline completion. If another navigation arrives first, the newest location wins.
- **Reduced motion:** when the OS/app preference changes during a transition, stale GSAP opacity/transform is cleared. The next route is readable immediately.
- **Overview rhythm:** desktop chart panel aligns to the top of the focus panel instead of stretching around a variable-height stack. Existing chart drawing height and brand palette remain intact.
- **No decorative motion added:** the changes target verified sequencing, responsive alignment and reduced-motion behavior.

## Verification

- Six Playwright cases across desktop/mobile cover reduced motion, rapid navigation and stable final route.
- Full responsive E2E traverses all modules at desktop 768/1440 and mobile 320/360/375/390/430 widths.
- 48 current-state screenshots cover 8 routes, three themes and desktop/mobile. Relevant overview captures are `midnight-desktop-overview.png` and `midnight-mobile-overview.png`.
- Screenshot evidence verifies layout, not frame pacing. No GPU profile or successful-motion video recording was captured; do not infer a 60fps result.

## Visual comparison limitation

The Sprint 5.3 capture script waited only for DOMContentLoaded plus a short fixed delay. Some old images show the intro overlay, so they are not valid page-level before-images. Sprint 5.4 captures wait for the route, intro dismissal, font readiness and a stable UI. A precise before/after image pair is therefore unavailable for those old captures; interaction assertions provide the motion evidence.
