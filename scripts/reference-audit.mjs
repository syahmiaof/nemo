import { chromium } from '@playwright/test';
import { writeFile, mkdir } from 'node:fs/promises';
const out='docs/reference/evidence'; await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:900},recordVideo:{dir:out,size:{width:1440,height:900}}});
const results={date:new Date().toISOString(),browser:await browser.version(),viewports:[],motion:{}};
await page.goto('https://demo.codeandchill.store/tavola/#/overview',{waitUntil:'networkidle'});
const measure=()=>page.evaluate(()=>{const selectors=['body','.dock','.tabs','.tabs a','.tabs__pill','.main','.head','.head__title','.head__stats','.card','.seg','.seg__btn','.ov-tile','svg','.btn'];const elements={};for(const s of selectors){const e=document.querySelector(s);if(!e)continue;const c=getComputedStyle(e),b=e.getBoundingClientRect();elements[s]={x:b.x,y:b.y,width:b.width,height:b.height,color:c.color,background:c.background,boxShadow:c.boxShadow,border:c.border,borderRadius:c.borderRadius,fontFamily:c.fontFamily,fontSize:c.fontSize,fontWeight:c.fontWeight,lineHeight:c.lineHeight,padding:c.padding,gap:c.gap,backdropFilter:c.backdropFilter,transition:c.transition};}return{viewport:{width:innerWidth,height:innerHeight},scrollWidth:document.documentElement.scrollWidth,elements};});
for(const viewport of [{width:1440,height:900},{width:768,height:1024},{width:390,height:844}]){await page.setViewportSize(viewport);await page.waitForTimeout(500);results.viewports.push(await measure());await page.screenshot({path:`${out}/tavola-overview-${viewport.width}.png`,fullPage:true});}
await page.setViewportSize({width:1440,height:900});
// Record visible property changes once per animation frame without reading source bundles.
async function sample(label,action,selector='.main,.head__title,.card,.tabs [style]'){
 await page.evaluate(({selector})=>{window.__frames=[];window.__sampleStop=false;const start=performance.now();const frame=()=>{window.__frames.push({t:Math.round(performance.now()-start),els:[...document.querySelectorAll(selector)].slice(0,12).map(e=>{const s=getComputedStyle(e),b=e.getBoundingClientRect();return{tag:e.tagName,cls:e.className,opacity:s.opacity,transform:s.transform,clipPath:s.clipPath,x:+b.x.toFixed(2),y:+b.y.toFixed(2),w:+b.width.toFixed(2),h:+b.height.toFixed(2)}})});if(!window.__sampleStop&&performance.now()-start<1500)requestAnimationFrame(frame);};requestAnimationFrame(frame);},{selector});
 await action();await page.waitForTimeout(1500);results.motion[label]=await page.evaluate(()=>{window.__sampleStop=true;return window.__frames;});
 await page.screenshot({path:`${out}/tavola-${label}.png`});
}
await sample('route-orders',()=>page.locator('nav.tabs a').filter({hasText:'Orders'}).first().click());
results.orders=await measure();
await sample('modal-open',()=>page.getByRole('button',{name:'New order',exact:true}).click(),'.modal,.modal__panel,.modal__backdrop,dialog,[role="dialog"],.drawer');
console.log('DIALOG',await page.evaluate(()=>[...document.querySelectorAll('[role="dialog"],dialog,.modal,.drawer')].map(e=>({cls:e.className,text:e.textContent.slice(0,700)}))));
await sample('modal-close',()=>page.keyboard.press('Escape'),'.modal,.modal__panel,.modal__backdrop,dialog,[role="dialog"],.drawer');
await page.goto('https://demo.codeandchill.store/tavola/#/overview');await page.waitForTimeout(800);
await sample('chart-tickets',()=>page.getByRole('button',{name:'Tickets',exact:true}).click(),'.seg [style],.seg__btn,.chart svg,.chart path,.chart__value');
console.log('CHART',await page.evaluate(()=>[...document.querySelectorAll('svg')].filter(e=>e.getBoundingClientRect().width>200).map(e=>({cls:e.getAttribute('class'),parent:e.parentElement.className,width:e.getBoundingClientRect().width}))));
const chart=page.locator('svg').filter({has:page.locator('path')});
await page.mouse.move(550,610);await page.waitForTimeout(400);await page.screenshot({path:`${out}/tavola-chart-hover.png`});
await page.locator('.ov-tile').first().hover();await page.waitForTimeout(400);await page.screenshot({path:`${out}/tavola-card-hover.png`});
for(const route of ['reports','settings','reservations','menu','floor','inventory','staff']){await page.goto(`https://demo.codeandchill.store/tavola/#/${route}`);await page.waitForTimeout(800);await page.screenshot({path:`${out}/tavola-${route}-1440.png`});}
await sample('history-back',()=>page.goBack());await sample('history-forward',()=>page.goForward());
await page.mouse.wheel(0,650);await page.waitForTimeout(400);results.scrolled=await measure();await page.screenshot({path:`${out}/tavola-scroll.png`});
await writeFile(`${out}/measurements.json`,JSON.stringify(results,null,2));
await page.close();await browser.close();
