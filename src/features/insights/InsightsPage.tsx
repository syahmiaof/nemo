import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
  HeartPulse,
  Wallet,
  Droplet,
  Flame,
  Activity,
  Scale,
  TrendingDown,
  TrendingUp,
  Minus,
} from 'lucide-react';
import { db } from '@/db/nemoDb';
import { isOverdue } from '@/lib/dates';
import { monthlyCounts } from '@/domain/chart';
import { TavolaSplineChart } from '@/components/ui/TavolaSplineChart';
import { useReducedMotion } from '@/design/useReducedMotion';
import { MotionTitle } from '@/components/ui/MotionTitle';
import { AnimatedNumber } from '@/components/ui/PageHeading';

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
    const [
      projects,
      tasks,
      assignments,
      goals,
      milestones,
      hydrationLogs,
      dietLogs,
      workoutLogs,
      bodyMetrics,
      financialProfiles,
      financialCommitments,
      debts,
      savingsGoals,
    ] = await Promise.all([
      db.projects.toArray(),
      db.tasks.toArray(),
      db.assignments.toArray(),
      db.goals.toArray(),
      db.milestones.toArray(),
      db.hydrationLogs.toArray(),
      db.dietLogs.toArray(),
      db.workoutLogs.toArray(),
      db.bodyMetrics.toArray(),
      db.financialProfiles.toArray(),
      db.financialCommitments.toArray(),
      db.debts.toArray(),
      db.savingsGoals.toArray(),
    ]);
    return {
      projects,
      tasks,
      assignments,
      goals,
      milestones,
      hydrationLogs,
      dietLogs,
      workoutLogs,
      bodyMetrics,
      financialProfiles,
      financialCommitments,
      debts,
      savingsGoals,
    };
  }, []);

  const projects = data?.projects ?? [];
  const tasks = data?.tasks ?? [];
  const assignments = data?.assignments ?? [];
  const goals = data?.goals ?? [];
  const milestones = data?.milestones ?? [];
  const hydrationLogs = data?.hydrationLogs ?? [];
  const dietLogs = data?.dietLogs ?? [];
  const workoutLogs = data?.workoutLogs ?? [];
  const bodyMetrics = data?.bodyMetrics ?? [];
  const financialProfiles = data?.financialProfiles ?? [];
  const financialCommitments = data?.financialCommitments ?? [];
  const debts = data?.debts ?? [];
  const savingsGoals = data?.savingsGoals ?? [];

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

  // Genuine Local Health & Lifestyle Metrics calculation
  const healthMetrics = useMemo(() => {
    const today = new Date();
    const formatLocalDate = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const todayStr = formatLocalDate(today);

    // 7-day rolling window: today down to 6 days ago (7 days total)
    const d7 = new Date(today);
    d7.setDate(today.getDate() - 6);
    const sevenDaysAgoStr = formatLocalDate(d7);

    // 30-day window
    const d30 = new Date(today);
    d30.setDate(today.getDate() - 30);
    const thirtyDaysAgoStr = formatLocalDate(d30);

    // 1. 7-Day Average Hydration & Adherence Rate vs 2500ml goal
    const past7HydrationLogs = hydrationLogs.filter(
      (l) => l.date >= sevenDaysAgoStr && l.date <= todayStr
    );
    const past7HydrationTotal = past7HydrationLogs.reduce((sum, l) => sum + (l.amountMl || 0), 0);
    const avgHydrationMl = Math.round(past7HydrationTotal / 7);
    const hydrationDailyGoal = 2500;
    const hydrationAdherenceRate = Math.round((avgHydrationMl / hydrationDailyGoal) * 100);
    const hasHydrationData = past7HydrationLogs.length > 0;

    // 2. Workouts count in past 7 days & total active minutes
    const past7WorkoutLogs = workoutLogs.filter(
      (w) => w.date >= sevenDaysAgoStr && w.date <= todayStr
    );
    const workoutsCountPast7 = past7WorkoutLogs.length;
    const totalActiveMinutesPast7 = past7WorkoutLogs.reduce(
      (sum, w) => sum + (w.durationMinutes || 0),
      0
    );
    const hasWorkoutData = past7WorkoutLogs.length > 0;

    // 3. 7-Day Average Caloric intake vs Average Workout burn
    const past7DietLogs = dietLogs.filter(
      (m) => m.date >= sevenDaysAgoStr && m.date <= todayStr
    );
    const totalCaloricIntakePast7 = past7DietLogs.reduce(
      (sum, m) => sum + (m.calories || 0),
      0
    );
    const avgCaloricIntake = Math.round(totalCaloricIntakePast7 / 7);

    const totalCaloriesBurnedPast7 = past7WorkoutLogs.reduce(
      (sum, w) => sum + (w.caloriesBurned || 0),
      0
    );
    const avgWorkoutBurn = Math.round(totalCaloriesBurnedPast7 / 7);
    const hasNutritionData = past7DietLogs.length > 0;
    const hasEnergyData = hasNutritionData || hasWorkoutData;

    // 4. Latest weight (kg) and 30-day net delta
    const sortedMetrics = [...bodyMetrics].sort((a, b) => a.date.localeCompare(b.date));
    const hasWeightData = sortedMetrics.length > 0;
    const latestMetric = hasWeightData ? sortedMetrics[sortedMetrics.length - 1] : null;
    const latestWeight = latestMetric ? latestMetric.weightKg : null;

    let weightDelta30Days: number | null = null;
    if (latestMetric && sortedMetrics.length > 1) {
      const priorTo30 = sortedMetrics.filter((m) => m.date <= thirtyDaysAgoStr);
      const baseline = priorTo30.length > 0 ? priorTo30[priorTo30.length - 1] : sortedMetrics[0];
      if (baseline && baseline.id !== latestMetric.id) {
        weightDelta30Days = Number((latestMetric.weightKg - baseline.weightKg).toFixed(1));
      } else {
        weightDelta30Days = 0;
      }
    } else if (latestMetric) {
      weightDelta30Days = 0;
    }

    const hasAnyHealthData =
      hydrationLogs.length > 0 ||
      dietLogs.length > 0 ||
      workoutLogs.length > 0 ||
      bodyMetrics.length > 0;

    return {
      avgHydrationMl,
      hydrationDailyGoal,
      hydrationAdherenceRate,
      hasHydrationData,
      workoutsCountPast7,
      totalActiveMinutesPast7,
      hasWorkoutData,
      avgCaloricIntake,
      avgWorkoutBurn,
      hasNutritionData,
      hasEnergyData,
      latestWeight,
      weightDelta30Days,
      hasWeightData,
      hasAnyHealthData,
    };
  }, [hydrationLogs, dietLogs, workoutLogs, bodyMetrics]);

  // Genuine Local Finance & Cash Flow Metrics calculation
  const financeMetrics = useMemo(() => {
    const profile = financialProfiles[0] ?? null;
    const monthlyIncome = profile?.monthlyIncomeNet ?? 0;
    const totalCommitments = financialCommitments.reduce((sum, c) => sum + (c.amount || 0), 0);
    const totalDebtInstallments = debts.reduce((sum, d) => sum + (d.monthlyInstallment || 0), 0);
    const safeToSpend = Math.max(0, monthlyIncome - totalCommitments - totalDebtInstallments);
    const safeToSpendRatio = monthlyIncome > 0 ? Math.round((safeToSpend / monthlyIncome) * 100) : 0;
    const totalSaved = savingsGoals.reduce((sum, g) => sum + (g.currentAmount || 0), 0);
    const totalSavingsTarget = savingsGoals.reduce((sum, g) => sum + (g.targetAmount || 0), 0);
    const savingsRatio = totalSavingsTarget > 0 ? Math.min(100, Math.round((totalSaved / totalSavingsTarget) * 100)) : 0;
    const totalDebtBalance = debts.reduce((sum, d) => sum + (d.currentBalance || 0), 0);
    const hasData =
      financialProfiles.length > 0 ||
      financialCommitments.length > 0 ||
      debts.length > 0 ||
      savingsGoals.length > 0;

    return {
      monthlyIncome,
      totalCommitments,
      totalDebtInstallments,
      safeToSpend,
      safeToSpendRatio,
      totalSaved,
      totalSavingsTarget,
      savingsRatio,
      totalDebtBalance,
      hasData,
    };
  }, [financialProfiles, financialCommitments, debts, savingsGoals]);

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
        <div className="insights-head-stat">
          <span className="insights-stat-icon text-rose-400">
            <HeartPulse size={20} />
          </span>
          <div>
            <strong>
              {healthMetrics.hasAnyHealthData ? (
                <>
                  <AnimatedNumber value={healthMetrics.workoutsCountPast7} />
                  <span className="text-xs font-medium text-content-secondary ml-1">wkts / 7d</span>
                </>
              ) : (
                '—'
              )}
            </strong>
            <span>Active movement</span>
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
      <div className="space-y-5">
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

        {/* Health & Lifestyle Vitality Section */}
        <section
          className="glass-panel p-5 sm:p-6 rounded-3xl border border-white/10 shadow-lg relative overflow-hidden transition-all duration-300"
          aria-labelledby="health-vitality-title"
        >
          {/* Subtle Aurora Ambient Glow */}
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-gradient-to-br from-rose-500/10 via-cyan-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-gradient-to-tr from-emerald-500/10 via-amber-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 relative z-10">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[11px] font-semibold tracking-wide uppercase mb-1.5">
                <HeartPulse className="w-3.5 h-3.5" />
                <span>Wellness & Vitality</span>
              </div>
              <h2 id="health-vitality-title" className="text-lg font-bold text-content-primary">
                Health & Lifestyle Vitality
              </h2>
              <p className="text-xs text-content-secondary mt-0.5">
                7-day rolling wellness metrics, hydration velocity, and metabolic momentum
              </p>
            </div>

            <Link
              to="/health"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-content-primary transition-all duration-200 self-start sm:self-auto group"
            >
              <span>Open Health Hub</span>
              <ArrowUpRight size={14} className="text-content-secondary group-hover:text-content-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>
          </div>

          {/* 4 Health Pillars Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
            {/* 1. 7-Day Average Hydration */}
            <div className="rounded-2xl bg-white/[0.03] border border-white/[0.08] p-4.5 flex flex-col justify-between hover:border-cyan-500/30 transition-colors duration-200 group">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-content-secondary">7-Day Hydration</span>
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform">
                    <Droplet size={16} />
                  </div>
                </div>
                <div className="flex items-baseline gap-1.5">
                  {healthMetrics.hasHydrationData ? (
                    <>
                      <strong className="text-2xl font-bold text-content-primary tracking-tight">
                        <AnimatedNumber value={healthMetrics.avgHydrationMl} />
                      </strong>
                      <span className="text-xs font-medium text-content-secondary">ml / day</span>
                    </>
                  ) : (
                    <strong className="text-2xl font-bold text-content-secondary tracking-tight">—</strong>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-white/[0.06]">
                {healthMetrics.hasHydrationData ? (
                  <>
                    <div className="flex items-center justify-between text-[11px] mb-1.5">
                      <span className="text-content-secondary">Goal adherence</span>
                      <span className="font-semibold text-cyan-400">
                        <AnimatedNumber value={healthMetrics.hydrationAdherenceRate} />%
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-sky-400 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.max(4, healthMetrics.hydrationAdherenceRate))}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-content-secondary/70 mt-1 block">
                      vs {healthMetrics.hydrationDailyGoal.toLocaleString()} ml daily target
                    </span>
                  </>
                ) : (
                  <p className="text-xs text-content-secondary/70 italic">
                    No hydration logged in past 7 days.
                  </p>
                )}
              </div>
            </div>

            {/* 2. Active Movement (Workouts & Active Minutes) */}
            <div className="rounded-2xl bg-white/[0.03] border border-white/[0.08] p-4.5 flex flex-col justify-between hover:border-emerald-500/30 transition-colors duration-200 group">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-content-secondary">Active Movement</span>
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                    <Activity size={16} />
                  </div>
                </div>
                <div className="flex items-baseline gap-1.5">
                  {healthMetrics.hasWorkoutData ? (
                    <>
                      <strong className="text-2xl font-bold text-content-primary tracking-tight">
                        <AnimatedNumber value={healthMetrics.workoutsCountPast7} />
                      </strong>
                      <span className="text-xs font-medium text-content-secondary">
                        {healthMetrics.workoutsCountPast7 === 1 ? 'workout' : 'workouts'} (7d)
                      </span>
                    </>
                  ) : (
                    <strong className="text-2xl font-bold text-content-secondary tracking-tight">0</strong>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-white/[0.06]">
                {healthMetrics.hasWorkoutData ? (
                  <div>
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-content-secondary">Total active time</span>
                      <strong className="font-semibold text-emerald-400">
                        <AnimatedNumber value={healthMetrics.totalActiveMinutesPast7} /> min
                      </strong>
                    </div>
                    <span className="text-[10px] text-content-secondary/70 block">
                      Avg {Math.round(healthMetrics.totalActiveMinutesPast7 / Math.max(1, healthMetrics.workoutsCountPast7))} min / session
                    </span>
                  </div>
                ) : (
                  <p className="text-xs text-content-secondary/70 italic">
                    No workouts recorded in past 7 days.
                  </p>
                )}
              </div>
            </div>

            {/* 3. Energy Balance (Intake vs Workout Burn) */}
            <div className="rounded-2xl bg-white/[0.03] border border-white/[0.08] p-4.5 flex flex-col justify-between hover:border-amber-500/30 transition-colors duration-200 group">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-content-secondary">Energy Balance</span>
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
                    <Flame size={16} />
                  </div>
                </div>
                <div className="flex items-baseline gap-1.5">
                  {healthMetrics.hasEnergyData ? (
                    <>
                      <strong className="text-2xl font-bold text-content-primary tracking-tight">
                        <AnimatedNumber value={healthMetrics.avgCaloricIntake} />
                      </strong>
                      <span className="text-xs font-medium text-content-secondary">kcal in / day</span>
                    </>
                  ) : (
                    <strong className="text-2xl font-bold text-content-secondary tracking-tight">—</strong>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-white/[0.06]">
                {healthMetrics.hasEnergyData ? (
                  <div>
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-content-secondary">Avg workout burn</span>
                      <strong className="font-semibold text-amber-400">
                        <AnimatedNumber value={healthMetrics.avgWorkoutBurn} /> kcal / day
                      </strong>
                    </div>
                    <span className="text-[10px] text-content-secondary/70 block">
                      {healthMetrics.avgCaloricIntake > 0 && healthMetrics.avgWorkoutBurn > 0
                        ? `Net: ${healthMetrics.avgCaloricIntake - healthMetrics.avgWorkoutBurn > 0 ? '+' : ''}${healthMetrics.avgCaloricIntake - healthMetrics.avgWorkoutBurn} kcal daily margin`
                        : 'Calculated over 7 rolling days'}
                    </span>
                  </div>
                ) : (
                  <p className="text-xs text-content-secondary/70 italic">
                    No diet or workout calories logged.
                  </p>
                )}
              </div>
            </div>

            {/* 4. Body Composition (Weight & 30-Day Delta) */}
            <div className="rounded-2xl bg-white/[0.03] border border-white/[0.08] p-4.5 flex flex-col justify-between hover:border-rose-500/30 transition-colors duration-200 group">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-content-secondary">Body Composition</span>
                  <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 group-hover:scale-105 transition-transform">
                    <Scale size={16} />
                  </div>
                </div>
                <div className="flex items-baseline gap-1.5">
                  {healthMetrics.latestWeight !== null ? (
                    <>
                      <strong className="text-2xl font-bold text-content-primary tracking-tight">
                        {healthMetrics.latestWeight}
                      </strong>
                      <span className="text-xs font-medium text-content-secondary">kg</span>
                    </>
                  ) : (
                    <strong className="text-2xl font-bold text-content-secondary tracking-tight">—</strong>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-white/[0.06]">
                {healthMetrics.latestWeight !== null && healthMetrics.weightDelta30Days !== null ? (
                  <div>
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-content-secondary">30-day net delta</span>
                      <span
                        className={`font-semibold inline-flex items-center gap-0.5 ${
                          healthMetrics.weightDelta30Days < 0
                            ? 'text-emerald-400'
                            : healthMetrics.weightDelta30Days > 0
                              ? 'text-amber-400'
                              : 'text-content-secondary'
                        }`}
                      >
                        {healthMetrics.weightDelta30Days < 0 ? (
                          <TrendingDown size={13} />
                        ) : healthMetrics.weightDelta30Days > 0 ? (
                          <TrendingUp size={13} />
                        ) : (
                          <Minus size={13} />
                        )}
                        {healthMetrics.weightDelta30Days > 0 ? '+' : ''}
                        {healthMetrics.weightDelta30Days} kg
                      </span>
                    </div>
                    <span className="text-[10px] text-content-secondary/70 block">
                      vs 30-day baseline record
                    </span>
                  </div>
                ) : (
                  <p className="text-xs text-content-secondary/70 italic">
                    No weight measurements recorded yet.
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Bottom Grid Metric Panels */}
        <div className="insights-bottom-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

          <section className="glass-panel insights-bottom-panel">
            <div className="insights-panel-heading">
              <h2>Lifestyle & Vitality</h2>
              <HeartPulse size={22} aria-hidden="true" className="text-rose-400" />
            </div>
            <div className="insights-bottom-metrics">
              <div>
                <strong>
                  {healthMetrics.hasHydrationData ? (
                    <>
                      <AnimatedNumber value={healthMetrics.avgHydrationMl} />
                      <span className="text-xs font-normal text-content-secondary ml-1">ml</span>
                    </>
                  ) : (
                    '—'
                  )}
                </strong>
                <span>7d avg water</span>
              </div>
              <div>
                <strong>
                  <AnimatedNumber value={healthMetrics.workoutsCountPast7} />
                </strong>
                <span>Workouts (7d)</span>
              </div>
              <div>
                <strong>
                  {healthMetrics.latestWeight !== null ? `${healthMetrics.latestWeight} kg` : '—'}
                </strong>
                <span>Latest weight</span>
              </div>
            </div>
          </section>

          <section className="glass-panel insights-bottom-panel">
            <div className="insights-panel-heading">
              <h2>Financial Vitality</h2>
              <Wallet size={22} aria-hidden="true" className="text-emerald-400" />
            </div>
            <div className="insights-bottom-metrics">
              <div>
                <strong>
                  {financeMetrics.hasData && financeMetrics.monthlyIncome > 0 ? (
                    <>
                      <AnimatedNumber value={financeMetrics.safeToSpendRatio} />
                      <span className="text-xs font-normal text-content-secondary ml-1">%</span>
                    </>
                  ) : (
                    '—'
                  )}
                </strong>
                <span>Safe-to-Spend</span>
              </div>
              <div>
                <strong>
                  {financeMetrics.hasData ? (
                    <>
                      <span className="text-xs font-normal text-content-secondary mr-1">RM</span>
                      <AnimatedNumber value={Math.round(financeMetrics.totalCommitments + financeMetrics.totalDebtInstallments)} />
                    </>
                  ) : (
                    '—'
                  )}
                </strong>
                <span>Monthly Burn</span>
              </div>
              <div>
                <strong>
                  {financeMetrics.hasData ? (
                    <>
                      <span className="text-xs font-normal text-content-secondary mr-1">RM</span>
                      <AnimatedNumber value={Math.round(financeMetrics.totalSaved)} />
                    </>
                  ) : (
                    '—'
                  )}
                </strong>
                <span>Total Saved</span>
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
