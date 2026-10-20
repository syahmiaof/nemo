# Demo workspace

Demo content is fictional and editable. The workspace selector explicitly enters Demo Mode; returning to Real workspace restores the user's original database. Switching reloads the app so no mounted subscription continues reading the previous database.

## Isolation and persistence

- Existing real database name stays exactly `NemoDatabase`.
- Demo database is `NemoDemoDatabase_v1`; no demo-to-real migration exists.
- The explicit choice persists in local storage under `nemo:workspace-mode`. Missing, unrecognized or inaccessible preferences default to real.
- `src/db/nemoDb.ts` selects a single database before the application mounts. Existing repositories and forms work against this instance.
- Startup awaits initialization. A storage error displays a retry screen and never silently switches databases.
- Seeding and reset run in one Dexie transaction across every table. A failed write rolls back the entire operation.
- Presence of the default settings record is the seed-complete marker, written in that same transaction. Subsequent loads preserve edits and deletions, including a manually emptied demo workspace.
- Unexpected partial storage without settings is not silently overwritten. The user must explicitly reset it.
- `seedDemoWorkspace` rejects every database name except the demo namespace, including `NemoDatabase`.
- Reset Demo restores fixtures in the demo database only. It must be invoked from a clearly labelled, confirmed action because it replaces demo edits.
- Backup/export operations use the active database. A user-requested import is also applied only to the active workspace; there is no automatic transfer between workspaces.

## Public integration API

Import from `src/db/workspace.ts`:

```ts
getWorkspaceMode(): 'real' | 'demo'
switchWorkspace(mode: 'real' | 'demo'): void
initializeWorkspace(): Promise<void>
resetDemoWorkspace(): Promise<void>
```

`switchWorkspace` persists the requested mode and reloads. It throws a readable error if local storage cannot save the choice. `resetDemoWorkspace` rejects in real mode and resolves after the atomic reset; callers can show a success toast or reload to reset transient page filters.

## Deterministic dataset

Fixtures live in `src/demo/fixtures.ts`. Stable IDs and a seeded PRNG produce the same data for the same local calendar day, independent of the hour. No wall-clock randomness or network fetch is involved.

| Entity | Count |
| --- | ---: |
| Software/freelance projects | 18 |
| Canonical tasks | 150 |
| Project milestones | 36 |
| Semesters | 2 |
| Subjects | 6 |
| Assignments | 24 |
| Standalone calendar events | 20 |
| Goals | 6 |
| Goal milestones | 30 |
| Goal-to-task references | 15 |
| Today's Focus selections | 3 |
| Local project covers | 18 |

Nine completed projects span 13 months of completion history. Their tasks complete between project creation and project completion. Current work has overdue, today and upcoming dates, varied statuses and priorities, plus a paused project with blocked tasks. Completed assignments belong to the previous term; submitted and upcoming assignments belong to the active term. Goal links reference canonical tasks without cloning them.

The first entry or explicit reset anchors current dates to the browser's local date. Refresh does not shift existing records forward. Consequently focus naturally becomes historical on the following day; use Reset Demo when a fresh relative-date showcase is needed.

## Artwork

All 18 covers are original SVG compositions generated locally with six geometric motifs and coordinated palettes. They contain fictional project labels, are encoded into existing `AssetBlob.data` fields and are retrieved by existing project cover components. They contain no external images, scripts or remote URLs. No Tavola art or third-party image is embedded. Covers are included in standard workspace backups.

## Verification

`tests/unit/demo.test.ts` exercises fixture schema/counts, deterministic local dates, historical consistency, namespace selection, concurrent initialization, persistence through reopen, explicit reset, real-data sentinel preservation, partial-state protection and rollback on a simulated write failure. Browser-level mode selection and UI checks are documented in the overall test report after execution.

Verified on 20 October 2026: `npm run test -- tests/unit/demo.test.ts tests/unit/db.test.ts` passed **14/14 tests** (10 demo tests and 4 existing database/backup tests). Calendar-boundary cases include New Year and leap day. Fixtures pass the existing backup envelope schema, including every SVG data URL.
