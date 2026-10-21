import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
const name=process.argv[2]||'ink';
const width=Number(process.argv[3]||1440);
const theme=process.argv[4]||'midnight';
const dir=`docs/evidence/sprint62/${name}-${width}-phases`;
await fs.mkdir(dir,{recursive:true});
const browser=await chromium.launch();
const page=await browser.newPage({viewport:{width,height:900}});
await page.addInitScript(()=>{localStorage.setItem('nemo:workspace-mode','demo');let seed=62;Math.random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};});
await page.goto('http://localhost:5173/overview');
for(const [role,title]of [['dialog','Welcome to Nemo'],['button','Skip customization']]){
 const e=page.getByRole(role,{name:title});await e.waitFor({state:'visible',timeout:1800}).catch(()=>{});if(await e.isVisible())await e.click();
}
const card=page.locator('section[aria-label="Spark of focus motivational quote"]');
if(theme!=='midnight') {
 await page.evaluate(async theme=>{
  const {db}=await import('/src/db/nemoDb.ts');
  await db.settings.update('default',{theme});
 },theme);
 await page.waitForFunction(theme=>document.documentElement.dataset.theme===theme,theme);
}
await card.scrollIntoViewIfNeeded();await page.mouse.move(1,1);
await card.getByRole('button',{name:'Pause quote rotation'}).dispatchEvent('click');
await page.waitForTimeout(2200);
await page.evaluate(async()=>{
 const url=performance.getEntriesByType('resource').find(e=>/\/gsap\.js\?/.test(e.name)).name;
 window.sparkGsap=(await import(url)).gsap;
});
console.log('capturing source');
await card.screenshot({path:`${dir}/00-dom-source.png`,timeout:5000});
await card.getByRole('button',{name:'Next motivational quote'}).dispatchEvent('click');
await page.waitForFunction(()=>window.sparkGsap.globalTimeline.getChildren().some(t=>t.data==='spark-quote-v2'),null,{timeout:5000});
await page.evaluate(()=>{window.sparkTimeline=window.sparkGsap.globalTimeline.getChildren().find(t=>t.data==='spark-quote-v2');window.sparkTimeline.pause();});
console.log('timeline found');
const phases=[];
for(const [progress,label]of [[0,'source-mask'],[.08,'living'],[.23,'fracture'],[.35,'disintegration'],[.49,'orbital'],[.68,'summoning'],[.83,'reconstruction'],[.99,'destination-mask']]){
 await page.evaluate(p=>{window.sparkTimeline.progress(p,false);},progress);
 console.log(label);
 if(label==='destination-mask')console.log(await card.locator('p').first().evaluate(e=>({html:e.outerHTML,opacity:getComputedStyle(e).opacity})));
 await card.screenshot({path:`${dir}/${String(Math.round(progress*2000)).padStart(4,'0')}-${label}.png`,timeout:5000});
 phases.push({seconds:progress*2,phase:label});
}
await page.evaluate(()=>{window.sparkTimeline.progress(1,false);});
await page.waitForTimeout(100);
await card.screenshot({path:`${dir}/2000-dom-destination.png`});
await fs.writeFile(`${dir}/frames.json`,JSON.stringify({name,width,theme,phases,method:'Actual running app GSAP timeline paused at exact timestamps for inspection; see separate uninterrupted recordings.'},null,2));
await browser.close();console.log(dir);
