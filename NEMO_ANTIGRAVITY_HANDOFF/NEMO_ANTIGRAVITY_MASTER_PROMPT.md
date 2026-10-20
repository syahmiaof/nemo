# NEMO — AUTONOMOUS PRODUCT ENGINEERING MISSION

## THE MISSION — READ THIS FIRST

You are the **Principal Software Architect, Staff Frontend Engineer, Product Designer, Engineering Manager, and Quality Gate Owner** for a real product called **Nemo**.

**Product name:** Nemo (display wordmark: `nemo.`)
**Tagline:** **Track it, finish it.**
**Primary UI language:** **English only**, for every label, error, empty state, tooltip, onboarding step, documentation for end users, date setting, and accessibility name. No Malay copy in the app.
**Product:** A refined, responsive, privacy-first, offline-capable personal workspace for developers, freelancers and students.
**Direction:** Original Tavola-inspired midnight navy, restrained glass layers, tactile and elegant GSAP animations. **Reference quality, not copied source code, trade dress, layouts, illustrations or assets.**
**Delivery expectation:** Build and validate the **working application**, not a screenshot, demo skeleton, static mockup, nonfunctional prototype, slide deck, or mere implementation plan.

The owner has delegated product/UI and routine engineering choices to you. Work autonomously, use evidence, make sensible decisions, and implement them. Do not wait for sign-off after every module. Still follow tool permission prompts; do not override security approvals or perform irreversible external actions without permission. Do not silently modify unrelated projects.

**Very important:** This entire prompt is self-contained. You do not need an external PRD or the prior conversation. If a local Phase 0 file happens to be present, use it as a secondary reference, but THIS document supersedes old branding, any earlier references to “Workspace Syahmi” or “Workspace.”, and the previous undecided language/design direction.

**First action:** Inspect the current repository and tooling. Identify whether it is empty, already a Nemo project, or an unrelated existing app. Preserve all unrelated files and changes. If it is a suitable empty/new working folder, initialize Nemo here. If it is an existing Nemo app, evolve it safely. If an unrelated app is present, create a clean `nemo/` subfolder and work there. Never destructively overwrite user files, and never claim you ran a command/test you did not run.

---

## 1. PRODUCT VISION & NON-NEGOTIABLE PRINCIPLES

Nemo is a personal command center to help a user:
1. Capture commitments (projects, tasks, assignments, goals, events).
2. Instantly know what needs attention today.
3. See all due dates in one unified calendar.
4. Resume work on the correct next action.
5. Finish tasks and milestones and obtain accurate yearly insights.
6. Keep private data under their own control, with export/restore and honest offline behavior.

Target personas: solo software developer managing many builds; student with subjects/assignments; freelancer with several deliverables; general personal productivity user. The application must support all four without showing developer-only clutter to everyone. A single user/workspace per browser profile is the MVP, **not** a multi-account system.

**Absolute product rules:**
- Functional product first; visual fidelity and motion must reinforce usability, never replace business logic.
- No accounts, no backend, no Firebase/Supabase, no cloud database, no mandatory third-party API keys, no analytics/telemetry, no hidden transmission of personal data.
- React SPA served from static hosting, with browser-local IndexedDB persistence; PWA offline support once assets have been cached. A first visit still requires network.
- No fabricated metrics, seeded “real” projects, dummy revenue, dead buttons, fake notifications, pretend live feeds, fake integrations, fake sync, or “Coming Soon” controls presented as working.
- Empty workspace on first use. If optional sample content exists for onboarding/development, it must be **explicitly user-initiated and clearly labeled Sample Data**, with a safe reset mechanism. No sample data in production by default.
- Data must survive reloads and route changes. Derived views use a canonical source of truth; no duplicate task or calendar entity for one real task/assignment.
- Never claim local storage is encrypted, private from another person using the same unlocked browser profile, or automatically backed up.
- All interactive controls must genuinely work or be removed. Actions must have loading, error and success feedback where applicable.
- No unauthorized brand borrowing: no Disney/Pixar fish, clownfish silhouette, orange/white fish stripes, ocean/fish mascots, film typography, copyrighted characters, movie stills, or character references. An abstract original geometric mark is required, subject to normal pre-launch trademark review for the name itself.

---

## 2. STACK AND PROJECT QUALITY BAR

Use a contemporary **stable** version of:
- Vite + React + TypeScript (strict mode).
- Tailwind CSS for layout utilities + authored CSS variables/design tokens. Use handwritten product components rather than blindly applying a generic component kit.
- React Router for accessible navigable routes and deep-link support.
- Dexie + IndexedDB for local data, indexes and database version migrations.
- Zod or equivalent runtime schemas for forms and untrusted backup imports.
- Zustand or small React context for ephemeral UI state; persistent business records belong in Dexie, not duplicated in transient global stores.
- GSAP + `@gsap/react` for scoped, properly cleaned-up animation; CSS for simple states. GSAP Flip only if helpful and compatible.
- date-fns or equivalent for calendar date calculations, with strict local-date semantics.
- PWA plugin/service worker suitable for static hosting, with carefully bounded same-origin caching.
- Vitest + React Testing Library for unit/component tests.
- Playwright for critical end-to-end journeys. Use axe-core or equivalent accessibility testing if available.
- ESLint, TypeScript typecheck and a documented formatter.

