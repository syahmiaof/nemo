import React, { useState, useEffect } from 'react';
import { X, Check, Sparkles } from 'lucide-react';
import type { MonthlyRoadmapItem, RoadmapMascot, RoadmapStatus } from '@/domain/types';
import { getMascotComponent, MASCOT_META } from './MascotIcons';

interface MonthEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  roadmapItem: MonthlyRoadmapItem | null;
  onSave: (updated: MonthlyRoadmapItem) => Promise<void>;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const MonthEditModal: React.FC<MonthEditModalProps> = ({
  isOpen,
  onClose,
  roadmapItem,
  onSave,
}) => {
  const [theme, setTheme] = useState('');
  const [primaryGoal, setPrimaryGoal] = useState('');
  const [strategy, setStrategy] = useState('');
  const [mascot, setMascot] = useState<RoadmapMascot>('rocket');
  const [status, setStatus] = useState<RoadmapStatus>('upcoming');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (roadmapItem) {
      setTheme(roadmapItem.theme);
      setPrimaryGoal(roadmapItem.primaryGoal);
      setStrategy(roadmapItem.strategy);
      setMascot(roadmapItem.mascot);
      setStatus(roadmapItem.status);
      setNotes(roadmapItem.notes || '');
    }
  }, [roadmapItem]);

  if (!isOpen || !roadmapItem) return null;

  const monthName = MONTH_NAMES[roadmapItem.month - 1];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!theme.trim() || !primaryGoal.trim() || !strategy.trim()) return;

    setIsSubmitting(true);
    try {
      const updated: MonthlyRoadmapItem = {
        ...roadmapItem,
        theme: theme.trim(),
        primaryGoal: primaryGoal.trim(),
        strategy: strategy.trim(),
        mascot,
        status,
        completedAt: status === 'completed' ? (roadmapItem.completedAt || new Date().toISOString()) : undefined,
        notes: notes.trim() || undefined,
        updatedAt: new Date().toISOString(),
      };
      await onSave(updated);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const mascotList: RoadmapMascot[] = [
    'rocket',
    'coder',
    'scholar',
    'wealth',
    'archer',
    'zen',
    'sprinter',
    'champion',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div
        className="w-full max-w-xl max-h-[90vh] overflow-y-auto glass-panel p-6 sm:p-7 rounded-2xl border border-white/10 shadow-2xl relative"
        role="dialog"
        aria-labelledby="modal-title"
      >
        <div className="flex items-start justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
              {getMascotComponent(mascot, 40)}
            </div>
            <div>
              <h2 id="modal-title" className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                {monthName} {roadmapItem.year} Roadmap
              </h2>
              <p className="text-xs text-white/50">
                Define your core ambition, daily execution rules, and mascot companion.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Theme Title */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-white/70 mb-1">
              Monthly Theme / Identity *
            </label>
            <input
              type="text"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              placeholder="e.g. Habit Reboot & Core Reset, FYP Sprint"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-sm text-white placeholder-white/30 focus:outline-none focus:border-accent-mint/70 focus:ring-1 focus:ring-accent-mint/50"
              required
            />
          </div>

          {/* Primary Goal */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-white/70 mb-1">
              Primary Goal (What You Will Achieve) *
            </label>
            <textarea
              rows={2}
              value={primaryGoal}
              onChange={(e) => setPrimaryGoal(e.target.value)}
              placeholder="e.g. Finish Semester 2 with 3.8 GPA and save RM 1,500 emergency buffer."
              className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/15 text-sm text-white placeholder-white/30 focus:outline-none focus:border-accent-mint/70 focus:ring-1 focus:ring-accent-mint/50 resize-none"
              required
            />
          </div>

          {/* Action Strategy */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-white/70 mb-1">
              Action Strategy & Daily Habits (How You Will Win) *
            </label>
            <textarea
              rows={2}
              value={strategy}
              onChange={(e) => setStrategy(e.target.value)}
              placeholder="e.g. 6am wake-up, 90m deep focus before touching phone, no snacks after 8pm."
              className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/15 text-sm text-white placeholder-white/30 focus:outline-none focus:border-accent-mint/70 focus:ring-1 focus:ring-accent-mint/50 resize-none"
              required
            />
          </div>

          {/* Mascot Picker */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-white/70 mb-2 flex items-center justify-between">
              <span>Choose Mascot Companion</span>
              <span className="text-accent-mint font-normal text-[11px] flex items-center gap-1">
                <Sparkles size={12} />
                {MASCOT_META[mascot]?.label}
              </span>
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 p-2 rounded-xl bg-white/[0.03] border border-white/10">
              {mascotList.map((m) => {
                const isSelected = mascot === m;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMascot(m)}
                    className={`flex flex-col items-center p-2 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-accent-mint/20 border-accent-mint shadow-[0_0_12px_rgba(52,211,153,0.3)] scale-105'
                        : 'border-transparent hover:bg-white/5 hover:border-white/15 opacity-70 hover:opacity-100'
                    }`}
                    title={MASCOT_META[m].desc}
                  >
                    <div className="w-10 h-10 flex items-center justify-center">
                      {getMascotComponent(m, 36, '', isSelected)}
                    </div>
                    <span className="text-[10px] mt-1 text-white/80 truncate w-full text-center">
                      {MASCOT_META[m].label.split(' ')[0]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Status Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-white/70 mb-1.5">
              Monthly Progress Status
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['upcoming', 'in_progress', 'completed'] as RoadmapStatus[]).map((st) => {
                const active = status === st;
                return (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatus(st)}
                    className={`py-2 px-3 rounded-xl border text-xs font-medium capitalize flex items-center justify-center gap-1.5 transition-all ${
                      active
                        ? st === 'completed'
                          ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                          : st === 'in_progress'
                          ? 'bg-accent-mint/20 border-accent-mint text-accent-mint shadow-[0_0_12px_rgba(52,211,153,0.3)]'
                          : 'bg-white/10 border-white/40 text-white'
                        : 'border-white/10 bg-white/[0.02] text-white/60 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {active && <Check size={14} />}
                    {st.replace('_', ' ')}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Modal Actions */}
          <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-medium text-white/70 hover:text-white hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl text-xs font-semibold text-midnight-950 bg-accent-mint hover:bg-accent-mint/90 shadow-md transition-all flex items-center gap-1.5"
            >
              {isSubmitting ? 'Saving...' : 'Save Roadmap'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
