import { test, expect } from '@playwright/test';
import { gotoReady } from './gotoReady';

test.describe('Sprint 6 Spark of Focus Visual & Motion Verification', () => {
  test('Capture Desktop Themes (Midnight, Daylight, Aurora)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoReady(page, '/overview');

    // 1. Midnight Theme
    await page.evaluate(() => {
      document.documentElement.dataset.theme = 'midnight';
      document.documentElement.setAttribute('data-theme', 'midnight');
    });
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'docs/evidence/sprint6/overview_desktop_midnight.png' });

    // 2. Daylight Theme
    await page.evaluate(() => {
      document.documentElement.dataset.theme = 'daylight';
      document.documentElement.setAttribute('data-theme', 'daylight');
    });
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'docs/evidence/sprint6/overview_desktop_daylight.png' });

    // 3. Aurora Theme
    await page.evaluate(() => {
      document.documentElement.dataset.theme = 'aurora';
      document.documentElement.setAttribute('data-theme', 'aurora');
    });
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'docs/evidence/sprint6/overview_desktop_aurora.png' });
  });

  test('Capture Mobile Themes (Midnight, Daylight, Aurora)', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await gotoReady(page, '/overview');

    // 1. Midnight
    await page.evaluate(() => {
      document.documentElement.dataset.theme = 'midnight';
      document.documentElement.setAttribute('data-theme', 'midnight');
    });
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'docs/evidence/sprint6/overview_mobile_midnight.png' });

    // 2. Daylight
    await page.evaluate(() => {
      document.documentElement.dataset.theme = 'daylight';
      document.documentElement.setAttribute('data-theme', 'daylight');
    });
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'docs/evidence/sprint6/overview_mobile_daylight.png' });

    // 3. Aurora
    await page.evaluate(() => {
      document.documentElement.dataset.theme = 'aurora';
      document.documentElement.setAttribute('data-theme', 'aurora');
    });
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'docs/evidence/sprint6/overview_mobile_aurora.png' });
  });

  test('Capture Particle Morph Motion Phases (Frames 1-5)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoReady(page, '/overview');

    const card = page.locator('section[aria-label="Spark of focus motivational quote"]');
    await expect(card).toBeVisible();

    // Frame 1: Stable text
    await card.screenshot({ path: 'docs/evidence/sprint6/particle_frame1_stable.png' });

    // Trigger next quote transition
    const nextBtn = card.getByLabel('Next motivational quote');
    await nextBtn.click();

    // Frame 2: Initial Breakup (~250ms)
    await page.waitForTimeout(250);
    await card.screenshot({ path: 'docs/evidence/sprint6/particle_frame2_breakup.png' });

    // Frame 3: Orbital Transformation (~700ms)
    await page.waitForTimeout(450);
    await card.screenshot({ path: 'docs/evidence/sprint6/particle_frame3_orbital.png' });

    // Frame 4: Reformation (~1300ms)
    await page.waitForTimeout(550);
    await card.screenshot({ path: 'docs/evidence/sprint6/particle_frame4_reformation.png' });

    // Frame 5: Reconstructed Sharp Text (~2000ms)
    await page.waitForTimeout(700);
    await card.screenshot({ path: 'docs/evidence/sprint6/particle_frame5_complete.png' });
  });
});
