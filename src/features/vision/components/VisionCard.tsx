import React, { useState } from 'react';
import {
  Sparkles,
  Calendar,
  CheckCircle2,
  DollarSign,
  Target,
  PiggyBank,
  Edit2,
  Trash2,
  Award,
} from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/nemoDb';
import type { VisionItem } from '@/domain/types';

interface VisionCardProps {
  item: VisionItem;
  onEdit: (item: VisionItem) => void;
  onDelete: (id: string) => void;
  onManifest: (item: VisionItem) => void;
}

export const VisionCard: React.FC<VisionCardProps> = ({
  item,
  onEdit,
  onDelete,
  onManifest,
}) => {
  const [imgError, setImgError] = useState(false);

  // Query linked Goal if present
  const linkedGoal = useLiveQuery(
    () => (item.linkedGoalId ? db.goals.get(item.linkedGoalId) : undefined),
    [item.linkedGoalId]
  );

  // Query milestones for linked Goal
  const linkedMilestones = useLiveQuery(
    () =>
      item.linkedGoalId
        ? db.milestones.where('ownerId').equals(item.linkedGoalId).toArray()
        : [],
    [item.linkedGoalId]
  ) || [];

  // Query linked Savings Goal if present
  const linkedSavings = useLiveQuery(
    () =>
      item.linkedSavingsGoalId ? db.savingsGoals.get(item.linkedSavingsGoalId) : undefined,
    [item.linkedSavingsGoalId]
  );

  // Derive goal progress
  const goalProgress = React.useMemo(() => {
    if (!linkedMilestones.length) return null;
    const completed = linkedMilestones.filter((m) => !!m.completedAt).length;
    const rate = Math.round((completed / linkedMilestones.length) * 100);
    return { completed, total: linkedMilestones.length, rate };
  }, [linkedMilestones]);

  // Derive savings progress
  const savingsProgress = React.useMemo(() => {
    if (!linkedSavings || linkedSavings.targetAmount <= 0) return null;
    const rate = Math.min(100, Math.round((linkedSavings.currentAmount / linkedSavings.targetAmount) * 100));
    return {
      current: linkedSavings.currentAmount,
      target: linkedSavings.targetAmount,
      rate,
    };
  }, [linkedSavings]);

  const isManifested = item.status === 'manifested';

  const horizonConfig = {
    short_term: {
      label: 'Short-term (3M)',
      badgeClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    },
    mid_term: {
      label: 'Mid-term (6M-1Y)',
      badgeClass: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
    },
    long_term: {
      label: 'Long-term (2-5Y)',
      badgeClass: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
    },
    north_star: {
      label: 'North Star',
      badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    },
  }[item.horizon] || {
    label: 'Vision',
    badgeClass: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
  };

  const categoryLabels: Record<string, string> = {
    wealth_finance: 'Wealth & Finance',
    career_tech: 'Career & Tech',
    travel_adventure: 'Travel & Adventure',
    health_lifestyle: 'Health & Lifestyle',
    personal_spiritual: 'Personal & Spiritual',
    other: 'Aspiration',
  };

  const fallbackPlaceholder =
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80';

  return (
    <div
      className={`group relative flex flex-col rounded-2xl overflow-hidden border transition-all duration-300 ${
        isManifested
          ? 'bg-gradient-to-b from-amber-500/10 via-bg-midnight to-bg-midnight border-amber-500/30 shadow-[0_0_25px_rgba(245,158,11,0.15)]'
          : 'bg-white/[0.03] hover:bg-white/[0.05] border-white/10 hover:border-white/20 shadow-lg'
      }`}
    >
      {/* Cover Image Container */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-900">
        <img
          src={imgError ? fallbackPlaceholder : item.imageUrl || fallbackPlaceholder}
          alt={item.title}
          onError={() => setImgError(true)}
          className={`h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105 ${
            isManifested ? 'filter brightness-90 saturate-125' : ''
          }`}
          loading="lazy"
        />

        {/* Cinematic Gradient Scrim */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f1d] via-[#0a0f1d]/50 to-transparent" />

        {/* Top Floating Horizon & Category Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 z-10">
          <span
            className={`text-[11px] font-medium px-2.5 py-1 rounded-full border backdrop-blur-md shadow-sm ${horizonConfig.badgeClass}`}
          >
            {horizonConfig.label}
          </span>
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-black/40 text-slate-300 border border-white/10 backdrop-blur-md">
            {categoryLabels[item.category] || 'Vision'}
          </span>
        </div>

        {/* Manifested Banner Pill */}
        {isManifested && (
          <div className="absolute bottom-3 left-3 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/90 text-slate-950 font-semibold text-xs shadow-md">
            <Award size={14} />
            <span>Manifested!</span>
          </div>
        )}
      </div>

      {/* Content Details */}
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        {/* Title */}
        <h3 className="text-base sm:text-lg font-semibold text-slate-100 tracking-tight leading-snug line-clamp-2">
          {item.title}
        </h3>

        {/* "Why It Matters" Motivation Anchor */}
        {item.whyItMatters && (
          <div className="mt-2.5 p-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-xs text-slate-300/90 italic leading-relaxed">
            &ldquo;{item.whyItMatters}&rdquo;
          </div>
        )}

        {/* Description */}
        {item.description && (
          <p className="mt-2 text-xs text-slate-400 line-clamp-2 leading-relaxed">
            {item.description}
          </p>
        )}

        {/* Meta Info (Target Date & Estimated Cost) */}
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-400">
          {item.targetDate && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/5">
              <Calendar size={12} className="text-slate-400" />
              <span>Target: {item.targetDate}</span>
            </span>
          )}

          {typeof item.estimatedCost === 'number' && item.estimatedCost > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
              <DollarSign size={12} />
              <span>RM {item.estimatedCost.toLocaleString()}</span>
            </span>
          )}
        </div>

        {/* Actionable Bridges (Connected Goal or Sinking Fund) */}
        <div className="mt-3 space-y-2 border-t border-white/5 pt-3">
          {/* Linked Goal Progress */}
          {linkedGoal && (
            <div className="rounded-xl bg-white/[0.02] border border-white/5 p-2.5">
              <div className="flex items-center justify-between text-[11px] text-slate-300">
                <span className="inline-flex items-center gap-1.5 font-medium truncate max-w-[70%]">
                  <Target size={13} className="text-accent-mint shrink-0" />
                  <span className="truncate">{linkedGoal.title}</span>
                </span>
                <span className="font-mono text-accent-mint text-[11px]">
                  {goalProgress ? `${goalProgress.rate}%` : 'Goal Linked'}
                </span>
              </div>
              {goalProgress && (
                <div className="mt-1.5 w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-accent-mint h-full rounded-full transition-all duration-500"
                    style={{ width: `${goalProgress.rate}%` }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Linked Savings Goal Progress */}
          {linkedSavings && (
            <div className="rounded-xl bg-white/[0.02] border border-white/5 p-2.5">
              <div className="flex items-center justify-between text-[11px] text-slate-300">
                <span className="inline-flex items-center gap-1.5 font-medium truncate max-w-[65%]">
                  <PiggyBank size={13} className="text-sky-400 shrink-0" />
                  <span className="truncate">{linkedSavings.title}</span>
                </span>
                <span className="font-mono text-sky-400 text-[11px]">
                  {savingsProgress
                    ? `RM ${savingsProgress.current.toLocaleString()} / RM ${savingsProgress.target.toLocaleString()}`
                    : 'Fund'}
                </span>
              </div>
              {savingsProgress && (
                <div className="mt-1.5 w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-sky-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${savingsProgress.rate}%` }}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="mt-auto pt-4 flex items-center justify-between gap-2 border-t border-white/5">
          {!isManifested ? (
            <button
              onClick={() => onManifest(item)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 hover:text-amber-200 border border-amber-500/30 text-xs font-medium transition-all shadow-sm active:scale-95"
              title="Celebrate achieving this dream"
            >
              <Sparkles size={14} className="text-amber-400" />
              <span>Manifested!</span>
            </button>
          ) : (
            <span className="text-[11px] text-amber-400/80 font-medium inline-flex items-center gap-1">
              <CheckCircle2 size={13} />
              <span>In Hall of Manifestations</span>
            </span>
          )}

          <div className="flex items-center gap-1">
            <button
              onClick={() => onEdit(item)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors"
              aria-label="Edit vision"
              title="Edit vision"
            >
              <Edit2 size={14} />
            </button>
            <button
              onClick={() => onDelete(item.id)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
              aria-label="Delete vision"
              title="Delete vision"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