Evaluate actual package versions and tooling availability; never invent a command, CLI capability, UI tool name or plugin. Use the package manager already in the repo; otherwise choose npm. Avoid giant dependencies for trivial needs. Every dependency must have a reason. No secrets in the client bundle; no `.env` requirement to use core functions.

Suggested architecture (adapt to existing repo if necessary):
```
src/
  app/                 # app bootstrapping, providers, router, shell
  components/          # shared accessible UI primitives and compositions
  design/              # tokens, typography, glass surfaces, motion presets
  db/                  # Dexie schema, repositories, transactions, migrations
  domain/              # models, validation, derived calculations, shared rules
  features/
    overview/
    projects/
    tasks/
    calendar/
    academics/
    goals/
    insights/
    settings/
  hooks/
  lib/
  assets/
  tests/
public/                 # manifest, original icons, static local assets
.docs or docs/          # requirements, architecture, ADRs, QA evidence
.agents/agents/         # optional specialized agent profiles
```

**Repository hygiene:** meaningful commits or checkpoints if Git is available; `README.md`, `docs/PRODUCT_SPEC.md`, `docs/ARCHITECTURE.md`, `docs/DESIGN_SYSTEM.md`, `docs/PROGRESS.md`, `docs/TEST_REPORT.md`, and a practical `AGENTS.md`. Make sure package scripts for `dev`, `build`, `lint`, `typecheck`, `test`, and `test:e2e` exist or are documented. No broken imports, debug logs, broad `any`, or ignored TypeScript errors in production code.

---

## 3. BRAND, VISUAL LANGUAGE & DESIGN SYSTEM — DECIDE AND EXECUTE

### Nemo identity
- Product wordmark: `nemo.` in a carefully spaced contemporary sans serif.
- Signature message: `Track it, finish it.`
- Logo concept: **original abstract N formed from a purposeful continuous tracking path, with one small completion endpoint**. Strong at favicon size; no creature imagery, ocean symbolism, or visual imitation of the film.
- Design personality: quiet confidence, precise, tactile, editorial, premium productivity software — not sci-fi, crypto terminal, gaming dashboard or generic AI-admin template.
- Font recommendation: **Geist Sans** for UI and **Geist Mono** for tiny technical labels/numerals; use locally bundled appropriately licensed files or robust system fallbacks. Do not create a remote-font privacy dependency.

### Mandatory token baseline (refine through contrast testing)
```
--bg-canvas:         #0A1222;
--bg-elevated:       #0F1A2D;
--surface:           #142138;
--surface-hover:     #1B2C44;
--surface-solid:     #17243A;
--border-subtle:     rgba(225,236,248,.10);
--border-emphasis:   rgba(225,236,248,.19);
--text-primary:      #EEF2FB;
--text-secondary:    #A3B0C7;
--text-tertiary:     #8696B0;
--accent-mint:       #A8DCC8;
--accent-amber:      #ECD29A;
--accent-ember:      #EEB2A3;
--focus-ring:        #B4E5D5;
```
Dark midnight is signature default. Design a genuinely accessible light alternative; do not merely invert everything. Accent colors carry meaning, not random decoration. Use subdued background mesh in a limited region and layered rim lights selectively. **Glass is for app chrome, hero-level summary surfaces and floating overlays; dense tables/forms/task lists should use readable, mostly opaque materials.** Avoid rainbow gradients, excessive glow, inflated cards, emoji iconography, generic four-metric hero duplication, pointless 3D blobs, and decorative animations.

### Desktop/tablet/mobile composition
- Desktop >= 1280px: precise left navigation rail/sidebar (~236–256px expanded); topbar with page title, contextual actions, privacy/offline indicator and optional profile/avatar; flexible main content; contextual right rail only where genuinely useful, not always.
- Mid-size tablet: collapsible sidebar or overlay; single primary content canvas.
- Mobile <= 767px: dedicated compact header and five-item bottom navigation: **Today, Projects, Tasks, Calendar, More**; More contains **Academics, Goals, Insights, Settings**. A reachable Quick Add action must exist. Mobile Calendar defaults to Agenda. No horizontally crushed tables, offscreen modals or hover-dependent commands.
- Maintain consistent spacing rhythm, touch targets >= 44px where practicable, visible focus rings, legible long titles, user-safe truncation, semantic forms and graceful 320–390px layouts.
- Use real image previews only from user-uploaded content or explicitly permitted remote sources. Design beautiful **typographic fallback project covers** based on project title/stack — do not rely on stock AI illustrations.
- Navigation must be usable via keyboard, touch and screen readers.

