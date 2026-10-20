# nemo. — Track it, finish it.

> A refined, responsive, privacy-first, offline-capable personal workspace for developers, freelancers, and students. Built with React, TypeScript, Tailwind CSS, Dexie.js (IndexedDB), and GSAP.

---

## 1. Product Overview

Nemo is a personal command center designed to help you:
1. **Capture commitments:** Projects, canonical tasks, academic coursework, calendar events, and long-term goals.
2. **Focus on today:** Dedicated "Today's Focus" slot system (maximum 3 priority items) and instant due-today calculations.
3. **Unified Calendar Projections:** Dynamic projection of all task deadlines, coursework dates, and milestone targets without duplicating records.
4. **Honest, local-first privacy:** Zero accounts, zero tracking, zero cloud database dependencies. All data is persisted directly in your browser's IndexedDB.
5. **Portable Backups:** One-click atomic JSON export and restore with asset blobs and schema validation.

---

## 2. Tech Stack

- **Framework:** React 18 (Strict Mode) + Vite 5
- **Language:** TypeScript 5 (Strict Mode, zero implicit any, unused variable enforcement)
- **Styling:** Tailwind CSS 3 with custom CSS design tokens:
  - **Midnight Navy** (Dark - Signature Default): `#0A1222`, `#0F1A2D`, `#142138`
  - **Clean Slate** (Light - Accessible Alternative): `#F4F7FB`, `#FFFFFF`, `#EDF2F9`
  - Contextual accents: Mint (`#A8DCC8`), Amber (`#ECD29A`), Ember (`#EEB2A3`)
- **Persistence:** Dexie.js v4 (IndexedDB) with reactive `dexie-react-hooks` (`useLiveQuery`)
- **Validation:** Zod v3 runtime schema validation
- **Routing:** React Router DOM v6
- **Motion:** GSAP v3 + `@gsap/react` with full `prefers-reduced-motion` compliance
- **Offline PWA:** `vite-plugin-pwa` with Workbox precache service worker
- **Testing:** Vitest 2 + `@testing-library/react` + `fake-indexeddb`

---

## 3. Implemented Modules & Features

### A. App Shell & Onboarding
- **Privacy Onboarding:** Clear explanation of local IndexedDB storage and manual backup model.
- **Responsive Layout:**
  - Desktop (>= 1280px): Left navigation rail with `WORKSPACE` and `PERSONAL` sections.
  - Mobile (<= 767px): 5-item bottom bar (`Today`, `Projects`, `Tasks`, `Calendar`, `More`).
- **Header:** Live online/offline status pill, theme switcher, Quick Add modal.

### B. Overview (Today Dashboard)
- Greeting using stored profile name and actual current local date.
- **Today's Focus:** Up to 3 unfinished priority tasks; completing a task automatically frees the slot.
- Real-time counters: Due Today, Overdue, Active Projects, Completed this year.
- Honest zero-data state with first-action CTA.

### C. Projects & Milestones
- Full CRUD, priority, and statuses (`not_started`, `in_progress`, `on_hold`, `completed`).
- Grid and List views with status tabs and search filtering.
- Local typographic SVG covers and custom image screenshot blobs.
- Accurate progress calculation based on completed milestones or tasks (Invariant 6).
- Completing a project updates `completedAt` and reports warning if open children exist.

### D. Unified Tasks
- Single canonical task ID across all views (never cloned).
- Filters: All Tasks, Due Today, Upcoming (next 7 days), Overdue, Completed.
- Parent linking: Standalone, Project, Academic Assignment, or Goal.
- Tactile completion feedback and instant database persistence.

### E. Academics
- Semesters, Subjects (with custom color tags), and Assignments.
- Assignment statuses: `not_started`, `in_progress`, `submitted`, `graded`.
- Assignment subtasks directly linked to canonical Tasks repository.
- Grade scoring, weight percentage, and submission portal links.

### F. Unified Calendar
- Desktop Month and Week grids; Mobile Agenda view.
- **Dynamic Projection:** Automatically aggregates Tasks, Assignments, and Milestones without duplicate database entries.
- Clicking any projected card opens and edits its canonical source entity.
- Standalone CalendarEvent creation.

### G. Goals
- Long-term goal tracking with target dates and motivation notes.
- Milestones with completion toggles; progress derived strictly from verified milestones (Invariant 7).
- Task-to-goal linking via `GoalTaskLink` without duplicating task records.

### H. Local Insights
- All-time projects, active projects, created in selected year, completed in selected year.
- Monthly completed projects bar chart derived strictly from `completedAt` (Invariant 5).
- Task completion rates and coursework submission breakdowns.
- Year selector with automatic discovery of historical years.

### I. Settings & Data Safety
- Profile name editing.
- Theme selection (Midnight Navy vs Clean Slate).
- Calendar week start (Monday vs Sunday) and clock format (12h vs 24h).
- Reduced motion toggle.
- **1-Click Backup Export:** Complete versioned JSON file with embedded asset blobs.
- **Atomic Backup Restore:** Strict Zod schema verification and rollback on error.
- **Workspace Reset:** With safety confirmation modal.

---

## 4. How to Run Locally

### Prerequisites
- Node.js >= 18.0.0 (Tested on Node v24.13.0)
- npm >= 9.0.0

### Commands
```bash
# Install dependencies
npm install

# Run local development server
npm run dev

# Run strict TypeScript typecheck
npm run typecheck

# Run automated Vitest test suite
npm test

# Build production bundle and PWA service worker
npm run build

# Preview production build locally
npm run preview
```

---

## 5. Test & Quality Evidence

- **Unit & Domain Tests:** 20/20 passed (`tests/unit/`)
- **TypeScript Typecheck:** 0 errors (strict mode enabled)
- **Production Build:** Success (647 KiB precached PWA bundle)
- Documentation:
  - `AGENTS.md` — Specialist orchestration architecture
  - `docs/ARCHITECTURE.md` — Technical design and data invariants
  - `docs/DESIGN_SYSTEM.md` — Tokens and component hierarchy
  - `docs/PROGRESS.md` — Live milestone delivery log
  - `docs/TEST_REPORT.md` — Automated test execution evidence
