# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: academics_calendar_goals.spec.ts >> Academics, Calendar & Goals Functional Audit >> Calendar events and projected deadlines remain accurate
- Location: tests\e2e\academics_calendar_goals.spec.ts:56:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: 'New Task' })
    - locator resolved to <button class="inline-flex items-center justify-center font-bold rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring disabled:opacity-50 disabled:pointer-events-none select-none active:scale-[0.98] text-sm px-4 py-2 h-10 bg-gradient-to-br from-[#F5C8BC] to-[#EAA999] text-[#2E1813] dark:text-[#2E1813] shadow-[0_8px_22px_-10px_rgba(245,200,188,0.6)] hover:brightness-105 border border-white/20 gap-2 self-end sm:self-center">…</button>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div role="dialog" aria-modal="true" aria-label="Welcome to Nemo" class="fixed inset-0 z-[9999] flex flex-col items-center justify-center p-6 select-none cursor-pointer">…</div> intercepts pointer events
    - retrying click action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div role="dialog" aria-modal="true" aria-label="Welcome to Nemo" class="fixed inset-0 z-[9999] flex flex-col items-center justify-center p-6 select-none cursor-pointer">…</div> intercepts pointer events
    - retrying click action
      - waiting 100ms
    5 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div role="dialog" aria-modal="true" aria-label="Welcome to Nemo" class="fixed inset-0 z-[9999] flex flex-col items-center justify-center p-6 select-none cursor-pointer">…</div> intercepts pointer events
    - retrying click action
      - waiting 500ms
    43 × waiting for element to be visible, enabled and stable
       - element is visible, enabled and stable
       - scrolling into view if needed
       - done scrolling
       - <div class="modal-overlay" data-modal-overlay="true">…</div> intercepts pointer events
     - retrying click action
       - waiting 500ms
    - waiting for element to be visible, enabled and stable

