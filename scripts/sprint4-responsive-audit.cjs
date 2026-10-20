const { chromium } = require('@playwright/test');
const fs=require('fs');
(async()=>{
 const browser=await chromium.launch(); const context=await browser.newContext({reducedMotion:'reduce'}); const page=await context.newPage();
 await page.addInitScript(()=>localStorage.setItem('nemo:workspace-mode','demo'));
 const out=[]; fs.mkdirSync('docs/sprint4-responsive',{recursive:true});
 for(const width of [320,360,390,768,1440]){await page.setViewportSize({width,height:900});for(const route of ['overview','projects','tasks','calendar','academics','goals','insights','settings','projects/demo-project-1','goals/demo-goal-1']){
 await page.goto('http://127.0.0.1:5184/'+route,{waitUntil:'domcontentloaded'}); await page.locator('main').waitFor({state:'visible',timeout:30000}); await page.waitForTimeout(500); await page.addStyleTag({content:'html,body,.nemo-app,.app-shell {overflow-x:visible!important}'});
 const data=await page.evaluate(()=>({pageWidth:document.documentElement.scrollWidth,viewport:innerWidth,offenders:[...document.querySelectorAll('main *')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0 && (r.right>innerWidth+1||r.left<-1)}).slice(0,15).map(e=>({tag:e.tagName,cls:e.className,text:e.textContent.slice(0,65),right:Math.round(e.getBoundingClientRect().right)}))}));
 out.push({width,route,...data}); fs.writeFileSync('docs/sprint4-responsive/baseline.json',JSON.stringify(out,null,2)); if(width===320||width===390)await page.screenshot({path:`docs/sprint4-responsive/before-${width}-${route.replaceAll('/','-')}.png`,fullPage:true});
 }}fs.writeFileSync('docs/sprint4-responsive/baseline.json',JSON.stringify(out,null,2)); console.log(JSON.stringify(out.filter(x=>x.pageWidth>x.width),null,2));await browser.close();
})()