### Motion system (restrained GSAP)
- Route change: 180–280ms understated opacity/translate; no blocking entrances.
- Tab/segmented nav: smooth moving active indicator; optionally asymmetrical leading/trailing edge clip-path animation (Tavola-inspired mechanism but original implementation).
- Dialog, drawer, quick-add sheet: 160–260ms, appropriate directional movement and focus management.
- Project card -> details: cohesive visual continuity (do not animate layout by brute force).
- Task completion: brief satisfying tactile feedback, but immediate data commit and undo where safe.
- Charts: subtle reveal and transitions with always-available readable labels/data.
- Respect `prefers-reduced-motion`; per-app override optional. Reduced motion should remove spatial travel and decorative transitions without removing clarity.
- Prefer `transform`/`opacity` for frequently animated elements; use GSAP React hook with scope and cleanup. Do not leak listeners/timelines or drive React re-renders each animation frame.
- Test on mid-range/mobile hardware profiles; do not claim an unmeasured 120fps. Use animations to clarify state, not delay actions.

### Page signature
Overview should have thoughtful hierarchy: friendly, not cartoonish greeting; “Today’s Focus”; priority deadlines; live project health summary; one useful lightweight insights component; a prominent Quick Add. Do not fill empty first-run screens with fictional stats. The app must feel premium even with **zero user data**.

---

## 4. INFORMATION ARCHITECTURE / ROUTES

Use these stable conceptual routes, adapting route library syntax as needed:
```
/                 -> redirect to /overview
/overview         -> Today dashboard, quick add, focus
/projects         -> grid/list, filters, add project
/projects/:id     -> details: summary, milestones, tasks, links, image
/tasks            -> all, today, upcoming, overdue, done
/calendar         -> month/week on desktop, agenda on mobile, event CRUD
/academics        -> semester selection and academic summary
/academics/semesters/:id  -> semester + subjects
/academics/subjects/:id   -> subject + assignments
/academics/assignments/:id -> assignment details
/goals            -> goals grouped by status
/goals/:id        -> goal details + milestones + linked tasks
/insights         -> valid local metrics + time filters
/settings         -> profile, appearance, privacy, data backup
*                 -> helpful not-found route
```

Desktop side navigation: `WORKSPACE` (Overview, Projects, Tasks, Calendar), `PERSONAL` (Academics, Goals, Insights), footer Settings/Profile. Mobile nav as defined in section 3. Deep links to missing records on another device show “This item is not stored on this device”, not an indefinite spinner.

---

## 5. CANONICAL DATA MODEL & INVARIANTS

Implement typed domain records, runtime validation, indexes and database schema migrations. Recommended types:

- **WorkspaceSettings:** singleton ID, displayName default `My Workspace`, optional avatar Blob/reference, theme, accent, weekStartsOn, hourFormat, reduceMotion setting, onboardingCompleted, databaseVersion. Users may use the app without uploading a photo.
- **Project:** id, title, description, category, priority, status (`not_started | in_progress | on_hold | completed`), `archivedAt?`, `createdAt`, `startedAt?`, `dueDate?`, `completedAt?`, clientLabel?, tags[], techStack[], liveUrl?, repoUrl?, notes?, previewBlobId?, updatedAt.
- **Task:** id, title, notes?, status (`todo | in_progress | done`), priority, `dueDate?` and optional time, `startDate?`, estimatedMinutes?, tags[], blockedReason?, `parentType?` (`project | assignment | goal`), `parentId?`, `createdAt`, `completedAt?`, `updatedAt`. One canonical task ID. Goal-to-existing-task associations may require a separate **GoalTaskLink** table when a task belongs to a project or assignment but contributes to a goal — never clone the task.
- **Milestone:** id, ownerType (`project | goal`), ownerId, title, `targetDate?`, `completedAt?`, order.
- **Semester:** id, title, startDate?, endDate?, status, createdAt.
- **Subject:** id, semesterId, code?, title, lecturer?, color, createdAt.
- **Assignment:** id, subjectId, title, description?, status (`not_started | in_progress | submitted | graded`), dueDate?, optional dueTime, submissionUrl?, weightPercent?, scoreObtained?, scoreMaximum?, submittedAt?, createdAt, updatedAt. `late` is derived, not a fifth persisted status. Subtasks reference the assignment through the canonical Task table.
- **CalendarEvent:** id, title, description?, location?, startAt/endAt as time-aware timestamps OR all-day local date strings, isAllDay, subjectId?, createdAt, updatedAt. Only manually created events belong here.
- **Goal:** id, title, why?, category?, status (`planned | active | paused | achieved`), targetDate?, createdAt, achievedAt?, updatedAt.
- **FocusSelection:** taskId, effectiveLocalDate, chosenAt; max 3 unfinished tasks in the active local day.
- **AssetBlob:** id, owner reference, MIME type, validated size, Blob; applies to profile avatar and project screenshots.

