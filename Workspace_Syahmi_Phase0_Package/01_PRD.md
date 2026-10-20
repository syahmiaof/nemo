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
