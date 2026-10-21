import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('nemo:workspace-mode', 'demo'));
});

test('navigation pill carries its label mask and settles on the selected tab', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/overview');
  const nav = page.getByRole('navigation', { name: 'Main Navigation' });
  const projects = nav.getByRole('link', { name: 'Projects' });
  await expect(projects).toBeVisible();
  await projects.click();
  await expect(page).toHaveURL(/\/projects$/);
  await expect(page.getByRole('heading', { name: 'Projects', exact: true })).toBeVisible();
  await expect(page.locator('.tabs__ink')).toHaveAttribute('aria-hidden', 'true');
  await expect.poll(async () => {
    const pill = await page.locator('.tabs__indicator').boundingBox();
    const target = await projects.boundingBox();
    return pill && target ? Math.abs(pill.x - target.x) + Math.abs(pill.width - target.width) : Infinity;
  }, { timeout: 2000 }).toBeLessThan(2);
  await expect(page.locator('.route-content')).toHaveAttribute('aria-busy', 'false');
});

test('reduced motion keeps all routes readable without stranded clips', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/overview');
  for (const route of ['projects', 'tasks', 'calendar', 'academics', 'goals', 'insights', 'settings']) {
    await page.goto(`/${route}`);
    await expect(page.locator('.route-content')).toHaveAttribute('aria-busy', 'false');
    await expect(page.locator('.route-content')).toBeVisible();
    const clipped = await page.locator('.route-content .glass-panel').first().evaluate((element) => getComputedStyle(element).clipPath);
    expect(clipped).toBe('none');
  }
});
