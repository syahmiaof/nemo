import React, { useState } from 'react';
import { Feather, Edit3, Sparkles } from 'lucide-react';
import { PersonalJournalModal } from './PersonalJournalModal';
import { useToast } from '@/components/ui/Toast';

interface PersonalJournalCardProps {
  diaryText: string;
  lastUpdatedAt: string | null;
  onSaveDiary: (newText: string) => Promise<void>;
}

export const PersonalJournalCard: React.FC<PersonalJournalCardProps> = ({
  diaryText,
  lastUpdatedAt,
  onSaveDiary,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { success } = useToast();

  const handleSave = async (text: string) => {
    await onSaveDiary(text);
    success('Diari Disimpan', 'Catatan diari peribadi anda telah dikemaskini.');
  };

  const previewExcerpt = diaryText.trim();
  const wordCount = previewExcerpt ? previewExcerpt.split(/\s+/).length : 0;

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsModalOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsModalOpen(true);
          }
        }}
        className="glass-panel p-5 sm:p-6 rounded-3xl border border-white/10 hover:border-sky-500/30 transition-all duration-300 cursor-pointer group flex flex-col justify-between relative overflow-hidden text-left"
      >
        {/* Ambient Corner Glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-sky-500/5 rounded-full blur-2xl group-hover:bg-sky-500/10 transition-all pointer-events-none" />

        {/* Header */}
        <div>
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-sky-500/10 border border-sky-400/20 flex items-center justify-center text-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.15)] shrink-0 group-hover:scale-105 transition-transform">
                <Feather size={19} />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight group-hover:text-sky-300 transition-colors">
                  Journal
                </h3>
                <p className="text-xs text-white/50">Diari & visi peribadi yang sentiasa ada</p>
              </div>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsModalOpen(true);
              }}
              className="px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/10 border border-white/10 text-xs font-medium text-white/80 flex items-center gap-1.5 transition-all group-hover:border-sky-400/40"
            >
              <Edit3 size={13} />
              <span>Buka Diari</span>
            </button>
          </div>

          {/* Excerpt Body */}
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] group-hover:border-white/15 transition-all min-h-[140px] flex flex-col justify-between">
            {previewExcerpt ? (
              <p className="text-sm text-white/80 leading-relaxed font-sans line-clamp-5 whitespace-pre-wrap">
                {previewExcerpt}
              </p>
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-6 px-3">
                <Sparkles size={24} className="text-sky-400/40 mb-2" />
                <p className="text-sm font-medium text-white/60 mb-1">
                  Lembaran diari anda masih kosong
                </p>
                <p className="text-xs text-white/40 max-w-xs">
                  Klik untuk mula catit siapa diri anda, apa anda mahu, dan refleksi peribadi.
                </p>
              </div>
            )}

            {previewExcerpt && (
              <div className="flex items-center justify-between text-[11px] text-white/40 pt-3 mt-2 border-t border-white/[0.06]">
                <span>{wordCount} patah perkataan</span>
                <span className="text-sky-400/70 group-hover:underline">Klik untuk tulis / edit →</span>
              </div>
            )}
          </div>
        </div>

        {/* Bottom subtle note */}
        <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-white/40">
          <span>Kekal sentiasa ada & selamat</span>
          <span className="text-emerald-400/80 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Auto-sync
          </span>
        </div>
      </div>

      <PersonalJournalModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialText={diaryText}
        onSave={handleSave}
        lastUpdatedAt={lastUpdatedAt}
      />
    </>
  );
};
