import { chromium } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const path=name=>fileURLToPath(new URL(`./artifacts/${name}`,import.meta.url));
const base='http://127.0.0.1:4173';
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:390,height:844}});
await context.addInitScript(()=>{sessionStorage.setItem('nemo_session_welcomed','true');localStorage.setItem('nemo_welcome_seen','true');localStorage.setItem('nemo:workspace-mode','demo')});
const page=await context.newPage();const results=[];
await page.goto(base+'/settings');await page.getByRole('button',{name:'Skip customization'}).click({timeout:4000}).catch(()=>{});
for(const theme of ['Midnight','Daylight','Aurora']){
  await page.goto(base+'/settings');await page.getByRole('button',{name:new RegExp(theme)}).first().click();await page.waitForFunction(t=>document.documentElement.dataset.theme===t,theme.toLowerCase(),{timeout:5000});
  for(const route of ['overview','projects','projects/demo-project-1','tasks','calendar','academics','goals','goals/demo-goal-1','insights','settings']){
    try{
      await page.goto(base+'/'+route,{waitUntil:'domcontentloaded'});await page.waitForTimeout(250);const overlay=page.locator('[class*="z-[9999]"]');const overlayBefore=await overlay.count();if(overlayBefore){await page.keyboard.press('Escape');await page.waitForTimeout(450)}
      const metric=await page.evaluate(()=>({theme:document.documentElement.dataset.theme,scrollWidth:document.documentElement.scrollWidth,innerWidth,h1:[...document.querySelectorAll('h1')].map(x=>x.innerText),bodyColor:getComputedStyle(document.body).color,bodyBg:getComputedStyle(document.body).backgroundColor}));
      results.push({requestedTheme:theme,route,overlayBefore,...metric});
      await page.screenshot({path:path(`${theme.toLowerCase()}-${route.replaceAll('/','-')}-390-themecheck.png`)});
    }catch(e){results.push({requestedTheme:theme,route,error:String(e)})}
  }
}
await context.close();await browser.close();await writeFile(path('theme-route-results.json'),JSON.stringify(results,null,2));
console.log(JSON.stringify({count:results.length,errors:results.filter(x=>x.error),overflow:results.filter(x=>x.scrollWidth>x.innerWidth)},null,2));


