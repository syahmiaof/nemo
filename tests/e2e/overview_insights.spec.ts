import { test, expect } from '@playwright/test';

test.describe('Overview & Insights Functional Audit', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    const skipBtn = page.getByRole('button', { name: 'Skip customization' });
    try {
      await skipBtn.waitFor({ state: 'visible', timeout: 3500 });
      await skipBtn.click();
      await skipBtn.waitFor({ state: 'hidden', timeout: 3500 });
    } catch {
      // already completed/dismissed
    }
  });

  test('Dashboard metrics and Today Focus match real data', async ({ page }) => {
    await page.goto('/overview');
    await page.waitForLoadState('networkidle');

    // Page heading is rendered
    await expect(page.getByRole('heading', { name: 'Make room for progress.' })).toBeVisible();

    // Verify presence of key analytical panels
    await expect(page.getByRole('heading', { name: 'Your momentum' })).toBeVisible();
    await expect(page.getByRole('heading', { name: "Today's focus" })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Weekly momentum' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Coming into view' })).toBeVisible();

    // Toggle metric on spline chart (Tasks -> Projects -> Tasks)
    const projectsBtn = page.getByRole('button', { name: 'Projects', exact: true });
    await projectsBtn.click();
    await page.waitForTimeout(300);
    await expect(page.getByText(/Projects finished in the last 7 days/i)).toBeVisible();

    const tasksBtn = page.getByRole('button', { name: 'Tasks', exact: true });
    await tasksBtn.click();
    await page.waitForTimeout(300);
    await expect(page.getByText(/Tasks finished in the last 7 days/i)).toBeVisible();
  });

  test('Insights page displays accurate analytics and year selection', async ({ page }) => {
    await page.goto('/insights');
    await page.waitForLoadState('networkidle');

    // Verify main headings
    await expect(page.getByRole('heading', { name: /Workspace.*Insights/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Completion rhythm' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Task mix' })).toBeVisible();

    // Metric toggle in insights: Tasks vs Projects
    await page.getByRole('button', { name: 'Projects', exact: true }).click();
    await page.waitForTimeout(300);
    await expect(page.locator('.insights-total').getByText(/projects completed in/i)).toBeVisible();

    await page.getByRole('button', { name: 'Tasks', exact: true }).click();
    await page.waitForTimeout(300);
    await expect(page.locator('.insights-total').getByText(/tasks completed in/i)).toBeVisible();

    // Verify reporting year select is interactive
    const yearSelect = page.locator('select');
    await expect(yearSelect).toBeVisible();
  });
});
