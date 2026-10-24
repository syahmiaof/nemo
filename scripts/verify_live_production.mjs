import { chromium } from '@playwright/test';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/USER/.gemini/antigravity/brain/1102514f-bdd3-4c27-a1bd-e5f999af1756';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
  });
  const page = await context.newPage();

  console.log('1. Navigating to https://nemo.syahmiaof.my/finance...');
  await page.goto('https://nemo.syahmiaof.my/finance', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Take full-page desktop screenshot
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'qa_desktop_finance_live_production.png'), fullPage: true });
  console.log('Captured qa_desktop_finance_live_production.png');

  // Verify navigation to Academics subject selector modal on production as well
  console.log('2. Navigating to https://nemo.syahmiaof.my/academics to verify live subject selector...');
  await page.goto('https://nemo.syahmiaof.my/academics', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  // Switch to mobile viewport
  console.log('3. Checking mobile view on production...');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('https://nemo.syahmiaof.my/finance', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'qa_mobile_finance_live_production.png'), fullPage: true });
  console.log('Captured qa_mobile_finance_live_production.png');

  console.log('Live production verification completed!');
  await browser.close();
}

run().catch((err) => {
  console.error('Live verification error:', err);
  process.exit(1);
});
