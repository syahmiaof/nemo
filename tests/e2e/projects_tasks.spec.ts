import { test, expect } from '@playwright/test';
import { gotoReady } from './gotoReady';

test.describe('Projects & Unified Tasks Functional Audit', () => {
  test.beforeEach(async ({ page }) => {
    await gotoReady(page, '/');
  });

  test('Create, edit, complete, archive and delete project', async ({ page }) => {
    // Navigate to projects
    await gotoReady(page, '/projects');
    await page.waitForLoadState('networkidle');

    // 1. Create a new project
    await page.getByRole('button', { name: 'New Project' }).first().click();
    await page.getByLabel('Project Title').fill('E2E Alpha Project');
    await page.getByLabel('Project Notes & Context').fill('End to end integration test project notes');
    await page.getByLabel('Category').fill('Engineering');
    await page.getByLabel('Client Label (Optional)').fill('Acme Corp');
    await page.getByLabel('Priority').selectOption('high');
    await page.getByLabel('Tags (comma separated)').fill('typescript, e2e, testing');
    await page.getByLabel('Live URL (Optional)').fill('https://example.com/demo');
    await page.getByLabel('Repository URL (Optional)').fill('https://github.com/example/repo');
    await page.getByRole('button', { name: 'Create Project' }).click();

    // Verify project appears in list
    await expect(page.getByRole('heading', { name: 'E2E Alpha Project' })).toBeVisible();
    await expect(page.getByText('Engineering')).toBeVisible();

    // 2. Open project detail page
    await page.getByRole('heading', { name: 'E2E Alpha Project' }).click();
    await expect(page).toHaveURL(/\/projects\/proj_/);
    await expect(page.getByRole('heading', { name: 'E2E Alpha Project' })).toBeVisible();

    // 3. Add a milestone
    await page.getByPlaceholder('Add new milestone...').fill('Beta Acceptance');
    await page.locator('form').filter({ has: page.getByPlaceholder('Add new milestone...') }).getByRole('button').click();
    await expect(page.getByText('Beta Acceptance').first()).toBeVisible();

    // 4. Add a project task
    await page.getByPlaceholder('Add project task...').fill('Implement Core API');
    await page.locator('form').filter({ has: page.getByPlaceholder('Add project task...') }).getByRole('button').click();
    await expect(page.getByText('Implement Core API').first()).toBeVisible();

    // Check progress derivation basis
    await expect(page.getByText(/0\/1 milestones/)).toBeVisible();

    // 5. Complete milestone and verify progress update
    const milestoneItem = page.locator('div', { hasText: 'Beta Acceptance' }).filter({ has: page.locator('button') }).last();
    await milestoneItem.locator('button').first().click();
    await page.waitForTimeout(300);
    await expect(page.getByText(/1\/1 milestones completed \(100%\)/)).toBeVisible();

    // 6. Complete task
    const taskItem = page.locator('div', { hasText: 'Implement Core API' }).filter({ has: page.locator('button') }).last();
    await taskItem.locator('button').first().click();
    await page.waitForTimeout(300);

    // 7. Edit project metadata
    await page.getByRole('button', { name: 'Edit' }).click();
    await page.getByLabel('Project Title').fill('E2E Alpha Project Updated');
    await page.getByRole('button', { name: 'Save Changes' }).click();
    await expect(page.getByRole('heading', { name: 'E2E Alpha Project Updated' })).toBeVisible();

    // 8. Archive project
    await page.getByRole('button', { name: 'Archive' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Archive' }).click();
    await expect(page.getByText('Project archived')).toBeVisible();

    // Go to projects list and verify archived tab
    await gotoReady(page, '/projects');
    await page.getByRole('button', { name: /Archived/ }).click();
    await expect(page.getByRole('heading', { name: 'E2E Alpha Project Updated' })).toBeVisible();

    // 9. Navigate back to project and delete
    await page.getByRole('heading', { name: 'E2E Alpha Project Updated' }).click();
    await page.getByRole('button', { name: 'Delete' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Delete Project' }).click();

    // Verify redirected back to projects
    await expect(page).toHaveURL('/projects');
    await expect(page.getByRole('heading', { name: 'E2E Alpha Project Updated' })).not.toBeVisible();
  });

  test('Create, edit, complete and reopen canonical tasks', async ({ page }) => {
    await gotoReady(page, '/tasks');
    await page.waitForLoadState('networkidle');

    // 1. Create a task
    await page.getByRole('button', { name: 'New Task' }).click();
    await page.getByLabel('Task Title').fill('Verify Storage Quota Engine');
    await page.getByLabel('Priority').selectOption('urgent');
    await page.getByLabel('Notes / Subtasks / References').fill('Check localStorage and IndexedDB fallback safety.');
    await page.getByRole('button', { name: 'Create Task' }).click();

    // Verify visible in Tasks
    await expect(page.getByText('Verify Storage Quota Engine', { exact: true })).toBeVisible();

    // 2. Complete task
    const completeBtn = page.locator('button[aria-label="Mark task complete"]').first();
    await completeBtn.click();
    await page.waitForTimeout(300);

    // Verify task is in Completed filter
    await page.getByRole('button', { name: /Completed/ }).click();
    await expect(page.getByText('Verify Storage Quota Engine', { exact: true })).toBeVisible();

    // 3. Reopen task
    const reopenBtn = page.locator('button[aria-label="Mark task incomplete"]').first();
    await reopenBtn.click();
    await page.waitForTimeout(300);

    // Verify task is back in All Tasks
    await page.getByRole('button', { name: /All Tasks/ }).click();
    await expect(page.getByText('Verify Storage Quota Engine', { exact: true })).toBeVisible();

    // 4. Delete task
    const deleteBtn = page.locator('button[title="Delete Task"]').first();
    await deleteBtn.click();
    await page.getByRole('dialog').getByRole('button', { name: 'Delete Task' }).click();
    await expect(page.getByText('Verify Storage Quota Engine', { exact: true })).not.toBeVisible();
  });

  test('Today Focus keeps 3 slots and backfills a due-today task on completion', async ({ page }) => {
    await gotoReady(page, '/overview');
    await page.waitForLoadState('networkidle');

    // Ensure we start with clean slate for focus testing
    await gotoReady(page, '/tasks');
    // Create 4 standalone tasks
    for (const name of ['Focus Alpha', 'Focus Beta', 'Focus Gamma', 'Focus Delta']) {
      await page.getByRole('button', { name: 'New Task' }).click();
      await page.getByLabel('Task Title').fill(name);
      await page.getByRole('button', { name: 'Create Task' }).click();
      await page.waitForTimeout(200);
    }

    // Go to overview and add first 3 tasks
    await gotoReady(page, '/overview');
    await page.waitForLoadState('networkidle');

    for (const name of ['Focus Alpha', 'Focus Beta', 'Focus Gamma']) {
      const select = page.locator('#focus-choice');
      if (await select.isVisible()) {
        await select.selectOption({ label: name });
        await page.waitForTimeout(300);
      }
    }

    // Verify 3 slots are active
    await expect(page.getByText('3 of 3 active slots')).toBeVisible();
    // Verify focus picker dropdown is hidden when 3 slots are full
    await expect(page.locator('#focus-choice')).not.toBeVisible();

    // Complete Focus Alpha from Overview
    const alphaComplete = page.getByRole('region', { name: "Today's focus" }).getByLabel('Complete Focus Alpha');
    await alphaComplete.click();
    await page.waitForTimeout(400);

    // Due-today tasks backfill an open slot automatically.
    await expect(page.getByText('3 of 3 active slots')).toBeVisible();
    await expect(page.locator('#focus-choice')).not.toBeVisible();
    await expect(page.getByRole('heading', { name: 'Focus Alpha' })).not.toBeVisible();
    await expect(page.getByRole('heading', { name: 'Focus Delta' })).toBeVisible();
  });
});
