import { chromium } from 'playwright';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/USER/.gemini/antigravity/brain/1102514f-bdd3-4c27-a1bd-e5f999af1756';

async function run() {
  const browser = await chromium.launch({ headless: true });

  // 1. Desktop Test with Hover / 3D Tilt in Aurora Theme
  const desktopContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await desktopContext.newPage();

  await page.addInitScript(() => {
    localStorage.setItem('nemo_intro_seen', 'true');
    localStorage.setItem('nemo_onboarding_completed', 'true');
  });

  await page.goto('http://localhost:4173/insights', { waitUntil: 'networkidle' });
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);

  // Set theme to aurora in IndexedDB
  await page.evaluate(() => {
    return new Promise((resolve) => {
      const req = window.indexedDB.open('nemo_workspace', 1);
      req.onsuccess = () => {
        const db = req.result;
        const tx = db.transaction('settings', 'readwrite');
        const store = tx.objectStore('settings');
        store.put({
          id: 'default',
          displayName: 'My Workspace',
          theme: 'aurora',
          accent: 'mint',
          weekStartsOn: 1,
          hourFormat: '24h',
          reduceMotion: false,
          onboardingCompleted: true,
          databaseVersion: 1,
        });
        tx.oncomplete = () => resolve(true);
      };
      req.onerror = () => resolve(false);
    });
  });

  // Reload so aurora theme with live starfield is active
  await page.reload({ waitUntil: 'networkidle' });
  await page.keyboard.press('Escape');
  await page.waitForTimeout(800);

  // Move mouse across canvas to trigger interactive starfield aura
  await page.mouse.move(250, 150);
  await page.waitForTimeout(200);
  await page.mouse.move(500, 250);
  await page.waitForTimeout(200);

  // Hover over the 7-Day Velocity card to trigger 3D tilt and specular liquid gleam
  const velocityCard = page.locator('.insights-velocity-section');
  if (await velocityCard.count() > 0) {
    const box = await velocityCard.boundingBox();
    if (box) {
      await page.mouse.move(box.x + box.width * 0.72, box.y + box.height * 0.32);
      await page.waitForTimeout(600);
    }
  }

  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'qa_insights_aurora_liquid_glass.png'),
    fullPage: false,
  });
  console.log('Saved qa_insights_aurora_liquid_glass.png');

  // 2. Mobile View in Aurora Theme
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.addInitScript(() => {
    localStorage.setItem('nemo_intro_seen', 'true');
    localStorage.setItem('nemo_onboarding_completed', 'true');
  });

  await mobilePage.goto('http://localhost:4173/insights', { waitUntil: 'networkidle' });
  await mobilePage.keyboard.press('Escape');
  await mobilePage.waitForTimeout(500);

  await mobilePage.evaluate(() => {
    return new Promise((resolve) => {
      const req = window.indexedDB.open('nemo_workspace', 1);
      req.onsuccess = () => {
        const db = req.result;
        const tx = db.transaction('settings', 'readwrite');
        const store = tx.objectStore('settings');
        store.put({
          id: 'default',
          displayName: 'My Workspace',
          theme: 'aurora',
          accent: 'mint',
          weekStartsOn: 1,
          hourFormat: '24h',
          reduceMotion: false,
          onboardingCompleted: true,
          databaseVersion: 1,
        });
        tx.oncomplete = () => resolve(true);
      };
      req.onerror = () => resolve(false);
    });
  });

  await mobilePage.reload({ waitUntil: 'networkidle' });
  await mobilePage.keyboard.press('Escape');
  await mobilePage.waitForTimeout(800);

  await mobilePage.touchscreen.tap(200, 240);
  await mobilePage.waitForTimeout(400);

  await mobilePage.screenshot({
    path: path.join(ARTIFACT_DIR, 'qa_insights_mobile_aurora.png'),
    fullPage: false,
  });
  console.log('Saved qa_insights_mobile_aurora.png');

  await browser.close();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
