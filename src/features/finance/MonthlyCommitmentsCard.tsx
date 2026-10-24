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
  Calendar,
  Sparkles,
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
  needs: 'Needs & Housing (Rent / Mortgage)',
  utilities: 'Utilities (Electricity / Water / Fiber)',
  lifestyle: 'Lifestyle (Gym / Subscriptions)',
  protection: 'Protection (Takaful / Insurance)',
  other: 'Other Fixed Expenses',
};

const CATEGORY_COLORS: Record<FinancialCommitmentCategory, { bg: string; text: string; border: string; glow: string }> = {
  needs: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-400/30', glow: 'shadow-[0_0_12px_rgba(16,185,129,0.2)]' },
  utilities: { bg: 'bg-cyan-500/15', text: 'text-cyan-400', border: 'border-cyan-400/30', glow: 'shadow-[0_0_12px_rgba(6,182,212,0.2)]' },
  lifestyle: { bg: 'bg-purple-500/15', text: 'text-purple-400', border: 'border-purple-400/30', glow: 'shadow-[0_0_12px_rgba(168,85,247,0.2)]' },
  protection: { bg: 'bg-sky-500/15', text: 'text-sky-400', border: 'border-sky-400/30', glow: 'shadow-[0_0_12px_rgba(56,189,248,0.2)]' },
  other: { bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-400/30', glow: 'shadow-[0_0_12px_rgba(245,158,11,0.2)]' },
};

const CATEGORY_OPTIONS = [
  { value: 'needs', label: 'Needs & Housing (Rent / Mortgage)' },
  { value: 'utilities', label: 'Utilities (Electricity / Water / Fiber)' },
  { value: 'lifestyle', label: 'Lifestyle (Gym / Subscriptions)' },
  { value: 'protection', label: 'Protection (Takaful / Insurance)' },
  { value: 'other', label: 'Other Fixed Expenses' },
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
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Aggregations
  const totalBurn = commitments.reduce((sum, c) => sum + (c.amount || 0), 0);
  const totalPaid = commitments
    .filter((c) => c.isPaidThisMonth)
    .reduce((sum, c) => sum + (c.amount || 0), 0);
  const totalUnpaid = Math.max(0, totalBurn - totalPaid);
  const paidRatio = totalBurn > 0 ? Math.min(100, Math.round((totalPaid / totalBurn) * 100)) : 0;
  const paidCount = commitments.filter((c) => c.isPaidThisMonth).length;

  const handleOpenAddModal = () => {
    setTitle('');
    setAmount('');
    setCategory('utilities');
    setDueDay('15');
    setNotes('');
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(amount);
    const dueDayNum = parseInt(dueDay, 10);

    if (!title.trim()) {
      setFormError('Please enter a commitment or bill title.');
      return;
    }
    if (isNaN(amountNum) || amountNum <= 0) {
      setFormError('Please enter a valid bill amount.');
      return;
    }
    if (isNaN(dueDayNum) || dueDayNum < 1 || dueDayNum > 31) {
      setFormError('Due day must be between day 1 and 31 of the month.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onAddCommitment({
        title: title.trim(),
        amount: amountNum,
        category,
        dueDayOfMonth: dueDayNum,
        notes: notes.trim() || undefined,
      });
      setIsAddModalOpen(false);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to add commitment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentDay = new Date().getDate();

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#0c1527]/80 backdrop-blur-xl p-5 md:p-6 shadow-2xl relative overflow-hidden transition-all duration-300">
      {/* Background ambient lighting */}
      <div className="absolute -top-16 -right-16 w-56 h-56 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-400/30 flex items-center justify-center text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.25)]">
            <CalendarDays className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-content-primary flex items-center gap-2">
              Monthly Commitments & Bills
              {paidRatio === 100 && totalBurn > 0 && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <Sparkles className="w-3 h-3" /> All Settled!
                </span>
              )}
            </h3>
            <p className="text-xs text-content-secondary">
              Fixed living expenses, rent, utilities, insurance, and recurring subscriptions
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenAddModal}
          className="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/35 text-amber-300 text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 shadow-[0_0_12px_rgba(245,158,11,0.2)]"
        >
          <Plus className="w-4 h-4" />
          <span>Add Commitment</span>
        </button>
      </div>

      {/* Burn Rate Visual Banner with Donut Arc */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-6 relative z-10">
        {/* Visual Progress Ring Card */}
        <div className="md:col-span-4 rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 flex items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[11px] font-medium text-content-tertiary uppercase tracking-wider block">
              Settlement Status
            </span>
            <div className="text-xl font-bold font-mono tracking-tight text-white">
              {paidCount} <span className="text-xs font-normal text-content-secondary">of {commitments.length} Paid</span>
            </div>
            <p className="text-[11px] text-content-secondary">
              {paidRatio}% of monthly obligations cleared
            </p>
          </div>

          {/* Mini SVG Ring Gauge */}
          <div className="relative w-16 h-16 flex-shrink-0 flex items-center justify-center">
            <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-white/[0.08]"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-emerald-400 transition-all duration-700 ease-out"
                strokeDasharray={`${paidRatio}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className="absolute font-mono text-xs font-bold text-white">
              {paidRatio}%
            </span>
          </div>
        </div>

        {/* Total Monthly Burn */}
        <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 flex flex-col justify-between">
            <span className="text-[11px] font-medium text-content-tertiary uppercase tracking-wider block">
              Total Monthly Burn
            </span>
            <span className="text-2xl font-bold font-mono tracking-tight text-content-primary">
              {formatRM(totalBurn)}
            </span>
            <span className="text-[10px] text-content-tertiary mt-1 block">Recurring every month</span>
          </div>

          <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 flex flex-col justify-between">
            <span className="text-[11px] font-medium text-content-tertiary uppercase tracking-wider block">
              Cleared (Paid)
            </span>
            <span className="text-2xl font-bold font-mono tracking-tight text-emerald-400">
              {formatRM(totalPaid)}
            </span>
            <span className="text-[10px] text-emerald-400/80 mt-1 block">Settled this cycle</span>
          </div>

          <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 flex flex-col justify-between">
            <span className="text-[11px] font-medium text-content-tertiary uppercase tracking-wider block">
              Remaining Due
            </span>
            <span
              className={`text-2xl font-bold font-mono tracking-tight ${
                totalUnpaid > 0 ? 'text-amber-400' : 'text-content-primary'
              }`}
            >
              {formatRM(totalUnpaid)}
            </span>
            <span className="text-[10px] text-content-tertiary mt-1 block">Outstanding to pay</span>
          </div>
        </div>
      </div>

      {/* Commitments List */}
      {commitments.length === 0 ? (
        <div className="py-12 text-center rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.01] relative z-10">
          <CalendarDays className="w-10 h-10 mx-auto text-content-tertiary mb-3 opacity-50" />
          <p className="text-sm font-semibold text-content-primary">No recurring commitments recorded</p>
          <p className="text-xs text-content-secondary max-w-sm mx-auto mt-1">
            Click &quot;Add Commitment&quot; above to track rent, electricity, water, fiber internet, or insurance bills.
          </p>
        </div>
      ) : (
        <div className="space-y-3 relative z-10">
          {commitments.map((item) => {
            const Icon = CATEGORY_ICONS[item.category] || CalendarDays;
            const catColor = CATEGORY_COLORS[item.category] || CATEGORY_COLORS.other;
            const isDueSoon =
              !item.isPaidThisMonth &&
              item.dueDayOfMonth >= currentDay &&
              item.dueDayOfMonth - currentDay <= 3;
            const isOverdue = !item.isPaidThisMonth && item.dueDayOfMonth < currentDay;

            return (
              <div
                key={item.id}
                className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-200 ${
                  item.isPaidThisMonth
                    ? 'bg-white/[0.02] border-white/[0.05] opacity-75'
                    : 'bg-white/[0.04] border-white/[0.08] hover:border-amber-400/30'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <button
                    type="button"
                    onClick={() => onTogglePaid(item.id, !item.isPaidThisMonth)}
                    className="flex-shrink-0 text-content-tertiary hover:text-emerald-400 transition-colors p-1"
                    title={item.isPaidThisMonth ? 'Mark as unpaid' : 'Mark as paid'}
                  >
                    {item.isPaidThisMonth ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <Circle className="w-5 h-5 text-content-tertiary hover:text-content-secondary" />
                    )}
                  </button>

                  <div
                    className={`w-9 h-9 rounded-xl ${catColor.bg} ${catColor.border} border flex items-center justify-center flex-shrink-0 ${catColor.text} ${catColor.glow}`}
                  >
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
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-white/[0.05] border border-white/[0.08] text-content-secondary">
                        {CATEGORY_LABELS[item.category]}
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5 text-xs text-content-tertiary mt-1 flex-wrap">
                      <span className="flex items-center gap-1 font-mono">
                        <Calendar className="w-3 h-3 text-content-tertiary" />
                        Due {item.dueDayOfMonth}th of month
                      </span>
                      {isDueSoon && (
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20">
                          <AlertCircle className="w-3 h-3" /> Due Soon ({item.dueDayOfMonth - currentDay}d left)
                        </span>
                      )}
                      {isOverdue && (
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-rose-400 bg-rose-400/10 px-1.5 py-0.5 rounded border border-rose-400/20">
                          <AlertCircle className="w-3 h-3" /> Past Due Date
                        </span>
                      )}
                      {item.notes && <span className="truncate italic">• {item.notes}</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3.5 flex-shrink-0">
                  <div className="text-right">
                    <span
                      className={`text-base font-bold font-mono tracking-tight block ${
                        item.isPaidThisMonth ? 'text-content-tertiary' : 'text-white'
                      }`}
                    >
                      {formatRM(item.amount)}
                    </span>
                    <span className="text-[10px] font-medium text-content-tertiary block">
                      {item.isPaidThisMonth ? 'Paid This Cycle' : 'Pending'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setDeleteId(item.id)}
                    className="p-1.5 text-content-tertiary hover:text-rose-400 rounded-lg hover:bg-white/[0.06] transition-colors"
                    title="Delete commitment"
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
        title="Add Monthly Commitment"
        description="Enter the details of a fixed living bill or essential payment that recurs each month."
        maxWidth="md"
      >
        <form onSubmit={handleFormSubmit} className="space-y-4 pt-2">
          {formError && (
            <div className="p-3 text-xs rounded-xl bg-accent-ember/10 border border-accent-ember/20 text-accent-ember">
              {formError}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-content-secondary">Commitment / Bill Name</label>
            <Input
              type="text"
              placeholder="e.g. Condo Rental / TNB Electricity / Time Fiber"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-content-secondary">Amount (RM)</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="e.g. 150.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-content-secondary">Category</label>
              <Select
                options={CATEGORY_OPTIONS}
                value={category}
                onChange={(e) => setCategory(e.target.value as FinancialCommitmentCategory)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-content-secondary">Monthly Due Day (1st - 31st)</label>
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
              <label className="text-xs font-semibold text-content-secondary">Notes (Optional)</label>
              <Input
                type="text"
                placeholder="Account number / auto-debit reference"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border-subtle">
            <Button type="button" variant="ghost" onClick={() => setIsAddModalOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Add Commitment'}
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
        title="Delete Commitment?"
        description="This commitment will be permanently removed from your monthly records."
        confirmLabel="Delete"
      />
    </div>
  );
};
