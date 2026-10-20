import { chromium } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const base='http://127.0.0.1:4173';
const path=name=>fileURLToPath(new URL(`./artifacts/${name}`,import.meta.url));
const result={startedAt:new Date().toISOString(),checks:[],errors:[]};
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1440,height:900},acceptDownloads:true});
await context.addInitScript(()=>localStorage.setItem('nemo:workspace-mode','demo'));
const page=await context.newPage();page.on('pageerror',e=>result.errors.push(String(e)));
const step=async(name,fn)=>{try{result.checks.push({name,...await fn()})}catch(e){result.checks.push({name,error:String(e)})}};
await page.goto(base+'/overview');await page.waitForTimeout(300);
if(await page.getByRole('dialog',{name:'Welcome to Nemo'}).count())await page.keyboard.press('Escape');
await page.getByRole('button',{name:'Skip customization'}).click({timeout:3000}).catch(()=>{});
await page.waitForTimeout(350);
await step('Demo counts',async()=>{
  const text=await page.locator('main').innerText();
  return {headline:text.slice(0,300),demo:await page.locator('.workspace-status').innerText()};
});
await step('Ask Nemo suggested intents',async()=>{
  await page.getByRole('button',{name:'Ask Nemo Assistant'}).click();
  const drawer=page.getByRole('dialog',{name:'Ask Nemo'});
  const input=drawer.locator('input').first();const answers=[];
  for(const q of ['What tasks are due today?','Overdue tasks','Active projects','Tasks finished this month','Active goals','What is the moon made of?']){
    await input.fill(q);await input.press('Enter');await page.waitForTimeout(450);
    const nodes=await drawer.locator('.max-w-\\[95\\%\\]').all();
    answers.push({question:q,answer:(await nodes.at(-1).innerText()).slice(0,450)});
  }
  await page.screenshot({path:path('ask-nemo-answers-desktop.png')});
  await page.getByRole('button',{name:'Close Ask Nemo drawer'}).click();
  return {answers};
});
await step('Avatar upload replace remove and workspace isolation',async()=>{
  await page.goto(base+'/settings');await page.waitForTimeout(300);
  if(await page.getByRole('dialog',{name:'Welcome to Nemo'}).count())await page.keyboard.press('Escape');
  await page.getByRole('tab',{name:/Profile/}).click();
  const input=page.locator('input[type=file][accept*="image"]');
  await input.setInputFiles('public/favicon.png');await page.waitForTimeout(300);
  const first=await page.locator('.profile-button img').count();
  await input.setInputFiles('public/nemo-icon-192.png');await page.waitForTimeout(300);
  const second=await page.locator('.profile-button img').count();
  await page.reload();await page.waitForTimeout(250);
  if(await page.getByRole('dialog',{name:'Welcome to Nemo'}).count())await page.keyboard.press('Escape');
  await page.getByRole('tab',{name:/Profile/}).click();
  const persisted=await page.locator('.profile-button img').count();
  await page.getByRole('button',{name:'Remove',exact:true}).click();await page.waitForTimeout(250);
  const removed=await page.locator('.profile-button img').count();
  return {uploaded:first,replaced:second,persisted,removed,fallback:await page.locator('.profile-button').innerText()};
});
await step('Backup export',async()=>{
  await page.getByRole('tab',{name:/Data & Backups/}).click();
  const downloadPromise=page.waitForEvent('download',{timeout:10000});
  await page.getByRole('button',{name:/Export Backup/}).click();
  const dl=await downloadPromise;const target=path('disposable-demo-backup.json');await dl.saveAs(target);
  return {filename:dl.suggestedFilename(),artifact:target};
});
await context.close();await browser.close();
await writeFile(path('functional-probe-results.json'),JSON.stringify(result,null,2));
console.log(JSON.stringify(result,null,2));
