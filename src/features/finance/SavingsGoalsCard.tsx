import React, { useState } from 'react';
import { SavingsGoal, SavingsDeposit, SavingsGoalCategory, SavingsDepositType } from '@/domain/types';
import { formatRM, calculateMonthlySavingsPace } from './financeUtils';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import {
  PiggyBank,
  Plus,
  Trash2,
  Calendar,
  Compass,
  Laptop,
  Car,
  Shield,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Sparkles,
  TrendingUp,
} from 'lucide-react';

interface SavingsGoalsCardProps {
  savingsGoals: SavingsGoal[];
  deposits: SavingsDeposit[];
  onAddSavingsGoal: (data: {
    title: string;
    targetAmount: number;
    currentAmount?: number;
    category?: SavingsGoalCategory;
    targetDate?: string;
    color?: string;
    note?: string;
  }) => Promise<void>;
  onRecordDeposit: (data: {
    savingsGoalId: string;
    amount: number;
    type: SavingsDepositType;
    note?: string;
  }) => Promise<void>;
  onDeleteSavingsGoal: (id: string) => Promise<void>;
}

const CATEGORY_CONFIG: Record<
  SavingsGoalCategory,
  { label: string; icon: React.ElementType; color: string; fillGradient: string }
> = {
  emergency: {
    label: 'Emergency Reserve (3-6 Months)',
    icon: Shield,
    color: 'text-emerald-400 bg-emerald-500/15 border-emerald-400/30',
    fillGradient: 'from-emerald-600/90 via-teal-500/80 to-emerald-400/60',
  },
  travel: {
    label: 'Travel & Exploration',
    icon: Compass,
    color: 'text-sky-400 bg-sky-500/15 border-sky-400/30',
    fillGradient: 'from-sky-600/90 via-cyan-500/80 to-sky-400/60',
  },
  gadget: {
    label: 'Technology & Hardware',
    icon: Laptop,
    color: 'text-purple-400 bg-purple-500/15 border-purple-400/30',
    fillGradient: 'from-purple-600/90 via-indigo-500/80 to-purple-400/60',
  },
  vehicle: {
    label: 'Vehicle & Mobility',
    icon: Car,
    color: 'text-amber-400 bg-amber-500/15 border-amber-400/30',
    fillGradient: 'from-amber-600/90 via-orange-500/80 to-amber-400/60',
  },
  other: {
    label: 'Special Target',
    icon: PiggyBank,
    color: 'text-teal-400 bg-teal-500/15 border-teal-400/30',
    fillGradient: 'from-teal-600/90 via-emerald-500/80 to-teal-400/60',
  },
};

const CATEGORY_OPTIONS = [
  { value: 'emergency', label: 'Emergency Reserve (3-6 Months Buffer)' },
  { value: 'travel', label: 'Travel & Exploration' },
  { value: 'gadget', label: 'Technology & Hardware Upgrades' },
  { value: 'vehicle', label: 'Vehicle & Mobility Fund' },
  { value: 'other', label: 'Special Target / Sinking Fund' },
];

