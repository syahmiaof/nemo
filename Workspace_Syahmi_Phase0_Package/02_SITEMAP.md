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
