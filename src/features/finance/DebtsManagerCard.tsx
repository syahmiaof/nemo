import React, { useState } from 'react';
import { DebtItem, DebtPayment, DebtPriority } from '@/domain/types';
import { formatRM, calculateDebtPayoffProjection } from './financeUtils';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import {
  CreditCard,
  Plus,
  Trash2,
  TrendingDown,
  Building,
  Flame,
  Snowflake,
  ShieldAlert,
} from 'lucide-react';

interface DebtsManagerCardProps {
  debts: DebtItem[];
  payments: DebtPayment[];
  onAddDebt: (data: {
    title: string;
    creditor: string;
    originalPrincipal: number;
    currentBalance: number;
    interestRatePercent?: number;
    monthlyInstallment: number;
    priority?: DebtPriority;
    targetPayoffDate?: string;
    notes?: string;
  }) => Promise<void>;
  onRecordPayment: (data: {
    debtId: string;
    amount: number;
    paidAt?: string;
    note?: string;
  }) => Promise<void>;
  onDeleteDebt: (id: string) => Promise<void>;
}

const PRIORITY_LABELS: Record<DebtPriority, { label: string; icon: React.ElementType; color: string }> = {
  snowball: { label: 'Snowball (Baki Rendah)', icon: Snowflake, color: 'text-accent-sky bg-accent-sky/10 border-accent-sky/20' },
  avalanche: { label: 'Avalanche (Kadar Tinggi)', icon: Flame, color: 'text-accent-ember bg-accent-ember/10 border-accent-ember/20' },
  normal: { label: 'Normal / Standard', icon: ShieldAlert, color: 'text-content-secondary bg-surface-solid border-border-subtle' },
};

const PRIORITY_OPTIONS = [
  { value: 'snowball', label: 'Snowball (Utamakan Baki Paling Rendah)' },
  { value: 'avalanche', label: 'Avalanche (Utamakan Faedah Tertinggi)' },
  { value: 'normal', label: 'Normal / Standard' },
];

