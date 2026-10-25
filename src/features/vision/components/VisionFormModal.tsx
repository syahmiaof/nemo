import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Sparkles,
  Image as ImageIcon,
  Calendar,
  DollarSign,
  Target,
  PiggyBank,
  Check,
  Compass,
} from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/nemoDb';
import { suggestImagesForVision, type VisionImagePreset } from '../lib/imageSuggester';
import type { VisionItem, VisionHorizon, VisionCategory, VisionStatus } from '@/domain/types';

interface VisionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: VisionItem | null;
  onSave: (item: Omit<VisionItem, 'createdAt' | 'updatedAt'>) => Promise<void>;
}

export const VisionFormModal: React.FC<VisionFormModalProps> = ({
  isOpen,
  onClose,
  initialData,
  onSave,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageThumbnailUrl, setImageThumbnailUrl] = useState('');
  const [horizon, setHorizon] = useState<VisionHorizon>('mid_term');
  const [category, setCategory] = useState<VisionCategory>('wealth_finance');
  const [targetDate, setTargetDate] = useState('');
  const [estimatedCost, setEstimatedCost] = useState<string>('');
  const [linkedGoalId, setLinkedGoalId] = useState('');
  const [linkedSavingsGoalId, setLinkedSavingsGoalId] = useState('');
  const [whyItMatters, setWhyItMatters] = useState('');
  const [status, setStatus] = useState<VisionStatus>('dreaming');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch available Goals and Savings Goals for linking
  const availableGoals = useLiveQuery(() => db.goals.toArray(), []) || [];
  const availableSavings = useLiveQuery(() => db.savingsGoals.toArray(), []) || [];

  // Auto-suggest images whenever title or category changes
  const suggestedImages = useMemo(() => {
    return suggestImagesForVision(title, category);
  }, [title, category]);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setDescription(initialData.description || '');
      setImageUrl(initialData.imageUrl || '');
      setImageThumbnailUrl(initialData.imageThumbnailUrl || '');
      setHorizon(initialData.horizon || 'mid_term');
      setCategory(initialData.category || 'wealth_finance');
      setTargetDate(initialData.targetDate || '');
      setEstimatedCost(initialData.estimatedCost ? String(initialData.estimatedCost) : '');
      setLinkedGoalId(initialData.linkedGoalId || '');
      setLinkedSavingsGoalId(initialData.linkedSavingsGoalId || '');
      setWhyItMatters(initialData.whyItMatters || '');
      setStatus(initialData.status || 'dreaming');
    } else {
      // Reset form with a versatile default
      setTitle('');
      setDescription('');
      const defaultSuggestions = suggestImagesForVision('', 'wealth_finance');
      const firstPreset = defaultSuggestions[0];
      setImageUrl(firstPreset ? firstPreset.url : '');
      setImageThumbnailUrl(firstPreset ? firstPreset.thumbnailUrl : '');
      setHorizon('mid_term');
      setCategory('wealth_finance');
      setTargetDate('');
      setEstimatedCost('');
      setLinkedGoalId('');
      setLinkedSavingsGoalId('');
      setWhyItMatters('');
      setStatus('dreaming');
    }
    setErrorMsg('');
  }, [initialData, isOpen]);

  // When user is creating a new vision and typing title, auto-select first top match if user hasn't chosen custom
  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!initialData && val.trim().length >= 3) {
      const topMatches = suggestImagesForVision(val, category);
      if (topMatches.length > 0 && (!imageUrl || suggestedImages.some((s) => s.url === imageUrl))) {
        setImageUrl(topMatches[0].url);
        setImageThumbnailUrl(topMatches[0].thumbnailUrl);
      }
    }
  };

  const handleSelectPreset = (preset: VisionImagePreset) => {
    setImageUrl(preset.url);
    setImageThumbnailUrl(preset.thumbnailUrl);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Please enter a dream or vision title.');
      return;
    }
    if (!imageUrl.trim()) {
      setErrorMsg('Please select or provide an image URL for your vision board.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg('');

      const numericCost = estimatedCost.trim() ? parseFloat(estimatedCost) : undefined;

      await onSave({
        id: initialData?.id || `vis_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        title: title.trim(),
        description: description.trim() || undefined,
        imageUrl: imageUrl.trim(),
        imageThumbnailUrl: imageThumbnailUrl.trim() || undefined,
        horizon,
        category,
        targetDate: targetDate.trim() || undefined,
        estimatedCost: numericCost && !isNaN(numericCost) ? numericCost : undefined,
        linkedGoalId: linkedGoalId || undefined,
        linkedSavingsGoalId: linkedSavingsGoalId || undefined,
        whyItMatters: whyItMatters.trim() || undefined,
        status,
        manifestedAt:
          status === 'manifested' ? initialData?.manifestedAt || new Date().toISOString() : undefined,
        order: initialData?.order ?? 0,
      });

      onClose();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Could not save vision item.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-md overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="vision-modal-title"
    >
      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col rounded-3xl bg-[#0d1326] border border-white/10 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-accent-mint/15 text-accent-mint border border-accent-mint/30">
              <Compass size={18} />
            </span>
            <div>
              <h2 id="vision-modal-title" className="text-lg font-semibold text-slate-100 tracking-tight">
                {initialData ? 'Refine Vision' : 'Anchor New Vision'}
              </h2>
              <p className="text-xs text-slate-400">
                Visualize your ambition clearly and bridge it to execution.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors"
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
              {errorMsg}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Dream or Vision Title <span className="text-accent-mint">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="e.g. Honda Civic RS, Japan Cherry Blossom Tour, Aesthetic Studio Desk"
              className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-accent-mint transition-colors"
              required
              autoFocus
            />
          </div>

          {/* Time Horizon & Category Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Time Horizon <span className="text-accent-mint">*</span>
              </label>
              <select
                value={horizon}
                onChange={(e) => setHorizon(e.target.value as VisionHorizon)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-slate-100 text-sm focus:outline-none focus:border-accent-mint transition-colors"
              >
                <option value="short_term" className="bg-slate-900 text-slate-100">
                  Short-term (3 Months)
                </option>
                <option value="mid_term" className="bg-slate-900 text-slate-100">
                  Mid-term (6 Months – 1 Year)
                </option>
                <option value="long_term" className="bg-slate-900 text-slate-100">
                  Long-term (2 – 5 Years)
                </option>
                <option value="north_star" className="bg-slate-900 text-slate-100">
                  North Star (Lifetime Aspiration)
                </option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as VisionCategory)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-slate-100 text-sm focus:outline-none focus:border-accent-mint transition-colors"
              >
                <option value="wealth_finance" className="bg-slate-900 text-slate-100">
                  Wealth & Finance
                </option>
                <option value="career_tech" className="bg-slate-900 text-slate-100">
                  Career & Tech
                </option>
                <option value="travel_adventure" className="bg-slate-900 text-slate-100">
                  Travel & Adventure
                </option>
                <option value="health_lifestyle" className="bg-slate-900 text-slate-100">
                  Health & Lifestyle
                </option>
                <option value="personal_spiritual" className="bg-slate-900 text-slate-100">
                  Personal & Spiritual
                </option>
                <option value="other" className="bg-slate-900 text-slate-100">
                  Other
                </option>
              </select>
            </div>
          </div>

          {/* Auto Image Suggestions Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-slate-300 inline-flex items-center gap-1.5">
                <Sparkles size={14} className="text-amber-400" />
                <span>Auto-Suggested Imagery</span>
              </label>
              <span className="text-[11px] text-slate-400">Click image to select</span>
            </div>

            {/* Presets Grid */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {suggestedImages.map((preset) => {
                const isSelected = imageUrl === preset.url;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`group relative aspect-[4/3] rounded-xl overflow-hidden border transition-all ${
                      isSelected
                        ? 'border-accent-mint ring-2 ring-accent-mint/40 scale-95 shadow-md'
                        : 'border-white/10 hover:border-white/30 opacity-75 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={preset.thumbnailUrl}
                      alt={preset.title}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                    {isSelected && (
                      <div className="absolute inset-0 bg-accent-mint/30 flex items-center justify-center">
                        <span className="p-1 rounded-full bg-accent-mint text-slate-950">
                          <Check size={12} strokeWidth={3} />
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Direct Image URL input */}
            <div className="pt-2">
              <label className="block text-[11px] text-slate-400 mb-1">
                Or paste custom Image URL
              </label>
              <div className="relative">
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => {
                    setImageUrl(e.target.value);
                    setImageThumbnailUrl(e.target.value);
                  }}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3.5 py-2 pl-9 rounded-xl bg-white/[0.03] border border-white/10 text-slate-200 text-xs focus:outline-none focus:border-accent-mint"
                />
                <ImageIcon
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                />
              </div>
            </div>
          </div>

          {/* "Why It Matters" Motivation Anchor */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Why It Matters (Your Motivation Anchor)
            </label>
            <textarea
              value={whyItMatters}
              onChange={(e) => setWhyItMatters(e.target.value)}
              placeholder="e.g. Giving my family comfort and having true location freedom by age 30."
              rows={2}
              className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-accent-mint transition-colors resize-none"
            />
          </div>

          {/* Actionable Bridges Grid (Goal & Savings Linking) */}
          <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-4 space-y-4">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Actionable Bridges (Make it Achievable)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Link to Goal */}
              <div>
                <label className="block text-xs text-slate-400 mb-1 inline-flex items-center gap-1.5">
                  <Target size={13} className="text-accent-mint" />
                  <span>Connect to Goal</span>
                </label>
                <select
                  value={linkedGoalId}
                  onChange={(e) => setLinkedGoalId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-slate-100 text-xs focus:outline-none focus:border-accent-mint"
                >
                  <option value="" className="bg-slate-900 text-slate-400">
                    -- No goal linked --
                  </option>
                  {availableGoals.map((g) => (
                    <option key={g.id} value={g.id} className="bg-slate-900 text-slate-100">
                      {g.title} ({g.status})
                    </option>
                  ))}
                </select>
              </div>

              {/* Link to Savings Goal */}
              <div>
                <label className="block text-xs text-slate-400 mb-1 inline-flex items-center gap-1.5">
                  <PiggyBank size={13} className="text-sky-400" />
                  <span>Connect to Sinking Fund</span>
                </label>
                <select
                  value={linkedSavingsGoalId}
                  onChange={(e) => setLinkedSavingsGoalId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-slate-100 text-xs focus:outline-none focus:border-accent-mint"
                >
                  <option value="" className="bg-slate-900 text-slate-400">
                    -- No fund linked --
                  </option>
                  {availableSavings.map((s) => (
                    <option key={s.id} value={s.id} className="bg-slate-900 text-slate-100">
                      {s.title} (RM {s.currentAmount} / RM {s.targetAmount})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Target Date & Estimated Cost */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-xs text-slate-400 mb-1 inline-flex items-center gap-1.5">
                  <Calendar size={13} />
                  <span>Target Date</span>
                </label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-slate-100 text-xs focus:outline-none focus:border-accent-mint"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1 inline-flex items-center gap-1.5">
                  <DollarSign size={13} />
                  <span>Estimated Cost (RM)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={estimatedCost}
                  onChange={(e) => setEstimatedCost(e.target.value)}
                  placeholder="e.g. 15000"
                  className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-slate-100 text-xs focus:outline-none focus:border-accent-mint"
                />
              </div>
            </div>
          </div>

          {/* Status (if editing) */}
          {initialData && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Current Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as VisionStatus)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-slate-100 text-sm focus:outline-none focus:border-accent-mint"
              >
                <option value="dreaming" className="bg-slate-900 text-slate-100">
                  Dreaming (Visualized)
                </option>
                <option value="in_progress" className="bg-slate-900 text-slate-100">
                  In Progress (Actionable)
                </option>
                <option value="manifested" className="bg-slate-900 text-slate-100">
                  ✨ Manifested (Achieved!)
                </option>
              </select>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent-mint text-slate-950 font-semibold text-xs shadow-lg hover:bg-accent-mint/90 active:scale-95 transition-all disabled:opacity-50"
            >
              <Sparkles size={14} />
              <span>{submitting ? 'Saving...' : initialData ? 'Save Changes' : 'Anchor Vision'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
