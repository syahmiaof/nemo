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

const CATEGORY_ICONS: Record<SavingsGoalCategory, React.ElementType> = {
  emergency: Shield,
  travel: Compass,
  gadget: Laptop,
  vehicle: Car,
  other: PiggyBank,
};

const CATEGORY_LABELS: Record<SavingsGoalCategory, string> = {
  emergency: 'Tabung Kecemasan (3-6 Bulan)',
  travel: 'Percutian / Travel',
  gadget: 'Gajet & Komputer',
  vehicle: 'Kereta & Motor',
  other: 'Lain-lain',
};

const CATEGORY_OPTIONS = [
  { value: 'emergency', label: 'Tabung Kecemasan (3-6 Bulan)' },
  { value: 'travel', label: 'Percutian & Travel' },
  { value: 'gadget', label: 'Gajet & Komputer' },
  { value: 'vehicle', label: 'Kenderaan / Maintanens' },
  { value: 'other', label: 'Lain-lain' },
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
      setAddError('Sila masukkan nama tabung simpanan.');
      return;
    }
    if (isNaN(targetNum) || targetNum <= 0) {
      setAddError('Sila masukkan sasaran jumlah yang sah.');
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
      setAddError(err instanceof Error ? err.message : 'Gagal mencipta tabung.');
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
      setDepositError('Sila masukkan amaun transaksi yang sah.');
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
      setDepositError(err instanceof Error ? err.message : 'Gagal merekod transaksi simpanan.');
    } finally {
      setIsDepositing(false);
    }
  };

  return (
    <div className="bg-surface-elevated/70 backdrop-blur-md border border-border-subtle rounded-2xl p-5 shadow-sm space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-accent-mint/10 border border-accent-mint/20 flex items-center justify-center text-accent-mint">
            <PiggyBank className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-content-primary tracking-tight">
              Tabung Simpanan & Sinking Funds
            </h3>
            <p className="text-xs text-content-secondary">
              Simpanan berfokus untuk kecemasan, travel, impian gajet, dan sasaran masa depan
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
          <span>Cipta Tabung</span>
        </Button>
      </div>

      {/* Summary Totals */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl bg-surface border border-border-subtle">
          <span className="text-[11px] font-medium text-content-tertiary uppercase tracking-wider block">
            Jumlah Terkumpul
          </span>
          <span className="text-lg font-bold text-accent-mint">{formatRM(totalSaved)}</span>
        </div>
        <div className="p-3.5 rounded-xl bg-surface border border-border-subtle">
          <span className="text-[11px] font-medium text-content-tertiary uppercase tracking-wider block">
            Sasaran Keseluruhan
          </span>
          <span className="text-lg font-bold text-content-primary">{formatRM(totalTarget)}</span>
        </div>
        <div className="p-3.5 rounded-xl bg-surface border border-border-subtle">
          <span className="text-[11px] font-medium text-content-tertiary uppercase tracking-wider block">
            Peratusan Tercapai
          </span>
          <span className="text-lg font-bold text-accent-sky">{overallProgressPercent}%</span>
        </div>
      </div>

      {/* Savings Goals Grid */}
      {savingsGoals.length === 0 ? (
        <div className="py-10 text-center rounded-xl border border-dashed border-border-subtle bg-surface/50">
          <PiggyBank className="w-8 h-8 mx-auto text-content-tertiary mb-2 opacity-60" />
          <p className="text-sm font-medium text-content-secondary">Tiada tabung simpanan aktif</p>
          <p className="text-xs text-content-tertiary max-w-sm mx-auto mt-1">
            Mulakan tabung kecemasan atau rancang percutian impian anda dengan mencipta tabung simpanan hari ini.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {savingsGoals.map((goal) => {
            const Icon = CATEGORY_ICONS[goal.category || 'other'];
            const percent = goal.targetAmount > 0
              ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100))
              : 0;
            const isCompleted = goal.currentAmount >= goal.targetAmount;
            const pace = calculateMonthlySavingsPace(goal);

            return (
              <div
                key={goal.id}
                className="p-4 rounded-xl bg-surface border border-border-subtle hover:border-border-emphasis transition-all space-y-3.5 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-surface-solid border border-border-subtle flex items-center justify-center text-accent-mint flex-shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-content-primary truncate">{goal.title}</h4>
                        <span className="text-[10px] font-medium text-content-tertiary">
                          {CATEGORY_LABELS[goal.category || 'other']}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => handleOpenDeposit(goal)}
                        className="text-xs py-1 px-2.5 h-auto flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5 text-accent-mint" />
                        <span>Simpan</span>
                      </Button>

                      <button
                        type="button"
                        onClick={() => setDeleteId(goal.id)}
                        className="p-1.5 text-content-tertiary hover:text-accent-ember rounded-lg hover:bg-surface-solid transition-colors"
                        title="Padam tabung"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Progress Numbers */}
                  <div className="flex items-baseline justify-between pt-1">
                    <div>
                      <span className="text-xs text-content-tertiary block">Terkumpul</span>
                      <span className="text-lg font-extrabold text-accent-mint">{formatRM(goal.currentAmount)}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-content-tertiary block">Sasaran</span>
                      <span className="text-sm font-bold text-content-primary">{formatRM(goal.targetAmount)}</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-2 rounded-full bg-surface-solid overflow-hidden border border-border-subtle">
                    <div
                      className={`h-full transition-all duration-500 rounded-full ${
                        isCompleted ? 'bg-accent-mint' : 'bg-gradient-to-r from-accent-sky to-accent-mint'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>

                {/* Footer Info (Pace & Target Date) */}
                <div className="pt-2 border-t border-border-subtle/60 flex items-center justify-between text-xs text-content-tertiary flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    {goal.targetDate && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        Sasaran: {goal.targetDate}
                      </span>
                    )}
                    {deposits.filter((d) => d.savingsGoalId === goal.id).length > 0 && (
                      <span>({deposits.filter((d) => d.savingsGoalId === goal.id).length} rekod)</span>
                    )}
                  </div>

                  {isCompleted ? (
                    <span className="text-[11px] font-bold text-accent-mint flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Sasaran Tercapai!
                    </span>
                  ) : pace.suggestedMonthly > 0 ? (
                    <span className="text-[11px] font-medium text-accent-sky">
                      Cadangan: ~{formatRM(pace.suggestedMonthly)}/bulan
                    </span>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Savings Goal Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Cipta Tabung Simpanan"
        description="Tetapkan matlamat kewangan khas untuk memudahkan anda menabung secara konsisten."
        maxWidth="md"
      >
        <form onSubmit={handleAddSubmit} className="space-y-4 pt-2">
          {addError && (
            <div className="p-3 text-xs rounded-xl bg-accent-ember/10 border border-accent-ember/20 text-accent-ember">
              {addError}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-content-secondary">Nama Tabung</label>
            <Input
              type="text"
              placeholder="Contoh: Tabung Kecemasan 3 Bulan / Percutian Jepun"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-content-secondary">Jumlah Sasaran (RM)</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="Contoh: 5000.00"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-content-secondary">Jumlah Permulaan Sedia Ada (RM)</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="Contoh: 500.00"
                value={currentAmount}
                onChange={(e) => setCurrentAmount(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-content-secondary">Kategori Tabung</label>
              <Select
                options={CATEGORY_OPTIONS}
                value={category}
                onChange={(e) => setCategory(e.target.value as SavingsGoalCategory)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-content-secondary">Tarikh Sasaran (Pilihan)</label>
              <Input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-content-secondary">Catatan (Pilihan)</label>
            <Input
              type="text"
              placeholder="Disimpan dalam ASB / Versa / akaun simpanan khusus"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border-subtle">
            <Button type="button" variant="ghost" onClick={() => setIsAddModalOpen(false)} disabled={isSubmitting}>
              Batal
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? 'Menyimpan...' : 'Cipta Tabung'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Record Deposit / Withdrawal Modal */}
      <Modal
        isOpen={Boolean(depositGoalId)}
        onClose={() => setDepositGoalId(null)}
        title="Rekod Transaksi Tabung"
        description="Masukkan simpanan masuk atau pengeluaran dana untuk tabung ini."
        maxWidth="sm"
      >
        <form onSubmit={handleDepositSubmit} className="space-y-4 pt-2">
          {depositError && (
            <div className="p-3 text-xs rounded-xl bg-accent-ember/10 border border-accent-ember/20 text-accent-ember">
              {depositError}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-content-secondary">Jenis Transaksi</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDepositType('deposit')}
                className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
                  depositType === 'deposit'
                    ? 'bg-accent-mint/10 border-accent-mint text-accent-mint font-bold'
                    : 'bg-surface border-border-subtle text-content-secondary'
                }`}
              >
                <ArrowDownRight className="w-4 h-4" />
                Simpan (Deposit)
              </button>
              <button
                type="button"
                onClick={() => setDepositType('withdrawal')}
                className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
                  depositType === 'withdrawal'
                    ? 'bg-accent-ember/10 border-accent-ember text-accent-ember font-bold'
                    : 'bg-surface border-border-subtle text-content-secondary'
                }`}
              >
                <ArrowUpRight className="w-4 h-4" />
                Keluarkan (Withdraw)
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-content-secondary">Amaun (RM)</label>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              placeholder="Contoh: 100.00"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-content-secondary">Catatan (Pilihan)</label>
            <Input
              type="text"
              placeholder="Contoh: Baki duit belanja mingguan"
              value={depositNote}
              onChange={(e) => setDepositNote(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border-subtle">
            <Button type="button" variant="ghost" onClick={() => setDepositGoalId(null)} disabled={isDepositing}>
              Batal
            </Button>
            <Button type="submit" variant="primary" disabled={isDepositing}>
              {isDepositing ? 'Merekod...' : 'Sahkan Transaksi'}
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
        title="Padam Tabung Simpanan?"
        description="Tabung simpanan ini dan semua sejarah transaksi di dalamnya akan dipadamkan."
        confirmLabel="Padam"
      />
    </div>
  );
};
