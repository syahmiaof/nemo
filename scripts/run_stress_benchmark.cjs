const { chromium } = require('@playwright/test');

const SCALES = [
  { name: 'Small', tasks: 100, projects: 20, milestones: 40, assignments: 15, goals: 5 },
  { name: 'Medium', tasks: 1000, projects: 100, milestones: 200, assignments: 50, goals: 15 },
  { name: 'Large', tasks: 5000, projects: 500, milestones: 1000, assignments: 200, goals: 30 },
  { name: 'Extreme', tasks: 10000, projects: 1000, milestones: 2000, assignments: 400, goals: 50 },
];

function generateStressData(scale) {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;

  const projects = [];
  for (let i = 1; i <= scale.projects; i++) {
    const isCompleted = i % 4 === 0;
    const isArchived = i % 10 === 0;
    projects.push({
      id: `stress_proj_${i}`,
      title: `Stress Project ${i} - Architecture & Reliability`,
      description: `Synthetic project workload item ${i} for scale benchmarking`,
      status: isCompleted ? 'completed' : i % 3 === 0 ? 'in_progress' : 'not_started',
      category: i % 2 === 0 ? 'Engineering' : 'Infrastructure',
      priority: i % 4 === 0 ? 'urgent' : i % 3 === 0 ? 'high' : 'medium',
      color: '#10b981',
      tags: ['benchmark', `tag_${i % 5}`],
      techStack: ['TypeScript', 'IndexedDB'],
      createdAt: new Date(now.getTime() - i * 86400000).toISOString(),
      updatedAt: new Date(now.getTime() - i * 43200000).toISOString(),
      completedAt: isCompleted ? new Date(now.getTime() - i * 20000000).toISOString() : undefined,
      archivedAt: isArchived ? new Date(now.getTime() - i * 10000000).toISOString() : undefined,
    });
  }

  const milestones = [];
  for (let i = 1; i <= scale.milestones; i++) {
    const projIndex = (i % scale.projects) + 1;
    milestones.push({
      id: `stress_ms_${i}`,
      projectId: `stress_proj_${projIndex}`,
      title: `Milestone ${i} Architecture Check`,
      order: i,
      completed: i % 2 === 0,
      dueDate: todayStr,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });
  }

  const tasks = [];
  for (let i = 1; i <= scale.tasks; i++) {
    const isDone = i % 3 === 0;
    const projIndex = (i % scale.projects) + 1;
    // Vary due dates around current month
    const dayOffset = (i % 60) - 30;
    const taskDate = new Date(now.getTime() + dayOffset * 86400000);
    const dateStr = `${taskDate.getFullYear()}-${String(taskDate.getMonth() + 1).padStart(2, '0')}-${String(taskDate.getDate()).padStart(2, '0')}`;

    tasks.push({
      id: `stress_task_${i}`,
      title: `Stress Benchmark Task ${i}: Validate local-first query performance`,
      notes: `Deterministic stress fixture body for task ${i}. Testing memory bounds and filtering efficiency.`,
      status: isDone ? 'done' : 'todo',
      priority: i % 5 === 0 ? 'urgent' : i % 3 === 0 ? 'high' : i % 2 === 0 ? 'medium' : 'low',
      projectId: `stress_proj_${projIndex}`,
      parentType: 'project',
      dueDate: dateStr,
      tags: ['stress', `p${projIndex}`, i % 2 === 0 ? 'frontend' : 'database'],
      createdAt: new Date(now.getTime() - (i % 30) * 86400000).toISOString(),
      updatedAt: now.toISOString(),
      completedAt: isDone ? new Date(now.getTime() - (i % 15) * 86400000).toISOString() : undefined,
    });
  }

  const assignments = [];
  for (let i = 1; i <= scale.assignments; i++) {
    assignments.push({
      id: `stress_asg_${i}`,
      subjectId: `stress_subj_${(i % 5) + 1}`,
      title: `Assignment ${i} Distributed Systems`,
      status: i % 2 === 0 ? 'submitted' : 'assigned',
      dueDate: todayStr,
      weight: 20,
      scoreObtained: i % 2 === 0 ? 90 : undefined,
      scoreMaximum: 100,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });
  }

  const goals = [];
  for (let i = 1; i <= scale.goals; i++) {
    goals.push({
      id: `stress_goal_${i}`,
      title: `Goal ${i}: Zero Cloud Latency`,
      category: 'Performance',
      timeframe: 'yearly',
      targetDate: '2026-12-31',
      status: 'active',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });
  }

  return { projects, milestones, tasks, assignments, goals };
}

