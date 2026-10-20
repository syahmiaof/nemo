---
title: "Workspace Syahmi | Phase 0 Product Blueprint"
subtitle: "Product Requirements · Sitemap · Feature Inventory · Detailed User Flows"
date: "20 October 2026"
lang: en
---

# Workspace Syahmi — Phase 0 Product Blueprint

**Date:** 20 October 2026  
**Status:** Draft complete / pending sign-off  
**Implementation:** NOT STARTED. These are planning specifications only.

## Document map

1. [`01_PRD.md`](01_PRD.md) — vision, personas, scope, requirements, acceptance criteria, constraints, data concepts.
2. [`02_SITEMAP.md`](02_SITEMAP.md) — full desktop/mobile sitemap, cross-module navigation and edge cases.
3. [`03_FEATURE_INVENTORY.md`](03_FEATURE_INVENTORY.md) — 68 features with P0/P1/P2 priority and ship gates.
4. [`04_USER_FLOWS.md`](04_USER_FLOWS.md) — 11 detailed flows with normal, failure/offline, state changes and tests.
5. [`05_PHASE0_SIGNOFF.md`](05_PHASE0_SIGNOFF.md) — phase checklist, open decisions and next non-code activities.

## Locked core

- Product identity: **Workspace Syahmi** (customizable display label; general-facing brand may be **Workspace.**)
- Target: developers, freelancers, students
- Visual direction: Tavola-inspired Midnight Navy / selective glassmorphism / elegant GSAP motion
- MVP: Overview + Projects + Tasks + Calendar + Academics + Goals + basic Insights + Settings/Backup
- Local-first browser data, no mandatory accounts and no centralized user database
- Responsive PWA with reliable offline behavior after caching, manual export/import backup
- Not a clone of Tavola; original UI and product flows

## Definition of Phase 0 complete

Documents are prepared; founder approval and decisions listed in `05_PHASE0_SIGNOFF.md` are still pending. **Do not start implementation from this package without reviewing its P0 trade-offs and Phase 1 screen designs.**



\newpage

# WORKSPACE SYAHMI
## Product Requirements Document (PRD) — Version 1.0

**Document status:** Phase 0 draft, pending product sign-off  
**Date:** 20 October 2026  
**Product type:** Privacy-first local-first productivity web application  
**Delivery scope:** Frontend-only MVP; no implementation code in this package  
**Design identity:** Tavola-inspired midnight navy, original layered glass surfaces, elegant GSAP motion

---

## 1. Executive summary

Workspace Syahmi is a personal command center for developers, freelancers and students who need to manage software projects, tasks, academic work, schedules, goals and personal productivity in one coherent interface. The product is designed around **clarity of next action**, not maximizing the number of dashboard widgets. It is a browser-first, responsive PWA whose user-created data remains on their device by default. A public static website may distribute the app, but does not require accounts or a centralized user database.

The application brand may be **Workspace.** for general users, while **Workspace Syahmi** is the initial personal workspace name. Each user can change the displayed workspace name and avatar independently.

### 1.1 Product problem

Users with multiple simultaneous projects and deadlines often lose track of active commitments, struggle to decide what to prioritize, duplicate the same task in multiple tools and cannot easily evaluate monthly or annual progress. Student-developers face an especially fragmented workflow across client work, personal development, assignments, exams and goals.

### 1.2 Product promise

> Open the workspace; understand what matters today; take a concrete next action; confidently see what has changed.

### 1.3 Primary jobs to be done

1. **As a developer**, I want to track projects, links, progress and the immediate next task so that I can resume work quickly.
2. **As a student**, I want academic deadlines and assignments to appear beside my other responsibilities so that I do not miss submissions.
3. **As a freelancer**, I want to distinguish active, blocked and completed projects without needing a full client CRM.
4. **As a personal user**, I want to plan daily priorities and progress toward goals without sending private records to a third party.

## 2. Locked decisions and assumptions

### 2.1 Locked for MVP

- **Six core modules:** Projects, Tasks, Calendar, Academics, Goals and basic Insights.
- **Supporting modules:** Overview/Home, workspace Settings and Backup/Restore.
- **Visual identity:** original Tavola-inspired midnight navy; layered translucent surfaces used selectively; premium, calm typography; GSAP micro-interactions.
- **App architecture:** frontend-only and local-first; IndexedDB is the primary persistent datastore (technology choice is a planning recommendation pending engineering validation).
- **No required sign-up, cloud database or user analytics.**
- **Responsive desktop and mobile:** mobile is deliberately designed, not simply shrunk desktop.
- **Single shared task engine** across projects, assignments, goals and standalone tasks.
- **Calendar is a unified view** of records and due dates, not a second task database.

### 2.2 Assumptions to validate during Phase 1

- React, TypeScript, Vite, GSAP and Dexie/IndexedDB form the likely stack; final dependency selection is part of technical design, not a product promise.
- English-first interface with labels written for broad accessibility; bilingual copy may be added after MVP if testing warrants it.
- Workspace is single-person per browser profile, with no multi-user login or server isolation.
- Project progress is derived from tasks/milestones with explicit handling for projects that do not yet contain tasks; users must not be shown misleading completion numbers.
- Dedicated Notes and Freelance Revenue modules are excluded from the MVP, but project notes and optional client name may be captured as fields.

## 3. Success criteria

**Qualitative MVP outcome:** A new user can create a project and an academic assignment, see their deadlines, organize next actions, and export a recoverable copy of their data without any account.

**Functional launch KPIs (product acceptance, not invasive telemetry):**

- New project can be created and saved locally without a connection after the app shell has loaded.
- A task linked to a project or assignment appears in all relevant views without duplicates.
- Calendar date changes reflect edited deadlines consistently.
- Project statuses and annual counts update after a project is completed.
- Users can export a backup and restore it on the same or another browser profile.
- Mobile users can complete all essential workflows without hover or keyboard.
- No personal data is silently transmitted to a developer-controlled analytics or database service.

**Post-beta research signals** are collected through voluntary feedback rather than automatic user tracking: onboarding clarity, time to understand Today's Focus, perceived usefulness of project URL previews and confidence in local backup.

## 4. Personas and scenarios

