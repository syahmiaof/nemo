import React, { useState, useEffect } from 'react';
import {
  Dumbbell,
  CheckCircle2,
  Calendar,
  RotateCcw,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import type { WorkoutLog } from '@/domain/types';

interface DayWorkoutState {
  completed: boolean;
  remark: string;
}

interface WeeklyWorkoutCardProps {
  todayStr: string;
  logs?: WorkoutLog[];
  onLogWorkout?: (entry: Omit<WorkoutLog, 'id'> & { id?: string }) => Promise<void>;
  onDeleteWorkout?: (id: string) => Promise<void>;
  onWeeklyCountChange?: (completedCount: number, totalDays: number) => void;
}

const STORAGE_KEY = 'nemo_workout_7days_v1';

const DAY_NAMES_MY = ['Ahad', 'Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu'];
const MONTH_NAMES_MY = [
  'Jan', 'Feb', 'Mac', 'Apr', 'Mei', 'Jun',
  'Jul', 'Ogo', 'Sep', 'Okt', 'Nov', 'Dis'
];

const PRESET_REMARKS = [
  'Push Day',
  'Pull Day',
  'Leg Day',
  'Upper Body',
  'Cardio / Jogging',
  'Rest Day',
];

// Calculate Monday to Sunday of the week for given date
function getWeekDays(referenceDate: Date): Date[] {
  const date = new Date(referenceDate);
  const day = date.getDay();
  // In JS, 0 is Sunday. We want Monday as day 1, Sunday as day 7.
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(date.setDate(diff));

  const week: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const nextDay = new Date(monday);
    nextDay.setDate(monday.getDate() + i);
    week.push(nextDay);
  }
  return week;
}

