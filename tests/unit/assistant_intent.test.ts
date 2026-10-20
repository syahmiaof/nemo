import { describe, it, expect, beforeEach } from 'vitest';
import { db, resetWorkspaceData } from '@/db/nemoDb';
import {
  detectIntent,
  processAssistantQuery,
  SUGGESTED_QUESTIONS,
} from '@/features/assistant/intentEngine';
import { getTodayLocalDateString } from '@/lib/dates';
import { addDays, subDays } from 'date-fns';

describe('Ask Nemo Deterministic Intent Engine', () => {
  beforeEach(async () => {
    await resetWorkspaceData();
  });

  describe('Intent Detection', () => {
    it('accurately classifies all 10 core intent phrases', () => {
      expect(detectIntent('What tasks are due today?')).toBe('due_today_tasks');
      expect(detectIntent('tasks due today')).toBe('due_today_tasks');
      expect(detectIntent('Overdue tasks')).toBe('overdue_tasks');
      expect(detectIntent('what is overdue?')).toBe('overdue_tasks');
      expect(detectIntent('Assignments due this week')).toBe('assignments_due_this_week');
      expect(detectIntent('coursework deadlines this week')).toBe('assignments_due_this_week');
      expect(detectIntent('Closest project deadline')).toBe('closest_project_deadline');
      expect(detectIntent('Active projects')).toBe('active_projects');
      expect(detectIntent("Today's focus tasks")).toBe('todays_focus_tasks');
      expect(detectIntent('Tasks finished this month')).toBe('tasks_finished_this_month');
      expect(detectIntent('Upcoming milestones')).toBe('upcoming_milestones');
      expect(detectIntent('Active goals')).toBe('active_goals');
      expect(detectIntent('Project progress summary')).toBe('project_progress_summary');
    });

    it('falls back to unknown for unhandled queries with suggestions', () => {
      expect(detectIntent('What is the weather outside?')).toBe('unknown');
      expect(detectIntent('')).toBe('unknown');
    });
  });

  describe('Offline Workspace Queries', () => {
    it('answers due today tasks correctly', async () => {
      const today = getTodayLocalDateString();
      const now = new Date().toISOString();

      await db.tasks.bulkAdd([
        {
          id: 'task-1',
          title: 'Review PR #42',
          status: 'todo',
          priority: 'urgent',
          dueDate: today,
          tags: [],
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 'task-2',
          title: 'Already finished task',
          status: 'done',
          priority: 'medium',
          dueDate: today,
          completedAt: now,
          tags: [],
          createdAt: now,
          updatedAt: now,
        },
      ]);

      const res = await processAssistantQuery('What tasks are due today?');
      expect(res.intent).toBe('due_today_tasks');
      expect(res.items.length).toBe(1);
      expect(res.items[0].title).toBe('Review PR #42');
      expect(res.items[0].badge).toBe('URGENT');
    });

    it('answers overdue tasks correctly', async () => {
      const now = new Date().toISOString();
      const yesterday = subDays(new Date(), 1).toISOString().slice(0, 10);

      await db.tasks.add({
        id: 'task-overdue',
        title: 'Submit tax documentation',
        status: 'todo',
        priority: 'high',
        dueDate: yesterday,
        tags: [],
        createdAt: now,
        updatedAt: now,
      });

      const res = await processAssistantQuery('Overdue tasks');
      expect(res.intent).toBe('overdue_tasks');
      expect(res.items.length).toBe(1);
      expect(res.items[0].title).toBe('Submit tax documentation');
      expect(res.summary).toContain('1 overdue task');
    });

    it('answers assignments due this week correctly', async () => {
      const now = new Date().toISOString();
      const inThreeDays = addDays(new Date(), 3).toISOString().slice(0, 10);

      await db.subjects.add({
        id: 'subj-cs101',
        semesterId: 'sem-1',
        title: 'Computer Science 101',
        code: 'CS101',
        color: '#60A5FA',
        createdAt: now,
      });

      await db.assignments.add({
        id: 'assign-algo',
        subjectId: 'subj-cs101',
        title: 'Algorithm Design Lab 3',
        status: 'in_progress',
        dueDate: inThreeDays,
        weightPercent: 15,
        createdAt: now,
        updatedAt: now,
      });

      const res = await processAssistantQuery('Assignments due this week');
      expect(res.intent).toBe('assignments_due_this_week');
      expect(res.items.length).toBe(1);
      expect(res.items[0].title).toBe('Algorithm Design Lab 3');
      expect(res.items[0].subtitle).toContain('Computer Science 101');
    });

    it('answers closest project deadline and active projects', async () => {
      const now = new Date().toISOString();
      const inTwoDays = addDays(new Date(), 2).toISOString().slice(0, 10);
      const inTenDays = addDays(new Date(), 10).toISOString().slice(0, 10);

      await db.projects.bulkAdd([
        {
          id: 'proj-design',
          title: 'Design System Migration',
          status: 'in_progress',
          priority: 'urgent',
          dueDate: inTwoDays,
          tags: [],
          techStack: [],
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 'proj-mobile',
          title: 'Mobile Companion App',
          status: 'in_progress',
          priority: 'medium',
          dueDate: inTenDays,
          tags: [],
          techStack: [],
          createdAt: now,
          updatedAt: now,
        },
      ]);

      const closestRes = await processAssistantQuery('Closest project deadline');
      expect(closestRes.intent).toBe('closest_project_deadline');
      expect(closestRes.items.length).toBe(1);
      expect(closestRes.items[0].title).toBe('Design System Migration');

      const activeRes = await processAssistantQuery('Active projects');
      expect(activeRes.intent).toBe('active_projects');
      expect(activeRes.items.length).toBe(2);
    });

    it('answers today focus tasks correctly', async () => {
      const today = getTodayLocalDateString();
      const now = new Date().toISOString();

      await db.tasks.add({
        id: 'task-focus-1',
        title: 'Ship Wave 2 Deliverables',
        status: 'todo',
        priority: 'urgent',
        tags: [],
        createdAt: now,
        updatedAt: now,
      });

      await db.focusSelections.add({
        id: 'focus-1',
        taskId: 'task-focus-1',
        effectiveLocalDate: today,
        chosenAt: now,
      });

      const res = await processAssistantQuery("Today's focus tasks");
      expect(res.intent).toBe('todays_focus_tasks');
      expect(res.items.length).toBe(1);
      expect(res.items[0].title).toBe('Ship Wave 2 Deliverables');
    });

    it('returns suggested follow up questions on unknown query', async () => {
      const res = await processAssistantQuery('Random unknown query?');
      expect(res.intent).toBe('unknown');
      expect(res.suggestedFollowUps).toEqual(SUGGESTED_QUESTIONS);
    });
  });
});
