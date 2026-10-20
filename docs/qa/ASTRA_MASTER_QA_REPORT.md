# Nemo Sprint 4C — independent acceptance report

**Verdict: BLOCKED — HIGH-PRIORITY REPAIRS REQUIRED.** Two reproduced accessibility defects affect Ask Nemo, including near-invisible response text in Daylight and focus escaping its modal dialog. The app's local CRUD and recovery paths generally work; the release gate is about usability and trust, not a claim of data loss.

## Baseline and audit boundary

- Workspace: `C:\Users\USER\Desktop\nemo`; initially clean `main` at `1a0855e`. During audit another worker advanced `main` through `9dbb71f`, `f4d1229`, then `19c9bfb`. Only `docs/qa/` was written by this audit. Later welcome captures and final regression run are for `19c9bfb`; initial 64-route matrix and first 36-test run are for `1a0855e`. UI/JS for the confirmed Ask Nemo, Settings and Tasks defects is unchanged between those revisions.
- Production URL `https://nemo.syahmiaof.my/overview` returned HTTP 200; browser smoke loaded Overview and `/projects` with zero page exceptions in a disposable context. Manifest, 192/512/maskable icons, Apple icon and OG image each returned HTTP 200. The production JS/CSS filenames matched the local `19c9bfb` build (`index-B8AKmY32.js`, `index-BW60atw4.css`). This is a smoke check, not a physical-device or social crawler validation. Evidence: `artifacts/production-smoke.json` and `production-overview-390.png`.
- Browser QA used **disposable Playwright contexts**, demo fixtures and a separate empty context for restore. No real user IndexedDB/profile was opened or erased. Direct Tavola reference `https://demo.codeandchill.store/tavola/#/overview` was rendered and captured at 1440×900 and 390×844. No proprietary assets were copied into Nemo.

## Actual coverage

| Surface | Evidence |
|---|---|
| Chromium responsive | 8 routes × 8 viewports = 64 measured screens: 320×568, 360×800, 375×812, 390×844, 430×932, 768×1024, 1440×900, 1920×1080. `audit-measurements.json`; 0 document overflows and 0 page exceptions. Offscreen nodes reported by the probe were decorative mesh/toast containers, not controls. |
| Three themes | 10 routes/detail screens × Midnight/Daylight/Aurora = 30 mobile captures at 390×844; theme selection and reload persistence separately verified. `theme-route-results.json` and screenshots. |
| Other engines | Firefox and WebKit 390×844 Overview smoke captures, both rendered; this is not a full cross-engine matrix. |
| Functional | Project/task, academics/calendar/goal, offline/privacy/demo E2E journeys; independent Ask Nemo, avatar and export/import probes. See functional report. |
| Motion | Desktop tab pill sampled at 0/50/100/200/400/600 ms, rapid route clicks, chart toggle, Aurora/reduced-motion smoke, WebM capture. See motion report. |
| Reference | Live settled Tavola render in `artifacts/tavola-reference-settled-1440.png`; initial capture was mid-animation and is not used for visual judgment. |

## Automated gate

| Command | Result |
|---|---|
| `npm run typecheck` | PASS on both initial and `19c9bfb` snapshots. |
| `npm test` | PASS: 71/71 tests, 14/14 files on both snapshots. |
| `npm run build` | PASS on both; latest build precached 25 entries, 989.52 KiB. Vite warned that main JS chunk is >500 KiB (724.14 KiB minified). |
| `npm run test:e2e -- --reporter=list` on `1a0855e` | 34 passed, 2 failed of 36. Both failures were the same stale More dialog accessible-name assertion (`More Modules` expected, actual `Workspace Utilities & Modules`). Independent interaction probe confirmed sheet open, Tab wrap, Escape close and trigger focus restore work. |
| Same E2E command on `19c9bfb` | **28 passed, 8 failed / 36**. Six 30s timeouts had Welcome overlay in their error context after hard navigation (some later intercepted by onboarding); two are the stale More dialog name. See functional report. |

