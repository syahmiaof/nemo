# Nemo — Sprint 1 & Sprint 2 Release Status
## Sprint 1: Functional Audit & System Repair
## Sprint 2: Data Reliability, Offline & Recovery

## Executive Summary
All UI/UX redesign and Tavola aesthetic work remains paused per product directive to prioritize functional excellence, local-first database integrity, and automated reliability testing.

Following Sprint 1's functional audit, **Sprint 2** has fortified Nemo's local-first database architecture, atomic multi-table transactional safety, orphan asset cleanup, full-fidelity backup disaster recovery, 100% offline PWA operation, and strict zero-telemetry data privacy.

The application has been verified through **54 Vitest unit/resilience tests** and **26 Playwright browser tests** running on both desktop and mobile viewports.

---

## Sprint 2 Pillar Verification Summary

### 1. IndexedDB Reliability & Multi-Table Atomic Transactions
- [x] **Canonical Operations Engine (`src/db/operations.ts`):** All multi-table deletions and status modifications execute inside single Dexie readwrite transactions.
- [x] **Atomic Project Deletion:** Deleting a project cascades to milestones, unlinks attached tasks cleanly to standalone without data loss, and purges attached cover blobs from `assetBlobs`.
- [x] **Atomic Task Deletion & Eviction:** Deleting a task transactionally evicts any active daily focus selection and removes associated goal links.
- [x] **Timestamp & Status Invariants:** Marked tasks enforce `completedAt` timestamps; reopening clears timestamps. Focus selections are auto-evicted upon task completion.
- [x] **Orphan Asset Prevention:** Superseded project cover images are destroyed immediately; automated sweeper purges unreferenced asset blobs.
- [x] **Automated Integrity Diagnostics:** `auditDatabaseIntegrity` inspects all 12 stores for foreign key validity, orphan records, and timestamp consistency.

### 2. Complete Backup & Disaster Recovery
- [x] **Versioned 12-Store Backup Envelope (`BackupEnvelopeV1`):** Complete workspace export bundling all 12 Dexie stores and binary image blobs.
- [x] **In-Memory Pre-Validation (`validateReferentialIntegrity`):** Backup files undergo Zod schema and foreign-key graph inspection in memory before any database write occurs.
- [x] **Byte-Identical Asset Round-Trip:** Restored base64 image blobs match source images byte-for-byte (verified via SHA-256 equivalent hashing).
- [x] **Disaster Recovery on Clean Profile:** Restores full workspace data onto an empty browser profile with 100% fidelity.
- [x] **Corrupt JSON Rejection & Data Preservation:** Incompatible or damaged files display user-visible alerts without altering active user data.

### 3. Real Offline PWA & Service Worker
- [x] **Application Shell Precaching:** Vite PWA + Workbox precaches 16 assets (755.63 KiB), including all application scripts, CSS, manifest, and icons.
- [x] **Zero-Bandwidth (0 kbps) Offline Navigation:** Seamless client-side routing across all 8 major views with network severed (`context.setOffline(true)`).
- [x] **Offline Data Creation:** Creating tasks and editing data in IndexedDB succeeds while completely offline.
- [x] **Offline Hard Page Reload:** Hard reloading the browser while offline loads the application shell directly from Service Worker cache and populates data from IndexedDB.

### 4. Zero Data Egress Privacy Guarantee
- [x] **Zero Remote Analytics / Trackers:** Verified zero requests to Google Analytics, Mixpanel, PostHog, Sentry, or third-party telemetries.
- [x] **Zero Cloud Data Leakage:** All workspace notes, tasks, dates, grades, and cover images remain 100% on-device.

---

## Pillar Verification Summary (Sprint 1)

