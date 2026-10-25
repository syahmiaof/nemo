import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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

const MASCOT_LIST: RoadmapMascot[] = [
  'rocket',
  'coder',
  'scholar',
  'wealth',
  'archer',
  'zen',
  'sprinter',
  'champion',
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

  // Handle Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent background scrolling while modal is open
  useEffect(() => {
    if (isOpen) {
      const originalStyle = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen]);

  if (!isOpen || !roadmapItem) return null;
  if (typeof document === 'undefined') return null;

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

  const modalContent = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="relative w-full max-w-lg max-h-[88vh] sm:max-h-[85vh] flex flex-col rounded-2xl sm:rounded-3xl bg-[#0c1224] border border-white/15 shadow-2xl overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Fixed Header (non-scrolling) */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between shrink-0 bg-[#0c1224]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
              {getMascotComponent(mascot, 38)}
            </div>
            <div className="min-w-0">
              <h2 id="modal-title" className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2 truncate">
                {monthName} {roadmapItem.year} Roadmap
              </h2>
              <p className="text-xs text-white/50 truncate">
                Define your core ambition, daily habits, and mascot companion.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors shrink-0 ml-2"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body + Sticky Footer */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          {/* Scrollable Form Body */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            {/* Monthly Theme Input */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-white/70 mb-1">
                Monthly Theme / Identity *
              </label>
              <input
                type="text"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                placeholder="e.g. Habit Reboot & Core Reset, FYP Sprint"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-sm text-white placeholder-white/30 focus:outline-none focus:border-accent-mint/70 focus:ring-1 focus:ring-accent-mint/50 transition-colors"
                required
              />
            </div>

            {/* Primary Goal Input (2-row textarea) */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-white/70 mb-1">
                Primary Goal (What You Will Achieve) *
              </label>
              <textarea
                rows={2}
                value={primaryGoal}
                onChange={(e) => setPrimaryGoal(e.target.value)}
                placeholder="e.g. Finish Semester 2 with 3.8 GPA and save RM 1,500 emergency buffer."
                className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/15 text-sm text-white placeholder-white/30 focus:outline-none focus:border-accent-mint/70 focus:ring-1 focus:ring-accent-mint/50 resize-none transition-colors"
                required
              />
            </div>

            {/* Action Strategy & Daily Habits (2-row textarea) */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-white/70 mb-1">
                Action Strategy & Daily Habits (How You Will Win) *
              </label>
              <textarea
                rows={2}
                value={strategy}
                onChange={(e) => setStrategy(e.target.value)}
                placeholder="e.g. 6am wake-up, 90m deep focus before touching phone, no snacks after 8pm."
                className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/15 text-sm text-white placeholder-white/30 focus:outline-none focus:border-accent-mint/70 focus:ring-1 focus:ring-accent-mint/50 resize-none transition-colors"
                required
              />
            </div>

            {/* Mascot Companion Selector (8 mascots in clean grid) */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-white/70 mb-2 flex items-center justify-between">
                <span>Choose Mascot Companion</span>
                <span className="text-accent-mint font-normal text-[11px] flex items-center gap-1">
                  <Sparkles size={12} />
                  {MASCOT_META[mascot]?.label}
                </span>
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 p-2 rounded-xl bg-white/[0.03] border border-white/10">
                {MASCOT_LIST.map((m) => {
                  const isSelected = mascot === m;
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMascot(m)}
                      className={`flex flex-col items-center p-1.5 sm:p-2 rounded-xl border transition-all ${
                        isSelected
                          ? 'bg-accent-mint/20 border-accent-mint shadow-[0_0_12px_rgba(52,211,153,0.3)] scale-105'
                          : 'border-transparent hover:bg-white/5 hover:border-white/15 opacity-70 hover:opacity-100'
                      }`}
                      title={MASCOT_META[m].desc}
                      aria-label={MASCOT_META[m].label}
                    >
                      <div className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center">
                        {getMascotComponent(m, 32, '', isSelected)}
                      </div>
                      <span className="text-[10px] mt-1 text-white/80 truncate w-full text-center">
                        {MASCOT_META[m].label.split(' ')[0]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Monthly Status Selector */}
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
          </div>

          {/* Fixed Footer (non-scrolling) */}
          <div className="px-5 py-3.5 border-t border-white/10 flex items-center justify-end gap-3 bg-[#0a0f1d] shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-medium text-white/70 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl text-xs font-semibold text-midnight-950 bg-accent-mint hover:bg-accent-mint/90 shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save Roadmap'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
