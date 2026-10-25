import React, { useState } from 'react';
import { IncomeItem, IncomeStreamType } from '@/domain/types';
import { formatRM } from './financeUtils';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import {
  Wallet,
  Plus,
  Trash2,
  Briefcase,
  Repeat,
} from 'lucide-react';

interface IncomeStreamsCardProps {
  incomes: IncomeItem[];
  onAddIncome: (data: {
    title: string;
    amount: number;
    type: IncomeStreamType;
    isRecurring: boolean;
    dateReceived?: string;
    sourceNotes?: string;
  }) => Promise<void>;
  onDeleteIncome: (id: string) => Promise<void>;
}

const TYPE_OPTIONS: { value: IncomeStreamType; label: string }[] = [
  { value: 'monthly_salary', label: 'Monthly Base Salary' },
  { value: 'freelance_project', label: 'Freelance Project (One-off)' },
  { value: 'business_sales', label: 'Business / Services Sales' },
  { value: 'passive_other', label: 'Investments / Dividends / Passive' },
];

const TYPE_BADGES: Record<
  IncomeStreamType,
  { label: string; bg: string; text: string; border: string }
> = {
  monthly_salary: {
    label: 'Base Salary',
    bg: 'bg-emerald-500/15',
    text: 'text-emerald-300',
    border: 'border-emerald-400/30',
  },
  freelance_project: {
    label: 'Freelance / Project',
    bg: 'bg-cyan-500/15',
    text: 'text-cyan-300',
    border: 'border-cyan-400/30',
  },
  business_sales: {
    label: 'Business',
    bg: 'bg-purple-500/15',
    text: 'text-purple-300',
    border: 'border-purple-400/30',
  },
  passive_other: {
    label: 'Passive / Other',
    bg: 'bg-amber-500/15',
    text: 'text-amber-300',
    border: 'border-amber-400/30',
  },
};