| Persona | Primary context | Critical scenario | Success moment |
|---|---|---|---|
| Solo developer | Multiple active builds | Resume project and manage blockers | Knows exact next action |
| Student developer | Subjects, exams, assignments | Track submission due dates | Sees deadline in Today and Calendar |
| Freelancer | Several deliverables | Review status across projects | Knows what's late and what is blocked |
| General productivity user | Everyday tasks and goals | Plan limited daily priorities | Finishes the three important outcomes |

## 5. Core experience and operating principles

1. **Action-oriented Overview:** show Today’s Focus, upcoming due items, active projects, and useful progress only.
2. **Low cognitive load:** progressive disclosure; detailed forms and secondary metadata remain in drawers/pages, not every card.
3. **Trusted counts:** every metric has an explicit denominator, date window and source.
4. **Graceful degradation:** a project remains useful if its website cannot be embedded or auto-previewed.
5. **Privacy by design:** avoid third-party requests for user content unless initiated and disclosed.
6. **Motion as feedback:** animation clarifies state transition; it does not delay task completion.
7. **No feature dead ends:** each dashboard number or alert leads to its underlying records.

## 6. Functional requirements (PRD)

### 6.1 Overview / Home

**OVR-01** Display user-selected workspace name, optional avatar and a short date-aware greeting.  
**OVR-02** Today's Focus: select up to three primary tasks; complete/unpin them from Home.  
**OVR-03** Show due today, overdue and next seven days with direct navigation to each record.  
**OVR-04** Show counts for active projects, completed projects this year, open tasks and approaching assignments.  
**OVR-05** Quick Add: create task, project, assignment or event in at most one modal/drawer sequence.  
**OVR-06** Recent or pinned projects with immediate next action.  
**OVR-07** All empty states suggest a relevant first action rather than showing mock data as real data.

**Acceptance criteria:** completing a Focus task updates associated project/task views immediately; overview counts match filtered source records; first-time view clearly identifies demo/sample data if optional demo data is loaded.

### 6.2 Projects

**PRJ-01** Create/edit/archive/delete project with confirmation on destructive actions.  
**PRJ-02** Supported primary status: Not Started, In Progress, On Hold, Completed, Archived (Archived can be modeled separately if preferable).  
**PRJ-03** Support project title, description, category, priority, dates, optional client label, stack/tags, repository URL, live URL, notes, manual image.  
**PRJ-04** Provide list/grid/Kanban views with sorting and filters by status, priority, tag and due date.  
**PRJ-05** Detail page shows overview, milestones, linked tasks, progress, links and current next action.  
**PRJ-06** Create a project card image by user upload/paste; favicon may be used as fallback. Never guarantee automatic third-party screenshot capture in V1.  
**PRJ-07** URL validation must accept HTTPS/HTTP URLs sensibly and expose an open-in-new-tab action; embedding is optional only when origin permits it.  
**PRJ-08** Derive health separately from status: On Track, At Risk, Blocked, Overdue (based on actual deadline, unresolved blocker and progress conditions; no black-box AI).  
**PRJ-09** Completion records a completion date (editable, with confirmation) for yearly insights.  
**PRJ-10** Project data can be duplicated or archived without losing completed-work history.

**Acceptance criteria:** add/save/reopen/edit project offline; manual preview survives refresh; failing preview never blocks project saving; project completion affects Insights for the correct calendar year; On Hold does not mean Completed.

### 6.3 Unified Tasks

**TSK-01** One task record type with optional `project`, `assignment`, `goal`, or no parent linkage; each task has a single canonical identity.  
**TSK-02** Task fields: title, notes, status, priority, due date/time, optional start date, estimated effort, tags, parent context and created/completed timestamps.  
**TSK-03** Statuses: To Do, In Progress, Done; `Blocked` is a separate task flag/reason rather than conflating it with Done.  
**TSK-04** Views: All, Today, Upcoming, Overdue, Completed, plus list/Kanban modes.  
**TSK-05** Drag-and-drop on suitable screens plus accessible status controls that work with touch/keyboard.  
**TSK-06** Quick search and filters by parent, priority, status and deadline.  
**TSK-07** Deletion/removal from a parent must communicate whether it will delete the underlying task or only unlink it.  
**TSK-08** Today's Focus chooses up to three incomplete tasks and handles task completion/unlink automatically.

**Acceptance criteria:** when a task changes status anywhere, Home, project, academic assignment, goal and task views display consistent state; a task is not counted twice merely because multiple views reference it.

### 6.4 Calendar

**CAL-01** Month and week views on desktop; usable agenda/day view on mobile.  
**CAL-02** Display events, task deadlines, assignment deadlines and project milestones in one read-only timeline projection plus dedicated editable event records.  
**CAL-03** Distinguish types by label/icon and accessible color, not color alone.  
**CAL-04** Clicking an item opens its source record with the appropriate edit permissions.  
**CAL-05** Add/edit/delete standalone events with title, date, start/end time and optional description/location.  
**CAL-06** Date and time are displayed in the device-selected/user-chosen timezone; all-day due dates must not unexpectedly shift when travelling.  
**CAL-07** Date navigation, today shortcut, filters and event detail must work without connectivity.  
**CAL-08** If an assignment deadline is edited in Academics, the same projected item moves on the calendar without a second calendar record.

**Acceptance criteria:** no duplicate task deadline events; date-only and timed events stay distinct; editing source updates all views and respects timezone policy.

### 6.5 Academics

**ACD-01** Create/edit semester/term with name, optional start/end dates and status.  
**ACD-02** Create subjects/courses within a semester, with code, lecturer optional and color/icon.  
**ACD-03** Create assignments linked to subject with title, description, due date/time, weight optional, submission URL optional, status and checklist via linked tasks.  
**ACD-04** Assignment statuses: Not Started, In Progress, Submitted, Graded; Late is a computed condition, not necessarily a saved status.  
**ACD-05** Allow recording obtained mark and maximum/weight only when relevant, with clear units; no automatic GPA promise in V1.  
**ACD-06** Support timetable events manually through Calendar with subject association.  
**ACD-07** Show subject-level and semester-level workload, due assignments and submission state.  
**ACD-08** Completion/Submitted must not accidentally imply graded.

