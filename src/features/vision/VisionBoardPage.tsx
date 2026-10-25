import { useState, useMemo, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  Compass,
  Plus,
  Target,
  Trophy,
  DollarSign,
} from 'lucide-react';
import gsap from 'gsap';
import { db } from '@/db/nemoDb';
import { useToast } from '@/components/ui/Toast';
import { PageHeading } from '@/components/ui/PageHeading';
import { VisionCard } from './components/VisionCard';
import { VisionFormModal } from './components/VisionFormModal';
import type { VisionItem } from '@/domain/types';

export function VisionBoardPage() {
  const { success, error } = useToast();
  const [selectedHorizon, setSelectedHorizon] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<VisionItem | null>(null);
  const celebrationRef = useRef<HTMLDivElement>(null);

  // Live query for vision items, fallback to empty array if table not yet loaded
  const visionItems = useLiveQuery(
    () => ((db as any).visionItems ? (db as any).visionItems.toArray() : []),
    []
  ) || [];

  // Metrics summary
  const metrics = useMemo(() => {
    const total = visionItems.length;
    const active = visionItems.filter((v: VisionItem) => v.status !== 'manifested').length;
    const manifested = visionItems.filter((v: VisionItem) => v.status === 'manifested').length;
    const totalEstimatedCost = visionItems
      .filter((v: VisionItem) => typeof v.estimatedCost === 'number' && v.estimatedCost! > 0)
      .reduce((sum: number, v: VisionItem) => sum + (v.estimatedCost || 0), 0);

    const linkedToGoalCount = visionItems.filter((v: VisionItem) => !!v.linkedGoalId).length;
    const linkedToSavingsCount = visionItems.filter((v: VisionItem) => !!v.linkedSavingsGoalId).length;

    return {
      total,
      active,
      manifested,
      totalEstimatedCost,
      linkedToGoalCount,
      linkedToSavingsCount,
    };
  }, [visionItems]);

  // Filtered items based on Horizon Tab and Category
  const filteredItems = useMemo(() => {
    return visionItems.filter((item: VisionItem) => {
      // Horizon filter
      if (selectedHorizon === 'manifested') {
        if (item.status !== 'manifested') return false;
      } else if (selectedHorizon !== 'all') {
        if (item.horizon !== selectedHorizon) return false;
        if (item.status === 'manifested') return false; // Show in hall of manifestations
      }

      // Category filter
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }

      return true;
    });
  }, [visionItems, selectedHorizon, selectedCategory]);

  // Celebration particle burst on manifestation
  const triggerCelebration = (title: string) => {
    if (!celebrationRef.current) return;
    const container = celebrationRef.current;
    container.innerHTML = '';

    // Create 30 golden confetti spark particles
    const colors = ['#f59e0b', '#fbbf24', '#34d399', '#38bdf8', '#a78bfa', '#ffffff'];
    for (let i = 0; i < 30; i++) {
      const p = document.createElement('div');
      p.className = 'fixed pointer-events-none rounded-full z-50';
      const size = Math.random() * 8 + 6;
      p.style.width = `${size}px`;
      p.style.height = `${size}px`;
      p.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      p.style.left = '50%';
      p.style.top = '45%';
      container.appendChild(p);

      const angle = Math.random() * Math.PI * 2;
      const velocity = Math.random() * 300 + 120;
      const destX = Math.cos(angle) * velocity;
      const destY = Math.sin(angle) * velocity + Math.random() * 80;

      gsap.to(p, {
        x: destX,
        y: destY,
        opacity: 0,
        scale: Math.random() * 1.5 + 0.5,
        rotation: Math.random() * 720 - 360,
        duration: Math.random() * 1.2 + 0.8,
        ease: 'power3.out',
        onComplete: () => p.remove(),
      });
    }

    success('✨ Dream Manifested!', `Congratulations on achieving: "${title}"! Archived to Hall of Manifestations.`);
  };

  const handleSave = async (data: Omit<VisionItem, 'createdAt' | 'updatedAt'>) => {
    try {
      const now = new Date().toISOString();
      const existing = await (db as any).visionItems.get(data.id);

      if (existing) {
        await (db as any).visionItems.update(data.id, {
          ...data,
          updatedAt: now,
        });
        success('Vision updated', `"${data.title}" was saved.`);
      } else {
        await (db as any).visionItems.add({
          ...data,
          createdAt: now,
          updatedAt: now,
        });
        success('Vision anchored', `"${data.title}" added to your vision board.`);
      }
    } catch (e) {
      error('Failed to save vision', e instanceof Error ? e.message : 'Please retry.');
      throw e;
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const item = await (db as any).visionItems.get(id);
      if (item) {
        await (db as any).visionItems.delete(id);
        success('Vision removed', `"${item.title}" removed.`);
      }
    } catch {
      error('Could not delete vision item');
    }
  };

  const handleManifest = async (item: VisionItem) => {
    try {
      const now = new Date().toISOString();
      await (db as any).visionItems.update(item.id, {
        status: 'manifested',
        manifestedAt: now,
        updatedAt: now,
      });
      triggerCelebration(item.title);
    } catch {
      error('Could not mark vision as manifested');
    }
  };

  const horizonTabs = [
    { id: 'all', label: 'All Visions', count: metrics.active },
    {
      id: 'short_term',
      label: 'Short-term (3M)',
      count: visionItems.filter((v: VisionItem) => v.horizon === 'short_term' && v.status !== 'manifested').length,
    },
    {
      id: 'mid_term',
      label: 'Mid-term (6M-1Y)',
      count: visionItems.filter((v: VisionItem) => v.horizon === 'mid_term' && v.status !== 'manifested').length,
    },
    {
      id: 'long_term',
      label: 'Long-term (2-5Y)',
      count: visionItems.filter((v: VisionItem) => v.horizon === 'long_term' && v.status !== 'manifested').length,
    },
    {
      id: 'north_star',
      label: 'North Star',
      count: visionItems.filter((v: VisionItem) => v.horizon === 'north_star' && v.status !== 'manifested').length,
    },
    {
      id: 'manifested',
      label: '✨ Manifested',
      count: metrics.manifested,
    },
  ];

  const categories: Array<{ id: string; label: string }> = [
    { id: 'all', label: 'All Categories' },
    { id: 'wealth_finance', label: 'Wealth & Finance' },
    { id: 'career_tech', label: 'Career & Tech' },
    { id: 'travel_adventure', label: 'Travel & Adventure' },
    { id: 'health_lifestyle', label: 'Health & Lifestyle' },
    { id: 'personal_spiritual', label: 'Personal & Spiritual' },
  ];

  return (
    <div className="space-y-7 pb-16">
      {/* Container for celebratory particle burst */}
      <div ref={celebrationRef} className="fixed inset-0 pointer-events-none z-50 overflow-hidden" />

      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeading
          title="Dare to visualize."
          description="Keep your ambitions tangible, actionable, and top-of-mind across all horizons."
        />

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => {
              setEditingItem(null);
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent-mint hover:bg-accent-mint/90 text-slate-950 font-semibold text-xs shadow-lg shadow-accent-mint/10 transition-all active:scale-95"
          >
            <Plus size={16} />
            <span>Add Dream / Vision</span>
          </button>
        </div>
      </div>

      {/* High-Level Telemetry Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-accent-mint/15 text-accent-mint border border-accent-mint/20">
            <Compass size={20} />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-100">{metrics.active}</div>
            <div className="text-xs text-slate-400">Active Visions</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/20">
            <Trophy size={20} />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-100">{metrics.manifested}</div>
            <div className="text-xs text-slate-400">Manifested Dreams</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-sky-500/15 text-sky-400 border border-sky-500/20">
            <DollarSign size={20} />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-100">
              RM {metrics.totalEstimatedCost.toLocaleString()}
            </div>
            <div className="text-xs text-slate-400">Total Ambition Value</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/20">
            <Target size={20} />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-100">
              {metrics.linkedToGoalCount + metrics.linkedToSavingsCount}
            </div>
            <div className="text-xs text-slate-400">Action Bridges Active</div>
          </div>
        </div>
      </div>

      {/* Horizon Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-4">
        {horizonTabs.map((tab) => {
          const isActive = selectedHorizon === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedHorizon(tab.id)}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                isActive
                  ? 'bg-accent-mint/15 text-accent-mint border border-accent-mint/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[11px] px-1.5 py-0.2 rounded-full font-mono ${
                  isActive ? 'bg-accent-mint/20 text-accent-mint' : 'bg-white/10 text-slate-400'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Category Pills Filter */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-xs text-slate-500 mr-1">Filter:</span>
        {categories.map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-white/15 text-slate-100 border border-white/20'
                  : 'text-slate-400 hover:text-slate-300 hover:bg-white/5'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Cards Grid or Empty State */}
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item: VisionItem) => (
            <VisionCard
              key={item.id}
              item={item}
              onEdit={(v) => {
                setEditingItem(v);
                setIsModalOpen(true);
              }}
              onDelete={handleDelete}
              onManifest={handleManifest}
            />
          ))}
        </div>
      ) : (
        <div className="py-16 px-6 text-center rounded-3xl bg-white/[0.02] border border-white/5 flex flex-col items-center justify-center">
          <div className="p-3.5 rounded-2xl bg-white/[0.04] text-slate-400 mb-3 border border-white/10">
            <Compass size={28} className="text-accent-mint/70" />
          </div>
          <h3 className="text-base font-semibold text-slate-200">
            {selectedHorizon === 'manifested'
              ? 'No manifested visions yet'
              : 'Your vision board is waiting for you'}
          </h3>
          <p className="mt-1.5 text-xs text-slate-400 max-w-sm">
            {selectedHorizon === 'manifested'
              ? 'When you achieve and check off a dream, it will be celebrated and enshrined here in the Hall of Manifestations.'
              : 'Add your short-term, mid-term, or long-term dreams with auto-suggested imagery and connect them to active goals.'}
          </p>
          {selectedHorizon !== 'manifested' && (
            <button
              onClick={() => {
                setEditingItem(null);
                setIsModalOpen(true);
              }}
              className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-accent-mint hover:bg-accent-mint/90 text-slate-950 font-semibold text-xs shadow-md transition-all active:scale-95"
            >
              <Plus size={15} />
              <span>Add Your First Vision</span>
            </button>
          )}
        </div>
      )}

      {/* Modal Dialog */}
      <VisionFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        initialData={editingItem}
        onSave={handleSave}
      />
    </div>
  );
}
