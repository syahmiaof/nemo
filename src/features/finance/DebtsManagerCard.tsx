import React, { useState } from 'react';
import { DebtItem, DebtPayment, DebtPriority, DebtType } from '@/domain/types';
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
  Sparkles,
  Check,
  Pencil,
  History,
  Calendar,
} from 'lucide-react';

interface DebtsManagerCardProps {
  debts: DebtItem[];
  payments: DebtPayment[];
  onAddDebt: (data: {
    title: string;
    creditor: string;
    debtType?: DebtType;
    originalPrincipal: number;
    currentBalance: number;
    interestRatePercent?: number;
    monthlyInstallment: number;
    priority?: DebtPriority;
    targetPayoffDate?: string;
    notes?: string;
  }) => Promise<void>;
  onUpdateDebt?: (id: string, data: Partial<Omit<DebtItem, 'id' | 'createdAt'>>) => Promise<void>;
  onRecordPayment: (data: {
    debtId: string;
    amount: number;
    paidAt?: string;
    note?: string;
  }) => Promise<void>;
  onUpdatePayment?: (paymentId: string, data: { amount?: number; paidAt?: string; note?: string }) => Promise<void>;
  onDeletePayment?: (paymentId: string) => Promise<void>;
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
  onUpdateDebt,
  onRecordPayment,
  onUpdatePayment,
  onDeletePayment,
  onDeleteDebt,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [paymentDebtId, setPaymentDebtId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Edit Debt State
  const [editingDebt, setEditingDebt] = useState<DebtItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCreditor, setEditCreditor] = useState('');
  const [editDebtType, setEditDebtType] = useState<DebtType>('installment');
  const [editOriginalPrincipal, setEditOriginalPrincipal] = useState('');
  const [editCurrentBalance, setEditCurrentBalance] = useState('');
  const [editInterestRate, setEditInterestRate] = useState('');
  const [editMonthlyInstallment, setEditMonthlyInstallment] = useState('');
  const [editPriority, setEditPriority] = useState<DebtPriority>('snowball');
  const [editTargetPayoffDate, setEditTargetPayoffDate] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editError, setEditError] = useState<string | null>(null);
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);

  // Payment History State
  const [historyDebtId, setHistoryDebtId] = useState<string | null>(null);
  const [editingPayment, setEditingPayment] = useState<DebtPayment | null>(null);
  const [editPaymentAmount, setEditPaymentAmount] = useState('');
  const [editPaymentDate, setEditPaymentDate] = useState('');
  const [editPaymentNote, setEditPaymentNote] = useState('');
  const [isUpdatingPayment, setIsUpdatingPayment] = useState(false);
  const [paymentActionError, setPaymentActionError] = useState<string | null>(null);
  const [deletePaymentConfirm, setDeletePaymentConfirm] = useState<DebtPayment | null>(null);

  // Undo Current Month Payment Dialog State
  const [undoPaymentConfirm, setUndoPaymentConfirm] = useState<{
    debt: DebtItem;
    payment: DebtPayment;
  } | null>(null);

  // Add Debt Form State
  const [title, setTitle] = useState('');
  const [creditor, setCreditor] = useState('');
  const [debtType, setDebtType] = useState<DebtType>('installment');
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

  // Current Cycle Meta
  const currentMonthPrefix = new Date().toISOString().slice(0, 7); // e.g. '2026-10'
  const currentMonthName = new Date().toLocaleDateString('en-US', { month: 'short' });

  // Totals: only installment debts count toward monthly recurring burn
  const totalBalance = debts.reduce((sum, d) => sum + (d.currentBalance || 0), 0);
  const totalMonthlyInstallment = debts
    .filter((d) => d.debtType !== 'lumpsum_flexible')
    .reduce((sum, d) => sum + (d.monthlyInstallment || 0), 0);
  const totalOriginal = debts.reduce((sum, d) => sum + (d.originalPrincipal || d.currentBalance || 0), 0);
  const overallRepaidPercent =
    totalOriginal > 0
      ? Math.min(100, Math.round(((totalOriginal - totalBalance) / totalOriginal) * 100))
      : 0;

  const handleOpenAddModal = () => {
    setTitle('');
    setCreditor('');
    setDebtType('installment');
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
    const instNum =
      debtType === 'lumpsum_flexible'
        ? monthlyInstallment
          ? parseFloat(monthlyInstallment)
          : 0
        : parseFloat(monthlyInstallment);
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
    if (debtType === 'installment' && (isNaN(instNum) || instNum <= 0)) {
      setAddError('Please enter the monthly installment amount.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onAddDebt({
        title: title.trim(),
        creditor: creditor.trim(),
        debtType,
        originalPrincipal: origNum,
        currentBalance: currNum,
        interestRatePercent: intNum,
        monthlyInstallment: isNaN(instNum) ? 0 : instNum,
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

  // Open Edit Debt Modal
  const handleOpenEditModal = (debt: DebtItem) => {
    setEditingDebt(debt);
    setEditTitle(debt.title);
    setEditCreditor(debt.creditor);
    setEditDebtType(debt.debtType || 'installment');
    setEditOriginalPrincipal(debt.originalPrincipal.toString());
    setEditCurrentBalance(debt.currentBalance.toString());
    setEditInterestRate(debt.interestRatePercent !== undefined ? debt.interestRatePercent.toString() : '');
    setEditMonthlyInstallment((debt.monthlyInstallment || 0).toString());
    setEditPriority(debt.priority || 'snowball');
    setEditTargetPayoffDate(debt.targetPayoffDate || '');
    setEditNotes(debt.notes || '');
    setEditError(null);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDebt || !onUpdateDebt) return;

    const origNum = parseFloat(editOriginalPrincipal);
    const currNum = parseFloat(editCurrentBalance);
    const instNum =
      editDebtType === 'lumpsum_flexible'
        ? editMonthlyInstallment
          ? parseFloat(editMonthlyInstallment)
          : 0
        : parseFloat(editMonthlyInstallment);
    const intNum = editInterestRate ? parseFloat(editInterestRate) : undefined;

    if (!editTitle.trim()) {
      setEditError('Please enter a debt or loan name.');
      return;
    }
    if (!editCreditor.trim()) {
      setEditError('Please enter the creditor or financial institution.');
      return;
    }
    if (isNaN(origNum) || origNum <= 0) {
      setEditError('Please enter a valid original principal amount.');
      return;
    }
    if (isNaN(currNum) || currNum < 0) {
      setEditError('Please enter a valid current balance.');
      return;
    }
    if (editDebtType === 'installment' && (isNaN(instNum) || instNum <= 0)) {
      setEditError('Please enter the monthly installment amount.');
      return;
    }

    try {
      setIsEditSubmitting(true);
      await onUpdateDebt(editingDebt.id, {
        title: editTitle.trim(),
        creditor: editCreditor.trim(),
        debtType: editDebtType,
        originalPrincipal: origNum,
        currentBalance: currNum,
        interestRatePercent: intNum,
        monthlyInstallment: isNaN(instNum) ? 0 : instNum,
        priority: editPriority,
        targetPayoffDate: editTargetPayoffDate || undefined,
        notes: editNotes.trim() || undefined,
      });
      setEditingDebt(null);
    } catch (err: unknown) {
      setEditError(err instanceof Error ? err.message : 'Failed to update loan.');
    } finally {
      setIsEditSubmitting(false);
    }
  };

  // Quick Tick / Pay Monthly Installment Handler
  const handleToggleMonthPaid = async (
    debt: DebtItem,
    isPaidThisMonth: boolean,
    paymentsThisMonth: DebtPayment[]
  ) => {
    if (!isPaidThisMonth) {
      // One-click tick: record current month installment
      try {
        await onRecordPayment({
          debtId: debt.id,
          amount: debt.monthlyInstallment,
          paidAt: new Date().toISOString(),
          note: `${currentMonthName} ${new Date().getFullYear()} Installment`,
        });
      } catch (err) {
        console.error('Failed to quick-record installment payment:', err);
      }
    } else {
      // If already paid, prompt to undo latest payment this month or view history
      const latestPayment = [...paymentsThisMonth].sort(
        (a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime()
      )[0];
      if (latestPayment) {
        setUndoPaymentConfirm({ debt, payment: latestPayment });
      } else {
        setHistoryDebtId(debt.id);
      }
    }
  };

  const handleOpenPayment = (debt: DebtItem) => {
    setPaymentDebtId(debt.id);
    if (debt.debtType === 'lumpsum_flexible') {
      setPaymentAmount(debt.currentBalance > 0 ? debt.currentBalance.toString() : '100');
    } else {
      setPaymentAmount(debt.monthlyInstallment.toString());
    }
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

  // Payment History Handlers
  const handleStartEditPayment = (payment: DebtPayment) => {
    setEditingPayment(payment);
    setEditPaymentAmount(payment.amount.toString());
    setEditPaymentDate(payment.paidAt ? payment.paidAt.split('T')[0] : new Date().toISOString().split('T')[0]);
    setEditPaymentNote(payment.note || '');
    setPaymentActionError(null);
  };

  const handleSavePaymentEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPayment || !onUpdatePayment) return;

    const amtNum = parseFloat(editPaymentAmount);
    if (isNaN(amtNum) || amtNum <= 0) {
      setPaymentActionError('Please enter a valid payment amount.');
      return;
    }

    try {
      setIsUpdatingPayment(true);
      await onUpdatePayment(editingPayment.id, {
        amount: amtNum,
        paidAt: new Date(editPaymentDate).toISOString(),
        note: editPaymentNote.trim() || undefined,
      });
      setEditingPayment(null);
    } catch (err) {
      setPaymentActionError(err instanceof Error ? err.message : 'Failed to update payment.');
    } finally {
      setIsUpdatingPayment(false);
    }
  };

  const historyDebt = debts.find((d) => d.id === historyDebtId);
  const activeDebtPayments = historyDebtId
    ? payments
        .filter((p) => p.debtId === historyDebtId)
        .sort((a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime())
    : [];

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
              PTPTN, study loans, car hire-purchase, credit cards with payoff forecasting & quick monthly checkoff
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

            // Monthly Cycle Calculation
            const paymentsThisMonth = debtPayments.filter((p) =>
              (p.paidAt || '').startsWith(currentMonthPrefix)
            );
            const totalPaidThisMonth = paymentsThisMonth.reduce((sum, p) => sum + (p.amount || 0), 0);
            const isPaidThisMonth =
              debt.debtType === 'installment'
                ? totalPaidThisMonth >= (debt.monthlyInstallment || 0) && (debt.monthlyInstallment || 0) > 0
                : paymentsThisMonth.length > 0;

            return (
              <div
                key={debt.id}
                className="p-5 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:border-white/[0.15] transition-all duration-200 space-y-4"
              >
                <div className="flex items-start justify-between gap-3 flex-wrap sm:flex-nowrap">
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-base font-bold text-white tracking-tight truncate">
                        {debt.title}
                      </span>
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-white/[0.05] border border-white/[0.08] text-content-secondary flex items-center gap-1">
                        <Building className="w-3 h-3 text-content-tertiary" />
                        {debt.creditor}
                      </span>
                      {debt.debtType === 'lumpsum_flexible' ? (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.15)] flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-cyan-400" />
                          Flexible Debt / Lumpsum
                        </span>
                      ) : (
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border flex items-center gap-1 ${PriorityMeta.color} ${PriorityMeta.glow}`}
                        >
                          <PriorityIcon className="w-3 h-3" />
                          {PriorityMeta.label}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-content-tertiary flex-wrap">
                      {debt.debtType === 'lumpsum_flexible' ? (
                        <span>
                          Monthly Commitment:{' '}
                          <strong className="text-cyan-300 font-medium">None (Pay at your own pace)</strong>
                        </span>
                      ) : (
                        <span>
                          Installment:{' '}
                          <strong className="text-white font-mono">
                            {formatRM(debt.monthlyInstallment)}/mo
                          </strong>
                        </span>
                      )}
                      {debt.interestRatePercent !== undefined && (
                        <span>
                          Rate:{' '}
                          <strong className="text-content-secondary font-mono">
                            {debt.interestRatePercent}%
                          </strong>
                        </span>
                      )}
                      <span>
                        Payoff Projection:{' '}
                        <strong className="text-emerald-400 font-medium">
                          {projection.projectedPayoffText}
                        </strong>
                      </span>
                      {debtPayments.length > 0 ? (
                        <button
                          type="button"
                          onClick={() => setHistoryDebtId(debt.id)}
                          className="text-cyan-400 hover:text-cyan-300 font-medium font-mono underline underline-offset-2 flex items-center gap-1 transition-colors"
                          title="View and edit payment history"
                        >
                          <History className="w-3 h-3" />
                          <span>
                            ({debtPayments.length} {debtPayments.length === 1 ? 'payment' : 'payments'} recorded)
                          </span>
                        </button>
                      ) : (
                        <span className="text-content-tertiary">(0 payments recorded)</span>
                      )}
                    </div>
                  </div>

                  {/* Actions & Monthly Tick */}
                  <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap flex-shrink-0">
                    {/* Monthly Installment Checkbox / Quick Tick */}
                    {debt.debtType !== 'lumpsum_flexible' && !isFullyPaid && (
                      <button
                        type="button"
                        onClick={() => handleToggleMonthPaid(debt, isPaidThisMonth, paymentsThisMonth)}
                        className={`group px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 ${
                          isPaidThisMonth
                            ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.25)]'
                            : 'bg-white/[0.04] border-white/[0.12] text-content-secondary hover:border-emerald-400/40 hover:text-white'
                        }`}
                        title={
                          isPaidThisMonth
                            ? `Paid for ${currentMonthName} (${formatRM(totalPaidThisMonth)}). Click to manage or undo.`
                            : `Tick to record ${currentMonthName} installment (${formatRM(debt.monthlyInstallment)})`
                        }
                      >
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                            isPaidThisMonth
                              ? 'border-emerald-400 bg-emerald-500 text-black'
                              : 'border-white/30 group-hover:border-emerald-400'
                          }`}
                        >
                          {isPaidThisMonth && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </div>
                        <span>
                          {isPaidThisMonth
                            ? `Paid for ${currentMonthName}`
                            : `Tick ${currentMonthName} (${formatRM(debt.monthlyInstallment)})`}
                        </span>
                      </button>
                    )}

                    {/* Lumpsum month indicator */}
                    {debt.debtType === 'lumpsum_flexible' && paymentsThisMonth.length > 0 && (
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-xs font-mono font-medium flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-400" />
                        {formatRM(totalPaidThisMonth)} in {currentMonthName}
                      </span>
                    )}

                    {/* Record Custom / Extra Payment */}
                    {!isFullyPaid && (
                      <button
                        type="button"
                        onClick={() => handleOpenPayment(debt)}
                        className="px-3 py-1.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/30 text-cyan-300 text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 shadow-[0_0_10px_rgba(6,182,212,0.15)]"
                        title="Record extra or custom payment"
                      >
                        <TrendingDown className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Record Payment</span>
                      </button>
                    )}

                    {/* Edit Debt Button */}
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(debt)}
                      className="p-1.5 text-content-tertiary hover:text-cyan-400 rounded-lg hover:bg-white/[0.06] transition-colors"
                      title="Edit debt details or repair balance"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>

                    {/* Delete Debt Button */}
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
                      Repaid:{' '}
                      <span className="font-mono font-semibold text-emerald-400">
                        {formatRM(repaidAmount)}
                      </span>{' '}
                      of {formatRM(debt.originalPrincipal)}
                    </span>
                    <span className="font-mono font-bold text-white">
                      Balance:{' '}
                      <span className={isFullyPaid ? 'text-emerald-400' : 'text-rose-400'}>
                        {formatRM(debt.currentBalance)}
                      </span>{' '}
                      ({progressPercent}%)
                    </span>
                  </div>

                  <div className="w-full h-2.5 rounded-full bg-white/[0.08] overflow-hidden border border-white/[0.05]">
                    <div
                      className={`h-full transition-all duration-700 rounded-full ${
                        isFullyPaid
                          ? 'bg-emerald-400'
                          : 'bg-gradient-to-r from-emerald-500 to-cyan-400'
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
        title="Register Loan or Debt"
        description="Track car loans, mortgages, student loans, or flexible lumpsum debts to monitor balances and financial freedom."
        maxWidth="md"
      >
        <form onSubmit={handleAddSubmit} className="space-y-4 pt-2">
          {addError && (
            <div className="p-3 text-xs rounded-xl bg-accent-ember/10 border border-accent-ember/20 text-accent-ember">
              {addError}
            </div>
          )}

          {/* Debt Type Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-content-secondary">Loan / Debt Type</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDebtType('installment')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  debtType === 'installment'
                    ? 'bg-amber-500/15 border-amber-400/40 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                    : 'bg-white/[0.03] border-white/[0.08] text-content-secondary hover:bg-white/[0.06]'
                }`}
              >
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                  Fixed Installment
                </div>
                <div className="text-[11px] text-content-tertiary mt-1">
                  Car, mortgage, student loan (fixed monthly installments)
                </div>
              </button>

              <button
                type="button"
                onClick={() => setDebtType('lumpsum_flexible')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  debtType === 'lumpsum_flexible'
                    ? 'bg-cyan-500/15 border-cyan-400/40 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                    : 'bg-white/[0.03] border-white/[0.08] text-content-secondary hover:bg-white/[0.06]'
                }`}
              >
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  Flexible Debt / Lumpsum
                </div>
                <div className="text-[11px] text-content-tertiary mt-1">
                  Personal/peer loan (no fixed monthly bill, pay when funds available)
                </div>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-content-secondary">Loan / Debt Name</label>
              <Input
                type="text"
                placeholder={
                  debtType === 'lumpsum_flexible' ? 'e.g. Peer Loan (Zul)' : 'e.g. Honda City / Student Loan'
                }
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-content-secondary">
                Lender / Creditor / Institution
              </label>
              <Input
                type="text"
                placeholder={
                  debtType === 'lumpsum_flexible'
                    ? 'e.g. Close Friend / Family'
                    : 'e.g. Maybank / Education Fund'
                }
                value={creditor}
                onChange={(e) => setCreditor(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-content-secondary">
                Original Principal Amount (RM)
              </label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder={debtType === 'lumpsum_flexible' ? 'e.g. 1500.00' : 'e.g. 30000.00'}
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
                placeholder={debtType === 'lumpsum_flexible' ? 'e.g. 1500.00' : 'e.g. 14000.00'}
                value={currentBalance}
                onChange={(e) => setCurrentBalance(e.target.value)}
                required
              />
            </div>
          </div>

          {debtType === 'installment' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-content-secondary">
                  Monthly Installment (RM)
                </label>
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
                <label className="text-xs font-semibold text-content-secondary">
                  Interest Rate (%) - Optional
                </label>
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
          ) : (
            <div className="p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-400/25 text-xs text-cyan-200">
              <div className="font-semibold text-cyan-300 flex items-center gap-1.5 mb-1">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                Flexible / Lumpsum Repayment
              </div>
              <p className="text-[11px] text-cyan-200/80 leading-relaxed">
                This debt <strong>does not reduce</strong> your fixed monthly recurring cashflow (RM 0.00/mo).
                You can log partial or full lumpsum payments at any time as extra project income or savings permit!
              </p>
            </div>
          )}

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
              <label className="text-xs font-semibold text-content-secondary">
                Target Payoff Date (Optional)
              </label>
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
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsAddModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Register Loan'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Debt & Adjust Balance Modal */}
      <Modal
        isOpen={Boolean(editingDebt)}
        onClose={() => setEditingDebt(null)}
        title="Edit Loan & Repair Balance"
        description="Update loan parameters or repair remaining balance and monthly installment amounts if there was any mistake."
        maxWidth="md"
      >
        {editingDebt && (
          <form onSubmit={handleEditSubmit} className="space-y-4 pt-2">
            {editError && (
              <div className="p-3 text-xs rounded-xl bg-accent-ember/10 border border-accent-ember/20 text-accent-ember">
                {editError}
              </div>
            )}

            {/* Debt Type Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-content-secondary">Loan / Debt Type</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setEditDebtType('installment')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    editDebtType === 'installment'
                      ? 'bg-amber-500/15 border-amber-400/40 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                      : 'bg-white/[0.03] border-white/[0.08] text-content-secondary hover:bg-white/[0.06]'
                  }`}
                >
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                    Fixed Installment
                  </div>
                  <div className="text-[11px] text-content-tertiary mt-1">
                    Car, mortgage, student loan (fixed monthly installments)
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setEditDebtType('lumpsum_flexible')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    editDebtType === 'lumpsum_flexible'
                      ? 'bg-cyan-500/15 border-cyan-400/40 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                      : 'bg-white/[0.03] border-white/[0.08] text-content-secondary hover:bg-white/[0.06]'
                  }`}
                >
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    Flexible Debt / Lumpsum
                  </div>
                  <div className="text-[11px] text-content-tertiary mt-1">
                    Personal/peer loan (no fixed monthly bill, pay when funds available)
                  </div>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-content-secondary">Loan / Debt Name</label>
                <Input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-content-secondary">
                  Lender / Creditor / Institution
                </label>
                <Input
                  type="text"
                  value={editCreditor}
                  onChange={(e) => setEditCreditor(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-content-secondary">
                  Original Principal (RM)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editOriginalPrincipal}
                  onChange={(e) => setEditOriginalPrincipal(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                  <span>Current Remaining Balance (RM)</span>
                  <span className="text-[10px] text-content-tertiary font-normal">(Direct Balance Repair)</span>
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editCurrentBalance}
                  onChange={(e) => setEditCurrentBalance(e.target.value)}
                  required
                  className="border-emerald-400/40 text-emerald-300 font-mono"
                />
              </div>
            </div>

            {editDebtType === 'installment' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-content-secondary">
                    Monthly Installment (RM)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editMonthlyInstallment}
                    onChange={(e) => setEditMonthlyInstallment(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-content-secondary">
                    Interest Rate (%) - Optional
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editInterestRate}
                    onChange={(e) => setEditInterestRate(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-content-secondary">Repayment Strategy</label>
                <Select
                  options={PRIORITY_OPTIONS}
                  value={editPriority}
                  onChange={(e) => setEditPriority(e.target.value as DebtPriority)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-content-secondary">
                  Target Payoff Date (Optional)
                </label>
                <Input
                  type="date"
                  value={editTargetPayoffDate}
                  onChange={(e) => setEditTargetPayoffDate(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-content-secondary">Notes (Optional)</label>
              <Input
                type="text"
                placeholder="Account reference / loan tenure"
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border-subtle">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setEditingDebt(null)}
                disabled={isEditSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={isEditSubmitting}>
                {isEditSubmitting ? 'Saving Changes...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        )}
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
            <Button
              type="button"
              variant="ghost"
              onClick={() => setPaymentDebtId(null)}
              disabled={isPaying}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isPaying}>
              {isPaying ? 'Recording...' : 'Confirm Payment'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Payment History & Adjustments Modal */}
      <Modal
        isOpen={Boolean(historyDebtId)}
        onClose={() => {
          setHistoryDebtId(null);
          setEditingPayment(null);
        }}
        title={`Payment History: ${historyDebt?.title || 'Loan'}`}
        description="View past recorded payments, edit payment amounts/dates, or remove mistakenly recorded payments."
        maxWidth="md"
      >
        <div className="space-y-4 pt-2">
          {paymentActionError && (
            <div className="p-3 text-xs rounded-xl bg-accent-ember/10 border border-accent-ember/20 text-accent-ember">
              {paymentActionError}
            </div>
          )}

          {/* Inline Edit Payment Form */}
          {editingPayment ? (
            <form
              onSubmit={handleSavePaymentEdit}
              className="p-4 rounded-xl border border-cyan-400/30 bg-cyan-500/10 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                  <Pencil className="w-3.5 h-3.5" /> Edit Payment Entry
                </span>
                <button
                  type="button"
                  onClick={() => setEditingPayment(null)}
                  className="text-content-tertiary hover:text-white text-xs"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-content-secondary">Amount (RM)</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={editPaymentAmount}
                    onChange={(e) => setEditPaymentAmount(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-content-secondary">Payment Date</label>
                  <Input
                    type="date"
                    value={editPaymentDate}
                    onChange={(e) => setEditPaymentDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-content-secondary">Note / Reference</label>
                <Input
                  type="text"
                  value={editPaymentNote}
                  onChange={(e) => setEditPaymentNote(e.target.value)}
                  placeholder="e.g. Oct installment"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setEditingPayment(null)}
                  disabled={isUpdatingPayment}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={isUpdatingPayment}>
                  {isUpdatingPayment ? 'Saving...' : 'Update Payment & Recalibrate Balance'}
                </Button>
              </div>
            </form>
          ) : null}

          {/* List of recorded payments */}
          <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
            {activeDebtPayments.length === 0 ? (
              <div className="py-8 text-center rounded-xl border border-dashed border-white/[0.08] bg-white/[0.01]">
                <History className="w-8 h-8 mx-auto text-content-tertiary mb-2 opacity-50" />
                <p className="text-xs font-semibold text-content-primary">No payments recorded yet</p>
                <p className="text-[11px] text-content-secondary mt-0.5">
                  Payments logged via monthly tick or Record Payment will appear here.
                </p>
              </div>
            ) : (
              activeDebtPayments.map((p) => {
                const dateStr = p.paidAt
                  ? new Date(p.paidAt).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })
                  : 'N/A';

                return (
                  <div
                    key={p.id}
                    className="p-3 rounded-xl border border-white/[0.08] bg-white/[0.02] flex items-center justify-between gap-3 hover:border-white/[0.15] transition-all"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold font-mono text-emerald-400">
                          {formatRM(p.amount)}
                        </span>
                        <span className="text-[10px] text-content-tertiary flex items-center gap-1 font-mono">
                          <Calendar className="w-3 h-3 text-content-tertiary" />
                          {dateStr}
                        </span>
                      </div>
                      {p.note && (
                        <p className="text-xs text-content-secondary truncate max-w-sm">
                          {p.note}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => handleStartEditPayment(p)}
                        className="p-1.5 text-content-tertiary hover:text-cyan-400 rounded-lg hover:bg-white/[0.06] transition-colors"
                        title="Edit payment amount or note"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeletePaymentConfirm(p)}
                        className="p-1.5 text-content-tertiary hover:text-rose-400 rounded-lg hover:bg-white/[0.06] transition-colors"
                        title="Delete payment and restore balance"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-border-subtle text-xs text-content-tertiary">
            <span>
              Total Payments Recorded: <strong className="text-white">{activeDebtPayments.length}</strong>
            </span>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setHistoryDebtId(null);
                setEditingPayment(null);
              }}
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Debt Confirmation */}
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

      {/* Delete Payment Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deletePaymentConfirm)}
        onClose={() => setDeletePaymentConfirm(null)}
        onConfirm={async () => {
          if (deletePaymentConfirm && onDeletePayment) {
            await onDeletePayment(deletePaymentConfirm.id);
            setDeletePaymentConfirm(null);
          }
        }}
        title="Delete Payment Entry?"
        description={
          deletePaymentConfirm
            ? `Are you sure you want to delete this payment of ${formatRM(deletePaymentConfirm.amount)}? The amount will be automatically restored to your remaining debt balance.`
            : ''
        }
        confirmLabel="Delete Payment"
      />

      {/* Undo Monthly Payment Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(undoPaymentConfirm)}
        onClose={() => setUndoPaymentConfirm(null)}
        onConfirm={async () => {
          if (undoPaymentConfirm && onDeletePayment) {
            await onDeletePayment(undoPaymentConfirm.payment.id);
            setUndoPaymentConfirm(null);
          }
        }}
        title={`Undo ${currentMonthName} Payment?`}
        description={
          undoPaymentConfirm
            ? `This will remove the recorded installment of ${formatRM(undoPaymentConfirm.payment.amount)} for "${undoPaymentConfirm.debt.title}" and restore the amount to your remaining balance.`
            : ''
        }
        confirmLabel="Undo Payment"
      />
    </div>
  );
};
