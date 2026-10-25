import { chromium } from '@playwright/test';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/USER/.gemini/antigravity/brain/1102514f-bdd3-4c27-a1bd-e5f999af1756';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1366, height: 950 },
  });
  const page = await context.newPage();

  console.log('1. Navigating to https://nemo.syahmiaof.my/finance in Demo Mode...');
  await page.goto('https://nemo.syahmiaof.my/finance', { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    localStorage.setItem('nemo:workspace-mode', 'demo');
  });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);

  console.log('2. Capturing populated desktop screenshot with English UI and rich graphics...');
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'qa_desktop_finance_visual_english.png'),
    fullPage: true,
  });
  console.log('Saved qa_desktop_finance_visual_english.png');

  console.log('3. Switching to Sinking Funds tab...');
  const sinkingFundsTab = page.locator('button:has-text("Sinking Funds")');
  if (await sinkingFundsTab.isVisible()) {
    await sinkingFundsTab.click();
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'qa_desktop_finance_sinking_funds.png'),
      fullPage: true,
    });
    console.log('Saved qa_desktop_finance_sinking_funds.png');
  }

  console.log('4. Switching to Debt Payoff tab...');
  const debtsTab = page.locator('button:has-text("Debt Payoff")');
  if (await debtsTab.isVisible()) {
    await debtsTab.click();
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'qa_desktop_finance_debts_tab.png'),
      fullPage: true,
    });
    console.log('Saved qa_desktop_finance_debts_tab.png');
  }

  console.log('5. Capturing mobile viewport screenshot in English...');
  await page.setViewportSize({ width: 390, height: 844 });
  const overviewTab = page.locator('button:has-text("Overview & All")');
  if (await overviewTab.isVisible()) {
    await overviewTab.click();
    await page.waitForTimeout(1000);
  }
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'qa_mobile_finance_visual_english.png'),
    fullPage: true,
  });
  console.log('Saved qa_mobile_finance_visual_english.png');

  console.log('All verification screenshots captured successfully!');
  await browser.close();
}

run().catch((err) => {
  console.error('Visual verification failed:', err);
  process.exit(1);
});