**Acceptance criteria:** assignment appears once in Calendar; changing assignment status does not auto-complete associated subtasks without explicit action; late is computed from current date and non-submitted state.

### 6.6 Goals

**GOL-01** Create/edit/archive goals with title, category, target date, personal rationale and status.  
**GOL-02** Statuses: Planned, Active, Achieved, Paused.  
**GOL-03** Goals contain measurable milestones/checklist; optionally link existing unified tasks.  
**GOL-04** Progress is based on completed milestones if milestones exist; otherwise show an explicit undetermined/manual state rather than fabricated percentage.  
**GOL-05** Show goal deadlines and upcoming milestones in Overview/Calendar when a date is present.  
**GOL-06** Allow monthly/yearly goal grouping and lightweight notes/reflection.

**Acceptance criteria:** milestone progress updates goal views; tasks linked to goals are not duplicated; Achieved does not silently rewrite milestone history.

### 6.7 Basic Insights

**INS-01** Show total projects (all-time, non-archived or clearly labeled), active projects now, projects created in chosen year and projects completed in chosen year as **different metrics**.  
**INS-02** Monthly projects completed based on completion date in the selected year.  
**INS-03** Tasks completed this week/month, overdue open tasks and assignment submitted counts.  
**INS-04** All charts expose underlying numeric labels and an empty/no-data state.  
**INS-05** Date filters cover current year, previous years with records, and all-time when applicable.  
**INS-06** No misleading productivity or performance score based solely on raw task count.  
**INS-07** Insights are calculated client-side; they are not uploaded for product analytics.

**Acceptance criteria:** a project completed December 2025 is counted under 2025 even if viewed in 2026; archived completed projects remain in historical completion stats unless explicitly filtered; charts update after record edits.

### 6.8 Settings, personalization and backup

**SET-01** Workspace name, avatar upload, theme/accent, 12/24-hour setting and week-start preference.  
**SET-02** Theme is accessible in light/dark conditions; midnight navy is the signature default.  
**SET-03** Motion preference honors OS reduced motion and offers a per-app override if sensible.  
**SET-04** Display privacy explanation: what is stored locally, what browser clearing does, and what external URLs may be requested.  
**SET-05** Export a full JSON backup with schema version, export date and relevant record collections; include user-uploaded images or document explicitly if excluded.  
**SET-06** Import validates schema, data types and duplicates before applying changes; preview what will change and support safer replace/merge policy.  
**SET-07** Clear/reset workspace only with explicit destructive confirmation.  
**SET-08** Inform users of backup needs, storage limits and data-loss risks; local browser storage is not equivalent to cloud backup.

**Acceptance criteria:** an exported file restores the workspace on a fresh browser; invalid/corrupted import does not partially overwrite current records; user can use the app without creating an account.

## 7. Core information/data model (conceptual, not code)

| Entity | Key relationships | Essential data |
|---|---|---|
| WorkspaceSettings | One per local workspace | Display name, avatar, theme, locale, timezone, version |
| Project | Has milestones and tasks | ID, title, status, created/started/completed/due dates, links, preview image |
| Task | Optional context links | ID, title, status, priority, due date, completed date, related entity reference |
| Milestone | Belongs to project OR goal | ID, parent, name, target date, completion status |
| Semester | Has subjects | ID, title, dates, status |
| Subject | Belongs to semester | ID, code/title, color |
| Assignment | Belongs to subject; may have tasks | ID, title, status, due date, submission URL, grades optional |
| CalendarEvent | Standalone event; may reference subject | ID, title, start/end, all-day flag, context |
| Goal | Has milestones and optional tasks | ID, title, category, target date, status |

**Single source of truth rules:**

- A task has exactly one durable ID; project/task/calendar screens are different views of the same task.
- An assignment's deadline is owned by Assignment; Calendar only projects it.
- Project/goal milestones own their own dates; Calendar displays projections, not clones.
- Status and health are distinct. A project can be `In Progress` and `At Risk` concurrently.
- A `completedAt` date is only set for actual completion; dates may be edited with history-safe recalculation.
- Referential integrity rules for deleting a project, assignment, semester or goal must be designed explicitly: preserve, unlink, cascade or warn.
- Storage schema version is mandatory to support future data migrations and backup compatibility.

## 8. Visual and interaction requirements

**Identity:** Midnight `#0A1222` inspired backdrop, lifted slate-navy surfaces, warm amber and muted mint accents, restrained rim lighting, polished typography. Design must be original; Tavola is an interaction and quality reference, not a pixel-perfect clone.

**Visual hierarchy:** Text readability and dense data controls take priority over blur. Ambient glow may sit behind non-interactive chrome, while task lists and tables should use stable opaque surfaces where needed.

**Motion specification baseline:**

- App entry/route transitions: restrained fades and vertical displacement, typically 180–320 ms as a design target.
- Active tab: asymmetrical trailing/leading edge motion only where it improves spatial feedback.
- Project card expand: coherent continuity from card to detail view; avoid jump cuts.
- Task reorder: physical rearrangement animation plus instant state commit.
- Chart transitions: update values smoothly with preserved readability.
- No decorative perpetual motion, excessive parallax or blocking entrances.
- Reduced-motion mode suppresses spatial travel and nonessential transitions.

**Accessibility:** keyboard focus indicators, meaningful labels, contrast-conscious surfaces, semantic status text, touch targets approximately 44 x 44 CSS px, screen-reader announcements for important updates and no animation-dependent interactions.

**Responsive rules:** desktop uses sidebar plus workspace content; tablet collapsible rail/drawer; mobile prioritizes Today, Projects, Tasks, Calendar and a More area. All six MVP modules remain navigable. Mobile calendar defaults to agenda; tables convert to readable cards or accessible scroll rather than becoming unreadable.

## 9. Privacy, security and resilience