**Key invariants:**
1. A canonical task update immediately affects Overview, Tasks, linked Project/Assignment/Goal, Calendar projections and Insights.
2. Calendar projection = tasks with due dates + assignments with deadlines + dated project/goal milestones + standalone CalendarEvents. Project/assignment due-date cards can be added with deliberate deduplication rules; do not count the same deadline twice under different sources.
3. Date-only values remain exact local `YYYY-MM-DD` strings. Do not round-trip them through `toISOString()` and shift the day. Timed events require explicit timezone handling and `end > start` validation.
4. Project `completedAt` is set on completion (editable with care); reopening removes it from currently completed metrics. Historical audit trail is optional, but yearly completion numbers must be accurate. Warn when completing while tasks/milestones remain open; do not silently mark all children complete.
5. Counts distinguish `all-time projects`, `created in selected year`, `completed in selected year`, and `active now`. Do not mix denominators. Yearly/monthly charts derive from `completedAt`, not createdAt.
6. Project progress: if project milestones exist, use completed/total milestones and label basis; otherwise if tasks exist, use completed/total tasks and label basis; if neither exists, show “No progress data” instead of made-up 0% or 75%. Completed status may show a completion state separately from unfinished children.
7. Goal progress uses completed/total goal milestones; if none, show “No measurable milestones yet.” Achieved status does not rewrite milestones.
8. Deadline risk and project health are distinct from manually saved status. Any health rule must be deterministic, documented and unit tested; never use mock “AI confidence”.
9. Destructive actions must state whether children are unlinked, archived or deleted; never silently cascade. Prefer safe archive and explicit confirmations. Use transactions to keep references valid.
10. Initialize an empty DB; no fake portfolio/project records.
11. Backups must round-trip supported images/blob assets, relationships and metadata, with validation and a compatible version identifier.

---

## 6. REAL FUNCTIONAL MODULES — P0 ACCEPTANCE CONTRACT

### A. First Run + Settings + Global App Shell
- First launch: elegant original Nemo onboarding with concise explanation: **“Your workspace lives in this browser. No account. No automatic cloud sync. Export backups to keep it safe.”**
- Optional workspace name/avatar, short example of Quick Add, and an explicit Start Workspace action. Skip must work.
- Settings: profile/avatar, appearance (dark default; accessible light), week start, 12/24-hour clock, reduced motion, privacy explanation, backup/restore, reset.
- Global navigation, breadcrumb/back, route fallback, toast/error states, Quick Add modal/sheet.
- Keyboard navigation and accessible route announcements as appropriate. Search/Cmd+K is P1, only add if core complete.
- Broken/unavailable data must have a useful recovery state.

### B. Overview / Today
- Personalized greeting using stored profile name and actual current local date.
- Today's Focus: select maximum 3 incomplete canonical tasks, edit selection, mark task done/unpin; do not leave completed tasks occupying active focus slots.
- Due today, overdue, next 7 days: click item -> real source. No fictional counts.
- Active projects, completed this year, open tasks, approaching assignments with accurate calculations.
- Pinned or recent project shortcuts only if implemented fully; otherwise omit.
- Quick Add Project/Task/Assignment/Event from any route.
- With zero data, build a delightful but completely honest empty state and straightforward first action.

### C. Projects
- Real create/edit/archive/delete (confirmation)/complete/reopen; statuses and priority.
- Fields: name, description, dates, category, tech stack/tags, client label optional, repository/live links, notes, optional image.
- Projects view: grid and list with meaningful status tabs, filters, sort and responsive cards.
- Project detail: overview, linked tasks, milestones, current next action, progress and actual links. P1 status Kanban only after list/grid and editable status are solid.
- **URL preview truth:** browsers cannot reliably capture arbitrary external website screenshots nor fetch cross-origin Open Graph content without server help. NEVER claim automatic screenshots work universally. Use user-uploaded/pasted screenshots persisted as blobs (verify clipboard where supported), local generated covers, and/or a safe favicon attempt only when disclosed/consented. External iframe embeds are optional and must respect frame restrictions. Failed preview must NEVER block creating a project.
- Validate URL protocol `http:` or `https:` only, preferably HTTPS. Open external links safely with `rel="noopener noreferrer"`; do not auto-send saved URLs to a third-party screenshot/metadata service.
- Completing a project updates selected-year Insights and active filters immediately.

### D. Unified Tasks
- CRUD, status and priority, notes, due date, blocked reason (nice P1), parent context and stable ID.
- All / Today / Upcoming / Overdue / Done filters, plus search, sort and clear filter states.
- Tasks may be standalone or linked to a Project, Assignment, or Goal. If same real task is associated with another goal, use references, not cloned rows.
- Complete in any view => consistent everywhere and `completedAt` set. Reopen => clear completed timestamp.
- Optimistic UI only with rollback/error feedback if persistence fails. Avoid silently losing writes.
- A basic accessible list is mandatory; visual Kanban drag-drop is P1 and must have keyboard/touch alternatives.

