# Sprint 4C remediation backlog — implementation handoff

The following is a **reviewable proposal only**. This independent QA pass did not edit, commit, push or deploy application source. Reproduce each issue on one pinned revision before implementing; the checkout advanced from `1a0855e` to `19c9bfb` during this audit.

## Release blockers

### N4C-01 · P1 · Daylight Ask Nemo text unreadable

- **Environment/route:** Chromium, 390×844, Demo workspace, Settings → Appearance → Daylight → mobile More → Ask Nemo. Also relevant at desktop because drawer uses the same surface.
- **Steps:** Select Daylight; open Ask Nemo; read welcome/answer summary and suggested questions.
- **Expected/actual:** Clear dark-surface foreground at >=4.5:1 for normal text. Actual navy drawer (`rgb(11,19,34)`) inherits Daylight's dark `--text-primary`/`--text-secondary`; sampled ratios about 1.04:1–1.57:1, and text is visibly near-invisible.
- **Evidence:** `artifacts/ask-nemo-daylight-390.png`, `artifacts/interaction-results.json`. Likely cause `src/index.css:722-731` global `.text-white` override plus hardcoded drawer surfaces in `src/features/assistant/AskNemoDrawer.tsx:159-233`.
- **Recommended fix:** Give the dark assistant surface its own foreground tokens scoped to the dialog, or make the whole dialog theme-aware. Do not apply blanket Daylight text remapping inside intentionally dark surfaces.
- **Acceptance:** Open, query and follow a suggested result in all three themes at 390 and 1440; measured response/title/chip/focus text contrast >=4.5:1 and visible screenshots; no regression in Midnight/Aurora.

### N4C-02 · P1 · Ask Nemo `aria-modal` does not contain/restore keyboard focus

- **Environment/route:** Chromium 1440×900, `/overview`, Ask Nemo utility rail; keyboard only.
- **Steps:** Open Ask Nemo, ask “Active projects” so Send is enabled, focus Send, press Tab; then close drawer.
- **Expected/actual:** Tab wraps within dialog and Close/Escape returns focus to Ask Nemo opener. Actual focus moves to `<body>` outside dialog; after close, opener is not focused.
- **Evidence:** `artifacts/focus-probe.json`; `src/features/assistant/AskNemoDrawer.tsx:30-46,143-159,320-353` manages autofocus/Escape only, with no containment/return path.
- **Recommended fix:** Use the shared accessible Modal/focus primitive or equivalent trap, store opener before opening, restore it on close, and make background inert while the drawer is open.
- **Acceptance:** Keyboard test loops forward/backward between first/last focusable items, Escape/Close/backdrop returns opener, screen-reader dialog name remains “Ask Nemo”, and no background control receives focus while open.

## Important usability and regression work

### N4C-03 · P2 · Daylight theme chooser dark preview text fails contrast

- **Environment/route:** Chromium 390×844, `/settings` → Appearance → Daylight.
- **Steps:** Inspect Midnight and Aurora preview cards while Daylight is active.
- **Expected/actual:** Labels/descriptions remain readable on dark preview backgrounds. Actual global `.text-white` remapping yields dark ink on dark previews; sampled label/card contrast about 2.77:1 for Midnight and 1.62:1 for Aurora.
- **Evidence:** `artifacts/daylight-settings-full-390.png`, `artifacts/interaction-results.json` computed colors. Cause `src/index.css:722-731` against `src/features/settings/SettingsPage.tsx:378-489`.
- **Recommended fix:** Scope preview-card text colors to each preview's own background instead of inheriting outer theme.
- **Acceptance:** All three preview cards readable at 390/1440 in all themes; selected border and Active badge remain distinguishable without color alone.

### N4C-04 · P2 · “All Tasks” badge disagrees with rendered list

- **Environment/route:** Chromium 390×844, Demo `/tasks`; 64 open and 86 done fixtures.
- **Steps:** Select All Tasks, note “64”, observe completed struck-through tasks in that list; select Completed and note “86”.
- **Expected/actual:** Badge represents the selected list. Actual All filter includes done tasks, but `allCount` increments only for non-done tasks.
- **Evidence:** `artifacts/daylight-tasks-390-themecheck.png`; `src/features/tasks/TasksPage.tsx:52-76,92-106`.
- **Recommended fix:** Count all records for All, or rename filter “Open” and omit done rows; choose one product contract consistently.
- **Acceptance:** With 2 open + 1 done fixture, All badge/list both show 3 (or Open both 2); search/pagination counts match visible filtered records.

### N4C-05 · P2 · Stale More-sheet E2E accessible-name assertion

