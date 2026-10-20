# Nemo Test & Verification Report

## Baseline Status
- **Test Framework:** Vitest (Unit / Domain / Persistence / Schema / Chart / Demo)
- **Environment:** Windows, Node v24.13.0, npm 11.6.2
- **Verification Date:** 2026-10-20
- **Total Test Suites:** 8 passed (8 total)
- **Total Tests:** 36 passed (36 total)
- **Strict TypeScript Check:** PASS (0 errors)
- **Production Vite + PWA Build:** PASS (0 errors, Service Worker generated)

## Test Matrix Coverage

| Journey / Area | Description | Target | Current Status | Notes |
|---|---|---|---|---|
| J1 | First Visit & Onboarding | Domain / UI | VERIFIED | Privacy onboarding explains IndexedDB local storage, saves displayName |
| J2 | Project & Screenshot | Domain / UI | VERIFIED | Project CRUD, local typographic cover generation, blob storage |
| J3 | Task Synchronization | Domain / Persistence | VERIFIED | Single canonical task ID across Project, Tasks, and Overview |
| J4 | Project Completion & Insights | Domain / Selector | VERIFIED | `completedAt` timestamp semantics, yearly & monthly grouping |
| J5 | Academics & Assignments | Domain / Persistence | VERIFIED | Semester, Subject, Assignment, Subtasks; Submitted != Graded |
| J6 | Unified Calendar Projections | Domain / Selector | VERIFIED | Dynamic projection of tasks, assignments, milestones without duplication |
| J7 | Goals & Milestones | Domain / Selector | VERIFIED | Milestone progress derivation (completed/total); linking tasks without cloning |
| J8 | Today Focus Limit | Domain / Persistence | VERIFIED | Max 3 unfinished tasks, local date midnight handling |
| J9 | Portable Backup & Restore | Domain / Schema / Dexie | VERIFIED | Atomic round-trip validation, JSON envelope, rollback on invalid data |
| J10 | Offline Capability | PWA / Workbox | VERIFIED | Service worker precache generated, offline detection & notification |
| J11 | Responsiveness & Accessibility | CSS / Components | VERIFIED | Desktop sidebar + mobile 5-item bar, WCAG 2.2 AA contrast, dialog focus |
| M1 | Elastic Directional Tabs | UI / Motion | VERIFIED | Clip-path directional independent edge interpolation |
| M2 | Spline Chart Interpolation | Domain / Chart | VERIFIED | Bezier spline calculation, nearest index snapping, normalisation |
| M3 | Isolated Demo Mode | DB / Fixtures | VERIFIED | Demo database isolated from real workspace data, full reset round-trip |

## Automated Check Log

### Vitest Test Suite Execution
```
 RUN  v2.1.9 C:/Users/USER/Desktop/nemo

 ✓ tests/unit/schemas.test.ts (4 tests) 13ms
 ✓ tests/unit/academics_calendar.test.ts (2 tests) 80ms
 ✓ tests/unit/db.test.ts (4 tests) 72ms
 ✓ tests/unit/demo.test.ts (10 tests) 572ms
 ✓ tests/unit/goals_insights.test.ts (2 tests) 58ms
 ✓ tests/unit/projects_tasks.test.ts (3 tests) 74ms
 ✓ tests/unit/chart.test.ts (6 tests) 290ms
 ✓ tests/unit/dates.test.ts (5 tests) 5ms

 Test Files  8 passed (8)
      Tests  36 passed (36)
   Duration  8.11s
```

### TypeScript Strict Typecheck
```
> nemo@0.1.0 typecheck
> tsc --noEmit
(Exit 0, 0 errors)
```

### Vite Production Build
```
> nemo@0.1.0 build
> tsc -b && vite build

vite v5.4.21 building for production...
transforming...
✓ 1939 modules transformed.
rendering chunks...
dist/registerSW.js                0.13 kB
dist/manifest.webmanifest         0.40 kB
dist/index.html                   1.32 kB
dist/assets/index-CfRT-5gY.css   60.80 kB
dist/assets/index-R3QOb6I4.js   665.80 kB
✓ built in 7.21s
PWA v0.20.5: Service worker & offline precache generated.
```