### E. Calendar
- Desktop: Month + Week; Mobile: Agenda as default, with optional switches.
- User-created standalone events CRUD with date/time/all-day handling.
- Calendar reflects Task/Assignment/Milestone deadlines by **projection** rather than duplicated event records.
- Source item opens its own Task / Assignment / Milestone detail/editor; a standalone event opens an event editor.
- Editing an assignment's deadline moves calendar projection immediately.
- Today shortcut, next/previous navigation, filter by type (filter is P1), useful empty days, accessible type text (not color alone).
- Handle date-only fields and cross-midnight or timezone edge cases explicitly. No drag-to-reschedule until editing semantics are correct.

### F. Academics
- Semester CRUD; subject CRUD within semester; assignment CRUD within subject.
- Assignment statuses: Not Started, In Progress, Submitted, Graded; late derived from deadline and submission state.
- Assignment due date/time, description, optional submission link, optional weight/marks with explicit units. Do not invent GPA calculations.
- Assignment subtasks come from Tasks canonical repository.
- Semester/Subject screens show counts and approaching deadlines accurately.
- Submitted is not Graded. Marking Submitted does not automatically finish every subtask.
- No hidden calendar duplicates.

### G. Goals
- Goal CRUD and status Planned/Active/Paused/Achieved; target date, reason/category.
- Milestones with completion toggles and optional deadlines; accurately derived progress.
- Goal can link existing canonical tasks via relation; not duplicate them.
- Relevant dated goal milestones appear in Calendar and next-actions as appropriate.
- Goal with no milestones displays undetermined progress, not random percentages.

### H. Basic Insights
- Real all-time project count, current active count, created-in-year, completed-in-year; year selector.
- Monthly completed projects chart using actual `completedAt` and numeric/accessible values.
- Open/completed/overdue tasks according to documented local-date logic.
- Submitted/Graded assignment summary (separate semantics).
- Every chart has meaningful zero states and underlying data drilldown or visible data table; don't fabricate productivity scores, revenue, working hours or accuracy claims.
- All computation remains in the browser. No external analytics.

### I. Backup, Import, Reset, Storage Failure
- One-click versioned JSON export of **all** persisted records, relations, settings and uploaded images (include blobs safely, e.g. encoded with clear size warnings). Provide filename with date and version.
- Import: file size warning, strict schema/content/link/ID validation, supported-version check, clear preview of entity counts, **explicit replace/restore confirmation**, and atomic transaction. If an import fails, existing data remains intact. Do not offer merge unless independently specified and tested.
- Restore to a fresh browser must produce the same entities, images and metrics. Test actual round trips.
- Reset workspace with explicit destructive confirmation; never use reset as a routine recovery tactic.
- Handle quota exceeded, unavailable IndexedDB, corrupt data, app update/migration failure; show meaningful data safety guidance and avoid false success messages.
- Offline disclosure: previously cached app works without connectivity; first load still needs internet. `navigator.onLine` is advisory, not proof of sync.

---

## 7. DETAILED END-TO-END USER JOURNEYS TO IMPLEMENT AND TEST

J1 **First visit:** Fresh browser -> privacy onboarding -> name/avatar optional -> complete -> empty Overview -> Quick Add works -> reload retains settings.

J2 **Create project and preview:** Add Project -> fill real fields -> paste valid live URL -> upload/paste screenshot or use local fallback -> Save -> Project Detail -> create first linked Task/Milestone -> reload and open offline. Invalid/CORS-blocked URL never blocks project save.

J3 **Task synchronization:** Create one Task inside Project -> appears in Tasks and Calendar when due -> add to Today's Focus -> mark Done from Overview -> all linked views and project progress update without duplicate.

J4 **Complete project / yearly report:** Mark Project Completed -> warn if open tasks -> set proper completedAt -> Completed filter and monthly chart update -> change selected year to verify grouping -> reopen and verify calculations update.

J5 **Student onboarding:** Create Semester -> Subject -> Assignment + due date and submission link -> add canonical subtasks -> deadline visible in Calendar and Today -> Submitted -> optional Graded later, never conflated.

J6 **Calendar source editing:** Tap academic deadline -> open Assignment (not cloned event) -> edit date -> calendar moves one occurrence -> create separate study CalendarEvent -> reload and verify both.

J7 **Goal:** Create Goal -> add three milestones -> attach existing task -> complete milestone -> derived progress updates -> no duplicate task.

J8 **Today Focus:** Select 3 unfinished tasks -> attempt 4th and see proper limit handling -> complete one -> selection and counts reconcile -> crossing local midnight does not corrupt tasks.