- **Local-first does not equal device encryption.** IndexedDB can be visible to anyone with access to the same browser profile/device; no claim of end-to-end encryption is made.
- No required accounts, cookies for cross-site tracking, developer-hosted user database or behavioral analytics SDK.
- Public hosting still sees normal website network requests; external project sites and third-party media may see requests if user opens/loads them.
- Prefer locally uploaded project thumbnails. Never claim an arbitrary URL can reliably generate a screenshot from the browser.
- If an embedded page blocks iframe loading due to its security policy, show an explicit fallback/open link.
- Browser storage may be cleared/evicted; backup export is essential, especially before device migration or browser cleanup.
- Imported files must be treated as untrusted user data and validated/sanitized; rich HTML should not be executed.
- Offline means CRUD on locally available data once the PWA shell/assets have been cached; first-ever load still needs internet unless assets are preinstalled.
- Third-party integrations are opt-in future work, not hidden MVP dependencies.

## 10. Nonfunctional requirements

| ID | Category | Requirement |
|---|---|---|
| NFR-01 | Offline | Previously installed/cached shell and local CRUD continue when offline |
| NFR-02 | Reliability | Persistent data survives reload/navigation in same browser under normal conditions |
| NFR-03 | Recovery | Safe import validation; damaged file cannot corrupt an existing workspace |
| NFR-04 | Responsive | Key tasks usable at 320px–large desktop without unintended horizontal overflow |
| NFR-05 | Accessible | Aim for WCAG 2.2 AA for core interactions and readable contrast |
| NFR-06 | Motion | Reduced-motion option, no essential information conveyed by animation alone |
| NFR-07 | Performance | Smooth interactions under representative mobile/desktop test devices; avoid costly blanket backdrop blur |
| NFR-08 | Scalability | Remain usable with hundreds of projects and several thousand tasks; validate through synthetic test fixtures |
| NFR-09 | Integrity | Deterministic calculations for status, dates, progress and insights |
| NFR-10 | Security | Validate external links, user content and imported backups; no unsafe HTML injection |
| NFR-11 | Portability | Export/import across supported modern browsers, with documented limitations |
| NFR-12 | Testability | Critical workflows have explicit acceptance criteria and repeatable test data |

## 11. Explicitly out of scope for V1

- Authentication, profiles on a shared server, real-time multi-user collaboration.
- Automatic multi-device sync or promise of no data loss.
- AI planning agent, AI trading, AI assignment writer or automated task planning.
- Screenshot-capture backend or scraping arbitrary third-party website metadata.
- Two-way Google Calendar sync, Gmail ingestion, live GitHub activity integration.
- Full freelancer CRM, quotations, invoices, cashflow and payment tracking.
- Full note-taking knowledge base, rich document editor or file collaboration.
- Automated GPA calculation, institution-specific LMS integration.
- Push reminders that must trigger when the app is closed/offline across all platforms.

## 12. Dependencies, risks, mitigations

| Risk | User impact | MVP mitigation |
|---|---|---|
| Browser data cleared | Loss of records | Mandatory backup education, clear export path |
| External URL preview blocked | Empty project visual | Upload/paste image fallback and favicon/open link |
| Overstuffed homepage | Loss of focus | Three primary priorities; only actionable widgets |
| Too much glass/blur | Contrast/performance issues | Selective translucency and strong text surfaces |
| Cross-module duplicate records | Conflicting due dates | Single task entity and source-owned deadlines |
| Date/time handling | Wrong due-date display | Explicit timezone and date-only semantics |
| Scope creep | Late launch | P0 core flows; P1 only after P0 stable |
| Backup import conflicts | Data overwritten | Validate, preview and confirm import strategy |

## 13. Release acceptance / definition of done

- All P0 items in feature inventory pass acceptance tests.
- Minimum flows UF-01 through UF-09 in the user-flow document are usable on desktop and mobile.
- No critical data-loss bugs after repeated reload, offline edit, export/import, and common browser storage transitions.
- Project/assignment/task/goal relationships remain consistent and calendar shows source-owned dates once.
- Interface passes key keyboard, touch, empty-state, error-state and reduced-motion review.
- Insights calculations verified with known fixtures crossing month/year boundaries.
- Privacy explanation is honest; network requests and dependencies have been reviewed.
- Beta test with invited classmates occurs without uploading or collecting their private workspace contents.

## 14. Reference boundaries and evidence

This PRD captures **proposed Workspace product requirements** based on the prior brainstorm and a user-provided Tavola technical blueprint. The Tavola-inspired palette/motion is a **design choice**, not a claim that Workspace must reproduce another product's source, code, layouts or assets. Implementation performance and browser behavior must be validated during subsequent design/engineering phases.

Public technical references used for constraint awareness:
- GSAP responsive and reduced-motion guidance: https://gsap.com/docs/v3/GSAP/gsap.matchMedia%28%29/
- MDN CSP `frame-ancestors` (embedding limitations): https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/frame-ancestors
- MDN Storage quotas and eviction criteria: https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria

**End of PRD v1.0 draft.**



\newpage

# Workspace Syahmi — Sitemap & Information Architecture v1.0

**Status:** Phase 0 proposed navigation, pending UX wireframe validation.  
**Navigation principle:** Modules reflect user mental models; task, dates and project status remain shared records.

## A. Desktop sitemap (canonical routes)

```text
/
├── /welcome                         First-run local onboarding
├── /overview                        Personal Command Center (default after onboarding)
│   ├── today's focus                Embedded section; not separate page
│   ├── urgent / upcoming            Filtered records
│   └── pinned projects              Deep links to project details
├── /projects
│   ├── /projects                     All / Active / Completed / Archived + grid/list/board
│   ├── /projects/new                 Create project (modal/drawer route optional)
│   └── /projects/:projectId          Project detail
│       ├── overview                 Summary, image, links, next action
│       ├── tasks                    Canonical task records filtered to project
│       ├── milestones               Project milestones
│       └── activity                 Optional lightweight local edit history (P1)
├── /tasks
│   ├── /tasks                        All, Today, Upcoming, Overdue, Done
│   ├── /tasks/board                  Kanban (may be view state, not literal route)
│   └── /tasks/:taskId                Task details (drawer/deep link)
├── /calendar
│   ├── /calendar                     Month, week and agenda views
│   └── /calendar/events/:eventId     Editable standalone event
├── /academics
│   ├── /academics                    Semester summary / upcoming deadlines
│   ├── /academics/semesters          All semesters
│   ├── /academics/semesters/:id      Semester detail, course list
│   ├── /academics/subjects/:id       Subject detail, assignments
│   └── /academics/assignments/:id    Assignment detail, tasks, submission
├── /goals
│   ├── /goals                        Active / Planned / Achieved / Paused
│   └── /goals/:goalId                Goal detail + milestones / linked tasks
├── /insights
│   └── /insights                     Project/year, tasks/month, academics summary
├── /settings
│   ├── /settings/profile             Workspace name / avatar
│   ├── /settings/appearance          Theme, accent, motion
│   ├── /settings/preferences         Timezone, date formats, week start
│   ├── /settings/data                Export, import, reset, storage information
│   └── /settings/privacy             Local-first explanation / external links
└── Global overlays
    ├── Quick Add (project, task, assignment, event, goal)
    ├── Search / command palette
    ├── Confirm destructive action
    ├── Backup import preview
    └── Toast/undo feedback
```

