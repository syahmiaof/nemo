import { chromium } from 'playwright';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/USER/.gemini/antigravity/brain/1102514f-bdd3-4c27-a1bd-e5f999af1756';

async function run() {
  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });

  // 1. Desktop Context (1440 x 900)
  const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const dPage = await desktop.newPage();
  await dPage.addInitScript(() => {
    localStorage.setItem('nemo_intro_seen', 'true');
    localStorage.setItem('nemo_onboarding_completed', 'true');
    localStorage.setItem('nemo_welcome_seen', Date.now().toString());
    sessionStorage.setItem('nemo_session_welcomed', 'true');
    localStorage.setItem('nemo:workspace-mode', 'demo');
  });

  // Tasks: Desktop Active View
  await dPage.goto('http://localhost:4173/tasks', { waitUntil: 'domcontentloaded' });
  await dPage.waitForTimeout(500);
  await dPage.keyboard.press('Escape');
  await dPage.waitForTimeout(1000);
  await dPage.screenshot({ path: path.join(ARTIFACT_DIR, 'qa_desktop_tasks_active.png') });
  console.log('Saved qa_desktop_tasks_active.png');

  // Tasks: Desktop Completed Tab (Archived)
  const completedTaskTab = dPage.locator('button:has-text("Completed")').first();
  if (await completedTaskTab.count() > 0) {
    await completedTaskTab.click();
    await dPage.waitForTimeout(800);
    await dPage.screenshot({ path: path.join(ARTIFACT_DIR, 'qa_desktop_tasks_completed_tab.png') });
    console.log('Saved qa_desktop_tasks_completed_tab.png');
  }

  // Academics: Desktop Active View
  await dPage.goto('http://localhost:4173/academics', { waitUntil: 'domcontentloaded' });
  await dPage.waitForTimeout(500);
  await dPage.keyboard.press('Escape');
  await dPage.waitForTimeout(1000);
  await dPage.screenshot({ path: path.join(ARTIFACT_DIR, 'qa_desktop_academics_active.png') });
  console.log('Saved qa_desktop_academics_active.png');

  // Academics: Desktop Completed Tab (Archived)
  const completedAcadTab = dPage.locator('button:has-text("Completed")').first();
  if (await completedAcadTab.count() > 0) {
    await completedAcadTab.click();
    await dPage.waitForTimeout(800);
    await dPage.screenshot({ path: path.join(ARTIFACT_DIR, 'qa_desktop_academics_completed_tab.png') });
    console.log('Saved qa_desktop_academics_completed_tab.png');
  }

  // Projects: Desktop List with Auto-sort
  await dPage.goto('http://localhost:4173/projects', { waitUntil: 'domcontentloaded' });
  await dPage.waitForTimeout(500);
  await dPage.keyboard.press('Escape');
  await dPage.waitForTimeout(1000);
  await dPage.screenshot({ path: path.join(ARTIFACT_DIR, 'qa_desktop_projects_sorted.png') });
  console.log('Saved qa_desktop_projects_sorted.png');

  // 2. Mobile Context (390 x 844)
  const mobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const mPage = await mobile.newPage();
  await mPage.addInitScript(() => {
    localStorage.setItem('nemo_intro_seen', 'true');
    localStorage.setItem('nemo_onboarding_completed', 'true');
    localStorage.setItem('nemo_welcome_seen', Date.now().toString());
    sessionStorage.setItem('nemo_session_welcomed', 'true');
    localStorage.setItem('nemo:workspace-mode', 'demo');
  });

  // Tasks: Mobile Clean Active View
  await mPage.goto('http://localhost:4173/tasks', { waitUntil: 'domcontentloaded' });
  await mPage.waitForTimeout(500);
  await mPage.keyboard.press('Escape');
  await mPage.waitForTimeout(1000);
  await mPage.screenshot({ path: path.join(ARTIFACT_DIR, 'qa_mobile_tasks_clean.png') });
  console.log('Saved qa_mobile_tasks_clean.png');

  // Academics: Mobile Clean Active View
  await mPage.goto('http://localhost:4173/academics', { waitUntil: 'domcontentloaded' });
  await mPage.waitForTimeout(500);
  await mPage.keyboard.press('Escape');
  await mPage.waitForTimeout(1000);
  await mPage.screenshot({ path: path.join(ARTIFACT_DIR, 'qa_mobile_academics_clean.png') });
  console.log('Saved qa_mobile_academics_clean.png');

  // Projects: Mobile List with Auto-sort
  await mPage.goto('http://localhost:4173/projects', { waitUntil: 'domcontentloaded' });
  await mPage.waitForTimeout(500);
  await mPage.keyboard.press('Escape');
  await mPage.waitForTimeout(1000);
  await mPage.screenshot({ path: path.join(ARTIFACT_DIR, 'qa_mobile_projects_sorted.png') });
  console.log('Saved qa_mobile_projects_sorted.png');

  await browser.close();
  console.log('All screenshots completed successfully!');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