J9 **Portable backups:** Populate multiple entities and avatar/project screenshots -> export -> inspect backup -> import to clean browser context -> compare records, assets, dates and metrics -> malformed backup rejected without mutation.

J10 **Offline:** Precache application -> go offline -> refresh -> create/edit/complete -> confirm persistence -> return online (no fake sync claims).

J11 **Accessibility/responsiveness:** Complete J2, J3, J5 and J9 at 360px mobile with touch emulation and keyboard-only on desktop; screen reader semantics and focus management tested.

Also test cancellations, missing/deleted deep links, broken assets, empty tables, long project names, URL validation, timezones, year boundaries, large datasets and storage failures.

---

## 8. SPECIALIST AGENT ORCHESTRATION — SAFE PARALLELISM

You are the **single accountable lead orchestrator**. Use Antigravity's **actual available** subagent features. If `invoke_subagent`/custom subagents, teamwork or isolated worktrees are accessible in this installation, use them. If not, do not pretend tools exist; implement the same role-based stages serially and report the limitation. Do not block the entire project just because orchestration is unavailable. Favor Git worktrees / isolated branches for parallel code generation and owner-specific file scopes. Main agent owns integrations and conflict resolution.

**Create or define these specialist roles if supported** (workspace-specific `.agents/agents/<name>.md`, with frontmatter properties only when verified supported; avoid specifying unverified tool identifiers):
1. `product-design-director` — visual language, responsive UX, accessibility patterns and design QA; owns design specs and token proposals.
2. `architecture-and-data-engineer` — domain model, Dexie schema/repositories, validation, import/restore, migrations and tests. Owns `src/db`, `src/domain` and relevant tests.
3. `interface-system-engineer` — shell, navigation, components, motion and theme; owns app shell and `src/components`, `src/design` after contracts locked.
4. `projects-tasks-engineer` — projects + canonical tasks features and unit tests. Owns `src/features/projects` and `src/features/tasks`.
5. `academics-calendar-engineer` — semesters, subjects, assignments, calendar projections and date handling tests. Owns `src/features/academics` and `src/features/calendar`.
6. `goals-insights-engineer` — goals, milestone linking and client-side analytics, derived selectors and tests. Owns `src/features/goals` and `src/features/insights`.
7. `quality-security-reviewer` — independent tests, browser-based journeys, a11y, performance, privacy audit; QA agent **reports defects and evidence**, lead assigns fixes and reruns checks.

**Do NOT spawn seven engineers to edit shared files at once.** Use this dependency order:

**Wave 0 — Recon + contracts (mostly sequential):** inspect repo; write brief architecture/design ADR, route schema, typed interfaces, storage semantics and ownership boundaries; create runnable skeleton. A designer and tester may review contracts in parallel but should not overwrite implementation.

**Wave 1 — Foundation (mostly sequential, with disjoint work):** lead merges app shell and database/repository interfaces; deliver working persistent Settings + Today/Quick Add shell; confirm build/test baseline; tag/checkpoint milestone. No feature implementation against guessed contracts.

**Wave 2 — Independent domain implementation (parallel only after contracts stabilize):** Projects/Tasks; Academics/Calendar; Goals/Insights in separate scopes/worktrees. Each gets an explicit task ticket, interface contracts, allowed files, acceptance tests, dependencies and expected handoff evidence. Avoid concurrent edits to router, package manifest, shared schema or global tokens. If contracts must change, request a coordinated lead change and propagate.

**Wave 3 — Integration (lead-owned):** integrate branches in dependency order, reconcile imports, wire routes, shared Quick Add, Today, calendars, linked IDs and settings; run schema and cross-module tests after each merge. Resolve conflicts deliberately, never force-merge broken branches.

**Wave 4 — Independent verification:** QA and design reviewers test actual built app across browser sizes and offline scenarios. Fix defects; retest. Stop spawning new features once reliability gate begins.

**Wave 5 — Release candidate:** execute clean build, typecheck, lint, tests, E2E, accessibility and performance/stress checks. Produce factual report with remaining limitations.

The orchestrator must track work in `docs/PROGRESS.md` with fields: ID, owner, dependency, status (`todo | active | integration | verified | blocked`), acceptance evidence, and last update. Check in/change a worktree only when inspected. Do not mark a task verified merely because its agent claimed it was done.

**Parallelism cap:** Start with at most **3 implementation subagents concurrently** after Wave 1. Expand only if isolation and integration quality justify it. High agent count is not a quality metric. Reserve independent QA capacity.

---

## 9. IMPLEMENTATION PLAN — BUILD ONE RELIABLE VERTICAL SLICE AT A TIME

### Stage 0 — Repo audit and architecture contract
Deliver: repo audit; tech decisions; domain entity schema; acceptance/test matrix; route map; original design tokens and typography; practical setup docs.
**Gate:** `npm run build`, typecheck and initial test script operate on a real app skeleton.

