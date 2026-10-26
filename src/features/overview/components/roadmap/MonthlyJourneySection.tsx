import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  Map,
  Trophy,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  Edit3,
  Sparkles,
  LayoutGrid,
  Focus,
  RotateCcw,
} from 'lucide-react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { db } from '@/db/nemoDb';
import type { MonthlyRoadmapItem } from '@/domain/types';
import { createDefaultRoadmapForYear } from '@/features/overview/data/defaultRoadmaps';
import { MonthlyRoadmapCard } from './MonthlyRoadmapCard';
import { MonthEditModal } from './MonthEditModal';
import { getMascotComponent, MASCOT_META } from './MascotIcons';
import { useToast } from '@/components/ui/Toast';
import { useReducedMotion } from '@/design/useReducedMotion';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const MONTH_CODES = [
  'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
  'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC',
];

export const MonthlyJourneySection: React.FC = () => {
  const currentCalendarMonth = new Date().getMonth() + 1; // 1 to 12
  const currentCalendarYear = new Date().getFullYear();

  // Selected year state defaults to current calendar year (auto-tukar bila masuk tahun baru)
  const [selectedYear, setSelectedYear] = useState<number>(currentCalendarYear);
  const [yearMenuOpen, setYearMenuOpen] = useState(false);
  const yearDropdownRef = useRef<HTMLDivElement>(null);

  // View state: 'spotlight' (minimalist focused hero) or 'grid' (6-month grid)
  const [viewMode, setViewMode] = useState<'spotlight' | 'grid'>('spotlight');
  const [selectedMonth, setSelectedMonth] = useState<number>(currentCalendarMonth);
  const [activeHalf, setActiveHalf] = useState<'H1' | 'H2'>(
    currentCalendarMonth > 6 ? 'H2' : 'H1'
  );
  const [editingItem, setEditingItem] = useState<MonthlyRoadmapItem | null>(null);

  const containerRef = useRef<HTMLElement>(null);
  const { success, error } = useToast();
  const reduced = useReducedMotion();

  // Query recorded distinct years from Dexie
  const recordedYears = useLiveQuery(
    async () => {
      const keys = await db.monthlyRoadmaps.orderBy('year').uniqueKeys();
      return keys
        .map((k) => Number(k))
        .filter((y) => !isNaN(y) && y >= 2000 && y <= 2100);
    },
    [],
    [currentCalendarYear]
  );

  // Available selectable years: past 3 years, current, upcoming 2, and any recorded
  const availableYears = useMemo(() => {
    const yearsSet = new Set<number>([
      currentCalendarYear - 3,
      currentCalendarYear - 2,
      currentCalendarYear - 1,
      currentCalendarYear,
      currentCalendarYear + 1,
      currentCalendarYear + 2,
      selectedYear,
      ...(recordedYears || []),
    ]);
    return Array.from(yearsSet).sort((a, b) => b - a); // descending order
  }, [currentCalendarYear, selectedYear, recordedYears]);

  // Handle outside click for year dropdown
  useEffect(() => {
    if (!yearMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (yearDropdownRef.current && !yearDropdownRef.current.contains(e.target as Node)) {
        setYearMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [yearMenuOpen]);

  // Query roadmap items from Dexie for selectedYear
  const roadmaps = useLiveQuery(
    async () => {
      const items = await db.monthlyRoadmaps.where('year').equals(selectedYear).toArray();
      return items.sort((a, b) => a.month - b.month);
    },
    [selectedYear],
    []
  );

  // Auto-seed default roadmap for selectedYear if local database is empty
  useEffect(() => {
    let mounted = true;
    const ensureYearRoadmaps = async () => {
      try {
        const count = await db.monthlyRoadmaps.where('year').equals(selectedYear).count();
        if (count === 0 && mounted) {
          const defaults = createDefaultRoadmapForYear(selectedYear);
          await db.monthlyRoadmaps.bulkAdd(defaults);
        }
      } catch (err) {
        console.error(`Failed to initialize monthly roadmaps for year ${selectedYear}`, err);
      }
    };
    void ensureYearRoadmaps();
    return () => {
      mounted = false;
    };
  }, [selectedYear]);

  // All 12 items (with fallback)
  const allItems = useMemo(() => {
    if (!roadmaps || roadmaps.length === 0) {
      return createDefaultRoadmapForYear(selectedYear);
    }
    return roadmaps.sort((a, b) => a.month - b.month);
  }, [roadmaps, selectedYear]);

  // Current spotlight item
  const spotlightItem = useMemo(() => {
    return allItems.find((it) => it.month === selectedMonth) || allItems[0];
  }, [allItems, selectedMonth]);

  // Filter 6 months for selected half (Grid view)
  const visibleGridItems = useMemo(() => {
    return allItems
      .filter((item) => (activeHalf === 'H1' ? item.month <= 6 : item.month > 6))
      .sort((a, b) => a.month - b.month);
  }, [allItems, activeHalf]);

  // Overall milestone statistics across all 12 months
  const completedCount = useMemo(() => {
    return allItems.filter((item) => item.status === 'completed').length;
  }, [allItems]);

  // GSAP transition when toggling between view modes, months, or years
  useGSAP(
    () => {
      if (reduced || !containerRef.current) return;
      const animTarget = containerRef.current.querySelectorAll('.roadmap-anim-content');
      if (animTarget.length > 0) {
        gsap.fromTo(
          animTarget,
          { opacity: 0, y: 10 },
          { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' }
        );
      }
    },
    { scope: containerRef, dependencies: [viewMode, selectedMonth, activeHalf, selectedYear] }
  );

  const handleYearChange = (newYear: number) => {
    setSelectedYear(newYear);
    if (newYear === currentCalendarYear) {
      setSelectedMonth(currentCalendarMonth);
      setActiveHalf(currentCalendarMonth > 6 ? 'H2' : 'H1');
    }
  };

  const handleSaveItem = async (updated: MonthlyRoadmapItem) => {
    try {
      await db.monthlyRoadmaps.put(updated);
      success('Roadmap Updated', `${updated.theme} goal saved for month ${updated.month}.`);
    } catch (err) {
      error('Failed to save roadmap', err instanceof Error ? err.message : 'Please retry.');
    }
  };

  const handleToggleComplete = async (item: MonthlyRoadmapItem) => {
    try {
      const nextStatus = item.status === 'completed' ? 'in_progress' : 'completed';
      const updated: MonthlyRoadmapItem = {
        ...item,
        status: nextStatus,
        completedAt: nextStatus === 'completed' ? new Date().toISOString() : undefined,
        updatedAt: new Date().toISOString(),
      };
      await db.monthlyRoadmaps.put(updated);
      if (nextStatus === 'completed') {
        success('✨ Milestone Accomplished!', `Month ${item.month} goal marked as achieved.`);
      }
    } catch (err) {
      error('Could not update status', err instanceof Error ? err.message : 'Please retry.');
    }
  };

  const handlePrevMonth = () => {
    setSelectedMonth((prev) => (prev > 1 ? prev - 1 : 12));
  };

  const handleNextMonth = () => {
    setSelectedMonth((prev) => (prev < 12 ? prev + 1 : 1));
  };

  const mascotInfo = MASCOT_META[spotlightItem?.mascot] || MASCOT_META.rocket;
  const isSpotlightCurrentMonth =
    spotlightItem?.year === currentCalendarYear && spotlightItem?.month === currentCalendarMonth;
  const isSpotlightCompleted = spotlightItem?.status === 'completed';

  return (
    <section
      ref={containerRef}
      className="glass-panel p-4 sm:p-6 rounded-3xl border border-white/10 relative overflow-hidden mt-6 sm:mt-8 shadow-2xl transition-all duration-300"
      data-enter
      aria-labelledby="journey-roadmap-title"
    >
      {/* Background Ambient Glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-accent-mint/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-white/[0.08] relative z-20">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-accent-mint/10 border border-accent-mint/25 flex items-center justify-center text-accent-mint shadow-[0_0_16px_rgba(52,211,153,0.15)] shrink-0">
            <Map size={22} />
          </div>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h2 id="journey-roadmap-title" className="text-lg sm:text-xl font-bold tracking-tight text-white">
                Annual Journey Roadmap
              </h2>

              {/* Large Interactive Year Controller */}
              <div
                ref={yearDropdownRef}
                className="relative inline-flex items-center rounded-2xl bg-white/[0.04] border border-white/15 p-0.5 backdrop-blur-md shadow-lg group hover:border-accent-mint/40 transition-all"
              >
                <button
                  type="button"
                  onClick={() => handleYearChange(selectedYear - 1)}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
                  title={`Previous Year (${selectedYear - 1})`}
                  aria-label="Previous Year"
                >
                  <ChevronLeft size={16} />
                </button>

                <button
                  type="button"
                  onClick={() => setYearMenuOpen((v) => !v)}
                  className="px-2.5 py-0.5 flex items-center gap-1.5 text-lg sm:text-2xl font-black font-mono tracking-wider text-accent-mint hover:text-white transition-colors"
                  title="Click to select a different year"
                  aria-expanded={yearMenuOpen}
                  aria-haspopup="listbox"
                >
                  <span>{selectedYear}</span>
                  <ChevronDown
                    size={15}
                    className={`text-accent-mint/70 transition-transform duration-200 ${
                      yearMenuOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                <button
                  type="button"
                  onClick={() => handleYearChange(selectedYear + 1)}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
                  title={`Next Year (${selectedYear + 1})`}
                  aria-label="Next Year"
                >
                  <ChevronRight size={16} />
                </button>

                {/* Dropdown Menu for Years */}
                {yearMenuOpen && (
                  <div
                    className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-44 bg-[#0c1224]/95 border border-white/15 rounded-2xl shadow-2xl p-2 z-50 backdrop-blur-2xl animate-fade-in"
                    role="listbox"
                  >
                    <div className="text-[10px] font-mono uppercase tracking-wider text-white/40 px-2.5 py-1 flex items-center justify-between">
                      <span>Select Year</span>
                      <span>Roadmap</span>
                    </div>
                    <div className="max-h-56 overflow-y-auto space-y-1 py-1 custom-scrollbar">
                      {availableYears.map((yr) => {
                        const isCurrent = yr === currentCalendarYear;
                        const isSelected = yr === selectedYear;
                        return (
                          <button
                            key={yr}
                            type="button"
                            onClick={() => {
                              handleYearChange(yr);
                              setYearMenuOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-xl text-xs font-mono font-bold flex items-center justify-between transition-all ${
                              isSelected
                                ? 'bg-accent-mint text-midnight-950 shadow-md font-black'
                                : 'text-white/80 hover:bg-white/10 hover:text-white'
                            }`}
                          >
                            <span className="text-sm">{yr}</span>
                            {isCurrent && (
                              <span
                                className={`text-[9px] font-sans font-semibold px-1.5 py-0.5 rounded-full ${
                                  isSelected
                                    ? 'bg-midnight-950/25 text-midnight-950'
                                    : 'bg-accent-mint/20 text-accent-mint border border-accent-mint/30'
                                }`}
                              >
                                Current
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Snap to Current Year if looking at another year */}
              {selectedYear !== currentCalendarYear && (
                <button
                  type="button"
                  onClick={() => handleYearChange(currentCalendarYear)}
                  className="text-xs font-mono font-semibold px-2.5 py-1 rounded-xl bg-accent-mint/15 border border-accent-mint/30 text-accent-mint hover:bg-accent-mint/25 transition-all flex items-center gap-1.5 shadow-sm"
                  title={`Snap back to current year ${currentCalendarYear}`}
                >
                  <RotateCcw size={12} />
                  <span>Reset to {currentCalendarYear}</span>
                </button>
              )}
            </div>
            <p className="text-xs text-white/60 mt-0.5">
              Navigate each month with clear intent, focused strategy, and cheerful momentum.
            </p>
          </div>
        </div>

        {/* Controls: View Switcher, Half Switcher & Trophy */}
        <div className="flex items-center gap-2.5 self-start lg:self-auto flex-wrap">
          {/* Milestone Counter */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/10 text-xs text-white/70">
            <Trophy size={13} className="text-accent-mint" />
            <span>
              <strong className="text-white font-semibold">{completedCount}</strong> of 12 Reached
            </span>
          </div>

          {/* View Mode Toggle (Spotlight Focus vs Minimalist Grid) */}
          <div className="flex items-center p-1 rounded-xl bg-white/[0.04] border border-white/10">
            <button
              type="button"
              onClick={() => setViewMode('spotlight')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'spotlight'
                  ? 'bg-accent-mint text-midnight-950 shadow-sm font-bold'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
              title="Focused minimalist spotlight on active month"
            >
              <Focus size={13} />
              <span>Spotlight</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'grid'
                  ? 'bg-accent-mint text-midnight-950 shadow-sm font-bold'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
              title="Minimalist 6-month overview grid"
            >
              <LayoutGrid size={13} />
              <span>6-Month Grid</span>
            </button>
          </div>

          {/* 6-Month Half Switcher (shown only in Grid view) */}
          {viewMode === 'grid' && (
            <div className="flex items-center p-1 rounded-xl bg-white/[0.04] border border-white/10">
              <button
                type="button"
                onClick={() => setActiveHalf('H1')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  activeHalf === 'H1'
                    ? 'bg-white/15 text-white font-bold'
                    : 'text-white/50 hover:text-white'
                }`}
              >
                H1 (Jan–Jun)
              </button>
              <button
                type="button"
                onClick={() => setActiveHalf('H2')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  activeHalf === 'H2'
                    ? 'bg-white/15 text-white font-bold'
                    : 'text-white/50 hover:text-white'
                }`}
              >
                H2 (Jul–Dec)
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Interactive 12-Month Station Rail (Clean Linear Timeline) */}
      <div className="relative mt-5 mb-4 z-10 px-1">
        {/* Track Line connecting stations */}
        <div className="absolute left-4 right-4 top-4 -translate-y-1/2 h-0.5 border-b border-white/[0.12] z-0" />

        <div className="grid grid-cols-12 gap-1 sm:gap-2 relative z-10">
          {allItems.map((item) => {
            const isCurrent = item.year === currentCalendarYear && item.month === currentCalendarMonth;
            const isSelected = item.month === selectedMonth;
            const isDone = item.status === 'completed';
            const monthCode = MONTH_CODES[item.month - 1];

            return (
              <button
                key={`rail-${item.month}`}
                type="button"
                onClick={() => {
                  setSelectedMonth(item.month);
                  if (item.month > 6) setActiveHalf('H2');
                  else setActiveHalf('H1');
                }}
                className="flex flex-col items-center group cursor-pointer focus:outline-none"
                title={`${monthCode}: ${item.theme}`}
              >
                {/* Station Node Button */}
                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-mono font-bold text-[10px] sm:text-xs border transition-all duration-200 relative ${
                    isSelected
                      ? 'bg-accent-mint border-white text-midnight-950 scale-110 shadow-[0_0_16px_rgba(52,211,153,0.8)] ring-2 ring-accent-mint/40 z-10'
                      : isDone
                      ? 'bg-emerald-500/80 border-emerald-300 text-midnight-950 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                      : isCurrent
                      ? 'bg-midnight-900 border-accent-mint text-accent-mint shadow-[0_0_10px_rgba(52,211,153,0.3)]'
                      : 'bg-midnight-900/90 border-white/20 text-white/50 hover:border-white/50 hover:text-white'
                  }`}
                >
                  {isDone ? '✓' : String(item.month).padStart(2, '0')}

                  {/* Pulsing Dot for actual current calendar month */}
                  {isCurrent && !isSelected && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-accent-mint animate-ping" />
                  )}
                </div>

                {/* Station Month Label */}
                <span
                  className={`text-[9px] sm:text-[10px] font-mono mt-1 transition-colors ${
                    isSelected
                      ? 'text-accent-mint font-bold'
                      : isCurrent
                      ? 'text-white font-semibold'
                      : 'text-white/40 group-hover:text-white/80'
                  }`}
                >
                  {monthCode}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area: Spotlight Mode vs Minimalist 6-Tile Grid */}
      <div className="roadmap-anim-content relative z-10 mt-2">
        {viewMode === 'spotlight' ? (
          /* SPOTLIGHT HERO CARD */
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 sm:p-6 backdrop-blur-md relative overflow-hidden transition-all">
            {/* Background ambient radial glow */}
            <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-accent-mint/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              {/* Left Column: Mascot & Title */}
              <div className="flex items-center gap-4 sm:gap-5 min-w-0 flex-1">
                <div
                  className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center shrink-0 border relative shadow-xl transition-all duration-300 ${
                    isSpotlightCurrentMonth
                      ? 'bg-accent-mint/15 border-accent-mint/40 shadow-[0_0_24px_rgba(52,211,153,0.25)]'
                      : 'bg-white/5 border-white/10'
                  }`}
                >
                  {getMascotComponent(spotlightItem.mascot, 60, '', isSpotlightCurrentMonth)}
                </div>

                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-accent-mint/15 border border-accent-mint/30 text-accent-mint uppercase tracking-wider">
                      {MONTH_NAMES[spotlightItem.month - 1]} {spotlightItem.year}
                    </span>
                    {isSpotlightCurrentMonth ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent-mint/20 text-accent-mint border border-accent-mint/40 flex items-center gap-1">
                        📍 Current Stop
                      </span>
                    ) : selectedYear < currentCalendarYear ? (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 text-white/60 border border-white/10 flex items-center gap-1">
                        🏛️ {selectedYear} Archive
                      </span>
                    ) : selectedYear > currentCalendarYear ? (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-400/30 flex items-center gap-1">
                        🚀 {selectedYear} Plan
                      </span>
                    ) : null}
                    <span className="text-xs text-white/50 flex items-center gap-1">
                      <Sparkles size={11} className="text-accent-mint" />
                      {mascotInfo.label}
                    </span>
                  </div>

                  <h3 className="text-lg sm:text-2xl font-bold text-white tracking-tight leading-snug">
                    {spotlightItem.theme}
                  </h3>

                  {/* Primary Goal Description (Fully Unclipped) */}
                  <p className="text-xs sm:text-sm text-white/80 leading-relaxed font-normal pt-1">
                    {spotlightItem.primaryGoal}
                  </p>

                  {/* Execution Strategy */}
                  {spotlightItem.strategy && (
                    <div className="pt-2">
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs text-accent-mint">
                        <span className="font-semibold">🎯 Focus Strategy:</span>
                        <span className="text-white/80 font-normal">{spotlightItem.strategy}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Actions & Month Navigation */}
              <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between w-full lg:w-auto gap-3 pt-4 lg:pt-0 border-t lg:border-t-0 border-white/[0.08] shrink-0">
                {/* Status Toggle & Edit Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleComplete(spotlightItem)}
                    className={`px-4 py-2 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all active:scale-95 ${
                      isSpotlightCompleted
                        ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.25)]'
                        : 'bg-white/[0.05] border-white/10 text-white/80 hover:border-emerald-400/40 hover:text-white'
                    }`}
                  >
                    <CheckCircle2 size={16} className={isSpotlightCompleted ? 'text-emerald-400' : 'text-white/40'} />
                    <span>{isSpotlightCompleted ? 'Completed' : 'Mark Completed'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditingItem(spotlightItem)}
                    className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-colors"
                    title="Edit monthly goal and strategy"
                  >
                    <Edit3 size={16} />
                  </button>
                </div>

                {/* Previous / Next Month Navigation */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handlePrevMonth}
                    className="p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 text-white/60 hover:text-white transition-colors flex items-center gap-1 text-xs"
                    title="Previous Month"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="text-xs font-mono text-white/50 px-1">
                    {spotlightItem.month} / 12
                  </span>
                  <button
                    type="button"
                    onClick={handleNextMonth}
                    className="p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 text-white/60 hover:text-white transition-colors flex items-center gap-1 text-xs"
                    title="Next Month"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* MINIMALIST 6-TILE GRID VIEW */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3.5 items-stretch">
            {visibleGridItems.map((item) => (
              <MonthlyRoadmapCard
                key={item.id}
                item={item}
                isCurrentMonth={item.year === currentCalendarYear && item.month === currentCalendarMonth}
                onEdit={setEditingItem}
                onToggleComplete={handleToggleComplete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Edit Month Roadmap Modal */}
      <MonthEditModal
        isOpen={Boolean(editingItem)}
        onClose={() => setEditingItem(null)}
        roadmapItem={editingItem}
        onSave={handleSaveItem}
      />
    </section>
  );
};
