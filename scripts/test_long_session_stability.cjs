const { chromium } = require('playwright');

async function runLongSessionStability() {
  console.log('====================================================');
  console.log(' NEMO — LONG-SESSION STABILITY & LEAK BENCHMARK');
  console.log(' (Client-Side SPA Navigation & Interaction Cycles)');
  console.log('====================================================\n');

  const browser = await chromium.launch({
    headless: true,
    args: ['--enable-precise-memory-info', '--js-flags=--expose-gc']
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });

  const page = await context.newPage();

  const consoleErrors = [];
  const pageErrors = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  page.on('pageerror', err => {
    pageErrors.push(err.message || String(err));
  });

  const baseUrl = 'http://localhost:4173';
  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  await page.waitForSelector('main', { timeout: 10000 });

  // Initialize Demo Mode so all views have rich data
  await page.evaluate(async () => {
    localStorage.setItem('nemo_workspace_mode', 'demo');
  });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForSelector('main', { timeout: 10000 });

  // Dismiss onboarding modal if present
  const skipBtn = page.getByRole('button', { name: 'Skip customization' });
  try {
    await skipBtn.waitFor({ state: 'visible', timeout: 3500 });
    await skipBtn.click();
    await skipBtn.waitFor({ state: 'hidden', timeout: 3500 });
  } catch {
    // already completed
  }

  // Baseline garbage collect
  await page.evaluate(() => {
    if (window.gc) window.gc();
  });
  await page.waitForTimeout(500);

  const getHeapSizeMB = async () => {
    return await page.evaluate(() => {
      if (window.performance && (window.performance).memory) {
        return Math.round(((window.performance).memory.usedJSHeapSize / (1024 * 1024)) * 100) / 100;
      }
      return null;
    });
  };

  const initialHeap = await getHeapSizeMB();
  console.log(`[Baseline] Initial Heap Usage: ${initialHeap !== null ? initialHeap + ' MB' : 'N/A'}`);

  const navSelectors = [
    { name: 'Overview', selector: '.header-navigation a[href="/overview"]' },
    { name: 'Projects', selector: '.header-navigation a[href="/projects"]' },
    { name: 'Tasks', selector: '.header-navigation a[href="/tasks"]' },
    { name: 'Calendar', selector: '.header-navigation a[href="/calendar"]' },
    { name: 'Academics', selector: '.header-navigation a[href="/academics"]' },
    { name: 'Goals', selector: '.header-navigation a[href="/goals"]' },
    { name: 'Insights', selector: '.header-navigation a[href="/insights"]' },
    { name: 'Settings', selector: 'a[href="/settings"]' },
  ];

  const TOTAL_CYCLES = 50;
  console.log(`\nExecuting ${TOTAL_CYCLES} SPA navigation & interaction cycles...`);

  let totalTransitions = 0;
  let maxTransitionDurationMs = 0;
  const startTime = Date.now();

  for (let cycle = 1; cycle <= TOTAL_CYCLES; cycle++) {
    for (const nav of navSelectors) {
      const t0 = Date.now();
      const el = page.locator(nav.selector).first();
      await el.click();
      await page.waitForSelector('main');
      const duration = Date.now() - t0;

      if (duration > maxTransitionDurationMs) {
        maxTransitionDurationMs = duration;
      }
      totalTransitions++;
    }

    // Interactive actions every 5 cycles
    if (cycle % 5 === 0) {
      // 1. Search typing in Tasks view
      const tasksNav = page.locator('.header-navigation a[href="/tasks"]').first();
      await tasksNav.click();
      await page.waitForSelector('main');

      const searchInput = page.locator('input[placeholder*="Search"]');
      if (await searchInput.count() > 0) {
        await searchInput.fill('Release');
        await page.waitForTimeout(30);
        await searchInput.fill('Sprint');
        await page.waitForTimeout(30);
        await searchInput.fill('');
      }

      // 2. Open and close Quick Add modal
      const quickAddBtn = page.locator('button:has-text("Quick Add"), button:has-text("New Task")').first();
      if (await quickAddBtn.count() > 0) {
        await quickAddBtn.click();
        await page.waitForTimeout(50);
        await page.keyboard.press('Escape');
        await page.waitForTimeout(50);
      }

      // Run GC to check retained memory
      await page.evaluate(() => {
        if (window.gc) window.gc();
      });

      const currentHeap = await getHeapSizeMB();
      process.stdout.write(`  Cycle ${cycle}/${TOTAL_CYCLES}: Heap = ${currentHeap} MB\r`);
    }
  }

  const totalTimeSeconds = Math.round((Date.now() - startTime) / 1000);
  console.log(`\n\nCompleted ${TOTAL_CYCLES} cycles (${totalTransitions} SPA transitions) in ${totalTimeSeconds}s.`);

  // Final GC and heap evaluation
  await page.evaluate(() => {
    if (window.gc) window.gc();
  });
  await page.waitForTimeout(500);
  const finalHeap = await getHeapSizeMB();

  console.log('----------------------------------------------------');
  console.log(`Initial Heap:         ${initialHeap} MB`);
  console.log(`Final Heap:           ${finalHeap} MB`);
  console.log(`Heap Delta:           ${(finalHeap - initialHeap).toFixed(2)} MB`);
  console.log(`Max Transition Time:  ${maxTransitionDurationMs} ms`);
  console.log(`Page Uncaught Errors: ${pageErrors.length}`);
  console.log(`Console Errors:       ${consoleErrors.length}`);
  console.log('----------------------------------------------------\n');

  if (consoleErrors.length > 0) {
    console.error('Console Errors Detected:', consoleErrors.slice(0, 5));
  }
  if (pageErrors.length > 0) {
    console.error('Page Uncaught Errors Detected:', pageErrors.slice(0, 5));
  }

  const passMemory = finalHeap !== null ? (finalHeap - initialHeap) < 30 : true;
  const passErrors = consoleErrors.length === 0 && pageErrors.length === 0;
  const passTransitions = maxTransitionDurationMs < 1000;

  const passed = passMemory && passErrors && passTransitions;

  console.log(`Stability Verdict: [${passed ? 'PASS' : 'FAIL'}]`);

  await browser.close();

  if (!passed) {
    process.exit(1);
  }
}

runLongSessionStability().catch(err => {
  console.error('Stability Test Failed with exception:', err);
  process.exit(1);
});
