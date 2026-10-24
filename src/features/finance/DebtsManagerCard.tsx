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
  Award,
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

const PRIORITY_LABELS: Record<DebtPriority, { label: string; icon: React.ElementType; color: string; glow: string }> = {
  snowball: {
    label: 'Snowball (Lowest Balance First)',
    icon: Snowflake,
    color: 'text-cyan-400 bg-cyan-500/15 border-cyan-400/30',
    glow: 'shadow-[0_0_12px_rgba(6,182,212,0.2)]',
  },
  avalanche: {
    label: 'Avalanche (Highest Interest First)',
    icon: Flame,
    color: 'text-rose-400 bg-rose-500/15 border-rose-400/30',
    glow: 'shadow-[0_0_12px_rgba(244,63,94,0.2)]',
  },
  normal: {
    label: 'Standard Schedule',
    icon: ShieldAlert,
    color: 'text-content-secondary bg-white/[0.04] border-white/[0.08]',
    glow: '',
  },
};

const PRIORITY_OPTIONS = [
  { value: 'snowball', label: 'Snowball (Focus Smallest Balance First for Quick Wins)' },
  { value: 'avalanche', label: 'Avalanche (Focus Highest Interest First to Save Money)' },
  { value: 'normal', label: 'Standard Schedule' },
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
  const [notes, setNotes] = useState('');
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
  const overallRepaidPercent =
    totalOriginal > 0
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
    setNotes('');
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
      setAddError('Please enter a debt or loan name.');
      return;
    }
    if (!creditor.trim()) {
      setAddError('Please enter the creditor or financial institution.');
      return;
    }
    if (isNaN(origNum) || origNum <= 0) {
      setAddError('Please enter a valid original principal amount.');
      return;
    }
    if (isNaN(currNum) || currNum < 0) {
      setAddError('Please enter a valid current balance.');
      return;
    }
    if (isNaN(instNum) || instNum <= 0) {
      setAddError('Please enter the monthly installment amount.');
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
        notes: notes.trim() || undefined,
      });
      setIsAddModalOpen(false);
    } catch (err: unknown) {
      setAddError(err instanceof Error ? err.message : 'Failed to register loan.');
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
      setPaymentError('Please enter a valid payment amount.');
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
      setPaymentError(err instanceof Error ? err.message : 'Failed to record payment.');
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#0c1527]/80 backdrop-blur-xl p-5 md:p-6 shadow-2xl relative overflow-hidden transition-all duration-300">
      {/* Background ambient lighting */}
      <div className="absolute -top-16 -right-16 w-56 h-56 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-400/30 flex items-center justify-center text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.25)]">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-content-primary flex items-center gap-2">
              Debt Repayment & Freedom Radar
              {totalBalance === 0 && debts.length > 0 && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <Award className="w-3.5 h-3.5" /> 100% Debt Free!
                </span>
              )}
            </h3>
            <p className="text-xs text-content-secondary">
              PTPTN, study loans, car hire-purchase, credit cards with payoff forecasting
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenAddModal}
          className="px-3.5 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-400/35 text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 shadow-[0_0_12px_rgba(244,63,94,0.2)]"
        >
          <Plus className="w-4 h-4" />
          <span>Add Debt</span>
        </button>
      </div>

      {/* Summary Visual Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6 relative z-10">
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 flex flex-col justify-between">
          <span className="text-[11px] font-medium text-content-tertiary uppercase tracking-wider block">
            Total Outstanding Balance
          </span>
          <span className="text-2xl font-bold font-mono tracking-tight text-rose-400">
            {formatRM(totalBalance)}
          </span>
          <span className="text-[10px] text-content-tertiary mt-1 block">Remaining liability</span>
        </div>

        <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 flex flex-col justify-between">
          <span className="text-[11px] font-medium text-content-tertiary uppercase tracking-wider block">
            Monthly Debt Service
          </span>
          <span className="text-2xl font-bold font-mono tracking-tight text-white">
            {formatRM(totalMonthlyInstallment)}
          </span>
          <span className="text-[10px] text-content-tertiary mt-1 block">Fixed monthly installments</span>
        </div>

        <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] text-content-tertiary mb-1">
            <span className="font-medium uppercase tracking-wider">Overall Repaid</span>
            <span className="font-mono text-emerald-400 font-bold">{overallRepaidPercent}%</span>
          </div>
          <div className="text-2xl font-bold font-mono tracking-tight text-emerald-400 mb-1">
            {formatRM(Math.max(0, totalOriginal - totalBalance))}
          </div>
          <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-full transition-all duration-700"
              style={{ width: `${overallRepaidPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Debts List */}
      {debts.length === 0 ? (
        <div className="py-12 text-center rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.01] relative z-10">
          <CreditCard className="w-10 h-10 mx-auto text-content-tertiary mb-3 opacity-50" />
          <p className="text-sm font-semibold text-content-primary">No loans or debts registered</p>
          <p className="text-xs text-content-secondary max-w-sm mx-auto mt-1">
            If you are debt-free, congratulations! If you have study loans or car installments, add them here to track your freedom progress.
          </p>
        </div>
      ) : (
        <div className="space-y-4 relative z-10">
          {debts.map((debt) => {
            const repaidAmount = Math.max(0, debt.originalPrincipal - debt.currentBalance);
            const progressPercent =
              debt.originalPrincipal > 0
                ? Math.min(100, Math.round((repaidAmount / debt.originalPrincipal) * 100))
                : 0;
            const isFullyPaid = debt.currentBalance <= 0;
            const projection = calculateDebtPayoffProjection(debt);
            const PriorityMeta = PRIORITY_LABELS[debt.priority || 'normal'];
            const PriorityIcon = PriorityMeta.icon;
            const debtPayments = payments.filter((p) => p.debtId === debt.id);

            return (
              <div
                key={debt.id}
                className="p-5 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:border-white/[0.15] transition-all duration-200 space-y-4"
              >
                <div className="flex items-start justify-between gap-3 flex-wrap sm:flex-nowrap">
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-base font-bold text-white tracking-tight truncate">{debt.title}</span>
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-white/[0.05] border border-white/[0.08] text-content-secondary flex items-center gap-1">
                        <Building className="w-3 h-3 text-content-tertiary" />
                        {debt.creditor}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border flex items-center gap-1 ${PriorityMeta.color} ${PriorityMeta.glow}`}
                      >
                        <PriorityIcon className="w-3 h-3" />
                        {PriorityMeta.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-content-tertiary flex-wrap">
                      <span>
                        Installment: <strong className="text-white font-mono">{formatRM(debt.monthlyInstallment)}/mo</strong>
                      </span>
                      {debt.interestRatePercent !== undefined && (
                        <span>
                          Rate: <strong className="text-content-secondary font-mono">{debt.interestRatePercent}%</strong>
                        </span>
                      )}
                      <span>
                        Payoff Target: <strong className="text-emerald-400 font-medium">{projection.projectedPayoffText}</strong>
                      </span>
                      {debtPayments.length > 0 && (
                        <span className="text-cyan-400 font-medium font-mono">
                          ({debtPayments.length} {debtPayments.length === 1 ? 'payment' : 'payments'} logged)
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {!isFullyPaid && (
                      <button
                        type="button"
                        onClick={() => handleOpenPayment(debt)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/30 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 shadow-[0_0_10px_rgba(16,185,129,0.15)]"
                      >
                        <TrendingDown className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Record Payment</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setDeleteId(debt.id)}
                      className="p-1.5 text-content-tertiary hover:text-rose-400 rounded-lg hover:bg-white/[0.06] transition-colors"
                      title="Delete debt record"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Balance Repayment Progress Bar */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-content-secondary">
                      Repaid: <span className="font-mono font-semibold text-emerald-400">{formatRM(repaidAmount)}</span> of {formatRM(debt.originalPrincipal)}
                    </span>
                    <span className="font-mono font-bold text-white">
                      Balance: <span className={isFullyPaid ? 'text-emerald-400' : 'text-rose-400'}>{formatRM(debt.currentBalance)}</span> ({progressPercent}%)
                    </span>
                  </div>

                  <div className="w-full h-2.5 rounded-full bg-white/[0.08] overflow-hidden border border-white/[0.05]">
                    <div
                      className={`h-full transition-all duration-700 rounded-full ${
                        isFullyPaid ? 'bg-emerald-400' : 'bg-gradient-to-r from-emerald-500 to-cyan-400'
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
        title="Add Debt or Loan"
        description="Register an educational loan, vehicle installment, or credit balance to calculate your debt freedom timeline."
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
              <label className="text-xs font-semibold text-content-secondary">Debt Name</label>
              <Input
                type="text"
                placeholder="e.g. PTPTN Degree / Honda Car Loan"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-content-secondary">Creditor / Institution</label>
              <Input
                type="text"
                placeholder="e.g. PTPTN / Maybank / Aeon Credit"
                value={creditor}
                onChange={(e) => setCreditor(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-content-secondary">Original Principal (RM)</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="e.g. 30000.00"
                value={originalPrincipal}
                onChange={(e) => setOriginalPrincipal(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-content-secondary">Current Balance (RM)</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="e.g. 14000.00"
                value={currentBalance}
                onChange={(e) => setCurrentBalance(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-content-secondary">Monthly Installment (RM)</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="e.g. 250.00"
                value={monthlyInstallment}
                onChange={(e) => setMonthlyInstallment(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-content-secondary">Interest Rate (%) - Optional</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="e.g. 3.2"
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-content-secondary">Repayment Strategy</label>
              <Select
                options={PRIORITY_OPTIONS}
                value={priority}
                onChange={(e) => setPriority(e.target.value as DebtPriority)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-content-secondary">Target Payoff Date (Optional)</label>
              <Input
                type="date"
                value={targetPayoffDate}
                onChange={(e) => setTargetPayoffDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-content-secondary">Notes (Optional)</label>
            <Input
              type="text"
              placeholder="Account reference / loan tenure"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border-subtle">
            <Button type="button" variant="ghost" onClick={() => setIsAddModalOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Register Loan'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Record Payment Modal */}
      <Modal
        isOpen={Boolean(paymentDebtId)}
        onClose={() => setPaymentDebtId(null)}
        title="Record Debt Payment"
        description="Your remaining debt balance will be automatically reduced by the amount entered."
        maxWidth="sm"
      >
        <form onSubmit={handlePaymentSubmit} className="space-y-4 pt-2">
          {paymentError && (
            <div className="p-3 text-xs rounded-xl bg-accent-ember/10 border border-accent-ember/20 text-accent-ember">
              {paymentError}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-content-secondary">Payment Amount (RM)</label>
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
            <label className="text-xs font-semibold text-content-secondary">Payment Date</label>
            <Input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-content-secondary">Receipt Reference (Optional)</label>
            <Input
              type="text"
              placeholder="e.g. Maybank FPX ref #8492"
              value={paymentNote}
              onChange={(e) => setPaymentNote(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border-subtle">
            <Button type="button" variant="ghost" onClick={() => setPaymentDebtId(null)} disabled={isPaying}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isPaying}>
              {isPaying ? 'Recording...' : 'Confirm Payment'}
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
        title="Delete Debt Record?"
        description="This loan entry and its associated payment history will be permanently deleted from this device."
        confirmLabel="Delete"
      />
    </div>
  );
};
