# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: sprint4_responsive.spec.ts >> Sprint 4 — responsive, branding and motion regressions >> mobile More sheet traps focus, closes with Escape and restores its trigger
- Location: tests\e2e\sprint4_responsive.spec.ts:40:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('dialog', { name: 'More Modules' })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByRole('dialog', { name: 'More Modules' }) with timeout 5000ms
  - waiting for getByRole('dialog', { name: 'More Modules' })

```

```yaml
- link "Skip to content":
  - /url: "#main-content"
- banner:
  - link "Nemo overview":
    - /url: /overview
    - text: nemo.
  - button "Quick Add":
    - img
  - link "Profile and settings":
    - /url: /settings
    - text: AM
- img
- text: DEMO WORKSPACE · Fictional data
- button "Return to my workspace":
  - img
  - text: Return to my workspace
- main:
  - heading "Make room for progress." [level=1]
  - paragraph: Wednesday, October 21 · Alex Morgan
  - definition: "6"
  - term: Active projects
  - definition: "11"
  - term: Tasks need attention
  - definition: "86"
  - term: Tasks completed
  - region "Your momentum":
    - heading "Your momentum" [level=2]
    - button "Tasks" [pressed]
    - button "Projects"
    - link "Open insights":
      - /url: /insights
      - img
    - strong: "14"
    - paragraph: Tasks finished in the last 7 days
    - text: +14 vs previous 7 days This week Previous 7 days
    - group "This week chart. Use left and right arrows, Home or End to explore.": 0 2 4 Thu Sat Mon Wed
    - paragraph: Values in tasks. Exact values are available in the data table below.
    - group: View chart data
  - region "Today's focus":
    - heading "Today's focus" [level=2]
    - text: 3 of 3 active slots
    - link "Manage tasks":
      - /url: /tasks
      - img
    - article:
      - img
      - text: "#01 · ⏱ 25 min"
      - button "Remove Plan next week’s priorities from focus":
        - img
      - heading "Plan next week’s priorities" [level=3]
      - text: Standalone focus high In progress
      - button "Complete Plan next week’s priorities":
        - img
    - article:
      - img
      - text: "#02 · ⏱ 25 min"
      - button "Remove Review the learning journal from focus":
        - img
      - heading "Review the learning journal" [level=3]
      - text: Standalone focus medium Focus slot
      - button "Complete Review the learning journal":
        - img
    - article:
      - img
      - text: "#03 · ⏱ 25 min"
      - button "Remove Back up the current workspace from focus":
        - img
      - heading "Back up the current workspace" [level=3]
      - text: Standalone focus urgent Focus slot
      - button "Complete Back up the current workspace":
        - img
  - region "Weekly momentum":
    - heading "Weekly momentum" [level=2]
    - link "Open insights":
      - /url: /insights
      - img
    - img
    - strong: 18%
    - text: "completed Finished: 14 Open: 64 Projects: 6 Study: 3 6 items require prompt attention"
  - region "In the making":
    - heading "In the making" [level=2]
    - paragraph: Your active projects, one step closer.
    - link "All projects":
      - /url: /projects
      - text: All projects
      - img
    - link "In Progress High SaaS Orbit Studio Orbit Analytics A privacy-first product analytics workspace. Progress 1/2 milestones (50%) Nov 2, 2026 TypeScript":
      - /url: /projects/demo-project-1
      - text: In Progress High SaaS Orbit Studio
      - heading "Orbit Analytics" [level=3]
      - paragraph: A privacy-first product analytics workspace.
      - text: Progress 1/2 milestones (50%)
      - img
      - text: Nov 2, 2026
      - img
      - text: TypeScript
    - link "In Progress Medium E-commerce Forma Living Forma Commerce A thoughtful storefront for independent furniture makers. Progress 1/2 milestones (50%) Nov 7, 2026 React, TypeScript":
      - /url: /projects/demo-project-2
      - text: In Progress Medium E-commerce Forma Living
      - heading "Forma Commerce" [level=3]
      - paragraph: A thoughtful storefront for independent furniture makers.
      - text: Progress 1/2 milestones (50%)
      - img
      - text: Nov 7, 2026
      - img
      - text: React, TypeScript
  - region "Coming into view":
    - heading "Coming into view" [level=2]
    - link "Open calendar":
      - /url: /calendar
      - img
    - button "Complete Validate the domain model · Orbit Analytics":
      - img
    - link "Validate the domain model · Orbit Analytics Oct 16 · medium priority":
      - /url: /tasks
    - img
    - button "Complete Build the core workflow · Orbit Analytics":
      - img
    - link "Build the core workflow · Orbit Analytics Oct 18 · urgent priority":
      - /url: /tasks
    - img
    - button "Complete Build the core workflow · Forma Commerce":
      - img
    - link "Build the core workflow · Forma Commerce Oct 19 · low priority":
      - /url: /tasks
    - img
    - button "Complete Validate the domain model · Atlas API Gateway":
      - img
    - link "Validate the domain model · Atlas API Gateway Oct 20 · medium priority":
      - /url: /tasks
    - img
  - region "On the study desk":
    - heading "On the study desk" [level=2]
    - link "Open academics":
      - /url: /academics
      - img
    - link "Oct 21 Compare container deployment strategies in progress":
      - /url: /academics/assignments/demo-assignment-2
      - text: Oct 21
      - heading "Compare container deployment strategies" [level=3]
      - paragraph: in progress
      - img
    - link "Oct 23 Audit a checkout keyboard flow in progress":
      - /url: /academics/assignments/demo-assignment-6
      - text: Oct 23
      - heading "Audit a checkout keyboard flow" [level=3]
      - paragraph: in progress
      - img
    - link "Oct 25 Document a threat model in progress":
      - /url: /academics/assignments/demo-assignment-10
      - text: Oct 25
      - heading "Document a threat model" [level=3]
      - paragraph: in progress
      - img
  - region "Recent activity":
    - heading "Recent activity" [level=2]
    - img
    - paragraph: "Completed: Map the primary user journey · Orbit Analytics"
    - text: Wed 12:00 PM
    - img
    - paragraph: "Completed: Validate the domain model · Pulse Mobile"
    - text: Wed 12:00 PM
    - img
    - paragraph: "Completed: Tidy the development environment"
    - text: Tue 12:00 PM
    - img
    - paragraph: "Completed: Build the core workflow · Pulse Mobile"
    - text: Tue 12:00 PM
