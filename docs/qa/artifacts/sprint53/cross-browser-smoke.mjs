import { chromium, firefox, webkit } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

const routes = ['overview', 'projects', 'tasks', 'calendar', 'academics', 'goals', 'insights', 'settings'];
const results = [];
for (const [engineName, engine] of [['chromium', chromium], ['firefox', firefox], ['webkit', webkit]]) {
  let browser;
  try {
    browser = await engine.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    for (const route of routes) {
      try {
        await page.goto(`http://127.0.0.1:4174/${route}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await page.locator('main').waitFor({ state: 'visible', timeout: 10000 });
        await page.waitForTimeout(100);
        const state = await page.evaluate(() => ({
          width: document.documentElement.clientWidth,
          scrollWidth: document.documentElement.scrollWidth,
          heading: document.querySelector('main h1')?.textContent?.trim() ?? '',
        }));
        results.push({ engine: engineName, route, pass: state.scrollWidth <= state.width, ...state });
      } catch (error) {
        results.push({ engine: engineName, route, pass: false, error: String(error).slice(0, 300) });
      }
    }
    results.push({ engine: engineName, consoleErrors: errors.slice(0, 20) });
    await context.close();
  } catch (error) {
    results.push({ engine: engineName, launchError: String(error).slice(0, 500) });
  } finally {
    await browser?.close().catch(() => {});
  }
}
const report = { createdAt: new Date().toISOString(), viewport: '390x844', routes, results };
await writeFile(new URL('./artifacts/cross-browser-smoke-results.json', import.meta.url), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
