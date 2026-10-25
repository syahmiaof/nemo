import { chromium } from '@playwright/test';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/USER/.gemini/antigravity/brain/1102514f-bdd3-4c27-a1bd-e5f999af1756';

async function testActivate() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1366, height: 950 } });
  const page = await context.newPage();

  await page.goto('https://nemo.syahmiaof.my/tasks', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Switch to watchlist tab
  const watchlistTab = page.locator('.page-filters button:has-text("Watchlist")');
  await watchlistTab.click();
  await page.waitForTimeout(1000);

  // Find activate button
  const activateBtn = page.locator('button:has-text("Activate")').first();
  if (await activateBtn.isVisible()) {
    console.log('Activating task...');
    await activateBtn.click();
    await page.waitForTimeout(1500);

    // Switch to Due Today tab
    const todayTab = page.locator('.page-filters button:has-text("Due Today")');
    await todayTab.click();
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'qa_desktop_tasks_activated_to_today.png'),
    });
    console.log('Saved qa_desktop_tasks_activated_to_today.png');
  } else {
    console.log('No activate button found.');
  }

  await browser.close();
}

testActivate().catch(console.error);