- navigation "Mobile Navigation":
  - link "Today":
    - /url: /overview
    - img
    - text: Today
  - link "Projects":
    - /url: /projects
    - img
    - text: Projects
  - link "Tasks":
    - /url: /tasks
    - img
    - text: Tasks
  - link "Calendar":
    - /url: /calendar
    - img
    - text: Calendar
  - button "Open more navigation options" [expanded]:
    - img
    - text: More
- dialog "Workspace Utilities & Modules":
  - heading "Workspace Utilities & Modules" [level=2]
  - button "Close dialog":
    - img
  - button "Ask Nemo Local Assistant":
    - img
    - paragraph: Ask Nemo
    - paragraph: Local Assistant
  - button "Quick Search Find any record":
    - img
    - paragraph: Quick Search
    - paragraph: Find any record
  - link "Academics Semesters, subjects & assignments":
    - /url: /academics
    - img
    - paragraph: Academics
    - paragraph: Semesters, subjects & assignments
  - link "Goals Target milestones & progress":
    - /url: /goals
    - img
    - paragraph: Goals
    - paragraph: Target milestones & progress
  - link "Insights Local metrics & charts":
    - /url: /insights
    - img
    - paragraph: Insights
    - paragraph: Local metrics & charts
  - link "Settings Profile, appearance & backups":
    - /url: /settings
    - img
    - paragraph: Settings
    - paragraph: Profile, appearance & backups
  - paragraph:
    - img
    - text: Saved on this device · Export backups in Settings
