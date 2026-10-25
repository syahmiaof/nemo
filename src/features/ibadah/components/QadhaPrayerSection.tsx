import React from 'react';
import { PrayerTimeName, QadhaPrayerItem } from '@/domain/types';
import { CheckCircle2, Plus, Minus, ShieldCheck, Flame } from 'lucide-react';

interface QadhaPrayerSectionProps {
  items: QadhaPrayerItem[];
  onUpdatePrayerCount: (prayerType: PrayerTimeName, deltaCompleted: number) => Promise<void>;
  onAdjustTotalMissed: (prayerType: PrayerTimeName, deltaTotal: number) => Promise<void>;
}

const PRAYERS: { key: PrayerTimeName; label: string }[] = [
  { key: 'subuh', label: "Fajr / Subuh (2 Rak'ahs)" },
  { key: 'zohor', label: "Dhuhr / Zohor (4 Rak'ahs)" },
  { key: 'asar', label: "Asr / Asar (4 Rak'ahs)" },
  { key: 'maghrib', label: "Maghrib (3 Rak'ahs)" },
  { key: 'isyak', label: "Isha / Isyak (4 Rak'ahs)" },
];

export const QadhaPrayerSection: React.FC<QadhaPrayerSectionProps> = ({
  items,
  onUpdatePrayerCount,
  onAdjustTotalMissed,
}) => {
  const itemMap = new Map<PrayerTimeName, QadhaPrayerItem>();
  items.forEach((it) => itemMap.set(it.prayerType, it));

  const totalRemaining = items.reduce((sum, it) => sum + (it.remainingCount || 0), 0);
  const totalCompleted = items.reduce((sum, it) => sum + (it.completedCount || 0), 0);
  const grandTotal = totalRemaining + totalCompleted;
  const progressRatio = grandTotal > 0 ? Math.min(100, Math.round((totalCompleted / grandTotal) * 100)) : 100;

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#0c1527]/80 backdrop-blur-xl p-5 md:p-6 shadow-2xl relative overflow-hidden transition-all duration-300">
      {/* Background ambient lighting */}
      <div className="absolute -top-16 -right-16 w-56 h-56 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-400/30 flex items-center justify-center text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.25)]">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-content-primary flex items-center gap-2">
              Missed Prayers (Qadha) Tracker
              {totalRemaining === 0 && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <ShieldCheck className="w-3 h-3" /> All Settled!
                </span>
              )}
            </h3>
            <p className="text-xs text-content-secondary">
              Track outstanding missed obligatory prayers and log makeup completions anytime
            </p>
          </div>
        </div>

        {/* Total Remaining Counter */}
        <div className="px-4 py-2 rounded-xl border border-white/[0.08] bg-white/[0.03] text-right">
          <span className="text-[10px] uppercase tracking-wider text-content-tertiary block">
            Remaining Missed Prayers
          </span>
          <span className="text-xl font-bold font-mono text-amber-400">
            {totalRemaining} <span className="text-xs font-normal text-content-secondary">prayers</span>
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5 mb-6 relative z-10">
        <div className="flex items-center justify-between text-xs">
          <span className="text-content-secondary">
            Progress: <strong className="text-emerald-400 font-mono">{totalCompleted}</strong> made up out of {grandTotal} total
          </span>
          <span className="text-xs font-bold text-white font-mono">
            {progressRatio}% Settled
          </span>
        </div>

        <div className="w-full h-2 rounded-full bg-white/[0.06] overflow-hidden border border-white/[0.05]">
          <div
            className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 transition-all duration-500 rounded-full"
            style={{ width: `${progressRatio}%` }}
          />
        </div>
      </div>

      {/* 5 Prayers Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 relative z-10">
        {PRAYERS.map(({ key, label }) => {
          const item = itemMap.get(key) || {
            id: `qp_${key}`,
            prayerType: key,
            totalMissed: 0,
            completedCount: 0,
            remainingCount: 0,
            createdAt: '',
            updatedAt: '',
          };

          return (
            <div
              key={key}
              className="p-4 rounded-xl border border-white/[0.08] bg-white/[0.03] flex flex-col justify-between gap-3"
            >
              <div>
                <span className="text-xs font-bold text-white block capitalize">{label}</span>
                <div className="text-2xl font-extrabold font-mono text-amber-400 mt-1">
                  {item.remainingCount}{' '}
                  <span className="text-[10px] font-normal text-content-tertiary">left</span>
                </div>
                <span className="text-[10px] text-content-secondary block mt-0.5">
                  ({item.completedCount} made up)
                </span>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2 border-t border-white/[0.06]">
                <button
                  type="button"
                  disabled={item.remainingCount <= 0}
                  onClick={() => onUpdatePrayerCount(key, 1)}
                  className="w-full py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/30 text-emerald-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_8px_rgba(16,185,129,0.15)]"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Made Up 1</span>
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onAdjustTotalMissed(key, 1)}
                    className="flex-1 py-1 rounded-md bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-[11px] text-content-secondary hover:text-white flex items-center justify-center gap-1 transition-colors"
                    title="Add 1 missed prayer"
                  >
                    <Plus className="w-3 h-3 text-amber-400" />
                    <span>+1</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onAdjustTotalMissed(key, 5)}
                    className="flex-1 py-1 rounded-md bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-[11px] text-content-secondary hover:text-white flex items-center justify-center gap-1 transition-colors"
                    title="Add 5 missed prayers (1 full day)"
                  >
                    <Plus className="w-3 h-3 text-amber-400" />
                    <span>+5</span>
                  </button>

                  {item.totalMissed > 0 && item.remainingCount > 0 && (
                    <button
                      type="button"
                      onClick={() => onAdjustTotalMissed(key, -1)}
                      className="p-1 rounded-md bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-content-tertiary hover:text-rose-400 transition-colors"
                      title="Subtract 1 if miscalculated"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
