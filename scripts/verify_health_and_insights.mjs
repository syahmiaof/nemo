import { chromium } from '@playwright/test';
import { spawn } from 'child_process';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/USER/.gemini/antigravity/brain/1102514f-bdd3-4c27-a1bd-e5f999af1756';

async function waitForServer(url, maxRetries = 20) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return true;
    } catch {
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  return false;
}

async function run() {
  console.log('1. Starting preview server on port 4173...');
  const preview = spawn('npm.cmd', ['run', 'preview', '--', '--port', '4173'], {
    shell: true,
    stdio: 'ignore',
  });

  const ready = await waitForServer('http://localhost:4173');
  if (!ready) {
    console.error('Server failed to start');
    preview.kill();
    process.exit(1);
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1366, height: 900 },
  });
  const page = await context.newPage();

  console.log('2. Visiting /health on Desktop...');
  await page.goto('http://localhost:4173/health', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  // Dismiss welcome overlay if present
  const welcomeDismiss = page.locator('text=Workspace ready');
  if (await welcomeDismiss.isVisible()) {
    await welcomeDismiss.click();
    await page.waitForTimeout(500);
  }

  // Capture navbar with Ibadah
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'qa_desktop_navbar_with_ibadah.png'),
    fullPage: false,
  });
  console.log('Saved qa_desktop_navbar_with_ibadah.png');

  // Click +250ml and +500ml
  console.log('3. Logging hydration entries...');
  const btn250 = page.locator('button:has-text("+250 ml")');
  if (await btn250.isVisible()) {
    await btn250.click();
    await page.waitForTimeout(500);
  }

  const btn500 = page.locator('button:has-text("+500 ml")');
  if (await btn500.isVisible()) {
    await btn500.click();
    await page.waitForTimeout(500);
  }

  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'qa_desktop_health_hydration_logged.png'),
    fullPage: false,
  });
  console.log('Saved qa_desktop_health_hydration_logged.png');

  // Click Edit on the first entry
  console.log('4. Clicking Edit on hydration log entry...');
  const editBtns = page.locator('button[aria-label="Edit hydration log"]');
  if (await editBtns.count() > 0) {
    await editBtns.first().click();
    await page.waitForTimeout(500);

    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'qa_desktop_health_hydration_edit_modal.png'),
    });
    console.log('Saved qa_desktop_health_hydration_edit_modal.png');

    // Close edit modal
    const cancelBtn = page.locator('button:has-text("Batal")');
    if (await cancelBtn.isVisible()) {
      await cancelBtn.click();
      await page.waitForTimeout(300);
    }
  }

  // Click Ubah Sasaran
  console.log('5. Clicking Ubah Sasaran...');
  const ubahSasaranBtn = page.locator('button:has-text("Ubah Sasaran")');
  if (await ubahSasaranBtn.isVisible()) {
    await ubahSasaranBtn.click();
    await page.waitForTimeout(500);

    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'qa_desktop_health_goal_modal.png'),
    });
    console.log('Saved qa_desktop_health_goal_modal.png');

    const cancelGoalBtn = page.locator('button:has-text("Batal")');
    if (await cancelGoalBtn.isVisible()) {
      await cancelGoalBtn.click();
      await page.waitForTimeout(300);
    }
  }

  // Visit /insights
  console.log('6. Visiting /insights on Desktop...');
  await page.goto('http://localhost:4173/insights', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'qa_desktop_insights_hub.png'),
    fullPage: true,
  });
  console.log('Saved qa_desktop_insights_hub.png');

  await browser.close();
  preview.kill();
  console.log('Playwright verification finished cleanly.');
  process.exit(0);
}

run().catch((err) => {
  console.error('Playwright error:', err);
  process.exit(1);
});