### Stage 1 — Design system + shell + local DB
Deliver: branded Nemo shell, desktop/mobile navigation, GSAP motion primitives, theme, privacy onboarding, settings, IndexedDB schema and basic repositories, migration placeholder, PWA baseline, responsive states.
**Gate:** empty first launch + onboarding persist + dark/light + mobile nav + basic DB smoke and browser reload.

### Stage 2 — Canonical Tasks + Projects + real Overview
Deliver: full Task and Project CRUD, linking, project images, date filtering, completion semantics, Today Focus, actual project/task metrics, meaningful home screen.
**Gate:** J1–J4 and J8 pass, including persist/refresh and local dates.

### Stage 3 — Academics + Calendar
Deliver: semester/subject/assignment, time-aware calendar/event editing, unified projected deadlines, source navigation and academic workflow.
**Gate:** J5–J6 pass; no duplicate records; year/month/timezone edge tests.

### Stage 4 — Goals + Insights
Deliver: goals and milestones, linked tasks, annual/monthly chart, correct metrics, year selector.
**Gate:** J4 and J7 pass and chart numbers match fixtures.

### Stage 5 — Data safety + offline + quality
Deliver: complete import/export with images, backups, storage errors, service worker offline behavior, responsive and accessible UX, performance/stress fixes, reliable light theme.
**Gate:** J9–J11 pass with browser evidence; zero critical functional and a11y regressions.

### Stage 6 — Release readiness
Deliver: validated scripts, completed docs, final architecture, known limitations, screenshots or browser recordings when tools are available, real `docs/TEST_REPORT.md`, clear run instructions, deployment notes for static hosting (do not publish to the public internet without user permission).
**Gate:** Definition of Done below satisfied.

No premature “finished” message after only Stage 0/1. If interrupted by context/quota/tool limits, leave a durable progress + resume handoff and state honestly what remains. Resume from verified state rather than restarting.

---

## 10. TESTING STRATEGY — ASSERT, DON'T ASSUME

**Test on real functionality, not just UI screenshots.**

### Automated quality scripts
- `typecheck`: strict TypeScript checks.
- `lint`: actionable diagnostics; no blanket disabling rules.
- `test`: domain selectors and critical components with sensible coverage.
- `build`: actual Vite production build.
- `test:e2e`: Playwright supported browser(s), desktop and mobile viewports, persistence and integration flows.

### Required domain/integration tests
- Task completion and reopening updates `completedAt` and derived selectors.
- Cross-module task identity: project, overview, calendar and goal links reference same record.
- Project completion year handling (Dec 31, Jan 1; old year vs current year; reopen).
- Date-only local semantics and timed event valid ranges.
- Project progress precedence; goals with zero milestones.
- Assignment Submitted != Graded; computed overdue/late conditions.
- Calendar projections no duplicates after source edit.
- CRUD/edit, undo when implemented, archive/delete confirmations and referential integrity.
- Invalid URL, unsafe protocol, untrusted strings and malicious backup HTML strings are handled without XSS.
- Backup JSON schema version/IDs/relationship integrity; image round trip; validation rollback, bad files and quota failures.
- Migration test using fixture at previous schema version, whenever a migration is added.

### Browser E2E scenarios
- Run the 11 journeys in section 7 as appropriate; prioritize essential flows before extras.
- Check at **320, 360/390, 768, 1024, 1440px** (and optionally 1920), portrait mobile, coarse pointers and keyboard-only flows; fix horizontal overflow and overlapping fixed nav.
- Playwright Chromium as baseline; also run Firefox/WebKit **when actually installed and available**, otherwise report coverage gap. Don't claim cross-browser testing without execution.
- Confirm tab order, focus restoration, Escape behavior, dialog semantics, labels, hit targets, WCAG 2.2 AA-oriented contrast, reduced motion and major axe critical/serious issues. If a11y tooling cannot run, log that explicitly and do a concrete manual checklist.
- Test with browser offline after prior load and service-worker cache; offline refresh, local writes, reconnect, back navigation.
- Test import into an **isolated fresh browser context**. Verify blobs and counts, not just toast message.
- Validate responsive project card previews, long labels, empty states and disabled controls.
- Test image uploads: size/type limits, corrupt image handling, available storage and persistence.

### Stress/performance checks
- Use deterministic development-only fixtures, never secretly populate real user DB: **500 projects, 5,000 tasks, 1,000 assignments, 100 goals, 500 events**, plus many long titles and realistic deadlines.
- Measure load, filtering, search, navigation, calendar switch, basic render responsiveness and storage footprint in actual environment. Fix obvious freezes; virtualize long lists or paginate if profiling demonstrates need.
- Exercise rapid task completion, quick route switches while GSAP is active, successive search/filter interactions, import interruption, reload while offline and large backups.
- Record environment, measured outcomes and observed bottlenecks; do not invent Lighthouse scores, fps or benchmark results. Set and report reasonable, measurable budgets after first real baseline.
- Verify no large unintended third-party data egress; inspect actual browser network requests if tool access exists.

