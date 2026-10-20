import { describe, it, expect, beforeEach } from 'vitest';
import { db, resetWorkspaceData } from '@/db/nemoDb';
import { getYearFromDate } from '@/lib/dates';


describe('Goals and Insights Invariants', () => {
  beforeEach(async () => {
    await resetWorkspaceData();
  });

  it('accurately derives goal milestone progress without cloning tasks', async () => {
    const now = new Date().toISOString();
    await db.goals.add({
      id: 'goal_1',
      title: 'Run a Half Marathon',
      why: 'Build cardiovascular endurance',
      status: 'active',
      createdAt: now,
      updatedAt: now,
    });

    // Zero milestones state (Invariant 7)
    let milestones = await db.milestones.where('ownerId').equals('goal_1').toArray();
    expect(milestones).toHaveLength(0);

    // Add 2 milestones
    await db.milestones.add({
      id: 'm_1',
      ownerType: 'goal',
      ownerId: 'goal_1',
      title: 'Run 5km continuously',
      order: 1,
    });
    await db.milestones.add({
      id: 'm_2',
      ownerType: 'goal',
      ownerId: 'goal_1',
      title: 'Run 10km continuously',
      order: 2,
    });

    milestones = await db.milestones.where('ownerId').equals('goal_1').toArray();
    expect(milestones).toHaveLength(2);

    // Complete first milestone
    await db.milestones.update('m_1', { completedAt: new Date().toISOString() });
    milestones = await db.milestones.where('ownerId').equals('goal_1').toArray();
    const completedCount = milestones.filter((m) => m.completedAt).length;
    expect(completedCount).toBe(1);
    expect(Math.round((completedCount / milestones.length) * 100)).toBe(50);

    // Attach existing task to goal via relation without cloning
    await db.tasks.add({
      id: 'task_run_shoes',
      title: 'Buy marathon running shoes',
      status: 'todo',
      priority: 'high',
      tags: ['fitness'],
      createdAt: now,
      updatedAt: now,
    });

    await db.goalTaskLinks.add({
      id: 'gtl_1',
      goalId: 'goal_1',
      taskId: 'task_run_shoes',
      createdAt: now,
    });

    const links = await db.goalTaskLinks.where('goalId').equals('goal_1').toArray();
    expect(links).toHaveLength(1);
    expect(links[0].taskId).toBe('task_run_shoes');

    // Canonical tasks count must still be exactly 1
    const totalTasks = await db.tasks.toArray();
    expect(totalTasks).toHaveLength(1);
  });

  it('groups yearly and monthly project completions strictly by completedAt, not createdAt', async () => {
    // Project created in 2025, but completed in 2026
    await db.projects.add({
      id: 'proj_2025_2026',
      title: 'Long Running Initiative',
      priority: 'high',
      status: 'completed',
      createdAt: '2025-06-15T10:00:00.000Z',
      completedAt: '2026-03-20T14:30:00.000Z',
      tags: [],
      techStack: [],
      updatedAt: '2026-03-20T14:30:00.000Z',
    });

    // Project created in 2026 and still in progress
    await db.projects.add({
      id: 'proj_2026_active',
      title: 'Active 2026 Build',
      priority: 'medium',
      status: 'in_progress',
      createdAt: '2026-01-10T10:00:00.000Z',
      tags: [],
      techStack: [],
      updatedAt: '2026-01-10T10:00:00.000Z',
    });

    const allProjects = await db.projects.toArray();
    expect(allProjects).toHaveLength(2);

    // Check year metrics for 2026
    const createdIn2026 = allProjects.filter((p) => getYearFromDate(p.createdAt) === 2026);
    expect(createdIn2026).toHaveLength(1);
    expect(createdIn2026[0].id).toBe('proj_2026_active');

    // Completed in 2026 must be based on completedAt (Invariant 5)
    const completedIn2026 = allProjects.filter((p) => getYearFromDate(p.completedAt) === 2026);
    expect(completedIn2026).toHaveLength(1);
    expect(completedIn2026[0].id).toBe('proj_2025_2026');

    // Completed month must be March (index 2)
    const completionMonth = new Date(completedIn2026[0].completedAt!).getMonth();
    expect(completionMonth).toBe(2); // 0-indexed: 2 = March
  });
});
