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
