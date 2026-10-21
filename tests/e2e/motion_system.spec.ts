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

test('rapid navigation commits the latest route after interrupting an exit', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/overview');
  const welcome = page.getByRole('dialog', { name: 'Welcome to Nemo' });
  await welcome.waitFor({ state: 'visible', timeout: 3000 }).catch(() => undefined);
  if (await welcome.isVisible().catch(() => false)) {
    await welcome.click();
    await welcome.waitFor({ state: 'hidden', timeout: 5000 });
  }

  const returnToPersonal = page.getByRole('button', { name: /Return to my workspace/ });
  if (await returnToPersonal.isVisible().catch(() => false)) await returnToPersonal.click();
  const exploreDemo = page.getByRole('button', { name: /Explore demo/ }).first();
  if (await exploreDemo.isVisible().catch(() => false)) {
    await exploreDemo.click();
    await page.getByText(/Demo Workspace: Exploring fictional sample data/).waitFor({ timeout: 10000 });
  }

  const nav = page.getByRole('navigation', { name: 'Main Navigation' });
  await nav.getByRole('link', { name: 'Projects', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Orbit Analytics' })).toBeVisible();
  await nav.getByRole('link', { name: 'Tasks', exact: true }).click();
  await page.waitForTimeout(60);
  await nav.getByRole('link', { name: 'Calendar', exact: true }).click();
  await expect(page).toHaveURL(/\/calendar$/);
  await expect(page.locator('.route-content')).toHaveAttribute('aria-busy', 'false');
  await expect(page.getByRole('region', { name: /Month calendar/ })).toBeVisible();
});
