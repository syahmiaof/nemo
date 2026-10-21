import { test, expect } from '@playwright/test';
import { dismissBlockingIntro, gotoReady } from './gotoReady';

test.describe('Sprint 2 — Real Offline PWA & Service Worker Verification', () => {
  const PREVIEW_URL = process.env.BASE_URL || 'http://localhost:4173';

  test('PWA registers service worker, caches application shell, and functions 100% offline', async ({ page, context }) => {
    test.setTimeout(90000);
    // 1. Initial online load to register Service Worker and precache assets
    await gotoReady(page, PREVIEW_URL);
    await page.waitForLoadState('networkidle');

    // Wait for Service Worker registration to become active
    const swRegistered = await page.evaluate(async () => {
      if (!('serviceWorker' in navigator)) return false;
      const registration = await navigator.serviceWorker.ready;
      return !!registration.active;
    });
    expect(swRegistered).toBe(true);

    // 2. Cut network connection completely (0 kbps offline simulation)
    await context.setOffline(true);

    // 3. Navigate across all core routes while completely OFFLINE
    const routes = ['/tasks', '/projects', '/calendar', '/goals', '/academics', '/insights', '/settings'];
    for (const r of routes) {
      await gotoReady(page, `${PREVIEW_URL}${r}`);
      await expect(page.locator('#root')).toBeVisible();
    }

    // 4. Create a task while offline
    await gotoReady(page, `${PREVIEW_URL}/tasks`);
    const offlineTaskTitle = `Offline Created Task ${Date.now()}`;
    await page.getByRole('button', { name: 'New Task' }).click();
    await page.getByLabel('Task Title').fill(offlineTaskTitle);
    await page.getByRole('button', { name: 'Create Task' }).click();
    await expect(page.getByText(offlineTaskTitle, { exact: true })).toBeVisible();

    // 5. Complete task while offline
    const completeBtn = page.locator('button[aria-label="Mark task complete"]').first();
    await completeBtn.click();
    await page.waitForTimeout(300);

    // 6. Create a project while offline
    await gotoReady(page, `${PREVIEW_URL}/projects`);
    const offlineProjectTitle = `Offline Project ${Date.now()}`;
    await page.getByRole('button', { name: 'New Project' }).first().click();
    await page.getByLabel('Project Title').fill(offlineProjectTitle);
    await page.getByRole('button', { name: 'Create Project' }).click();
    await expect(page.getByText(offlineProjectTitle, { exact: true })).toBeVisible();

    // 7. Full page refresh while completely OFFLINE (validating Workbox SW precache serving)
    await page.reload();
    await dismissBlockingIntro(page);
    await expect(page.locator('#root')).toBeVisible();

    // Verify IndexedDB persisted the project across offline reload
    await expect(page.getByText(offlineProjectTitle, { exact: true })).toBeVisible();

    // Verify task is now in Completed tab
    await gotoReady(page, `${PREVIEW_URL}/tasks`);
    await page.getByText(/Completed/).click();
    await expect(page.getByText(offlineTaskTitle, { exact: true })).toBeVisible();

    // 8. Restore network connectivity
    await context.setOffline(false);
    await gotoReady(page, `${PREVIEW_URL}/overview`);
    await expect(page.locator('#root')).toBeVisible();
  });
});
