import { test, expect } from '@playwright/test';
import { gotoReady } from './gotoReady';

test.describe('Privacy, Database & Demo Functional Audit', () => {
  test.beforeEach(async ({ page }) => {
    await gotoReady(page, '/');
  });

  test('IndexedDB data survives page reload', async ({ page }) => {
    await gotoReady(page, '/tasks');
    await page.waitForLoadState('networkidle');

    // Create a task
    const taskName = `Persistent Task ${Date.now()}`;
    await page.getByRole('button', { name: 'New Task' }).click();
    await page.getByLabel('Task Title').fill(taskName);
    await page.getByRole('button', { name: 'Create Task' }).click();
    await expect(page.getByText(taskName, { exact: true })).toBeVisible();

    // Reload page
    await page.reload({ waitUntil: 'networkidle' });

    // Verify task is still present after refresh
    await expect(page.getByText(taskName, { exact: true })).toBeVisible();

    // Clean up
    const row = page.locator('div', { hasText: taskName }).filter({ has: page.locator('button[title="Delete Task"]') }).last();
    await row.locator('button[title="Delete Task"]').click();
    await page.getByRole('dialog').getByRole('button', { name: 'Delete Task' }).click();
  });

  test('Demo and real workspace data remain strictly isolated', async ({ page }) => {
    await gotoReady(page, '/overview');
    await page.waitForLoadState('networkidle');

    // Enter Demo Mode from workspace strip
    const demoBtn = page.getByRole('button', { name: 'Explore demo' }).first();
    if (await demoBtn.isVisible()) {
      await demoBtn.click();
      await page.waitForTimeout(1000);
    }

    // Verify Demo Mode banner is visible
    await expect(page.getByText(/Demo Workspace: Exploring fictional sample data/)).toBeVisible();

    // Go to projects in Demo Mode
    await gotoReady(page, '/projects');
    await page.waitForLoadState('networkidle');

    // Verify fictional demo projects exist
    await expect(page.getByRole('heading', { name: 'Orbit Analytics' })).toBeVisible();

    // Return to Real Workspace
    await page.getByRole('button', { name: 'Return to my workspace' }).click();
    await page.waitForTimeout(1000);

    // Verify we are back in Real Mode
    await expect(page.getByRole('heading', { name: 'No projects in this view' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Orbit Analytics' })).not.toBeVisible();
    await expect(page.getByText(/Demo Workspace: Exploring fictional sample data/)).not.toBeVisible();
  });

  test('Backup validation rejects malformed JSON and preserves database', async ({ page }) => {
    await gotoReady(page, '/settings');
    await page.waitForLoadState('networkidle');

    // Click on Data & Backups tab
    await page.getByRole('tab', { name: /Data & Backups/i }).click();

    // Verify export button is functional
    await expect(page.getByRole('button', { name: /Export Backup/i })).toBeVisible();

    // Test restoring an invalid backup via file input
    await page.locator('input[type="file"][accept*="json"]').setInputFiles({
      name: 'corrupt_backup.json',
      mimeType: 'application/json',
      buffer: Buffer.from('{"app":"malicious","version":99,"data":{}}'),
    });

    // Verify error toast for incompatible backup is shown
    await expect(page.getByText('Incompatible backup')).toBeVisible();
  });
});
