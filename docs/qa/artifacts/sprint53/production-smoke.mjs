import { chromium } from '@playwright/test';
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:390,height:844}});
const page=await context.newPage();
const errors=[], failed=[], writes=[];
page.on('pageerror',e=>errors.push(e.message));
page.on('console',m=>{if(m.type()==='error') errors.push(m.text())});
page.on('requestfailed',r=>failed.push({url:r.url(),error:r.failure()?.errorText}));
page.on('request',r=>{if(!['GET','HEAD','OPTIONS'].includes(r.method())) writes.push({method:r.method(),url:r.url()})});
const routes=['overview','projects','tasks','calendar','academics','goals','insights','settings'];
const results=[];
for(const route of routes){
  try{await page.goto(`https://nemo.syahmiaof.my/${route}`,{waitUntil:'domcontentloaded',timeout:20000});await page.locator('main').waitFor({state:'visible',timeout:12000});await page.waitForTimeout(250);results.push({route,status:page.url(),heading:await page.locator('main h1').first().innerText().catch(()=>''),mainVisible:true})}
  catch(e){results.push({route,error:String(e)})}
}
console.log(JSON.stringify({results,errors:errors.slice(0,10),failed:failed.slice(0,10),writes},null,2));
await context.close();await browser.close();
