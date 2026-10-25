import React, { useState } from 'react';
import { IbadahDailyLog } from '@/domain/types';
import { Heart, RotateCcw, Plus, Sparkles, CheckCircle2, Circle, Sun } from 'lucide-react';

interface DhikrSedekahCardProps {
  currentLog?: IbadahDailyLog;
  onUpdateDhikr: (count: number) => Promise<void>;
  onToggleSedekah: (done: boolean) => Promise<void>;
}

export const DhikrSedekahCard: React.FC<DhikrSedekahCardProps> = ({
  currentLog,
  onUpdateDhikr,
  onToggleSedekah,
}) => {
  const [dhikrCount, setDhikrCount] = useState(currentLog?.dhikrCount || 0);
  const [targetGoal, setTargetGoal] = useState<number>(33);
  const sedekahDone = Boolean(currentLog?.sedekahDone);

  React.useEffect(() => {
    if (currentLog) {
      setDhikrCount(currentLog.dhikrCount || 0);
    }
  }, [currentLog?.dhikrCount]);

  const handleIncrement = async (step = 1) => {
    const next = dhikrCount + step;
    setDhikrCount(next);
    await onUpdateDhikr(next);

    // Optional haptic vibration on mobile
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(15);
      } catch {}
    }
  };

  const handleReset = async () => {
    setDhikrCount(0);
    await onUpdateDhikr(0);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Digital Tasbih Counter Card */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#0c1527]/80 backdrop-blur-xl p-5 md:p-6 shadow-2xl relative overflow-hidden transition-all duration-300 flex flex-col justify-between">
        {/* Ambient lighting */}
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white tracking-tight">Digital Tasbih Counter</h4>
                <p className="text-[11px] text-content-tertiary">SubhanAllah • Alhamdulillah • Allahu Akbar</p>
              </div>
            </div>

            {/* Target Select */}
            <div className="flex items-center gap-1">
              {[33, 100].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTargetGoal(t)}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-semibold transition-all ${
                    targetGoal === t
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/35'
                      : 'bg-white/[0.03] text-content-tertiary hover:text-white'
                  }`}
                >
                  {t}x
                </button>
              ))}
            </div>
          </div>

          {/* Big Digital Readout & Big Tap Button */}
          <div className="py-4 text-center">
            <div className="text-5xl font-black font-mono tracking-tight text-emerald-400 drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]">
              {dhikrCount}
            </div>
            <span className="text-[11px] text-content-tertiary block mt-1">
              Target: {targetGoal}x ({Math.floor(dhikrCount / targetGoal)} {Math.floor(dhikrCount / targetGoal) === 1 ? 'round' : 'rounds'} completed)
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleIncrement(1)}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm shadow-[0_0_15px_rgba(16,185,129,0.3)] active:scale-98 transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Count (+1)</span>
            </button>

            <button
              type="button"
              onClick={() => handleIncrement(10)}
              className="px-3.5 py-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-content-primary text-xs font-semibold active:scale-95 transition-all"
              title="Add 10x"
            >
              +10
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] text-content-tertiary hover:text-rose-400 active:scale-95 transition-all"
              title="Reset tasbih counter"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Sedekah Subuh & Amalan Harian Card */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#0c1527]/80 backdrop-blur-xl p-5 md:p-6 shadow-2xl relative overflow-hidden transition-all duration-300 flex flex-col justify-between">
        {/* Ambient lighting */}
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <Sun className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white tracking-tight">Dawn Charity (Sedekah Subuh)</h4>
              <p className="text-[11px] text-content-tertiary">The angels&apos; prayer every morning for those who spend</p>
            </div>
          </div>

          <p className="text-xs text-content-secondary leading-relaxed bg-white/[0.02] border border-white/[0.05] p-3 rounded-xl italic">
            &ldquo;There is not a day upon which servants wake in the morning but that two angels descend. One says: O Allah, give to him who spends in charity a compensation...&rdquo;
            <span className="block text-[10px] text-amber-400/90 font-medium not-italic mt-1">
              — Sahih Al-Bukhari &amp; Muslim
            </span>
          </p>

          <button
            type="button"
            onClick={() => onToggleSedekah(!sedekahDone)}
            className={`w-full p-4 rounded-xl border flex items-center justify-between transition-all ${
              sedekahDone
                ? 'bg-emerald-500/15 border-emerald-400/35 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                : 'bg-white/[0.03] border-white/[0.08] text-content-secondary hover:border-amber-400/30'
            }`}
          >
            <div className="flex items-center gap-3">
              {sedekahDone ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : (
                <Circle className="w-5 h-5 text-content-tertiary shrink-0" />
              )}
              <div className="text-left">
                <span className={`text-xs font-bold block ${sedekahDone ? 'text-emerald-300' : 'text-white'}`}>
                  Today&apos;s Dawn Charity
                </span>
                <span className="text-[11px] text-content-tertiary block mt-0.5">
                  {sedekahDone ? 'Alhamdulillah, fulfilled for today!' : 'Physical coin box or online QR donation'}
                </span>
              </div>
            </div>

            <Heart className={`w-5 h-5 ${sedekahDone ? 'text-emerald-400 fill-emerald-400' : 'text-content-tertiary'}`} />
          </button>
        </div>
      </div>
    </div>
  );
};
