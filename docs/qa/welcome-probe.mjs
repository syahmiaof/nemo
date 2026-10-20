import { chromium } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});
await c.addInitScript(()=>{sessionStorage.setItem('nemo_session_welcomed','true');localStorage.setItem('nemo_welcome_seen','true');localStorage.setItem('nemo:workspace-mode','demo')});
const p=await c.newPage();const out=[];
for(const r of ['overview','projects','tasks']){
  await p.goto('http://127.0.0.1:4173/'+r,{waitUntil:'domcontentloaded'});
  for(const delay of [0,300,900]){
    await p.waitForTimeout(delay);
    out.push(await p.evaluate(({r,delay})=>({r,delay,session:sessionStorage.getItem('nemo_session_welcomed'),local:localStorage.getItem('nemo_welcome_seen'),welcome:!!document.querySelector('[aria-label="Welcome to Nemo"]'),body:document.body.innerText.slice(0,80)}),{r,delay}));
  }
}
await c.close();await b.close();
await writeFile(fileURLToPath(new URL('./artifacts/welcome-probe.json',import.meta.url)),JSON.stringify(out,null,2));console.log(JSON.stringify(out,null,2));
