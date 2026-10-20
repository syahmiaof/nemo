import { chromium } from '@playwright/test';
const browser = await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:900}});
await page.goto('https://demo.codeandchill.store/tavola/#/overview',{waitUntil:'networkidle'});
await page.screenshot({path:'docs/reference/evidence/tavola-initial.png'});
console.log(await page.locator('body').innerText());
console.log(await page.evaluate(()=>[...document.querySelectorAll('nav,aside,main,h1,button')].slice(0,50).map(e=>({tag:e.tagName,cls:e.className,text:e.textContent?.slice(0,80)}))));
await browser.close();
