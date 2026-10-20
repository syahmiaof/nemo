# Motion and transition audit

Browser record: `artifacts/page@e971824875c468d827b2f6a083c093f2.webm`; numeric trace: `artifacts/motion-results.json`. This is a Chromium desktop capture, not a frame-time or GPU profiler. Tavola's live settled screenshot is `artifacts/tavola-reference-settled-1440.png`.

| Interaction | Observed browser result | Assessment |
|---|---|---|
| Desktop active tab | On Overview → Projects, pill x/w was 515.6/75px at 0ms, 538.1/93.4 at 50ms, 559.7/86 at 100ms, 592.2/64.4 at 200ms, settled 592.6/64 by 400ms. | Measured elastic-width move; no snap or lost active tab in this journey. Comparable visual intent to Tavola, not verified identical physics. |
| Rapid route clicks | Overview→Projects→Tasks→Calendar→Academics→Goals→Insights ended at `/insights`, with one `.app-shell` and one `.app-header`, no page exception. | PASS for this sequence only; long-session timeline leak not independently profiled. |
| Chart toggle | Tasks→Projects yielded two distinct captured path states. Projects' seven-day target series was flat zero, so this trace cannot prove or disprove quality of spline morphing with two nonflat series. | **Unresolved:** repeat with controlled nonzero data in both metrics before claiming Tavola-grade chart morph. |
| Aurora | `.aurora-backdrop` existed before and after SPA navigation with the same QA marker on the node. Computed pseudo-element durations were 24s/30s. | Persistent node and animation verified in `artifacts/aurora-probe.json`; smoothness and mobile GPU cost not measured. |
| Reduced motion | With OS `reduce`, computed pseudo-element durations became 0s/0s. Separately, turning on Settings → Preferences reduced motion set `data-reduce-motion=true` and also produced 0s/0s while OS preference was normal. | Both control paths verified in `artifacts/aurora-probe.json`; no physical-device stutter result. |
| Welcome | Initial 1440 brand frame and replay 390 frame were captured. The subsequent `19c9bfb` commit makes the welcome play after each hard reload, even when `nemo_session_welcomed=true`; `artifacts/welcome-probe.json` confirms the overlay appears at 300/900ms on `/overview`, `/projects`, `/tasks` hard loads. | SPA route clicks do not remount the app. Hard navigation is blocked briefly by the overlay by design; existing E2E tests must await/dismiss it, and the team should decide whether repeat reload delay is acceptable UX. |

The initial direct Tavola reference screenshot was taken during its entrance sequence, with ticket/chart content not yet visible. The settled screenshot after 2.8s is the visual reference. Avoid evaluating animation quality from one static frame alone.
