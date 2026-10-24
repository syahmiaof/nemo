import React, { useState } from 'react';
import { FinancialCommitment, FinancialCommitmentCategory } from '@/domain/types';
import { formatRM } from './financeUtils';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import {
  CalendarDays,
  CheckCircle2,
  Circle,
  Home,
  Plus,
  Shield,
  Trash2,
  Tv,
  Zap,
  AlertCircle,
} from 'lucide-react';

interface MonthlyCommitmentsCardProps {
  commitments: FinancialCommitment[];
  onAddCommitment: (data: {
    title: string;
    amount: number;
    category: FinancialCommitmentCategory;
    dueDayOfMonth: number;
    notes?: string;
  }) => Promise<void>;
  onTogglePaid: (id: string, isPaid: boolean) => Promise<void>;
  onDeleteCommitment: (id: string) => Promise<void>;
}

const CATEGORY_ICONS: Record<FinancialCommitmentCategory, React.ElementType> = {
  needs: Home,
  utilities: Zap,
  lifestyle: Tv,
  protection: Shield,
  other: CalendarDays,
};

const CATEGORY_LABELS: Record<FinancialCommitmentCategory, string> = {
  needs: 'Keperluan Asas (Sewa / Rumah)',
  utilities: 'Utiliti (Air / Elektrik / Internet)',
  lifestyle: 'Gaya Hidup (Langganan / Gim)',
  protection: 'Perlindungan (Takaful / Insurans)',
  other: 'Lain-lain',
};

const CATEGORY_OPTIONS = [
  { value: 'needs', label: 'Keperluan Asas (Sewa / Rumah)' },
  { value: 'utilities', label: 'Utiliti (Air / Elektrik / Internet)' },
  { value: 'lifestyle', label: 'Gaya Hidup (Langganan / Gim)' },
  { value: 'protection', label: 'Perlindungan (Takaful / Insurans)' },
  { value: 'other', label: 'Lain-lain' },
];

