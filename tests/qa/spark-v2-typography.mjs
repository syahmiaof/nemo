import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
const browser = await chromium.launch();
const page = await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:2});
await page.addInitScript(()=>localStorage.setItem('nemo:workspace-mode','demo'));
await page.goto('http://localhost:5173/overview');
for(const [role,name] of [['dialog','Welcome to Nemo'],['button','Skip customization']]) {
 const e=page.getByRole(role,{name});await e.waitFor({state:'visible',timeout:6000}).catch(()=>{});
 if(await e.isVisible()){await e.dispatchEvent('click');await e.waitFor({state:'hidden'});}
}
const card=page.locator('section[aria-label="Spark of focus motivational quote"]');
await card.getByRole('button',{name:'Pause quote rotation'}).dispatchEvent('click');
await page.waitForTimeout(2200);
const results=[];
for(const width of [320,390,768,1440]) {
 await page.setViewportSize({width,height:900});
 await card.scrollIntoViewIfNeeded();
 await page.waitForTimeout(800);
 results.push(await page.evaluate(async()=>{
  await document.fonts.ready;
  const {MOTIVATIONAL_QUOTES:quotes}=await import('/src/features/overview/data/motivationalQuotes.ts');
  const {rasterizeQuote}=await import('/src/features/overview/motion/particleSampler.ts');
  const p=document.querySelector('section[aria-label="Spark of focus motivational quote"] p');
  const region=p.parentElement, original=p.textContent;
  const budget=innerWidth<640?240:innerWidth<1024?400:650;
  const summaries=[];
  for(const quote of quotes){
   p.textContent=`“${quote.text}”`;
   const g=rasterizeQuote(p.textContent,p,region.clientWidth,region.clientHeight,2,budget);
   summaries.push({id:quote.id,lines:g.lines,particles:g.fragments.length,height:region.clientHeight,
    fits:p.scrollWidth<=p.clientWidth+1 && p.offsetHeight<=region.clientHeight});
  }
  p.textContent=original;
  return {width:innerWidth,dpr:devicePixelRatio,count:quotes.length,font:getComputedStyle(p).font,
   lineHeight:getComputedStyle(p).lineHeight,letterSpacing:getComputedStyle(p).letterSpacing,
   minParticles:Math.min(...summaries.map(s=>s.particles)),maxParticles:Math.max(...summaries.map(s=>s.particles)),
   maxLines:Math.max(...summaries.map(s=>s.lines)),heights:[...new Set(summaries.map(s=>s.height))],
   failures:summaries.filter(s=>!s.fits || s.particles>budget)};
 }));
}
await fs.mkdir('docs/evidence/sprint62/typography',{recursive:true});
await fs.writeFile('docs/evidence/sprint62/typography/all-quotes.json',JSON.stringify(results,null,2));
console.log(results);
await browser.close();
