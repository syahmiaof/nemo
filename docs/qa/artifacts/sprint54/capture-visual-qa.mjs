import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const base = process.env.BASE_URL ?? 'http://127.0.0.1:4174';
const out = resolve('docs/qa/artifacts/sprint54');
const routes = ['overview', 'projects', 'tasks', 'calendar', 'academics', 'goals', 'insights', 'settings'];
const viewports = [
  { width: 390, height: 844, label: 'mobile' },
  { width: 1440, height: 900, label: 'desktop' },
];
const themes = [
  { label: 'Midnight', key: 'midnight', selector: /Midnight/ },
  { label: 'Daylight', key: 'daylight', selector: /Daylight/ },
  { label: 'Aurora', key: 'aurora', selector: /Aurora/ },
];

await mkdir(out, { recursive: true });
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
const errors = [];
page.on('pageerror', (error) => errors.push(String(error)));

async function waitForSettledPage() {
  await page.locator('.route-content').waitFor({ state: 'visible', timeout: 10000 });
  const welcome = page.getByRole('dialog', { name: 'Welcome to Nemo' });
  await welcome.waitFor({ state: 'visible', timeout: 1200 }).catch(() => undefined);
  if (await welcome.isVisible().catch(() => false)) {
    await welcome.click();
    await welcome.waitFor({ state: 'hidden', timeout: 5000 });
  }
  const onboarding = page.getByRole('button', { name: 'Skip customization' });
  if (await onboarding.isVisible().catch(() => false)) {
    await onboarding.click();
    await onboarding.waitFor({ state: 'hidden', timeout: 5000 });
  }
  await page.waitForFunction(() => document.querySelector('.route-content')?.getAttribute('aria-busy') === 'false', null, { timeout: 10000 });
  if (await welcome.isVisible().catch(() => false)) throw new Error('Welcome overlay is still visible after dismissal');
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(350);
}

try {
  await page.goto(`${base}/overview`, { waitUntil: 'domcontentloaded' });
  await waitForSettledPage();
  const exploreDemo = page.getByRole('button', { name: /Explore demo/ }).first();
  if (await exploreDemo.isVisible().catch(() => false)) {
    await exploreDemo.click();
    await page.getByText(/Demo Workspace: Exploring fictional sample data/).waitFor({ timeout: 10000 });
  }

  const captures = [];
  for (const theme of themes) {
    await page.goto(`${base}/settings`, { waitUntil: 'domcontentloaded' });
    await waitForSettledPage();
    const themeOption = page.getByRole('button', { name: theme.selector }).first();
    if (await themeOption.count()) {
      await themeOption.click();
      await page.waitForFunction((key) => document.documentElement.dataset.theme === key, theme.key, { timeout: 7000 });
    }

    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      for (const route of routes) {
        await page.goto(`${base}/${route}`, { waitUntil: 'domcontentloaded' });
        await waitForSettledPage();
        const pageTitle = await page.locator('main').innerText().then((text) => text.slice(0, 100).replace(/\s+/g, ' '));
        const file = `${theme.key}-${viewport.label}-${route}.png`;
        console.log(`Capture ${theme.label} ${viewport.label} ${route}`);
        await page.screenshot({ path: resolve(out, file), animations: 'disabled', timeout: 15000 });
        captures.push({ theme: theme.label, viewport: `${viewport.width}x${viewport.height}`, route, file, pageTitle });
      }
    }
  }

  await writeFile(resolve(out, 'visual-capture-results.json'), JSON.stringify({ base, capturedAt: new Date().toISOString(), count: captures.length, errors, captures }, null, 2));
  console.log(JSON.stringify({ count: captures.length, errors }, null, 2));
} finally {
  await context.close();
  await browser.close();
}
