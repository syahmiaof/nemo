import { chromium, webkit, devices } from '@playwright/test';
import fs from 'node:fs/promises';
const label = process.argv[2] || 'baseline';
const browserName = process.argv[3] || 'desktop';
const cycles = Number(process.argv[4] || 3);
const record = process.argv[5] !== 'perf';
const automatic = process.argv[5] === 'auto';
const dir = `docs/evidence/sprint62/${label}-${browserName}`;
await fs.mkdir(dir, { recursive: true });
const browser = await (browserName === 'webkit' ? webkit : chromium).launch();
const viewport = browserName === 'desktop' ? { width: 1440, height: 900 } : { width: 390, height: 844 };
const context = await browser.newContext({ ...(browserName === 'desktop' ? {} : devices['iPhone 13']), viewport,
  ...(record ? {recordVideo: {dir, size: viewport}} : {}) });
await context.addInitScript(() => {
  localStorage.setItem('nemo:workspace-mode', 'demo');
  // Deterministic shuffle for comparable source/destination quotes across runs.
  let seed = 62;
  Math.random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  window.sparkQA = { frames: [], longTasks: [], draws: 0, samples: 0, idleDraws: 0 };
  for (const method of ['clearRect', 'getImageData']) {
    const original = CanvasRenderingContext2D.prototype[method];
    CanvasRenderingContext2D.prototype[method] = function (...args) {
      if (method === 'getImageData') window.sparkQA.samples++;
      if (method === 'clearRect' && this.canvas.isConnected) window.sparkQA.draws++;
      return original.apply(this, args);
    };
  }
  let previous = 0;
  const frame = time => {
    if (document.querySelector('[data-motion-phase]') && previous) window.sparkQA.frames.push(time - previous);
    previous = time; requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
  try {new PerformanceObserver(list => window.sparkQA.longTasks.push(...list.getEntries().map(e => e.duration))).observe({type:'longtask', buffered:true});} catch {}
});
const page = await context.newPage();
const errors = [];
page.on('pageerror', e => errors.push(e.message));
await page.goto(`${process.env.SPARK_URL || 'http://localhost:5173'}/overview`);
const card = page.locator('section[aria-label="Spark of focus motivational quote"]');
await card.waitFor({state:'attached'});
await card.getByRole('button', {name:'Pause quote rotation'}).dispatchEvent('click');
for (const [role, name] of [['dialog', 'Welcome to Nemo'], ['button', 'Skip customization']]) {
  const locator = page.getByRole(role, {name});
  await locator.waitFor({state:'visible', timeout:10000}).catch(() => {});
  if (await locator.isVisible()) {
    await locator.dispatchEvent('click');
    await locator.waitFor({state:'hidden', timeout:15000});
  }
}
await page.waitForTimeout(1800);
const lateWelcome = page.getByRole('dialog', {name:'Welcome to Nemo'});
if (await lateWelcome.isVisible()) {
  await lateWelcome.dispatchEvent('click');
  await lateWelcome.waitFor({state:'hidden', timeout:15000});
}
await card.scrollIntoViewIfNeeded();
await page.mouse.move(1,1);
await page.waitForTimeout(2200);
const bounds = await card.boundingBox();
if (record) await card.screenshot({path:`${dir}/00-solid.png`});
await page.evaluate(() => {window.sparkQA.frames=[]; window.sparkQA.longTasks=[]; window.sparkQA.draws=0; window.sparkQA.samples=0;});
await page.waitForTimeout(750);
const idleDraws = await page.evaluate(() => window.sparkQA.draws);
const cdp = browserName === 'webkit' ? null : await context.newCDPSession(page);
if (cdp) { await cdp.send('Performance.enable'); await cdp.send('HeapProfiler.collectGarbage'); }
const metrics = async () => cdp ? Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(m=>[m.name,m.value])) : {};
const before = await metrics();
const quotes = [];
const cycleTimes = [];
const heapCheckpoints = [];
if (automatic) await card.getByRole('button', {name:'Resume quote rotation'}).dispatchEvent('click');
for (let i = 0; i < cycles; i++) {
  quotes.push(await card.locator('p').first().textContent());
  if (!automatic) await card.getByRole('button', {name:'Next motivational quote'}).dispatchEvent('click');
  await page.waitForFunction(() => !!document.querySelector('[data-motion-phase]'), null, {timeout:10000});
  const start = Date.now();
  if (record && !automatic && i === 0) {
    let elapsed=0;
    for (const [ms, name] of [[70,'living'],[330,'fracture'],[600,'dissolve'],[950,'orbital'],[1450,'summoning'],[1820,'reconstruction']]) {
      await page.waitForTimeout(Math.max(0, ms-elapsed));
      const start=Date.now(); await card.screenshot({path:`${dir}/${ms}-${name}.png`});
      elapsed=ms+Date.now()-start;
    }
  }
  try {
    await page.waitForFunction(() => !document.querySelector('[data-motion-phase]'), null, {timeout:7000});
  } catch (error) {
    await page.screenshot({path:`${dir}/failure.png`});
    console.log(await page.evaluate(()=>{
      const canvas=document.querySelector('canvas[data-motion-phase]');
      let fiber=canvas?.[Object.keys(canvas).find(k=>k.startsWith('__reactFiber'))];
      const props=[];for(let i=0;fiber&&i<5;i++,fiber=fiber.return)props.push({name:fiber.type?.name,active:fiber.memoizedProps?.isActive,transitioning:fiber.memoizedProps?.isTransitioning});
      return {hidden:document.hidden,phase:canvas?.dataset.motionPhase,focused:document.activeElement?.tagName,rect:canvas?.getBoundingClientRect().toJSON(),viewport:[innerWidth,innerHeight],props};
    }));
    await context.close();await browser.close();throw error;
  }
  cycleTimes.push({index:i+1, start, elapsedMs:Date.now()-start});
  if (cdp && [10,25,50].includes(i+1)) {
    await cdp.send('HeapProfiler.collectGarbage');
    heapCheckpoints.push({cycle:i+1, heap:(await metrics()).JSHeapUsedSize});
  }
  await page.waitForTimeout(record && !automatic ? 3200 : 30);
}
if (automatic) await card.getByRole('button', {name:'Pause quote rotation'}).dispatchEvent('click');
quotes.push(await card.locator('p').first().textContent());
if (cdp) await cdp.send('HeapProfiler.collectGarbage');
const after = await metrics();
const stats = await page.evaluate(() => window.sparkQA);
const sorted=stats.frames.sort((a,b)=>a-b);
const summary={label,browserName,cycles,record,automatic,bounds,quotes,cycleTimes,heapCheckpoints,idleDraws,draws:stats.draws,samples:stats.samples,frameCount:sorted.length,
  frameMedian:sorted[Math.floor(sorted.length*.5)],frameP95:sorted[Math.floor(sorted.length*.95)],longTasks:stats.longTasks,
  taskSeconds:after.TaskDuration-before.TaskDuration,heapBefore:before.JSHeapUsedSize,heapAfter:after.JSHeapUsedSize,errors};
await fs.writeFile(`${dir}/metrics.json`,JSON.stringify(summary,null,2));
if(record) await card.screenshot({path:`${dir}/99-complete.png`});
const video=page.video(); await context.close();
if(video) await video.saveAs(`${dir}/three-transformations.webm`);
await browser.close(); console.log(JSON.stringify(summary));
