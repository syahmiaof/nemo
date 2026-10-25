import { chromium } from '@playwright/test';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/USER/.gemini/antigravity/brain/1102514f-bdd3-4c27-a1bd-e5f999af1756';

async function run() {
  const browser = await chromium.launch({ headless: true });

  // 1. Desktop verification
  const desktopContext = await browser.newContext({
    viewport: { width: 1366, height: 950 },
  });
  const page = await desktopContext.newPage();

  console.log('1. Navigating to https://nemo.syahmiaof.my/tasks ...');
  await page.goto('https://nemo.syahmiaof.my/tasks', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);

  console.log('2. Capturing desktop tasks page with Add Watchlist button and Watchlist tab...');
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'qa_desktop_tasks_watchlist_button.png'),
    fullPage: false,
  });

  console.log('3. Clicking + Add Watchlist button...');
  const addWatchlistBtn = page.locator('button:has-text("Add Watchlist")');
  await addWatchlistBtn.waitFor({ state: 'visible', timeout: 5000 });
  await addWatchlistBtn.click();
  await page.waitForTimeout(1000);

  console.log('4. Capturing modal with Watchlist mode active...');
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'qa_desktop_tasks_watchlist_modal.png'),
  });

  console.log('5. Typing and submitting a new watchlist item...');
  await page.fill('input[placeholder*="Explore machine learning tutorials"]', 'Explore Next-Gen AI Micro-agents');
  await page.fill('textarea[placeholder*="Add extra context"]', 'Parked idea: Test Autonomous Agent loops without setting urgent deadlines.');
  const submitBtn = page.locator('button:has-text("Add to Watchlist")');
  await submitBtn.click();
  await page.waitForTimeout(1500);

  console.log('6. Switching to Watchlist filter tab...');
  const watchlistTab = page.locator('.page-filters button:has-text("Watchlist")');
  await watchlistTab.click();
  await page.waitForTimeout(1200);

  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'qa_desktop_tasks_watchlist_active_tab.png'),
  });

  // 2. Mobile verification
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto('https://nemo.syahmiaof.my/tasks', { waitUntil: 'networkidle' });
  await mobilePage.waitForTimeout(2000);

  await mobilePage.screenshot({
    path: path.join(ARTIFACT_DIR, 'qa_mobile_tasks_watchlist.png'),
    fullPage: false,
  });

  console.log('All screenshots captured successfully!');
  await browser.close();
}

run().catch((err) => {
  console.error('Error running verification:', err);
  process.exit(1);
});
