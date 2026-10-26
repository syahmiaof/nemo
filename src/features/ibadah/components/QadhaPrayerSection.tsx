import React, { useState } from 'react';
import { PrayerTimeName, QadhaPrayerItem } from '@/domain/types';
import {
  calculateQadhaPrayerPayoff,
  getQadhaPaceMilestones,
  calculateRequiredPaceForTargetDate,
} from '../lib/qadhaCalculator';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import {
  CheckCircle2,
  Plus,
  Minus,
  ShieldCheck,
  Flame,
  Calculator,
  Calendar,
  Clock,
  Pencil,
  Sliders,
  Sparkles,
  Target,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface QadhaPrayerSectionProps {
  items: QadhaPrayerItem[];
  onUpdatePrayerCount: (prayerType: PrayerTimeName, deltaCompleted: number) => Promise<void>;
  onAdjustTotalMissed: (prayerType: PrayerTimeName, deltaTotal: number) => Promise<void>;
  onSetPrayerRemaining?: (prayerType: PrayerTimeName, count: number) => Promise<void>;
  onBulkSetPrayers?: (records: Array<{ prayerType: PrayerTimeName; remainingCount: number; completedCount?: number }>) => Promise<void>;
}

const PRAYERS: { key: PrayerTimeName; label: string; shortName: string; rakahs: number }[] = [
  { key: 'subuh', label: "Fajr / Subuh (2 Rak'ahs)", shortName: 'Subuh', rakahs: 2 },
  { key: 'zohor', label: "Dhuhr / Zohor (4 Rak'ahs)", shortName: 'Zohor', rakahs: 4 },
  { key: 'asar', label: "Asr / Asar (4 Rak'ahs)", shortName: 'Asar', rakahs: 4 },
  { key: 'maghrib', label: "Maghrib (3 Rak'ahs)", shortName: 'Maghrib', rakahs: 3 },
  { key: 'isyak', label: "Isha / Isyak (4 Rak'ahs)", shortName: 'Isyak', rakahs: 4 },
];

export const QadhaPrayerSection: React.FC<QadhaPrayerSectionProps> = ({
  items,
  onUpdatePrayerCount,
  onAdjustTotalMissed,
  onSetPrayerRemaining,
  onBulkSetPrayers,
}) => {
  const itemMap = new Map<PrayerTimeName, QadhaPrayerItem>();
  items.forEach((it) => itemMap.set(it.prayerType, it));

  const totalRemaining = items.reduce((sum, it) => sum + (it.remainingCount || 0), 0);
  const totalCompleted = items.reduce((sum, it) => sum + (it.completedCount || 0), 0);
  const grandTotal = totalRemaining + totalCompleted;
  const progressRatio = grandTotal > 0 ? Math.min(100, Math.round((totalCompleted / grandTotal) * 100)) : 100;

  // Direct Key-In Modal State
  const [isKeyInModalOpen, setIsKeyInModalOpen] = useState(false);
  const [inputSubuh, setInputSubuh] = useState('');
  const [inputZohor, setInputZohor] = useState('');
  const [inputAsar, setInputAsar] = useState('');
  const [inputMaghrib, setInputMaghrib] = useState('');
  const [inputIsyak, setInputIsyak] = useState('');
  const [batchDaysInput, setBatchDaysInput] = useState('');
  const [isSavingKeyIn, setIsSavingKeyIn] = useState(false);

  // Single Prayer Inline Edit State
  const [inlineEditKey, setInlineEditKey] = useState<PrayerTimeName | null>(null);
  const [inlineVal, setInlineVal] = useState('');

  // Calculator State
  const [dailyPace, setDailyPace] = useState<number>(5); // default: 5 prayers/day (1 after each fardhu)
  const [isCalculatorExpanded, setIsCalculatorExpanded] = useState(true);
  const [targetDateInput, setTargetDateInput] = useState<string>('');

  // Pre-fill key-in modal from current database counts
  const handleOpenKeyInModal = () => {
    setInputSubuh((itemMap.get('subuh')?.remainingCount ?? 0).toString());
    setInputZohor((itemMap.get('zohor')?.remainingCount ?? 0).toString());
    setInputAsar((itemMap.get('asar')?.remainingCount ?? 0).toString());
    setInputMaghrib((itemMap.get('maghrib')?.remainingCount ?? 0).toString());
    setInputIsyak((itemMap.get('isyak')?.remainingCount ?? 0).toString());
    setBatchDaysInput('');
    setIsKeyInModalOpen(true);
  };

  // Quick preset filler for all 5 prayers simultaneously
  const handleApplyBatchDays = (days: number) => {
    const val = Math.max(0, days).toString();
    setInputSubuh(val);
    setInputZohor(val);
    setInputAsar(val);
    setInputMaghrib(val);
    setInputIsyak(val);
    setBatchDaysInput(days.toString());
  };

  const handleSaveKeyInModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onBulkSetPrayers) return;

    const subuhNum = Math.max(0, parseInt(inputSubuh, 10) || 0);
    const zohorNum = Math.max(0, parseInt(inputZohor, 10) || 0);
    const asarNum = Math.max(0, parseInt(inputAsar, 10) || 0);
    const maghribNum = Math.max(0, parseInt(inputMaghrib, 10) || 0);
    const isyakNum = Math.max(0, parseInt(inputIsyak, 10) || 0);

    try {
      setIsSavingKeyIn(true);
      await onBulkSetPrayers([
        { prayerType: 'subuh', remainingCount: subuhNum },
        { prayerType: 'zohor', remainingCount: zohorNum },
        { prayerType: 'asar', remainingCount: asarNum },
        { prayerType: 'maghrib', remainingCount: maghribNum },
        { prayerType: 'isyak', remainingCount: isyakNum },
      ]);
      setIsKeyInModalOpen(false);
    } catch (err) {
      console.error('Failed to set qadha prayer counts:', err);
    } finally {
      setIsSavingKeyIn(false);
    }
  };

  // Inline edit handlers
  const handleStartInlineEdit = (key: PrayerTimeName, currentRemaining: number) => {
    setInlineEditKey(key);
    setInlineVal(currentRemaining.toString());
  };

  const handleSaveInlineEdit = async (key: PrayerTimeName) => {
    if (!onSetPrayerRemaining) {
      setInlineEditKey(null);
      return;
    }
    const num = Math.max(0, parseInt(inlineVal, 10) || 0);
    try {
      await onSetPrayerRemaining(key, num);
    } catch (err) {
      console.error('Failed to save inline prayer count:', err);
    } finally {
      setInlineEditKey(null);
    }
  };

  // Calculator Estimates
  const estimate = calculateQadhaPrayerPayoff(totalRemaining, dailyPace);
  const milestoneComparisons = getQadhaPaceMilestones(totalRemaining);

  // Target Date Reverse Estimate
  const targetDateObj = targetDateInput ? new Date(targetDateInput) : null;
  const targetDateResult = targetDateObj
    ? calculateRequiredPaceForTargetDate(totalRemaining, targetDateObj)
    : null;

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
              Track outstanding missed obligatory prayers, key in remaining counts, and forecast completion
            </p>
          </div>
        </div>

        {/* Action Controls & Total Remaining */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={handleOpenKeyInModal}
            className="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/35 text-amber-300 text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 shadow-[0_0_12px_rgba(245,158,11,0.2)]"
            title="Key in exactly how many missed prayers remain"
          >
            <Pencil className="w-3.5 h-3.5" />
            <span>Key In Missed Prayers</span>
          </button>

          <div className="px-4 py-2 rounded-xl border border-white/[0.08] bg-white/[0.03] text-right">
            <span className="text-[10px] uppercase tracking-wider text-content-tertiary block">
              Remaining Owed
            </span>
            <span className="text-xl font-bold font-mono text-amber-400">
              {totalRemaining} <span className="text-xs font-normal text-content-secondary">prayers</span>
            </span>
          </div>
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
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 relative z-10 mb-6">
        {PRAYERS.map(({ key, label, shortName }) => {
          const item = itemMap.get(key) || {
            id: `qp_${key}`,
            prayerType: key,
            totalMissed: 0,
            completedCount: 0,
            remainingCount: 0,
            createdAt: '',
            updatedAt: '',
          };

          const isInline = inlineEditKey === key;

          return (
            <div
              key={key}
              className="p-4 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:border-white/[0.15] transition-all flex flex-col justify-between gap-3 relative"
            >
              <div>
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-bold text-white truncate capitalize">{label}</span>
                  {!isInline && (
                    <button
                      type="button"
                      onClick={() => handleStartInlineEdit(key, item.remainingCount)}
                      className="p-1 text-content-tertiary hover:text-amber-400 rounded-md hover:bg-white/[0.06] transition-colors"
                      title={`Edit ${shortName} remaining count directly`}
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {isInline ? (
                  <div className="mt-2 space-y-1.5">
                    <Input
                      type="number"
                      min="0"
                      value={inlineVal}
                      onChange={(e) => setInlineVal(e.target.value)}
                      autoFocus
                      className="text-lg font-mono font-bold text-amber-300 py-1"
                    />
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleSaveInlineEdit(key)}
                        className="flex-1 py-1 text-[11px] font-semibold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded border border-emerald-400/30"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setInlineEditKey(null)}
                        className="flex-1 py-1 text-[11px] bg-white/[0.05] text-content-secondary hover:text-white rounded"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="text-2xl font-extrabold font-mono text-amber-400 mt-1 flex items-baseline gap-1.5">
                      <span>{item.remainingCount}</span>
                      <span className="text-[10px] font-normal text-content-tertiary">left</span>
                    </div>
                    <span className="text-[10px] text-content-secondary block mt-0.5">
                      ({item.completedCount} made up)
                    </span>
                  </>
                )}
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
                    title="Add 5 missed prayers"
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

      {/* Qadha Solat Completion Calculator & Payoff Forecast */}
      <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 md:p-5 relative z-10 transition-all duration-300">
        <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center text-cyan-400">
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                Qadha Solat Payoff Calculator & Forecast
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-400/30">
                  Interactive Planner
                </span>
              </h4>
              <p className="text-[11px] text-content-secondary">
                Simulate how long it takes and see your estimated completion date based on daily makeup pace
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsCalculatorExpanded(!isCalculatorExpanded)}
            className="p-1.5 text-content-tertiary hover:text-white rounded-lg hover:bg-white/[0.06] transition-colors"
          >
            {isCalculatorExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {isCalculatorExpanded && (
          <div className="pt-4 space-y-5">
            {/* Pace Selector Controls */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs flex-wrap gap-2">
                <span className="font-semibold text-content-secondary flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-cyan-400" /> Daily Makeup Pace:
                </span>
                <span className="font-mono text-sm font-bold text-cyan-300">
                  {dailyPace} {dailyPace === 1 ? 'prayer' : 'prayers'} / day
                </span>
              </div>

              {/* Quick Presets */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => setDailyPace(1)}
                  className={`p-2.5 rounded-lg border text-left transition-all ${
                    dailyPace === 1
                      ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-200 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                      : 'bg-white/[0.03] border-white/[0.08] text-content-secondary hover:bg-white/[0.06]'
                  }`}
                >
                  <div className="text-xs font-bold text-white">1 Prayer / Day</div>
                  <div className="text-[10px] text-content-tertiary mt-0.5">Steady after any prayer</div>
                </button>

                <button
                  type="button"
                  onClick={() => setDailyPace(2)}
                  className={`p-2.5 rounded-lg border text-left transition-all ${
                    dailyPace === 2
                      ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-200 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                      : 'bg-white/[0.03] border-white/[0.08] text-content-secondary hover:bg-white/[0.06]'
                  }`}
                >
                  <div className="text-xs font-bold text-white">2 Prayers / Day</div>
                  <div className="text-[10px] text-content-tertiary mt-0.5">Subuh & Maghrib</div>
                </button>

                <button
                  type="button"
                  onClick={() => setDailyPace(5)}
                  className={`p-2.5 rounded-lg border text-left transition-all ${
                    dailyPace === 5
                      ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-200 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                      : 'bg-white/[0.03] border-white/[0.08] text-content-secondary hover:bg-white/[0.06]'
                  }`}
                >
                  <div className="text-xs font-bold text-white">5 Prayers / Day (1 Set)</div>
                  <div className="text-[10px] text-emerald-400/80 mt-0.5">1 extra after each fardhu</div>
                </button>

                <button
                  type="button"
                  onClick={() => setDailyPace(10)}
                  className={`p-2.5 rounded-lg border text-left transition-all ${
                    dailyPace === 10
                      ? 'bg-rose-500/20 border-rose-400/50 text-rose-200 shadow-[0_0_10px_rgba(244,63,94,0.2)]'
                      : 'bg-white/[0.03] border-white/[0.08] text-content-secondary hover:bg-white/[0.06]'
                  }`}
                >
                  <div className="text-xs font-bold text-white">10 Prayers / Day (2 Sets)</div>
                  <div className="text-[10px] text-rose-400/80 mt-0.5">2 extra after each fardhu</div>
                </button>
              </div>

              {/* Slider for fine adjustment */}
              <div className="pt-2 flex items-center gap-3">
                <input
                  type="range"
                  min="1"
                  max="20"
                  step="1"
                  value={dailyPace}
                  onChange={(e) => setDailyPace(parseInt(e.target.value, 10))}
                  className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
                <span className="font-mono text-xs text-content-secondary whitespace-nowrap min-w-[50px] text-right">
                  {dailyPace} / day
                </span>
              </div>
            </div>

            {/* Output Forecast Highlights */}
            {totalRemaining > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-xl border border-cyan-400/30 bg-cyan-500/10 flex flex-col justify-between">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-cyan-300">
                    Estimated Completion Date
                  </span>
                  <div className="text-lg font-bold text-white mt-1">
                    {estimate.formattedCompletionDate}
                  </div>
                  <span className="text-[11px] text-cyan-200/80 mt-1 flex items-center gap-1 font-mono">
                    <Calendar className="w-3 h-3 text-cyan-400" />
                    in ~{estimate.daysNeeded} days
                  </span>
                </div>

                <div className="p-4 rounded-xl border border-white/[0.08] bg-white/[0.03] flex flex-col justify-between">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-content-tertiary">
                    Duration Needed
                  </span>
                  <div className="text-lg font-bold font-mono text-amber-300 mt-1">
                    {estimate.durationText}
                  </div>
                  <span className="text-[11px] text-content-tertiary mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    at {dailyPace} prayers per day
                  </span>
                </div>

                <div className="p-4 rounded-xl border border-emerald-400/30 bg-emerald-500/10 flex flex-col justify-between">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-300">
                    Daily Commitment Routine
                  </span>
                  <div className="text-xs font-medium text-emerald-200 mt-1 leading-relaxed">
                    {dailyPace === 5
                      ? '✨ 1 makeup prayer after Subuh, Zohor, Asar, Maghrib, and Isyak.'
                      : dailyPace === 10
                      ? '⚡ 2 makeup prayers after each of the 5 daily fardhu prayers.'
                      : dailyPace === 1
                      ? '🌱 Perform just 1 makeup prayer anytime during the day.'
                      : `🎯 Perform ${dailyPace} makeup prayers spaced across your day.`}
                  </div>
                  <span className="text-[10px] text-emerald-300/70 mt-1 block">
                    Istiqamah is beloved by Allah
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-emerald-400/30 bg-emerald-500/10 text-center text-xs text-emerald-300">
                <Sparkles className="w-5 h-5 mx-auto mb-1 text-emerald-400" />
                All missed prayers are currently settled! Key in missed numbers above whenever you need to track more.
              </div>
            )}

            {/* Milestone Pace Comparison Cards */}
            {totalRemaining > 0 && (
              <div className="space-y-2 pt-2">
                <span className="text-[11px] font-semibold text-content-secondary uppercase tracking-wider block">
                  Pace Comparison Matrix ({totalRemaining} Total Prayers Remaining)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  {milestoneComparisons.map((m) => (
                    <div
                      key={m.prayersPerDay}
                      className={`p-3 rounded-lg border text-xs transition-all ${
                        dailyPace === m.prayersPerDay
                          ? 'border-cyan-400/50 bg-cyan-500/15'
                          : 'border-white/[0.06] bg-white/[0.02]'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold text-white">
                        <span>{m.paceLabel}</span>
                        <span className="text-cyan-300 font-mono">{m.prayersPerDay}/day</span>
                      </div>
                      <div className="mt-1 font-mono text-amber-300 font-semibold">
                        ~{m.daysNeeded} days
                      </div>
                      <div className="text-[10px] text-content-tertiary mt-0.5 truncate">
                        Finish: {m.formattedDate}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Target Date Reverse Estimator */}
            {totalRemaining > 0 && (
              <div className="p-3.5 rounded-xl border border-white/[0.08] bg-white/[0.02] space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
                  <Target className="w-3.5 h-3.5 text-amber-400" />
                  <span>Target Date Goal Planner (Reverse Calculation)</span>
                </div>
                <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
                  <div className="space-y-1 min-w-[200px]">
                    <label className="text-[10px] text-content-tertiary">Select Desired Target Finish Date:</label>
                    <Input
                      type="date"
                      value={targetDateInput}
                      onChange={(e) => setTargetDateInput(e.target.value)}
                      className="py-1 text-xs"
                    />
                  </div>

                  {targetDateResult && (
                    <div className="flex-1 p-2.5 rounded-lg bg-amber-500/10 border border-amber-400/25 text-xs text-amber-200">
                      To complete all {totalRemaining} missed prayers in {targetDateResult.daysAvailable} days,
                      you need to make up{' '}
                      <strong className="text-amber-300 font-mono text-sm underline">
                        ~{targetDateResult.requiredPrayersPerDay} prayers per day
                      </strong>.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Key In Missed Prayers (Direct Edit / Setup Modal) */}
      <Modal
        isOpen={isKeyInModalOpen}
        onClose={() => setIsKeyInModalOpen(false)}
        title="Key In Missed Prayers (Qadha Owed)"
        description="Directly input how many missed prayers remain for each prayer time, or use the quick bulk batch setter."
        maxWidth="md"
      >
        <form onSubmit={handleSaveKeyInModal} className="space-y-4 pt-2">
          {/* Quick Bulk Batch Setter */}
          <div className="p-3.5 rounded-xl border border-cyan-400/30 bg-cyan-500/10 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Quick Bulk Presets (Sets Same Days to All 5 Prayers)
              </span>
            </div>
            <p className="text-[11px] text-cyan-200/80 leading-relaxed">
              If you missed prayers for a certain duration, click a preset below to instantly fill all 5 prayer times:
            </p>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => handleApplyBatchDays(7)}
                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-mono font-medium border border-white/10 transition-colors"
              >
                1 Week (7d)
              </button>
              <button
                type="button"
                onClick={() => handleApplyBatchDays(30)}
                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-mono font-medium border border-white/10 transition-colors"
              >
                1 Month (30d)
              </button>
              <button
                type="button"
                onClick={() => handleApplyBatchDays(90)}
                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-mono font-medium border border-white/10 transition-colors"
              >
                3 Months (90d)
              </button>
              <button
                type="button"
                onClick={() => handleApplyBatchDays(180)}
                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-mono font-medium border border-white/10 transition-colors"
              >
                6 Months (180d)
              </button>
              <button
                type="button"
                onClick={() => handleApplyBatchDays(365)}
                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-mono font-medium border border-white/10 transition-colors"
              >
                1 Year (365d)
              </button>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <span className="text-[11px] text-content-secondary">Custom Days to All 5:</span>
              <Input
                type="number"
                min="0"
                placeholder="e.g. 45"
                value={batchDaysInput}
                onChange={(e) => {
                  const val = e.target.value;
                  setBatchDaysInput(val);
                  if (val !== '') {
                    handleApplyBatchDays(parseInt(val, 10) || 0);
                  }
                }}
                className="w-28 py-1 text-xs"
              />
            </div>
          </div>

          {/* Individual 5 Prayers Inputs */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-content-secondary">
              Remaining Missed Prayers Count (Key In Individually):
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-white flex items-center justify-between">
                  <span>Fajr / Subuh (2 Rak'ahs)</span>
                  <span className="text-[10px] text-content-tertiary">Morning</span>
                </label>
                <Input
                  type="number"
                  min="0"
                  value={inputSubuh}
                  onChange={(e) => setInputSubuh(e.target.value)}
                  required
                  className="font-mono text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-white flex items-center justify-between">
                  <span>Dhuhr / Zohor (4 Rak'ahs)</span>
                  <span className="text-[10px] text-content-tertiary">Midday</span>
                </label>
                <Input
                  type="number"
                  min="0"
                  value={inputZohor}
                  onChange={(e) => setInputZohor(e.target.value)}
                  required
                  className="font-mono text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-white flex items-center justify-between">
                  <span>Asr / Asar (4 Rak'ahs)</span>
                  <span className="text-[10px] text-content-tertiary">Afternoon</span>
                </label>
                <Input
                  type="number"
                  min="0"
                  value={inputAsar}
                  onChange={(e) => setInputAsar(e.target.value)}
                  required
                  className="font-mono text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-white flex items-center justify-between">
                  <span>Maghrib (3 Rak'ahs)</span>
                  <span className="text-[10px] text-content-tertiary">Sunset</span>
                </label>
                <Input
                  type="number"
                  min="0"
                  value={inputMaghrib}
                  onChange={(e) => setInputMaghrib(e.target.value)}
                  required
                  className="font-mono text-sm"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs font-medium text-white flex items-center justify-between">
                  <span>Isha / Isyak (4 Rak'ahs)</span>
                  <span className="text-[10px] text-content-tertiary">Night</span>
                </label>
                <Input
                  type="number"
                  min="0"
                  value={inputIsyak}
                  onChange={(e) => setInputIsyak(e.target.value)}
                  required
                  className="font-mono text-sm"
                />
              </div>
            </div>
          </div>

          {/* Total Preview */}
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-between text-xs">
            <span className="text-content-secondary">Total Missed Across All 5:</span>
            <span className="text-base font-bold font-mono text-amber-400">
              {(parseInt(inputSubuh, 10) || 0) +
                (parseInt(inputZohor, 10) || 0) +
                (parseInt(inputAsar, 10) || 0) +
                (parseInt(inputMaghrib, 10) || 0) +
                (parseInt(inputIsyak, 10) || 0)}{' '}
              prayers
            </span>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border-subtle">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsKeyInModalOpen(false)}
              disabled={isSavingKeyIn}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isSavingKeyIn}>
              {isSavingKeyIn ? 'Saving Counts...' : 'Save Missed Prayers'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
