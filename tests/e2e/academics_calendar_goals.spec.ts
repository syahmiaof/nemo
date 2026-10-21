import { test, expect } from '@playwright/test';
import { gotoReady } from './gotoReady';

test.describe('Academics, Calendar & Goals Functional Audit', () => {
  test.beforeEach(async ({ page }) => {
    await gotoReady(page, '/');
  });

  test('Create semester, subject, assignment, add subtask and submit', async ({ page }) => {
    await gotoReady(page, '/academics');
    await page.waitForLoadState('networkidle');

    // 1. Create a semester
    await page.getByRole('button', { name: 'New Semester' }).click();
    await page.getByLabel('Semester Name').fill('Fall 2026 Term');
    await page.getByRole('dialog').getByRole('button', { name: 'Create Semester' }).click();
    await expect(page.getByText('Semester created')).toBeVisible();

    // 2. Create a subject
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    await page.getByLabel('Subject Title').fill('Operating Systems');
    await page.getByLabel('Subject Code').fill('CS401');
    await page.getByLabel('Lecturer (Optional)').fill('Dr. Turing');
    await page.getByRole('dialog').getByRole('button', { name: 'Add Subject' }).click();
    await expect(page.getByText('Operating Systems')).toBeVisible();
    await expect(page.getByText('CS401')).toBeVisible();

    // 3. Create an assignment
    await page.getByRole('button', { name: 'New Assignment' }).click();
    await page.getByLabel('Assignment Title').fill('Kernel Concurrency Lab');
    await page.getByLabel('Weight (%)').fill('25');
    await page.getByRole('dialog').getByRole('button', { name: 'Create Assignment' }).click();
    await expect(page.getByText('Kernel Concurrency Lab')).toBeVisible();

    // 4. Add a subtask to the assignment
    await page.getByRole('button', { name: '+ Add Subtask' }).first().click();
    await page.getByPlaceholder('Add task for this assignment...').fill('Implement Mutex Lock');
    await page.getByRole('button', { name: 'Add', exact: true }).last().click();
    await expect(page.getByText('Implement Mutex Lock')).toBeVisible();

    // 5. Submit assignment
    await page.locator('button[title="Edit Assignment"]').first().click();
    await page.getByLabel('Status', { exact: true }).selectOption('submitted');
    await page.getByLabel('Submission URL').fill('https://portal.university.edu/submit/123');
    await page.getByRole('dialog').getByRole('button', { name: 'Save Changes' }).click();
    await expect(page.getByText(/submitted/i).first()).toBeVisible();
  });

  test('Calendar events and projected deadlines remain accurate', async ({ page }) => {
    // 1. Create a task with explicit due date
    await gotoReady(page, '/tasks');
    await page.waitForLoadState('networkidle');

    const todayDate = new Date();
    const dayStr = `${todayDate.getFullYear()}-${String(todayDate.getMonth() + 1).padStart(2, '0')}-${String(todayDate.getDate()).padStart(2, '0')}`;

    await page.getByRole('button', { name: 'New Task' }).click();
    await page.getByLabel('Task Title').fill('Calendar Scheduled Deliverable');
    await page.getByLabel('Due Date').fill(dayStr);
    await page.getByRole('button', { name: 'Create Task' }).click();
    await expect(page.getByText('Calendar Scheduled Deliverable', { exact: true })).toBeVisible();

    // 2. Open Calendar page
    await gotoReady(page, '/calendar');
    await page.waitForLoadState('networkidle');

    // Verify projected task appears in calendar
    await expect(page.getByText('Calendar Scheduled Deliverable')).toBeVisible();

    // 3. Create a standalone calendar event
    await page.getByRole('button', { name: 'Event', exact: true }).click();
    await page.getByLabel('Event Title').fill('Team Standup Sync');
    await page.getByLabel('Date').fill(dayStr);
    await page.getByRole('dialog').getByRole('button', { name: 'Create Event' }).click();

    // Verify standalone event appears
    await expect(page.getByText('Team Standup Sync')).toBeVisible();

    // 4. Test Month navigation
    await page.getByLabel('Next').click();
    await page.waitForTimeout(200);
    // Scheduled deliverable for today should not be in the next month view
    await expect(page.getByText('Calendar Scheduled Deliverable')).not.toBeVisible();

    // Return to today
    await page.getByRole('button', { name: 'Today' }).click();
    await page.waitForTimeout(200);
    await expect(page.getByText('Calendar Scheduled Deliverable')).toBeVisible();
  });

  test('Goal milestones and linked tasks update correct progress', async ({ page }) => {
    await gotoReady(page, '/goals');
    await page.waitForLoadState('networkidle');

    // 1. Create a goal
    await page.getByRole('button', { name: 'New Goal' }).click();
    await page.getByLabel('Goal Title').fill('Master Distributed Systems');
    await page.getByLabel('Why this goal matters (Motivation)').fill('Build resilient cloud applications');
    await page.getByLabel('Category').fill('Career');
    await page.getByRole('button', { name: 'Create Goal' }).click();

    await expect(page.getByText('Master Distributed Systems')).toBeVisible();

    // 2. Open Goal detail page
    await page.getByText('Master Distributed Systems').click();
    await expect(page).toHaveURL(/\/goals\/goal_/);

    // Initial state: no milestones
    await expect(page.getByText('No measurable milestones yet')).toBeVisible();

    // 3. Add milestone 1
    await page.getByPlaceholder('Add key milestone...').fill('Read Raft Consensus Paper');
    await page.locator('form').filter({ has: page.getByPlaceholder('Add key milestone...') }).getByRole('button').click();
    await expect(page.getByText('Read Raft Consensus Paper')).toBeVisible();

    // 4. Add milestone 2
    await page.getByPlaceholder('Add key milestone...').fill('Build a replicated key-value store');
    await page.locator('form').filter({ has: page.getByPlaceholder('Add key milestone...') }).getByRole('button').click();
    await expect(page.getByText('Build a replicated key-value store')).toBeVisible();

    // Verify 0% progress
    await expect(page.getByText(/0\/2 milestones achieved \(0%\)/)).toBeVisible();

    // 5. Complete milestone 1
    const ms1 = page.locator('div', { hasText: 'Read Raft Consensus Paper' }).filter({ has: page.locator('button') }).last();
    await ms1.locator('button').first().click();
    await page.waitForTimeout(300);

    // Verify 50% progress
    await expect(page.getByText(/1\/2 milestones achieved \(50%\)/)).toBeVisible();

    // 6. Complete milestone 2
    const ms2 = page.locator('div', { hasText: 'Build a replicated key-value store' }).filter({ has: page.locator('button') }).last();
    await ms2.locator('button').first().click();
    await page.waitForTimeout(300);

    // Verify 100% progress
    await expect(page.getByText(/2\/2 milestones achieved \(100%\)/)).toBeVisible();
  });
});
