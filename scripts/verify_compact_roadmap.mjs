import { chromium } from 'playwright';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/USER/.gemini/antigravity/brain/1102514f-bdd3-4c27-a1bd-e5f999af1756';

async function run() {
  const browser = await chromium.launch({ headless: true });

  // Mobile 390x844 viewport
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
  });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto('http://localhost:4173/overview', { waitUntil: 'networkidle' });
  await mobilePage.waitForTimeout(1000);

  // Dismiss splash screen if present
  await mobilePage.keyboard.press('Escape');
  await mobilePage.waitForTimeout(600);

  const mobileSection = mobilePage.locator('section[aria-labelledby="journey-roadmap-title"]');
  await mobileSection.waitFor({ state: 'visible', timeout: 5000 });
  await mobileSection.scrollIntoViewIfNeeded();
  await mobilePage.waitForTimeout(600);

  await mobilePage.screenshot({
    path: path.join(ARTIFACT_DIR, 'qa_mobile_roadmap_compact.png'),
    fullPage: false,
  });
  console.log('Saved qa_mobile_roadmap_compact.png');

  await browser.close();
  console.log('Mobile verification done!');
}

run().catch((err) => {
  console.error('Script failed:', err);
  process.exit(1);
});
