import React from 'react';
import {
  DailyPrayerRecord,
  DailySunnahPrayers,
  IbadahDailyLog,
  PrayerStatus,
  PrayerTimeName,
} from '@/domain/types';
import {
  CheckCircle2,
  Circle,
  Clock,
  Sparkles,
  Users,
  User,
  AlertCircle,
  Sun,
  Moon,
  Sunrise,
  Sunset,
} from 'lucide-react';

interface PrayerTrackerCardProps {
  currentLog?: IbadahDailyLog;
  onUpdatePrayers: (prayers: Record<PrayerTimeName, DailyPrayerRecord>) => Promise<void>;
  onUpdateSunnah: (sunnah: DailySunnahPrayers) => Promise<void>;
}

const PRAYER_NAMES: { key: PrayerTimeName; label: string; icon: React.ElementType }[] = [
  { key: 'subuh', label: 'Subuh', icon: Sunrise },
  { key: 'zohor', label: 'Zohor', icon: Sun },
  { key: 'asar', label: 'Asar', icon: Sun },
  { key: 'maghrib', label: 'Maghrib', icon: Sunset },
  { key: 'isyak', label: 'Isyak', icon: Moon },
];

const STATUS_CONFIG: Record<
  PrayerStatus,
  { label: string; icon: React.ElementType; color: string; border: string; bg: string }
> = {
  congregation: {
    label: 'Congregational',
    icon: Users,
    color: 'text-emerald-300',
    border: 'border-emerald-400/35',
    bg: 'bg-emerald-500/20',
  },
  on_time: {
    label: 'Early / On-Time',
    icon: Clock,
    color: 'text-teal-300',
    border: 'border-teal-400/35',
    bg: 'bg-teal-500/20',
  },
  alone: {
    label: 'Individual',
    icon: User,
    color: 'text-cyan-300',
    border: 'border-cyan-400/35',
    bg: 'bg-cyan-500/15',
  },
  qadha: {
    label: 'Qadha / Makeup',
    icon: AlertCircle,
    color: 'text-amber-300',
    border: 'border-amber-400/35',
    bg: 'bg-amber-500/15',
  },
  missed: {
    label: 'Missed',
    icon: AlertCircle,
    color: 'text-rose-300',
    border: 'border-rose-400/35',
    bg: 'bg-rose-500/15',
  },
  excused: {
    label: 'Excused',
    icon: Moon,
    color: 'text-purple-300',
    border: 'border-purple-400/35',
    bg: 'bg-purple-500/15',
  },
};