### 1. Projects & Unified Tasks
- [x] **Create, edit, complete, archive and delete projects:** Full CRUD lifecycle verified; archival tab filter separates active vs. archived projects cleanly.
- [x] **Upload project image, store URL and retain after reload:** Local base64 blob safely stored in Dexie `assetBlobs` table without cloud dependencies.
- [x] **Create, edit, complete and reopen tasks:** Single canonical task model correctly handles status transitions (`todo` <-> `done`) with accurate `completedAt` timestamps.
- [x] **Verify project progress when tasks/milestones change:** Derived progress (0% -> 100%) dynamically computes from milestone completion.
- [x] **Verify linked tasks remain consistent across modules:** Zero task duplication. A task linked to a project or coursework deliverable maintains its singular identity across the app.

### 2. Academics, Calendar & Goals
- [x] **Create semester, subjects and assignments:** Structured academic hierarchy verified with foreign key relationships.
- [x] **Submit and grade assignments correctly:** Assignment submission URLs, grades (`scoreObtained`/`scoreMaximum`), weights, and late deadlines function accurately.
- [x] **Calendar events and projected deadlines remain accurate:** Dynamic projection engine queries tasks, assignments, and milestones by date without duplicating table rows.
- [x] **Date and timezone boundaries behave correctly:** All dates stored as invariant local `YYYY-MM-DD` strings, preventing midnight timezone shifts.
- [x] **Goal milestones and linked tasks update correct progress:** Goals derive progress directly from key milestones, while linking tasks via `goalTaskLinks` without cloning.

### 3. Overview & Insights
- [x] **Dashboard counts match real data:** Overview metrics derive strictly from Dexie queries. Zero mock/hardcoded numbers in personal workspace.
- [x] **Today's Focus enforces three active slots:** Strict 3-slot ceiling enforced; completing a task automatically frees up slot capacity for new selections.
- [x] **Annual analytics group projects by correct year:** Insights calculates completions using `completedAt` timestamps filtered by user-selected reporting year.
- [x] **Chart filters and metric switching show accurate values:** Interactive spline chart and category breakdowns toggle cleanly between Tasks and Projects metrics.

### 4. Privacy, Database & Demo
- [x] **IndexedDB data survives refresh and restart:** State persists across hard browser reloads and sessions.
- [x] **Demo and real workspace data remain isolated:** Strict database name segregation between `NemoDatabase` (real) and `NemoDemoDatabase_v1` (demo).
- [x] **Export/import backups restore all data and images:** Full-fidelity atomic JSON export/restore across all 12 database tables.
- [x] **Invalid backups are rejected without data loss:** Malformed JSON files fail validation safely via Zod schema guard with zero database mutation.
- [x] **Production PWA works offline after initial installation:** Vite PWA Workbox precache (7 entries, 723 KiB) verified in production build.

### 5. Automated QA & Reliability
- [x] **TypeScript Strict Check:** `tsc --noEmit` PASS (0 errors).
- [x] **Vitest Unit Test Suite:** 8 test files, 36/36 tests PASS.
- [x] **Playwright E2E Suite:** 11 user journey tests PASS on Desktop Chrome (1440x900).
- [x] **Mobile Responsiveness:** 11 user journey tests PASS on Mobile Chrome (Pixel 7 viewport).
- [x] **Accessibility & Form Bindings:** Repaired `Textarea` label `useId` binding to ensure full screen reader compliance.

---

## Defect Rectification Log
During the audit, the following functional edge-cases were identified and fixed:
1. **Today's Focus Orphan Slots:** Completing a task outside of the Overview page previously left the focus selection slot occupied. Fixed to atomically clean up focus selections upon task completion.
2. **Academic Semester Deletion Cascade:** Deleting a semester previously left orphaned subject and assignment rows. Added transactional cascading deletion down to tasks.
3. **Project Task Disassociation:** Editing a project task to remove its parent previously failed to clear `parentType`. Fixed modal form to allow detaching to a standalone task.
4. **QuickAdd Orphan Assignment FK:** Prevented creating an assignment without selecting or possessing an active subject.
5. **Project Cover Blob Deduplication:** Guarded against saving redundant base64 image blobs to `assetBlobs` when only editing project text metadata.
6. **Form Label Association (`useId`):** Added `React.useId()` fallback to `Textarea.tsx` matching `Input.tsx` and `Select.tsx`, resolving unassociated form inputs.
