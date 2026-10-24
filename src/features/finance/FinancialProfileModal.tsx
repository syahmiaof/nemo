import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { FinancialProfile } from '@/domain/types';
import { Banknote, Calendar } from 'lucide-react';

interface FinancialProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: FinancialProfile | null;
  onSave: (data: { monthlyIncomeNet: number; paydayDayOfMonth: number }) => Promise<void>;
}

export const FinancialProfileModal: React.FC<FinancialProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSave,
}) => {
  const [income, setIncome] = useState<string>('');
  const [payday, setPayday] = useState<string>('25');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setIncome(profile.monthlyIncomeNet > 0 ? profile.monthlyIncomeNet.toString() : '');
      setPayday(profile.paydayDayOfMonth ? profile.paydayDayOfMonth.toString() : '25');
    } else {
      setIncome('');
      setPayday('25');
    }
    setError(null);
  }, [profile, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const incomeNum = parseFloat(income);
    const paydayNum = parseInt(payday, 10);

    if (isNaN(incomeNum) || incomeNum < 0) {
      setError('Please enter a valid net monthly income.');
      return;
    }
    if (isNaN(paydayNum) || paydayNum < 1 || paydayNum > 31) {
      setError('Payday must be between day 1 and 31 of the month.');
      return;
    }

    try {
      setIsSaving(true);
      await onSave({
        monthlyIncomeNet: incomeNum,
        paydayDayOfMonth: paydayNum,
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update financial profile.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Financial Profile & Income"
      description="Configure your monthly take-home income and payday schedule for accurate Safe-to-Spend cash flow forecasting."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        {error && (
          <div className="p-3 text-xs rounded-xl bg-accent-ember/10 border border-accent-ember/20 text-accent-ember">
            {error}
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-content-secondary flex items-center gap-1.5">
            <Banknote className="w-3.5 h-3.5 text-accent-mint" />
            Net Monthly Take-Home Income (RM)
          </label>
          <Input
            type="number"
            step="0.01"
            min="0"
            placeholder="e.g. 4500.00"
            value={income}
            onChange={(e) => setIncome(e.target.value)}
            required
            autoFocus
          />
          <p className="text-[11px] text-content-tertiary">
            Net salary after EPF/KWSP, SOCSO/PERKESO, and income tax (PCB) deductions.
          </p>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-content-secondary flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-accent-sky" />
            Monthly Payday (Day 1 - 31)
          </label>
          <Input
            type="number"
            min="1"
            max="31"
            placeholder="e.g. 25"
            value={payday}
            onChange={(e) => setPayday(e.target.value)}
            required
          />
          <p className="text-[11px] text-content-tertiary">
            The calendar day each month your salary is deposited into your bank account.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border-subtle">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Profile'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
