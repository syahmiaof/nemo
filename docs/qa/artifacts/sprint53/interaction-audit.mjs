import { chromium } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const base='http://127.0.0.1:4174';
const out=new URL('./artifacts/',import.meta.url);
const path=name=>fileURLToPath(new URL(name,out));
const report={startedAt:new Date().toISOString(),checks:[],errors:[]};
const check=(name,data)=>report.checks.push({name,...data});
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:390,height:844},acceptDownloads:true});
await context.addInitScript(()=>{
  sessionStorage.setItem('nemo_session_welcomed','true');
  localStorage.setItem('nemo_welcome_seen','true');
  localStorage.setItem('nemo:workspace-mode','demo');
});
const page=await context.newPage();
page.on('pageerror',e=>report.errors.push(String(e)));
const wait=async()=>page.waitForTimeout(350);
const step=async(name,fn)=>{try{await fn();}catch(e){check(name,{error:String(e)})}};
await page.goto(base+'/overview');
await page.getByRole('button',{name:'Skip customization'}).click({timeout:4000}).catch(()=>{});
await wait();
await step('More drawer',async()=>{
  const trigger=page.getByRole('button',{name:'Open more navigation options'});
  await trigger.click();await wait();
  const dialogs=await page.getByRole('dialog').all();
  const names=[];for(const d of dialogs)names.push(await d.getAttribute('aria-labelledby'));
  const visible=await page.getByRole('dialog',{name:'Workspace Utilities & Modules'}).isVisible();
  await page.screenshot({path:path('more-sheet-390.png')});
  const settings=page.getByRole('dialog',{name:'Workspace Utilities & Modules'}).getByRole('link',{name:/Settings/});
  await settings.focus();await page.keyboard.press('Tab');
  const focused=await page.evaluate(()=>({tag:document.activeElement?.tagName,label:document.activeElement?.getAttribute('aria-label'),text:document.activeElement?.textContent?.trim().slice(0,50)}));
  await page.keyboard.press('Escape');await wait();
  check('More drawer',{visible,dialogCount:dialogs.length,names,focusedAfterTab:focused,hiddenAfterEscape:!(await page.getByRole('dialog',{name:'Workspace Utilities & Modules'}).isVisible().catch(()=>false)),focusRestored:await trigger.evaluate(el=>el===document.activeElement)});
});
await step('Ask Nemo',async()=>{
  await page.getByRole('button',{name:'Open more navigation options'}).click();
  await page.getByRole('button',{name:/Ask Nemo Local Assistant/}).click();await wait();
  const drawer=page.getByRole('dialog',{name:'Ask Nemo'});
  check('Ask Nemo opened',{visible:await drawer.isVisible(),background:await drawer.locator('div.relative.w-full').first().evaluate(el=>getComputedStyle(el).backgroundColor).catch(()=>null),heading:await drawer.locator('h2').first().innerText()});
  await page.screenshot({path:path('ask-nemo-midnight-390.png')});
  const input=drawer.locator('input').first();
  const questions=['How many tasks are overdue?','How many projects are active?','How many tasks have I completed?','What is the moon made of?'];
  for(const question of questions){await input.fill(question);await input.press('Enter');await wait();check(`Ask: ${question}`,{lastReply:(await drawer.locator('div.max-w-\\[95\\%\\]').last().innerText().catch(()=>'' )).slice(0,650)})}
  await page.getByRole('button',{name:'Close Ask Nemo drawer'}).click();
});
await step('Daylight settings and drawer',async()=>{
  await page.goto(base+'/settings');await wait();
  await page.getByRole('button',{name:/Daylight/}).first().click();await wait();
  await page.screenshot({path:path('daylight-settings-full-390.png'),fullPage:true});
  const cards=await page.evaluate(()=>[...document.querySelectorAll('button')].filter(el=>/Midnight|Daylight|Aurora/.test(el.textContent||'')).slice(0,3).map(el=>({name:(el.textContent||'').trim().slice(0,90),background:getComputedStyle(el).backgroundColor,color:getComputedStyle(el).color,child:[...el.querySelectorAll('span,p')].slice(0,4).map(x=>({text:x.textContent?.trim().slice(0,45),color:getComputedStyle(x).color}))})));
  check('Daylight cards',{cards});
  await page.getByRole('button',{name:'Open more navigation options'}).click();
  await page.getByRole('button',{name:/Ask Nemo Local Assistant/}).click();await wait();
  await page.screenshot({path:path('ask-nemo-daylight-390.png')});
  check('Daylight Ask drawer',{theme:await page.evaluate(()=>document.documentElement.dataset.theme),panelBackground:await page.getByRole('dialog',{name:'Ask Nemo'}).locator('div.relative.w-full').first().evaluate(el=>getComputedStyle(el).backgroundColor)});
  await page.getByRole('button',{name:'Close Ask Nemo drawer'}).click();
});
await step('Avatar profile',async()=>{
  await page.getByRole('tab',{name:/Profile/}).click();await wait();
  await page.screenshot({path:path('profile-daylight-390.png')});
  const input=page.locator('input[type=file][accept*="image"]');
  check('Avatar input',{count:await input.count(),buttons:await page.locator('#main-content button').allTextContents()});
  if(await input.count()){
    await input.setInputFiles('public/favicon.png');await wait();
    check('Avatar uploaded',{avatarImages:await page.locator('.profile-button img').count(),srcPrefix:await page.locator('.profile-button img').first().getAttribute('src').then(s=>s?.slice(0,25)).catch(()=>null)});
    await page.reload();await wait();
    check('Avatar persisted',{avatarImages:await page.locator('.profile-button img').count()});
    const remove=page.getByRole('button',{name:/Remove Photo|Remove Avatar|Remove/i}).first();
    if(await remove.count()){await remove.click();await wait();check('Avatar removed',{avatarImages:await page.locator('.profile-button img').count(),fallback:await page.locator('.profile-button').first().innerText()})}
  }
});
await step('Welcome replay',async()=>{
  await page.getByRole('tab',{name:/Appearance/}).click();
  await page.getByRole('button',{name:/Replay Welcome Animation/}).click();
  check('Welcome replay',{overlayVisible:await page.locator('.welcome-overlay').isVisible().catch(()=>false),text:(await page.locator('body').innerText()).slice(-180)});
  await page.screenshot({path:path('welcome-replay-390.png')});
});
await context.close();await browser.close();
await writeFile(path('interaction-results.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));