function formatDateKey(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const WeeklyWorkoutCard: React.FC<WeeklyWorkoutCardProps> = ({
  todayStr,
  onLogWorkout,
  onDeleteWorkout,
  onWeeklyCountChange,
}) => {
  const [currentWeekRef, setCurrentWeekRef] = useState<Date>(() => new Date());
  const [workoutRecords, setWorkoutRecords] = useState<Record<string, DayWorkoutState>>(() => {
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) return JSON.parse(saved);
      }
    } catch {
      // ignore
    }
    return {};
  });

  const [editingDayDate, setEditingDayDate] = useState<string | null>(null);

  // Persist workout records to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(workoutRecords));
    } catch {
      // ignore
    }
  }, [workoutRecords]);

  const weekDates = getWeekDays(currentWeekRef);
  const weekStart = weekDates[0];
  const weekEnd = weekDates[6];

  // Completed count for currently displayed week
  const completedInCurrentWeek = weekDates.filter((d) => {
    const key = formatDateKey(d);
    return workoutRecords[key]?.completed;
  }).length;

  useEffect(() => {
    onWeeklyCountChange?.(completedInCurrentWeek, 7);
  }, [completedInCurrentWeek, onWeeklyCountChange]);

  // Toggle tick for a day
  const handleToggleDay = async (dateKey: string) => {
    const current = workoutRecords[dateKey] || { completed: false, remark: '' };
    const nextCompleted = !current.completed;
    const defaultRemark = nextCompleted && !current.remark ? 'Workout' : current.remark;

    setWorkoutRecords((prev) => ({
      ...prev,
      [dateKey]: {
        completed: nextCompleted,
        remark: defaultRemark,
      },
    }));

    // Sync with Dexie workoutLogs if handlers provided
    if (nextCompleted && onLogWorkout) {
      await onLogWorkout({
        id: `wkt_${dateKey}`,
        date: dateKey,
        title: defaultRemark || 'Workout',
        type: 'strength',
        durationMinutes: 45,
        completedAt: new Date().toISOString(),
      });
    } else if (!nextCompleted && onDeleteWorkout) {
      await onDeleteWorkout(`wkt_${dateKey}`);
    }
  };

  // Update remark for a day
  const handleUpdateRemark = async (dateKey: string, remark: string) => {
    const current = workoutRecords[dateKey] || { completed: false, remark: '' };
    setWorkoutRecords((prev) => ({
      ...prev,
      [dateKey]: {
        ...current,
        remark,
      },
    }));

    if (current.completed && onLogWorkout) {
      await onLogWorkout({
        id: `wkt_${dateKey}`,
        date: dateKey,
        title: remark || 'Workout',
        type: 'strength',
        durationMinutes: 45,
        completedAt: new Date().toISOString(),
      });
    }
  };

  // Navigate weeks
  const handlePrevWeek = () => {
    const prev = new Date(currentWeekRef);
    prev.setDate(prev.getDate() - 7);
    setCurrentWeekRef(prev);
  };

  const handleNextWeek = () => {
    const next = new Date(currentWeekRef);
    next.setDate(next.getDate() + 7);
    setCurrentWeekRef(next);
  };

  const handleCurrentWeek = () => {
    setCurrentWeekRef(new Date());
  };

  // Reset this week's records
  const handleResetWeek = async () => {
    if (!window.confirm('Reset semua rekod workout minggu ini?')) return;
    const updated = { ...workoutRecords };
    for (const d of weekDates) {
      const key = formatDateKey(d);
      delete updated[key];
      if (onDeleteWorkout) {
        await onDeleteWorkout(`wkt_${key}`);
      }
    }
    setWorkoutRecords(updated);
  };

  const isCurrentWeek = weekDates.some((d) => formatDateKey(d) === todayStr);

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#0c1527]/85 backdrop-blur-xl p-5 md:p-6 shadow-2xl relative overflow-hidden transition-all duration-300">
      {/* Background ambient water/fire glow */}
      <div className="absolute -top-24 -right-24 w-72 h-72 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 relative z-10 border-b border-white/[0.08] pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/15 border border-orange-400/30 flex items-center justify-center text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.2)]">
            <Dumbbell className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base md:text-lg font-bold text-content-primary flex items-center gap-2">
              Jejak Workout 7 Hari
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30">
                {completedInCurrentWeek}/7 Hari Selesai
              </span>
            </h3>
            <p className="text-xs text-content-secondary mt-0.5">
              Tick hari latihan dan catat nota ringkas (cth: Push Day, Pull Day, Rest).
            </p>
          </div>
        </div>

        {/* Week Navigator */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <button
            type="button"
            onClick={handlePrevWeek}
            className="p-1.5 rounded-lg border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] text-content-secondary hover:text-content-primary transition-colors cursor-pointer"
            title="Minggu Sebelumnya"
            aria-label="Minggu Sebelumnya"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleCurrentWeek}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer flex items-center gap-1.5 ${
              isCurrentWeek
                ? 'bg-orange-500/15 border-orange-400/30 text-orange-200 font-semibold'
                : 'border-white/10 bg-white/[0.03] text-content-secondary hover:text-content-primary'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>
              {weekStart.getDate()} {MONTH_NAMES_MY[weekStart.getMonth()]} -{' '}
              {weekEnd.getDate()} {MONTH_NAMES_MY[weekEnd.getMonth()]}
            </span>
          </button>

          <button
            type="button"
            onClick={handleNextWeek}
            className="p-1.5 rounded-lg border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] text-content-secondary hover:text-content-primary transition-colors cursor-pointer"
            title="Minggu Seterusnya"
            aria-label="Minggu Seterusnya"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {completedInCurrentWeek > 0 && (
            <button
              type="button"
              onClick={handleResetWeek}
              className="p-1.5 rounded-lg border border-white/10 bg-white/[0.03] hover:bg-rose-500/15 hover:border-rose-500/30 text-content-secondary hover:text-rose-300 transition-colors ml-1 cursor-pointer"
              title="Reset minggu ini"
              aria-label="Reset minggu ini"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 7-DAY WORKOUT STRIP */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3.5 relative z-10">
        {weekDates.map((dateObj) => {
          const dateKey = formatDateKey(dateObj);
          const isToday = dateKey === todayStr;
          const dayName = DAY_NAMES_MY[dateObj.getDay()];
          const dayDateFormatted = `${dateObj.getDate()} ${MONTH_NAMES_MY[dateObj.getMonth()]}`;
          const record = workoutRecords[dateKey] || { completed: false, remark: '' };
          const isEditing = editingDayDate === dateKey;

          return (
            <div
              key={dateKey}
              className={`rounded-2xl border p-4 flex flex-col justify-between transition-all duration-300 ${
                record.completed
                  ? 'bg-gradient-to-b from-[#14263f]/90 to-[#0b1627]/95 border-emerald-400/40 shadow-[0_0_20px_rgba(16,185,129,0.15)]'
                  : isToday
                    ? 'bg-white/[0.04] border-orange-400/40 shadow-[0_0_15px_rgba(249,115,22,0.12)]'
                    : 'bg-white/[0.02] border-white/[0.08] hover:border-white/15'
              }`}
            >
              {/* Day Header */}
              <div className="flex items-start justify-between gap-1 mb-3">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-content-primary">
                    {dayName}
                  </div>
                  <div className="text-[11px] font-mono text-content-secondary mt-0.5">
                    {dayDateFormatted}
                  </div>
                </div>

                {isToday && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-orange-500/20 text-orange-300 border border-orange-400/30">
                    Hari Ini
                  </span>
                )}
              </div>

              {/* Central Tick Button */}
              <div className="my-3 flex flex-col items-center justify-center">
                <button
                  type="button"
                  onClick={() => handleToggleDay(dateKey)}
                  className={`w-14 h-14 rounded-2xl border flex items-center justify-center transition-all active:scale-95 cursor-pointer ${
                    record.completed
                      ? 'bg-emerald-500/25 border-emerald-400/60 text-emerald-300 shadow-[0_0_18px_rgba(16,185,129,0.3)]'
                      : 'bg-white/[0.04] border-white/10 hover:border-orange-400/40 text-slate-500 hover:text-orange-300'
                  }`}
                  title={record.completed ? 'Klik untuk nyah-tanda' : 'Klik untuk tanda selesai'}
                  aria-label={`Tick workout ${dayName}`}
                >
                  {record.completed ? (
                    <CheckCircle2 className="w-7 h-7 stroke-[2.5]" />
                  ) : (
                    <div className="w-6 h-6 rounded-full border-2 border-slate-500 group-hover:border-orange-400 transition-colors" />
                  )}
                </button>
                <span
                  className={`text-[11px] font-semibold mt-1.5 ${
                    record.completed ? 'text-emerald-300' : 'text-content-secondary'
                  }`}
                >
                  {record.completed ? 'Selesai' : 'Belum'}
                </span>
              </div>

              {/* Inline Remark */}
              <div className="mt-2 pt-2.5 border-t border-white/[0.06]">
                {isEditing ? (
                  <div className="space-y-1.5">
                    <input
                      type="text"
                      value={record.remark}
                      onChange={(e) => handleUpdateRemark(dateKey, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === 'Escape') setEditingDayDate(null);
                      }}
                      onBlur={() => setEditingDayDate(null)}
                      autoFocus
                      placeholder="Cth: Push Day"
                      className="w-full text-xs bg-white/10 border border-orange-400/40 rounded px-2 py-1 text-content-primary focus:outline-none focus:ring-1 focus:ring-orange-400"
                    />

                    {/* Quick remark presets */}
                    <div className="flex flex-wrap gap-1">
                      {PRESET_REMARKS.map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault(); // prevent blur
                            handleUpdateRemark(dateKey, preset);
                            setEditingDayDate(null);
                          }}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 hover:bg-orange-500/20 text-content-secondary hover:text-orange-200 transition-colors"
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => setEditingDayDate(dateKey)}
                    className="group flex items-center justify-between p-1.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.05] hover:border-white/15 transition-all cursor-pointer min-h-[30px]"
                    title="Klik untuk ubah catatan ringkas"
                  >
                    <span
                      className={`text-xs truncate font-medium ${
                        record.remark
                          ? record.completed
                            ? 'text-emerald-200'
                            : 'text-content-primary'
                          : 'text-content-secondary/50 italic'
                      }`}
                    >
                      {record.remark || '+ Catat cth: Push'}
                    </span>
                    <Sparkles className="w-3 h-3 text-content-secondary group-hover:text-orange-300 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-1" />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