Routes above define intent and hierarchy. A designer/engineer may implement detail views as sheets/drawers while preserving deep-link URLs, predictable back-navigation and usable mobile behavior.

## B. Desktop navigation architecture

**Sidebar main group:** Overview · Projects · Tasks · Calendar  
**Sidebar growth group:** Academics · Goals · Insights  
**Footer:** Settings & Backup, optional profile/avatar  
**Topbar:** Workspace label, Quick Add, Search / Command, selected date / context  
**Secondary panes:** Contextual task detail, project summary or upcoming deadlines; never mandatory to finish the workflow.

**Global information hierarchy**

1. **Next action:** What's important now?
2. **Work context:** Where does this task belong?
3. **Time constraint:** When does it need to be done?
4. **Progress:** What has changed?
5. **History:** What has been completed in the chosen period?

## C. Mobile navigation architecture

**Bottom bar (max five slots):** Today · Projects · Tasks · Calendar · More  
**More sheet/page:** Academics · Goals · Insights · Settings / Backup  
**Sticky or accessible primary FAB:** Quick Add (context-sensitive choices)  
**Calendar default:** Agenda; week/month via switch, with legible event chips  
**Projects default:** Cards; Kanban uses deliberate horizontal swipe or stacked status groups  
**Task detail:** Full-screen sheet, not narrow desktop-style side pane  
**Mobile profile:** Located at More / Settings, not consuming persistent bottom slots.

**No page is hidden or disabled on mobile.** All create/edit/complete/export/import actions must work without desktop hover.

## D. Object-navigation matrix

| Object selected | Opens | Related views that also reflect record |
|---|---|---|
| Project card | Project detail | Overview, Insights, Calendar milestones |
| Task row | Task details | Overview Focus, parent project/assignment/goal, Calendar due date |
| Calendar task chip | Task details | Tasks, parent context |
| Calendar assignment chip | Assignment detail | Academics, Overview deadlines |
| Calendar event chip | Event editor | Calendar only, optional subject association |
| Subject | Subject details | Semester, assignment creation |
| Goal | Goal details | Overview/Insights light summary, Calendar milestones |
| Metric/chart datum | Filtered source list | Originating module with retained filters |

## E. UX edge cases affecting IA

- When a parent project is archived, linked tasks remain accessible and are filtered appropriately.
- If an assignment deadline is removed, its Calendar projection disappears without deleting the assignment.
- If a user follows a deep link to a missing local record on a different device, show a clear "not found on this device" state and a route back to a useful screen; there is no cloud record to retrieve.
- Browser refresh retains active route and restores correct record details if local data exists.
- Search suggestions indicate object type (Project, Task, Subject, Assignment, Goal, Event).
- Every detail page presents an explicit breadcrumb/back action; screen-reader users have a coherent landmark structure.

## F. Sitemap acceptance checks

- Every core module accessible within two taps/clicks from default navigation.
- From a Task due-date chip, user can open the original task in at most one action.
- From a Project detail, user can create a child task and return without losing scroll/filter context.
- Settings Backup is discoverable on both mobile and desktop.
- Navigation names remain stable across devices (e.g., Today maps to Overview, not a separate duplicated data module).



\newpage

# Workspace Syahmi — Feature Inventory & Prioritization v1.0

**Prioritization**  
- **P0:** required to ship a useful, safe MVP.  
- **P1:** desirable polish or secondary workflow after P0 is stable; may ship with MVP if capacity permits.  
- **P2:** subsequent version; explicitly excluded from initial shipping commitment.

