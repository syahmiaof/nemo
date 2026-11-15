import React, { useState, useEffect } from 'react';
import {
  Compass,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Target,
  Save,
  RotateCcw,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

interface MonthlyFocusCardProps {
  year: number;
  month: number;
  monthName: string;
  achievedText: string;
  wantAchieveText: string;
  onSave: (data: { achievedText: string; wantAchieveText: string }) => Promise<void>;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onResetToCurrentMonth: () => void;
  isCurrentMonth: boolean;
}

export const MonthlyFocusCard: React.FC<MonthlyFocusCardProps> = ({
  year,
  month,
  monthName,
  achievedText,
  wantAchieveText,
  onSave,
  onPrevMonth,
  onNextMonth,
  onResetToCurrentMonth,
  isCurrentMonth,
}) => {
  const [achievedInput, setAchievedInput] = useState(achievedText);
  const [wantInput, setWantInput] = useState(wantAchieveText);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const { success, error } = useToast();

  // Synchronize inputs when year or month changes
  useEffect(() => {
    setAchievedInput(achievedText);
    setWantInput(wantAchieveText);
    setIsDirty(false);
  }, [year, month, achievedText, wantAchieveText]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({
        achievedText: achievedInput,
        wantAchieveText: wantInput,
      });
      setIsDirty(false);
      success('Fokus Bulanan Disimpan', `Rekod fokus untuk ${monthName} ${year} telah disimpan.`);
    } catch (err) {
      error('Gagal Menyimpan', err instanceof Error ? err.message : 'Sila cuba lagi.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="glass-panel p-5 sm:p-7 rounded-3xl border border-white/10 relative overflow-hidden shadow-2xl">
      {/* Ambient Glows */}
      <div className="absolute top-0 right-1/4 w-72 h-72 bg-accent-mint/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header: Title and Month Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 sm:pb-5 border-b border-white/[0.08] relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-accent-mint/10 border border-accent-mint/25 flex items-center justify-center text-accent-mint shadow-[0_0_16px_rgba(52,211,153,0.15)] shrink-0">
            <Compass size={22} />
          </div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white">
              Monthly Focus
            </h2>
            {isCurrentMonth ? (
              <span className="text-[11px] font-mono font-medium px-2.5 py-0.5 rounded-full bg-accent-mint/15 text-accent-mint border border-accent-mint/30">
                Bulan Semasa
              </span>
            ) : (
              <button
                type="button"
                onClick={onResetToCurrentMonth}
                className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-white/[0.06] hover:bg-white/10 text-white/70 hover:text-white border border-white/10 flex items-center gap-1 transition-all"
                title="Kembali ke bulan semasa"
              >
                <RotateCcw size={11} />
                <span>Kembali ke Sekarang</span>
              </button>
            )}
          </div>
        </div>

        {/* Month Navigator Controls */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto bg-white/[0.04] border border-white/15 p-1 rounded-2xl backdrop-blur-md shadow-lg">
          <button
            type="button"
            onClick={onPrevMonth}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
            title="Bulan Sebelumnya"
            aria-label="Previous Month"
          >
            <ChevronLeft size={17} />
          </button>

          <div className="px-3 py-1 text-center min-w-[130px]">
            <span className="text-sm sm:text-base font-bold font-mono text-accent-mint tracking-wide">
              {monthName} {year}
            </span>
          </div>

          <button
            type="button"
            onClick={onNextMonth}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
            title="Bulan Seterusnya"
            aria-label="Next Month"
          >
            <ChevronRight size={17} />
          </button>
        </div>
      </div>

      {/* 2-Column "VS" Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 mt-5 sm:mt-6 relative z-10">
        {/* Left Column: What I Have Achieved */}
        <div className="flex flex-col rounded-2xl bg-white/[0.02] border border-emerald-500/20 p-4 sm:p-5 relative overflow-hidden group hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <CheckCircle2 size={16} />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-emerald-400 tracking-tight">
                  What I Have Achieved
                </h3>
                <p className="text-[11px] text-white/40">Apa yang telah berjaya dicapai bulan ini</p>
              </div>
            </div>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400/90 border border-emerald-500/20">
              Achieved
            </span>
          </div>

          <textarea
            value={achievedInput}
            onChange={(e) => {
              setAchievedInput(e.target.value);
              setIsDirty(true);
            }}
            rows={7}
            placeholder={`1. Selesaikan projek portfolio v1\n2. Bayar ansuran kereta Affin Bank awal\n3. Consistent workout 4 hari seminggu...`}
            className="w-full flex-1 p-3.5 rounded-xl bg-slate-950/40 border border-white/10 focus:border-emerald-500/50 focus:outline-none text-white text-sm leading-relaxed placeholder:text-white/20 resize-y transition-all font-sans font-normal"
          />
          <span className="text-[11px] text-white/35 mt-2">
            Tulis senarai nombor 1, 2, 3 mengikut pencapaian anda.
          </span>
        </div>

        {/* Right Column: What I Want to Achieve */}
        <div className="flex flex-col rounded-2xl bg-white/[0.02] border border-sky-500/20 p-4 sm:p-5 relative overflow-hidden group hover:border-sky-500/40 transition-all">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                <Target size={16} />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-sky-400 tracking-tight">
                  What I Want to Achieve
                </h3>
                <p className="text-[11px] text-white/40">Sasaran & sasaran yang ingin dicapai bulan ini</p>
              </div>
            </div>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400/90 border border-sky-500/20">
              Goals
            </span>
          </div>

          <textarea
            value={wantInput}
            onChange={(e) => {
              setWantInput(e.target.value);
              setIsDirty(true);
            }}
            rows={7}
            placeholder={`1. Simpan RM 1,500 ke dalam Tabung Haji\n2. Siapkan modul kewangan & qadha\n3. Kurangkan screen time waktu malam...`}
            className="w-full flex-1 p-3.5 rounded-xl bg-slate-950/40 border border-white/10 focus:border-sky-500/50 focus:outline-none text-white text-sm leading-relaxed placeholder:text-white/20 resize-y transition-all font-sans font-normal"
          />
          <span className="text-[11px] text-white/35 mt-2">
            Tulis senarai nombor 1, 2, 3 sasaran anda untuk bulan ini.
          </span>
        </div>
      </div>

      {/* Save Action Bar */}
      <div className="mt-6 pt-4 border-t border-white/[0.08] flex items-center justify-between relative z-10 flex-wrap gap-3">
        <div className="flex items-center gap-2 text-xs text-white/50">
          {isDirty ? (
            <span className="text-amber-400 flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              Perubahan belum disimpan
            </span>
          ) : (
            <span className="text-emerald-400/90 flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-emerald-400" />
              Semua perubahan tersimpan
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-950 bg-accent-mint hover:bg-emerald-400 active:scale-95 transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(52,211,153,0.3)] disabled:opacity-50"
        >
          <Save size={16} />
          <span>{isSaving ? 'Menyimpan...' : 'Save Focus'}</span>
        </button>
      </div>
    </div>
  );
};
