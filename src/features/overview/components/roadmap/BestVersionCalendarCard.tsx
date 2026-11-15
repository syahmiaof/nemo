import React, { useMemo } from 'react';
import { CheckCircle2 } from 'lucide-react';

interface BestVersionCalendarCardProps {
  year: number;
  month: number;
  monthName: string;
  tickedDays: number[];
  onToggleDay: (day: number) => void;
}

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export const BestVersionCalendarCard: React.FC<BestVersionCalendarCardProps> = ({
  year,
  month,
  monthName,
  tickedDays,
  onToggleDay,
}) => {
  const currentCalendarDate = new Date();
  const isCurrentMonth =
    year === currentCalendarDate.getFullYear() && month === currentCalendarDate.getMonth() + 1;
  const todayDay = isCurrentMonth ? currentCalendarDate.getDate() : -1;

  // Number of days in this month
  const totalDays = useMemo(() => {
    return new Date(year, month, 0).getDate();
  }, [year, month]);

  // First day offset (0 = Monday, ..., 6 = Sunday)
  const startDayOffset = useMemo(() => {
    const jsDay = new Date(year, month - 1, 1).getDay();
    return (jsDay + 6) % 7;
  }, [year, month]);

  const tickedSet = useMemo(() => new Set(tickedDays), [tickedDays]);

  const percentage = Math.round((tickedDays.length / totalDays) * 100);

  return (
    <div className="glass-panel p-5 sm:p-6 rounded-3xl border border-white/10 flex flex-col justify-between relative overflow-hidden">
      {/* Ambient Corner Glow */}
      <div className="absolute top-0 left-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div>
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-400/20 flex items-center justify-center text-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.15)] shrink-0">
              <CheckCircle2 size={19} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                I Be My Best Version
              </h3>
              <p className="text-xs text-white/50">
                Tick tarikh untuk rekod konsistensi harian anda ({monthName} {year})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 font-mono text-xs font-semibold">
              {tickedDays.length} / {totalDays} Hari ({percentage}%)
            </span>
          </div>
        </div>

        {/* Circular Calendar Grid */}
        <div className="p-3 sm:p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 text-center">
            {WEEKDAYS.map((wd, i) => (
              <span
                key={i}
                className="text-[11px] font-mono font-medium text-white/40 uppercase py-1"
              >
                {wd}
              </span>
            ))}
          </div>

          {/* Calendar Day Circles */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2 justify-items-center">
            {/* Empty offset padding for days before the 1st */}
            {Array.from({ length: startDayOffset }).map((_, i) => (
              <div key={`offset-${i}`} className="w-8 h-8 sm:w-9 sm:h-9" />
            ))}

            {/* Actual day buttons */}
            {Array.from({ length: totalDays }, (_, i) => i + 1).map((day) => {
              const isTicked = tickedSet.has(day);
              const isToday = day === todayDay;

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => onToggleDay(day)}
                  title={`Hari ${day} ${monthName} ${year} - ${isTicked ? 'Ticked (Klik untuk batal)' : 'Klik untuk tick'}`}
                  aria-pressed={isTicked}
                  className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs sm:text-sm font-mono transition-all select-none ${
                    isTicked
                      ? 'bg-emerald-500 text-slate-950 font-bold shadow-[0_0_12px_rgba(52,211,153,0.4)] scale-105 active:scale-95'
                      : 'bg-white/[0.03] text-white/70 hover:bg-white/10 hover:text-white border border-white/10 hover:border-emerald-500/40 active:scale-95'
                  } ${
                    isToday && !isTicked
                      ? 'ring-2 ring-emerald-400/80 ring-offset-2 ring-offset-slate-900 font-bold text-emerald-400'
                      : ''
                  } ${
                    isToday && isTicked
                      ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900'
                      : ''
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Progress & Bottom Bar */}
      <div className="mt-4 pt-3 border-t border-white/[0.06] flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs text-white/50">
          <span>Kemajuan Bulan Ini</span>
          <span className="font-mono text-emerald-400">{percentage}% tercapai</span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(52,211,153,0.5)]"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
};
