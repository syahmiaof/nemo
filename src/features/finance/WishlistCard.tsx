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

const PRIORITY_LABELS: Record<WishlistPriority, { label: string; color: string }> = {
  high: { label: 'Keutamaan Tinggi', color: 'text-accent-amber bg-accent-amber/10 border-accent-amber/20' },
  medium: { label: 'Sederhana', color: 'text-accent-sky bg-accent-sky/10 border-accent-sky/20' },
  low: { label: 'Rendah', color: 'text-content-secondary bg-surface-solid border-border-subtle' },
};

const PRIORITY_OPTIONS = [
  { value: 'medium', label: 'Sederhana (Kehendak Biasa)' },
  { value: 'high', label: 'Keutamaan Tinggi' },
  { value: 'low', label: 'Keutamaan Rendah' },
];

const COOLING_OFF_OPTIONS = [
  { value: '7', label: '7 Hari (Barang Kecil / Aksesori)' },
  { value: '14', label: '14 Hari (Standard - Disyorkan)' },
  { value: '30', label: '30 Hari (Barang Mahal / Elektronik)' },
  { value: '0', label: 'Tiada (Keperluan Mendesak)' },
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
  const [url, setUrl] = useState('');
  const [coolingDays, setCoolingDays] = useState('14');
  const [note, setNote] = useState('');
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
    setUrl('');
    setCoolingDays('14');
    setNote('');
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = parseFloat(price);
    const coolingNum = parseInt(coolingDays, 10);

    if (!title.trim()) {
      setFormError('Sila masukkan nama barang hajat.');
      return;
    }
    if (isNaN(priceNum) || priceNum <= 0) {
      setFormError('Sila masukkan anggaran harga yang sah.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onAddWishlistItem({
        title: title.trim(),
        estimatedPrice: priceNum,
        priority,
        storeUrl: url.trim() || undefined,
        coolingOffDays: isNaN(coolingNum) ? 14 : coolingNum,
        notes: note.trim() || undefined,
      });
      setIsAddModalOpen(false);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Gagal menambah barang hajat.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-surface-elevated/70 backdrop-blur-md border border-border-subtle rounded-2xl p-5 shadow-sm space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-accent-sky/10 border border-accent-sky/20 flex items-center justify-center text-accent-sky">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-content-primary tracking-tight">
              Senarai Hajat & Anti-Impuls
            </h3>
            <p className="text-xs text-content-secondary">
              Kawalan nafsu membeli dengan tempoh bertenang (cooling-off) automatik
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={handleOpenAddModal}
          className="flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Hajat</span>
        </Button>
      </div>

      {/* Value Counter & Anti-Impulse Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="p-3.5 rounded-xl bg-surface border border-border-subtle flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-content-tertiary uppercase tracking-wider block">
              Nilai Keseluruhan Hajat Aktif
            </span>
            <span className="text-lg font-bold text-content-primary">{formatRM(totalActiveValue)}</span>
          </div>
          <Sparkles className="w-5 h-5 text-accent-sky opacity-80" />
        </div>

        <div className="p-3.5 rounded-xl bg-surface border border-border-subtle flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-content-tertiary uppercase tracking-wider block">
              Dalam Tempoh Bertenang (Cooling-off)
            </span>
            <span className="text-lg font-bold text-accent-amber">{coolingCount} barang</span>
          </div>
          <Hourglass className="w-5 h-5 text-accent-amber opacity-80" />
        </div>
      </div>

      {/* Sub-Filter Tabs */}
      <div className="flex items-center gap-1.5 border-b border-border-subtle pb-2 overflow-x-auto scrollbar-none">
        {[
          { key: 'active', label: 'Aktif (Belum Beli)' },
          { key: 'cooling', label: `Tempoh Bertenang (${coolingCount})` },
          { key: 'bought', label: 'Sudah Dibeli' },
          { key: 'all', label: 'Semua' },
        ].map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setFilter(t.key as WishlistFilter)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              filter === t.key
                ? 'bg-surface-solid border border-border-emphasis text-content-primary shadow-xs'
                : 'text-content-secondary hover:text-content-primary hover:bg-surface'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Wishlist Items List */}
      {filteredItems.length === 0 ? (
        <div className="py-10 text-center rounded-xl border border-dashed border-border-subtle bg-surface/50">
          <ShoppingBag className="w-8 h-8 mx-auto text-content-tertiary mb-2 opacity-60" />
          <p className="text-sm font-medium text-content-secondary">Tiada item hajat dalam tab ini</p>
          <p className="text-xs text-content-tertiary max-w-sm mx-auto mt-1">
            Nampak barang idaman? Letakkan di sini dan biarkan sistem menghitung tempoh bertenang sebelum anda berbelanja.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => {
            const cooling = calculateCoolingOffStatus(item);
            const priorityMeta = PRIORITY_LABELS[item.priority || 'medium'];

            return (
              <div
                key={item.id}
                className={`p-4 rounded-xl border transition-all ${
                  item.isBought
                    ? 'bg-surface/40 border-border-subtle opacity-70'
                    : 'bg-surface border-border-subtle hover:border-border-emphasis'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <button
                      type="button"
                      onClick={() => onToggleBought(item.id, !item.isBought)}
                      className="mt-0.5 text-content-tertiary hover:text-accent-mint transition-colors p-0.5"
                      title={item.isBought ? 'Tandakan belum beli' : 'Tandakan sudah dibeli'}
                    >
                      {item.isBought ? (
                        <CheckCircle2 className="w-5 h-5 text-accent-mint" />
                      ) : (
                        <Circle className="w-5 h-5 text-content-tertiary hover:text-content-secondary" />
                      )}
                    </button>

                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-sm font-bold truncate ${
                            item.isBought ? 'line-through text-content-tertiary' : 'text-content-primary'
                          }`}
                        >
                          {item.title}
                        </span>
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md border ${priorityMeta.color}`}>
                          {priorityMeta.label}
                        </span>
                        {item.targetSavingsGoalId && (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-accent-sky/10 border border-accent-sky/20 text-accent-sky flex items-center gap-1">
                            <PiggyBank className="w-3 h-3" />
                            Ditukar ke Tabung
                          </span>
                        )}
                      </div>

                      {/* Cooling-off Notice & Notes */}
                      <div className="flex items-center gap-3 text-xs text-content-tertiary flex-wrap">
                        {cooling.isCooling ? (
                          <span className="flex items-center gap-1 text-[11px] font-semibold text-accent-amber bg-accent-amber/10 border border-accent-amber/20 px-2 py-0.5 rounded-md">
                            <Hourglass className="w-3 h-3" />
                            Bertenang: {cooling.daysRemaining} hari lagi sebelum disyorkan beli
                          </span>
                        ) : !item.isBought ? (
                          <span className="flex items-center gap-1 text-[11px] font-semibold text-accent-mint bg-accent-mint/10 border border-accent-mint/20 px-2 py-0.5 rounded-md">
                            <CheckCircle2 className="w-3 h-3" />
                            Tempoh bertenang tamat ({cooling.daysElapsed} hari lalu)
                          </span>
                        ) : null}

                        {item.storeUrl && (
                          <a
                            href={item.storeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-accent-sky hover:underline"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Pautan Kedai
                          </a>
                        )}

                        {item.notes && <span className="italic">• {item.notes}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Actions & Price */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right">
                      <span className="text-sm font-bold text-content-primary block">
                        {formatRM(item.estimatedPrice)}
                      </span>
                    </div>

                    {!item.isBought && !item.targetSavingsGoalId && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setConvertId(item.id)}
                        className="text-xs text-accent-sky hover:text-accent-sky flex items-center gap-1"
                        title="Tukar ke Tabung Simpanan"
                      >
                        <PiggyBank className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Kumpul Duit</span>
                      </Button>
                    )}

                    <button
                      type="button"
                      onClick={() => setDeleteId(item.id)}
                      className="p-1.5 text-content-tertiary hover:text-accent-ember rounded-lg hover:bg-surface-solid transition-colors"
                      title="Padam barang hajat"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Wishlist Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Tambah Barang Hajat (Wishlist)"
        description="Catat barang yang anda ingin beli berserta tempoh bertenang untuk menapis pembelian emosi."
        maxWidth="md"
      >
        <form onSubmit={handleAddSubmit} className="space-y-4 pt-2">
          {formError && (
            <div className="p-3 text-xs rounded-xl bg-accent-ember/10 border border-accent-ember/20 text-accent-ember">
              {formError}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-content-secondary">Nama Barang</label>
            <Input
              type="text"
              placeholder="Contoh: Kasut Lari Nike / Monitor 4K / Beg Travel"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-content-secondary">Anggaran Harga (RM)</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="Contoh: 350.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-content-secondary">Tahap Keutamaan</label>
              <Select
                options={PRIORITY_OPTIONS}
                value={priority}
                onChange={(e) => setPriority(e.target.value as WishlistPriority)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-content-secondary">Tempoh Bertenang (Anti-Impuls)</label>
              <Select
                options={COOLING_OFF_OPTIONS}
                value={coolingDays}
                onChange={(e) => setCoolingDays(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-content-secondary">Pautan URL Kedai (Pilihan)</label>
              <Input
                type="url"
                placeholder="https://shopee.com.my/..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-content-secondary">Catatan / Alasan Ingin Beli</label>
            <Input
              type="text"
              placeholder="Kenapa saya perlukannya? Adakah alternatif percuma?"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border-subtle">
            <Button type="button" variant="ghost" onClick={() => setIsAddModalOpen(false)} disabled={isSubmitting}>
              Batal
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? 'Menyimpan...' : 'Masukkan ke Senarai'}
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
        title="Tukar Jadi Tabung Simpanan?"
        description="Sistem akan mencipta satu matlamat tabung simpanan (sinking fund) dengan sasaran harga barang ini supaya anda boleh menabung sedikit demi sedikit."
        confirmLabel="Cipta Tabung"
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
        title="Padam Barang Hajat?"
        description="Barang hajat ini akan dipadamkan daripada senarai anda."
        confirmLabel="Padam"
      />
    </div>
  );
};