**Fix loop:** Reproduce -> add regression test where practical -> patch root cause -> rerun targeted tests -> rerun full checks -> browser verify. If blocked, document reproducible blocker, attempted alternatives and impacted gate. Never “solve” failing tests by deleting assertions or substituting mocks for real persistence.

---

## 11. SECURITY, PRIVACY, ACCESSIBILITY & RELEASE RULES

- Treat project titles, notes, external URLs and imported backup content as untrusted. Render plain text by default; no unsafe HTML insertion (`dangerouslySetInnerHTML`) from user input.
- Backup imports must validate JSON, permitted schema versions, arrays, entities, enums, record limits, uniqueness, references, image MIME and sizes before any mutation. Recover/rollback safely.
- Never fetch arbitrary project URLs as browser-incompatible screenshot hacks or route private URLs through unknown online screenshot/metadata APIs. Any future remote preview is opt-in and separately specified.
- Third-party fonts, analytics and CDN media should not silently transmit user browsing/profile information; self-host app assets. External links open only after an explicit user action.
- Use proper Content Security Policy guidance for hosting, safe link handling, dependency hygiene and no secrets embedded in the app.
- Browser profiles are not secure multi-user isolation; make this limitation clear in privacy settings. `local-first != encrypted, synchronized, or indestructible`.
- Maintain offline support, browser storage caveats and a visible Export Backup option.
- Design for real content and empty states; include helpful errors and retry/recovery actions.
- Deploy only with approval; do not register domains, pay for APIs, upload user data, or create accounts on the owner's behalf.

---

## 12. RELEASE DEFINITION OF DONE (NO FAKE COMPLETION)

The MVP is **DONE** only when ALL are true:

[ ] Every P0 module works on fresh, user-entered, browser-persisted data.
[ ] Project create/edit/delete/archive/complete and screenshot fallback work after reload.
[ ] Canonical tasks work in Projects, Tasks, Overview, Goals and Calendar without duplication.
[ ] Semester -> Subject -> Assignment, due dates and submission status work.
[ ] Calendar shows coherent source-linked deadlines and standalone events.
[ ] Goals and milestones work; Insights numbers are derived and accurate.
[ ] Backup/restore includes uploaded assets and works to an isolated clean browser.
[ ] Cached PWA can be refreshed and used offline without fake cloud sync.
[ ] Responsive mobile and desktop workflows work without overflow or dead controls.
[ ] Midnight visual identity, accessible light mode, coherent GSAP and reduced motion work.
[ ] No fictional data, fake progress, inaccessible dialogs or major known critical bugs.
[ ] Production build, typecheck, lint, relevant unit and E2E tests PASS (or unmet tests explicitly block the release claim).
[ ] Security/privacy/a11y checks and stress tests are genuinely executed and documented.
[ ] README, architecture, design system, progress log and test report are factual and current.

### Final report format
At each meaningful milestone, and especially the end, return:
1. **Implemented and verified** — exact features and evidence.
2. **Automated checks run** — actual commands and pass/fail output summary.
3. **Browser checks run** — actual browsers/screen sizes with evidence, no invented screenshots.
4. **Privacy/offline/backup test results** — what passed and what remains.
5. **Known limitations / blocked items** — honest priority and impact.
6. **How to run locally** — working commands and localhost route.
7. **Next milestone / release readiness** — no unsupported “100% complete” claim.

---

## 13. YOUR EXECUTION ORDER — START NOW, NOT ANOTHER PLANNING LOOP

1. **Inspect** repository, OS, package manager, available Antigravity tools, Git state and dependencies.
2. **Write/refresh** short architecture/design contracts and a task tracker; do not stall on needless planning or ask the owner to select colors, UI components or stack.
3. **Initialize and run** a real app skeleton. Confirm commands work before proceeding.
4. **Create specialist subagents if actually supported**, cap parallel implementation, give file-scoped tickets and verify all merges; otherwise implement by role sequentially.
5. **Ship full vertical slices** in the stages above. Work on each until functionally verified, then integrate the next.
6. **Self-test, repair, stress-test and visually inspect** the app. Open it in a real browser when available; compare implementation against this design and journeys, not made-up screenshots.
7. **Update durable docs/progress** as you work. At interruptions, produce a detailed restart instruction in `docs/PROGRESS.md`.
8. **Deliver honest evidence-backed release report** only after gates pass; do not declare fake completion.

You are authorized to make ordinary design and technical decisions and to execute coding/testing within the chosen Nemo project without repeated product-level clarifications. Follow all environment and tool permission requirements. Prefer a smaller trustworthy release to an enormous decorative but nonfunctional one. **Build Nemo. Track it, finish it.**
