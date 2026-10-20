const { chromium } = require('@playwright/test');

async function testAccessibilityZoom() {
  const browser = await chromium.launch({ headless: true });

  const zoomLevels = [
    { name: '100% Standard', viewport: { width: 1280, height: 800 }, scale: 1 },
    { name: '200% Zoom', viewport: { width: 640, height: 400 }, scale: 2 },
    { name: '400% Extreme Zoom', viewport: { width: 320, height: 200 }, scale: 4 },
  ];

  console.log('--- ACCESSIBILITY ZOOM & HORIZONTAL OVERFLOW AUDIT ---');

  for (const z of zoomLevels) {
    const context = await browser.newContext({
      viewport: z.viewport,
      deviceScaleFactor: z.scale,
    });
    const page = await context.newPage();

    await page.goto('http://localhost:4173/overview');
    await page.waitForLoadState('networkidle');

    // Dismiss onboarding if present
    const skipBtn = page.getByRole('button', { name: 'Skip customization' });
    try {
      await skipBtn.waitFor({ state: 'visible', timeout: 2000 });
      await skipBtn.click();
    } catch {}

    const routes = ['/overview', '/tasks', '/projects', '/calendar', '/settings'];
    const results = [];

    for (const r of routes) {
      await page.goto(`http://localhost:4173${r}`);
      await page.waitForTimeout(300);

      const overflow = await page.evaluate(() => {
        return {
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
          hasHorizontalScroll: document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
        };
      });

      results.push({ route: r, overflow });
    }

    console.log(`Zoom ${z.name}:`, results);
    await context.close();
  }

  await browser.close();
}

testAccessibilityZoom().catch(console.error);
