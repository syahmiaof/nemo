import React, { useState } from 'react';
import { IslamicQuote } from '@/domain/types';
import { DEFAULT_ISLAMIC_QUOTES } from '../data/defaultQuotes';
import { Sparkles, Shuffle, BookOpen } from 'lucide-react';

interface IslamicMotivationCardProps {
  initialQuote?: IslamicQuote;
}

export const IslamicMotivationCard: React.FC<IslamicMotivationCardProps> = ({
  initialQuote,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [currentIndex, setCurrentIndex] = useState(0);

  const filteredQuotes = selectedCategory === 'all'
    ? DEFAULT_ISLAMIC_QUOTES
    : DEFAULT_ISLAMIC_QUOTES.filter((q) => q.category === selectedCategory);

  const activeQuote = filteredQuotes[currentIndex % filteredQuotes.length] || initialQuote || DEFAULT_ISLAMIC_QUOTES[0];

  const handleShuffle = () => {
    if (filteredQuotes.length <= 1) return;
    let next = Math.floor(Math.random() * filteredQuotes.length);
    if (next === (currentIndex % filteredQuotes.length)) {
      next = (next + 1) % filteredQuotes.length;
    }
    setCurrentIndex(next);
  };

  const categories = [
    { key: 'all', label: 'All Themes' },
    { key: 'sabar', label: 'Patience (Sabar)' },
    { key: 'syukur', label: 'Gratitude (Syukur)' },
    { key: 'rezeki', label: 'Sustenance (Rezeki)' },
    { key: 'taubat', label: 'Repentance (Taubat)' },
    { key: 'istiqamah', label: 'Steadfastness (Istiqamah)' },
  ];

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-br from-[#0e172a]/95 via-[#0c1527]/90 to-[#0b1324]/95 backdrop-blur-xl p-5 md:p-6 shadow-2xl relative overflow-hidden transition-all duration-300">
      {/* Background ambient light */}
      <div className="absolute -top-16 -right-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Row */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-5 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.2)]">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              Spiritual Reflections &amp; Motivations
            </h3>
            <p className="text-[11px] text-content-tertiary">
              Holy Quran verses &amp; Sahih Hadiths for peace of heart
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleShuffle}
          className="px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-content-secondary hover:text-white text-xs font-medium flex items-center gap-1.5 transition-all active:scale-95"
          title="Show another reflection"
        >
          <Shuffle className="w-3.5 h-3.5 text-emerald-400" />
          <span>Next Verse</span>
        </button>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none mb-4 relative z-10">
        {categories.map((c) => {
          const isActive = selectedCategory === c.key;
          return (
            <button
              key={c.key}
              type="button"
              onClick={() => {
                setSelectedCategory(c.key);
                setCurrentIndex(0);
              }}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                isActive
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                  : 'bg-white/[0.03] text-content-secondary hover:text-white border border-transparent hover:bg-white/[0.06]'
              }`}
            >
              {c.label}
            </button>
          );
        })}
      </div>

      {/* Quote Display Card */}
      <div className="p-5 rounded-xl border border-white/[0.06] bg-white/[0.02] relative z-10 space-y-3">
        {activeQuote.textArabic && (
          <p
            dir="rtl"
            className="text-right text-xl md:text-2xl font-serif leading-loose text-emerald-200/90 tracking-wide select-none"
            style={{ fontFamily: "'Traditional Arabic', 'Amiri', serif" }}
          >
            {activeQuote.textArabic}
          </p>
        )}

        <p className="text-sm md:text-base text-content-primary italic leading-relaxed font-sans">
          &ldquo;{activeQuote.translation}&rdquo;
        </p>

        <div className="flex items-center justify-between pt-2 border-t border-white/[0.05] text-xs">
          <span className="text-[11px] font-semibold text-emerald-400/90 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
            {activeQuote.source}
          </span>
          <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/[0.05] text-content-tertiary">
            Category: {activeQuote.category}
          </span>
        </div>
      </div>
    </div>
  );
};
