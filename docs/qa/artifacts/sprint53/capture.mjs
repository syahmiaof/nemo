import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const base = 'http://127.0.0.1:4174';
const out = resolve('docs/qa/artifacts/sprint53');
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ headless: true });
const results = { startedAt: new Date().toISOString(), source: base, viewports: [], routes: [], interactions: [], demoIsolation: {}, keyboardTabs: {}, errors: [] };
const routes = ['overview','projects','tasks','calendar','academics','goals','insights','settings'];
const widths = [[320,640],[360,800],[375,812],[390,844],[430,932],[768,1024],[1024,768],[1280,800],[1440,900],[1920,1080]];
const themes = [
  {name:'Midnight', key:'midnight'},
  {name:'Daylight', key:'daylight'},
  {name:'Aurora', key:'aurora'},
];

try {
  const context = await browser.newContext({ viewport:{width:1440,height:900}, acceptDownloads:true });
  await context.addInitScript(() => {
    sessionStorage.setItem('nemo_session_welcomed','true');
    localStorage.setItem('nemo_welcome_seen','true');
    localStorage.setItem('nemo:workspace-mode','demo');
  });
  const page = await context.newPage();
  page.on('pageerror', e => results.errors.push(String(e)));
  await page.goto(`${base}/settings`, {waitUntil:'domcontentloaded'});
  for (const theme of themes) {
    await page.goto(`${base}/settings`, {waitUntil:'domcontentloaded'});
    await page.getByRole('button',{name:new RegExp(theme.name)}).first().click();
    await page.waitForFunction(key => document.documentElement.dataset.theme === key, theme.key, {timeout:7000});
    for (const [width,height] of widths) {
      await page.setViewportSize({width,height});
      for (const route of routes) {
        try {
          await page.goto(`${base}/${route}`, {waitUntil:'domcontentloaded'});
          await page.locator('main').waitFor({state:'visible',timeout:8000});
          await page.evaluate(() => document.fonts.ready);
          await page.waitForTimeout(180);
          const measurement = await page.evaluate(() => {
            const visible = el => { const s=getComputedStyle(el), r=el.getBoundingClientRect(); return s.display!=='none' && s.visibility!=='hidden' && r.width>0 && r.height>0; };
            const controls=[...document.querySelectorAll('button,a,input,select,textarea,[role="tab"],[role="switch"],[role="checkbox"],[role="menuitem"]')].filter(visible);
            const named=controls.map(el => ({
              tag:el.tagName.toLowerCase(), role:el.getAttribute('role'),
              label:(el.getAttribute('aria-label') || el.getAttribute('title') || el.innerText || el.getAttribute('placeholder') || el.getAttribute('name') || '').trim().replace(/\s+/g,' ').slice(0,100),
              href:el.getAttribute('href'), disabled:el.hasAttribute('disabled') || el.getAttribute('aria-disabled')==='true'
            }));
            const offenders=controls.filter(el=>{const r=el.getBoundingClientRect();return r.left < -1 || r.right > innerWidth + 1;}).map(el=>({label:(el.getAttribute('aria-label')||el.innerText||el.tagName).trim().slice(0,60),left:Math.round(el.getBoundingClientRect().left),right:Math.round(el.getBoundingClientRect().right)}));
            return {width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth,overflow:document.documentElement.scrollWidth-innerWidth,theme:document.documentElement.dataset.theme,h1:[...document.querySelectorAll('main h1')].map(x=>x.innerText.trim()),visibleControls:named.length,controls:named,offscreenControls:offenders};
          });
          const row={theme:theme.name,route,viewport:`${width}x${height}`,...measurement};
          results.routes.push({...row,controls:undefined});
          if(width===390){ results.interactions.push({theme:theme.name,route,viewport:`${width}x${height}`,controls:measurement.controls}); }
          if((width===390 || width===1440)) await page.screenshot({path:resolve(out,`${theme.key}-${width}-${route}.png`)});
        } catch (error) { results.errors.push(`${theme.name} ${width}x${height} ${route}: ${String(error)}`); }
      }
    }
  }
  await context.close();

  const isolationContext=await browser.newContext({viewport:{width:1440,height:900}});
  await isolationContext.addInitScript(()=>{sessionStorage.setItem('nemo_session_welcomed','true');localStorage.setItem('nemo_welcome_seen','true')});
  const isolation=await isolationContext.newPage();
  isolation.on('pageerror',e=>results.errors.push(`demo isolation: ${String(e)}`));
  await isolation.goto(`${base}/overview`);
  await isolation.getByRole('button',{name:/Explore demo/}).first().click();
  await isolation.getByText('Exploring fictional sample data. Personal records remain isolated and safe.').waitFor({timeout:8000});
  const demoBadge=await isolation.getByText('Demo Workspace:').isVisible();
  await isolation.goto(`${base}/projects`);
  await isolation.getByRole('heading',{name:'Orbit Analytics'}).waitFor({timeout:10000});
  const demoProjectVisible=await isolation.getByRole('heading',{name:'Orbit Analytics'}).isVisible();
  await isolation.getByRole('button',{name:/Return to my workspace/}).click();
  await isolation.getByRole('heading',{name:'No projects in this view'}).waitFor({timeout:10000});
  results.demoIsolation={demoBadge,demoProjectVisible,returnedToPersonalEmptyState:await isolation.getByRole('heading',{name:'No projects in this view'}).isVisible(),demoProjectAbsent:!(await isolation.getByRole('heading',{name:'Orbit Analytics'}).count())};
  await isolationContext.close();

  const keyContext=await browser.newContext({viewport:{width:320,height:640}});
  await keyContext.addInitScript(()=>{sessionStorage.setItem('nemo_session_welcomed','true');localStorage.setItem('nemo_welcome_seen','true')});
  const keyPage=await keyContext.newPage();
  await keyPage.goto(`${base}/settings`);
  await keyPage.getByRole('tab',{name:'Appearance',exact:true}).focus();
  await keyPage.keyboard.press('End');
  const focused=await keyPage.evaluate(()=>({label:document.activeElement?.textContent?.trim(),selected:document.activeElement?.getAttribute('aria-selected')}));
  results.keyboardTabs={viewport:'320x640',endKeyFocus:focused.label,ariaSelected:focused.selected};
  await keyContext.close();
} finally { await browser.close(); }

results.summary={
  routeViewportThemeChecks:results.routes.length,
  horizontalOverflow:results.routes.filter(x=>x.overflow>0).map(x=>({theme:x.theme,route:x.route,viewport:x.viewport,overflow:x.overflow})),
  offscreenControls:results.routes.filter(x=>x.offscreenControls?.length).map(x=>({theme:x.theme,route:x.route,viewport:x.viewport,controls:x.offscreenControls})),
  themeMismatch:results.routes.filter(x=>x.theme.toLowerCase()!==x.themeKey && false).length,
  screenshots:48,
  errors:results.errors,
};
await writeFile(resolve(out,'visual-interaction-matrix.json'),JSON.stringify(results,null,2));
console.log(JSON.stringify(results.summary,null,2));
console.log(JSON.stringify({demoIsolation:results.demoIsolation,keyboardTabs:results.keyboardTabs},null,2));