| ID | Module | Feature | Priority | Outcome / acceptance signal |
|---|---|---|---|---|
| F-001 | Onboarding | Local privacy intro / no account | P0 | User understands data is device-local |
| F-002 | Onboarding | Workspace name / optional avatar | P0 | Personalization persists after reload |
| F-003 | Overview | Today's Focus (max 3) | P0 | Focus task state stays in sync |
| F-004 | Overview | Due today / upcoming / overdue | P0 | Each item opens source record |
| F-005 | Overview | Active projects / tasks / assignments summary | P0 | Counts reflect canonical records |
| F-006 | Overview | Quick Add | P0 | User can create core items from any page |
| F-007 | Overview | Pinned project shortcuts | P1 | User resumes top projects quickly |
| F-008 | Overview | Drag-and-drop widget layout | P2 | Optional dashboard customization |
| F-009 | Projects | Create/edit/delete/archive | P0 | All operations persist locally |
| F-010 | Projects | Not Started/In Progress/On Hold/Completed | P0 | Status and health separate |
| F-011 | Projects | Due date / priority / tech stack / links | P0 | Fields validated and revisitable |
| F-012 | Projects | Project details + next action | P0 | Tasks reachable from detail |
| F-013 | Projects | Image upload or paste fallback | P0 | Preview persists even if URL blocked |
| F-014 | Projects | Live URL and repository link | P0 | External links validated/open safely |
| F-015 | Projects | Grid and list views | P0 | Usable desktop/mobile |
| F-016 | Projects | Status Kanban and drag-drop | P1 | Touch/keyboard alternative exists |
| F-017 | Projects | Health (At Risk/Blocked/Overdue) | P1 | Deterministic rules documented |
| F-018 | Projects | Milestones | P0 | Create/complete milestone and date projection |
| F-019 | Projects | Project completion date | P0 | Insights count correct year |
| F-020 | Projects | Auto URL screenshot / metadata service | P2 | Only with explicit outside-service architecture |
| F-021 | Tasks | Canonical task CRUD | P0 | Same task across all contexts |
| F-022 | Tasks | Status/priority/due date | P0 | Edits update views consistently |
| F-023 | Tasks | Link to project/assignment/goal | P0 | No duplicate task records |
| F-024 | Tasks | Today/Upcoming/Overdue/Done filters | P0 | Time semantics consistent |
| F-025 | Tasks | Search/filter/sort | P0 | Multiple filters can combine |
| F-026 | Tasks | Kanban board | P1 | Drag or accessible status change |
| F-027 | Tasks | Blocked flag/reason | P1 | Distinct from completion status |
| F-028 | Tasks | Recurring tasks | P2 | Not in first task engine |
| F-029 | Calendar | Month and week views | P0 | Items positioned correctly |
| F-030 | Calendar | Mobile agenda view | P0 | Legible and tappable at 320px |
| F-031 | Calendar | Unified task/assignment/milestone projection | P0 | No duplicate events |
| F-032 | Calendar | Standalone event CRUD | P0 | Can add/edit/delete event |
| F-033 | Calendar | Source record drilldown | P0 | Opens task/assignment/milestone correctly |
| F-034 | Calendar | Filters by record type | P1 | Can isolate school vs projects |
| F-035 | Calendar | Drag-to-reschedule | P2 | Only after direct editing reliable |
| F-036 | Academics | Semesters CRUD | P0 | Subject association preserved |
| F-037 | Academics | Subjects CRUD | P0 | Add course and view assignments |
| F-038 | Academics | Assignment CRUD and status | P0 | Not Started/In Progress/Submitted/Graded |
| F-039 | Academics | Due dates + submission links | P0 | Calendar and overview show deadlines |
| F-040 | Academics | Assignment subtasks | P0 | Uses unified task engine |
| F-041 | Academics | Optional marks field | P1 | Clear mark units; no fabricated GPA |
| F-042 | Academics | Recurring timetable events | P2 | Future calendar enhancement |
| F-043 | Goals | Goals CRUD and target dates | P0 | Planned/Active/Achieved/Paused |
| F-044 | Goals | Milestones and progress | P0 | Progress based on actual milestones |
| F-045 | Goals | Link existing tasks | P0 | Goal can reference canonical tasks |
| F-046 | Goals | Journal/reflection | P1 | Lightweight narrative without full Notes app |
| F-047 | Goals | Habit/streak engine | P2 | Needs separate habit semantics |
| F-048 | Insights | All-time and annual project KPIs | P0 | Created vs completed differentiated |
| F-049 | Insights | Monthly completed project chart | P0 | Based on completion date |
| F-050 | Insights | Tasks completed vs overdue | P0 | Derived from canonical tasks |
| F-051 | Insights | Assignment submitted summary | P0 | Submitted/Graded counted correctly |
| F-052 | Insights | Deep time analytics / forecasting | P2 | Requires reliable time tracking |
| F-053 | Global | Search across core records | P1 | Search indicates result type |
| F-054 | Global | Command palette Ctrl/Cmd+K | P1 | Keyboard-first actions accessible |
| F-055 | Global | Undo for reversible operations | P1 | Safe cancel/revert feedback |
| F-056 | Design | Midnight / glass identity | P0 | Consistent design tokens, readable surfaces |
| F-057 | Design | Responsive desktop/mobile | P0 | Primary flows usable without hover |
| F-058 | Design | GSAP motion / reduced-motion | P0 | Feedback never blocks use |
| F-059 | Settings | Theme and workspace settings | P0 | Changes persist locally |
| F-060 | Settings | JSON export / import | P0 | Fresh profile restore successful |
| F-061 | Settings | Confirmed reset/delete | P0 | Destructive operations require confirmation |
| F-062 | Settings | Browser-storage disclosure | P0 | Clear limitations and backups |
| F-063 | Platform | Offline PWA app shell | P0 | Cached app and CRUD function offline |
| F-064 | Platform | Schema version and migration strategy | P0 | Existing user data survives app upgrades |
| F-065 | Platform | Optional GitHub/Calendar API integrations | P2 | Explicit permissions/consent needed |
| F-066 | Platform | Account-based cross-device sync | P2 | Separate privacy and security design required |
| F-067 | Freelance | Client CRM, invoice and revenue | P2 | Separate financial data module |
| F-068 | Notes | Full knowledge-base editor | P2 | Beyond quick notes in records |

## MVP delivery gates

### Gate A — Useful core
All P0 Projects, Tasks and Overview features work on locally stored data.

### Gate B — Unified schedule
All P0 Academics and Calendar features work with no duplicate records and correct date handling.

### Gate C — Growth and visibility
Goals and basic Insights calculate reliably from canonical data.

### Gate D — Trusted beta
Settings, backup, responsive UX, privacy disclosure, offline support and reduced motion pass acceptance testing.

**Policy:** Any P1 item may be deferred without blocking MVP release. A P0 item may only be removed after an explicit change to the product baseline.



\newpage

# Workspace Syahmi — Detailed User Flows v1.0

**Format:** Trigger → main path → alternative/error path → state change → acceptance criterion.  
**Scope:** MVP user behavior, not screen mockups or implementation code.

## UF-01 — First visit and privacy-aware setup

**Trigger:** User opens Workspace on a new browser profile.

1. App displays welcome page with concise statement: data is saved on this device/browser, without account registration.
2. User chooses workspace display name (default may be "My Workspace") and optionally uploads avatar.
3. User can choose default dark theme, time/date preferences or skip those optional steps.
4. App explains export backup and that clearing site data may remove workspace records.
5. User selects **Enter workspace**; empty Overview guides them to Quick Add.

**Alternatives:** Skip avatar; grant no unnecessary permission; installation as PWA is optional. If persistent storage cannot initialize, show an error and avoid pretending changes are saved.

**Data effect:** Settings record created; no remote account or server profile.

