import { chromium, firefox, webkit } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const base = 'http://127.0.0.1:4173';
const out = new URL('./artifacts/', import.meta.url);
await mkdir(out, { recursive: true });
const results = { startedAt: new Date().toISOString(), routes: [], themes: [], reference: {}, browserEngines: [], interactions: [], errors: [] };
const sizes = [[320,568],[360,800],[375,812],[390,844],[430,932],[768,1024],[1440,900],[1920,1080]];
const routes = ['overview','projects','tasks','calendar','academics','goals','insights','settings'];

function logError(where, error) { results.errors.push({ where, message: String(error) }); }
async function settle(page) { await page.waitForTimeout(300); }
async function hideWelcome(page) {
  await page.evaluate(() => { sessionStorage.setItem('nemo_session_welcomed', 'true'); localStorage.setItem('nemo_welcome_seen', 'true'); });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Skip customization' }).click({ timeout: 7000 }).catch(() => {});
  await settle(page);
}
async function measure(page) {
  return await page.evaluate(() => {
    const targets = ['.app-header','.header-navigation','.module-heading','.glass-panel','.mobile-nav','.dock','.tabs__track'];
    const rects = {};
    for (const s of targets) {
      const el = document.querySelector(s);
      if (el) { const r = el.getBoundingClientRect(); rects[s] = { x:Math.round(r.x), y:Math.round(r.y), w:Math.round(r.width), h:Math.round(r.height) }; }
    }
    const offenders = [...document.querySelectorAll('body *')].filter(el => {
      const r = el.getBoundingClientRect(); const st=getComputedStyle(el);
      return st.visibility !== 'hidden' && st.display !== 'none' && r.width > 0 && (r.left < -3 || r.right > innerWidth + 3);
    }).slice(0,12).map(el => ({tag:el.tagName, className:String(el.className).slice(0,90), text:(el.textContent||'').trim().slice(0,70), left:Math.round(el.getBoundingClientRect().left), right:Math.round(el.getBoundingClientRect().right)}));
    return { title: document.title, h1:[...document.querySelectorAll('h1')].map(x=>x.textContent.trim()), docWidth:document.documentElement.scrollWidth, windowWidth:innerWidth, overflow:document.documentElement.scrollWidth-innerWidth, theme:document.documentElement.dataset.theme, rects, offenders };
  });
}

const browser = await chromium.launch({ headless: true });
try {
  const context = await browser.newContext({ viewport:{width:1440,height:900}, acceptDownloads:true });
  const page = await context.newPage();
  page.on('pageerror', e => logError('local pageerror', e));
  page.on('console', msg => { if (msg.type() === 'error') logError('local console', msg.text()); });
  await page.goto(base+'/overview', { waitUntil:'domcontentloaded' });
  await page.screenshot({ path:fileURLToPath(new URL('welcome-first-1440.png',out)), fullPage:false });
  results.interactions.push({name:'first welcome', visible:await page.locator('.welcome-overlay').count(), body:(await page.locator('body').innerText()).slice(0,250)});
  await page.waitForTimeout(3500);
  await page.getByRole('button',{name:'Skip customization'}).click({timeout:5000}).catch(()=>{});
  await page.screenshot({ path:fileURLToPath(new URL('empty-overview-1440.png',out)), fullPage:false });
  await page.getByRole('button',{name:'Explore demo'}).first().click();
  await page.getByText('DEMO WORKSPACE · Fictional data').waitFor({timeout:12000});
  await settle(page);
  for (const [w,h] of sizes) {
    await page.setViewportSize({width:w,height:h});
    for (const route of routes) {
      try {
        await page.goto(base+'/'+route,{waitUntil:'domcontentloaded'});
        await settle(page);
        const m=await measure(page);
        results.routes.push({ viewport:`${w}x${h}`,route,...m });
        if ([390,1440].includes(w)) await page.screenshot({path:fileURLToPath(new URL(`midnight-${w}-${route}.png`,out)),fullPage:false});
      } catch(e) { logError(`${w} ${route}`,e); }
    }
  }
  await page.setViewportSize({width:390,height:844});
  await page.goto(base+'/settings'); await settle(page);
  const themeNames=['Midnight','Daylight','Aurora'];
  for (const name of themeNames) {
    try {
      await page.getByRole('button',{name:new RegExp(name)}).first().click();
      await settle(page);
      results.themes.push({name,settings:await measure(page)});
      await page.screenshot({path:fileURLToPath(new URL(`theme-${name.toLowerCase()}-settings-390.png`,out))});
      await page.goto(base+'/overview'); await settle(page);
      results.themes.at(-1).overview=await measure(page);
      await page.screenshot({path:fileURLToPath(new URL(`theme-${name.toLowerCase()}-overview-390.png`,out))});
      await page.reload(); await settle(page);
      results.themes.at(-1).persisted=documentTheme(await page.evaluate(()=>document.documentElement.dataset.theme));
      await page.goto(base+'/settings'); await settle(page);
    } catch(e) { logError(`theme ${name}`,e); }
  }
  await context.close();

  const refContext=await browser.newContext({viewport:{width:1440,height:900}});
  const refPage=await refContext.newPage();
  try {
    await refPage.goto('https://demo.codeandchill.store/tavola/#/overview',{waitUntil:'domcontentloaded',timeout:30000});
    await refPage.waitForTimeout(900);
    results.reference.url=refPage.url();
    results.reference.title=await refPage.title();
    results.reference.h1=await refPage.locator('h1').allTextContents();
    await refPage.screenshot({path:fileURLToPath(new URL('tavola-reference-1440.png',out))});
    await refPage.setViewportSize({width:390,height:844});
    await refPage.screenshot({path:fileURLToPath(new URL('tavola-reference-390.png',out))});
  } catch(e) { logError('reference',e); }
  await refContext.close();
} finally { await browser.close(); }

for (const [name, engine] of [['firefox',firefox],['webkit',webkit]]) {
  try {
    const b=await engine.launch({headless:true}); const p=await b.newPage({viewport:{width:390,height:844}});
    await p.goto(base+'/overview',{waitUntil:'domcontentloaded',timeout:15000}); await hideWelcome(p);
    results.browserEngines.push({name,metric:await measure(p)});
    await p.screenshot({path:fileURLToPath(new URL(`${name}-overview-390.png`,out))});
    await b.close();
  } catch(e) { logError(`engine ${name}`,e); }
}
function documentTheme(v){return v;}
await writeFile(fileURLToPath(new URL('audit-measurements.json',out)),JSON.stringify(results,null,2));
console.log(JSON.stringify({routes:results.routes.length,themes:results.themes.length,reference:results.reference,browserEngines:results.browserEngines.map(x=>x.name),overflows:results.routes.filter(x=>x.overflow>0).length,errors:results.errors.slice(0,15)},null,2));



