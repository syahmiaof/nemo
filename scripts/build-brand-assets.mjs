// Rasterize repository-owned SVG and resize approved/generated artwork without redrawing it.
import { chromium } from '@playwright/test';
import { readFile, writeFile } from 'node:fs/promises';

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ deviceScaleFactor: 1 });
  const svg = await readFile('public/nemo-icon.svg', 'utf8');
  const mark = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  async function raster(src, width, height, target, padding = 0) {
    await page.setViewportSize({ width, height });
    await page.setContent(`<body style="margin:0;background:#0a1222;display:grid;place-items:center;width:100vw;height:100vh"><img style="display:block;width:calc(100% - ${padding * 2}px);height:calc(100% - ${padding * 2}px);object-fit:contain" src="${src}"></body>`);
    await page.locator('img').evaluate(img => img.decode());
    await page.screenshot({ path: target, omitBackground: false });
  }
  for (const [size, file] of [[32, 'favicon.png'], [180, 'apple-touch-icon.png'], [192, 'nemo-icon-192.png'], [512, 'nemo-icon-512.png']]) {
    await raster(mark, size, size, `public/${file}`);
  }
  await raster(mark, 512, 512, 'public/nemo-maskable-512.png', 76);
  const png = await readFile('public/favicon.png');
  const header = Buffer.alloc(22);
  header.writeUInt16LE(1, 2); header.writeUInt16LE(1, 4);
  header[6] = 32; header[7] = 32;
  header.writeUInt16LE(1, 10); header.writeUInt16LE(32, 12);
  header.writeUInt32LE(png.length, 14); header.writeUInt32LE(22, 18);
  await writeFile('public/favicon.ico', Buffer.concat([header, png]));
  for (const [source, target] of [
    ['references/nemo-social-generated.png', 'public/brand/nemo-og.png'],
    ['references/nemo-approved-logo.png', 'public/brand/nemo-og-alternate.png'],
  ]) {
    const bytes = await readFile(source);
    await raster(`data:image/png;base64,${bytes.toString('base64')}`, 1200, 630, target);
  }
  console.log('Brand raster assets generated; Open Graph images: 1200 × 630.');
} finally { await browser.close(); }
