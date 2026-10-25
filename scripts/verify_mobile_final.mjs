import { chromium } from '@playwright/test';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/USER/.gemini/antigravity/brain/1102514f-bdd3-4c27-a1bd-e5f999af1756';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();

  console.log('1. Navigating to http://localhost:4173/finance in Demo Mode...');
  await page.goto('http://localhost:4173/finance', { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    localStorage.setItem('nemo:workspace-mode', 'demo');
  });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);

  console.log('2. Capturing perfected mobile viewport screenshot...');
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'qa_mobile_finance_visual_english.png'),
    fullPage: true,
  });
  console.log('Saved qa_mobile_finance_visual_english.png');

  // Also desktop view
  await page.setViewportSize({ width: 1366, height: 950 });
  await page.waitForTimeout(800);
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'qa_desktop_finance_visual_english.png'),
    fullPage: true,
  });
  console.log('Saved qa_desktop_finance_visual_english.png');

  await browser.close();
}

run().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
