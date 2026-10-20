import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
const base = process.env.BASE_URL || 'http://127.0.0.1:5184';
const out = 'docs/sprint4';
await mkdir(out, {recursive:true});
const browser = await chromium.launch();
const context = await browser.newContext({reducedMotion:'reduce'});
await context.addInitScript(() => localStorage.setItem('nemo:workspace-mode','demo'));
const page = await context.newPage();
const errors = [];
page.on('pageerror', error => errors.push(error.message));
const results = [];
try {
  await page.goto(`${base}/projects`);
  await page.locator('a[href^="/projects/demo-"]').first().waitFor();
  const project = await page.locator('a[href^="/projects/demo-"]').first().getAttribute('href');
  await page.goto(`${base}/goals`);
  const goal = await page.locator('a[href^="/goals/demo-"]').first().getAttribute('href');
  for (const width of [320,360,375,390,430,768,1440]) {
    await page.setViewportSize({width,height:width>=768?900:844});
    for (const route of ['/overview','/projects','/tasks','/calendar','/academics','/goals','/insights','/settings',project,goal]) {
      await page.goto(base+route);
      await page.locator('main').waitFor();
      await page.waitForTimeout(160);
      await page.evaluate(() => document.fonts.ready);
      const result = await page.evaluate(() => {
        const outside = [...document.querySelectorAll('main *,header *')].filter(el => {
          const r=el.getBoundingClientRect(), cs=getComputedStyle(el);
          if (r.width===0 || r.height===0 || cs.position==='absolute' || cs.position==='fixed' || el.closest('.sr-only') || ['svg','path','circle','g','defs'].includes(el.tagName)) return false;
          // Intentional horizontal scroll regions must actually allow scrolling.
          for(let p=el.parentElement;p && p!==document.body;p=p.parentElement) {
            const c=getComputedStyle(p);
            if(['auto','scroll'].includes(c.overflowX) && p.scrollWidth>p.clientWidth+1) return false;
          }
          return r.left < -1 || r.right > innerWidth+1;
        }).slice(0,12).map(el => ({tag:el.tagName,cls:String(el.className),text:el.textContent?.slice(0,55),right:Math.round(el.getBoundingClientRect().right)}));
        return {pageWidth:document.documentElement.scrollWidth, viewport:innerWidth, outside,
          masking: ['body','.nemo-app','.app-shell'].filter(s=>['clip','hidden'].includes(getComputedStyle(document.querySelector(s)).overflowX)),
          brokenImages:[...document.images].filter(i=>!i.complete||i.naturalWidth===0).length};
      });
      results.push({width,route,...result});
      if(width===390 || width===1440 || (width===320 && route==='/overview')) {
        await page.screenshot({path:`${out}/${width}-${route.replaceAll('/','_')}.png`,fullPage:true});
      }
    }
    await writeFile(`${out}/responsive-results.json`,JSON.stringify({results,errors},null,2));
  }
  console.log(JSON.stringify({checks:results.length,failures:results.filter(r=>r.pageWidth>r.viewport+1||r.outside.length||r.masking.length||r.brokenImages),errors},null,2));
} finally { await browser.close(); }
