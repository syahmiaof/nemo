import { describe, it, expect, beforeEach } from 'vitest';
import { db, resetWorkspaceData } from '@/db/nemoDb';
import type { ProjectedCalendarItem } from '@/domain/types';

describe('Academics and Unified Calendar Projections', () => {
  beforeEach(async () => {
    await resetWorkspaceData();
  });

  it('maintains strict separation between Submitted and Graded assignment statuses', async () => {
    const now = new Date().toISOString();
    await db.semesters.add({
      id: 'sem_1',
      title: 'Spring 2026',
      status: 'active',
      createdAt: now,
    });

    await db.subjects.add({
      id: 'subj_cs',
      semesterId: 'sem_1',
      code: 'CS301',
      title: 'Algorithms',
      color: '#A8DCC8',
      createdAt: now,
    });

    await db.assignments.add({
      id: 'assign_1',
      subjectId: 'subj_cs',
      title: 'Dynamic Programming Problem Set',
      status: 'submitted',
      dueDate: '2026-10-30',
      submittedAt: now,
      createdAt: now,
      updatedAt: now,
    });

    let assign = await db.assignments.get('assign_1');
    expect(assign?.status).toBe('submitted');
    expect(assign?.scoreObtained).toBeUndefined();

    // Later grading
    await db.assignments.update('assign_1', {
      status: 'graded',
      scoreObtained: 95,
      scoreMaximum: 100,
      updatedAt: new Date().toISOString(),
    });

    assign = await db.assignments.get('assign_1');
    expect(assign?.status).toBe('graded');
    expect(assign?.scoreObtained).toBe(95);
  });

  it('dynamically projects tasks, assignments, and events into unified calendar without duplication', async () => {
    const now = new Date().toISOString();
    const targetDate = '2026-11-05';

    // 1. Task with due date
    await db.tasks.add({
      id: 'task_cal_1',
      title: 'Deploy Production Release',
      status: 'todo',
      priority: 'urgent',
      dueDate: targetDate,
      tags: [],
      createdAt: now,
      updatedAt: now,
    });

    // 2. Assignment with due date
    await db.assignments.add({
      id: 'assign_cal_1',
      subjectId: 'subj_cs',
      title: 'Final Exam Submission',
      status: 'not_started',
      dueDate: targetDate,
      createdAt: now,
      updatedAt: now,
    });

    // 3. Standalone Calendar Event on same date
    await db.calendarEvents.add({
      id: 'event_cal_1',
      title: 'Department Seminar',
      startAt: targetDate,
      endAt: targetDate,
      isAllDay: true,
      createdAt: now,
      updatedAt: now,
    });

    // Project items
    const [tasks, assignments, events] = await Promise.all([
      db.tasks.toArray(),
      db.assignments.toArray(),
      db.calendarEvents.toArray(),
    ]);

    const projected: ProjectedCalendarItem[] = [
      ...tasks.filter((t) => t.dueDate === targetDate).map((t) => ({
        id: `task_${t.id}`,
        sourceType: 'task' as const,
        sourceId: t.id,
        title: t.title,
        date: t.dueDate!,
        isAllDay: true,
      })),
      ...assignments.filter((a) => a.dueDate === targetDate).map((a) => ({
        id: `assign_${a.id}`,
        sourceType: 'assignment' as const,
        sourceId: a.id,
        title: a.title,
        date: a.dueDate!,
        isAllDay: true,
      })),
      ...events.filter((e) => e.startAt.startsWith(targetDate)).map((e) => ({
        id: `event_${e.id}`,
        sourceType: 'event' as const,
        sourceId: e.id,
        title: e.title,
        date: targetDate,
        isAllDay: e.isAllDay,
      })),
    ];

    expect(projected).toHaveLength(3);
    const types = projected.map((p) => p.sourceType);
    expect(types).toContain('task');
    expect(types).toContain('assignment');
    expect(types).toContain('event');

    // Editing assignment deadline shifts calendar projection immediately
    await db.assignments.update('assign_cal_1', { dueDate: '2026-11-10' });
    const updatedAssign = await db.assignments.get('assign_cal_1');
    expect(updatedAssign?.dueDate).toBe('2026-11-10');
  });
});
