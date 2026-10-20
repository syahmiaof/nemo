const { chromium } = require('@playwright/test');

async function runBenchmark() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  console.log('--- STARTING NEMO PERFORMANCE BASELINE BENCHMARK ---');

  // Set up Long Task Observer before navigation
  await page.addInitScript(() => {
    window.__longTasks = [];
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          window.__longTasks.push({
            name: entry.name,
            startTime: entry.startTime,
            duration: entry.duration,
          });
        }
      });
      observer.observe({ entryTypes: ['longtask'] });
    } catch (e) {
      // not all environments support longtask
    }
  });

  const t0 = Date.now();
  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' });
  const initialLoadTimeMs = Date.now() - t0;

  // Extract Navigation and Paint Timings
  const timings = await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0] || {};
    const paints = performance.getEntriesByType('paint');
    const fcp = paints.find((p) => p.name === 'first-contentful-paint');
    const fp = paints.find((p) => p.name === 'first-paint');
    const mem = performance.memory
      ? {
          usedJSHeapMB: (performance.memory.usedJSHeapSize / 1048576).toFixed(2),
          totalJSHeapMB: (performance.memory.totalJSHeapSize / 1048576).toFixed(2),
          jsHeapLimitMB: (performance.memory.jsHeapSizeLimit / 1048576).toFixed(2),
        }
      : null;

    return {
      ttfb: (nav.responseStart - nav.requestStart).toFixed(2),
      domContentLoaded: (nav.domContentLoadedEventEnd - nav.startTime).toFixed(2),
      loadComplete: (nav.loadEventEnd - nav.startTime).toFixed(2),
      firstPaint: fp ? fp.startTime.toFixed(2) : null,
      firstContentfulPaint: fcp ? fcp.startTime.toFixed(2) : null,
      memory: mem,
    };
  });

  console.log('Initial Navigation Timings:', timings);

  // Dismiss onboarding modal if visible
  const skipBtn = page.getByRole('button', { name: 'Skip customization' });
  try {
    await skipBtn.waitFor({ state: 'visible', timeout: 3000 });
    await skipBtn.click();
    await skipBtn.waitFor({ state: 'hidden', timeout: 3000 });
    console.log('Onboarding modal dismissed.');
  } catch {
    console.log('No onboarding modal needed.');
  }

  // Switch to Demo mode to test realistic populated workload
  console.log('Switching to Demo Mode to benchmark realistic dataset (18 projects, 150 tasks)...');
  await page.click('button:has-text("Explore demo")');
  await page.waitForTimeout(500);

  // Measure Navigation Latency across routes in Demo mode
  const routes = [
    { name: 'Overview to Tasks', href: '/tasks' },
    { name: 'Tasks to Projects', href: '/projects' },
    { name: 'Projects to Calendar', href: '/calendar' },
    { name: 'Calendar to Academics', href: '/academics' },
    { name: 'Academics to Goals', href: '/goals' },
    { name: 'Goals to Insights', href: '/insights' },
    { name: 'Insights to Settings', href: '/settings' },
    { name: 'Settings to Overview', href: '/overview' },
  ];

  const navigationLatencies = [];
  for (const r of routes) {
    const start = performance.now();
    await page.click(`a[href="${r.href}"]`);
    await page.waitForLoadState('domcontentloaded');
    // wait for next animation frame
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve, 0))));
    const duration = performance.now() - start;
    navigationLatencies.push({ route: r.name, durationMs: Number(duration.toFixed(2)) });
  }
  console.log('Route Transition Latencies (ms):', navigationLatencies);

  // Measure Calendar Month Navigation in Demo Mode
  await page.click('a[href="/calendar"]');
  await page.waitForTimeout(300);
  const calStart = performance.now();
  const nextMonthBtn = page.locator('button:has-text("Next")').first();
  if (await nextMonthBtn.isVisible()) {
    await nextMonthBtn.click();
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(r)));
  }
  const calDuration = performance.now() - calStart;

  // Measure Insights Metric Switch in Demo Mode
  await page.click('a[href="/insights"]');
  await page.waitForTimeout(300);
  const insightsStart = performance.now();
  const projectsMetricBtn = page.locator('button:has-text("Projects")').first();
  if (await projectsMetricBtn.isVisible()) {
    await projectsMetricBtn.click();
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(r)));
  }
  const insightsDuration = performance.now() - insightsStart;

  // Measure Modal Open/Close Latency
  const quickAddStart = performance.now();
  await page.click('button[aria-label="Quick Add"]');
  await page.waitForSelector('[role="dialog"], [data-modal-overlay]');
  const quickAddOpenMs = performance.now() - quickAddStart;

  const quickAddCloseStart = performance.now();
  await page.keyboard.press('Escape');
  await page.waitForTimeout(100);
  const quickAddCloseMs = performance.now() - quickAddCloseStart;

  // Measure IndexedDB Query Speeds in Demo DB
  const dbPerformance = await page.evaluate(async () => {
    return new Promise((resolve) => {
      const req = indexedDB.open('NemoDemoDatabase_v1');
      req.onsuccess = async () => {
        const db = req.result;
        const tx = db.transaction(['tasks', 'projects', 'milestones'], 'readonly');
        const tStart = performance.now();
        const tasksReq = tx.objectStore('tasks').getAll();
        tasksReq.onsuccess = () => {
          const tasksFetchMs = performance.now() - tStart;
          const projectsReq = tx.objectStore('projects').getAll();
          projectsReq.onsuccess = () => {
            const projectsFetchMs = performance.now() - tStart - tasksFetchMs;
            resolve({
              tasksCount: tasksReq.result.length,
              tasksFetchMs: Number(tasksFetchMs.toFixed(2)),
              projectsCount: projectsReq.result.length,
              projectsFetchMs: Number(projectsFetchMs.toFixed(2)),
            });
          };
        };
      };
      req.onerror = () => resolve({ error: 'Failed to open Demo DB' });
    });
  });

  // Long tasks collected
  const longTasks = await page.evaluate(() => window.__longTasks || []);
  const memoryAfter = await page.evaluate(() =>
    performance.memory
      ? {
          usedJSHeapMB: (performance.memory.usedJSHeapSize / 1048576).toFixed(2),
          totalJSHeapMB: (performance.memory.totalJSHeapSize / 1048576).toFixed(2),
        }
      : null
  );

  console.log('Calendar Month Switch (ms):', calDuration.toFixed(2));
  console.log('Insights Metric Switch (ms):', insightsDuration.toFixed(2));
  console.log('QuickAdd Modal Open (ms):', quickAddOpenMs.toFixed(2));
  console.log('QuickAdd Modal Close (ms):', quickAddCloseMs.toFixed(2));
  console.log('IndexedDB Demo Queries:', dbPerformance);
  console.log('Memory After Navigations:', memoryAfter);
  console.log('Long Tasks Count (>50ms):', longTasks.length);

  await browser.close();

  const report = {
    testEnvironment: {
      browser: 'Chromium (Playwright 1.64.1)',
      viewport: '1440x900',
      os: process.platform,
      nodeVersion: process.version,
    },
    bundleSizes: {
      javascriptUncompressedKB: 675.31,
      javascriptGzipKB: 204.83,
      cssUncompressedKB: 66.77,
      cssGzipKB: 14.2,
      precacheTotalEntries: 16,
      precacheTotalKiB: 755.63,
    },
    initialLoadTimeMs,
    timings,
    navigationLatencies,
    interactionLatencies: {
      calendarMonthSwitchMs: Number(calDuration.toFixed(2)),
      insightsMetricSwitchMs: Number(insightsDuration.toFixed(2)),
      modalOpenMs: Number(quickAddOpenMs.toFixed(2)),
      modalCloseMs: Number(quickAddCloseMs.toFixed(2)),
    },
    dbPerformance,
    memoryAfter,
    longTasksCount: longTasks.length,
    longTasksSample: longTasks.slice(0, 5),
  };

  console.log('\n--- FINAL BENCHMARK JSON ---');
  console.log(JSON.stringify(report, null, 2));
}

runBenchmark().catch(console.error);
