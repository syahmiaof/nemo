import { useMemo, useState, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Link } from 'react-router-dom';
import {
  Plus,
  ArrowUpRight,
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
import { GoalsInMotionSection } from './components/GoalsInMotionSection';
import { MonthlyJourneySection } from './components/roadmap/MonthlyJourneySection';
import { getTodayLocalDateString, parseLocalDateString } from '@/lib/dates';
import type { Task } from '@/domain/types';

if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

const localDay = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

export function OverviewPage() {
  const [quickAdd, setQuickAdd] = useState(false);
  const { success, error } = useToast();
  const today = getTodayLocalDateString();
  const pageContainerRef = useRef<HTMLDivElement>(null);
  const chartSummaryRef = useRef<HTMLDivElement>(null);

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

  const { open, focused } = useMemo(() => {
    const taskMap = new Map<string, Task>();
    const openList: Task[] = [];

    for (let i = 0; i < tasks.length; i++) {
      const t = tasks[i];
      taskMap.set(t.id, t);
      if (t.status !== 'done' && !Boolean(t.isWatchlist || t.tags?.includes('watchlist'))) {
        openList.push(t);
      }
    }

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

    return {
      open: openList,
      focused: focusedList,
    };
  }, [tasks, selections, today]);

  // Trend data for the Tavola Spline Chart (strictly Projects momentum)
  const trend = useMemo(() => {
    const records = projects.filter((p) => p.status === 'completed');
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
  }, [projects, today]);

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
      dependencies: [tasks.length, projects.length, assignments.length, goals.length],
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

  const hasData = tasks.length + projects.length + assignments.length > 0;

  return (
    <div ref={pageContainerRef} className="overview-page">
      {/* Editorial Page Heading */}
      <PageHeading
        title="Make room for progress."
        description="Track your daily priorities, projects, and commitments."
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

      {/* Flagship Split (Momentum Spline Chart vs Today's Focus Pass) */}
      <div className="overview-primary">
        {/* Left Analytical Panel: Spline Chart (Projects Momentum) */}
        <section className="glass-panel productivity-panel" data-enter aria-labelledby="productivity-title">
          <div className="panel-heading">
            <h2 id="productivity-title">Your momentum</h2>
            <span className="text-[11px] font-mono font-medium px-2.5 py-0.5 rounded-full bg-accent-mint/15 text-accent-mint border border-accent-mint/30">
              Projects
            </span>
            <Link to="/insights" className="icon-button" aria-label="Open insights">
              <ArrowUpRight size={20} />
            </Link>
          </div>

          <div ref={chartSummaryRef} className="chart-summary">
            <strong>
              <AnimatedNumber value={trend.total} />
            </strong>
            <div>
              <p>Projects finished in the last 7 days</p>
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
            unit="projects"
            height={135}
          />
        </section>

        {/* Center Tactical Panel: Today's Focus Slots */}
        <FocusSlotsSection
          focused={focused}
          projects={projects}
          selections={selections}
          openTasks={open}
          onComplete={complete}
          onRemoveFocus={removeFocus}
          onAddFocus={focus}
        />

        {/* Right Inspirational Panel: Spark of Focus */}
        <SparkOfFocusCard />
      </div>

      {/* Motivational Goals in Motion Visual Section */}
      <GoalsInMotionSection
        goalStats={goalStats}
        milestones={milestones}
      />

      {/* Lively Monthly Journey Roadmap (6-Month Partitioned Timeline) */}
      <MonthlyJourneySection />

      <QuickAddModal isOpen={quickAdd} onClose={() => setQuickAdd(false)} />
    </div>
  );
}
