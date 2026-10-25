import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { NemoDatabase } from '@/db/nemoDb';
import { seedDemoWorkspace } from '@/db/workspace';
import { createDemoFixtures } from '@/demo/fixtures';
import { databaseNameForMode, DEMO_DATABASE_NAME, getWorkspaceMode, REAL_DATABASE_NAME, WORKSPACE_MODE_KEY } from '@/db/workspaceMode';
import { BackupSchema } from '@/domain/schemas';

const anchor = new Date(2026, 9, 20, 16, 42);

describe('Isolated deterministic demo workspace', () => {
  let demo: NemoDatabase;
  let real: NemoDatabase;
  beforeEach(async () => {
    demo = new NemoDatabase(DEMO_DATABASE_NAME);
    real = new NemoDatabase('DemoTestsRealSentinel');
    await demo.delete();
    await real.delete();
    await demo.open();
    await real.open();
    localStorage.removeItem(WORKSPACE_MODE_KEY);
  });
  afterEach(async () => {
    await demo.delete();
    await real.delete();
    localStorage.removeItem(WORKSPACE_MODE_KEY);
  });

  it('retains the exact real namespace and requires an explicit saved demo choice', () => {
    expect(getWorkspaceMode()).toBe('real');
    expect(databaseNameForMode('real')).toBe('NemoDatabase');
    expect(REAL_DATABASE_NAME).toBe('NemoDatabase');
    localStorage.setItem(WORKSPACE_MODE_KEY, 'demo');
    expect(getWorkspaceMode()).toBe('demo');
    expect(databaseNameForMode(getWorkspaceMode())).toBe(DEMO_DATABASE_NAME);
    localStorage.setItem(WORKSPACE_MODE_KEY, 'unrecognized');
    expect(getWorkspaceMode()).toBe('real');
  });

  it('creates schema-valid deterministic fixtures with requested counts and original covers', () => {
    const data = createDemoFixtures(anchor);
    expect(createDemoFixtures(new Date(2026, 9, 20, 23, 59))).toEqual(data);
    expect(BackupSchema.safeParse({ app: 'nemo', version: 1, exportedAt: anchor.toISOString(), data }).success).toBe(true);
    expect(data.projects).toHaveLength(18);
    expect(data.tasks).toHaveLength(150);
    expect(data.milestones.filter(item => item.ownerType === 'project')).toHaveLength(36);
    expect(data.milestones.filter(item => item.ownerType === 'goal')).toHaveLength(30);
    expect(data.semesters).toHaveLength(2);
    expect(data.subjects).toHaveLength(6);
    expect(data.assignments).toHaveLength(24);
    expect(data.calendarEvents).toHaveLength(20);
    expect(data.goals).toHaveLength(6);
    expect(data.visionItems).toHaveLength(7);
    expect(data.monthlyRoadmaps).toHaveLength(12);
    expect(data.incomeItems).toHaveLength(4);
    expect(data.ibadahDailyLogs).toHaveLength(3);
    expect(data.qadhaPrayers).toHaveLength(5);
    expect(data.qadhaFastings).toHaveLength(3);
    expect(new Set(data.tasks.map(task => task.title)).size).toBe(150);
    expect(data.assetBlobs).toHaveLength(18);
    data.assetBlobs.forEach(asset => expect(asset.data).toMatch(/^data:image\/svg\+xml;base64,/));
  });

  it('keeps dates coherent, spans over twelve months, and anchors focus to the local day', () => {
    const data = createDemoFixtures(anchor);
    const completions = data.projects.filter(project => project.completedAt).map(project => Date.parse(project.completedAt!));
    expect(Math.max(...completions) - Math.min(...completions)).toBeGreaterThan(365 * 86400000);
    for (const project of data.projects) {
      if (project.completedAt) expect(Date.parse(project.completedAt)).toBeGreaterThanOrEqual(Date.parse(project.createdAt));
    }
    for (const task of data.tasks) {
      if (task.completedAt) {
        expect(task.status).toBe('done');
        expect(Date.parse(task.completedAt)).toBeGreaterThanOrEqual(Date.parse(task.createdAt));
        expect(Date.parse(task.completedAt)).toBeLessThanOrEqual(anchor.getTime());
        const parent = data.projects.find(project => project.id === task.parentId);
        if (parent?.completedAt) expect(Date.parse(task.completedAt)).toBeLessThanOrEqual(Date.parse(parent.completedAt));
      }
    }
    expect(data.focusSelections).toHaveLength(3);
    data.focusSelections.forEach(focus => {
      expect(focus.effectiveLocalDate).toBe('2026-10-20');
      const task = data.tasks.find(item => item.id === focus.taskId);
      expect(task).toBeDefined();
      expect(task?.status).not.toBe('done');
      expect(task?.dueDate).toBe('2026-10-20');
    });
    data.goalTaskLinks.forEach(link => {
      expect(data.goals.some(goal => goal.id === link.goalId)).toBe(true);
      expect(data.tasks.some(task => task.id === link.taskId)).toBe(true);
    });
    data.calendarEvents.forEach(event => expect(Date.parse(event.endAt)).toBeGreaterThanOrEqual(Date.parse(event.startAt)));
  });

  it('initializes once even across concurrent calls and preserves edits and deletions on refresh', async () => {
    await Promise.all([seedDemoWorkspace(demo, false, anchor), seedDemoWorkspace(demo, false, anchor)]);
    await demo.tasks.update('demo-task-1', { title: 'My edited demo task' });
    await demo.tasks.delete('demo-task-2');
    demo.close();
    demo = new NemoDatabase(DEMO_DATABASE_NAME);
    await seedDemoWorkspace(demo, false, new Date(2026, 9, 21));
    expect(await demo.projects.count()).toBe(18);
    expect(await demo.tasks.count()).toBe(149);
    expect((await demo.tasks.get('demo-task-1'))?.title).toBe('My edited demo task');
    expect(await demo.tasks.get('demo-task-2')).toBeUndefined();
    expect((await demo.focusSelections.get('demo-focus-1'))?.effectiveLocalDate).toBe('2026-10-20');
  });

  it.each([new Date(2027, 0, 1), new Date(2028, 1, 29), new Date(2026, 11, 31)])('keeps references and chronology valid at calendar boundary %s', (boundary) => {
    const data = createDemoFixtures(boundary);
    data.subjects.forEach(subject => expect(data.semesters.some(semester => semester.id === subject.semesterId)).toBe(true));
    data.assignments.forEach(assignment => {
      expect(data.subjects.some(subject => subject.id === assignment.subjectId)).toBe(true);
      if (assignment.submittedAt) {
        expect(Date.parse(assignment.submittedAt)).toBeGreaterThanOrEqual(Date.parse(assignment.createdAt));
        expect(Date.parse(assignment.updatedAt)).toBeGreaterThanOrEqual(Date.parse(assignment.submittedAt));
      }
    });
    data.tasks.filter(task => task.parentId).forEach(task => expect(data.projects.some(project => project.id === task.parentId)).toBe(true));
    data.milestones.forEach(milestone => {
      const owner = milestone.ownerType === 'project'
        ? data.projects.find(project => project.id === milestone.ownerId)
        : data.goals.find(goal => goal.id === milestone.ownerId);
      expect(owner).toBeDefined();
      if (milestone.completedAt) expect(Date.parse(milestone.completedAt)).toBeGreaterThanOrEqual(Date.parse(owner!.createdAt));
    });
  });

  it('resets only demo records and rejects real namespace seed/reset', async () => {
    const sentinel = { ...createDemoFixtures(anchor).projects[0], id: 'real-sentinel', title: 'Keep my real work' };
    await real.projects.add(sentinel);
    await seedDemoWorkspace(demo, false, anchor);
    await demo.tasks.update('demo-task-1', { title: 'Edited' });
    await demo.tasks.add({ ...createDemoFixtures(anchor).tasks[0], id: 'my-demo-task' });
    await seedDemoWorkspace(demo, true, anchor);
    expect(await demo.tasks.count()).toBe(150);
    expect((await demo.tasks.get('demo-task-1'))?.title).not.toBe('Edited');
    expect(await real.projects.get(sentinel.id)).toEqual(sentinel);
    await expect(seedDemoWorkspace(real, true, anchor)).rejects.toThrow('only permitted');
    const actualReal = new NemoDatabase(REAL_DATABASE_NAME);
    await expect(seedDemoWorkspace(actualReal, true, anchor)).rejects.toThrow('only permitted');
    actualReal.close();
    expect(await real.projects.get(sentinel.id)).toEqual(sentinel);
  });

  it('leaves partial unrecognized demo storage untouched until an explicit reset', async () => {
    const task = createDemoFixtures(anchor).tasks[0];
    await demo.tasks.add(task);
    await expect(seedDemoWorkspace(demo, false, anchor)).rejects.toThrow('unrecognized data');
    expect(await demo.tasks.toArray()).toEqual([task]);
    expect(await demo.settings.count()).toBe(0);
  });

  it('rolls back a failed reset without losing existing demo edits', async () => {
    await seedDemoWorkspace(demo, false, anchor);
    await demo.tasks.update('demo-task-1', { title: 'Preserve after failed reset' });
    const failInsertion = () => { throw new Error('Simulated write failure'); };
    demo.projects.hook('creating', failInsertion);
    await expect(seedDemoWorkspace(demo, true, anchor)).rejects.toThrow('Simulated write failure');
    demo.projects.hook('creating').unsubscribe(failInsertion);
    expect((await demo.tasks.get('demo-task-1'))?.title).toBe('Preserve after failed reset');
    expect(await demo.projects.count()).toBe(18);
  });

  it('populates and supports interactive operations on all modern tables (vision, roadmaps, income, ibadah, qadha)', async () => {
    await seedDemoWorkspace(demo, false, anchor);

    // Verify all 6 new tables are seeded with realistic data
    expect(await demo.visionItems.count()).toBe(7);
    expect(await demo.monthlyRoadmaps.count()).toBe(12);
    expect(await demo.incomeItems.count()).toBe(4);
    expect(await demo.ibadahDailyLogs.count()).toBe(3);
    expect(await demo.qadhaPrayers.count()).toBe(5);
    expect(await demo.qadhaFastings.count()).toBe(3);

    // Test interactive mutations (add, edit, toggle, delete)
    // 1. Vision item edit & toggle
    await demo.visionItems.update('demo-vis-1', { status: 'manifested', manifestedAt: anchor.toISOString() });
    const updatedVis = await demo.visionItems.get('demo-vis-1');
    expect(updatedVis?.status).toBe('manifested');

    // 2. Income stream addition & deletion
    await demo.incomeItems.add({
      id: 'demo-inc-test',
      title: 'Ad-hoc Technical Workshop',
      amount: 1200,
      type: 'freelance_project',
      isRecurring: false,
      createdAt: anchor.toISOString(),
      updatedAt: anchor.toISOString(),
    });
    expect(await demo.incomeItems.count()).toBe(5);
    await demo.incomeItems.delete('demo-inc-test');
    expect(await demo.incomeItems.count()).toBe(4);

    // 3. Ibadah daily log toggle & increment
    const todayLog = await demo.ibadahDailyLogs.get('ibd_2026-10-20');
    expect(todayLog).toBeDefined();
    expect(todayLog?.dhikrCount).toBe(99);
    await demo.ibadahDailyLogs.update('ibd_2026-10-20', {
      dhikrCount: 132,
      sedekahDone: false,
    });
    const modifiedLog = await demo.ibadahDailyLogs.get('ibd_2026-10-20');
    expect(modifiedLog?.dhikrCount).toBe(132);
    expect(modifiedLog?.sedekahDone).toBe(false);

    // 4. Qadha prayer count adjustment
    const subuhQadha = await demo.qadhaPrayers.get('qp_subuh');
    expect(subuhQadha?.remainingCount).toBe(17);
    await demo.qadhaPrayers.update('qp_subuh', {
      completedCount: (subuhQadha?.completedCount ?? 0) + 1,
      remainingCount: (subuhQadha?.remainingCount ?? 0) - 1,
    });
    expect((await demo.qadhaPrayers.get('qp_subuh'))?.remainingCount).toBe(16);

    // 5. Qadha fasting fidyah toggle
    const fasting1445 = await demo.qadhaFastings.get('qf_1445');
    expect(fasting1445?.isFidyahPaid).toBe(false);
    await demo.qadhaFastings.update('qf_1445', { isFidyahPaid: true, fidyahPaidAt: anchor.toISOString() });
    expect((await demo.qadhaFastings.get('qf_1445'))?.isFidyahPaid).toBe(true);

    // 6. Reset demo restores everything to pristine original state
    await seedDemoWorkspace(demo, true, anchor);
    expect(await demo.visionItems.count()).toBe(7);
    expect((await demo.visionItems.get('demo-vis-1'))?.status).toBe('in_progress');
    expect((await demo.ibadahDailyLogs.get('ibd_2026-10-20'))?.dhikrCount).toBe(99);
    expect((await demo.qadhaPrayers.get('qp_subuh'))?.remainingCount).toBe(17);
    expect((await demo.qadhaFastings.get('qf_1445'))?.isFidyahPaid).toBe(false);
  });
});
