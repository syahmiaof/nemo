# Functional acceptance and regression evidence

All manual probes used isolated Playwright browser contexts. The backup file `artifacts/disposable-demo-backup.json` contains **fictional demo fixtures only** and was restored into a second empty disposable context. No existing user profile or IndexedDB records were modified.

## Independently exercised journeys

| Journey | Observed result | Evidence |
|---|---|---|
| Projects/tasks | Existing Playwright creates, edits, completes/reopens, archives/deletes and checks derived progress on desktop/mobile; first run passed these journeys. | `tests/e2e/projects_tasks.spec.ts`, first E2E run 34/36. |
| Academics/calendar/goals | Existing desktop/mobile scenarios created semester/subject/assignment, projected deadlines and linked goals on initial revision. | `tests/e2e/academics_calendar_goals.spec.ts`; latest hard-refresh welcome may invalidate some timings. |
| Ask Nemo | Suggested intents returned demo counts: due today 5, overdue 6, active projects 6, finished this month 14, active goals 4; these match UI demo counts/date views. Unknown moon question returned generic supported-question guidance. Common paraphrases “How many projects are active?” and “How many tasks have I completed?” returned generic fallback despite relevant local records (**N4C-06**). | `artifacts/functional-probe-results.json`, `artifacts/interaction-results.json`. |
| Avatar | Uploaded a PNG, replaced it with another PNG, survived reload, removed it and restored `AM` fallback. | `artifacts/functional-probe-results.json`. Demo/real DB separation also passed E2E. |
| More sheet | Actual accessible dialog is `Workspace Utilities & Modules`; visible, Tab wraps from Settings to Close, Escape closes, focus returns to opener. Existing test still expects `More Modules` (**N4C-05**). | `artifacts/more-sheet-390.png`, `artifacts/interaction-results.json`. |
| Ask Nemo keyboard | Focusing Send query and pressing Tab moved focus to `<body>` outside `aria-modal=true`; closing did not focus opener (**N4C-02**). | `artifacts/focus-probe.json`. |
| Theme persistence | Midnight/Daylight/Aurora selection persisted after reload; 30 route/theme renders succeeded after dismissing welcome. | `artifacts/audit-measurements.json`, `artifacts/theme-route-results.json`. |
| Backup | Export produced `nemo_backup_2026-10-20_v1.json`. Confirmation showed 18 projects, 150 tasks, 24 assignments, 6 goals, 18 assets. Import into a fresh real-mode disposable context succeeded; `Orbit Analytics` rendered after reload. | `artifacts/functional-probe-results.json`, `artifacts/backup-import-results.json`, `artifacts/backup-restored-projects.png`. |
| Offline/PWA/privacy | Repository E2E offline cached shell and CRUD, demo isolation and zero egress passed on both desktop/mobile in the initial run. | `tests/e2e/offline_pwa.spec.ts`, `privacy_network.spec.ts`, `database_backup_demo.spec.ts`. No physical offline-device test. |

## Regression commands

- `npm run typecheck`: exit 0 on `1a0855e` and again on `19c9bfb`.
- `npm test`: **71/71** Vitest tests passed in 14 files on both.
- `npm run build`: exit 0; latest 25 PWA precache entries / 989.52 KiB, JS chunk 724.14 KiB warning.
- `npm run test:e2e -- --reporter=list` on `1a0855e`: **34 passed, 2 failed / 36**. Both failures were stale More accessible-name assertions; actual sheet interaction was independently reproduced as working.
- Same full E2E command on `19c9bfb`: **28 passed, 8 failed / 36** in 8.5 minutes. Six 30s timeouts (Academics/Calendar/Goals and malformed-backup validation on desktop/mobile) had Welcome overlay in their error contexts after `page.goto`; two remained the stale More dialog name. Some timeouts later showed onboarding modal interception as welcome exited. Copies of all eight Playwright error contexts are in `artifacts/e2e-errors/`. This is a suite/product timing-contract regression. Do not quote the first-run 34/36 as the current HEAD result.

## PWA/brand smoke

`https://nemo.syahmiaof.my/overview` and the manifest, 192/512/maskable/Apple icons and OG image all responded 200 when checked. Browser smoke loaded production Overview and `/projects` at 390×844 with zero page exceptions; remote JS/CSS asset names matched the local `19c9bfb` build (`artifacts/production-smoke.json`). OG URL is absolute `https://nemo.syahmiaof.my/brand/nemo-og.png`; screenshot/asset inspection shows a branded 1200×630 visual. `public/favicon.png` remains recognizable at 32px. Actual iOS standalone install and WhatsApp/Meta crawler preview were **not** tested, so metadata presence is not claimed as proof of those outcomes. Cloud auth/sync are Sprint 5 scope and were not scored as missing features.
