import React, { useState } from 'react';
import { IbadahDailyLog } from '@/domain/types';
import { BookOpen, Plus, Bookmark, Check } from 'lucide-react';
import { Input } from '@/components/ui/Input';

interface QuranTrackerCardProps {
  currentLog?: IbadahDailyLog;
  onUpdateQuran: (data: {
    quranPagesRead: number;
    quranLastSurah?: string;
    quranLastAyah?: number;
    notes?: string;
  }) => Promise<void>;
}

export const QuranTrackerCard: React.FC<QuranTrackerCardProps> = ({
  currentLog,
  onUpdateQuran,
}) => {
  const [pagesRead, setPagesRead] = useState(currentLog?.quranPagesRead || 0);
  const [lastSurah, setLastSurah] = useState(currentLog?.quranLastSurah || '');
  const [lastAyah, setLastAyah] = useState(currentLog?.quranLastAyah ? String(currentLog.quranLastAyah) : '');
  const [tadabburNotes, setTadabburNotes] = useState(currentLog?.notes || '');
  const [isSaved, setIsSaved] = useState(false);

  // Sync state if currentLog changes externally
  React.useEffect(() => {
    if (currentLog) {
      setPagesRead(currentLog.quranPagesRead || 0);
      setLastSurah(currentLog.quranLastSurah || '');
      setLastAyah(currentLog.quranLastAyah ? String(currentLog.quranLastAyah) : '');
      setTadabburNotes(currentLog.notes || '');
    }
  }, [currentLog?.id, currentLog?.quranPagesRead, currentLog?.quranLastSurah, currentLog?.quranLastAyah, currentLog?.notes]);

  const handleAddPages = async (delta: number) => {
    const next = Math.max(0, pagesRead + delta);
    setPagesRead(next);
    await onUpdateQuran({
      quranPagesRead: next,
      quranLastSurah: lastSurah.trim() || undefined,
      quranLastAyah: lastAyah ? parseInt(lastAyah, 10) : undefined,
      notes: tadabburNotes.trim() || undefined,
    });
    triggerSaved();
  };

  const handleSaveBookmark = async (e: React.FormEvent) => {
    e.preventDefault();
    await onUpdateQuran({
      quranPagesRead: pagesRead,
      quranLastSurah: lastSurah.trim() || undefined,
      quranLastAyah: lastAyah ? parseInt(lastAyah, 10) : undefined,
      notes: tadabburNotes.trim() || undefined,
    });
    triggerSaved();
  };

  const triggerSaved = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#0c1527]/80 backdrop-blur-xl p-5 md:p-6 shadow-2xl relative overflow-hidden transition-all duration-300">
      {/* Background ambient gradient */}
      <div className="absolute -top-16 -right-16 w-56 h-56 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)]">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-content-primary flex items-center gap-2">
              Holy Quran &amp; Tadabbur
              {isSaved && (
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <Check className="w-3 h-3" /> Saved
                </span>
              )}
            </h3>
            <p className="text-xs text-content-secondary">
              Daily recitation, surah/ayah bookmarking, and contemplation notes
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {[1, 2, 5, 10].map((inc) => (
            <button
              key={inc}
              type="button"
              onClick={() => handleAddPages(inc)}
              className="px-2.5 py-1.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/30 text-cyan-300 text-xs font-semibold flex items-center gap-1 transition-all active:scale-95 shadow-[0_0_8px_rgba(6,182,212,0.15)]"
            >
              <Plus className="w-3 h-3" />
              <span>+{inc} Pages</span>
            </button>
          ))}
        </div>
      </div>

      {/* Pages Read Progress Display */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-5 relative z-10">
        <div className="md:col-span-5 rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-medium text-content-tertiary uppercase tracking-wider block">
              Pages Read Today
            </span>
            <div className="text-3xl font-extrabold font-mono text-cyan-400 tracking-tight">
              {pagesRead} <span className="text-sm font-normal text-content-secondary">pages</span>
            </div>
            <p className="text-[11px] text-content-tertiary">
              ~{(pagesRead / 20).toFixed(1)} juz&apos; completed today
            </p>
          </div>

          <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-400/20 flex items-center justify-center text-cyan-400">
            <Bookmark className="w-7 h-7" />
          </div>
        </div>

        {/* Bookmark & Tadabbur Form */}
        <form onSubmit={handleSaveBookmark} className="md:col-span-7 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-content-secondary">
                Last Read Surah
              </label>
              <Input
                type="text"
                placeholder="e.g. Al-Kahf / Al-Baqarah"
                value={lastSurah}
                onChange={(e) => setLastSurah(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-content-secondary">
                Last Ayah
              </label>
              <Input
                type="number"
                min="1"
                placeholder="e.g. 110"
                value={lastAyah}
                onChange={(e) => setLastAyah(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-content-secondary">
              Tadabbur Notes / Ayah Reflection
            </label>
            <Input
              type="text"
              placeholder="e.g. Lessons on worldly tests, gratitude, and staying steadfast..."
              value={tadabburNotes}
              onChange={(e) => setTadabburNotes(e.target.value)}
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.1] text-xs font-semibold text-white transition-all active:scale-95"
            >
              Save Bookmark &amp; Reflection
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
