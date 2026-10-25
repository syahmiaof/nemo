import React from 'react';
import { CheckCircle2, Clock, Sparkles, Edit3 } from 'lucide-react';
import type { MonthlyRoadmapItem } from '@/domain/types';
import { getMascotComponent, MASCOT_META } from './MascotIcons';

interface MonthlyRoadmapCardProps {
  item: MonthlyRoadmapItem;
  isCurrentMonth: boolean;
  position?: 'top' | 'bottom';
  onEdit: (item: MonthlyRoadmapItem) => void;
  onToggleComplete: (item: MonthlyRoadmapItem) => void;
}

const MONTH_CODES = [
  'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
  'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC',
];

const MONTH_THEMES: Record<number, { border: string; glow: string; text: string; bg: string }> = {
  1: { border: 'border-sky-500/30', glow: 'rgba(56, 189, 248, 0.25)', text: 'text-sky-400', bg: 'bg-sky-500/10' },
  2: { border: 'border-indigo-500/30', glow: 'rgba(99, 102, 241, 0.25)', text: 'text-indigo-400', bg: 'bg-indigo-500/10' },
  3: { border: 'border-purple-500/30', glow: 'rgba(168, 85, 247, 0.25)', text: 'text-purple-400', bg: 'bg-purple-500/10' },
  4: { border: 'border-amber-500/30', glow: 'rgba(245, 158, 11, 0.25)', text: 'text-amber-400', bg: 'bg-amber-500/10' },
  5: { border: 'border-orange-500/30', glow: 'rgba(249, 115, 22, 0.25)', text: 'text-orange-400', bg: 'bg-orange-500/10' },
  6: { border: 'border-emerald-500/30', glow: 'rgba(16, 185, 129, 0.25)', text: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  7: { border: 'border-rose-500/30', glow: 'rgba(244, 63, 94, 0.25)', text: 'text-rose-400', bg: 'bg-rose-500/10' },
  8: { border: 'border-teal-500/30', glow: 'rgba(20, 184, 166, 0.25)', text: 'text-teal-400', bg: 'bg-teal-500/10' },
  9: { border: 'border-blue-500/30', glow: 'rgba(59, 130, 246, 0.25)', text: 'text-blue-400', bg: 'bg-blue-500/10' },
  10: { border: 'border-accent-mint/30', glow: 'rgba(52, 211, 153, 0.25)', text: 'text-accent-mint', bg: 'bg-accent-mint/10' },
  11: { border: 'border-yellow-500/30', glow: 'rgba(234, 179, 8, 0.25)', text: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  12: { border: 'border-fuchsia-500/30', glow: 'rgba(217, 70, 239, 0.25)', text: 'text-fuchsia-400', bg: 'bg-fuchsia-500/10' },
};

export const MonthlyRoadmapCard: React.FC<MonthlyRoadmapCardProps> = ({
  item,
  isCurrentMonth,
  onEdit,
  onToggleComplete,
}) => {
  const monthCode = MONTH_CODES[item.month - 1];
  const monthNum = String(item.month).padStart(2, '0');
  const theme = MONTH_THEMES[item.month] || MONTH_THEMES[1];
  const mascotInfo = MASCOT_META[item.mascot] || MASCOT_META.rocket;

  const isCompleted = item.status === 'completed';
  const isInProgress = item.status === 'in_progress';

  return (
    <div className="group relative flex flex-col w-full transition-all duration-300">
      {/* Main Glass Card */}
      <div
        className={`relative glass-panel p-4 sm:p-5 rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl w-full ${
          isCurrentMonth
            ? 'border-accent-mint/60 bg-accent-mint/[0.04] shadow-[0_0_24px_rgba(52,211,153,0.18)]'
            : isCompleted
            ? 'border-emerald-500/30 bg-emerald-500/[0.02]'
            : 'border-white/10 hover:border-white/20 bg-white/[0.02]'
        }`}
      >
        {/* Top Header: Station Pill, Current Stop Radar, Edit Action */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${theme.border} ${theme.bg} ${theme.text}`}
            >
              {monthNum} • {monthCode}
            </span>

            {isCurrentMonth && (
              <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent-mint/20 text-accent-mint border border-accent-mint/50 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-mint animate-ping" />
                Current Stop
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onToggleComplete(item)}
              className={`p-1.5 rounded-lg border transition-all ${
                isCompleted
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/30'
                  : isInProgress
                  ? 'bg-accent-mint/15 text-accent-mint border-accent-mint/30 hover:bg-accent-mint/25'
                  : 'bg-white/5 text-white/40 border-white/10 hover:text-white hover:bg-white/10'
              }`}
              title={isCompleted ? 'Mark as ongoing' : 'Mark as completed'}
              aria-label={`Toggle completion for ${monthCode}`}
            >
              <CheckCircle2 size={15} />
            </button>
            <button
              onClick={() => onEdit(item)}
              className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/10 transition-colors"
              title="Edit monthly goal & strategy"
              aria-label={`Edit ${monthCode} roadmap`}
            >
              <Edit3 size={14} />
            </button>
          </div>
        </div>

        {/* Mascot Centerpiece & Title */}
        <div className="flex items-start gap-3.5 mb-3.5">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border relative transition-transform duration-300 group-hover:scale-105 ${
              isCurrentMonth
                ? 'bg-accent-mint/10 border-accent-mint/40 shadow-[0_0_16px_rgba(52,211,153,0.2)]'
                : 'bg-white/5 border-white/10'
            }`}
          >
            {getMascotComponent(item.mascot, 46, '', isCurrentMonth)}
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="text-sm sm:text-base font-bold text-white tracking-tight line-clamp-1 group-hover:text-accent-mint transition-colors">
              {item.theme}
            </h3>
            <span className="text-[11px] text-white/50 flex items-center gap-1 mt-0.5">
              <Sparkles size={11} className={theme.text} />
              {mascotInfo.label}
            </span>
          </div>
        </div>

        {/* Primary Goal Section */}
        <div className="mb-3 p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
          <span className="block text-[10px] font-semibold uppercase tracking-wider text-white/50 mb-1">
            Goal Target
          </span>
          <p className="text-xs text-white/90 font-medium leading-relaxed line-clamp-2">
            {item.primaryGoal}
          </p>
        </div>

        {/* Execution Strategy */}
        <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
          <span className="block text-[10px] font-semibold uppercase tracking-wider text-accent-mint/70 mb-1">
            Strategy & Daily Habits
          </span>
          <p className="text-xs text-white/70 leading-relaxed line-clamp-2">
            {item.strategy}
          </p>
        </div>

        {/* Status Footer Pill */}
        <div className="mt-3.5 pt-2.5 border-t border-white/5 flex items-center justify-between text-[11px]">
          <span className="text-white/40 flex items-center gap-1">
            <Clock size={12} />
            <span>Status</span>
          </span>
          <span
            className={`font-medium capitalize px-2 py-0.5 rounded-md ${
              isCompleted
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : isInProgress
                ? 'bg-accent-mint/10 text-accent-mint border border-accent-mint/30 font-semibold'
                : 'text-white/40 bg-white/5'
            }`}
          >
            {item.status.replace('_', ' ')}
          </span>
        </div>
      </div>
    </div>
  );
};