export const DebtsManagerCard: React.FC<DebtsManagerCardProps> = ({
  debts,
  payments,
  onAddDebt,
  onRecordPayment,
  onDeleteDebt,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [paymentDebtId, setPaymentDebtId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Add Debt Form State
  const [title, setTitle] = useState('');
  const [creditor, setCreditor] = useState('');
  const [originalPrincipal, setOriginalPrincipal] = useState('');
  const [currentBalance, setCurrentBalance] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [monthlyInstallment, setMonthlyInstallment] = useState('');
  const [priority, setPriority] = useState<DebtPriority>('snowball');
  const [targetPayoffDate, setTargetPayoffDate] = useState('');
  const [note, setNote] = useState('');
  const [addError, setAddError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Payment Form State
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [paymentNote, setPaymentNote] = useState('');
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [isPaying, setIsPaying] = useState(false);

  // Totals
  const totalBalance = debts.reduce((sum, d) => sum + (d.currentBalance || 0), 0);
  const totalMonthlyInstallment = debts.reduce((sum, d) => sum + (d.monthlyInstallment || 0), 0);
  const totalOriginal = debts.reduce((sum, d) => sum + (d.originalPrincipal || d.currentBalance || 0), 0);
  const overallRepaidPercent = totalOriginal > 0
    ? Math.min(100, Math.round(((totalOriginal - totalBalance) / totalOriginal) * 100))
    : 0;

  const handleOpenAddModal = () => {
    setTitle('');
    setCreditor('');
    setOriginalPrincipal('');
    setCurrentBalance('');
    setInterestRate('');
    setMonthlyInstallment('');
    setPriority('snowball');
    setTargetPayoffDate('');
    setNote('');
    setAddError(null);
    setIsAddModalOpen(true);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const origNum = parseFloat(originalPrincipal);
    const currNum = parseFloat(currentBalance);
    const instNum = parseFloat(monthlyInstallment);
    const intNum = interestRate ? parseFloat(interestRate) : undefined;

    if (!title.trim()) {
      setAddError('Sila masukkan nama hutang.');
      return;
    }
    if (!creditor.trim()) {
      setAddError('Sila masukkan nama pemberi pinjaman / institusi.');
      return;
    }
    if (isNaN(origNum) || origNum <= 0) {
      setAddError('Sila masukkan jumlah prinsipal asal yang sah.');
      return;
    }
    if (isNaN(currNum) || currNum < 0) {
      setAddError('Sila masukkan baki semasa yang sah.');
      return;
    }
    if (isNaN(instNum) || instNum <= 0) {
      setAddError('Sila masukkan bayaran ansuran bulanan.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onAddDebt({
        title: title.trim(),
        creditor: creditor.trim(),
        originalPrincipal: origNum,
        currentBalance: currNum,
        interestRatePercent: intNum,
        monthlyInstallment: instNum,
        priority,
        targetPayoffDate: targetPayoffDate || undefined,
        notes: note.trim() || undefined,
      });
      setIsAddModalOpen(false);
    } catch (err: unknown) {
      setAddError(err instanceof Error ? err.message : 'Gagal menambah hutang.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenPayment = (debt: DebtItem) => {
    setPaymentDebtId(debt.id);
    setPaymentAmount(debt.monthlyInstallment.toString());
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPaymentNote('');
    setPaymentError(null);
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentDebtId) return;

    const amtNum = parseFloat(paymentAmount);
    if (isNaN(amtNum) || amtNum <= 0) {
      setPaymentError('Sila masukkan amaun bayaran yang sah.');
      return;
    }

    try {
      setIsPaying(true);
      await onRecordPayment({
        debtId: paymentDebtId,
        amount: amtNum,
        paidAt: new Date(paymentDate).toISOString(),
        note: paymentNote.trim() || undefined,
      });
      setPaymentDebtId(null);
    } catch (err: unknown) {
      setPaymentError(err instanceof Error ? err.message : 'Gagal merekod bayaran.');
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <div className="bg-surface-elevated/70 backdrop-blur-md border border-border-subtle rounded-2xl p-5 shadow-sm space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-accent-ember/10 border border-accent-ember/20 flex items-center justify-center text-accent-ember">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-content-primary tracking-tight">
              Pengurusan Hutang & Pinjaman
            </h3>
            <p className="text-xs text-content-secondary">
              PTPTN, pinjaman kereta, kad kredit dengan unjuran tarikh bebas hutang
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
          <span>Tambah Hutang</span>
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl bg-surface border border-border-subtle">
          <span className="text-[11px] font-medium text-content-tertiary uppercase tracking-wider block">
            Baki Keseluruhan Hutang
          </span>
          <span className="text-lg font-bold text-accent-ember">{formatRM(totalBalance)}</span>
        </div>
        <div className="p-3.5 rounded-xl bg-surface border border-border-subtle">
          <span className="text-[11px] font-medium text-content-tertiary uppercase tracking-wider block">
            Ansuran Bulanan Wajib
          </span>
          <span className="text-lg font-bold text-content-primary">{formatRM(totalMonthlyInstallment)}</span>
        </div>
        <div className="p-3.5 rounded-xl bg-surface border border-border-subtle">
          <span className="text-[11px] font-medium text-content-tertiary uppercase tracking-wider block">
            Peratusan Telah Dilangsaikan
          </span>
          <span className="text-lg font-bold text-accent-mint">{overallRepaidPercent}%</span>
        </div>
      </div>

      {/* Debts List */}
      {debts.length === 0 ? (
        <div className="py-10 text-center rounded-xl border border-dashed border-border-subtle bg-surface/50">
          <CreditCard className="w-8 h-8 mx-auto text-content-tertiary mb-2 opacity-60" />
          <p className="text-sm font-medium text-content-secondary">Tiada pinjaman atau hutang didaftarkan</p>
          <p className="text-xs text-content-tertiary max-w-sm mx-auto mt-1">
            Jika anda bebas hutang, tahniah! Jika ada pinjaman seperti PTPTN atau kereta, tambah di sini untuk menjejaki kemajuannya.
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {debts.map((debt) => {
            const repaidAmount = Math.max(0, debt.originalPrincipal - debt.currentBalance);
            const progressPercent = debt.originalPrincipal > 0
              ? Math.min(100, Math.round((repaidAmount / debt.originalPrincipal) * 100))
              : 0;
            const isFullyPaid = debt.currentBalance <= 0;
            const projection = calculateDebtPayoffProjection(debt);
            const PriorityMeta = PRIORITY_LABELS[debt.priority || 'normal'];
            const PriorityIcon = PriorityMeta.icon;

            return (
              <div
                key={debt.id}
                className="p-4 rounded-xl bg-surface border border-border-subtle hover:border-border-emphasis transition-all space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-content-primary truncate">{debt.title}</span>
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-surface-solid border border-border-subtle text-content-secondary flex items-center gap-1">
                        <Building className="w-3 h-3 text-content-tertiary" />
                        {debt.creditor}
                      </span>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md border flex items-center gap-1 ${PriorityMeta.color}`}>
                        <PriorityIcon className="w-3 h-3" />
                        {PriorityMeta.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-content-tertiary flex-wrap">
                      <span>Ansuran: <strong className="text-content-secondary">{formatRM(debt.monthlyInstallment)}/bln</strong></span>
                      {debt.interestRatePercent !== undefined && (
                        <span>Kadar: <strong className="text-content-secondary">{debt.interestRatePercent}%</strong></span>
                      )}
                      <span>Unjuran Bebas: <strong className="text-accent-mint">{projection.projectedPayoffText}</strong></span>
                      {payments.filter((p) => p.debtId === debt.id).length > 0 && (
                        <span className="text-accent-mint font-medium">
                          ({payments.filter((p) => p.debtId === debt.id).length} bayaran direkod)
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {!isFullyPaid && (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => handleOpenPayment(debt)}
                        className="flex items-center gap-1.5 text-xs"
                      >
                        <TrendingDown className="w-3.5 h-3.5 text-accent-mint" />
                        <span>Rekod Bayar</span>
                      </Button>
                    )}

                    <button
                      type="button"
                      onClick={() => setDeleteId(debt.id)}
                      className="p-1.5 text-content-tertiary hover:text-accent-ember rounded-lg hover:bg-surface-solid transition-colors"
                      title="Padam rekod hutang"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Balance Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-content-tertiary">
                      Dibayar: <span className="font-semibold text-accent-mint">{formatRM(repaidAmount)}</span> daripada {formatRM(debt.originalPrincipal)}
                    </span>
                    <span className="font-bold text-content-primary">
                      Baki: <span className={isFullyPaid ? 'text-accent-mint' : 'text-accent-ember'}>{formatRM(debt.currentBalance)}</span> ({progressPercent}%)
                    </span>
                  </div>

                  <div className="w-full h-2.5 rounded-full bg-surface-solid overflow-hidden border border-border-subtle">
                    <div
                      className={`h-full transition-all duration-500 rounded-full ${
                        isFullyPaid ? 'bg-accent-mint' : 'bg-gradient-to-r from-accent-mint to-accent-sky'
                      }`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Debt Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Daftar Hutang / Pinjaman"
        description="Masukkan butiran pinjaman untuk memantau kemajuan bayaran dan sasaran bebas hutang."
        maxWidth="md"
      >
        <form onSubmit={handleAddSubmit} className="space-y-4 pt-2">
          {addError && (
            <div className="p-3 text-xs rounded-xl bg-accent-ember/10 border border-accent-ember/20 text-accent-ember">
              {addError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-content-secondary">Nama Hutang</label>
              <Input
                type="text"
                placeholder="Contoh: Pinjaman PTPTN / Kereta Myvi"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-content-secondary">Pemberi Pinjaman / Institusi</label>
              <Input
                type="text"
                placeholder="Contoh: PTPTN / Maybank / Aeon Credit"
                value={creditor}
                onChange={(e) => setCreditor(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-content-secondary">Jumlah Prinsipal Asal (RM)</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="Contoh: 30000.00"
                value={originalPrincipal}
                onChange={(e) => setOriginalPrincipal(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-content-secondary">Baki Semasa (RM)</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="Contoh: 18500.00"
                value={currentBalance}
                onChange={(e) => setCurrentBalance(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-content-secondary">Ansuran Bulanan (RM)</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="Contoh: 350.00"
                value={monthlyInstallment}
                onChange={(e) => setMonthlyInstallment(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-content-secondary">Kadar Faedah (%) - Pilihan</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="Contoh: 3.5"
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-content-secondary">Strategi Keutamaan</label>
              <Select
                options={PRIORITY_OPTIONS}
                value={priority}
                onChange={(e) => setPriority(e.target.value as DebtPriority)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-content-secondary">Sasaran Tarikh Bebas Hutang (Pilihan)</label>
              <Input
                type="date"
                value={targetPayoffDate}
                onChange={(e) => setTargetPayoffDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-content-secondary">Catatan (Pilihan)</label>
            <Input
              type="text"
              placeholder="No rujukan akaun / tempoh pinjaman"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border-subtle">
            <Button type="button" variant="ghost" onClick={() => setIsAddModalOpen(false)} disabled={isSubmitting}>
              Batal
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? 'Menyimpan...' : 'Daftar Pinjaman'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Record Payment Modal */}
      <Modal
        isOpen={Boolean(paymentDebtId)}
        onClose={() => setPaymentDebtId(null)}
        title="Rekod Bayaran Pinjaman"
        description="Baki hutang akan dikurangkan secara automatik mengikut amaun bayaran yang dimasukkan."
        maxWidth="sm"
      >
        <form onSubmit={handlePaymentSubmit} className="space-y-4 pt-2">
          {paymentError && (
            <div className="p-3 text-xs rounded-xl bg-accent-ember/10 border border-accent-ember/20 text-accent-ember">
              {paymentError}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-content-secondary">Amaun Bayaran (RM)</label>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-content-secondary">Tarikh Bayaran</label>
            <Input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-content-secondary">Catatan / No Resit (Pilihan)</label>
            <Input
              type="text"
              placeholder="Contoh: Resit FPX Maybank"
              value={paymentNote}
              onChange={(e) => setPaymentNote(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border-subtle">
            <Button type="button" variant="ghost" onClick={() => setPaymentDebtId(null)} disabled={isPaying}>
              Batal
            </Button>
            <Button type="submit" variant="primary" disabled={isPaying}>
              {isPaying ? 'Merekod...' : 'Sahkan Bayaran'}
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
            await onDeleteDebt(deleteId);
            setDeleteId(null);
          }
        }}
        title="Padam Rekod Hutang?"
        description="Rekod pinjaman ini dan semua rekod bayarannya akan dipadamkan daripada peranti anda secara kekal."
        confirmLabel="Padam"
      />
    </div>
  );
};
