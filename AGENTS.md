# Nemo Agent Orchestration & Specialist Roles

## 1. Orchestration Model

Nemo engineering follows a Lead Orchestrator model with domain-bounded specialist roles.
The Lead Orchestrator is responsible for:
- Repository integrity, schema design, cross-domain contracts
- Conflict resolution and integration verification
- Quality gates and release verification

## 2. Specialist Roles & Ownership Boundaries

1. **Architecture & Data Engineer (`architecture-and-data-engineer`)**
   - **Scope:** `src/db/`, `src/domain/`, persistence tests, backup/restore logic.
   - **Responsibilities:** Dexie schemas, migrations, domain models, validation with Zod, canonical repository operations, transaction safety, export/import round-trips.

2. **Product Design & Interface Systems Engineer (`interface-system-engineer`)**
   - **Scope:** `src/design/`, `src/components/`, `src/app/`, layout shells, navigation rails, GSAP motion presets.
   - **Responsibilities:** Original midnight navy token palette, accessible light alternative, responsive navigation (desktop sidebar, mobile 5-item bottom bar), toast system, modal/drawer primitives, reduced-motion compliance.

3. **Projects & Unified Tasks Engineer (`projects-tasks-engineer`)**
   - **Scope:** `src/features/projects/`, `src/features/tasks/`, `src/features/overview/`.
   - **Responsibilities:** Project CRUD, milestone linking, project covers/screenshots, unified task CRUD, filtering (All/Today/Upcoming/Overdue/Done), priority tags, Today's Focus slots (max 3), zero-data honest states.

4. **Academics & Calendar Engineer (`academics-calendar-engineer`)**
   - **Scope:** `src/features/academics/`, `src/features/calendar/`.
   - **Responsibilities:** Semester, subject, and assignment CRUD; submission statuses; deadline calculations; unified calendar projections (merging tasks, assignment deadlines, milestone dates, and standalone events without data duplication); desktop month/week and mobile agenda views.

5. **Goals & Insights Engineer (`goals-insights-engineer`)**
   - **Scope:** `src/features/goals/`, `src/features/insights/`.
   - **Responsibilities:** Goal lifecycle, milestone progress derivation, task-to-goal linking (via references, never cloned tasks), genuine browser-calculated metrics (all-time, active, completed by year, monthly breakdown, task completion rates), zero-data visualization states.

6. **Quality & Security Reviewer (`quality-security-reviewer`)**
   - **Scope:** `tests/`, end-to-end verification, accessibility audits, storage quota tests, stress testing fixtures.
   - **Responsibilities:** Vitest unit tests, Playwright browser journeys (J1-J11), WCAG 2.2 AA contrast/keyboard testing, offline service worker verification, untrusted string sanitization, reporting defect evidence.

## 3. Parallelism & Wave Strategy

- **Wave 0 (Sequential):** Repo audit, tooling foundation, database & domain contracts, design tokens, app shell skeleton.
- **Wave 1 (Sequential Foundation):** Persistent database layer, app shell, navigation, global settings, onboarding.
- **Wave 2 (Controlled Parallelism / Modular Slices):**
  - Slice A: Projects + Canonical Tasks + Today's Focus
  - Slice B: Academics + Projected Calendar
  - Slice C: Goals + Derived Local Insights
- **Wave 3 (Integration):** Cross-module verification, Quick Add integration, Unified Calendar projections, Today dashboard aggregation.
- **Wave 4 (Hardening & Verification):** Backup/restore verification, offline PWA cache, responsive validation, accessibility audit, performance testing with stress fixtures.
- **Wave 5 (Release Gate):** Full automated test suite, production build, manual/browser verification report.
