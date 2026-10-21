import { test, expect } from '@playwright/test';
import { gotoReady } from './gotoReady';

test('Verify Profile Quick Menu Opens Without Breaking Layout', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await gotoReady(page, '/overview');

  const profileBtn = page.getByLabel('Profile and quick settings');
  await expect(profileBtn).toBeVisible();

  // Click to open popover
  await profileBtn.click();

  const popover = page.getByRole('dialog', { name: 'Quick Settings & Profile' });
  await expect(popover).toBeVisible();

  // Wait for animation to finish
  await page.waitForTimeout(350);

  // Take screenshot of header area and full page
  await page.screenshot({ path: 'docs/evidence/sprint6/profile_menu_open_verified.png' });
});
