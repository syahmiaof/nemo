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
  const goals = useLiveQuery(() => db.goals.toArray(), []) || [];
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
    const manualFocused = selections
      .map((s) => taskMap.get(s.taskId))
      .filter((t): t is Task => !!t && t.status !== 'done');
    const manualIds = new Set(manualFocused.map((t) => t.id));

    // Auto-link high priority & today-due tasks to fill up to 3 slots
    const priorityCandidates = openList
      .filter((t) => !manualIds.has(t.id))
      .sort((a, b) => {
        const pScore = (p: string) => (p === 'high' ? 3 : p === 'medium' ? 2 : 1);
        const pDiff = pScore(b.priority) - pScore(a.priority);
        if (pDiff !== 0) return pDiff;
        return (a.dueDate || '9999').localeCompare(b.dueDate || '9999');
      });

    const focusedList = [...manualFocused];
    for (const cand of priorityCandidates) {
      if (focusedList.length >= 3) break;
      if (cand.priority === 'high' || (cand.dueDate && cand.dueDate <= today)) {
        focusedList.push(cand);
      }
    }

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

  // Derived goal progress for motivational visual cards
  const goalStats = useMemo(() => {
    const activeGoals = goals.filter((g) => g.status === 'active');
    const completedGoals = goals.filter((g) => g.status === 'achieved');
    const goalMilestones = milestones.filter((m) => m.ownerType === 'goal');
    const doneMilestones = goalMilestones.filter((m) => !!m.completedAt);
    const milestoneRate =
      goalMilestones.length > 0
        ? Math.round((doneMilestones.length / goalMilestones.length) * 100)
        : activeGoals.length > 0 ? 0 : 100;

    return {
      activeGoals,
      completedGoals,
      goalMilestones,
      doneMilestones,
      milestoneRate,
    };
  }, [goals, milestones]);

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

      {/* Motivational Goals in Motion Visual Section */}
      <section className="glass-panel goals-motion-panel mt-6 p-6 rounded-2xl relative overflow-hidden" data-enter aria-labelledby="goals-motion-title">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent-mint/15 border border-accent-mint/30 flex items-center justify-center text-accent-mint">
              <Target size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="goals-motion-title" className="text-base font-bold text-content-primary">
                  Goals in motion
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-accent-mint/15 text-accent-mint border border-accent-mint/30">
                  {goalStats.activeGoals.length} Active
                </span>
              </div>
              <p className="text-xs text-content-secondary mt-0.5">
                Every milestone achieved brings your vision one step closer to reality.
              </p>
            </div>
          </div>

          <Link
            to="/goals"
            className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-subtle hover:bg-surface border border-border-subtle text-xs font-semibold text-content-primary hover:text-accent-mint transition-colors"
          >
            <span>Explore all goals</span>
            <ArrowUpRight size={14} />
          </Link>
        </div>

        {/* Ambition Progress Bar & Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
          <div className="p-3.5 rounded-xl bg-surface-subtle border border-border-subtle flex flex-col justify-between">
            <span className="text-[11px] text-content-tertiary font-medium">Active Ambitions</span>
            <div className="flex items-baseline gap-2 mt-1">
              <strong className="text-xl font-bold text-content-primary">{goalStats.activeGoals.length}</strong>
              <span className="text-xs text-content-secondary font-mono">goals ongoing</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-surface-subtle border border-border-subtle flex flex-col justify-between">
            <span className="text-[11px] text-content-tertiary font-medium">Milestones Reached</span>
            <div className="flex items-baseline gap-2 mt-1">
              <strong className="text-xl font-bold text-accent-mint">{goalStats.doneMilestones.length}</strong>
              <span className="text-xs text-content-secondary font-mono">of {goalStats.goalMilestones.length} total</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-surface-subtle border border-border-subtle flex flex-col justify-between">
            <div className="flex items-center justify-between text-[11px] text-content-tertiary">
              <span className="font-medium">Overall Ambition Rate</span>
              <span className="font-mono text-content-primary font-semibold">{goalStats.milestoneRate}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-white/[0.08] overflow-hidden mt-2">
              <div
                className="h-full rounded-full transition-all duration-700 shadow-sm"
                style={{
                  width: `${goalStats.milestoneRate}%`,
                  background: 'linear-gradient(90deg, #A8DCC8 0%, #EFB2A2 100%)',
                }}
              />
            </div>
          </div>
        </div>

        {/* Active Goal Spotlight Cards */}
        {goalStats.activeGoals.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {goalStats.activeGoals.slice(0, 3).map((goal) => {
              const gMilestones = milestones.filter(
                (m) => m.ownerType === 'goal' && m.ownerId === goal.id
              );
              const gDone = gMilestones.filter((m) => m.completedAt).length;
              const gRate = gMilestones.length > 0 ? Math.round((gDone / gMilestones.length) * 100) : 0;
              const nextPending = gMilestones.find((m) => !m.completedAt);

              return (
                <div
                  key={goal.id}
                  className="p-4 rounded-xl bg-surface-solid/80 border border-white/[0.08] hover:border-accent-mint/40 transition-colors flex flex-col justify-between space-y-3 group"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      {goal.category ? (
                        <span className="text-[10px] font-mono tracking-wider uppercase text-accent-mint font-semibold">
                          {goal.category}
                        </span>
                      ) : (
                        <span className="text-[10px] text-content-tertiary font-mono">General</span>
                      )}
                      {goal.targetDate && (
                        <span className="text-[10px] text-content-tertiary font-mono">
                          Target: {formatShortDate(goal.targetDate)}
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-bold text-content-primary group-hover:text-accent-mint transition-colors line-clamp-1">
                      {goal.title}
                    </h3>
                    {goal.why && (
                      <p className="text-xs text-content-secondary line-clamp-2 mt-1 italic opacity-80">
                        "{goal.why}"
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-white/[0.06]">
                    <div className="flex items-center justify-between text-[11px] text-content-tertiary">
                      <span className="truncate max-w-[160px]">
                        {nextPending ? `Next: ${nextPending.title}` : gMilestones.length > 0 ? 'All milestones achieved!' : 'No milestones set'}
                      </span>
                      <span className="font-mono text-content-primary font-semibold shrink-0">
                        {gDone}/{gMilestones.length} ({gRate}%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-white/[0.08] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500 bg-accent-mint"
                        style={{ width: `${gRate}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-surface-subtle border border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <p className="text-content-secondary">
              Set your first high-level ambition and break it into achievable milestones.
            </p>
            <Link
              to="/goals"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent-mint hover:bg-accent-mint/90 text-navy-950 font-semibold text-xs transition-colors shrink-0"
            >
              <Plus size={14} />
              <span>Set a Goal</span>
            </Link>
          </div>
        )}
      </section>

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
