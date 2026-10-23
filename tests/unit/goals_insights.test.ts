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

  it('calculates genuine health and lifestyle vitality metrics accurately for rolling periods', async () => {
    const today = new Date();
    const formatLocalDate = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const todayStr = formatLocalDate(today);

    const d1 = new Date(today);
    d1.setDate(today.getDate() - 1);
    const day1Str = formatLocalDate(d1);

    const d2 = new Date(today);
    d2.setDate(today.getDate() - 2);
    const day2Str = formatLocalDate(d2);

    const d25 = new Date(today);
    d25.setDate(today.getDate() - 25);
    const day25Str = formatLocalDate(d25);

    // Seed hydration logs
    await db.hydrationLogs.bulkAdd([
      { id: 'hyd_1', date: todayStr, amountMl: 1500, loggedAt: new Date().toISOString() },
      { id: 'hyd_2', date: todayStr, amountMl: 1000, loggedAt: new Date().toISOString() },
      { id: 'hyd_3', date: day1Str, amountMl: 2500, loggedAt: new Date().toISOString() },
      { id: 'hyd_4', date: day2Str, amountMl: 2000, loggedAt: new Date().toISOString() },
    ]);

    // Seed workout logs
    await db.workoutLogs.bulkAdd([
      {
        id: 'wkt_1',
        date: todayStr,
        type: 'running',
        title: 'Morning 5k',
        durationMinutes: 30,
        caloriesBurned: 300,
        completedAt: new Date().toISOString(),
      },
      {
        id: 'wkt_2',
        date: day1Str,
        type: 'strength',
        title: 'Full Body Push',
        durationMinutes: 45,
        caloriesBurned: 350,
        completedAt: new Date().toISOString(),
      },
    ]);

    // Seed diet logs
    await db.dietLogs.bulkAdd([
      { id: 'diet_1', date: todayStr, mealType: 'lunch', foodName: 'Chicken Rice', calories: 750, loggedAt: new Date().toISOString() },
      { id: 'diet_2', date: todayStr, mealType: 'dinner', foodName: 'Salad & Salmon', calories: 650, loggedAt: new Date().toISOString() },
      { id: 'diet_3', date: day1Str, mealType: 'lunch', foodName: 'Pasta', calories: 800, loggedAt: new Date().toISOString() },
    ]);

    // Seed body metrics (30 days window)
    await db.bodyMetrics.bulkAdd([
      { id: 'bm_1', date: day25Str, weightKg: 75.0, loggedAt: new Date().toISOString() },
      { id: 'bm_2', date: todayStr, weightKg: 73.8, loggedAt: new Date().toISOString() },
    ]);

    // 7-day range
    const d7 = new Date(today);
    d7.setDate(today.getDate() - 6);
    const sevenDaysAgoStr = formatLocalDate(d7);

    // Verify Hydration 7-day average & adherence vs 2500ml goal
    const past7Hydration = await db.hydrationLogs
      .filter((l) => l.date >= sevenDaysAgoStr && l.date <= todayStr)
      .toArray();
    const totalMl = past7Hydration.reduce((sum, l) => sum + l.amountMl, 0);
    expect(totalMl).toBe(7000); // 1500 + 1000 + 2500 + 2000
    const avgHydrationMl = Math.round(totalMl / 7);
    expect(avgHydrationMl).toBe(1000);
    const adherenceRate = Math.round((avgHydrationMl / 2500) * 100);
    expect(adherenceRate).toBe(40); // 1000 / 2500 = 40%

    // Verify Workouts 7-day count & active minutes
    const past7Workouts = await db.workoutLogs
      .filter((w) => w.date >= sevenDaysAgoStr && w.date <= todayStr)
      .toArray();
    expect(past7Workouts).toHaveLength(2);
    const totalActiveMinutes = past7Workouts.reduce((sum, w) => sum + (w.durationMinutes || 0), 0);
    expect(totalActiveMinutes).toBe(75); // 30 + 45
    const totalBurned = past7Workouts.reduce((sum, w) => sum + (w.caloriesBurned || 0), 0);
    expect(totalBurned).toBe(650);

    // Verify Caloric intake vs burn
    const past7Diet = await db.dietLogs
      .filter((m) => m.date >= sevenDaysAgoStr && m.date <= todayStr)
      .toArray();
    const totalIntake = past7Diet.reduce((sum, m) => sum + (m.calories || 0), 0);
    expect(totalIntake).toBe(2200); // 750 + 650 + 800
    const avgIntake = Math.round(totalIntake / 7);
    expect(avgIntake).toBe(314);
    const avgBurn = Math.round(totalBurned / 7);
    expect(avgBurn).toBe(93);

    // Verify Weight & 30-day net delta
    const metrics = await db.bodyMetrics.toArray();
    const sorted = [...metrics].sort((a, b) => a.date.localeCompare(b.date));
    expect(sorted).toHaveLength(2);
    const latest = sorted[sorted.length - 1];
    expect(latest.weightKg).toBe(73.8);
    const baseline = sorted[0];
    const weightDelta = Number((latest.weightKg - baseline.weightKg).toFixed(1));
    expect(weightDelta).toBe(-1.2); // 73.8 - 75.0 = -1.2kg
  });
});
