import React, { useState, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { db } from '@/db/nemoDb';
import {
  atomicAddHydration,
  atomicUpdateHydration,
  atomicDeleteHydration,
  atomicLogDiet,
  atomicDeleteDiet,
  atomicLogWorkout,
  atomicDeleteWorkout,
  atomicLogBodyMetric,
  atomicDeleteBodyMetric,
} from '@/db/operations';
import { HydrationCard } from './HydrationCard';
import { DietNutritionCard } from './DietNutritionCard';
import { WorkoutSection } from './WorkoutSection';
import { BodyMetricsCard } from './BodyMetricsCard';
import { PageHeading } from '@/components/ui/PageHeading';
import { useReducedMotion } from '@/design/useReducedMotion';
import { Droplet, Utensils, Activity, Scale, LayoutGrid } from 'lucide-react';

gsap.registerPlugin(useGSAP);

type HealthTab = 'all' | 'hydration' | 'nutrition' | 'workouts' | 'body';

function getTodayLocalDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export const HealthPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<HealthTab>('all');
  const [dailyGoalMl, setDailyGoalMl] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('nemo_hydration_goal_ml');
      return saved ? parseInt(saved, 10) || 2500 : 2500;
    } catch {
      return 2500;
    }
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const todayStr = getTodayLocalDate();

  // Live queries from Dexie
  const hydrationLogs = useLiveQuery(() => db.hydrationLogs.toArray(), []) ?? [];
  const dietLogs = useLiveQuery(() => db.dietLogs.toArray(), []) ?? [];
  const workoutLogs = useLiveQuery(() => db.workoutLogs.toArray(), []) ?? [];
  const bodyMetrics = useLiveQuery(() => db.bodyMetrics.toArray(), []) ?? [];

  // Summary calculations for Today
  const todayHydrationMl = hydrationLogs
    .filter((l) => l.date === todayStr)
    .reduce((sum, l) => sum + l.amountMl, 0);

  const todayDietCalories = dietLogs
    .filter((m) => m.date === todayStr)
    .reduce((sum, m) => sum + (m.calories || 0), 0);

  const todayBurnedCalories = workoutLogs
    .filter((w) => w.date === todayStr)
    .reduce((sum, w) => sum + (w.caloriesBurned || 0), 0);

  const sortedMetrics = [...bodyMetrics].sort((a, b) => (a.date > b.date ? 1 : -1));
  const latestWeight = sortedMetrics[sortedMetrics.length - 1]?.weightKg ?? 70.0;

  // Staggered cosmic GSAP animation when switching tabs
  useGSAP(
    () => {
      if (reducedMotion || !containerRef.current) return;
      gsap.fromTo(
        '.health-card-anim',
        { opacity: 0, y: 16, scale: 0.98 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.45,
          stagger: 0.08,
          ease: 'power3.out',
        }
      );
    },
    { scope: containerRef, dependencies: [activeTab, reducedMotion] }
  );

  return (
    <div ref={containerRef} className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Page Heading with live badges */}
      <PageHeading
        title="Health & Wellness"
        description="Hydration velocity, nutritional macros, active training, and body composition"
        stats={[
          { label: 'Water (ml)', value: todayHydrationMl, icon: Droplet, note: `of ${dailyGoalMl}ml` },
          { label: 'Intake (kcal)', value: todayDietCalories, icon: Utensils },
          { label: 'Active Burn (kcal)', value: todayBurnedCalories, icon: Activity },
          { label: 'Weight (kg)', value: Math.round(latestWeight * 10) / 10, icon: Scale },
        ]}
      />

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
            activeTab === 'all'
              ? 'bg-white/[0.12] text-white border border-white/[0.2] shadow-sm'
              : 'text-content-secondary hover:text-content-primary hover:bg-white/[0.04] border border-transparent'
          }`}
        >
          <LayoutGrid className="w-3.5 h-3.5" /> All Overview
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('hydration')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
            activeTab === 'hydration'
              ? 'bg-cyan-500/25 text-cyan-200 border border-cyan-400/40 shadow-sm'
              : 'text-content-secondary hover:text-cyan-300 hover:bg-cyan-500/10 border border-transparent'
          }`}
        >
          <Droplet className="w-3.5 h-3.5 text-cyan-400" /> Hydration
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('nutrition')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
            activeTab === 'nutrition'
              ? 'bg-emerald-500/25 text-emerald-200 border border-emerald-400/40 shadow-sm'
              : 'text-content-secondary hover:text-emerald-300 hover:bg-emerald-500/10 border border-transparent'
          }`}
        >
          <Utensils className="w-3.5 h-3.5 text-emerald-400" /> Diet & Nutrition
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('workouts')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
            activeTab === 'workouts'
              ? 'bg-orange-500/25 text-orange-200 border border-orange-400/40 shadow-sm'
              : 'text-content-secondary hover:text-orange-300 hover:bg-orange-500/10 border border-transparent'
          }`}
        >
          <Activity className="w-3.5 h-3.5 text-orange-400" /> Workouts & Cardio
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('body')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
            activeTab === 'body'
              ? 'bg-sky-500/25 text-sky-200 border border-sky-400/40 shadow-sm'
              : 'text-content-secondary hover:text-sky-300 hover:bg-sky-500/10 border border-transparent'
          }`}
        >
          <Scale className="w-3.5 h-3.5 text-sky-400" /> Body & Progress
        </button>
      </div>

      {/* Main Grid Content */}
      <div className="space-y-6">
        {(activeTab === 'all' || activeTab === 'hydration') && (
          <div className="health-card-anim">
            <HydrationCard
              logs={hydrationLogs}
              todayStr={todayStr}
              dailyGoalMl={dailyGoalMl}
              onAddWater={async (amountMl) => {
                await atomicAddHydration(db, {
                  date: todayStr,
                  amountMl,
                  loggedAt: new Date().toISOString(),
                });
              }}
              onUpdateLog={async (id, amountMl) => {
                await atomicUpdateHydration(db, id, { amountMl });
              }}
              onDeleteLog={async (id) => {
                await atomicDeleteHydration(db, id);
              }}
              onUpdateDailyGoal={(goal) => {
                setDailyGoalMl(goal);
                try {
                  localStorage.setItem('nemo_hydration_goal_ml', String(goal));
                } catch {
                  // ignore
                }
              }}
            />
          </div>
        )}

        {(activeTab === 'all' || activeTab === 'nutrition') && (
          <div className="health-card-anim">
            <DietNutritionCard
              logs={dietLogs}
              todayStr={todayStr}
              onLogMeal={async (meal) => {
                await atomicLogDiet(db, meal);
              }}
              onDeleteMeal={async (id) => {
                await atomicDeleteDiet(db, id);
              }}
            />
          </div>
        )}

        {(activeTab === 'all' || activeTab === 'workouts') && (
          <div className="health-card-anim">
            <WorkoutSection
              logs={workoutLogs}
              todayStr={todayStr}
              onLogWorkout={async (entry) => {
                await atomicLogWorkout(db, entry);
              }}
              onDeleteWorkout={async (id) => {
                await atomicDeleteWorkout(db, id);
              }}
            />
          </div>
        )}

        {(activeTab === 'all' || activeTab === 'body') && (
          <div className="health-card-anim">
            <BodyMetricsCard
              metrics={bodyMetrics}
              todayStr={todayStr}
              todayDietCalories={todayDietCalories}
              todayBurnedCalories={todayBurnedCalories}
              onLogWeight={async (entry) => {
                await atomicLogBodyMetric(db, entry);
              }}
              onDeleteMetric={async (id) => {
                await atomicDeleteBodyMetric(db, id);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};