```

# Page snapshot

```yaml
- generic [ref=f1e1]:
  - generic [ref=f1e3]:
    - link "Skip to content" [ref=f1e4] [cursor=pointer]:
      - /url: "#main-content"
    - complementary "Global Utility Rail" [ref=f1e5]:
      - button "Search workspace" [ref=f1e6] [cursor=pointer]:
        - generic: Search (Ctrl+K)
      - button "Quick Add" [ref=f1e10] [cursor=pointer]
      - button "Ask Nemo Assistant" [ref=f1e13] [cursor=pointer]:
        - generic: Ask Nemo
      - link "Today's Focus" [ref=f1e17] [cursor=pointer]:
        - /url: /overview#todays-focus
      - link "Settings" [ref=f1e21] [cursor=pointer]:
        - /url: /settings
    - generic [ref=f1e25]:
      - banner [ref=f1e26]:
        - link "Nemo overview" [ref=f1e27] [cursor=pointer]:
          - /url: /overview
          - generic [ref=f1e29]: nemo.
        - navigation "Main Navigation" [ref=f1e31]:
          - generic [ref=f1e32]:
            - link "Overview" [ref=f1e33] [cursor=pointer]:
              - /url: /overview
            - link "Projects" [ref=f1e34] [cursor=pointer]:
              - /url: /projects
            - link "Tasks" [ref=f1e35] [cursor=pointer]:
              - /url: /tasks
            - link "Calendar" [ref=f1e36] [cursor=pointer]:
              - /url: /calendar
            - link "Academics" [ref=f1e37] [cursor=pointer]:
              - /url: /academics
            - link "Goals" [ref=f1e38] [cursor=pointer]:
              - /url: /goals
            - link "Insights" [ref=f1e39] [cursor=pointer]:
              - /url: /insights
        - generic [ref=f1e40]:
          - button "Quick Add" [ref=f1e41] [cursor=pointer]
          - link "Profile and settings" [ref=f1e43] [cursor=pointer]:
            - /url: /settings
            - text: MW
      - generic [ref=f1e44]:
        - generic [ref=f1e45]: Personal workspace · Saved on this device
        - button "Explore demo" [ref=f1e49] [cursor=pointer]
      - main [ref=f1e52]:
        - generic [ref=f1e54]:
          - generic [ref=f1e55]:
            - heading "Tasks" [level=1] [ref=f1e56]
            - paragraph [ref=f1e57]: Small steps. Clear priorities.
          - generic [ref=f1e58]:
            - textbox "Search tasks by title, notes, or tags..." [ref=f1e64]
            - button "New Task" [ref=f1e65] [cursor=pointer]
          - generic [ref=f1e68]:
            - button "All Tasks 0" [pressed] [ref=f1e69] [cursor=pointer]:
              - generic [ref=f1e70]: All Tasks
              - generic [ref=f1e71]: "0"
            - button "Due Today 0" [ref=f1e72] [cursor=pointer]:
              - generic [ref=f1e73]: Due Today
              - generic [ref=f1e74]: "0"
            - button "Upcoming 0" [ref=f1e75] [cursor=pointer]:
              - generic [ref=f1e76]: Upcoming
              - generic [ref=f1e77]: "0"
            - button "Overdue 0" [ref=f1e78] [cursor=pointer]:
              - generic [ref=f1e79]: Overdue
              - generic [ref=f1e80]: "0"
            - button "Completed 0" [ref=f1e81] [cursor=pointer]:
              - generic [ref=f1e82]: Completed
              - generic [ref=f1e83]: "0"
          - generic [ref=f1e84]:
            - heading "No tasks in this view" [level=3] [ref=f1e89]
            - paragraph [ref=f1e90]: Add tasks to organize daily actions, link them to projects, or track academic assignments.
            - button "Add Task" [ref=f1e91] [cursor=pointer]
  - dialog "Dialog" [ref=f1e93]:
    - button "Close dialog" [ref=f1e95] [cursor=pointer]
    - generic [ref=f1e99]:
      - generic [ref=f1e100]:
        - img "Nemo" [ref=f1e102]
        - heading "Welcome to nemo." [level=2] [ref=f1e103]
        - paragraph [ref=f1e104]: Track it, finish it.
      - generic [ref=f1e105]:
        - paragraph [ref=f1e110]:
          - strong [ref=f1e111]: "100% Private & Browser-Local:"
          - text: Your workspace lives entirely inside this browser via IndexedDB. No accounts, no analytics, no external tracking.
        - paragraph [ref=f1e115]:
          - strong [ref=f1e116]: "No Automatic Cloud Sync:"
          - text: Your data never leaves this device without your action.
        - paragraph [ref=f1e122]:
          - strong [ref=f1e123]: "Portable Backups:"
          - text: Export your full database and images with a single click anytime in Settings to keep it safe or move between devices.
      - generic [ref=f1e125]:
        - generic [ref=f1e126]: Workspace / Display Name
        - textbox "Workspace / Display Name" [active] [ref=f1e127]:
          - /placeholder: e.g. Alex's Workspace
          - text: My Workspace
      - generic [ref=f1e128]:
        - button "Skip customization" [ref=f1e129] [cursor=pointer]
        - button "Start Workspace" [ref=f1e130] [cursor=pointer]
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | test.describe('Academics, Calendar & Goals Functional Audit', () => {
  4   |   test.beforeEach(async ({ page }) => {
  5   |     await page.goto('/');
  6   |     const skipBtn = page.getByRole('button', { name: 'Skip customization' });
  7   |     try {
  8   |       await skipBtn.waitFor({ state: 'visible', timeout: 3500 });
  9   |       await skipBtn.click();
  10  |       await skipBtn.waitFor({ state: 'hidden', timeout: 3500 });
  11  |     } catch {
  12  |       // already completed/dismissed
  13  |     }
  14  |   });
  15  | 
  16  |   test('Create semester, subject, assignment, add subtask and submit', async ({ page }) => {
  17  |     await page.goto('/academics');
  18  |     await page.waitForLoadState('networkidle');
  19  | 
  20  |     // 1. Create a semester
  21  |     await page.getByRole('button', { name: 'New Semester' }).click();
  22  |     await page.getByLabel('Semester Name').fill('Fall 2026 Term');
  23  |     await page.getByRole('dialog').getByRole('button', { name: 'Create Semester' }).click();
  24  |     await expect(page.getByText('Semester created')).toBeVisible();
  25  | 
  26  |     // 2. Create a subject
  27  |     await page.getByRole('button', { name: 'Add', exact: true }).click();
  28  |     await page.getByLabel('Subject Title').fill('Operating Systems');
  29  |     await page.getByLabel('Subject Code').fill('CS401');
  30  |     await page.getByLabel('Lecturer (Optional)').fill('Dr. Turing');
  31  |     await page.getByRole('dialog').getByRole('button', { name: 'Add Subject' }).click();
  32  |     await expect(page.getByText('Operating Systems')).toBeVisible();
  33  |     await expect(page.getByText('CS401')).toBeVisible();
  34  | 
  35  |     // 3. Create an assignment
  36  |     await page.getByRole('button', { name: 'New Assignment' }).click();
  37  |     await page.getByLabel('Assignment Title').fill('Kernel Concurrency Lab');
  38  |     await page.getByLabel('Weight (%)').fill('25');
  39  |     await page.getByRole('dialog').getByRole('button', { name: 'Create Assignment' }).click();
  40  |     await expect(page.getByText('Kernel Concurrency Lab')).toBeVisible();
  41  | 
  42  |     // 4. Add a subtask to the assignment
  43  |     await page.getByRole('button', { name: '+ Add Subtask' }).first().click();
  44  |     await page.getByPlaceholder('Add task for this assignment...').fill('Implement Mutex Lock');
  45  |     await page.getByRole('button', { name: 'Add', exact: true }).last().click();
  46  |     await expect(page.getByText('Implement Mutex Lock')).toBeVisible();
  47  | 
  48  |     // 5. Submit assignment
  49  |     await page.locator('button[title="Edit Assignment"]').first().click();
  50  |     await page.getByLabel('Status').selectOption('submitted');
  51  |     await page.getByLabel('Submission URL').fill('https://portal.university.edu/submit/123');
  52  |     await page.getByRole('dialog').getByRole('button', { name: 'Save Changes' }).click();
  53  |     await expect(page.getByText(/submitted/i).first()).toBeVisible();
  54  |   });
  55  | 
  56  |   test('Calendar events and projected deadlines remain accurate', async ({ page }) => {
  57  |     // 1. Create a task with explicit due date
  58  |     await page.goto('/tasks');
  59  |     await page.waitForLoadState('networkidle');
  60  | 
  61  |     const todayDate = new Date();
  62  |     const dayStr = `${todayDate.getFullYear()}-${String(todayDate.getMonth() + 1).padStart(2, '0')}-${String(todayDate.getDate()).padStart(2, '0')}`;
  63  | 
> 64  |     await page.getByRole('button', { name: 'New Task' }).click();
      |                                                          ^ Error: locator.click: Test timeout of 30000ms exceeded.
  65  |     await page.getByLabel('Task Title').fill('Calendar Scheduled Deliverable');
  66  |     await page.getByLabel('Due Date').fill(dayStr);
  67  |     await page.getByRole('button', { name: 'Create Task' }).click();
  68  |     await expect(page.getByText('Calendar Scheduled Deliverable', { exact: true })).toBeVisible();
  69  | 
  70  |     // 2. Open Calendar page
  71  |     await page.goto('/calendar');
  72  |     await page.waitForLoadState('networkidle');
  73  | 
  74  |     // Verify projected task appears in calendar
  75  |     await expect(page.getByText('Calendar Scheduled Deliverable')).toBeVisible();
  76  | 
  77  |     // 3. Create a standalone calendar event
  78  |     await page.getByRole('button', { name: 'Event', exact: true }).click();
  79  |     await page.getByLabel('Event Title').fill('Team Standup Sync');
  80  |     await page.getByLabel('Date').fill(dayStr);
  81  |     await page.getByRole('dialog').getByRole('button', { name: 'Create Event' }).click();
  82  | 
  83  |     // Verify standalone event appears
  84  |     await expect(page.getByText('Team Standup Sync')).toBeVisible();
  85  | 
  86  |     // 4. Test Month navigation
  87  |     await page.getByLabel('Next').click();
  88  |     await page.waitForTimeout(200);
  89  |     // Scheduled deliverable for today should not be in the next month view
  90  |     await expect(page.getByText('Calendar Scheduled Deliverable')).not.toBeVisible();
  91  | 
  92  |     // Return to today
  93  |     await page.getByRole('button', { name: 'Today' }).click();
  94  |     await page.waitForTimeout(200);
  95  |     await expect(page.getByText('Calendar Scheduled Deliverable')).toBeVisible();
  96  |   });
  97  | 
  98  |   test('Goal milestones and linked tasks update correct progress', async ({ page }) => {
  99  |     await page.goto('/goals');
  100 |     await page.waitForLoadState('networkidle');
  101 | 
  102 |     // 1. Create a goal
  103 |     await page.getByRole('button', { name: 'New Goal' }).click();
  104 |     await page.getByLabel('Goal Title').fill('Master Distributed Systems');
  105 |     await page.getByLabel('Why this goal matters (Motivation)').fill('Build resilient cloud applications');
  106 |     await page.getByLabel('Category').fill('Career');
  107 |     await page.getByRole('button', { name: 'Create Goal' }).click();
  108 | 
  109 |     await expect(page.getByText('Master Distributed Systems')).toBeVisible();
  110 | 
  111 |     // 2. Open Goal detail page
  112 |     await page.getByText('Master Distributed Systems').click();
  113 |     await expect(page).toHaveURL(/\/goals\/goal_/);
  114 | 
  115 |     // Initial state: no milestones
  116 |     await expect(page.getByText('No measurable milestones yet')).toBeVisible();
  117 | 
  118 |     // 3. Add milestone 1
  119 |     await page.getByPlaceholder('Add key milestone...').fill('Read Raft Consensus Paper');
  120 |     await page.locator('form').filter({ has: page.getByPlaceholder('Add key milestone...') }).getByRole('button').click();
  121 |     await expect(page.getByText('Read Raft Consensus Paper')).toBeVisible();
  122 | 
  123 |     // 4. Add milestone 2
  124 |     await page.getByPlaceholder('Add key milestone...').fill('Build a replicated key-value store');
  125 |     await page.locator('form').filter({ has: page.getByPlaceholder('Add key milestone...') }).getByRole('button').click();
  126 |     await expect(page.getByText('Build a replicated key-value store')).toBeVisible();
  127 | 
  128 |     // Verify 0% progress
  129 |     await expect(page.getByText(/0\/2 milestones achieved \(0%\)/)).toBeVisible();
  130 | 
  131 |     // 5. Complete milestone 1
  132 |     const ms1 = page.locator('div', { hasText: 'Read Raft Consensus Paper' }).filter({ has: page.locator('button') }).last();
  133 |     await ms1.locator('button').first().click();
  134 |     await page.waitForTimeout(300);
  135 | 
  136 |     // Verify 50% progress
  137 |     await expect(page.getByText(/1\/2 milestones achieved \(50%\)/)).toBeVisible();
  138 | 
  139 |     // 6. Complete milestone 2
  140 |     const ms2 = page.locator('div', { hasText: 'Build a replicated key-value store' }).filter({ has: page.locator('button') }).last();
  141 |     await ms2.locator('button').first().click();
  142 |     await page.waitForTimeout(300);
  143 | 
  144 |     // Verify 100% progress
  145 |     await expect(page.getByText(/2\/2 milestones achieved \(100%\)/)).toBeVisible();
  146 |   });
  147 | });
  148 | 
```