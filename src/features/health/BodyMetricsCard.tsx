import React, { useState } from 'react';
import type { BodyMetric } from '@/domain/types';
import { Scale, Plus, Trash2, TrendingDown, TrendingUp, Minus, Flame } from 'lucide-react';
import { TavolaSplineChart } from '@/components/ui/TavolaSplineChart';
import { Modal } from '@/components/ui/Modal';

interface BodyMetricsCardProps {
  metrics: BodyMetric[];
  todayStr: string;
  onLogWeight: (entry: Omit<BodyMetric, 'id'>) => Promise<void>;
  onDeleteMetric: (id: string) => Promise<void>;
  todayDietCalories: number;
  todayBurnedCalories: number;
}

export const BodyMetricsCard: React.FC<BodyMetricsCardProps> = ({
  metrics,
  todayStr,
  onLogWeight,
  onDeleteMetric,
  todayDietCalories,
  todayBurnedCalories,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [weightKg, setWeightKg] = useState('');
  const [bodyFatPercent, setBodyFatPercent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sort metrics chronologically
  const sortedMetrics = [...metrics].sort((a, b) => (a.date > b.date ? 1 : -1));
  const latestMetric = sortedMetrics[sortedMetrics.length - 1];
  const firstMetric = sortedMetrics[0];

  const currentWeight = latestMetric?.weightKg ?? 70.0;
  const weightDiff = firstMetric && sortedMetrics.length > 1
    ? currentWeight - firstMetric.weightKg
    : 0;

  // Net energy balance: Intake - Burned
  const netCalories = todayDietCalories - todayBurnedCalories;
  const isDeficit = netCalories < 0;

  // Prepare 7-30 day chart data
  const chartLabels: string[] = [];
  const chartValues: number[] = [];

  // Group by date or take the last 7 recorded entries
  const recentEntries = sortedMetrics.slice(-14);
  if (recentEntries.length === 0) {
    chartLabels.push('Today');
    chartValues.push(currentWeight);
  } else {
    for (const m of recentEntries) {
      const parts = m.date.split('-');
      chartLabels.push(`${parts[1]}/${parts[2]}`);
      chartValues.push(m.weightKg);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const w = parseFloat(weightKg);
    if (isNaN(w) || w <= 0) return;

    setIsSubmitting(true);
    try {
      await onLogWeight({
        date: todayStr,
        weightKg: w,
        bodyFatPercent: bodyFatPercent ? parseFloat(bodyFatPercent) : undefined,
        loggedAt: new Date().toISOString(),
      });
      setModalOpen(false);
      setWeightKg('');
      setBodyFatPercent('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#0c1527]/80 backdrop-blur-xl p-5 md:p-6 shadow-2xl relative overflow-hidden transition-all duration-300">
      {/* Background ambient glow */}
      <div className="absolute -top-16 -right-16 w-56 h-56 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between mb-6 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-400/30 flex items-center justify-center text-sky-400 shadow-[0_0_15px_rgba(14,165,233,0.25)]">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-content-primary flex items-center gap-2">
              Body & Progress
            </h3>
            <p className="text-xs text-content-secondary">
              Weight evolution and daily net caloric balance
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setWeightKg(currentWeight.toFixed(1));
            setModalOpen(true);
          }}
          className="px-3.5 py-2 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/35 text-sky-300 text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 shadow-[0_0_12px_rgba(14,165,233,0.2)]"
        >
          <Plus className="w-4 h-4" /> Log Weight
        </button>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 relative z-10">
        {/* Current Weight */}
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 flex flex-col justify-between">
          <div className="text-xs text-content-secondary flex items-center justify-between">
            <span>Latest Weight</span>
            {latestMetric?.bodyFatPercent && (
              <span className="text-[11px] font-mono text-teal-300">{latestMetric.bodyFatPercent}% BF</span>
            )}
          </div>
          <div className="text-2xl font-bold font-mono tracking-tight text-white my-1">
            {currentWeight.toFixed(1)}
            <span className="text-xs font-normal text-content-secondary ml-1">kg</span>
          </div>
          <div className="text-[11px] text-content-secondary flex items-center gap-1">
            {weightDiff < 0 ? (
              <span className="text-emerald-400 flex items-center gap-0.5">
                <TrendingDown className="w-3 h-3" /> {Math.abs(weightDiff).toFixed(1)} kg overall
              </span>
            ) : weightDiff > 0 ? (
              <span className="text-amber-400 flex items-center gap-0.5">
                <TrendingUp className="w-3 h-3" /> +{weightDiff.toFixed(1)} kg overall
              </span>
            ) : (
              <span className="text-content-secondary flex items-center gap-0.5">
                <Minus className="w-3 h-3" /> Stable trend
              </span>
            )}
          </div>
        </div>

        {/* Net Energy Balance Today */}
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 flex flex-col justify-between">
          <div className="text-xs text-content-secondary flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-amber-400" /> Today's Net Balance
          </div>
          <div className="text-2xl font-bold font-mono tracking-tight text-white my-1">
            {netCalories > 0 ? `+${netCalories.toLocaleString()}` : netCalories.toLocaleString()}
            <span className="text-xs font-normal text-content-secondary ml-1">kcal</span>
          </div>
          <div className="text-[11px] flex items-center gap-1">
            {isDeficit ? (
              <span className="text-emerald-400 font-medium">Deficit (Fat loss zone)</span>
            ) : (
              <span className="text-amber-400 font-medium">Surplus (Muscle growth zone)</span>
            )}
          </div>
        </div>

        {/* Caloric In vs Out Breakdown */}
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 flex flex-col justify-between">
          <div className="text-xs text-content-secondary">Energy Flux</div>
          <div className="space-y-1 my-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-content-secondary">Intake:</span>
              <span className="font-mono text-emerald-400 font-medium">{todayDietCalories} kcal</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-content-secondary">Burned:</span>
              <span className="font-mono text-orange-400 font-medium">-{todayBurnedCalories} kcal</span>
            </div>
          </div>
          <div className="text-[10px] text-content-secondary/70">
            Diet logs vs. active workout calories
          </div>
        </div>
      </div>

      {/* 30-Day Spline Chart */}
      <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 relative z-10 mb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-content-secondary">
            Weight Trajectory Trend
          </span>
          <span className="text-[11px] font-mono text-sky-400">
            {recentEntries.length} data points
          </span>
        </div>

        <div className="w-full">
          <TavolaSplineChart
            labels={chartLabels}
            values={chartValues}
            seriesName="Body Weight"
            unit="kg"
            height={220}
          />
        </div>
      </div>

      {/* Recent Weight Entries */}
      {sortedMetrics.length > 0 && (
        <div className="border-t border-white/[0.08] pt-4 relative z-10">
          <div className="text-xs font-semibold uppercase tracking-wider text-content-secondary mb-3">
            Recent Logs ({sortedMetrics.length})
          </div>

          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto pr-1">
            {sortedMetrics
              .slice(-8)
              .reverse()
              .map((metric) => (
                <div
                  key={metric.id}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.07] text-xs text-content-secondary group hover:border-sky-400/30 transition-colors"
                >
                  <span className="font-mono font-medium text-sky-300">{metric.weightKg.toFixed(1)} kg</span>
                  {metric.bodyFatPercent && (
                    <span className="text-[10px] text-teal-300 font-mono">({metric.bodyFatPercent}%)</span>
                  )}
                  <span className="text-[10px] opacity-60">{metric.date}</span>
                  <button
                    type="button"
                    onClick={() => onDeleteMetric(metric.id)}
                    title="Remove entry"
                    aria-label="Remove weight entry"
                    className="opacity-0 group-hover:opacity-100 hover:text-red-400 p-0.5 rounded transition-all"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Log Weight Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Log Body Metrics">
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-medium text-content-secondary mb-1">Body Weight (kg) *</label>
            <input
              type="number"
              required
              step="0.1"
              min="20"
              max="350"
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              placeholder="e.g. 72.5"
              className="w-full rounded-xl bg-white/[0.04] border border-white/[0.1] px-3.5 py-2.5 text-xs text-content-primary focus:outline-none focus:border-sky-400/50"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-content-secondary mb-1">Body Fat % (Optional)</label>
            <input
              type="number"
              step="0.1"
              min="3"
              max="65"
              value={bodyFatPercent}
              onChange={(e) => setBodyFatPercent(e.target.value)}
              placeholder="e.g. 15.5"
              className="w-full rounded-xl bg-white/[0.04] border border-white/[0.1] px-3.5 py-2.5 text-xs text-content-primary focus:outline-none focus:border-sky-400/50"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-white/[0.08] text-content-secondary hover:text-content-primary text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !weightKg}
              className="px-4 py-2 rounded-xl bg-sky-500/25 hover:bg-sky-500/35 border border-sky-400/40 text-sky-200 font-semibold text-xs flex items-center gap-1.5 transition-all disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5" /> Save Entry
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
