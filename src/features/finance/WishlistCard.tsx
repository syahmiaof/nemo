import React, { useState } from 'react';
import { WishlistItem, WishlistPriority } from '@/domain/types';
import { formatRM, calculateCoolingOffStatus } from './financeUtils';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import {
  ShoppingBag,
  Plus,
  Trash2,
  ExternalLink,
  Hourglass,
  PiggyBank,
  CheckCircle2,
  Circle,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';

interface WishlistCardProps {
  wishlistItems: WishlistItem[];
  onAddWishlistItem: (data: {
    title: string;
    estimatedPrice: number;
    priority?: WishlistPriority;
    storeUrl?: string;
    coolingOffDays?: number;
    notes?: string;
  }) => Promise<void>;
  onToggleBought: (id: string, isBought: boolean) => Promise<void>;
  onConvertToSavings: (id: string) => Promise<void>;
  onDeleteWishlistItem: (id: string) => Promise<void>;
}

type WishlistFilter = 'all' | 'active' | 'cooling' | 'bought';

const PRIORITY_LABELS: Record<WishlistPriority, { label: string; color: string; glow: string }> = {
  high: {
    label: 'High Priority',
    color: 'text-amber-400 bg-amber-500/15 border-amber-400/30',
    glow: 'shadow-[0_0_12px_rgba(245,158,11,0.2)]',
  },
  medium: {
    label: 'Medium Priority',
    color: 'text-sky-400 bg-sky-500/15 border-sky-400/30',
    glow: 'shadow-[0_0_12px_rgba(56,189,248,0.2)]',
  },
  low: {
    label: 'Low Priority',
    color: 'text-content-secondary bg-white/[0.04] border-white/[0.08]',
    glow: '',
  },
};

const PRIORITY_OPTIONS = [
  { value: 'medium', label: 'Medium Priority (Standard Desire)' },
  { value: 'high', label: 'High Priority (Significant Goal)' },
  { value: 'low', label: 'Low Priority (Casual Want)' },
];

const COOLING_OFF_OPTIONS = [
  { value: '7', label: '7 Days (Small accessories / Books)' },
  { value: '14', label: '14 Days (Standard Recommended Rule)' },
  { value: '30', label: '30 Days (Major Electronics / Luxury)' },
  { value: '0', label: 'None (Immediate Necessity)' },
];

export const WishlistCard: React.FC<WishlistCardProps> = ({
  wishlistItems,
  onAddWishlistItem,
  onToggleBought,
  onConvertToSavings,
  onDeleteWishlistItem,
}) => {
  const [filter, setFilter] = useState<WishlistFilter>('active');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [convertId, setConvertId] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [priority, setPriority] = useState<WishlistPriority>('medium');
  const [storeUrl, setStoreUrl] = useState('');
  const [coolingDays, setCoolingDays] = useState('14');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filtered Items
  const filteredItems = wishlistItems.filter((item) => {
    const coolingStatus = calculateCoolingOffStatus(item);
    if (filter === 'active') return !item.isBought;
    if (filter === 'cooling') return coolingStatus.isCooling;
    if (filter === 'bought') return item.isBought;
    return true;
  });

  const totalActiveValue = wishlistItems
    .filter((w) => !w.isBought)
    .reduce((sum, w) => sum + (w.estimatedPrice || 0), 0);

  const coolingCount = wishlistItems.filter((w) => calculateCoolingOffStatus(w).isCooling).length;

  const handleOpenAddModal = () => {
    setTitle('');
    setPrice('');
    setPriority('medium');
    setStoreUrl('');
    setCoolingDays('14');
    setNotes('');
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = parseFloat(price);
    const coolingNum = parseInt(coolingDays, 10);

    if (!title.trim()) {
      setFormError('Please enter a wishlist item title.');
      return;
    }
    if (isNaN(priceNum) || priceNum <= 0) {
      setFormError('Please enter a valid estimated price.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onAddWishlistItem({
        title: title.trim(),
        estimatedPrice: priceNum,
        priority,
        storeUrl: storeUrl.trim() || undefined,
        coolingOffDays: isNaN(coolingNum) ? 14 : coolingNum,
        notes: notes.trim() || undefined,
      });
      setIsAddModalOpen(false);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to add wishlist item.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#0c1527]/80 backdrop-blur-xl p-5 md:p-6 shadow-2xl relative overflow-hidden transition-all duration-300">
      {/* Background ambient lighting */}
      <div className="absolute -top-16 -right-16 w-56 h-56 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-400/30 flex items-center justify-center text-sky-400 shadow-[0_0_15px_rgba(56,189,248,0.25)]">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-content-primary flex items-center gap-2">
              Wishlist & Anti-Impulse Vault
              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                <ShieldCheck className="w-3 h-3" /> Impulse Protected
              </span>
            </h3>
            <p className="text-xs text-content-secondary">
              Curate desired purchases with automated emotional cooling-off periods to eliminate impulse buys
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenAddModal}
          className="px-3.5 py-2 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/35 text-sky-300 text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 shadow-[0_0_12px_rgba(56,189,248,0.2)]"
        >
          <Plus className="w-4 h-4" />
          <span>Add Wishlist Item</span>
        </button>
      </div>

      {/* Value Counter & Anti-Impulse Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 relative z-10">
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-content-tertiary uppercase tracking-wider block">
              Active Desires Total Value
            </span>
            <span className="text-2xl font-bold font-mono tracking-tight text-white">
              {formatRM(totalActiveValue)}
            </span>
            <span className="text-[10px] text-content-tertiary mt-1 block">Unpurchased wishlist total</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-400/20 flex items-center justify-center text-sky-400">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>

        <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-content-tertiary uppercase tracking-wider block">
              In Cooling-Off Period
            </span>
            <span className="text-2xl font-bold font-mono tracking-tight text-amber-400">
              {coolingCount} {coolingCount === 1 ? 'item' : 'items'}
            </span>
            <span className="text-[10px] text-amber-400/80 mt-1 block">Resting before purchase review</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-400/20 flex items-center justify-center text-amber-400">
            <Hourglass className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Sub-Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-white/[0.08] pb-3 mb-4 overflow-x-auto scrollbar-none relative z-10">
        {[
          { key: 'active', label: `Active Wants (${wishlistItems.filter((w) => !w.isBought).length})` },
          { key: 'cooling', label: `Cooling Down (${coolingCount})` },
          { key: 'bought', label: `Purchased (${wishlistItems.filter((w) => w.isBought).length})` },
          { key: 'all', label: `All (${wishlistItems.length})` },
        ].map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setFilter(t.key as WishlistFilter)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              filter === t.key
                ? 'bg-white/[0.08] border border-white/[0.15] text-white shadow-xs'
                : 'text-content-secondary hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Wishlist Items List */}
      {filteredItems.length === 0 ? (
        <div className="py-12 text-center rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.01] relative z-10">
          <ShoppingBag className="w-10 h-10 mx-auto text-content-tertiary mb-3 opacity-50" />
          <p className="text-sm font-semibold text-content-primary">No wishlist items in this view</p>
          <p className="text-xs text-content-secondary max-w-sm mx-auto mt-1">
            Spot something you want? Park it here and let the cooling-off vault protect your wallet from impulse spending.
          </p>
        </div>
      ) : (
        <div className="space-y-3 relative z-10">
          {filteredItems.map((item) => {
            const cooling = calculateCoolingOffStatus(item);
            const priorityMeta = PRIORITY_LABELS[item.priority || 'medium'];
            const totalCoolingDays = item.coolingOffDays ?? 14;
            const coolingProgressPercent =
              totalCoolingDays > 0
                ? Math.min(100, Math.round((cooling.daysElapsed / totalCoolingDays) * 100))
                : 100;

            return (
              <div
                key={item.id}
                className={`p-4 rounded-xl border transition-all duration-200 space-y-3 ${
                  item.isBought
                    ? 'bg-white/[0.02] border-white/[0.05] opacity-70'
                    : 'bg-white/[0.04] border-white/[0.08] hover:border-sky-400/30'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <button
                      type="button"
                      onClick={() => onToggleBought(item.id, !item.isBought)}
                      className="mt-0.5 text-content-tertiary hover:text-emerald-400 transition-colors p-0.5"
                      title={item.isBought ? 'Mark as active' : 'Mark as purchased'}
                    >
                      {item.isBought ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <Circle className="w-5 h-5 text-content-tertiary hover:text-content-secondary" />
                      )}
                    </button>

                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-sm font-bold truncate ${
                            item.isBought ? 'line-through text-content-tertiary' : 'text-white'
                          }`}
                        >
                          {item.title}
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${priorityMeta.color} ${priorityMeta.glow}`}
                        >
                          {priorityMeta.label}
                        </span>
                        {item.targetSavingsGoalId && (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 flex items-center gap-1 shadow-[0_0_10px_rgba(6,182,212,0.15)]">
                            <PiggyBank className="w-3 h-3" />
                            Target Sinking Fund Linked
                          </span>
                        )}
                      </div>

                      {/* Cooling-off Notice & Notes */}
                      <div className="flex items-center gap-3 text-xs text-content-tertiary flex-wrap">
                        {cooling.isCooling ? (
                          <span className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-md font-mono">
                            <Hourglass className="w-3 h-3" />
                            Cooling: {cooling.daysRemaining}d remaining before review ({coolingProgressPercent}%)
                          </span>
                        ) : !item.isBought ? (
                          <span className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 rounded-md">
                            <CheckCircle2 className="w-3 h-3" />
                            Cooling period complete ({cooling.daysElapsed}d elapsed) — Ready to buy
                          </span>
                        ) : null}

                        {item.storeUrl && (
                          <a
                            href={item.storeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-sky-400 hover:text-sky-300 hover:underline"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Store Page
                          </a>
                        )}

                        {item.notes && <span className="italic">• {item.notes}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Actions & Price */}
                  <div className="flex items-center justify-between sm:justify-end gap-3.5 flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/[0.04]">
                    <div className="text-left sm:text-right">
                      <span className="text-base font-bold font-mono tracking-tight text-white block">
                        {formatRM(item.estimatedPrice)}
                      </span>
                    </div>

                    {!item.isBought && !item.targetSavingsGoalId && (
                      <button
                        type="button"
                        onClick={() => setConvertId(item.id)}
                        className="px-2.5 py-1 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/30 text-cyan-300 text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 shadow-[0_0_10px_rgba(6,182,212,0.15)]"
                        title="Convert to Sinking Fund Savings Goal"
                      >
                        <PiggyBank className="w-3.5 h-3.5" />
                        <span>Save Up</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setDeleteId(item.id)}
                      className="p-1.5 text-content-tertiary hover:text-rose-400 rounded-lg hover:bg-white/[0.06] transition-colors"
                      title="Delete wishlist item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Visual Cooling Progress Bar */}
                {cooling.isCooling && (
                  <div className="w-full h-1.5 rounded-full bg-white/[0.08] overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-sky-400 rounded-full transition-all duration-500"
                      style={{ width: `${coolingProgressPercent}%` }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Wishlist Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Wishlist Item"
        description="Record an item you desire along with a cooling-off timer to eliminate impulse spending."
        maxWidth="md"
      >
        <form onSubmit={handleAddSubmit} className="space-y-4 pt-2">
          {formError && (
            <div className="p-3 text-xs rounded-xl bg-accent-ember/10 border border-accent-ember/20 text-accent-ember">
              {formError}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-content-secondary">Item Name</label>
            <Input
              type="text"
              placeholder="e.g. Sony WH-1000XM5 / 4K Monitor / Travel Backpack"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-content-secondary">Estimated Price (RM)</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="e.g. 1299.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-content-secondary">Priority Level</label>
              <Select
                options={PRIORITY_OPTIONS}
                value={priority}
                onChange={(e) => setPriority(e.target.value as WishlistPriority)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-content-secondary">Cooling-Off Rule (Anti-Impulse)</label>
              <Select
                options={COOLING_OFF_OPTIONS}
                value={coolingDays}
                onChange={(e) => setCoolingDays(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-content-secondary">Store URL (Optional)</label>
              <Input
                type="url"
                placeholder="https://shopee.com.my/..."
                value={storeUrl}
                onChange={(e) => setStoreUrl(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-content-secondary">Why do I want this? (Notes)</label>
            <Input
              type="text"
              placeholder="Will this improve productivity or health? Any free alternatives?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border-subtle">
            <Button type="button" variant="ghost" onClick={() => setIsAddModalOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Add to Wishlist'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Convert to Savings Goal Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(convertId)}
        onClose={() => setConvertId(null)}
        onConfirm={async () => {
          if (convertId) {
            await onConvertToSavings(convertId);
            setConvertId(null);
          }
        }}
        title="Convert to Sinking Fund Goal?"
        description="Nemo will create a dedicated target savings goal for this item's price so you can deposit money toward it incrementally."
        confirmLabel="Create Goal"
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={async () => {
          if (deleteId) {
            await onDeleteWishlistItem(deleteId);
            setDeleteId(null);
          }
        }}
        title="Delete Wishlist Item?"
        description="This item will be permanently removed from your wishlist vault."
        confirmLabel="Delete"
      />
    </div>
  );
};
