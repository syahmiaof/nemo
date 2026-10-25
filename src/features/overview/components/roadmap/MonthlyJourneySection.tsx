import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Map, Trophy } from 'lucide-react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { db } from '@/db/nemoDb';
import type { MonthlyRoadmapItem } from '@/domain/types';
import { DEFAULT_ROADMAP_ITEMS_2026 } from '@/features/overview/data/defaultRoadmaps';
import { MonthlyRoadmapCard } from './MonthlyRoadmapCard';
import { MonthEditModal } from './MonthEditModal';
import { useToast } from '@/components/ui/Toast';
import { useReducedMotion } from '@/design/useReducedMotion';

export const MonthlyJourneySection: React.FC = () => {
  const currentCalendarMonth = new Date().getMonth() + 1; // 1 to 12
  const currentCalendarYear = new Date().getFullYear();

  // Default to H2 if current month is Jul-Dec, else H1
  const [activeHalf, setActiveHalf] = useState<'H1' | 'H2'>(
    currentCalendarMonth > 6 ? 'H2' : 'H1'
  );
  const [editingItem, setEditingItem] = useState<MonthlyRoadmapItem | null>(null);

  const containerRef = useRef<HTMLElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const { success, error } = useToast();
  const reduced = useReducedMotion();

  // Query roadmap items from Dexie
  const roadmaps = useLiveQuery(
    async () => {
      const items = await db.monthlyRoadmaps.where('year').equals(currentCalendarYear).toArray();
      return items.sort((a, b) => a.month - b.month);
    },
    [currentCalendarYear],
    []
  );

  // Auto-seed default roadmap if local database is empty
  useEffect(() => {
    let mounted = true;
    const ensureDefaults = async () => {
      try {
        const count = await db.monthlyRoadmaps.where('year').equals(currentCalendarYear).count();
        if (count === 0 && mounted) {
          await db.monthlyRoadmaps.bulkAdd(DEFAULT_ROADMAP_ITEMS_2026);
        }
      } catch (err) {
        console.error('Failed to initialize default monthly roadmaps', err);
      }
    };
    void ensureDefaults();
    return () => {
      mounted = false;
    };
  }, [currentCalendarYear]);

  // Filter 6 months for selected half
  const visibleItems = useMemo(() => {
    if (!roadmaps || roadmaps.length === 0) {
      // Fallback to in-memory default items if Dexie hasn't loaded yet
      const base = DEFAULT_ROADMAP_ITEMS_2026.filter((item) =>
        activeHalf === 'H1' ? item.month <= 6 : item.month > 6
      );
      return base.sort((a, b) => a.month - b.month);
    }
    return roadmaps
      .filter((item) => (activeHalf === 'H1' ? item.month <= 6 : item.month > 6))
      .sort((a, b) => a.month - b.month);
  }, [roadmaps, activeHalf]);

  // Overall milestone statistics across all 12 months
  const completedCount = useMemo(() => {
    const list = roadmaps && roadmaps.length > 0 ? roadmaps : DEFAULT_ROADMAP_ITEMS_2026;
    return list.filter((item) => item.status === 'completed').length;
  }, [roadmaps]);

  // GSAP transition when toggling between H1 and H2
  useGSAP(
    () => {
      if (reduced || !cardsRef.current) return;
      gsap.fromTo(
        cardsRef.current.children,
        { opacity: 0, y: 15, scale: 0.98 },
        { opacity: 1, y: 0, scale: 1, duration: 0.45, stagger: 0.06, ease: 'power2.out' }
      );
    },
    { scope: containerRef, dependencies: [activeHalf] }
  );

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

  return (
    <section
      ref={containerRef}
      className="glass-panel p-6 sm:p-7 rounded-3xl border border-white/10 relative overflow-hidden"
      data-enter
      aria-labelledby="journey-roadmap-title"
    >
      {/* Background Ambient Glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-accent-mint/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10 relative z-10">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-accent-mint/10 border border-accent-mint/25 flex items-center justify-center text-accent-mint shadow-[0_0_20px_rgba(52,211,153,0.15)] shrink-0">
            <Map size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 id="journey-roadmap-title" className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                Annual Journey Roadmap
              </h2>
              <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/70">
                {currentCalendarYear}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-white/60 mt-0.5">
              Navigate each month with clear intent, focused strategy, and cheerful momentum.
            </p>
          </div>
        </div>

        {/* Controls: Half-Year Toggle & Telemetry */}
        <div className="flex items-center gap-3 self-start md:self-auto flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/10 text-xs text-white/70">
            <Trophy size={14} className="text-accent-mint" />
            <span>
              <strong className="text-white font-semibold">{completedCount}</strong> of 12 Reached
            </span>
          </div>

          {/* 6-Month Half Switcher */}
          <div className="flex items-center p-1 rounded-xl bg-white/[0.04] border border-white/10">
            <button
              onClick={() => setActiveHalf('H1')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeHalf === 'H1'
                  ? 'bg-accent-mint text-midnight-950 shadow-md'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              H1 (Jan – Jun)
            </button>
            <button
              onClick={() => setActiveHalf('H2')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeHalf === 'H2'
                  ? 'bg-accent-mint text-midnight-950 shadow-md'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              H2 (Jul – Dec)
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Roadmap Container with Center Track Axis (Alternating Wave) */}
      <div className="relative mt-8 z-10">
        {/* DESKTOP ALTERNATING JOURNEY WAVE (Matches Reference Illustration) */}
        <div className="hidden lg:block relative">
          {/* TOP ROW: Stations 0, 2, 4 (e.g. Month 1, 3, 5 or 7, 9, 11) */}
          <div className="grid grid-cols-6 gap-4 items-end">
            {visibleItems.map((item, index) => {
              const isTop = index % 2 === 0;
              if (!isTop) return <div key={item.id} className="h-full" />;
              return (
                <div key={item.id} className="flex flex-col items-center w-full">
                  <MonthlyRoadmapCard
                    item={item}
                    isCurrentMonth={item.year === currentCalendarYear && item.month === currentCalendarMonth}
                    position="top"
                    onEdit={setEditingItem}
                    onToggleComplete={handleToggleComplete}
                  />
                  {/* Vertical stem connecting card to middle pin */}
                  <div className="w-0.5 h-6 border-l-2 border-dashed border-white/20" />
                </div>
              );
            })}
          </div>

          {/* MIDDLE AXIS: Continuous Timeline Track with 6 Milestone Pins */}
          <div className="relative my-1 py-2">
            <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-0.5 border-b-2 border-dashed border-white/20 z-0" />
            <div className="grid grid-cols-6 gap-4 relative z-10">
              {visibleItems.map((item) => {
                const isCurrent = item.year === currentCalendarYear && item.month === currentCalendarMonth;
                const isDone = item.status === 'completed';
                return (
                  <div key={item.id} className="flex justify-center">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-mono font-bold text-[11px] border transition-all ${
                        isDone
                          ? 'bg-emerald-500 border-emerald-300 text-midnight-950 shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                          : isCurrent
                          ? 'bg-accent-mint border-white text-midnight-950 shadow-[0_0_16px_rgba(52,211,153,0.8)] scale-110 ring-4 ring-accent-mint/20'
                          : 'bg-midnight-900 border-white/30 text-white/50'
                      }`}
                    >
                      {String(item.month).padStart(2, '0')}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* BOTTOM ROW: Stations 1, 3, 5 (e.g. Month 2, 4, 6 or 8, 10, 12) */}
          <div className="grid grid-cols-6 gap-4 items-start">
            {visibleItems.map((item, index) => {
              const isBottom = index % 2 === 1;
              if (!isBottom) return <div key={item.id} className="h-full" />;
              return (
                <div key={item.id} className="flex flex-col items-center w-full">
                  {/* Vertical stem connecting middle pin to card */}
                  <div className="w-0.5 h-6 border-l-2 border-dashed border-white/20" />
                  <MonthlyRoadmapCard
                    item={item}
                    isCurrentMonth={item.year === currentCalendarYear && item.month === currentCalendarMonth}
                    position="bottom"
                    onEdit={setEditingItem}
                    onToggleComplete={handleToggleComplete}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* MOBILE & TABLET ROADMAP (Responsive Vertical Track) */}
        <div ref={cardsRef} className="lg:hidden grid grid-cols-1 md:grid-cols-2 gap-4">
          {visibleItems.map((item) => (
            <MonthlyRoadmapCard
              key={item.id}
              item={item}
              isCurrentMonth={item.year === currentCalendarYear && item.month === currentCalendarMonth}
              position="top"
              onEdit={setEditingItem}
              onToggleComplete={handleToggleComplete}
            />
          ))}
        </div>
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
