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
    viewport: { width: 1366, height: 950 },
  });
  const page = await context.newPage();

  console.log('2. Visiting /ibadah on Desktop...');
  await page.goto('http://localhost:4173/ibadah', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'qa_desktop_ibadah_hub.png'),
    fullPage: true,
  });
  console.log('Saved qa_desktop_ibadah_hub.png');

  console.log('3. Opening Fidyah Calculator Modal...');
  const fidyahTab = page.locator('button:has-text("Puasa & Fidyah")');
  if (await fidyahTab.isVisible()) {
    await fidyahTab.click();
    await page.waitForTimeout(1000);
  }
  const calcBtn = page.locator('button:has-text("Kira Fidyah / Tambah Rekod")');
  if (await calcBtn.isVisible()) {
    await calcBtn.click();
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'qa_desktop_fidyah_calculator_modal.png'),
    });
    console.log('Saved qa_desktop_fidyah_calculator_modal.png');
    // Close modal
    const cancelBtn = page.locator('button:has-text("Batal")');
    if (await cancelBtn.isVisible()) await cancelBtn.click();
  }

  console.log('4. Visiting /finance on Desktop...');
  await page.goto('http://localhost:4173/finance', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'qa_desktop_finance_overview.png'),
    fullPage: true,
  });
  console.log('Saved qa_desktop_finance_overview.png');

  console.log('5. Viewing Income Streams...');
  const incomeTab = page.locator('button:has-text("Income Streams")');
  if (await incomeTab.isVisible()) {
    await incomeTab.click();
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'qa_desktop_finance_income_streams.png'),
      fullPage: true,
    });
    console.log('Saved qa_desktop_finance_income_streams.png');
  }

  console.log('6. Testing Debt Modal with Lumpsum option...');
  const debtsTab = page.locator('button:has-text("Debt Payoff")');
  if (await debtsTab.isVisible()) {
    await debtsTab.click();
    await page.waitForTimeout(1000);
  }
  const addDebtBtn = page.locator('button:has-text("Add Debt")');
  if (await addDebtBtn.isVisible()) {
    await addDebtBtn.click();
    await page.waitForTimeout(1000);
    // Click lumpsum option
    const lumpsumOption = page.locator('button:has-text("Hutang Fleksibel / Lumpsum")');
    if (await lumpsumOption.isVisible()) {
      await lumpsumOption.click();
      await page.waitForTimeout(500);
    }
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'qa_desktop_finance_lumpsum_debt_modal.png'),
    });
    console.log('Saved qa_desktop_finance_lumpsum_debt_modal.png');
    const cancelBtn = page.locator('button:has-text("Cancel")');
    if (await cancelBtn.isVisible()) await cancelBtn.click();
  }

  console.log('7. Mobile Viewport /ibadah...');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('http://localhost:4173/ibadah', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'qa_mobile_ibadah_hub.png'),
    fullPage: true,
  });
  console.log('Saved qa_mobile_ibadah_hub.png');

  await browser.close();
  preview.kill();
  console.log('Verification completed cleanly!');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