export const IncomeStreamsCard: React.FC<IncomeStreamsCardProps> = ({
  incomes,
  onAddIncome,
  onDeleteIncome,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<IncomeStreamType>('monthly_salary');
  const [isRecurring, setIsRecurring] = useState(true);
  const [dateReceived, setDateReceived] = useState(() => new Date().toISOString().split('T')[0]);
  const [sourceNotes, setSourceNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculation for current month
  const currentMonthPrefix = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

  const recurringIncomes = incomes.filter((inc) => inc.isRecurring);
  const oneOffIncomesThisMonth = incomes.filter(
    (inc) => !inc.isRecurring && (!inc.dateReceived || inc.dateReceived.startsWith(currentMonthPrefix))
  );

  const totalRecurring = recurringIncomes.reduce((sum, inc) => sum + (inc.amount || 0), 0);
  const totalOneOffThisMonth = oneOffIncomesThisMonth.reduce((sum, inc) => sum + (inc.amount || 0), 0);
  const totalCurrentMonthIncome = totalRecurring + totalOneOffThisMonth;

  const handleOpenAdd = () => {
    setTitle('');
    setAmount('');
    setType('monthly_salary');
    setIsRecurring(true);
    setDateReceived(new Date().toISOString().split('T')[0]);
    setSourceNotes('');
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const handleTypeChange = (newType: IncomeStreamType) => {
    setType(newType);
    if (newType === 'monthly_salary') {
      setIsRecurring(true);
    } else if (newType === 'freelance_project') {
      setIsRecurring(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(amount);

    if (!title.trim()) {
      setFormError('Please enter an income stream name.');
      return;
    }
    if (isNaN(amountNum) || amountNum <= 0) {
      setFormError('Please enter a valid income amount.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onAddIncome({
        title: title.trim(),
        amount: amountNum,
        type,
        isRecurring,
        dateReceived: dateReceived || undefined,
        sourceNotes: sourceNotes.trim() || undefined,
      });
      setIsAddModalOpen(false);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to add income stream.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#0c1527]/80 backdrop-blur-xl p-5 md:p-6 shadow-2xl relative overflow-hidden transition-all duration-300">
      {/* Background ambient gradient */}
      <div className="absolute -top-16 -right-16 w-56 h-56 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.25)]">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-content-primary flex items-center gap-2">
              Income Streams
              {incomes.length > 0 && (
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-400/25">
                  {incomes.length} Streams
                </span>
              )}
            </h3>
            <p className="text-xs text-content-secondary">
              Recurring salary, freelance projects, or one-off side income
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="px-3.5 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/35 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 shadow-[0_0_12px_rgba(16,185,129,0.2)]"
        >
          <Plus className="w-4 h-4" />
          <span>Add Income Stream</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6 relative z-10">
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 flex flex-col justify-between">
          <span className="text-[11px] font-medium text-content-tertiary uppercase tracking-wider block">
            Monthly Fixed Salary
          </span>
          <span className="text-2xl font-bold font-mono tracking-tight text-emerald-400">
            {formatRM(totalRecurring)}
          </span>
          <span className="text-[10px] text-content-secondary mt-1 block">
            {recurringIncomes.length} recurring sources
          </span>
        </div>

        <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 flex flex-col justify-between">
          <span className="text-[11px] font-medium text-content-tertiary uppercase tracking-wider block">
            Freelance & Projects (This Month)
          </span>
          <span className="text-2xl font-bold font-mono tracking-tight text-cyan-400">
            {formatRM(totalOneOffThisMonth)}
          </span>
          <span className="text-[10px] text-content-secondary mt-1 block">
            {oneOffIncomesThisMonth.length} one-off project payouts
          </span>
        </div>

        <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 flex flex-col justify-between">
          <span className="text-[11px] font-medium text-content-tertiary uppercase tracking-wider block">
            Total Inflow (This Month)
          </span>
          <span className="text-2xl font-bold font-mono tracking-tight text-white">
            {formatRM(totalCurrentMonthIncome)}
          </span>
          <span className="text-[10px] text-emerald-400/80 mt-1 block">
            Available for commitments & spending
          </span>
        </div>
      </div>

      {/* Income List */}
      {incomes.length === 0 ? (
        <div className="py-10 text-center rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.01] relative z-10">
          <Wallet className="w-10 h-10 mx-auto text-content-tertiary mb-3 opacity-50" />
          <p className="text-sm font-semibold text-content-primary">No income streams recorded yet</p>
          <p className="text-xs text-content-secondary max-w-sm mx-auto mt-1">
            Click &quot;Add Income Stream&quot; to log your base salary or any freelance client payments.
          </p>
        </div>
      ) : (
        <div className="space-y-3 relative z-10">
          {incomes.map((item) => {
            const badge = TYPE_BADGES[item.type] || TYPE_BADGES.monthly_salary;
            return (
              <div
                key={item.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:border-white/[0.15] transition-all duration-200"
              >
                <div className="flex items-start sm:items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center flex-shrink-0 text-emerald-400">
                    {item.isRecurring ? <Repeat className="w-4 h-4" /> : <Briefcase className="w-4 h-4" />}
                  </div>

                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-white tracking-tight truncate">
                        {item.title}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${badge.bg} ${badge.text} ${badge.border}`}
                      >
                        {badge.label}
                      </span>
                      {item.isRecurring ? (
                        <span className="text-[10px] text-emerald-400/90 font-medium">
                          • Every Month
                        </span>
                      ) : (
                        <span className="text-[10px] text-cyan-400/90 font-medium">
                          • One-off ({item.dateReceived || 'This month'})
                        </span>
                      )}
                    </div>
                    {item.sourceNotes && (
                      <p className="text-xs text-content-secondary truncate max-w-md">
                        {item.sourceNotes}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 flex-shrink-0">
                  <div className="text-right">
                    <span className="text-lg font-bold font-mono text-emerald-400 tracking-tight block">
                      +{formatRM(item.amount)}
                    </span>
                    <span className="text-[10px] text-content-tertiary">
                      {item.isRecurring ? '/month' : 'net'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setDeleteId(item.id)}
                    className="p-1.5 text-content-tertiary hover:text-rose-400 rounded-lg hover:bg-white/[0.06] transition-colors"
                    title="Delete income record"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Income Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Income Stream"
        description="Record your fixed monthly salary or one-off freelance project payments to calculate your Safe-to-Spend."
        maxWidth="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {formError && (
            <div className="p-3 text-xs rounded-xl bg-accent-ember/10 border border-accent-ember/20 text-accent-ember">
              {formError}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-content-secondary">
              Income Stream / Source Name
            </label>
            <Input
              type="text"
              placeholder="e.g. Monthly Salary / Sakura Store Web Design / Mobile App UI"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-content-secondary">
                Amount Received (RM)
              </label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="e.g. 3500.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-content-secondary">
                Income Category
              </label>
              <Select
                options={TYPE_OPTIONS}
                value={type}
                onChange={(e) => handleTypeChange(e.target.value as IncomeStreamType)}
              />
            </div>
          </div>

          {/* Recurring Toggle Button */}
          <div className="p-3.5 rounded-xl border border-white/[0.08] bg-white/[0.02] flex items-center justify-between gap-3">
            <div>
              <span className="text-xs font-semibold text-content-primary block">
                Recurring Every Month?
              </span>
              <span className="text-[11px] text-content-secondary block mt-0.5">
                {isRecurring
                  ? 'Yes (Fixed recurring - automatically accounted for in monthly cashflow)'
                  : 'No (One-off / Freelance - accounted specifically for the received month)'}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsRecurring(!isRecurring)}
              className={`w-12 h-6 rounded-full transition-colors relative flex items-center p-0.5 ${
                isRecurring ? 'bg-emerald-500' : 'bg-white/[0.15]'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  isRecurring ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {!isRecurring && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-content-secondary">
                Date Received (Billing Month)
              </label>
              <Input
                type="date"
                value={dateReceived}
                onChange={(e) => setDateReceived(e.target.value)}
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-content-secondary">
              Notes / Remarks (Optional)
            </label>
            <Input
              type="text"
              placeholder="e.g. Milestone 1 payment, client Sakura Store"
              value={sourceNotes}
              onChange={(e) => setSourceNotes(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsAddModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
              className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold"
            >
              {isSubmitting ? 'Saving...' : 'Save Income'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteId)}
        title="Delete Income Stream"
        description="Are you sure you want to delete this income stream? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={async () => {
          if (deleteId) {
            await onDeleteIncome(deleteId);
            setDeleteId(null);
          }
        }}
        onClose={() => setDeleteId(null)}
      />
    </div>
  );
};