**Acceptance:** All setup data remains after reload and no account/login is requested.

## UF-02 — Create developer project with a website preview

**Trigger:** User selects Quick Add → Project.

1. Enter project title (required), category/status/priority (optional defaults), target date (optional).
2. Paste Live URL and/or repository link; input provides URL validation feedback.
3. App shows safe label/favicon or URL indicator when technically available; it does **not** promise automatic screenshot.
4. User optionally uploads or pastes a screenshot image; crop/fit can be adjusted in later design.
5. User saves project and lands on Project Detail.
6. User adds first milestone or next task; project now appears in Overview and Projects.

**Alternatives:** Network unavailable; link has restrictive iframe/CORS policy; favicon fails; screenshot too large; URL invalid. In each case, user can remove URL or use a locally stored image and still save the project. The UI must not silently send private URLs to external screenshot services.

**Data effect:** One Project record, optional image blob and related Task/Milestone records.

**Acceptance:** Preview remains after browser reload/offline; opening the external URL is explicit; URL-preview failure does not block saving.

## UF-03 — Resume work and move task across statuses

**Trigger:** User opens Overview and sees an active project with next action.

1. Select project and open its Tasks tab (or select Today’s Focus linked task).
2. Open Task detail and inspect parent project, priority and due date.
3. Change To Do → In Progress, optionally add note or blocker.
4. Finish and mark Done from project detail, Tasks or Today’s Focus.
5. Overview, project progress, relevant deadline view and Insights reflect the same underlying task.

**Alternatives:** Project archived or task no longer exists → show clear available options. Offline edit must persist locally. Drag-and-drop is optional; status menu always works.

**Data effect:** Single canonical Task changes status and completed timestamp; no copied task.

**Acceptance:** Status is consistent in every view after reload.

## UF-04 — Complete a project and verify annual report

**Trigger:** User is ready to finish project deliverables.

1. Open Project Detail and review incomplete tasks/milestones.
2. Select Mark Completed; if open tasks remain, show confirmation with explicit consequences.
3. Save project status Completed and completion date (default today; editable).
4. Project moves out of Active filter and into Completed.
5. Insights “Completed this year” and selected-year monthly bar recalculate from completion date.

**Alternatives:** Project later reopened → completion timestamp cleared or explicitly retained in local activity history, per approved rule; counts must be recomputed deterministically.

**Data effect:** Project status/completion date update, no forced deletion of tasks.

**Acceptance:** Completing in one year and viewing another never inflates counts; archived completed projects retain completion history.

## UF-05 — Create semester, subject and assignment

**Trigger:** Student opens Academics for the first time.

1. Add semester, e.g. “Semester 4”.
2. Add subject with name/code; optionally set subject color.
3. Create assignment with title, due date/time, status and optional submission URL.
4. Add checklist steps using the same task engine.
5. Assignment appears under Subject, on Academics Overview, in relevant Upcoming items and as a source-linked deadline in Calendar.
6. When submitted, change assignment status to Submitted; later add grade if needed.

**Alternatives:** Subject without semester is disallowed or clearly placed in Unassigned pending design choice; assignment without deadline stays in subject but not calendar. Due date passes without submission → show Late indicator while preserving saved status.

**Data effect:** Semester → Subject → Assignment hierarchy plus linked Task IDs.

**Acceptance:** Assignment is not marked Graded merely on submission, and changing its deadline moves the single calendar projection.

## UF-06 — Plan week in Calendar, edit the source record

**Trigger:** User opens Calendar to plan deadlines.

1. Calendar loads month/week or mobile agenda with tasks, assignments, milestones and standalone events.
2. User applies filter (e.g., Academics) or navigates next week.
3. Tap an assignment deadline; app opens Assignment Detail (not a duplicate calendar event editor).
4. User changes assignment due date; returns to Calendar.
5. Calendar item relocates to the new date and is still linked to the same source.
6. User adds a standalone study session event directly within Calendar.

**Alternatives:** All-day date fields use stable local date semantics; timed event handles timezone and end-before-start validation. If no results, show empty state, not misleading demo entries.

**Data effect:** Existing Assignment edited; one new CalendarEvent created.

**Acceptance:** Calendar and academic due date agree after reload; no cloned due-date entries.

## UF-07 — Create and monitor a personal goal

**Trigger:** User selects Goals → New Goal.

1. Enter goal title, reason, category, target date and status (Planned/Active).
2. Add 3 milestones with target dates; optionally attach existing tasks.
3. Goal detail displays progress based on completed milestones (e.g., 1 of 3).
4. Relevant milestone appears on Calendar if dated.
5. User marks milestone completed; progress recalculates.
6. User may mark goal Achieved independently, but UI should make any incomplete milestones visible.

**Alternatives:** Goal without milestones displays “No measurable progress yet”, not arbitrary 0% pretending precision. Removing a linked task asks to unlink vs delete where appropriate.

**Data effect:** Goal and Milestone records, references to existing Task IDs.

**Acceptance:** Task linkage does not create duplicates; progress source is obvious.

## UF-08 — Daily focus and end-of-day review

**Trigger:** User opens Overview each day.

1. See Today’s Focus, overdue items, upcoming deadlines and active projects.
2. Pin up to three incomplete tasks to Focus, from Tasks or a parent module.
3. Start important work; optionally mark a task In Progress.
4. Mark one or more tasks Done from the Focus list.
5. Widget updates count and task status immediately; completed task no longer occupies an active Focus slot.
6. At end of day, user reviews remaining priorities and chooses tomorrow’s focus manually.

**Alternatives:** No tasks → Quick Add CTA; more than three requested → explain limit and ask which task to replace; timezone date changes after midnight → Today selection shifts without erasing task records.

**Data effect:** Focus selection references canonical task IDs, Task records update status.

**Acceptance:** Focus count and task list remain consistent after restart; no duplicated tasks.

## UF-09 — Backup, restore and device/browser change

**Trigger:** User wants peace of mind or wants to switch device/browser.

