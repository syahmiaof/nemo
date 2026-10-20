import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
const out = 'docs/sprint4';
await mkdir(out, {recursive:true});
const browser = await chromium.launch();
const context = await browser.newContext({
  viewport:{width:1440,height:900}, reducedMotion:'no-preference',
  recordVideo:{dir:out, size:{width:1440,height:900}},
});
await context.addInitScript(() => localStorage.setItem('nemo:workspace-mode','demo'));
const page = await context.newPage();
const errors=[];
page.on('pageerror',error=>errors.push(error.message));
const base = process.env.BASE_URL || 'http://localhost:4173';
const results={};
const sample = async (selector, property, duration=800) => page.evaluate(({selector,property,duration}) => new Promise(resolve=>{
  const samples=[], start=performance.now();
  function frame(now) {
    const node=document.querySelector(selector);
    samples.push({ms:Math.round(now-start), value:node ? property==='d' ? node.getAttribute('d') : getComputedStyle(node)[property] : null});
    if(now-start<duration) requestAnimationFrame(frame); else resolve(samples);
  }
  requestAnimationFrame(frame);
}),{selector,property,duration});
try {
  await page.goto(base+'/overview');
  await page.locator('.nemo-chart').waitFor();
  await page.waitForTimeout(1200);
  const header = await page.locator('header').elementHandle();
  const nav = page.getByRole('navigation',{name:'Main Navigation',exact:true});
  await nav.getByRole('link',{name:'Insights',exact:true}).click();
  results.pillForward = await sample('.tabs__indicator','width');
  await page.screenshot({path:out+'/motion-insights-settled.png'});
  await nav.getByRole('link',{name:'Projects',exact:true}).click();
  results.pillReverse = await sample('.tabs__indicator','transform');
  await page.getByRole('button',{name:'New Project',exact:true}).click();
  results.modalEnter = await sample('.modal-panel','transform',450);
  await page.getByLabel('Project Title').fill('Motion review — unsaved');
  await page.waitForTimeout(500);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);
  for(const name of ['Calendar','Tasks','Goals','Projects','Overview']) {
    await nav.getByRole('link',{name,exact:true}).click();
    await page.waitForTimeout(55);
  }
  await page.locator('.nemo-chart').waitFor();
  await page.waitForTimeout(700);
  await page.getByRole('button',{name:'Projects',exact:true}).click();
  results.chartMorph = await sample('.nemo-chart__line','d',700);
  await page.getByRole('button',{name:'Tasks',exact:true}).click();
  await page.waitForTimeout(700);
  await page.locator('.nemo-chart__svg').hover({position:{x:240,y:130}});
  await page.waitForTimeout(650);
  await page.getByRole('link',{name:'Profile and settings'}).click();
  await page.getByRole('tab',{name:'Profile',exact:true}).click();
  await page.waitForTimeout(500);
  await page.getByRole('tab',{name:'Preferences',exact:true}).click();
  await page.waitForTimeout(500);
  await page.getByRole('tab',{name:'Appearance',exact:true}).click();
  await page.waitForTimeout(500);
  await page.emulateMedia({reducedMotion:'reduce'});
  await nav.getByRole('link',{name:'Overview',exact:true}).click();
  await page.locator('.nemo-chart[data-motion="reduced"]').waitFor();
  results.reduced = await sample('.route-content','transform',300);
  results.shellRetained = await header.evaluate(el=>el.isConnected);
  results.errors=errors;
  results.note='Browser requestAnimationFrame samples for this implementation; not claimed as measured Tavola timings.';
  await page.waitForTimeout(500);
  const video=page.video();
  await context.close();
  await video.saveAs(out+'/nemo-motion-review.webm');
  await writeFile(out+'/motion-results.json',JSON.stringify(results,null,2));
  console.log(JSON.stringify({shellRetained:results.shellRetained,errors,chartShapes:new Set(results.chartMorph.map(s=>s.value)).size,pillWidths:new Set(results.pillForward.map(s=>s.value)).size,reducedTransforms:[...new Set(results.reduced.map(s=>s.value))]}));
} finally {await browser.close();}
