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
