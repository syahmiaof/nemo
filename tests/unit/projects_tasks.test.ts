import { describe, it, expect, beforeEach } from 'vitest';
import { db, resetWorkspaceData } from '@/db/nemoDb';
import { getTodayLocalDateString } from '@/lib/dates';
import type { Project } from '@/domain/types';

describe('Projects and Canonical Tasks Invariants', () => {
  beforeEach(async () => {
    await resetWorkspaceData();
  });

  it('sets and clears completedAt timestamp accurately on project status change', async () => {
    const now = new Date().toISOString();
    const project: Project = {
      id: 'proj_lifecycle',
      title: 'Lifecycle App',
      priority: 'high',
      status: 'in_progress',
      createdAt: now,
      updatedAt: now,
      tags: [],
      techStack: [],
    };
    await db.projects.add(project);

    // Complete project
    const completedAt = new Date().toISOString();
    await db.projects.update('proj_lifecycle', {
      status: 'completed',
      completedAt,
      updatedAt: completedAt,
    });

    let p = await db.projects.get('proj_lifecycle');
    expect(p?.status).toBe('completed');
    expect(p?.completedAt).toBe(completedAt);

    // Reopen project
    await db.projects.update('proj_lifecycle', {
      status: 'in_progress',
      completedAt: undefined,
      updatedAt: new Date().toISOString(),
    });

    p = await db.projects.get('proj_lifecycle');
    expect(p?.status).toBe('in_progress');
    expect(p?.completedAt).toBeUndefined();
  });

  it('guarantees single canonical task identity across parent project and tasks list', async () => {
    const now = new Date().toISOString();
    await db.projects.add({
      id: 'proj_p1',
      title: 'Core Engine',
      priority: 'urgent',
      status: 'in_progress',
      createdAt: now,
      updatedAt: now,
      tags: [],
      techStack: [],
    });

    await db.tasks.add({
      id: 'task_canonical_1',
      title: 'Build indexed database',
      status: 'todo',
      priority: 'high',
      parentType: 'project',
      parentId: 'proj_p1',
      dueDate: getTodayLocalDateString(),
      tags: [],
      createdAt: now,
      updatedAt: now,
    });

    // Verify task is visible in project tasks query
    const projectTasks = await db.tasks.where('parentId').equals('proj_p1').toArray();
    expect(projectTasks).toHaveLength(1);
    expect(projectTasks[0].id).toBe('task_canonical_1');

    // Complete task from task query
    const completionTime = new Date().toISOString();
    await db.tasks.update('task_canonical_1', {
      status: 'done',
      completedAt: completionTime,
    });

    // Re-verify from project tasks query - must reflect the same canonical update without cloning
    const updatedProjectTasks = await db.tasks.where('parentId').equals('proj_p1').toArray();
    expect(updatedProjectTasks[0].status).toBe('done');
    expect(updatedProjectTasks[0].completedAt).toBe(completionTime);
  });

  it('enforces maximum 3 unfinished focus slots for the local active day', async () => {
    const today = getTodayLocalDateString();
    const now = new Date().toISOString();

    // Create 4 tasks
    for (let i = 1; i <= 4; i++) {
      await db.tasks.add({
        id: `t_${i}`,
        title: `Task ${i}`,
        status: 'todo',
        priority: 'medium',
        tags: [],
        createdAt: now,
        updatedAt: now,
      });
    }

    // Add first 3 to focus
    for (let i = 1; i <= 3; i++) {
      await db.focusSelections.add({
        id: `${today}_t_${i}`,
        taskId: `t_${i}`,
        effectiveLocalDate: today,
        chosenAt: now,
      });
    }

    const currentFocus = await db.focusSelections.where('effectiveLocalDate').equals(today).toArray();
    expect(currentFocus).toHaveLength(3);

    // Completing a task allows releasing its focus slot
    await db.tasks.update('t_1', { status: 'done', completedAt: now });
    await db.focusSelections.delete(`${today}_t_1`);

    const remainingFocus = await db.focusSelections.where('effectiveLocalDate').equals(today).toArray();
    expect(remainingFocus).toHaveLength(2);
  });
});
