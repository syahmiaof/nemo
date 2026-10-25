import React, { useState } from 'react';
import { QadhaFastingRecord } from '@/domain/types';
import { formatRM } from '@/features/finance/financeUtils';
import { FidyahCalculatorModal } from './FidyahCalculatorModal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import {
  Moon,
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  Calculator,
  ShieldCheck,
} from 'lucide-react';

interface QadhaFastingSectionProps {
  records: QadhaFastingRecord[];
  onAddRecord: (data: {
    yearHijri: number;
    yearGregorian: number;
    missedDays: number;
    yearsDelayed: number;
    fidyahRate: number;
    totalFidyahAmount: number;
    notes?: string;
  }) => Promise<void>;
  onLogQadhaDay: (id: string, deltaDays: number) => Promise<void>;
  onToggleFidyahPaid: (id: string, isPaid: boolean) => Promise<void>;
  onDeleteRecord: (id: string) => Promise<void>;
}

export const QadhaFastingSection: React.FC<QadhaFastingSectionProps> = ({
  records,
  onAddRecord,
  onLogQadhaDay,
  onToggleFidyahPaid,
  onDeleteRecord,
}) => {
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Aggregations
  const totalMissedDays = records.reduce((sum, r) => sum + (r.missedDays || 0), 0);
  const totalCompletedDays = records.reduce((sum, r) => sum + (r.qadhaCompletedDays || 0), 0);
  const totalRemainingDays = records.reduce((sum, r) => sum + (r.remainingDays || 0), 0);
  const totalFidyahAmount = records.reduce((sum, r) => sum + (r.totalFidyahAmount || 0), 0);
  const totalFidyahPaid = records
    .filter((r) => r.isFidyahPaid)
    .reduce((sum, r) => sum + (r.totalFidyahAmount || 0), 0);
  const totalFidyahOutstanding = Math.max(0, totalFidyahAmount - totalFidyahPaid);

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#0c1527]/80 backdrop-blur-xl p-5 md:p-6 shadow-2xl relative overflow-hidden transition-all duration-300">
      {/* Background ambient lighting */}
      <div className="absolute -top-16 -right-16 w-56 h-56 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.25)]">
            <Moon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-content-primary flex items-center gap-2">
              Qadha Puasa & Fidyah Berganda
              {totalRemainingDays === 0 && records.length > 0 && (
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Puasa Langsai!
                </span>
              )}
            </h3>
            <p className="text-xs text-content-secondary">
              Kira hutang puasa Ramadan dan bayaran fidyah berganda tahun mengikut Mazhab Syafi&apos;i
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsCalculatorOpen(true)}
          className="px-3.5 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/35 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 shadow-[0_0_12px_rgba(16,185,129,0.2)]"
        >
          <Calculator className="w-4 h-4" />
          <span>Kira Fidyah / Tambah Rekod</span>
        </button>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6 relative z-10">
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 flex flex-col justify-between">
          <span className="text-[11px] font-medium text-content-tertiary uppercase tracking-wider block">
            Baki Hari Puasa
          </span>
          <span className="text-2xl font-bold font-mono tracking-tight text-amber-400">
            {totalRemainingDays} <span className="text-xs font-normal text-content-secondary">hari</span>
          </span>
          <span className="text-[10px] text-content-secondary mt-1 block">
            {totalCompletedDays} selesai daripada {totalMissedDays} hari asal
          </span>
        </div>

        <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 flex flex-col justify-between">
          <span className="text-[11px] font-medium text-content-tertiary uppercase tracking-wider block">
            Baki Fidyah Tertunggak
          </span>
          <span
            className={`text-2xl font-bold font-mono tracking-tight ${
              totalFidyahOutstanding > 0 ? 'text-rose-400' : 'text-emerald-400'
            }`}
          >
            {formatRM(totalFidyahOutstanding)}
          </span>
          <span className="text-[10px] text-content-secondary mt-1 block">
            {formatRM(totalFidyahPaid)} telah dibayar zakat
          </span>
        </div>

        <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 flex flex-col justify-between">
          <span className="text-[11px] font-medium text-content-tertiary uppercase tracking-wider block">
            Jumlah Keseluruhan Fidyah
          </span>
          <span className="text-2xl font-bold font-mono tracking-tight text-white">
            {formatRM(totalFidyahAmount)}
          </span>
          <span className="text-[10px] text-cyan-400 mt-1 block">
            {records.length} rekod tahun tertunggak
          </span>
        </div>
      </div>

      {/* Records List */}
      {records.length === 0 ? (
        <div className="py-10 text-center rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.01] relative z-10">
          <Moon className="w-10 h-10 mx-auto text-content-tertiary mb-3 opacity-50" />
          <p className="text-sm font-semibold text-content-primary">Tiada rekod qadha puasa atau fidyah</p>
          <p className="text-xs text-content-secondary max-w-sm mx-auto mt-1">
            Klik &quot;Kira Fidyah / Tambah Rekod&quot; di atas untuk mengira puasa Ramadan yang tertinggal daripada tahun-tahun lampau.
          </p>
        </div>
      ) : (
        <div className="space-y-3 relative z-10">
          {records.map((r) => {
            const isFullyQadha = r.remainingDays <= 0;
            return (
              <div
                key={r.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:border-white/[0.15] transition-all duration-200"
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-white tracking-tight">
                      Ramadan {r.yearGregorian} ({r.yearHijri}H)
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white/[0.05] border border-white/[0.08] text-content-secondary">
                      {r.yearsDelayed} Tahun Tertangguh
                    </span>
                    {r.isFidyahPaid ? (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        Fidyah Selesai
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-rose-500/15 border border-rose-400/30 text-rose-300">
                        Fidyah Belum Dibayar
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-content-tertiary flex-wrap">
                    <span>
                      Puasa: <strong className="text-white font-mono">{r.qadhaCompletedDays}</strong> / {r.missedDays} hari ganti
                    </span>
                    <span>
                      Baki: <strong className={isFullyQadha ? 'text-emerald-400' : 'text-amber-400'}>{r.remainingDays} hari</strong>
                    </span>
                    <span>
                      Kiraan Fidyah: <strong className="text-emerald-400 font-mono">{formatRM(r.totalFidyahAmount)}</strong>
                    </span>
                  </div>

                  {r.notes && (
                    <p className="text-xs text-content-secondary italic truncate max-w-md">
                      {r.notes}
                    </p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 flex-shrink-0 flex-wrap sm:flex-nowrap">
                  {!isFullyQadha && (
                    <button
                      type="button"
                      onClick={() => onLogQadhaDay(r.id, 1)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/30 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 shadow-[0_0_8px_rgba(16,185,129,0.15)]"
                    >
                      <Plus className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Ganti 1 Hari</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => onToggleFidyahPaid(r.id, !r.isFidyahPaid)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 ${
                      r.isFidyahPaid
                        ? 'bg-white/[0.04] border-white/[0.08] text-content-secondary hover:text-white'
                        : 'bg-cyan-500/15 border-cyan-400/30 text-cyan-300 hover:bg-cyan-500/25 shadow-[0_0_8px_rgba(6,182,212,0.15)]'
                    }`}
                  >
                    {r.isFidyahPaid ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Fidyah Dibayar</span>
                      </>
                    ) : (
                      <>
                        <Circle className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Tanda Fidyah Dibayar</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeleteId(r.id)}
                    className="p-1.5 text-content-tertiary hover:text-rose-400 rounded-lg hover:bg-white/[0.06] transition-colors"
                    title="Padam rekod"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Fidyah Auto-Calculator Modal */}
      <FidyahCalculatorModal
        isOpen={isCalculatorOpen}
        onClose={() => setIsCalculatorOpen(false)}
        onSaveRecord={onAddRecord}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={async () => {
          if (deleteId) {
            await onDeleteRecord(deleteId);
            setDeleteId(null);
          }
        }}
        title="Padam Rekod Puasa & Fidyah"
        description="Adakah anda pasti mahu memadam rekod ini dari peranti?"
        confirmLabel="Padam"
        variant="danger"
      />
    </div>
  );
};
