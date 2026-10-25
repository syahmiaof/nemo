import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import {
  OFFICIAL_FIDYAH_STATE_RATES,
} from '../data/fidyahStateRates';
import {
  calculateFidyahCompounded,
  calculateYearsDelayed,
  estimateHijriYear,
} from '../lib/fidyahCalculator';
import { Calculator, ExternalLink } from 'lucide-react';
import { formatRM } from '@/features/finance/financeUtils';

interface FidyahCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveRecord: (record: {
    yearHijri: number;
    yearGregorian: number;
    missedDays: number;
    yearsDelayed: number;
    fidyahRate: number;
    totalFidyahAmount: number;
    notes?: string;
  }) => Promise<void>;
}

export const FidyahCalculatorModal: React.FC<FidyahCalculatorModalProps> = ({
  isOpen,
  onClose,
  onSaveRecord,
}) => {
  const currentYear = new Date().getFullYear();
  const [selectedState, setSelectedState] = useState(OFFICIAL_FIDYAH_STATE_RATES[0].state);
  const [ratePerDay, setRatePerDay] = useState(String(OFFICIAL_FIDYAH_STATE_RATES[0].ratePerDay));
  const [missedYearGregorian, setMissedYearGregorian] = useState(String(currentYear - 1));
  const [missedDays, setMissedDays] = useState('5');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const activeStateRate = OFFICIAL_FIDYAH_STATE_RATES.find((s) => s.state === selectedState);

  const handleStateChange = (stateName: string) => {
    setSelectedState(stateName);
    const found = OFFICIAL_FIDYAH_STATE_RATES.find((s) => s.state === stateName);
    if (found) {
      setRatePerDay(String(found.ratePerDay));
    }
  };

  const parsedDays = parseInt(missedDays, 10) || 0;
  const parsedMissedYear = parseInt(missedYearGregorian, 10) || currentYear;
  const parsedRate = parseFloat(ratePerDay) || 4.0;

  const yearsDelayed = calculateYearsDelayed(parsedMissedYear, currentYear);
  const hijriYear = estimateHijriYear(parsedMissedYear);

  const calcResult = calculateFidyahCompounded(parsedDays, yearsDelayed, parsedRate);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedDays <= 0) {
      setFormError('Sila masukkan bilangan hari tinggal yang sah.');
      return;
    }
    if (parsedMissedYear > currentYear) {
      setFormError('Tahun Ramadan mestilah tahun semasa atau tahun sebelumnya.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSaveRecord({
        yearHijri: hijriYear,
        yearGregorian: parsedMissedYear,
        missedDays: parsedDays,
        yearsDelayed,
        fidyahRate: parsedRate,
        totalFidyahAmount: calcResult.totalFidyahAmount,
        notes: notes.trim() || undefined,
      });
      onClose();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Gagal menyimpan rekod fidyah.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Kalkulator Fidyah Berganda (Mazhab Syafi'i)"
      description="Kira kadar fidyah berganda mengikut bilangan tahun tertangguh dan kadar rasmi zakat negeri di Malaysia."
      maxWidth="md"
    >
      <form onSubmit={handleSave} className="space-y-4 pt-2">
        {formError && (
          <div className="p-3 text-xs rounded-xl bg-accent-ember/10 border border-accent-ember/20 text-accent-ember">
            {formError}
          </div>
        )}

        {/* State Selection */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-content-secondary">
            Negeri Pembayaran / Kadar Zakat
          </label>
          <Select
            options={OFFICIAL_FIDYAH_STATE_RATES.map((s) => ({
              value: s.state,
              label: `${s.state} — RM ${s.ratePerDay.toFixed(2)}/hari`,
            }))}
            value={selectedState}
            onChange={(e) => handleStateChange(e.target.value)}
          />
          {activeStateRate?.notes && (
            <span className="text-[10px] text-content-tertiary block">
              {activeStateRate.notes}
            </span>
          )}
        </div>

        {/* Missed Year & Days */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-content-secondary">
              Tahun Ramadan Ditinggalkan (Masihi)
            </label>
            <Input
              type="number"
              min="2000"
              max={currentYear}
              value={missedYearGregorian}
              onChange={(e) => setMissedYearGregorian(e.target.value)}
              required
            />
            <span className="text-[10px] text-content-tertiary block">
              Tahun Hijrah: ~{hijriYear}H ({yearsDelayed} tahun tertangguh)
            </span>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-content-secondary">
              Bilangan Hari Puasa Ditinggalkan
            </label>
            <Input
              type="number"
              min="1"
              max="30"
              value={missedDays}
              onChange={(e) => setMissedDays(e.target.value)}
              required
            />
            <span className="text-[10px] text-content-tertiary block">
              Wajib diganti (qadha) {parsedDays} hari puasa
            </span>
          </div>
        </div>

        {/* Custom Rate Input if needed */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-content-secondary">
            Kadar Fidyah Sehari (RM)
          </label>
          <Input
            type="number"
            step="0.01"
            min="1"
            value={ratePerDay}
            onChange={(e) => setRatePerDay(e.target.value)}
            required
          />
        </div>

        {/* Dynamic Calculation Result Box */}
        <div className="p-4 rounded-xl border border-emerald-500/25 bg-emerald-500/10 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-300 flex items-center gap-1.5">
              <Calculator className="w-4 h-4 text-emerald-400" />
              Jumlah Kiraan Fidyah:
            </span>
            <span className="text-2xl font-extrabold font-mono text-emerald-400">
              {formatRM(calcResult.totalFidyahAmount)}
            </span>
          </div>

          <div className="text-[11px] text-emerald-200/90 space-y-1 font-mono">
            <div>Formula: {calcResult.formulaDescription}</div>
            <div className="text-[10px] font-sans text-content-secondary">
              *Hukum: Selain membayar fidyah RM {calcResult.totalFidyahAmount.toFixed(2)}, anda <strong>wajib qadha {parsedDays} hari</strong> puasa yang ditinggalkan.
            </div>
          </div>

          {activeStateRate?.officialZakatUrl && (
            <a
              href={activeStateRate.officialZakatUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 underline font-medium pt-1"
            >
              <span>Bayar Fidyah Online di Portal Rasmi {activeStateRate.state}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>

        {/* Notes */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-content-secondary">
            Catatan (Pilihan)
          </label>
          <Input
            type="text"
            placeholder="cth: Tertinggal kerana sakit/musafir Ramadhan 2022"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Batal
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting}
            className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold"
          >
            {isSubmitting ? 'Menyimpan...' : 'Simpan Rekod Fidyah'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