export const PrayerTrackerCard: React.FC<PrayerTrackerCardProps> = ({
  currentLog,
  onUpdatePrayers,
  onUpdateSunnah,
}) => {
  const prayers = currentLog?.prayers || ({} as Record<PrayerTimeName, DailyPrayerRecord>);
  const sunnah = currentLog?.sunnahPrayers || {};

  const completedFardhuCount = PRAYER_NAMES.filter(
    (p) => prayers[p.key]?.completed
  ).length;

  const handleTogglePrayer = async (key: PrayerTimeName) => {
    const existing = prayers[key] || { completed: false, status: 'on_time' };
    const nextCompleted = !existing.completed;
    const updatedPrayers: Record<PrayerTimeName, DailyPrayerRecord> = {
      ...prayers,
      [key]: {
        completed: nextCompleted,
        status: nextCompleted ? (existing.status || 'on_time') : 'missed',
        timestamp: nextCompleted ? new Date().toISOString() : undefined,
      },
    };
    await onUpdatePrayers(updatedPrayers);
  };

  const handleChangeStatus = async (key: PrayerTimeName, newStatus: PrayerStatus) => {
    const updatedPrayers: Record<PrayerTimeName, DailyPrayerRecord> = {
      ...prayers,
      [key]: {
        completed: true,
        status: newStatus,
        timestamp: prayers[key]?.timestamp || new Date().toISOString(),
      },
    };
    await onUpdatePrayers(updatedPrayers);
  };

  const handleToggleSunnah = async (key: keyof DailySunnahPrayers) => {
    const updatedSunnah: DailySunnahPrayers = {
      ...sunnah,
      [key]: !sunnah[key],
    };
    await onUpdateSunnah(updatedSunnah);
  };

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#0c1527]/80 backdrop-blur-xl p-5 md:p-6 shadow-2xl relative overflow-hidden transition-all duration-300">
      {/* Background ambient gradient */}
      <div className="absolute -top-16 -right-16 w-56 h-56 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.25)]">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-content-primary flex items-center gap-2">
              Fardhu & Sunnah Prayers
              {completedFardhuCount === 5 && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <Sparkles className="w-3 h-3" /> All 5 Completed!
                </span>
              )}
            </h3>
            <p className="text-xs text-content-secondary">
              Observe obligatory prayers on time and enrich your routine with daily Sunnah acts
            </p>
          </div>
        </div>

        {/* Mini Completion Badge */}
        <div className="px-3 py-1.5 rounded-xl border border-white/[0.08] bg-white/[0.03] flex items-center gap-2 text-xs">
          <span className="text-content-tertiary">Today&apos;s Progress:</span>
          <span className="font-mono font-bold text-emerald-400 text-sm">
            {completedFardhuCount} / 5
          </span>
        </div>
      </div>

      {/* Fardhu Prayers 5-Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5 mb-6 relative z-10">
        {PRAYER_NAMES.map(({ key, label, icon: Icon }) => {
          const record = prayers[key];
          const isDone = Boolean(record?.completed);
          const status = record?.status || 'on_time';

          return (
            <div
              key={key}
              className={`p-3.5 rounded-xl border transition-all duration-200 flex flex-col justify-between gap-3 ${
                isDone
                  ? 'bg-emerald-500/[0.08] border-emerald-400/30 shadow-[0_0_15px_rgba(16,185,129,0.12)]'
                  : 'bg-white/[0.03] border-white/[0.08] hover:border-white/[0.15]'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Icon className={`w-4 h-4 ${isDone ? 'text-emerald-400' : 'text-content-tertiary'}`} />
                  <span className={`text-xs font-bold ${isDone ? 'text-white' : 'text-content-secondary'}`}>
                    {label}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleTogglePrayer(key)}
                  className="p-1 text-content-tertiary hover:text-emerald-400 transition-colors"
                  title={isDone ? 'Mark as incomplete' : 'Mark as complete'}
                >
                  {isDone ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <Circle className="w-5 h-5 text-content-tertiary hover:text-white" />
                  )}
                </button>
              </div>

              {/* Status Picker if Completed */}
              {isDone ? (
                <div className="space-y-1">
                  <span className="text-[10px] text-content-tertiary block">Performance / Mode:</span>
                  <div className="flex items-center gap-1 flex-wrap">
                    {(['congregation', 'on_time', 'alone', 'qadha'] as PrayerStatus[]).map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => handleChangeStatus(key, st)}
                        className={`text-[10px] px-2 py-0.5 rounded-md border font-medium transition-all ${
                          status === st
                            ? `${STATUS_CONFIG[st].bg} ${STATUS_CONFIG[st].color} ${STATUS_CONFIG[st].border}`
                            : 'bg-white/[0.02] text-content-tertiary border-transparent hover:text-white'
                        }`}
                      >
                        {STATUS_CONFIG[st].label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <span className="text-[10px] text-content-tertiary italic">
                  Not completed yet
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Sunnah Prayers Checklist */}
      <div className="pt-4 border-t border-white/[0.06] relative z-10">
        <span className="text-xs font-semibold text-content-primary mb-3 flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          Daily Sunnah Prayers
        </span>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {[
            { key: 'dhuha' as const, label: "Dhuha Prayer (2-8 rak'ahs)" },
            { key: 'tahajjud' as const, label: 'Tahajjud / Night Vigil' },
            { key: 'witir' as const, label: "Witr Prayer (1-3 rak'ahs)" },
            { key: 'rawatib' as const, label: 'Sunnah Rawatib (Pre/Post)' },
          ].map(({ key, label }) => {
            const isChecked = Boolean(sunnah[key]);
            return (
              <button
                key={key}
                type="button"
                onClick={() => handleToggleSunnah(key)}
                className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                  isChecked
                    ? 'bg-amber-500/15 border-amber-400/35 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.15)]'
                    : 'bg-white/[0.02] border-white/[0.06] text-content-secondary hover:bg-white/[0.05]'
                }`}
              >
                {isChecked ? (
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                ) : (
                  <Circle className="w-4 h-4 text-content-tertiary shrink-0" />
                )}
                <span className="text-xs font-medium truncate">{label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