- **Environment/route:** Playwright desktop-chrome set to 390×844 and mobile-chrome Pixel 7, `/overview`.
- **Steps:** Run `npm run test:e2e -- --reporter=list` on `1a0855e`; see both `sprint4_responsive.spec.ts:40` cases fail at line 47.
- **Expected/actual:** Test recognizes actual accessible dialog; app opens `Workspace Utilities & Modules`, but test requests `More Modules`. Independent UI probe confirms open, focus wrap, Escape close and opener focus return.
- **Evidence:** first E2E output; `tests/e2e/sprint4_responsive.spec.ts:46-50`; `src/app/MobileNav.tsx:89`; `artifacts/interaction-results.json`.
- **Recommended fix:** Update the test to the current accessible name or a stable explicit dialog test contract; retain all focus assertions.
- **Acceptance:** Same test passes in desktop/mobile projects without changing dialog usability or weakening assertions.

### N4C-06 · P2 · Ask Nemo common paraphrases silently fall back

- **Environment/route:** Chromium demo `/overview`, Ask Nemo.
- **Steps:** Ask “How many projects are active?” or “How many tasks have I completed?”; compare with suggested `Active projects` and dashboard completed count.
- **Expected/actual:** A truthful count or an explicit clarification of supported scope. Actual both questions return generic assistant help; `Active projects` returns the correct 6.
- **Evidence:** `artifacts/interaction-results.json` vs `artifacts/functional-probe-results.json`; likely narrow phrase matching in `src/features/assistant/intentEngine.ts:54-134`.
- **Recommended fix:** Add deterministic paraphrase coverage and separate all-time completed count from “finished this month”; preserve honest unknown fallback (no fabricated answer).
- **Acceptance:** Fixture-based unit + browser checks for these phrasings, singular/plural and unknown questions; counts match underlying records.

### N4C-07 · P2 · Overview first analytical panel too tall vs reference

- **Environment/route:** Chromium 1440×900 `/overview`, demo; also 390×844.
- **Steps:** Open the settled Nemo and live Tavola Overview screenshots at matched viewport.
- **Expected/actual:** Comparable information density and next-section visibility while preserving Nemo content. Tavola first chart panel x115/y200 753×408; Nemo x124/y294 727×658. At 390, Nemo panel 569px vs Tavola 434px.
- **Evidence:** `artifacts/midnight-1440-overview.png`, `artifacts/tavola-reference-settled-1440.png`, `artifacts/midnight-390-overview.png`, `artifacts/audit-measurements.json`.
- **Likely cause/recommendation:** `src/index.css:521-522` sets `.overview-primary` grid `align-items:stretch`, making the left analytical card match the three-ticket right stack. Decouple panel height and tighten excess vertical space while keeping chart labels/data table legible.
- **Acceptance:** At matched 1440/390 captures, first panel no longer gains ~250/135px just from adjacent focus stack; secondary content becomes visible sooner; no overlap or chart clipping.

### N4C-08 · P2 · E2E navigation contract conflicts with new hard-refresh welcome

- **Environment/route:** `19c9bfb`, Playwright desktop/mobile suites that call `page.goto` repeatedly.
- **Steps:** Run full E2E suite; several tests time out clicking page controls. Error context explicitly shows `Welcome to Nemo` intercepting pointer events. `artifacts/welcome-probe.json` shows overlay on repeated hard loads even when session key exists.
- **Expected/actual:** Tests reliably wait for/dismiss intentional welcome before interacting; current suite often assumes immediate page interaction and can hit the onboarding modal after welcome.
- **Likely cause/recommendation:** `src/app/WelcomeOverlay.tsx` changed to show after each hard refresh while older `beforeEach` helpers only dismiss onboarding once. Establish one test setup helper for welcome completion/skip and onboarding, then re-run all 36 tests. Separately decide whether full welcome on every hard reload is desirable UX; do not treat SPA route navigation as a hard reload.
- **Acceptance:** Full E2E suite passes on one pinned commit in desktop/mobile; an explicit first-load/return-load/replay test verifies intended welcome timing and clickable app handoff. No forced Playwright click or disabled assertion.

## Separate recommendations, not confirmed defects

- Profile Aurora pseudo-element animation should receive a true frame-time/long-task trace on low-end mobile. Existing browser smoke proves presence, not smoothness or GPU budget.
- Repeat chart morph QA with nonflat series on both sides; current Projects target was zero for the sampled seven days, so the two-state path trace cannot establish animation quality.
- Validate standalone install, icon masks, safe areas and social preview using real iOS/Android and an external crawler before public release. HTTP 200/meta tags alone do not prove those outcomes.
- Run a screen-reader and 400% zoom pass; the current focused checks are insufficient for an overall WCAG 2.2 AA claim.