export const SavingsGoalsCard: React.FC<SavingsGoalsCardProps> = ({
  savingsGoals,
  deposits,
  onAddSavingsGoal,
  onRecordDeposit,
  onDeleteSavingsGoal,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [depositGoalId, setDepositGoalId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Add Goal Form State
  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [category, setCategory] = useState<SavingsGoalCategory>('emergency');
  const [targetDate, setTargetDate] = useState('');
  const [note, setNote] = useState('');
  const [addError, setAddError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Deposit Form State
  const [depositAmount, setDepositAmount] = useState('');
  const [depositType, setDepositType] = useState<SavingsDepositType>('deposit');
  const [depositNote, setDepositNote] = useState('');
  const [depositError, setDepositError] = useState<string | null>(null);
  const [isDepositing, setIsDepositing] = useState(false);

  // Totals
  const totalSaved = savingsGoals.reduce((sum, g) => sum + (g.currentAmount || 0), 0);
  const totalTarget = savingsGoals.reduce((sum, g) => sum + (g.targetAmount || 0), 0);
  const overallProgressPercent = totalTarget > 0
    ? Math.min(100, Math.round((totalSaved / totalTarget) * 100))
    : 0;

  const handleOpenAddModal = () => {
    setTitle('');
    setTargetAmount('');
    setCurrentAmount('');
    setCategory('emergency');
    setTargetDate('');
    setNote('');
    setAddError(null);
    setIsAddModalOpen(true);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetNum = parseFloat(targetAmount);
    const currNum = currentAmount ? parseFloat(currentAmount) : 0;

    if (!title.trim()) {
      setAddError('Please enter a goal or fund title.');
      return;
    }
    if (isNaN(targetNum) || targetNum <= 0) {
      setAddError('Please enter a valid target amount.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onAddSavingsGoal({
        title: title.trim(),
        targetAmount: targetNum,
        currentAmount: isNaN(currNum) ? 0 : currNum,
        category,
        targetDate: targetDate || undefined,
        note: note.trim() || undefined,
      });
      setIsAddModalOpen(false);
    } catch (err: unknown) {
      setAddError(err instanceof Error ? err.message : 'Failed to create savings goal.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenDeposit = (goal: SavingsGoal) => {
    setDepositGoalId(goal.id);
    setDepositAmount('');
    setDepositType('deposit');
    setDepositNote('');
    setDepositError(null);
  };

  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositGoalId) return;

    const amtNum = parseFloat(depositAmount);
    if (isNaN(amtNum) || amtNum <= 0) {
      setDepositError('Please enter a valid transaction amount.');
      return;
    }

    try {
      setIsDepositing(true);
      await onRecordDeposit({
        savingsGoalId: depositGoalId,
        amount: amtNum,
        type: depositType,
        note: depositNote.trim() || undefined,
      });
      setDepositGoalId(null);
    } catch (err: unknown) {
      setDepositError(err instanceof Error ? err.message : 'Failed to record transaction.');
    } finally {
      setIsDepositing(false);
    }
  };

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#0c1527]/80 backdrop-blur-xl p-5 md:p-6 shadow-2xl relative overflow-hidden transition-all duration-300">
      {/* Background ambient lighting */}
      <div className="absolute -top-16 -right-16 w-56 h-56 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.25)]">
            <PiggyBank className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-content-primary flex items-center gap-2">
              Savings Goals & Sinking Funds
              {overallProgressPercent >= 100 && totalTarget > 0 && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <Sparkles className="w-3 h-3" /> All Targets Achieved!
                </span>
              )}
            </h3>
            <p className="text-xs text-content-secondary">
              Purpose-driven capital allocation for emergencies, travel, tech investments, and future milestones
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenAddModal}
          className="px-3.5 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/35 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 shadow-[0_0_12px_rgba(16,185,129,0.2)]"
        >
          <Plus className="w-4 h-4" />
          <span>Create Sinking Fund</span>
        </button>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-6 relative z-10">
        <div className="p-4 rounded-xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-md">
          <span className="text-[11px] font-semibold text-content-secondary uppercase tracking-wider block mb-1">
            Total Capital Accumulated
          </span>
          <div className="text-2xl font-bold font-mono tracking-tight text-emerald-400">
            {formatRM(totalSaved)}
          </div>
        </div>

        <div className="p-4 rounded-xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-md">
          <span className="text-[11px] font-semibold text-content-secondary uppercase tracking-wider block mb-1">
            Aggregate Target Objective
          </span>
          <div className="text-2xl font-bold font-mono tracking-tight text-content-primary">
            {formatRM(totalTarget)}
          </div>
        </div>

        <div className="p-4 rounded-xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-md flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-content-secondary uppercase tracking-wider block mb-1">
              Overall Fulfillment
            </span>
            <div className="text-2xl font-bold font-mono tracking-tight text-cyan-300">
              {overallProgressPercent}%
            </div>
          </div>
          {/* Circular SVG Mini Gauge */}
          <div className="relative w-12 h-12 flex items-center justify-center">
            <svg className="w-12 h-12 transform -rotate-90">
              <circle
                cx="24"
                cy="24"
                r="18"
                stroke="currentColor"
                strokeWidth="3.5"
                className="text-white/[0.08]"
                fill="transparent"
              />
              <circle
                cx="24"
                cy="24"
                r="18"
                stroke="currentColor"
                strokeWidth="3.5"
                strokeDasharray={113}
                strokeDashoffset={113 - (113 * overallProgressPercent) / 100}
                strokeLinecap="round"
                className="text-emerald-400 transition-all duration-700 ease-out"
                fill="transparent"
              />
            </svg>
            <TrendingUp className="w-4 h-4 text-emerald-400 absolute" />
          </div>
        </div>
      </div>

      {/* Sinking Funds Visual Grid */}
      {savingsGoals.length === 0 ? (
        <div className="py-12 text-center rounded-xl border border-dashed border-white/[0.1] bg-white/[0.02] relative z-10">
          <PiggyBank className="w-10 h-10 mx-auto text-content-tertiary mb-3 opacity-60" />
          <p className="text-sm font-semibold text-content-secondary">No active sinking funds</p>
          <p className="text-xs text-content-tertiary max-w-sm mx-auto mt-1">
            Build your emergency runway or start accumulating capital for high-priority targets.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
          {savingsGoals.map((goal) => {
            const config = CATEGORY_CONFIG[goal.category || 'other'];
            const Icon = config.icon;
            const percent = goal.targetAmount > 0
              ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100))
              : 0;
            const isCompleted = goal.currentAmount >= goal.targetAmount;
            const pace = calculateMonthlySavingsPace(goal);
            const goalDeposits = deposits.filter((d) => d.savingsGoalId === goal.id);

            // Wave height calculation for visual reservoir
            const waveHeight = Math.max(10, Math.min(100, percent));

            return (
              <div
                key={goal.id}
                className="rounded-xl border border-white/[0.08] bg-white/[0.03] hover:border-emerald-400/30 p-4 relative overflow-hidden transition-all duration-300 flex flex-col justify-between group"
              >
                {/* Ambient glow on hover */}
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-emerald-500/10 transition-colors" />

                <div className="space-y-3 relative z-10">
                  {/* Top Bar: Icon, Title & Actions */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${config.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-content-primary truncate">{goal.title}</h4>
                        <span className="text-[10px] font-medium text-content-secondary block">
                          {config.label}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenDeposit(goal)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/30 text-emerald-300 text-xs font-semibold flex items-center gap-1 transition-all active:scale-95"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Deposit / Withdraw</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeleteId(goal.id)}
                        className="p-1.5 text-content-tertiary hover:text-rose-400 rounded-lg hover:bg-white/[0.05] transition-colors"
                        title="Delete fund"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Visual Sinking Fund Liquid Reservoir & Progress */}
                  <div className="grid grid-cols-12 gap-3 items-center pt-1">
                    {/* Compact Fluid Sinking Fund Gauge (Like Health Hydration) */}
                    <div className="col-span-4 sm:col-span-3 flex justify-center">
                      <div className="w-20 h-24 rounded-2xl border-2 border-emerald-400/30 bg-gradient-to-b from-[#0e1d38]/90 to-[#07101f]/95 relative overflow-hidden shadow-[inset_0_2px_12px_rgba(16,185,129,0.15)] p-0.5">
                        {/* Glass reflection top highlight */}
                        <div className="absolute top-0 left-0 right-0 h-7 bg-gradient-to-b from-white/[0.12] to-transparent pointer-events-none rounded-t-xl z-20" />
                        <div className="absolute top-1.5 left-2 w-1 h-6 bg-white/25 rounded-full blur-[0.5px] pointer-events-none z-20" />

                        {/* Liquid Wave Fill */}
                        <div
                          className="absolute bottom-0 left-0 right-0 transition-all duration-700 ease-out z-10"
                          style={{ height: `${waveHeight}%` }}
                        >
                          {/* Wave crest */}
                          <div className="absolute -top-2 left-0 right-0 w-[200%] h-3 opacity-75">
                            <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-full fill-emerald-300/60">
                              <path d="M0,0 C150,90 350,-40 500,40 C650,120 900,10 1200,40 L1200,120 L0,120 Z" />
                            </svg>
                          </div>
                          {/* Liquid Body */}
                          <div className={`w-full h-full bg-gradient-to-t ${config.fillGradient} shadow-[0_-3px_15px_rgba(16,185,129,0.35)] backdrop-blur-sm`} />
                        </div>

                        {/* Center Percentage Display */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center z-20 pointer-events-none select-none">
                          <span className="text-base font-extrabold font-mono text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                            {percent}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Monetary Metrics & Bar */}
                    <div className="col-span-8 sm:col-span-9 space-y-2">
                      <div className="flex items-baseline justify-between">
                        <div>
                          <span className="text-[10px] uppercase font-semibold text-content-secondary block">
                            Accumulated
                          </span>
                          <span className="text-xl font-bold font-mono text-emerald-400">
                            {formatRM(goal.currentAmount)}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] uppercase font-semibold text-content-secondary block">
                            Target Goal
                          </span>
                          <span className="text-sm font-bold font-mono text-content-primary">
                            {formatRM(goal.targetAmount)}
                          </span>
                        </div>
                      </div>

                      {/* Progress Bar with Glow */}
                      <div className="w-full h-2 rounded-full bg-black/40 overflow-hidden border border-white/[0.08] relative">
                        <div
                          className={`h-full transition-all duration-500 rounded-full ${
                            isCompleted
                              ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.6)]'
                              : 'bg-gradient-to-r from-teal-400 to-emerald-400 shadow-[0_0_8px_rgba(45,212,191,0.5)]'
                          }`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Info (Pace & Target Date) */}
                <div className="pt-3 mt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-content-secondary flex-wrap gap-2 relative z-10">
                  <div className="flex items-center gap-2">
                    {goal.targetDate && (
                      <span className="flex items-center gap-1 text-[11px] text-content-tertiary">
                        <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                        Target: {goal.targetDate}
                      </span>
                    )}
                    {goalDeposits.length > 0 && (
                      <span className="text-[10px] text-content-tertiary">
                        ({goalDeposits.length} logs)
                      </span>
                    )}
                  </div>

                  {isCompleted ? (
                    <span className="text-[11px] font-bold text-emerald-300 flex items-center gap-1 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Target Fulfilled!
                    </span>
                  ) : pace.suggestedMonthly > 0 ? (
                    <span className="text-[11px] font-medium text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-md">
                      Suggested Pace: ~{formatRM(pace.suggestedMonthly)} / mo
                    </span>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Sinking Fund Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Create Sinking Fund"
        description="Allocate a targeted capital fund for upcoming expenses, buffers, or major acquisitions."
        maxWidth="md"
      >
        <form onSubmit={handleAddSubmit} className="space-y-4 pt-2">
          {addError && (
            <div className="p-3 text-xs rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300">
              {addError}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-content-secondary">Goal / Sinking Fund Title</label>
            <Input
              type="text"
              placeholder="e.g. 6-Month Emergency Runway / Japan Travel / M3 MacBook Pro"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-content-secondary">Target Capital (RM)</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="e.g. 10000.00"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-content-secondary">Initial Seed Capital (RM)</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="e.g. 1000.00"
                value={currentAmount}
                onChange={(e) => setCurrentAmount(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-content-secondary">Category</label>
              <Select
                options={CATEGORY_OPTIONS}
                value={category}
                onChange={(e) => setCategory(e.target.value as SavingsGoalCategory)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-content-secondary">Target Date (Optional)</label>
              <Input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-content-secondary">Storage Notes (Optional)</label>
            <Input
              type="text"
              placeholder="e.g. Deposited in high-yield cash fund / ASB / separate vault"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-white/[0.08]">
            <Button type="button" variant="ghost" onClick={() => setIsAddModalOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Sinking Fund'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Record Deposit / Withdrawal Modal */}
      <Modal
        isOpen={Boolean(depositGoalId)}
        onClose={() => setDepositGoalId(null)}
        title="Record Sinking Fund Transaction"
        description="Deposit capital to accelerate progress or log an authorized capital withdrawal."
        maxWidth="sm"
      >
        <form onSubmit={handleDepositSubmit} className="space-y-4 pt-2">
          {depositError && (
            <div className="p-3 text-xs rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300">
              {depositError}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-content-secondary">Transaction Direction</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDepositType('deposit')}
                className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
                  depositType === 'deposit'
                    ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300 font-bold shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                    : 'bg-white/[0.03] border-white/[0.08] text-content-secondary'
                }`}
              >
                <ArrowDownRight className="w-4 h-4" />
                Deposit Capital
              </button>
              <button
                type="button"
                onClick={() => setDepositType('withdrawal')}
                className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
                  depositType === 'withdrawal'
                    ? 'bg-rose-500/20 border-rose-400/40 text-rose-300 font-bold shadow-[0_0_12px_rgba(244,63,94,0.2)]'
                    : 'bg-white/[0.03] border-white/[0.08] text-content-secondary'
                }`}
              >
                <ArrowUpRight className="w-4 h-4" />
                Withdraw Capital
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-content-secondary">Amount (RM)</label>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              placeholder="e.g. 250.00"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-content-secondary">Note / Memo (Optional)</label>
            <Input
              type="text"
              placeholder="e.g. Monthly automated allocation / bonus top-up"
              value={depositNote}
              onChange={(e) => setDepositNote(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-white/[0.08]">
            <Button type="button" variant="ghost" onClick={() => setDepositGoalId(null)} disabled={isDepositing}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isDepositing}>
              {isDepositing ? 'Recording...' : 'Confirm Transaction'}
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
            await onDeleteSavingsGoal(deleteId);
            setDeleteId(null);
          }
        }}
        title="Delete Sinking Fund?"
        description="This sinking fund and all its associated transaction logs will be permanently deleted."
        confirmLabel="Delete"
      />
    </div>
  );
};