```

# Test source

```ts
  1   | import { test, expect, type Page } from '@playwright/test';
  2   | 
  3   | async function assertReflow(page: Page) {
  4   |   const result = await page.evaluate(() => {
  5   |     const masked = ['body', '.nemo-app', '.app-shell'].filter(selector =>
  6   |       ['hidden', 'clip'].includes(getComputedStyle(document.querySelector(selector)!).overflowX));
  7   |     const clipped = [...document.querySelectorAll<HTMLElement>('main button, main input, main select, header a, header button')].filter(el => {
  8   |       const r = el.getBoundingClientRect();
  9   |       if (!r.width || !r.height) return false;
  10  |       for (let parent = el.parentElement; parent && parent !== document.body; parent = parent.parentElement) {
  11  |         if (['auto', 'scroll'].includes(getComputedStyle(parent).overflowX) && parent.scrollWidth > parent.clientWidth + 1) return false;
  12  |       }
  13  |       return r.right > innerWidth + 1 || r.left < -1;
  14  |     }).map(el => el.getAttribute('aria-label') || el.textContent?.trim());
  15  |     return { width: innerWidth, scrollWidth: document.documentElement.scrollWidth, masked, clipped };
  16  |   });
  17  |   expect(result.masked).toEqual([]);
  18  |   expect(result.clipped).toEqual([]);
  19  |   expect(result.scrollWidth).toBeLessThanOrEqual(result.width + 1);
  20  | }
  21  | 
  22  | test.describe('Sprint 4 — responsive, branding and motion regressions', () => {
  23  |   test('all modules and detail screens reflow without page masking', async ({ page, isMobile }) => {
  24  |     test.setTimeout(120_000);
  25  |     await page.addInitScript(() => localStorage.setItem('nemo:workspace-mode', 'demo'));
  26  |     await page.emulateMedia({ reducedMotion: 'reduce' });
  27  |     const widths = isMobile ? [320, 360, 375, 390, 430] : [768, 1440];
  28  |     for (const width of widths) {
  29  |       await page.setViewportSize({ width, height: 900 });
  30  |       for (const route of ['overview', 'projects', 'tasks', 'calendar', 'academics', 'goals', 'insights', 'settings', 'projects/demo-project-1', 'goals/demo-goal-1']) {
  31  |         await page.goto(`/${route}`);
  32  |         await expect(page.locator('main')).toBeVisible();
  33  |         await page.evaluate(() => document.fonts.ready);
  34  |         await expect(page.locator('.workspace-status')).toContainText('DEMO');
  35  |         await assertReflow(page);
  36  |       }
  37  |     }
  38  |   });
  39  | 
  40  |   test('mobile More sheet traps focus, closes with Escape and restores its trigger', async ({ page }) => {
  41  |     await page.setViewportSize({width: 390, height: 844});
  42  |     await page.addInitScript(() => localStorage.setItem('nemo:workspace-mode', 'demo'));
  43  |     await page.goto('/overview');
  44  |     const more = page.getByRole('button', {name: 'Open more navigation options'});
  45  |     await more.click();
  46  |     const dialog = page.getByRole('dialog', {name: 'More Modules'});
> 47  |     await expect(dialog).toBeVisible();
      |                          ^ Error: expect(locator).toBeVisible() failed
  48  |     await dialog.getByRole('link', {name: /Settings/}).focus();
  49  |     await page.keyboard.press('Tab');
  50  |     await expect(dialog.getByRole('button', {name: 'Close dialog'})).toBeFocused();
  51  |     await page.keyboard.press('Escape');
  52  |     await expect(dialog).not.toBeVisible();
  53  |     await expect(more).toBeFocused();
  54  |     await more.click();
  55  |     await page.getByRole('dialog').getByRole('link', {name: /Settings/}).click();
  56  |     await expect(page.getByRole('heading', {name: 'Settings', exact: true})).toBeVisible();
  57  |     await expect(page.getByRole('dialog')).not.toBeVisible();
  58  |     await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden');
  59  |   });
  60  | 
  61  |   test('320px forms keep fields and submit actions reachable; settings supports keyboard tabs', async ({ page }) => {
  62  |     await page.setViewportSize({width: 320, height: 640});
  63  |     await page.addInitScript(() => localStorage.setItem('nemo:workspace-mode', 'demo'));
  64  |     await page.goto('/projects');
  65  |     await page.getByRole('button', {name: 'New Project', exact: true}).click();
  66  |     const dialog = page.getByRole('dialog');
  67  |     await expect(dialog).toBeVisible();
  68  |     await page.getByLabel('Project Title').fill('Mobile form verification');
  69  |     const submit = dialog.getByRole('button', {name: 'Create Project', exact: true});
  70  |     await submit.scrollIntoViewIfNeeded();
  71  |     await expect(submit).toBeInViewport();
  72  |     const bounds = await dialog.boundingBox();
  73  |     expect(bounds!.width).toBeLessThanOrEqual(320);
  74  |     await page.keyboard.press('Escape');
  75  |     await expect(dialog).not.toBeVisible();
  76  |     await page.goto('/settings');
  77  |     await page.getByRole('tab', {name: 'Appearance', exact: true}).focus();
  78  |     await page.keyboard.press('End');
  79  |     await expect(page.getByRole('tab', {name: 'Demo Mode'})).toBeFocused();
  80  |     await expect(page.getByRole('tab', {name: 'Demo Mode'})).toHaveAttribute('aria-selected', 'true');
  81  |     await page.getByRole('tab', {name: 'Data & Backups'}).click();
  82  |     await expect(page.getByRole('button', {name: /Export Backup/})).toBeVisible();
  83  |     await assertReflow(page);
  84  |   });
  85  | 
  86  |   test('brand assets and fonts load locally from a cold context', async ({ page }) => {
  87  |     const external: string[] = [];
  88  |     page.on('request', request => {
  89  |       const url = new URL(request.url());
  90  |       if (url.protocol.startsWith('http') && !['localhost','127.0.0.1'].includes(url.hostname)) external.push(url.href);
  91  |     });
  92  |     await page.goto('/');
  93  |     await page.evaluate(() => document.fonts.ready);
  94  |     expect(external).toEqual([]);
  95  |     await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', /nemo/);
  96  |     await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image');
  97  |     const dimensions = await page.evaluate(async () => {
  98  |       const img = new Image(); img.src = '/brand/nemo-og.png'; await img.decode();
  99  |       return [img.naturalWidth, img.naturalHeight];
  100 |     });
  101 |     expect(dimensions).toEqual([1200,630]);
  102 |     const manifest = await (await page.request.get('/manifest.webmanifest')).json();
  103 |     expect(manifest.icons.some((icon: {purpose?: string}) => icon.purpose === 'maskable')).toBe(true);
  104 |   });
  105 | 
  106 |   test('rapid routing keeps one stable shell and reduced motion responds immediately', async ({ page }) => {
  107 |     await page.setViewportSize({width:1440,height:900});
  108 |     await page.addInitScript(() => localStorage.setItem('nemo:workspace-mode', 'demo'));
  109 |     const errors: string[] = [];
  110 |     page.on('pageerror', error => errors.push(error.message));
  111 |     await page.goto('/overview');
  112 |     await page.locator('.nemo-chart').waitFor();
  113 |     await page.locator('header').evaluate(el => el.setAttribute('data-persistence-probe','same'));
  114 |     for (const route of ['Projects','Tasks','Calendar','Goals','Insights','Overview']) {
  115 |       await page.getByRole('navigation', {name:'Main Navigation', exact:true}).getByRole('link',{name:route,exact:true}).click();
  116 |     }
  117 |     await expect(page.locator('.route-content')).toHaveAttribute('aria-busy','false');
  118 |     await expect(page.locator('header')).toHaveAttribute('data-persistence-probe','same');
  119 |     await expect(page.getByRole('heading',{name:'Make room for progress.'})).toBeVisible();
  120 |     await page.emulateMedia({reducedMotion:'reduce'});
  121 |     await expect(page.locator('.nemo-chart')).toHaveAttribute('data-motion','reduced');
  122 |     await page.getByRole('button',{name:'Projects',exact:true}).click();
  123 |     await expect(page.locator('.route-content')).toHaveCSS('opacity','1');
  124 |     expect(errors).toEqual([]);
  125 |   });
  126 | });
  127 | 
```