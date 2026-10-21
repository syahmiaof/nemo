import { webkit, devices } from '@playwright/test';
import fs from 'node:fs/promises';
const browser = await webkit.launch();
const page = await browser.newPage({...devices['iPhone 13']});
await page.addInitScript(()=>localStorage.setItem('nemo:workspace-mode','demo'));
await page.goto('http://localhost:5173/overview');
for(const [role,name] of [['dialog','Welcome to Nemo'],['button','Skip customization']]) {
  const e=page.getByRole(role,{name});
  await e.waitFor({state:'visible',timeout:15000}).catch(()=>{});
  if(await e.isVisible()) { await e.dispatchEvent('click'); await e.waitFor({state:'hidden',timeout:15000}); }
}
const card=page.locator('section[aria-label="Spark of focus motivational quote"]');
await card.scrollIntoViewIfNeeded();
await page.mouse.move(1,1);
await card.getByRole('button',{name:'Pause quote rotation'}).dispatchEvent('click');
await page.waitForTimeout(2500);
await page.evaluate(async()=>{
  const url=performance.getEntriesByType('resource').find(e=>/\/gsap\.js\?/.test(e.name)).name;
  window.qaGsap=(await import(url)).gsap;
  window.qaFrames=0;window.qaTicks=0;
  const frame=()=>{window.qaFrames++;requestAnimationFrame(frame)};requestAnimationFrame(frame);
  window.qaGsap.ticker.add(()=>window.qaTicks++);
});
await card.getByRole('button',{name:'Next motivational quote'}).dispatchEvent('click');
const samples=[];
for(let i=0;i<6;i++) {
  await page.waitForTimeout(1000);
  samples.push(await page.evaluate(()=>{
    const g=window.qaGsap,t=g.globalTimeline.getChildren().find(t=>t.data==='spark-quote-v2');
    return {frames:window.qaFrames,ticks:window.qaTicks,tickerTime:g.ticker.time,rootTime:g.globalTimeline.time(),rootScale:g.globalTimeline.timeScale(),progress:t?.progress(),paused:t?.paused(),active:t?.isActive(),phase:document.querySelector('canvas[data-motion-phase]')?.dataset.motionPhase,hidden:document.hidden};
  }));
}
await fs.mkdir('docs/evidence/sprint62/webkit-diagnostic',{recursive:true});
await fs.writeFile('docs/evidence/sprint62/webkit-diagnostic/timing.json',JSON.stringify(samples,null,2));
await card.screenshot({path:'docs/evidence/sprint62/webkit-diagnostic/card.png'});
console.log(samples);
await browser.close();
