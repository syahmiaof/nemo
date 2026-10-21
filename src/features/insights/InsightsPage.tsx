import React, { useState, useMemo, useRef, useEffect } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  BarChart3,
  FolderKanban,
  CheckCircle2,
  BookOpen,
  ArrowUpRight,
  Target,
  Zap,
} from 'lucide-react';
import { db } from '@/db/nemoDb';
import { isOverdue } from '@/lib/dates';
import { monthlyCounts } from '@/domain/chart';
import { TavolaSplineChart } from '@/components/ui/TavolaSplineChart';
import { useReducedMotion } from '@/design/useReducedMotion';
import { MotionTitle } from '@/components/ui/MotionTitle';
import { AnimatedNumber } from '@/components/ui/PageHeading';
import { useScrollMotion } from '@/design/useScrollMotion';

gsap.registerPlugin(useGSAP);

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const InsightsPage: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [series, setSeries] = useState<'tasks' | 'projects'>('tasks');
  const motionRoot = useRef<HTMLDivElement>(null);
  const rhythmChartRef = useRef<HTMLDivElement>(null);
  const donutRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  const data = useLiveQuery(async () => {
    const [projects, tasks, assignments, goals, milestones] = await Promise.all([
      db.projects.toArray(),
      db.tasks.toArray(),
      db.assignments.toArray(),
      db.goals.toArray(),
      db.milestones.toArray(),
    ]);
    return { projects, tasks, assignments, goals, milestones };
  }, []);

  const projects = data?.projects ?? [];
  const tasks = data?.tasks ?? [];
  const assignments = data?.assignments ?? [];
  const goals = data?.goals ?? [];
  const milestones = data?.milestones ?? [];

  // 7-Day Rolling Velocity calculation
  const velocityData = useMemo(() => {
    const dayLabels: string[] = [];
    const currentVelocity: number[] = [];
    const previousVelocity: number[] = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-US', { weekday: 'short' });
      dayLabels.push(label);

      // Current 7-day period completions (tasks + projects)
      const currentCount =
        tasks.filter((t) => t.completedAt && t.completedAt.startsWith(dateStr)).length +
        projects.filter((p) => p.completedAt && p.completedAt.startsWith(dateStr)).length;
      currentVelocity.push(currentCount);

      // Previous 7-day period completions (shifted by 7 days)
      const prevD = new Date(d);
      prevD.setDate(prevD.getDate() - 7);
      const prevDateStr = `${prevD.getFullYear()}-${String(prevD.getMonth() + 1).padStart(2, '0')}-${String(prevD.getDate()).padStart(2, '0')}`;
      const prevCount =
        tasks.filter((t) => t.completedAt && t.completedAt.startsWith(prevDateStr)).length +
        projects.filter((p) => p.completedAt && p.completedAt.startsWith(prevDateStr)).length;
      previousVelocity.push(prevCount);
    }

    const totalCurrent = currentVelocity.reduce((sum, v) => sum + v, 0);
    const totalPrev = previousVelocity.reduce((sum, v) => sum + v, 0);
    const diff = totalCurrent - totalPrev;
    const dailyAverage = (totalCurrent / 7).toFixed(1);

    return {
      labels: dayLabels,
      current: currentVelocity,
      previous: previousVelocity,
      totalCurrent,
      totalPrev,
      diff,
      dailyAverage,
    };
  }, [tasks, projects]);

  const {
    years,
    values,
    comparison,
    total,
    previousTotal,
    difference,
    bestMonth,
    activeProjects,
    createdInYear,
    done,
    inProgress,
    toDo,
    overdue,
    completionRate,
    doneAngle,
    progressAngle,
    submitted,
    graded,
    activeGoalsCount,
    completedGoalsCount,
    totalMilestonesCount,
    completedMilestonesCount,
    goalRate,
    maxVal,
  } = useMemo(() => {
    const yrs = new Set<number>();
    for (let y = currentYear - 4; y <= currentYear + 4; y++) {
      yrs.add(y);
    }
    yrs.add(selectedYear);
    for (let i = 0; i < projects.length; i++) {
      const item = projects[i];
      if (item.createdAt) {
        const y = new Date(item.createdAt).getFullYear();
        if (Number.isFinite(y)) yrs.add(y);
      }
      if (item.completedAt) {
        const y = new Date(item.completedAt).getFullYear();
        if (Number.isFinite(y)) yrs.add(y);
      }
    }
    for (let i = 0; i < tasks.length; i++) {
      const item = tasks[i];
      if (item.createdAt) {
        const y = new Date(item.createdAt).getFullYear();
        if (Number.isFinite(y)) yrs.add(y);
      }
      if (item.completedAt) {
        const y = new Date(item.completedAt).getFullYear();
        if (Number.isFinite(y)) yrs.add(y);
      }
    }

    const dates = (series === 'tasks' ? tasks : projects).map((item) => item.completedAt);
    const vals = monthlyCounts(dates, selectedYear);
    const comp = monthlyCounts(dates, selectedYear - 1);
    const tot = vals.reduce((sum, value) => sum + value, 0);
    const prevTot = comp.reduce((sum, value) => sum + value, 0);
    const diff = tot - prevTot;
    const bestM = vals.indexOf(Math.max(...vals));
    const activeProj = projects.filter((project) => project.status === 'in_progress' && !project.archivedAt).length;
    const createdY = monthlyCounts(projects.map((project) => project.createdAt), selectedYear).reduce((sum, value) => sum + value, 0);

    let dCount = 0;
    let pCount = 0;
    let oCount = 0;
    for (let i = 0; i < tasks.length; i++) {
      const t = tasks[i];
      if (t.status === 'done') dCount++;
      else if (t.status === 'in_progress') pCount++;
      if (t.status !== 'done' && isOverdue(t.dueDate)) oCount++;
    }
    const tdCount = tasks.length - dCount - pCount;
    const cRate = tasks.length ? Math.round((dCount / tasks.length) * 100) : 0;
    const dAngle = tasks.length ? (dCount / tasks.length) * 360 : 0;
    const pAngle = tasks.length ? (pCount / tasks.length) * 360 : 0;

    let sCount = 0;
    let gCount = 0;
    for (let i = 0; i < assignments.length; i++) {
      const a = assignments[i];
      if (a.status === 'submitted' || a.status === 'graded') sCount++;
      if (a.status === 'graded') gCount++;
    }

    const aGoals = goals.filter((g) => g.status === 'active').length;
    const cGoals = goals.filter((g) => g.status === 'achieved').length;
    const tMilestones = milestones.length;
    const cMilestones = milestones.filter((m) => m.completedAt || (m as any).completed).length;
    const gRate = goals.length ? Math.round((cGoals / goals.length) * 100) : 0;
    const maximum = Math.max(1, ...vals, ...comp);

    return {
      years: yrs,
      values: vals,
      comparison: comp,
      total: tot,
      previousTotal: prevTot,
      difference: diff,
      bestMonth: bestM,
      activeProjects: activeProj,
      createdInYear: createdY,
      done: dCount,
      inProgress: pCount,
      toDo: tdCount,
      overdue: oCount,
      completionRate: cRate,
      doneAngle: dAngle,
      progressAngle: pAngle,
      submitted: sCount,
      graded: gCount,
      activeGoalsCount: aGoals,
      completedGoalsCount: cGoals,
      totalMilestonesCount: tMilestones,
      completedMilestonesCount: cMilestones,
      goalRate: gRate,
      maxVal: maximum,
    };
  }, [projects, tasks, assignments, goals, milestones, currentYear, selectedYear, series]);

  // Top metrics ribbon staggered entrance on mount
  useGSAP(() => {
    if (reduced) return;
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.fromTo(
      '.insights-head-stat',
      { opacity: 0, y: 18, scale: 0.93 },
      { opacity: 1, y: 0, scale: 1, duration: 0.55, stagger: 0.07 }
    ).fromTo(
      '.insights-year',
      { opacity: 0, x: 12 },
      { opacity: 1, x: 0, duration: 0.45 },
      '-=0.3'
    );
  }, { scope: motionRoot, dependencies: [reduced], revertOnUpdate: true });

  // Bi-directional scroll observer for Completion Rhythm Bar Chart
  useEffect(() => {
    const el = rhythmChartRef.current;
    if (!el || reduced) return;

    const bars = el.querySelectorAll('.rhythm-bar-fill');
    if (!bars.length) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          gsap.fromTo(
            bars,
            { scaleY: 0, transformOrigin: 'bottom center' },
            {
              scaleY: 1,
              duration: 0.8,
              stagger: 0.04,
              ease: 'back.out(1.25)',
              overwrite: 'auto',
            }
          );
        } else {
          // Bi-directional reset when leaving viewport so scrolling back animates again
          gsap.set(bars, { scaleY: 0 });
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -20px 0px' }
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
      gsap.killTweensOf(bars);
    };
  }, [values, series, selectedYear, reduced]);

  // Bi-directional scroll observer for Task Mix Donut Chart
  useEffect(() => {
    const donut = donutRef.current;
    if (!donut || reduced) return;

    const horizontalBars = motionRoot.current?.querySelectorAll('.insights-bar > span');

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          gsap.fromTo(
            donut,
            { scale: 0.65, rotate: -135, opacity: 0 },
            {
              scale: 1,
              rotate: 0,
              opacity: 1,
              duration: 1.05,
              ease: 'back.out(1.4)',
              overwrite: 'auto',
            }
          );
          if (horizontalBars?.length) {
            gsap.fromTo(
              horizontalBars,
              { scaleX: 0, transformOrigin: 'left center' },
              {
                scaleX: 1,
                duration: 0.85,
                stagger: 0.08,
                ease: 'power3.out',
                delay: 0.2,
                overwrite: 'auto',
              }
            );
          }
        } else {
          // Bi-directional reset
          gsap.set(donut, { scale: 0.65, rotate: -135, opacity: 0 });
          if (horizontalBars?.length) {
            gsap.set(horizontalBars, { scaleX: 0 });
          }
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -20px 0px' }
    );

    observer.observe(donut);
    return () => {
      observer.disconnect();
      gsap.killTweensOf(donut);
      if (horizontalBars?.length) gsap.killTweensOf(horizontalBars);
    };
  }, [data, reduced]);

  // Bi-directional scroll reveal across all chart panels & metric cards
  const scrollContainerRef = useScrollMotion<HTMLDivElement>({
    selector: '.glass-panel',
    stagger: 0.06,
    y: 22,
    scale: 0.98,
    duration: 0.65,
    ease: 'power3.out',
    bidirectional: true,
    threshold: 0.05,
    rootMargin: '0px 0px 50px 0px',
    key: `${selectedYear}:${series}:${tasks.length}:${projects.length}`,
  });

  return (
    <div ref={motionRoot} className="insights-page">
      {/* Top Metrics Ribbon */}
      <header className="insights-header">
        <MotionTitle text="Workspace Insights" breakAfterFirstWord />
        <div className="insights-head-stat">
          <span className="insights-stat-icon">
            <FolderKanban size={20} />
          </span>
          <div>
            <strong>
              <AnimatedNumber value={projects.length} />
            </strong>
            <span>All-time projects</span>
          </div>
        </div>
        <div className="insights-head-stat">
          <span className="insights-stat-icon">
            <BarChart3 size={20} />
          </span>
          <div>
            <strong>
              <AnimatedNumber value={activeProjects} />
            </strong>
            <span>Active right now</span>
          </div>
        </div>
        <div className="insights-head-stat">
          <span className="insights-stat-icon">
            <CheckCircle2 size={20} />
          </span>
          <div>
            <strong>
              <AnimatedNumber value={done} />
            </strong>
            <span>Tasks completed</span>
          </div>
        </div>
        <div className="insights-head-stat">
          <span className="insights-stat-icon">
            <Target size={20} />
          </span>
          <div>
            <strong>
              <AnimatedNumber value={activeGoalsCount} />
            </strong>
            <span>Active goals</span>
          </div>
        </div>
        <label className="insights-year">
          <span className="sr-only">Reporting year</span>
          <select
            value={selectedYear}
            onChange={(event) => setSelectedYear(Number(event.target.value))}
          >
            {[...years]
              .sort((a, b) => b - a)
              .map((year) => (
                <option key={year}>{year}</option>
              ))}
          </select>
        </label>
      </header>

      {/* Main Insights Content Grid with Bi-directional Scroll Motion */}
      <div ref={scrollContainerRef} className="space-y-5">
        {/* 7-Day Velocity Spline Chart Section */}
        <section
          className="glass-panel insights-velocity-section border border-white/10 shadow-md"
          aria-labelledby="velocity-title"
        >
          <div className="insights-velocity-header">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-accent-mint/10 border border-accent-mint/20 text-accent-mint text-[11px] font-semibold tracking-wide uppercase mb-1.5">
                <Zap className="w-3 h-3" />
                <span>Rolling Momentum</span>
              </div>
              <h2 id="velocity-title" className="text-lg font-bold text-content-primary">
                7-Day Velocity
              </h2>
            </div>

            <div className="insights-velocity-stats">
              <div className="insights-velocity-stat-item">
                <strong>
                  <AnimatedNumber value={velocityData.totalCurrent} />
                </strong>
                <span>Past 7 days completions</span>
              </div>
              <div className="insights-velocity-stat-item">
                <span
                  className={`insights-change font-mono font-semibold text-sm ${velocityData.diff < 0 ? 'is-negative' : ''}`}
                >
                  {velocityData.diff > 0 ? '+' : ''}
                  {velocityData.diff} vs prior week
                </span>
                <span>{velocityData.dailyAverage}/day average</span>
              </div>
            </div>
          </div>

          <div className="insights-legend">
            <span>
              <i />
              This week
            </span>
            <span>
              <i />
              Previous 7 days
            </span>
          </div>

          <TavolaSplineChart
            labels={velocityData.labels}
            values={velocityData.current}
            comparisonValues={velocityData.previous}
            seriesName="This week"
            comparisonName="Previous 7 days"
            unit="items"
            height={185}
          />
        </section>

        {/* Completion Rhythm & Task Mix Layout */}
        <div className="insights-layout">
          {/* Completion Rhythm Section with Vertical Bar Rise Chart */}
          <section
            className="glass-panel insights-analysis"
            aria-labelledby="completion-title"
            aria-busy={!data}
          >
            <div className="insights-panel-heading">
              <h2 id="completion-title">Completion rhythm</h2>
              <div className="insights-segments" aria-label="Chart measure">
                <button
                  type="button"
                  aria-pressed={series === 'tasks'}
                  onClick={() => setSeries('tasks')}
                >
                  Tasks
                </button>
                <button
                  type="button"
                  aria-pressed={series === 'projects'}
                  onClick={() => setSeries('projects')}
                >
                  Projects
                </button>
              </div>
            </div>

            <div className="insights-analysis-summary">
              <div className="insights-total">
                <strong>
                  <AnimatedNumber value={total} />
                </strong>
                <span>
                  {series} completed in {selectedYear}
                </span>
              </div>
              <span className={`insights-change ${difference < 0 ? 'is-negative' : ''}`}>
                {difference > 0 ? '+' : ''}
                {difference} vs {selectedYear - 1}
              </span>
              <div className="insights-mini-stat">
                <span>Best month</span>
                <strong>{total ? MONTHS[bestMonth] : '—'}</strong>
                <small>
                  {total ? `${values[bestMonth]} completed` : 'No completions yet'}
                </small>
              </div>
            </div>

            <div className="insights-legend">
              <span>
                <i />
                {selectedYear}
              </span>
              <span>
                <i />
                {selectedYear - 1} (comparison)
              </span>
            </div>

            {/* Vertical Bar Chart with Staggered scaleY: 0 -> 1 Rise */}
            <div
              ref={rhythmChartRef}
              className="insights-rhythm-chart"
              role="img"
              aria-label={`Monthly completion rhythm for ${selectedYear}`}
            >
              {MONTHS.map((month, i) => {
                const val = values[i] || 0;
                const compVal = comparison[i] || 0;
                const fillPercent = maxVal > 0 ? (val / maxVal) * 100 : 0;
                const compPercent = maxVal > 0 ? (compVal / maxVal) * 100 : 0;
                const isBest = total > 0 && i === bestMonth;

                return (
                  <div
                    key={month}
                    className={`rhythm-bar-col ${isBest ? 'is-best' : ''}`}
                    title={`${month} ${selectedYear}: ${val} ${series} (${compVal} in ${selectedYear - 1})`}
                    tabIndex={0}
                    role="group"
                    aria-label={`${month}: ${val} completed`}
                  >
                    <span className="rhythm-bar-val">{val}</span>
                    <div className="rhythm-bar-track">
                      {compVal > 0 && (
                        <div
                          className="rhythm-bar-comparison"
                          style={{ height: `${Math.min(100, Math.max(4, compPercent))}%` }}
                        />
                      )}
                      <div
                        className="rhythm-bar-fill"
                        style={{
                          height: `${Math.min(100, Math.max(4, fillPercent))}%`,
                          transform: reduced ? 'none' : 'scaleY(0)',
                        }}
                      />
                    </div>
                    <span className="rhythm-bar-label">{month}</span>
                  </div>
                );
              })}
            </div>

            <p className="insights-footnote">
              {!data
                ? 'Loading your workspace…'
                : total === 0 && previousTotal === 0
                  ? `No ${series} completed in either year yet. Your real progress will appear here.`
                  : 'Completions are grouped by their recorded completion date in your local time.'}
            </p>
          </section>

          {/* Task Mix Donut Chart Section */}
          <section
            className="glass-panel insights-distribution"
            aria-labelledby="task-mix-title"
          >
            <div className="insights-panel-heading">
              <h2 id="task-mix-title">Task mix</h2>
              <span>{tasks.length} total</span>
            </div>

            <div
              ref={donutRef}
              className="insights-donut"
              role="img"
              aria-label={`${completionRate}% completed: ${done} done, ${inProgress} in progress, ${toDo} to do`}
              style={{
                background: tasks.length
                  ? `conic-gradient(from -90deg, var(--chart-peach, #efb2a2) 0deg ${doneAngle}deg, #a8dcca ${doneAngle}deg ${doneAngle + progressAngle}deg, #ecd59a ${doneAngle + progressAngle}deg 360deg)`
                  : 'var(--border-subtle)',
              }}
            >
              <div>
                <strong>
                  {tasks.length ? (
                    <>
                      <AnimatedNumber value={completionRate} />%
                    </>
                  ) : (
                    '—'
                  )}
                </strong>
                <span className="insights-donut-label">
                  {tasks.length ? 'completed' : 'No tasks yet'}
                </span>
              </div>
            </div>

            <div className="insights-distribution-rows">
              {[
                { name: 'Completed', count: done, color: 'var(--chart-peach, #efb2a2)' },
                { name: 'In progress', count: inProgress, color: '#a8dcca' },
                { name: 'To do', count: toDo, color: '#ecd59a' },
              ].map((item) => (
                <div key={item.name}>
                  <div>
                    <i style={{ background: item.color }} />
                    <span>{item.name}</span>
                    <strong>{item.count}</strong>
                  </div>
                  <div className="insights-bar">
                    <span
                      style={{
                        width: `${tasks.length ? (item.count / tasks.length) * 100 : 0}%`,
                        background: item.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <p className="insights-footnote">
              {overdue
                ? `${overdue} open ${overdue === 1 ? 'task is' : 'tasks are'} overdue.`
                : 'No overdue tasks.'}{' '}
              Based on all tasks in this workspace.
            </p>
          </section>
        </div>

        {/* Bottom Grid Metric Panels */}
        <div className="insights-bottom-grid grid grid-cols-1 md:grid-cols-3 gap-4">
          <section className="glass-panel insights-bottom-panel">
            <div className="insights-panel-heading">
              <h2>Project momentum</h2>
              <ArrowUpRight size={22} aria-hidden="true" />
            </div>
            <div className="insights-bottom-metrics">
              <div>
                <strong>{createdInYear}</strong>
                <span>Created in {selectedYear}</span>
              </div>
              <div>
                <strong>
                  {monthlyCounts(
                    projects.map((project) => project.completedAt),
                    selectedYear
                  ).reduce((sum, value) => sum + value, 0)}
                </strong>
                <span>Completed in {selectedYear}</span>
              </div>
              <div>
                <strong>{activeProjects}</strong>
                <span>In progress now</span>
              </div>
            </div>
          </section>

          <section className="glass-panel insights-bottom-panel">
            <div className="insights-panel-heading">
              <h2>Academic progress</h2>
              <BookOpen size={22} aria-hidden="true" />
            </div>
            <div className="insights-bottom-metrics">
              <div>
                <strong>{assignments.length}</strong>
                <span>Total assignments</span>
              </div>
              <div>
                <strong>{submitted}</strong>
                <span>Submitted / graded</span>
              </div>
              <div>
                <strong>{graded}</strong>
                <span>Graded</span>
              </div>
            </div>
          </section>

          <section className="glass-panel insights-bottom-panel">
            <div className="insights-panel-heading">
              <h2>Goal ambition</h2>
              <Target size={22} aria-hidden="true" />
            </div>
            <div className="insights-bottom-metrics">
              <div>
                <strong>{activeGoalsCount}</strong>
                <span>Active goals</span>
              </div>
              <div>
                <strong>{completedGoalsCount}</strong>
                <span>Goals reached</span>
              </div>
              <div>
                <strong>
                  {completedMilestonesCount}/{totalMilestonesCount}
                </strong>
                <span>Milestones ({goalRate}%)</span>
              </div>
            </div>
          </section>
        </div>
      </div>

      <p className="insights-source">
        Calculated from your workspace on this device. No simulated metrics.
      </p>
    </div>
  );
};