1. Open Settings → Data & Backup.
2. Read what data is included, export date and warning that local storage is not a synchronized cloud backup.
3. Select Export Backup; browser downloads versioned JSON containing records, relations and supported local image data.
4. On a fresh browser, open Settings → Import Backup and select file.
5. App validates schema, record counts, links, sizes and uniqueness before changes.
6. Preview import scope and choose supported Restore/Replace method; confirm.
7. App atomically restores data or fully rolls back on failure, then verifies summary counts.

**Alternatives:** Malformed version / unsupported schema / duplicate IDs / insufficient storage → reject or provide clear choice without damaging existing workspace. User cancels → unchanged data. A merge strategy is only offered if reliably specified and tested.

**Data effect:** Full versioned dataset safely exported or restored.

**Acceptance:** Counts, tasks, project images, academic links and goal progress match source after round-trip export/import.

## UF-10 — Search across the workspace (P1)

**Trigger:** User invokes Search or Ctrl/Cmd+K.

1. Search panel opens over current context.
2. User types a partial project, task, subject, assignment or goal title.
3. Results group by entity type with labels and location context.
4. User selects result and navigates to detail; back navigation restores context.

**Alternatives:** No matches → clear no-result state; mobile invokes search through topbar or More, not keyboard-only.

**Data effect:** None except optional local recent selections.

**Acceptance:** Search reflects local records only and works offline.

## UF-11 — Offline use and storage recovery

**Trigger:** Connection drops after the app was loaded/cached.

1. Cached app continues rendering the workspace.
2. User edits task or creates assignment; app commits to local storage.
3. Offline/online indicator is informational; it never claims that data is syncing to cloud.
4. User refreshes while offline; previously cached shell loads and records remain available.

**Alternatives:** First visit without network and without installed/cached assets fails gracefully. Storage quota errors trigger user-facing guidance, not silent success; recommend export and release storage.

**Data effect:** Local records remain canonical; no sync queue assumed.

**Acceptance:** Offline create/edit/reload works in supported test environment; export remains accessible.

## UX acceptance test matrix

| Flow | Desktop | Mobile | Offline | Backup round trip | Priority |
|---|---|---|---|---|---|
| UF-01 First visit | Yes | Yes | First load requires assets | Settings included | P0 |
| UF-02 Project URL/preview | Yes | Yes | Manual image yes | Images restored | P0 |
| UF-03 Shared task update | Yes | Yes | Yes | State preserved | P0 |
| UF-04 Project completion | Yes | Yes | Yes | Date preserved | P0 |
| UF-05 Academic assignment | Yes | Yes | Yes | Relations preserved | P0 |
| UF-06 Unified calendar | Yes | Yes | Yes | Dates preserved | P0 |
| UF-07 Goal milestones | Yes | Yes | Yes | Milestones preserved | P0 |
| UF-08 Today Focus | Yes | Yes | Yes | Selection preserved | P0 |
| UF-09 Backup/restore | Yes | Yes | Export possible | Required | P0 |
| UF-10 Search | Yes | Yes | Yes | Not applicable | P1 |
| UF-11 Offline/storage | Yes | Yes | Main purpose | Recovery path | P0 |



\newpage

# Workspace Syahmi — Phase 0 Review & Sign-off Sheet

**Baseline:** Product PRD v1.0, Sitemap v1.0, Feature Inventory v1.0, User Flows v1.0.  
**Current state:** Draft complete, product decisions need formal acceptance before Phase 1 wireframes.

## A. Locked by founder direction

- [x] Product focus: one privacy-first workspace for developer/student productivity.
- [x] Design reference: Tavola-inspired, midnight navy layered glass, elegant GSAP; original identity.
- [x] MVP core modules: Projects, Tasks, Calendar, Academics, Goals, Basic Insights.
- [x] Support modules: Overview, Settings, Backup.
- [x] Responsive desktop/mobile.
- [x] No mandatory user account; data private/local by default.
- [x] Plan and specify before coding.

## B. Phase 0 deliverables prepared

- [x] Product problem, personas, outcomes, scope and PRD acceptance criteria.
- [x] Hierarchical desktop sitemap and mobile navigation strategy.
- [x] Feature list prioritized P0/P1/P2 with IDs.
- [x] Detailed core user flows, alternatives and state changes.
- [x] Conceptual record relationships and single-source-of-truth principles.
- [x] Privacy/backups/offline constraints and major risks.
- [ ] Owner signs off on exact V1 scope and baseline documentation.

## C. Nonblocking design decisions for Phase 1

These do not prevent creation of wireframes, but should be settled before technical implementation:

1. **Interface copy:** English only initially, or bilingual English/Bahasa Malaysia?
2. **Project card image:** uploaded images only, or opt-in external metadata thumbnail fallback?
3. **Task parent model:** one primary parent + optional secondary references, or true many-to-many links?
4. **Project progress:** task count, milestone count, weighted points or explicit per-project selection?
5. **Assignment grades:** MVP basic optional field (currently P1), or postpone entirely?
6. **Import semantics:** Replace-only safest initial policy; merge can become P1 after robust validation.
7. **Scope control:** Kanban drag-and-drop and global command palette remain P1 unless core flows finish early.

## D. Phase 1 — next recommended work (still no coding)

- [ ] Convert sitemap into desktop/tablet/mobile low-fidelity wireframes.
- [ ] Define complete screen inventory and component inventory.
- [ ] Specify design tokens: typography, spacing, elevations, gradients, interactive status colors.
- [ ] Specify GSAP animation catalogue with durations, easing, responsive/reduced-motion variants.
- [ ] Create UI content and interaction states: empty, loading, error, offline, destructive, success.
- [ ] Approve high-fidelity designs for Overview, Projects, Task detail, Calendar, Academics, Goals, Insights and Settings.
- [ ] Validate all 9 P0 flows in clickable prototype with at least two target personas.

## E. Phase 0 readiness definition

Phase 0 can be considered **approved** when the owner agrees with: product jobs, MVP modules, P0 scope, navigation hierarchy, main flows, local-first privacy tradeoffs and explicit exclusions. Sign-off is a decision, not automatically granted by a completed document.

**Recommendation:** Move next to Phase 1 information architecture + wireframes. Do not give an implementation agent a vague “build this dashboard” prompt before screen definitions and interaction contracts are approved.
