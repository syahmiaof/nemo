import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Link } from 'react-router-dom';
import {
  Check,
  Plus,
  ArrowUpRight,
  FolderGit2,
  Clock,
  CheckCircle2,
  X,
  Target,
  CalendarDays,
  GraduationCap,
  Activity,
} from 'lucide-react';
import { db, atomicSetTaskStatus } from '@/db/nemoDb';
import { getWorkspaceMode, switchWorkspace } from '@/db/workspace';
import { useToast } from '@/components/ui/Toast';
import { TavolaSplineChart } from '@/components/ui/TavolaSplineChart';
import { PageHeading, AnimatedNumber } from '@/components/ui/PageHeading';
import { ProjectCard } from '@/features/projects/ProjectCard';
import { QuickAddModal } from '@/app/QuickAddModal';
import { getTodayLocalDateString, formatShortDate, parseLocalDateString } from '@/lib/dates';
import type { Task } from '@/domain/types';

const localDay = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

export function OverviewPage() {
  const [quickAdd, setQuickAdd] = useState(false);
  const [metric, setMetric] = useState<'tasks' | 'projects'>('tasks');
  const { success, error } = useToast();
  const today = getTodayLocalDateString();

  const tasks = useLiveQuery(() => db.tasks.toArray(), []) || [];
  const projects = useLiveQuery(() => db.projects.toArray(), []) || [];
  const milestones = useLiveQuery(() => db.milestones.toArray(), []) || [];
  const assignments = useLiveQuery(() => db.assignments.toArray(), []) || [];
  const selections =
    useLiveQuery(
      () => db.focusSelections.where('effectiveLocalDate').equals(today).toArray(),
      [today]
    ) || [];

  const { open, active, completed, overdue, focused, nextTasks, academic, recentCompleted } = useMemo(() => {
    const taskMap = new Map<string, Task>();
    const openList: Task[] = [];
    const completedList: Task[] = [];
    const overdueList: Task[] = [];

    for (let i = 0; i < tasks.length; i++) {
      const t = tasks[i];
      taskMap.set(t.id, t);
      if (t.status === 'done') {
        completedList.push(t);
      } else {
        openList.push(t);
        if (t.dueDate && t.dueDate < today) {
          overdueList.push(t);
        }
      }
    }

    const activeList = projects.filter((p) => p.status === 'in_progress' && !p.archivedAt);
    const focusedList = selections
      .map((s) => taskMap.get(s.taskId))
      .filter((t): t is Task => !!t && t.status !== 'done');

    const next = [...openList]
      .sort((a, b) => (a.dueDate || '9999').localeCompare(b.dueDate || '9999'))
      .slice(0, 4);

    const acad = assignments
      .filter((a) => a.status !== 'submitted' && a.status !== 'graded' && a.dueDate)
      .sort((a, b) => a.dueDate!.localeCompare(b.dueDate!))
      .slice(0, 3);

    const recent = [...completedList]
      .filter((t) => t.completedAt)
      .sort((a, b) => (b.completedAt || '').localeCompare(a.completedAt || ''))
      .slice(0, 4);

    return {
      open: openList,
      active: activeList,
      completed: completedList,
      overdue: overdueList,
      focused: focusedList,
      nextTasks: next,
      academic: acad,
      recentCompleted: recent,
    };
  }, [tasks, projects, assignments, selections, today]);

  // Trend data for the Tavola Spline Chart
  const trend = useMemo(() => {
    const records =
      metric === 'tasks'
        ? tasks.filter((t) => t.status === 'done')
        : projects.filter((p) => p.status === 'completed');
    const current: number[] = [];
    const previous: number[] = [];
    const labels: string[] = [];

    for (let i = 6; i >= 0; i--) {
      const date = parseLocalDateString(today);
      date.setDate(date.getDate() - i);
      const key = localDay(date);
      labels.push(date.toLocaleDateString('en', { weekday: 'short' }));
      current.push(
        records.filter((r) => r.completedAt && localDay(new Date(r.completedAt)) === key).length
      );

      date.setDate(date.getDate() - 7);
      const old = localDay(date);
      previous.push(
        records.filter((r) => r.completedAt && localDay(new Date(r.completedAt)) === old).length
      );
    }

    const total = current.reduce((a, b) => a + b, 0);
    const last = previous.reduce((a, b) => a + b, 0);
    return { current, previous, labels, total, last };
  }, [tasks, projects, metric, today]);

  // Completion percentage for the radial weekly gauge
  const weeklyRatio = useMemo(() => {
    const cutoff = new Date();
    cutoff.setHours(0, 0, 0, 0);
    cutoff.setDate(cutoff.getDate() - 6);
    const doneCount = completed.filter(task => task.completedAt && new Date(task.completedAt) >= cutoff).length;
    const totalCount = doneCount + open.length;
    if (totalCount === 0) return 0;
    return Math.min(100, Math.round((doneCount / totalCount) * 100));
  }, [completed, open.length]);

  const complete = async (task: Task) => {
    try {
      await atomicSetTaskStatus(db, task.id, 'done');
      success('Task completed', task.title);
    } catch (e) {
      error('Could not complete task', e instanceof Error ? e.message : 'Please retry.');
    }
  };

  const focus = async (id: string) => {
    try {
      await db.transaction('rw', [db.focusSelections, db.tasks], async () => {
        const chosen = await db.focusSelections.where('effectiveLocalDate').equals(today).toArray();
        const allTasks = await db.tasks.toArray();
        const activeFocus = chosen.filter((s) => {
          const t = allTasks.find((task) => task.id === s.taskId);
          return t && t.status !== 'done';
        });
        if (activeFocus.length >= 3 || chosen.some((s) => s.taskId === id)) return;
        await db.focusSelections.add({
          id: `${today}_${id}`,
          taskId: id,
          effectiveLocalDate: today,
          chosenAt: new Date().toISOString(),
        });
      });
    } catch {
      error('Could not add focus task');
    }
  };

  const hasData = tasks.length + projects.length + assignments.length > 0;

  return (
    <div className="overview-page">
      {/* Editorial Page Heading */}
      <PageHeading
        title="Make room for progress."
        description="Track your daily priorities, projects, and commitments."
        stats={[
          {
            label: 'Active projects',
            value: active.length,
            icon: FolderGit2,
          },
          {
            label: 'Tasks need attention',
            value: open.filter((t) => t.dueDate && t.dueDate <= today).length,
            icon: Clock,
            note: overdue.length ? `${overdue.length} overdue` : undefined,
          },
          {
            label: 'Tasks completed',
            value: completed.length,
            icon: CheckCircle2,
          },
        ]}
      />

      {!hasData && (
        <section className="welcome-panel glass-panel" data-enter>
          <div>
            <h2>A clear space for your next idea.</h2>
            <p>Start with a project or explore a fictional workspace to see how everything connects.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button className="primary-action" onClick={() => setQuickAdd(true)}>
              <Plus size={18} />
              Create something
            </button>
            {getWorkspaceMode() === 'real' && (
              <button
                className="secondary-action"
                onClick={() => {
                  try {
                    switchWorkspace('demo');
                  } catch {
                    error('Demo workspace could not open');
                  }
                }}
              >
                Explore demo
                <ArrowUpRight size={18} />
              </button>
            )}
          </div>
        </section>
      )}

      {/* Flagship 58:42 Split (Momentum Spline Chart vs Today's Focus Pass) */}
      <div className="overview-primary">
        {/* Left Analytical Panel: Spline Chart */}
        <section className="glass-panel productivity-panel" data-enter aria-labelledby="productivity-title">
          <div className="panel-heading">
            <h2 id="productivity-title">Your momentum</h2>
            <div className="segmented" aria-label="Productivity metric">
              {(['tasks', 'projects'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  aria-pressed={metric === m}
                  className={metric === m ? 'is-selected' : ''}
                  onClick={() => setMetric(m)}
                >
                  {m === 'tasks' ? 'Tasks' : 'Projects'}
                </button>
              ))}
            </div>
            <Link to="/insights" className="icon-button" aria-label="Open insights">
              <ArrowUpRight size={20} />
            </Link>
          </div>

          <div className="chart-summary">
            <strong>
              <AnimatedNumber value={trend.total} />
            </strong>
            <div>
              <p>
                {metric === 'tasks' ? 'Tasks' : 'Projects'} finished in the last 7 days
              </p>
              <span className="trend-note">
                {trend.total - trend.last >= 0 ? '+' : ''}
                {trend.total - trend.last} vs previous 7 days
              </span>
            </div>
          </div>

          <div className="chart-legend">
            <span>
              <i />
              This week
            </span>
            <span>
              <i className="comparison" />
              Previous 7 days
            </span>
          </div>

          <TavolaSplineChart
            labels={trend.labels}
            values={trend.current}
            comparisonValues={trend.previous}
            seriesName="This week"
            comparisonName="Previous 7 days"
            unit={metric}
            height={274}
          />
        </section>

        {/* Right Tactical Panel: Today's Focus (Tavola "On the pass" analogue) */}
        <section className="glass-panel focus-panel" data-enter aria-labelledby="focus-title">
          <div className="panel-heading">
            <h2 id="focus-title">Today's focus</h2>
            <span className="panel-meta">{focused.length} of 3 active slots</span>
            <Link to="/tasks" className="icon-button" aria-label="Manage tasks">
              <ArrowUpRight size={20} />
            </Link>
          </div>

          <div className="focus-stack">
            {focused.map((task, index) => {
              const project = projects.find((p) => p.id === task.parentId);
              return (
                <article className={`focus-ticket tone-${index % 3}`} key={task.id}>
                  <div className="ticket-meta">
                    <span className="ticket-badge">
                      <Target size={13} />
                      #{String(index + 1).padStart(2, '0')} · ⏱ {task.estimatedMinutes || 25} min
                    </span>
                    <button
                      type="button"
                      aria-label={`Remove ${task.title} from focus`}
                      onClick={() => {
                        const s = selections.find((sel) => sel.taskId === task.id);
                        if (s) {
                          void db.focusSelections.delete(s.id).catch(() => error('Could not remove focus'));
                        }
                      }}
                      className="ticket-remove"
                    >
                      <X size={15} />
                    </button>
                  </div>

                  <h3 className="ticket-title">{task.title}</h3>

                  <div className="ticket-context">
                    <span>{project ? project.title : 'Standalone focus'}</span>
                    <span className="ticket-priority-tag">{task.priority}</span>
                  </div>

                  <div className="ticket-bottom">
                    <span className="ticket-status-label">
                      {task.status === 'in_progress' ? 'In progress' : 'Focus slot'}
                    </span>
                    <button
                      type="button"
                      className="ticket-complete"
                      onClick={() => void complete(task)}
                      aria-label={`Complete ${task.title}`}
                    >
                      <Check size={18} strokeWidth={2.8} />
                    </button>
                  </div>
                </article>
              );
            })}

            {focused.length === 0 && (
              <div className="focus-empty">
                <Target size={32} />
                <h3>One thing at a time.</h3>
                <p>Choose up to three tasks and give them your complete focus.</p>
              </div>
            )}

            {focused.length < 3 && (
              <div className="focus-slot-picker">
                <label htmlFor="focus-choice" className="sr-only">Add task to focus</label>
                <div className="focus-picker-inner">
                  <Plus size={16} className="text-content-secondary" />
                  <select
                    id="focus-choice"
                    value=""
                    onChange={(e) => {
                      if (e.target.value) void focus(e.target.value);
                    }}
                    className="focus-picker-select"
                  >
                    <option value="">+ Assign next focus task…</option>
                    {open
                      .filter((t) => !focused.some((f) => f.id === t.id))
                      .map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.title}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Middle Grid: Weekly Momentum Donut Gauge + Active Projects (Tavola "The room" & "Still to come" analogue) */}
      <div className="overview-middle-grid" data-enter>
        {/* Left: Weekly Targets Donut Gauge */}
        <section className="glass-panel room-gauge-panel" aria-labelledby="targets-title">
          <div className="panel-heading">
            <h2 id="targets-title">Weekly momentum</h2>
            <Link to="/insights" className="icon-button" aria-label="Open insights">
              <ArrowUpRight size={18} />
            </Link>
          </div>

          <div className="room-gauge-body">
            <div className="gauge-donut-container">
              <svg viewBox="0 0 160 160" className="gauge-donut-svg">
                <circle
                  cx="80"
                  cy="80"
                  r="62"
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.08)"
                  strokeWidth="14"
                />
                <circle
                  cx="80"
                  cy="80"
                  r="62"
                  fill="none"
                  stroke="url(#donut-grad)"
                  strokeWidth="14"
                  strokeDasharray={`${(weeklyRatio / 100) * 389.5} 389.5`}
                  strokeDashoffset="97.4"
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="donut-grad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#C3E9DA" />
                    <stop offset="50%" stopColor="#F5C8BC" />
                    <stop offset="100%" stopColor="#FAE392" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="gauge-donut-label">
                <strong>{weeklyRatio}%</strong>
                <span>completed</span>
              </div>
            </div>

            <div className="gauge-legend-list">
              <div className="gauge-legend-item">
                <span className="dot dot-mint" />
                <span>Finished: {trend.total}</span>
              </div>
              <div className="gauge-legend-item">
                <span className="dot dot-peach" />
                <span>Open: {open.length}</span>
              </div>
              <div className="gauge-legend-item">
                <span className="dot dot-amber" />
                <span>Projects: {active.length}</span>
              </div>
              <div className="gauge-legend-item">
                <span className="dot dot-slate" />
                <span>Study: {academic.length}</span>
              </div>
            </div>

            <div className="gauge-status-pill">
              <span className="status-live-dot" />
              <span>
                {overdue.length > 0
                  ? `${overdue.length} items require prompt attention`
                  : 'All priority deliverables on schedule'}
              </span>
            </div>
          </div>
        </section>

        {/* Right: In the Making (Active Projects Grid) */}
        <section className="in-the-making-section" aria-labelledby="projects-title">
          <div className="section-heading">
            <div>
              <h2 id="projects-title">In the making</h2>
              <p>Your active projects, one step closer.</p>
            </div>
            <Link to="/projects" className="section-link">
              All projects <ArrowUpRight size={18} />
            </Link>
          </div>

          <div className="overview-project-grid">
            {active.slice(0, 2).map((p) => (
              <ProjectCard key={p.id} project={p} milestones={milestones} tasks={tasks} />
            ))}
            {active.length === 0 && (
              <div className="glass-panel empty-inline">
                No active projects yet. <Link to="/projects">Start your first project →</Link>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Operational Footer (Tavola 3-Column Footer analogue) */}
      <div className="overview-bottom-grid" data-enter>
        {/* Column 1: Upcoming Tasks */}
        <section className="glass-panel operational-panel" aria-labelledby="commitments-title">
          <div className="panel-heading">
            <h2 id="commitments-title">Coming into view</h2>
            <Link to="/calendar" className="icon-button" aria-label="Open calendar">
              <CalendarDays size={18} />
            </Link>
          </div>
          <div className="operational-list">
            {nextTasks.map((t) => (
              <div className="commitment-row" key={t.id}>
                <button
                  type="button"
                  className="completion-ring"
                  aria-label={`Complete ${t.title}`}
                  onClick={() => void complete(t)}
                >
                  <Check size={14} />
                </button>
                <Link to="/tasks" className="commitment-text">
                  <span className="commitment-title">{t.title}</span>
                  <span className="commitment-meta">
                    {t.dueDate ? formatShortDate(t.dueDate) : 'No deadline'} · {t.priority} priority
                  </span>
                </Link>
                <ArrowUpRight size={16} className="commitment-arrow" />
              </div>
            ))}
            {nextTasks.length === 0 && (
              <p className="empty-copy">You're all clear. Capture your next task when you're ready.</p>
            )}
          </div>
        </section>

        {/* Column 2: Academic Deadlines */}
        <section className="glass-panel operational-panel" aria-labelledby="study-title">
          <div className="panel-heading">
            <h2 id="study-title">On the study desk</h2>
            <Link to="/academics" className="icon-button" aria-label="Open academics">
              <GraduationCap size={18} />
            </Link>
          </div>
          <div className="operational-list">
            {academic.map((a) => (
              <Link className="academic-deadline" key={a.id} to={`/academics/assignments/${a.id}`}>
                <span className="deadline-date">{formatShortDate(a.dueDate)}</span>
                <div className="academic-copy">
                  <h3>{a.title}</h3>
                  <p>{String(a.status).replace(/_/g, ' ')}</p>
                </div>
                <ArrowUpRight size={16} className="commitment-arrow" />
              </Link>
            ))}
            {academic.length === 0 && (
              <p className="empty-copy">No outstanding coursework. Your next deadline will appear here.</p>
            )}
          </div>
        </section>

        {/* Column 3: Workspace Activity Stream */}
        <section className="glass-panel operational-panel" aria-labelledby="activity-title">
          <div className="panel-heading">
            <h2 id="activity-title">Recent activity</h2>
            <div className="icon-button" aria-hidden="true">
              <Activity size={18} />
            </div>
          </div>
          <div className="operational-list">
            {recentCompleted.map((t) => (
              <div className="activity-row" key={t.id}>
                <div className="activity-icon-wrap">
                  <CheckCircle2 size={16} className="text-[#a8dcc8]" />
                </div>
                <div className="activity-copy">
                  <p className="activity-title">Completed: {t.title}</p>
                  <span className="activity-timestamp">
                    {t.completedAt
                      ? new Date(t.completedAt).toLocaleDateString('en-US', {
                          weekday: 'short',
                          hour: 'numeric',
                          minute: '2-digit',
                        })
                      : 'Recently'}
                  </span>
                </div>
              </div>
            ))}
            {recentCompleted.length === 0 && (
              <p className="empty-copy">Activity records will appear here as you complete work.</p>
            )}
          </div>
        </section>
      </div>

      <QuickAddModal isOpen={quickAdd} onClose={() => setQuickAdd(false)} />
    </div>
  );
}
