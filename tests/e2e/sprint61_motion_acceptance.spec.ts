import { expect, test } from '@playwright/test';
import { gotoReady } from './gotoReady';

test.use({ video: 'on' });

declare global {
  interface Window {
    __sprint61Canvas: { clearRect: number; fill: number; arc: number; getImageData: number };
  }
}

async function instrumentCanvas(page: import('@playwright/test').Page) {
  await page.addInitScript({ content: `
    window.__sprint61Canvas = { clearRect: 0, fill: 0, arc: 0, getImageData: 0 };
    for (const method of ['clearRect', 'fill', 'arc', 'getImageData']) {
      const original = CanvasRenderingContext2D.prototype[method];
      CanvasRenderingContext2D.prototype[method] = function (...args) {
        window.__sprint61Canvas[method] += 1;
        return original.apply(this, args);
      };
    }
  ` });
}

async function resetCanvasCounts(page: import('@playwright/test').Page) {
  await page.evaluate(() => { window.__sprint61Canvas = { clearRect: 0, fill: 0, arc: 0, getImageData: 0 }; });
}

test('Spark quote morph stays readable at rest and completes its staged canvas motion', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile-chrome', 'Detailed phase capture runs on desktop; mobile navigation is covered separately.');
  await page.setViewportSize({ width: 1440, height: 900 });
  await instrumentCanvas(page);
  await page.addInitScript(() => localStorage.setItem('nemo:workspace-mode', 'demo'));
  await gotoReady(page, '/overview');

  const card = page.locator('section[aria-label="Spark of focus motivational quote"]');
  const quote = card.locator('p').first();
  await expect(quote).toBeVisible();
  const pauseButton = card.getByRole('button', { name: 'Pause quote rotation' });
  if (await pauseButton.isVisible()) await pauseButton.click();
  await page.mouse.move(5, 5);
  await page.locator('body').click({ position: { x: 5, y: 5 } });
  await page.waitForTimeout(1800);
  await resetCanvasCounts(page);
  await page.waitForTimeout(900);
  await expect.poll(() => page.evaluate(() => window.__sprint61Canvas)).toEqual({ clearRect: 0, fill: 0, arc: 0, getImageData: 0 });
  await card.screenshot({ path: 'docs/evidence/sprint61/quote-idle.png' });

  await card.getByRole('button', { name: 'Next motivational quote' }).click();
  await page.mouse.move(5, 5);

  const canvas = card.locator('canvas[aria-hidden="true"]');
  await expect(canvas).toBeVisible();
  await expect.poll(() => canvas.getAttribute('data-motion-phase')).not.toBeNull();
  await expect.poll(() => page.evaluate(() => window.__sprint61Canvas.arc)).toBeGreaterThan(0);
  await expect(quote).toHaveCSS('opacity', '0');
  await expect(card.locator('canvas')).toHaveCount(1);
  await expect(quote).not.toHaveText('');
  await expect(quote).toHaveCSS('opacity', '1');
  await card.screenshot({ path: 'docs/evidence/sprint61/quote-complete.png' });
  console.log(`[Sprint 6.1] Active morph canvas calls: ${JSON.stringify(await page.evaluate(() => window.__sprint61Canvas))}`);

  await resetCanvasCounts(page);
  await page.waitForTimeout(1000);
  await expect.poll(() => page.evaluate(() => window.__sprint61Canvas)).toEqual({ clearRect: 0, fill: 0, arc: 0, getImageData: 0 });
  const video = page.video();
  await page.context().close();
  if (video) await video.saveAs('docs/evidence/sprint61/quote-morph.webm');
});

test('reduced motion changes the quote without drawing particle frames', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await instrumentCanvas(page);
  await page.addInitScript(() => localStorage.setItem('nemo:workspace-mode', 'demo'));
  await gotoReady(page, '/overview');

  const card = page.locator('section[aria-label="Spark of focus motivational quote"]');
  const quote = card.locator('p').first();
  const before = await quote.textContent();
  await card.getByRole('button', { name: 'Next motivational quote' }).click();
  await expect(quote).not.toHaveText(before || '');
  await expect(quote).toHaveCSS('opacity', '1');
  await expect(card.locator('canvas')).toHaveCount(1);
  await expect.poll(() => page.evaluate(() => window.__sprint61Canvas)).toEqual({ clearRect: 0, fill: 0, arc: 0, getImageData: 0 });
});
