import { useMemo, useState, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Link } from 'react-router-dom';
import {
  Plus,
  ArrowUpRight,
  FolderGit2,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { db, atomicSetTaskStatus } from '@/db/nemoDb';
import { getWorkspaceMode, switchWorkspace } from '@/db/workspace';
import { useToast } from '@/components/ui/Toast';
import { TavolaSplineChart } from '@/components/ui/TavolaSplineChart';
import { PageHeading, AnimatedNumber } from '@/components/ui/PageHeading';
import { QuickAddModal } from '@/app/QuickAddModal';
import { SparkOfFocusCard } from './components/SparkOfFocusCard';
import { FocusSlotsSection } from './components/FocusSlotsSection';
import { WeeklyMomentumCard } from './components/WeeklyMomentumCard';
import { ActiveProjectsSection } from './components/ActiveProjectsSection';
import { GoalsInMotionSection } from './components/GoalsInMotionSection';
import { OperationalSection } from './components/OperationalSection';
import { animateMetricSwitch } from './motion/overviewMotion';
import { useReducedMotion } from '@/design/useReducedMotion';
import { getTodayLocalDateString, parseLocalDateString } from '@/lib/dates';
import type { Task } from '@/domain/types';

if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

const localDay = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

export function OverviewPage() {
  const [quickAdd, setQuickAdd] = useState(false);
  const [metric, setMetric] = useState<'tasks' | 'projects'>('tasks');
  const { success, error } = useToast();
  const today = getTodayLocalDateString();
  const pageContainerRef = useRef<HTMLDivElement>(null);
  const chartSummaryRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

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

  // Recalculate ScrollTriggers when live query data changes
  useGSAP(
    () => {
      if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
      ScrollTrigger.refresh();
    },
    {
      scope: pageContainerRef,
      dependencies: [tasks.length, projects.length, assignments.length, goals.length, metric],
    }
  );

  const complete = async (task: Task) => {
    try {
      await atomicSetTaskStatus(db, task.id, 'done');
      success('Task completed', task.title);
    } catch (e) {
      error('Could not complete task', e instanceof Error ? e.message : 'Please retry.');
    }
  };

  const removeFocus = async (id: string) => {
    try {
      const s = selections.find((sel) => sel.taskId === id);
      if (s) {
        await db.focusSelections.delete(s.id);
      }
    } catch {
      error('Could not remove focus');
    }
  };

  const focus = async (id: string) => {
    try {
      await db.transaction('rw', [db.focusSelections, db.tasks, db.syncMutations], async () => {
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

  const handleMetricChange = (newMetric: 'tasks' | 'projects') => {
    if (newMetric === metric) return;
    setMetric(newMetric);
    if (chartSummaryRef.current && !reduced) {
      animateMetricSwitch(chartSummaryRef.current);
    }
  };

  const hasData = tasks.length + projects.length + assignments.length > 0;
  const activeProjects = (active.length > 0 ? active : projects.filter((p) => !p.archivedAt)).slice(0, 2);

  return (
    <div ref={pageContainerRef} className="overview-page">
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
                  onClick={() => handleMetricChange(m)}
                >
                  {m === 'tasks' ? 'Tasks' : 'Projects'}
                </button>
              ))}
            </div>
            <Link to="/insights" className="icon-button" aria-label="Open insights">
              <ArrowUpRight size={20} />
            </Link>
          </div>

          <div ref={chartSummaryRef} className="chart-summary">
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
            height={165}
          />
        </section>

        {/* Right Tactical Stack: Today's Focus & Spark of Focus */}
        <div className="overview-right-stack">
          <FocusSlotsSection
            focused={focused}
            projects={projects}
            selections={selections}
            openTasks={open}
            onComplete={complete}
            onRemoveFocus={removeFocus}
            onAddFocus={focus}
          />

          <SparkOfFocusCard />
        </div>
      </div>

      {/* Middle Grid: Weekly Momentum Donut Gauge + Active Projects (In the making) */}
      <div className="overview-middle-grid">
        <WeeklyMomentumCard
          weeklyRatio={weeklyRatio}
          finishedCount={trend.total}
          openCount={open.length}
          activeProjectCount={active.length}
          academicCount={academic.length}
          overdueCount={overdue.length}
        />

        <ActiveProjectsSection
          projects={activeProjects}
          milestones={milestones}
          tasks={tasks}
        />
      </div>

      {/* Motivational Goals in Motion Visual Section */}
      <GoalsInMotionSection
        goalStats={goalStats}
        milestones={milestones}
      />

      {/* Operational Footer (3-Column Layout: Commitments, Study, Recent Activity) */}
      <OperationalSection
        nextTasks={nextTasks}
        academic={academic}
        recentCompleted={recentCompleted}
        onComplete={complete}
      />

      <QuickAddModal isOpen={quickAdd} onClose={() => setQuickAdd(false)} />
    </div>
  );
}
