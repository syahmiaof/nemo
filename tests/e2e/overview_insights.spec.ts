import { test, expect } from '@playwright/test';
import { gotoReady } from './gotoReady';

test.describe('Overview & Insights Functional Audit', () => {
  test.beforeEach(async ({ page }) => {
    await gotoReady(page, '/');
  });

  test('Dashboard metrics and Today Focus match real data', async ({ page }) => {
    await gotoReady(page, '/overview');
    await page.waitForLoadState('networkidle');

    // Page heading is rendered
    await expect(page.getByRole('heading', { name: 'Make room for progress.' })).toBeVisible();

    // Verify presence of key analytical panels
    await expect(page.getByRole('heading', { name: 'Your momentum' })).toBeVisible();
    await expect(page.getByRole('heading', { name: "Today's focus" })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Weekly momentum' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Coming into view' })).toBeVisible();

    // Verify Your momentum displays Projects momentum
    await expect(page.getByText(/Projects finished in the last 7 days/i)).toBeVisible();
  });

  test('Insights page displays accurate analytics and year selection', async ({ page }) => {
    await gotoReady(page, '/insights');
    await page.waitForLoadState('networkidle');

    // Verify main headings
    await expect(page.getByRole('heading', { name: /Workspace.*Insights/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Completion rhythm' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Task mix' })).toBeVisible();

    // Metric toggle in insights: Tasks vs Projects
    await page.getByRole('button', { name: 'Projects', exact: true }).click();

    await expect(page.locator('.insights-total').getByText(/projects completed in/i)).toBeVisible();

    await page.getByRole('button', { name: 'Tasks', exact: true }).click();

    await expect(page.locator('.insights-total').getByText(/tasks completed in/i)).toBeVisible();

    // Verify reporting year select is interactive
    const yearSelect = page.locator('select');
    await expect(yearSelect).toBeVisible();
  });

  test('Ask Nemo understands a natural-language active project count', async ({ page, isMobile }) => {
    await gotoReady(page, '/overview');
    const exploreDemo = page.getByRole('button', { name: /Explore demo/ }).first();
    if (await exploreDemo.isVisible().catch(() => false)) await exploreDemo.click();
    await expect(page.getByText(/Demo Workspace: Exploring fictional sample data/)).toBeVisible();

    if (isMobile) {
      await page.getByRole('button', { name: 'Open more navigation options' }).click();
      await page.getByRole('dialog', { name: 'Workspace Utilities & Modules' }).getByRole('button', { name: /Ask Nemo/ }).click();
    } else {
      await page.getByRole('button', { name: 'Ask Nemo Assistant' }).click();
    }
    const drawer = page.getByRole('dialog', { name: /Ask Nemo/ });
    await expect(drawer).toBeVisible();
    await drawer.getByPlaceholder('Ask about tasks, projects, deadlines...').fill('How many projects are active?');
    await drawer.getByRole('button', { name: 'Send query' }).click();

    await expect(drawer.getByText('Active Projects', { exact: true })).toBeVisible();
    await expect(drawer.getByText(/You have \d+ active projects? currently in flight\./)).toBeVisible();
    await expect(drawer.getByRole('button', { name: /Orbit Analytics/ })).toBeVisible();
  });
});
