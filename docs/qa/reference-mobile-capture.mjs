import { chromium } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const path=name=>fileURLToPath(new URL(`./artifacts/${name}`,import.meta.url));
const b=await chromium.launch();const p=await b.newPage({viewport:{width:390,height:844}});
await p.goto('https://demo.codeandchill.store/tavola/#/overview',{waitUntil:'domcontentloaded',timeout:30000});await p.waitForTimeout(2800);
await p.screenshot({path:path('tavola-reference-settled-390.png')});
const result=await p.evaluate(()=>({url:location.href,h1:document.querySelector('h1')?.textContent,scrollWidth:document.documentElement.scrollWidth,width:innerWidth}));
await b.close();await writeFile(path('reference-mobile.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
