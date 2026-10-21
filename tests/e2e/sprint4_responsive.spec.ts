import { test, expect, type Page } from '@playwright/test';

async function assertReflow(page: Page) {
  const result = await page.evaluate(() => {
    const masked = ['body', '.nemo-app', '.app-shell'].filter(selector =>
      ['hidden', 'clip'].includes(getComputedStyle(document.querySelector(selector)!).overflowX));
    const clipped = [...document.querySelectorAll<HTMLElement>('main button, main input, main select, header a, header button')].filter(el => {
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) return false;
      for (let parent = el.parentElement; parent && parent !== document.body; parent = parent.parentElement) {
        if (['auto', 'scroll'].includes(getComputedStyle(parent).overflowX) && parent.scrollWidth > parent.clientWidth + 1) return false;
      }
      return r.right > innerWidth + 1 || r.left < -1;
    }).map(el => el.getAttribute('aria-label') || el.textContent?.trim());
    return { width: innerWidth, scrollWidth: document.documentElement.scrollWidth, masked, clipped };
  });
  expect(result.masked).toEqual([]);
  expect(result.clipped).toEqual([]);
  expect(result.scrollWidth).toBeLessThanOrEqual(result.width + 1);
}

test.describe('Sprint 4 — responsive, branding and motion regressions', () => {
  test('all modules and detail screens reflow without page masking', async ({ page, isMobile }) => {
    test.setTimeout(120_000);
    await page.addInitScript(() => localStorage.setItem('nemo:workspace-mode', 'demo'));
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const widths = isMobile ? [320, 360, 375, 390, 430] : [768, 1440];
    for (const width of widths) {
      await page.setViewportSize({ width, height: 900 });
      for (const route of ['overview', 'projects', 'tasks', 'calendar', 'academics', 'goals', 'insights', 'settings', 'projects/demo-project-1', 'goals/demo-goal-1']) {
        await page.goto(`/${route}`);
        await expect(page.locator('main')).toBeVisible();
        await page.evaluate(() => document.fonts.ready);
        await expect(page.getByText(/Demo Workspace: Exploring fictional sample data/)).toBeVisible();
        await assertReflow(page);
      }
    }
  });

  test('mobile More sheet traps focus, closes with Escape and restores its trigger', async ({ page }) => {
    await page.setViewportSize({width: 390, height: 844});
    await page.addInitScript(() => localStorage.setItem('nemo:workspace-mode', 'demo'));
    await page.goto('/overview');
    const more = page.getByRole('button', {name: 'Open more navigation options'});
    await more.click();
    const dialog = page.getByRole('dialog', {name: 'Workspace Utilities & Modules'});
    await expect(dialog).toBeVisible();
    await dialog.getByRole('link', {name: /Settings/}).focus();
    await page.keyboard.press('Tab');
    await expect(dialog.getByRole('button', {name: 'Close dialog'})).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
    await expect(more).toBeFocused();
    await more.click();
    await page.getByRole('dialog').getByRole('link', {name: /Settings/}).click();
    await expect(page.getByRole('heading', {name: 'Settings', exact: true})).toBeVisible();
    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden');
  });

  test('320px forms keep fields and submit actions reachable; settings supports keyboard tabs', async ({ page }) => {
    await page.setViewportSize({width: 320, height: 640});
    await page.addInitScript(() => localStorage.setItem('nemo:workspace-mode', 'demo'));
    await page.goto('/projects');
    await page.getByRole('button', {name: 'New Project', exact: true}).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await page.getByLabel('Project Title').fill('Mobile form verification');
    const submit = dialog.getByRole('button', {name: 'Create Project', exact: true});
    await submit.scrollIntoViewIfNeeded();
    await expect(submit).toBeInViewport();
    const bounds = await dialog.boundingBox();
    expect(bounds!.width).toBeLessThanOrEqual(320);
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
    await page.goto('/settings');
    await page.getByRole('tab', {name: 'Appearance', exact: true}).focus();
    await page.keyboard.press('End');
    await expect(page.getByRole('tab', {name: 'About & Notice'})).toBeFocused();
    await expect(page.getByRole('tab', {name: 'About & Notice'})).toHaveAttribute('aria-selected', 'true');
    await page.getByRole('tab', {name: 'Data & Backups'}).click();
    await expect(page.getByRole('button', {name: /Export Backup/})).toBeVisible();
    await assertReflow(page);
  });

  test('brand assets and fonts load locally from a cold context', async ({ page }) => {
    const external: string[] = [];
    page.on('request', request => {
      const url = new URL(request.url());
      if (url.protocol.startsWith('http') && !['localhost','127.0.0.1'].includes(url.hostname)) external.push(url.href);
    });
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    expect(external).toEqual([]);
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', /nemo/);
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image');
    const dimensions = await page.evaluate(async () => {
      const img = new Image(); img.src = '/brand/nemo-og.png'; await img.decode();
      return [img.naturalWidth, img.naturalHeight];
    });
    expect(dimensions).toEqual([1200,630]);
    const manifest = await (await page.request.get('/manifest.webmanifest')).json();
    expect(manifest.icons.some((icon: {purpose?: string}) => icon.purpose === 'maskable')).toBe(true);
  });

  test('rapid routing keeps one stable shell and reduced motion responds immediately', async ({ page }) => {
    await page.setViewportSize({width:1440,height:900});
    await page.addInitScript(() => localStorage.setItem('nemo:workspace-mode', 'demo'));
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/overview');
    await page.locator('.nemo-chart').waitFor();
    await page.locator('header').evaluate(el => el.setAttribute('data-persistence-probe','same'));
    for (const route of ['Projects','Tasks','Calendar','Goals','Insights','Overview']) {
      await page.getByRole('navigation', {name:'Main Navigation', exact:true}).getByRole('link',{name:route,exact:true}).click();
    }
    await expect(page.locator('.route-content')).toHaveAttribute('aria-busy','false');
    await expect(page.locator('header')).toHaveAttribute('data-persistence-probe','same');
    await expect(page.getByRole('heading',{name:'Make room for progress.'})).toBeVisible();
    await page.emulateMedia({reducedMotion:'reduce'});
    await expect(page.locator('.nemo-chart')).toHaveAttribute('data-motion','reduced');
    await page.getByRole('button',{name:'Projects',exact:true}).click();
    await expect.poll(() => page.locator('.route-content').evaluate(el => Number(getComputedStyle(el).opacity))).toBeGreaterThan(0.99);
    expect(errors).toEqual([]);
  });
});
