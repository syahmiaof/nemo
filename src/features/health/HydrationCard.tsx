import React, { useState } from 'react';
import type { HydrationLog } from '@/domain/types';
import { GlassWater, Droplet, Plus, Trash2, Check, Sparkles } from 'lucide-react';

interface HydrationCardProps {
  logs: HydrationLog[];
  todayStr: string;
  dailyGoalMl?: number;
  onAddWater: (amountMl: number) => Promise<void>;
  onDeleteLog: (id: string) => Promise<void>;
}

export const HydrationCard: React.FC<HydrationCardProps> = ({
  logs,
  todayStr,
  dailyGoalMl = 2500,
  onAddWater,
  onDeleteLog,
}) => {
  const [customMl, setCustomMl] = useState<string>('');
  const [justAdded, setJustAdded] = useState(false);

  const todayLogs = logs
    .filter((l) => l.date === todayStr)
    .sort((a, b) => (b.loggedAt > a.loggedAt ? 1 : -1));

  const totalMl = todayLogs.reduce((sum, l) => sum + l.amountMl, 0);
  const percent = Math.min(100, Math.round((totalMl / dailyGoalMl) * 100));
  const remainingMl = Math.max(0, dailyGoalMl - totalMl);

  const handleQuickAdd = async (amount: number) => {
    await onAddWater(amount);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 900);
  };

  const handleCustomAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(customMl, 10);
    if (!isNaN(val) && val > 0) {
      await onAddWater(val);
      setCustomMl('');
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 900);
    }
  };

  // SVG wave calculation
  const waveFillHeight = Math.max(12, Math.min(100, percent));

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#0c1527]/80 backdrop-blur-xl p-5 md:p-6 shadow-2xl relative overflow-hidden transition-all duration-300">
      {/* Background ambient water glow */}
      <div className="absolute -top-16 -right-16 w-56 h-56 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between mb-6 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)]">
            <Droplet className="w-5 h-5 fill-cyan-400/30" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-content-primary flex items-center gap-2">
              Hydration Tracker
              {percent >= 100 && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <Sparkles className="w-3 h-3" /> Goal Achieved!
                </span>
              )}
            </h3>
            <p className="text-xs text-content-secondary">Daily intake objective: {dailyGoalMl} ml</p>
          </div>
        </div>

        <div className="text-right">
          <div className="text-2xl font-bold font-mono tracking-tight text-cyan-300">
            {totalMl.toLocaleString()}
            <span className="text-xs font-normal text-content-secondary ml-1">ml</span>
          </div>
          <div className="text-[11px] text-content-secondary">
            {remainingMl > 0 ? `${remainingMl.toLocaleString()} ml remaining` : 'Target completed'}
          </div>
        </div>
      </div>

      {/* Main Gauge and Quick Logs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center relative z-10">
        {/* Interactive Fluid Liquid Gauge */}
        <div className="md:col-span-5 flex flex-col items-center">
          <div className="w-48 h-56 rounded-3xl border-2 border-cyan-400/25 bg-gradient-to-b from-[#0e1d38]/80 to-[#07101f]/90 relative overflow-hidden shadow-[inset_0_2px_18px_rgba(6,182,212,0.15)] p-1">
            {/* Glass reflection top highlight */}
            <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-white/[0.08] to-transparent pointer-events-none rounded-t-2xl z-20" />
            <div className="absolute top-2 left-3 w-1.5 h-12 bg-white/20 rounded-full blur-[1px] pointer-events-none z-20" />

            {/* Fluid Wave Fill */}
            <div
              className="absolute bottom-0 left-0 right-0 transition-all duration-700 ease-out z-10"
              style={{ height: `${waveFillHeight}%` }}
            >
              {/* Animated Wave crest */}
              <div className="absolute -top-3 left-0 right-0 w-[200%] h-5 opacity-70 animate-[wave_6s_linear_infinite]">
                <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-full fill-cyan-400/60">
                  <path d="M0,0 C150,90 350,-40 500,40 C650,120 900,10 1200,40 L1200,120 L0,120 Z" />
                </svg>
              </div>
              <div className="absolute -top-2 left-0 right-0 w-[200%] h-4 opacity-50 animate-[wave_4s_linear_infinite_reverse]">
                <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-full fill-teal-300/40">
                  <path d="M0,20 C200,-20 400,60 600,20 C800,-20 1000,50 1200,20 L1200,120 L0,120 Z" />
                </svg>
              </div>

              {/* Liquid Body */}
              <div className="w-full h-full bg-gradient-to-t from-cyan-600/90 via-sky-500/75 to-cyan-400/60 shadow-[0_-4px_24px_rgba(6,182,212,0.4)] backdrop-blur-sm" />
            </div>

            {/* Center Percentage Display */}
            <div className="absolute inset-0 flex flex-col items-center justify-center z-20 pointer-events-none select-none">
              <span className="text-3xl md:text-4xl font-extrabold font-mono text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]">
                {percent}%
              </span>
              <span className="text-xs font-medium text-cyan-100/90 drop-shadow">
                {totalMl} / {dailyGoalMl} ml
              </span>
            </div>
          </div>
        </div>

        {/* Quick Add Actions */}
        <div className="md:col-span-7 flex flex-col gap-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-content-secondary">
            Quick Log Intake
          </div>

          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => handleQuickAdd(250)}
              className="flex flex-col items-center justify-center p-3.5 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:bg-cyan-500/15 hover:border-cyan-400/40 active:scale-95 transition-all group"
            >
              <GlassWater className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform mb-1" />
              <span className="text-sm font-semibold text-content-primary">+250 ml</span>
              <span className="text-[10px] text-content-secondary">Glass</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickAdd(500)}
              className="flex flex-col items-center justify-center p-3.5 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:bg-cyan-500/15 hover:border-cyan-400/40 active:scale-95 transition-all group"
            >
              <Droplet className="w-5 h-5 text-sky-400 group-hover:scale-110 transition-transform mb-1" />
              <span className="text-sm font-semibold text-content-primary">+500 ml</span>
              <span className="text-[10px] text-content-secondary">Bottle</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickAdd(1000)}
              className="flex flex-col items-center justify-center p-3.5 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:bg-cyan-500/15 hover:border-cyan-400/40 active:scale-95 transition-all group"
            >
              <Sparkles className="w-5 h-5 text-teal-400 group-hover:scale-110 transition-transform mb-1" />
              <span className="text-sm font-semibold text-content-primary">+1,000 ml</span>
              <span className="text-[10px] text-content-secondary">Flask</span>
            </button>
          </div>

          {/* Custom Add Form */}
          <form onSubmit={handleCustomAdd} className="flex items-center gap-2 mt-1">
            <div className="relative flex-1">
              <input
                type="number"
                min="50"
                max="3000"
                step="50"
                value={customMl}
                onChange={(e) => setCustomMl(e.target.value)}
                placeholder="Custom amount (e.g. 350)"
                className="w-full rounded-xl bg-white/[0.04] border border-white/[0.09] px-3.5 py-2.5 text-xs text-content-primary placeholder:text-content-secondary/50 focus:outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/30"
              />
              <span className="absolute right-3 top-2.5 text-[11px] text-content-secondary">ml</span>
            </div>
            <button
              type="submit"
              disabled={!customMl}
              className="px-4 py-2.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-300 font-medium text-xs flex items-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" /> Log
            </button>
          </form>

          {/* Feedback badge */}
          {justAdded && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium animate-fade-in">
              <Check className="w-3.5 h-3.5" /> Added to today's hydration tally
            </div>
          )}
        </div>
      </div>

      {/* Today's History Log List */}
      {todayLogs.length > 0 && (
        <div className="mt-6 pt-5 border-t border-white/[0.08] relative z-10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-content-secondary uppercase tracking-wider">
              Today's Entries ({todayLogs.length})
            </span>
          </div>

          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto pr-1">
            {todayLogs.map((log) => {
              const time = new Date(log.loggedAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              });
              return (
                <div
                  key={log.id}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.07] text-xs text-content-secondary group hover:border-cyan-400/30 transition-colors"
                >
                  <span className="font-mono text-cyan-300 font-medium">+{log.amountMl}ml</span>
                  <span className="text-[10px] opacity-60">{time}</span>
                  <button
                    type="button"
                    onClick={() => onDeleteLog(log.id)}
                    title="Remove entry"
                    aria-label="Remove hydration entry"
                    className="opacity-0 group-hover:opacity-100 hover:text-red-400 p-0.5 rounded transition-all"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