Existing offline E2E passed in the initial run and in the latest run as far as observed. No automated score is treated as proof of WCAG conformance or motion smoothness.

## Quality scorecard (0–10)

| Dimension | Score | Evidence-based reason |
|---|---:|---|
| Desktop visual | 7 | Strong shell/material hierarchy, but Overview first panel is stretched to 658px vs Tavola's 408px at 1440, pushing secondary content down. |
| Mobile usability | 7 | 64 measured screen states had no document overflow; 390 screenshots show usable nav/forms, though chart/first-card density is weak and physical touch testing remains open. |
| Motion/interactions | 7 | Pill changes geometry over ~400ms; rapid navigation retained one shell. Chart morph evidence was inconclusive because target Projects series was flat zero. |
| Theme consistency | 5 | Daylight core pages generally render, but Ask Nemo response and dark theme preview cards fail readability. |
| Functional reliability | 7 | CRUD/backup/offline checks pass; Tasks badge disagrees with its list and E2E suite has failing contracts. |
| Accessibility | 4 | Ask Nemo modal lacks focus containment/return and Daylight response text has measured contrast near 1:1–1.6:1. Full WCAG audit was not completed. |
| PWA/brand readiness | 8 | Brand artwork, icons, manifest and live OG URL load; install/social preview on physical devices/crawlers unverified. |

## Severity-ranked confirmed issues

| ID | Severity | Finding | Evidence |
|---|---|---|---|
| N4C-01 | P1 | Daylight Ask Nemo message text nearly invisible on hardcoded navy surface. | `artifacts/ask-nemo-daylight-390.png`, `interaction-results.json` |
| N4C-02 | P1 | Ask Nemo modal lets Tab leave dialog and does not restore opener focus. | `artifacts/focus-probe.json` |
| N4C-03 | P2 | Daylight Settings dark theme preview labels/descriptions fail contrast. | `artifacts/daylight-settings-full-390.png`, computed colors in `interaction-results.json` |
| N4C-04 | P2 | “All Tasks 64” badge excludes 86 completed tasks while the All list includes them. | `artifacts/daylight-tasks-390-themecheck.png`, `src/features/tasks/TasksPage.tsx:52-76,92-106` |
| N4C-05 | P2 | E2E More sheet test checks obsolete accessible name; 2/36 failures on base commit. | `tests/e2e/sprint4_responsive.spec.ts:46`, `artifacts/interaction-results.json` |
| N4C-06 | P2 | Ask Nemo fails common paraphrases such as “How many projects are active?” and “How many tasks have I completed?”, falling back to generic help. | `artifacts/interaction-results.json`, `src/features/assistant/intentEngine.ts:54-134` |
| N4C-07 | P2 | Overview desktop main chart card starts ~94px lower and is ~250px taller than reference; right column height stretches left. | `artifacts/midnight-1440-overview.png`, `artifacts/tavola-reference-settled-1440.png`, `audit-measurements.json` |
| N4C-08 | P2 | Latest welcome-on-hard-refresh behavior invalidates existing E2E hard-navigation assumptions and causes pointer interception/timeouts. | `artifacts/welcome-probe.json`, latest Playwright error contexts; final count in functional report |

Reproduction, likely cause, remediation and acceptance test for each ID are in `ASTRA_REMEDIATION_BACKLOG.md`. These are findings, **not permission to change source in this audit**.

## Limits and release gate

No physical iOS/Android device, external WhatsApp/Facebook crawler, screen reader session, 400% browser zoom inspection, profiler long-task trace, or true network drop during cold install was available in this pass. Firefox/WebKit checks were smoke-level. Automated E2E tested offline cached behavior but not storage quota exhaustion on a physical device. No Sprint 5 cloud authentication/sync work was assessed as an existing defect.

**Gate to private beta:** fix N4C-01 and N4C-02, re-run contrast/keyboard checks, reconcile N4C-04, update E2E contracts for current welcome/More behavior, and run full 36-test suite green on one immutable revision. Do not infer “release ready” from the 71 unit tests alone.
