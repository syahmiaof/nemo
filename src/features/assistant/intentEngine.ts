import { db as defaultDb, type NemoDatabase } from '@/db/nemoDb';
import {
  getTodayLocalDateString,
  formatDisplayDate,
  isOverdue,
  isToday,
  parseLocalDateString,
} from '@/lib/dates';
import { addDays } from 'date-fns';

export interface AssistantRecordItem {
  id: string;
  title: string;
  subtitle?: string;
  badge?: string;
  badgeVariant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  route: string;
}

export interface AssistantResponse {
  intent: string;
  title: string;
  summary: string;
  items: AssistantRecordItem[];
  suggestedFollowUps: string[];
}

export const SUGGESTED_QUESTIONS = [
  'What tasks are due today?',
  'Overdue tasks',
  'Assignments due this week',
  'Active projects',
  'Closest project deadline',
  "Today's focus tasks",
  'Tasks finished this month',
  'Upcoming milestones',
  'Active goals',
  'Project progress summary',
];

/**
 * Normalizes user text query for intent matching.
 */
function normalizeQuery(query: string): string {
  return query
    .toLowerCase()
    .replace(/[?!.,'’"\\/\\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Determines the intent key based on user input.
 */
export function detectIntent(rawQuery: string): string {
  const q = normalizeQuery(rawQuery);
  if (!q) return 'unknown';

  // 1. Due today tasks
  if (
    q.includes('due today') ||
    q.includes('tasks today') ||
    q.includes('today tasks') ||
    q.includes('today s tasks') ||
    (q.includes('today') && q.includes('due')) ||
    (q.includes('what') && q.includes('due today'))
  ) {
    return 'due_today_tasks';
  }

  // 2. Overdue tasks
  if (
    q.includes('overdue') ||
    q.includes('late tasks') ||
    q.includes('past due') ||
    q.includes('missed tasks') ||
    q.includes('behind schedule')
  ) {
    return 'overdue_tasks';
  }

  // 3. Assignments due this week
  if (
    q.includes('assignment') ||
    q.includes('coursework') ||
    q.includes('homework') ||
    q.includes('exam') ||
    (q.includes('academic') && q.includes('due'))
  ) {
    return 'assignments_due_this_week';
  }

  // 4. Closest project deadline (must be checked before active projects)
  if (
    (q.includes('project') && (q.includes('deadline') || q.includes('due') || q.includes('urgent') || q.includes('closest') || q.includes('nearest') || q.includes('next'))) ||
    q.includes('closest deadline') ||
    q.includes('nearest deadline')
  ) {
    return 'closest_project_deadline';
  }

  // 5. Project progress summary
  if (
    (q.includes('project') && (q.includes('progress') || q.includes('summary') || q.includes('overview') || q.includes('status') || q.includes('completion'))) ||
    q.includes('how are projects doing')
  ) {
    return 'project_progress_summary';
  }

  // 6. Active projects
  if (
    q.includes('active project') ||
    q.includes('current project') ||
    q.includes('open project') ||
    q.includes('projects in progress') ||
    (q.includes('how many') && q.includes('project') && (q.includes('active') || q.includes('in progress'))) ||
    q.includes('all projects') ||
    q === 'projects'
  ) {
    return 'active_projects';
  }

  // 7. Today's focus tasks
  if (
    q.includes('focus') ||
    q.includes('top priorit') ||
    q.includes('highlight')
  ) {
    return 'todays_focus_tasks';
  }

  // 8. Tasks finished this month
  if (
    (q.includes('finish') || q.includes('completed') || q.includes('done')) &&
    (q.includes('month') || q.includes('recently') || q.includes('history'))
  ) {
    return 'tasks_finished_this_month';
  }

  // 9. Upcoming milestones
  if (
    q.includes('milestone') ||
    q.includes('road map') ||
    q.includes('roadmap')
  ) {
    return 'upcoming_milestones';
  }

  // 10. Active goals
  if (
    q.includes('goal') ||
    q.includes('target') ||
    q.includes('aspiration')
  ) {
    return 'active_goals';
  }

  return 'unknown';
}

/**
 * Main Deterministic Intent Processing Engine:
 * 100% computed from local Dexie database tables. 0% AI/LLM API calls.
 */
export async function processAssistantQuery(
  rawQuery: string,
  targetDb: NemoDatabase = defaultDb
): Promise<AssistantResponse> {
  const intent = detectIntent(rawQuery);
  const todayStr = getTodayLocalDateString();

  switch (intent) {
    case 'due_today_tasks': {
      const allTasks = await targetDb.tasks.toArray();
      const dueToday = allTasks.filter(
        (t) => t.status !== 'done' && isToday(t.dueDate)
      );

      const items: AssistantRecordItem[] = dueToday.map((t) => ({
        id: t.id,
        title: t.title,
        subtitle: t.notes ? t.notes.slice(0, 60) : undefined,
        badge: t.priority.toUpperCase(),
        badgeVariant: t.priority === 'urgent' || t.priority === 'high' ? 'danger' : 'info',
        route: '/tasks',
      }));

      const summary =
        dueToday.length === 0
          ? "No tasks are due today. You're completely up to date!"
          : `You have ${dueToday.length} task${dueToday.length === 1 ? '' : 's'} scheduled for completion today.`;

      return {
        intent,
        title: 'Tasks Due Today',
        summary,
        items,
        suggestedFollowUps: ["Today's focus tasks", 'Overdue tasks', 'Project progress summary'],
      };
    }

    case 'overdue_tasks': {
      const allTasks = await targetDb.tasks.toArray();
      const overdue = allTasks
        .filter((t) => t.status !== 'done' && isOverdue(t.dueDate))
        .sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''));

      const items: AssistantRecordItem[] = overdue.map((t) => ({
        id: t.id,
        title: t.title,
        subtitle: t.dueDate ? `Due ${formatDisplayDate(t.dueDate)}` : undefined,
        badge: 'OVERDUE',
        badgeVariant: 'danger',
        route: '/tasks',
      }));

      const summary =
        overdue.length === 0
          ? 'Clear skies! You have zero overdue tasks across all projects.'
          : `You have ${overdue.length} overdue task${overdue.length === 1 ? '' : 's'} that need attention.`;

      return {
        intent,
        title: 'Overdue Tasks',
        summary,
        items,
        suggestedFollowUps: ['What tasks are due today?', 'Closest project deadline', 'Active projects'],
      };
    }

    case 'assignments_due_this_week': {
      const now = parseLocalDateString(todayStr);
      const weekEndDate = addDays(now, 7);
      const weekEndStr = `${weekEndDate.getFullYear()}-${String(weekEndDate.getMonth() + 1).padStart(2, '0')}-${String(weekEndDate.getDate()).padStart(2, '0')}`;

      const [assignments, subjects] = await Promise.all([
        targetDb.assignments.toArray(),
        targetDb.subjects.toArray(),
      ]);

      const subjectMap = new Map(subjects.map((s) => [s.id, s.title]));

      const dueThisWeek = assignments
        .filter((a) => {
          if (a.status === 'submitted' || a.status === 'graded' || !a.dueDate) return false;
          return a.dueDate >= todayStr && a.dueDate <= weekEndStr;
        })
        .sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''));

      const items: AssistantRecordItem[] = dueThisWeek.map((a) => ({
        id: a.id,
        title: a.title,
        subtitle: `${subjectMap.get(a.subjectId) || 'Coursework'} · Due ${formatDisplayDate(a.dueDate)}`,
        badge: a.weightPercent ? `${a.weightPercent}% weight` : a.status.replace('_', ' '),
        badgeVariant: 'warning',
        route: '/academics',
      }));

      const summary =
        dueThisWeek.length === 0
          ? 'No academic assignment deadlines this week. You have breathing room!'
          : `You have ${dueThisWeek.length} coursework deadline${dueThisWeek.length === 1 ? '' : 's'} coming up within the next 7 days.`;

      return {
        intent,
        title: 'Assignments Due This Week',
        summary,
        items,
        suggestedFollowUps: ['Upcoming milestones', 'Active goals', 'What tasks are due today?'],
      };
    }

    case 'active_projects': {
      const allProjects = await targetDb.projects.toArray();
      const active = allProjects.filter((p) => p.status === 'in_progress');

      const items: AssistantRecordItem[] = active.map((p) => ({
        id: p.id,
        title: p.title,
        subtitle: p.dueDate ? `Due ${formatDisplayDate(p.dueDate)}` : (p.category || 'In Progress'),
        badge: p.priority.toUpperCase(),
        badgeVariant: p.priority === 'urgent' || p.priority === 'high' ? 'danger' : 'info',
        route: '/projects',
      }));

      const summary =
        active.length === 0
          ? 'You currently have no projects marked in progress.'
          : `You have ${active.length} active project${active.length === 1 ? '' : 's'} currently in flight.`;

      return {
        intent,
        title: 'Active Projects',
        summary,
        items,
        suggestedFollowUps: ['Closest project deadline', 'Project progress summary', 'Upcoming milestones'],
      };
    }

    case 'closest_project_deadline': {
      const allProjects = await targetDb.projects.toArray();
      const upcomingWithDueDate = allProjects
        .filter((p) => p.status !== 'completed' && Boolean(p.dueDate))
        .sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''));

      if (upcomingWithDueDate.length === 0) {
        return {
          intent,
          title: 'Closest Project Deadline',
          summary: 'None of your active or pending projects have a target deadline date set.',
          items: [],
          suggestedFollowUps: ['Active projects', 'Project progress summary'],
        };
      }

      const closest = upcomingWithDueDate[0];
      const isPast = isOverdue(closest.dueDate);
      const isDueToday = isToday(closest.dueDate);

      let urgencyNote = `due on ${formatDisplayDate(closest.dueDate)}`;
      if (isDueToday) urgencyNote = 'due today!';
      else if (isPast) urgencyNote = `overdue since ${formatDisplayDate(closest.dueDate)}`;

      const items: AssistantRecordItem[] = [
        {
          id: closest.id,
          title: closest.title,
          subtitle: `${closest.category ? closest.category + ' · ' : ''}${urgencyNote}`,
          badge: closest.priority.toUpperCase(),
          badgeVariant: isPast ? 'danger' : 'warning',
          route: '/projects',
        },
      ];

      return {
        intent,
        title: 'Closest Project Deadline',
        summary: `Your next project milestone is "${closest.title}", which is ${urgencyNote}.`,
        items,
        suggestedFollowUps: ['Active projects', 'Project progress summary', "Today's focus tasks"],
      };
    }

    case 'todays_focus_tasks': {
      const [selections, tasks] = await Promise.all([
        targetDb.focusSelections.where('effectiveLocalDate').equals(todayStr).toArray(),
        targetDb.tasks.toArray(),
      ]);

      const taskMap = new Map(tasks.map((t) => [t.id, t]));
      const focusTasks = selections
        .map((s) => taskMap.get(s.taskId))
        .filter((t): t is NonNullable<typeof t> => Boolean(t));

      const items: AssistantRecordItem[] = focusTasks.map((t) => ({
        id: t.id,
        title: t.title,
        subtitle: t.status === 'done' ? 'Completed today' : 'In focus queue',
        badge: t.status === 'done' ? 'COMPLETED' : t.priority.toUpperCase(),
        badgeVariant: t.status === 'done' ? 'success' : 'info',
        route: '/overview',
      }));

      const summary =
        focusTasks.length === 0
          ? "You haven't designated today's focus commitments yet. Head to Overview to select up to 3 priority tasks!"
          : `You have ${focusTasks.length} focus commitment${focusTasks.length === 1 ? '' : 's'} locked in for today.`;

      return {
        intent,
        title: "Today's Focus Tasks",
        summary,
        items,
        suggestedFollowUps: ['What tasks are due today?', 'Tasks finished this month', 'Active projects'],
      };
    }

    case 'tasks_finished_this_month': {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth(); // 0-indexed

      const allTasks = await targetDb.tasks.toArray();
      const finishedThisMonth = allTasks.filter((t) => {
        if (t.status !== 'done' || !t.completedAt) return false;
        const d = new Date(t.completedAt);
        return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
      });

      const items: AssistantRecordItem[] = finishedThisMonth.slice(0, 8).map((t) => ({
        id: t.id,
        title: t.title,
        subtitle: t.completedAt ? `Completed on ${formatDisplayDate(t.completedAt.slice(0, 10))}` : undefined,
        badge: 'DONE',
        badgeVariant: 'success',
        route: '/tasks',
      }));

      const summary =
        finishedThisMonth.length === 0
          ? 'No tasks completed yet this month. Every day is a clean slate to begin!'
          : `High velocity! You have completed ${finishedThisMonth.length} task${finishedThisMonth.length === 1 ? '' : 's'} this calendar month.`;

      return {
        intent,
        title: 'Tasks Finished This Month',
        summary,
        items,
        suggestedFollowUps: ['Project progress summary', 'Active goals', 'What tasks are due today?'],
      };
    }

    case 'upcoming_milestones': {
      const allMilestones = await targetDb.milestones.toArray();
      const upcoming = allMilestones
        .filter((m) => !m.completedAt && Boolean(m.targetDate) && (m.targetDate || '') >= todayStr)
        .sort((a, b) => (a.targetDate || '').localeCompare(b.targetDate || ''));

      const items: AssistantRecordItem[] = upcoming.slice(0, 6).map((m) => ({
        id: m.id,
        title: m.title,
        subtitle: m.targetDate ? `Target: ${formatDisplayDate(m.targetDate)}` : undefined,
        badge: m.ownerType.toUpperCase(),
        badgeVariant: 'info',
        route: m.ownerType === 'goal' ? '/goals' : '/projects',
      }));

      const summary =
        upcoming.length === 0
          ? 'No upcoming milestones scheduled in your roadmap.'
          : `You have ${upcoming.length} upcoming milestone${upcoming.length === 1 ? '' : 's'} across your projects and goals.`;

      return {
        intent,
        title: 'Upcoming Milestones',
        summary,
        items,
        suggestedFollowUps: ['Closest project deadline', 'Active goals', 'Project progress summary'],
      };
    }

    case 'active_goals': {
      const allGoals = await targetDb.goals.toArray();
      const active = allGoals.filter((g) => g.status === 'active');

      const items: AssistantRecordItem[] = active.map((g) => ({
        id: g.id,
        title: g.title,
        subtitle: g.targetDate ? `Target: ${formatDisplayDate(g.targetDate)}` : g.category,
        badge: 'ACTIVE',
        badgeVariant: 'success',
        route: '/goals',
      }));

      const summary =
        active.length === 0
          ? 'No goals are currently set to active. Set a meaningful milestone in the Goals tracker!'
          : `You are actively pursuing ${active.length} strategic goal${active.length === 1 ? '' : 's'}.`;

      return {
        intent,
        title: 'Active Goals',
        summary,
        items,
        suggestedFollowUps: ['Upcoming milestones', 'Active projects', "Today's focus tasks"],
      };
    }

    case 'project_progress_summary': {
      const [projects, tasks] = await Promise.all([
        targetDb.projects.toArray(),
        targetDb.tasks.toArray(),
      ]);

      const totalProjects = projects.length;
      const inProgress = projects.filter((p) => p.status === 'in_progress').length;
      const completed = projects.filter((p) => p.status === 'completed').length;

      const items: AssistantRecordItem[] = projects.map((p) => {
        const linked = tasks.filter((t) => t.parentType === 'project' && t.parentId === p.id);
        const done = linked.filter((t) => t.status === 'done').length;
        const pct = linked.length > 0 ? Math.round((done / linked.length) * 100) : p.status === 'completed' ? 100 : 0;

        return {
          id: p.id,
          title: p.title,
          subtitle: `${linked.length} tasks (${done} done) · ${p.status.replace('_', ' ')}`,
          badge: `${pct}%`,
          badgeVariant: pct === 100 ? 'success' : pct > 50 ? 'info' : 'warning',
          route: '/projects',
        };
      });

      const summary =
        totalProjects === 0
          ? 'You have not created any projects yet.'
          : `${totalProjects} total projects (${inProgress} in progress, ${completed} completed). Detailed breakdown below:`;

      return {
        intent,
        title: 'Project Progress Summary',
        summary,
        items,
        suggestedFollowUps: ['Active projects', 'Closest project deadline', 'What tasks are due today?'],
      };
    }

    default: {
      return {
        intent: 'unknown',
        title: 'Ask Nemo Assistant',
        summary:
          "I am your offline, privacy-first Nemo assistant. I compute answers instantly from your local workspace data. Here are questions you can ask me:",
        items: [],
        suggestedFollowUps: SUGGESTED_QUESTIONS,
      };
    }
  }
}