export const MonthlyCommitmentsCard: React.FC<MonthlyCommitmentsCardProps> = ({
  commitments,
  onAddCommitment,
  onTogglePaid,
  onDeleteCommitment,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<FinancialCommitmentCategory>('utilities');
  const [dueDay, setDueDay] = useState('15');
  const [note, setNote] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Aggregations
  const totalBurn = commitments.reduce((sum, c) => sum + (c.amount || 0), 0);
  const totalPaid = commitments
    .filter((c) => c.isPaidThisMonth)
    .reduce((sum, c) => sum + (c.amount || 0), 0);
  const totalUnpaid = totalBurn - totalPaid;

  const handleOpenAddModal = () => {
    setTitle('');
    setAmount('');
    setCategory('utilities');
    setDueDay('15');
    setNote('');
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(amount);
    const dueDayNum = parseInt(dueDay, 10);

    if (!title.trim()) {
      setFormError('Sila masukkan nama komitmen.');
      return;
    }
    if (isNaN(amountNum) || amountNum <= 0) {
      setFormError('Sila masukkan jumlah komitmen yang sah.');
      return;
    }
    if (isNaN(dueDayNum) || dueDayNum < 1 || dueDayNum > 31) {
      setFormError('Hari tamat tempoh mestilah antara 1 hingga 31.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onAddCommitment({
        title: title.trim(),
        amount: amountNum,
        category,
        dueDayOfMonth: dueDayNum,
        notes: note.trim() || undefined,
      });
      setIsAddModalOpen(false);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Gagal menambah komitmen.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentDay = new Date().getDate();

  return (
    <div className="bg-surface-elevated/70 backdrop-blur-md border border-border-subtle rounded-2xl p-5 shadow-sm space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-accent-amber/10 border border-accent-amber/20 flex items-center justify-center text-accent-amber">
            <CalendarDays className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-content-primary tracking-tight">
              Komitmen Bulanan & Bil
            </h3>
            <p className="text-xs text-content-secondary">
              Bil utiliti, sewa, langganan dan bayaran tetap wajib bulanan
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
          <span>Tambah Komitmen</span>
        </Button>
      </div>

      {/* Burn Rate Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl bg-surface border border-border-subtle">
          <span className="text-[11px] font-medium text-content-tertiary uppercase tracking-wider block">
            Jumlah Komitmen
          </span>
          <span className="text-lg font-bold text-content-primary">{formatRM(totalBurn)}</span>
        </div>
        <div className="p-3.5 rounded-xl bg-surface border border-border-subtle">
          <span className="text-[11px] font-medium text-content-tertiary uppercase tracking-wider block">
            Sudah Dibayar (Lunas)
          </span>
          <span className="text-lg font-bold text-accent-mint">{formatRM(totalPaid)}</span>
        </div>
        <div className="p-3.5 rounded-xl bg-surface border border-border-subtle">
          <span className="text-[11px] font-medium text-content-tertiary uppercase tracking-wider block">
            Baki Belum Dibayar
          </span>
          <span className={`text-lg font-bold ${totalUnpaid > 0 ? 'text-accent-amber' : 'text-content-primary'}`}>
            {formatRM(totalUnpaid)}
          </span>
        </div>
      </div>

      {/* Commitments List */}
      {commitments.length === 0 ? (
        <div className="py-10 text-center rounded-xl border border-dashed border-border-subtle bg-surface/50">
          <CalendarDays className="w-8 h-8 mx-auto text-content-tertiary mb-2 opacity-60" />
          <p className="text-sm font-medium text-content-secondary">Tiada komitmen bulanan didaftarkan</p>
          <p className="text-xs text-content-tertiary max-w-sm mx-auto mt-1">
            Klik butang &quot;Tambah Komitmen&quot; di atas untuk mula merekodkan sewa, bil utiliti, wifi, atau takaful.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {commitments.map((item) => {
            const Icon = CATEGORY_ICONS[item.category] || CalendarDays;
            const isDueSoon = !item.isPaidThisMonth && item.dueDayOfMonth >= currentDay && item.dueDayOfMonth - currentDay <= 3;
            const isOverdue = !item.isPaidThisMonth && item.dueDayOfMonth < currentDay;

            return (
              <div
                key={item.id}
                className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                  item.isPaidThisMonth
                    ? 'bg-surface/40 border-border-subtle opacity-75'
                    : 'bg-surface border-border-subtle hover:border-border-emphasis'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    type="button"
                    onClick={() => onTogglePaid(item.id, !item.isPaidThisMonth)}
                    className="flex-shrink-0 text-content-tertiary hover:text-accent-mint transition-colors p-1"
                    title={item.isPaidThisMonth ? 'Tandakan belum dibayar' : 'Tandakan sudah dibayar'}
                  >
                    {item.isPaidThisMonth ? (
                      <CheckCircle2 className="w-5 h-5 text-accent-mint" />
                    ) : (
                      <Circle className="w-5 h-5 text-content-tertiary hover:text-content-secondary" />
                    )}
                  </button>

                  <div className="w-8 h-8 rounded-lg bg-surface-solid border border-border-subtle flex items-center justify-center flex-shrink-0 text-content-secondary">
                    <Icon className="w-4 h-4" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-sm font-semibold truncate ${
                          item.isPaidThisMonth ? 'line-through text-content-tertiary' : 'text-content-primary'
                        }`}
                      >
                        {item.title}
                      </span>
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-surface-solid border border-border-subtle text-content-secondary">
                        {CATEGORY_LABELS[item.category]}
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5 text-xs text-content-tertiary mt-0.5">
                      <span>Tarikh akhir: {item.dueDayOfMonth}hb setiap bulan</span>
                      {isDueSoon && (
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-accent-amber">
                          <AlertCircle className="w-3 h-3" />
                          Hampir tiba
                        </span>
                      )}
                      {isOverdue && (
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-accent-ember">
                          <AlertCircle className="w-3 h-3" />
                          Melepasi tarikh
                        </span>
                      )}
                      {item.notes && <span className="truncate italic">• {item.notes}</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-right">
                    <span
                      className={`text-sm font-bold block ${
                        item.isPaidThisMonth ? 'text-content-tertiary' : 'text-content-primary'
                      }`}
                    >
                      {formatRM(item.amount)}
                    </span>
                    <span className="text-[10px] font-medium text-content-tertiary block">
                      {item.isPaidThisMonth ? 'Lunas Bulan Ini' : 'Belum Dibayar'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setDeleteId(item.id)}
                    className="p-1.5 text-content-tertiary hover:text-accent-ember rounded-lg hover:bg-surface-solid transition-colors"
                    title="Padam komitmen"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Commitment Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Tambah Komitmen Bulanan"
        description="Masukkan butiran bil atau perbelanjaan tetap yang perlu dijelaskan setiap bulan."
        maxWidth="md"
      >
        <form onSubmit={handleFormSubmit} className="space-y-4 pt-2">
          {formError && (
            <div className="p-3 text-xs rounded-xl bg-accent-ember/10 border border-accent-ember/20 text-accent-ember">
              {formError}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-content-secondary">Nama Komitmen / Bil</label>
            <Input
              type="text"
              placeholder="Contoh: Sewa Rumah / TNB / Time Internet"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-content-secondary">Jumlah (RM)</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="Contoh: 150.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-content-secondary">Kategori</label>
              <Select
                options={CATEGORY_OPTIONS}
                value={category}
                onChange={(e) => setCategory(e.target.value as FinancialCommitmentCategory)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-content-secondary">Tarikh Akhir Setiap Bulan (1 - 31hb)</label>
              <Input
                type="number"
                min="1"
                max="31"
                placeholder="15"
                value={dueDay}
                onChange={(e) => setDueDay(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-content-secondary">Catatan (Pilihan)</label>
              <Input
                type="text"
                placeholder="No akaun bil / autodebit"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border-subtle">
            <Button type="button" variant="ghost" onClick={() => setIsAddModalOpen(false)} disabled={isSubmitting}>
              Batal
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? 'Menyimpan...' : 'Tambah Komitmen'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={async () => {
          if (deleteId) {
            await onDeleteCommitment(deleteId);
            setDeleteId(null);
          }
        }}
        title="Padam Komitmen?"
        description="Komitmen ini akan dipadamkan daripada rekod bulanan anda secara kekal."
        confirmLabel="Padam"
      />
    </div>
  );
};
