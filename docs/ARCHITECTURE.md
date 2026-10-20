# Nemo Architecture Specification

## 1. System Overview

Nemo is a local-first, privacy-respecting personal command center for developers, students, and freelancers.
It runs entirely as a single-page application (SPA) in the user's browser, persisting all domain entities and settings to IndexedDB via Dexie.js.

### Core Architectural Principles
1. **Local-First & Zero Backend:** No accounts, no external tracking, no cloud database requirements. All user data is stored locally in IndexedDB.
2. **Canonical Single Source of Truth:** Tasks and entities have a single canonical ID. Projections (such as Calendar deadlines, Today's Focus, and linked Project/Goal task lists) derive directly from canonical records rather than maintaining cloned duplicates.
3. **Deterministic Business Logic:** Progress calculations, deadline risks, and year-by-year insights are strictly computed via deterministic domain functions that can be tested in isolation.
4. **Resilient Local Dates:** Date-only fields are stored strictly as `YYYY-MM-DD` strings to prevent accidental timezone offsets when crossing midnight. Timed events use explicit ISO strings or timestamp representations.
5. **Atomic Data Safety:** Backup exports encapsulate all tables and asset blobs into a validated JSON schema. Imports are verified completely before any database transactions take effect, guaranteeing rollbacks on error.

## 2. Directory Structure

```
src/
  app/                 # App initialization, router, layout shell, providers
  components/          # Shared accessible UI primitives (buttons, modals, forms, dropdowns)
  design/              # CSS tokens, theme definitions, GSAP animation hooks
  db/                  # Dexie database instance, table definitions, migrations, backup logic
  domain/              # Domain models, Zod validation schemas, business calculators
  features/
    overview/          # Today focus, quick metrics, deadline projections
    projects/          # Projects, milestones, custom project covers/screenshots
    tasks/             # Unified tasks, filtering, priority badges
    calendar/          # Unified calendar (month/week/agenda) with projected deadlines
    academics/         # Semesters, subjects, assignments, grade trackers
    goals/             # Goals, goal milestones, linked task relations
    insights/          # Derived local metrics, charts, year filters
    settings/          # Profile, theme, backup/restore, reset controls
  hooks/               # Shared hooks (local storage, media query, keybindings)
  lib/                 # Utilities (date formatting, ID generation, sanitization)
  assets/              # Local icons, fonts, fallback SVG graphics
tests/
  unit/                # Domain logic, date calculations, schema validation
  components/          # UI components and interaction testing
  e2e/                 # Playwright user journeys (J1-J11)
docs/                  # Architecture, design system, progress logs, test reports
```

## 3. Data Flow & State Management

- **Persistent State:** Managed by Dexie.js (`db/nemoDb.ts`) using Dexie's reactive live queries (`useLiveQuery`). Changes immediately trigger reactive re-renders across all active components.
- **Transient UI State:** Lightweight React context or small Zustand stores for modal visibility, active filters, and mobile drawer toggles.
- **Routing:** React Router DOM managing declarative deep links (`/overview`, `/projects/:id`, `/tasks`, `/calendar`, etc.). Deep links to missing entities cleanly present an informative empty state.