async function runStressSuite() {
  console.log('========================================================');
  console.log('   NEMO REALISTIC STRESS & VOLUME BENCHMARK SUITE       ');
  console.log('========================================================\n');

  const browser = await chromium.launch({ headless: true });
  const results = [];

  for (const scale of SCALES) {
    console.log(`\n----------------------------------------------------`);
    console.log(`>>> BENCHMARKING SCALE: ${scale.name.toUpperCase()}`);
    console.log(`    Tasks: ${scale.tasks.toLocaleString()} | Projects: ${scale.projects.toLocaleString()}`);
    console.log(`    Milestones: ${scale.milestones.toLocaleString()} | Assignments: ${scale.assignments.toLocaleString()} | Goals: ${scale.goals.toLocaleString()}`);
    console.log(`----------------------------------------------------`);

    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();

    // 1. Open app and dismiss onboarding
    await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' });
    const skipBtn = page.getByRole('button', { name: 'Skip customization' });
    try {
      await skipBtn.waitFor({ state: 'visible', timeout: 2000 });
      await skipBtn.click();
      await skipBtn.waitFor({ state: 'hidden', timeout: 2000 });
    } catch {}

    // 2. Generate fixture data
    const tGen0 = performance.now();
    const data = generateStressData(scale);
    const genTimeMs = Number((performance.now() - tGen0).toFixed(2));

    // 3. Inject data into IndexedDB
    const injectionResult = await page.evaluate(async (payload) => {
      const t0 = performance.now();
      return new Promise((resolve) => {
        const req = indexedDB.open('NemoDatabase');
        req.onsuccess = async () => {
          const db = req.result;
          const tx = db.transaction(
            ['projects', 'milestones', 'tasks', 'assignments', 'goals'],
            'readwrite'
          );

          // Clear previous stress items
          const clearAll = [
            tx.objectStore('projects').clear(),
            tx.objectStore('milestones').clear(),
            tx.objectStore('tasks').clear(),
            tx.objectStore('assignments').clear(),
            tx.objectStore('goals').clear(),
          ];

          for (const p of payload.projects) tx.objectStore('projects').add(p);
          for (const m of payload.milestones) tx.objectStore('milestones').add(m);
          for (const t of payload.tasks) tx.objectStore('tasks').add(t);
          for (const a of payload.assignments) tx.objectStore('assignments').add(a);
          for (const g of payload.goals) tx.objectStore('goals').add(g);

          tx.oncomplete = () => {
            const durationMs = performance.now() - t0;
            resolve({ success: true, durationMs });
          };
          tx.onerror = (e) => resolve({ success: false, error: e.target.error?.message });
        };
        req.onerror = () => resolve({ success: false, error: 'DB open failed' });
      });
    }, data);

    console.log(`✓ Bulk IndexedDB Insertion: ${injectionResult.durationMs.toFixed(2)} ms`);

    // 4. Measure Reload & Workspace Initial Load with populated DB
    const tReload0 = performance.now();
    await page.reload({ waitUntil: 'networkidle' });
    const initialLoadWithDataMs = Number((performance.now() - tReload0).toFixed(2));
    console.log(`✓ Workspace Initial Load with ${scale.name} Data: ${initialLoadWithDataMs} ms`);

    // Memory after load
    const memAfterLoad = await page.evaluate(() =>
      performance.memory
        ? {
            usedJSHeapMB: Number((performance.memory.usedJSHeapSize / 1048576).toFixed(2)),
            totalJSHeapMB: Number((performance.memory.totalJSHeapSize / 1048576).toFixed(2)),
          }
        : null
    );

    // 5. Measure Tasks Page Navigation & Render
    const tTasks0 = performance.now();
    await page.click('a[href="/tasks"]');
    await page.waitForLoadState('domcontentloaded');
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => setTimeout(r, 0))));
    const tasksPageRenderMs = Number((performance.now() - tTasks0).toFixed(2));
    console.log(`✓ Tasks Page Render: ${tasksPageRenderMs} ms`);

    // 6. Measure Search & Filtering on Tasks Page
    const searchInput = page.getByPlaceholder('Search tasks by title, notes, or tags...');
    const tSearch0 = performance.now();
    await searchInput.fill('Benchmark Task 42');
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => setTimeout(r, 0))));
    const searchFilterMs = Number((performance.now() - tSearch0).toFixed(2));
    console.log(`✓ Task Search & Filter: ${searchFilterMs} ms`);

    // Clear search
    await searchInput.fill('');

    // 7. Measure Filter Tab Switch (Completed tab)
    const tTab0 = performance.now();
    await page.getByRole('button', { name: /Completed/ }).click();
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => setTimeout(r, 0))));
    const filterTabSwitchMs = Number((performance.now() - tTab0).toFixed(2));
    console.log(`✓ Tasks Filter Tab Switch (Done): ${filterTabSwitchMs} ms`);

    // 8. Measure Task Completion Toggle
    const toggleBtn = page.locator('button[aria-label*="Complete"], button[aria-label*="reopen"]').first();
    let taskToggleMs = null;
    if (await toggleBtn.isVisible()) {
      const tToggle0 = performance.now();
      await toggleBtn.click();
      await page.waitForTimeout(100);
      taskToggleMs = Number((performance.now() - tToggle0).toFixed(2));
      console.log(`✓ Task Toggle Mutation: ${taskToggleMs} ms`);
    }

    // 9. Measure Projects Page Navigation & Render
    const tProj0 = performance.now();
    await page.click('a[href="/projects"]');
    await page.waitForLoadState('domcontentloaded');
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => setTimeout(r, 0))));
    const projectsPageRenderMs = Number((performance.now() - tProj0).toFixed(2));
    console.log(`✓ Projects Page Render: ${projectsPageRenderMs} ms`);

    // 10. Measure Calendar Navigation
    const tCal0 = performance.now();
    await page.click('a[href="/calendar"]');
    await page.waitForLoadState('domcontentloaded');
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => setTimeout(r, 0))));
    const calendarRenderMs = Number((performance.now() - tCal0).toFixed(2));
    console.log(`✓ Calendar Month Projection & Render: ${calendarRenderMs} ms`);

    // 11. Measure Insights Page Analytics Calculation
    const tIns0 = performance.now();
    await page.click('a[href="/insights"]');
    await page.waitForLoadState('domcontentloaded');
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => setTimeout(r, 0))));
    const insightsCalcRenderMs = Number((performance.now() - tIns0).toFixed(2));
    console.log(`✓ Insights Page Analytics & Spline Render: ${insightsCalcRenderMs} ms`);

    // 12. Measure Backup / Export Speed on this Dataset
    const backupResult = await page.evaluate(async () => {
      const t0 = performance.now();
      return new Promise((resolve) => {
        const req = indexedDB.open('NemoDatabase');
        req.onsuccess = async () => {
          const db = req.result;
          const stores = Array.from(db.objectStoreNames);
          const tx = db.transaction(stores, 'readonly');
          const payload = {};
          let completed = 0;
          for (const store of stores) {
            const sReq = tx.objectStore(store).getAll();
            sReq.onsuccess = () => {
              payload[store] = sReq.result;
              completed++;
              if (completed === stores.length) {
                const jsonStr = JSON.stringify({
                  version: 1,
                  app: 'nemo',
                  exportedAt: new Date().toISOString(),
                  entities: payload,
                });
                const durationMs = performance.now() - t0;
                resolve({
                  durationMs: Number(durationMs.toFixed(2)),
                  jsonSizeKB: Number((jsonStr.length / 1024).toFixed(2)),
                });
              }
            };
          }
        };
        req.onerror = () => resolve({ error: 'DB open failed' });
      });
    });
    console.log(`✓ Full Backup Export: ${backupResult.durationMs} ms (JSON size: ${backupResult.jsonSizeKB} KB)`);

    // 13. End of scale memory
    const memFinal = await page.evaluate(() =>
      performance.memory
        ? {
            usedJSHeapMB: Number((performance.memory.usedJSHeapSize / 1048576).toFixed(2)),
            totalJSHeapMB: Number((performance.memory.totalJSHeapSize / 1048576).toFixed(2)),
          }
        : null
    );

    results.push({
      scale: scale.name,
      counts: scale,
      bulkInsertMs: Number(injectionResult.durationMs.toFixed(2)),
      initialLoadWithDataMs,
      tasksPageRenderMs,
      searchFilterMs,
      filterTabSwitchMs,
      taskToggleMs,
      projectsPageRenderMs,
      calendarRenderMs,
      insightsCalcRenderMs,
      backupExport: backupResult,
      memory: {
        afterLoadMB: memAfterLoad?.usedJSHeapMB,
        finalMB: memFinal?.usedJSHeapMB,
      },
    });

    await context.close();
  }

  await browser.close();

  console.log('\n========================================================');
  console.log('             COMPLETE STRESS TEST MATRIX                ');
  console.log('========================================================\n');
  console.log(JSON.stringify(results, null, 2));
}

runStressSuite().catch(console.error);
