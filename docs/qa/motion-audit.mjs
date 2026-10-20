import { chromium } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const path=name=>fileURLToPath(new URL(`./artifacts/${name}`,import.meta.url));
const base='http://127.0.0.1:4173';
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1440,height:900},recordVideo:{dir:path(''),size:{width:1440,height:900}}});
await context.addInitScript(()=>{sessionStorage.setItem('nemo_session_welcomed','true');localStorage.setItem('nemo_welcome_seen','true');localStorage.setItem('nemo:workspace-mode','demo')});
const page=await context.newPage(),result={nav:[],charts:[],aurora:{},reduced:{},rapid:{},reference:{},errors:[]};
page.on('pageerror',e=>result.errors.push(String(e)));
await page.goto(base+'/overview');await page.getByRole('button',{name:'Skip customization'}).click({timeout:4000}).catch(()=>{});
await page.waitForTimeout(500);
const pill=()=>page.locator('.tabs__indicator').evaluate(el=>{const r=el.getBoundingClientRect();return {x:r.x,w:r.width}});
result.nav.push({t:0,...await pill()});
await page.getByRole('navigation',{name:'Main Navigation'}).getByRole('link',{name:'Projects'}).click();
for(const t of [0,50,100,200,400,600]){await page.waitForTimeout(t===0?0:t-result.nav.at(-1).t);result.nav.push({t,...await pill()})}
for(const route of ['Overview','Projects','Tasks','Calendar','Academics','Goals','Insights']){
  await page.getByRole('navigation',{name:'Main Navigation'}).getByRole('link',{name:route}).click();
}
result.rapid={url:page.url(),shells:await page.locator('.app-shell').count(),headers:await page.locator('.app-header').count()};
await page.getByRole('navigation',{name:'Main Navigation'}).getByRole('link',{name:'Overview'}).click();
await page.waitForTimeout(400);
const toggle=page.getByRole('region',{name:'Your momentum'}).getByRole('button',{name:'Projects'});
const chart=()=>page.locator('.nemo-chart__line').first().getAttribute('d');
result.charts.push({t:0,d:await chart()});await toggle.click();
for(const t of [30,90,180,360,600]){await page.waitForTimeout(t-result.charts.at(-1).t);result.charts.push({t,d:await chart()})}
result.chartDistinct=new Set(result.charts.map(x=>x.d)).size;
await page.goto(base+'/settings');await page.getByRole('button',{name:/Aurora/}).first().click();await page.waitForTimeout(200);
result.aurora.before=await page.evaluate(()=>{const e=document.querySelector('.aurora-backdrop');return {exists:!!e,animation:e?getComputedStyle(e).animationName:null,children:e?.children.length}});
await page.getByRole('navigation',{name:'Main Navigation'}).getByRole('link',{name:'Overview'}).click();
result.aurora.after=await page.evaluate(()=>{const e=document.querySelector('.aurora-backdrop');return {exists:!!e,animation:e?getComputedStyle(e).animationName:null}});
await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(100);
result.reduced=await page.evaluate(()=>({media:matchMedia('(prefers-reduced-motion: reduce)').matches,ambient:getComputedStyle(document.querySelector('.aurora-backdrop')).animationDuration,root:document.documentElement.dataset.reduceMotion}));
await page.screenshot({path:path('aurora-reduced-1440.png')});
const video=page.video();await context.close();result.video=await video.path();await browser.close();
const ref=await chromium.launch({headless:true});const rp=await ref.newPage({viewport:{width:1440,height:900}});
try{await rp.goto('https://demo.codeandchill.store/tavola/#/overview',{waitUntil:'domcontentloaded'});await rp.waitForTimeout(2800);await rp.screenshot({path:path('tavola-reference-settled-1440.png')});result.reference={title:await rp.title(),h1:await rp.locator('h1').allTextContents()}}catch(e){result.errors.push('reference '+String(e))}await ref.close();
await writeFile(path('motion-results.json'),JSON.stringify(result,null,2));
console.log(JSON.stringify({nav:result.nav,chartDistinct:result.chartDistinct,aurora:result.aurora,reduced:result.reduced,rapid:result.rapid,reference:result.reference,errors:result.errors},null,2));
