# Sprint 5.4 — Functional Repair Report

| Finding / area | Repair | Verification | Remaining limit |
|---|---|---|---|
| Calendar event details | Select an event from calendar to open editable details; supports date, time, location, description and confirmed delete. | Playwright calendar event create/open/edit/delete/persistence journey in desktop/mobile projects. | None found in local browser run. |
| Clock preference | Shared formatter applies 12h/24h setting to shell clock and task, assignment, event and assistant timestamps. | 3 formatter unit cases and E2E preference change. | Locale preference not configurable; format is the selected 12/24-hour style. |
| Quick Search result selection | Preserve selected entity type/ID during navigation and focus/open target record. | E2E task focus, assignment edit, event open; matcher/query unit tests. | Project, goal and milestone branches lack distinct E2E assertions. |
| Privacy wording | Settings describe local-first storage and optional cloud sync truthfully. | E2E checks copy and account-sync availability. | Owner should approve final product wording. |
| Ask Nemo phrasing | Active-project intent handles “How many projects are active?” and computes from local workspace records. | Unit result count plus desktop/mobile Demo browser test checks summary and a project result. | Deterministic phrase parser only; not an LLM and does not claim open-ended language understanding. |
| CRUD and cross-module | Existing focused flows cover project/task/academic/calendar/goal/focus and persistence. | Full Playwright run includes project CRUD, task completion/reopen, focus backfill, academic projection and browser refresh. | Avatar/profile, deletion/reference graph under mixed modules, and bulk backup restore do not all have new full UI journeys in this sprint; see remaining risks. |

Data remains local-first. Sync scenarios are mocked; the report does not claim production cloud sync success.
