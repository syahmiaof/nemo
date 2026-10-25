import React, { useState } from 'react';
import type { HydrationLog } from '@/domain/types';
import { GlassWater, Droplet, Plus, Trash2, Sparkles, Pencil, X, CheckCheck } from 'lucide-react';

interface HydrationCardProps {
  logs: HydrationLog[];
  todayStr: string;
  dailyGoalMl?: number;
  onAddWater: (amountMl: number) => Promise<void>;
  onUpdateLog?: (id: string, amountMl: number) => Promise<void>;
  onDeleteLog: (id: string) => Promise<void>;
  onUpdateDailyGoal?: (goalMl: number) => void;
}

export const HydrationCard: React.FC<HydrationCardProps> = ({
  logs,
  todayStr,
  dailyGoalMl = 2500,
  onAddWater,
  onUpdateLog,
  onDeleteLog,
  onUpdateDailyGoal,
}) => {
  const [customMl, setCustomMl] = useState<string>('');
  const [editingLog, setEditingLog] = useState<HydrationLog | null>(null);
  const [editAmountMl, setEditAmountMl] = useState<number>(250);
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [targetGoalInput, setTargetGoalInput] = useState<number>(dailyGoalMl);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const todayLogs = logs
    .filter((l) => l.date === todayStr)
    .sort((a, b) => (b.loggedAt > a.loggedAt ? 1 : -1));

  const totalMl = todayLogs.reduce((sum, l) => sum + l.amountMl, 0);
  const percent = Math.min(100, Math.round((totalMl / dailyGoalMl) * 100));
  const remainingMl = Math.max(0, dailyGoalMl - totalMl);

  const triggerFeedback = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 2500);
  };

  const handleQuickAdd = async (amount: number) => {
    await onAddWater(amount);
    triggerFeedback(`+${amount} ml berjaya ditambah!`);
  };

  const handleCustomAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(customMl, 10);
    if (!isNaN(val) && val > 0) {
      await onAddWater(val);
      setCustomMl('');
      triggerFeedback(`+${val} ml berjaya ditambah!`);
    }
  };

  const startEditLog = (log: HydrationLog) => {
    setEditingLog(log);
    setEditAmountMl(log.amountMl);
  };

  const handleSaveEdit = async () => {
    if (!editingLog || !onUpdateLog) return;
    if (editAmountMl <= 0) {
      await onDeleteLog(editingLog.id);
      triggerFeedback('Rekod dipadam kerana amaun 0 ml');
    } else {
      await onUpdateLog(editingLog.id, editAmountMl);
      triggerFeedback(`Rekod dikemaskini kepada ${editAmountMl} ml`);
    }
    setEditingLog(null);
  };

  const handleDeleteWithFeedback = async (id: string, amount: number) => {
    await onDeleteLog(id);
    triggerFeedback(`Log ${amount} ml telah dipadam`);
  };

  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (targetGoalInput >= 500 && targetGoalInput <= 6000 && onUpdateDailyGoal) {
      onUpdateDailyGoal(targetGoalInput);
      triggerFeedback(`Sasaran harian ditukar ke ${targetGoalInput.toLocaleString()} ml`);
      setIsEditingGoal(false);
    }
  };

  // SVG wave calculation
  const waveFillHeight = Math.max(12, Math.min(100, percent));

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#0c1527]/80 backdrop-blur-xl p-5 md:p-6 shadow-2xl relative overflow-hidden transition-all duration-300">
      {/* Background ambient water glow */}
      <div className="absolute -top-16 -right-16 w-56 h-56 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)]">
            <Droplet className="w-5 h-5 fill-cyan-400/30" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-content-primary flex items-center gap-2">
              Hydration Tracker
              {percent >= 100 && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <Sparkles className="w-3 h-3" /> Goal Achieved!
                </span>
              )}
            </h3>

            {/* Daily Goal with Quick Edit Button */}
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-xs text-content-secondary">
                Daily intake objective:{' '}
                <span className="font-semibold text-cyan-300">{dailyGoalMl.toLocaleString()} ml</span>
              </p>
              {onUpdateDailyGoal && (
                <button
                  type="button"
                  onClick={() => {
                    setTargetGoalInput(dailyGoalMl);
                    setIsEditingGoal(true);
                  }}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-cyan-400/80 hover:text-cyan-300 px-1.5 py-0.5 rounded bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 transition-colors"
                  title="Tukar sasaran objektif harian"
                >
                  <Pencil className="w-2.5 h-2.5" /> Ubah Sasaran
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="text-left sm:text-right">
          <div className="text-2xl font-bold font-mono tracking-tight text-cyan-300">
            {totalMl.toLocaleString()}
            <span className="text-xs font-normal text-content-secondary ml-1">ml</span>
          </div>
          <div className="text-[11px] text-content-secondary">
            {remainingMl > 0 ? `${remainingMl.toLocaleString()} ml lagi untuk capai sasaran` : 'Sasaran harian tercapai! 🎉'}
          </div>
        </div>
      </div>

      {/* Main Gauge and Quick Logs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center relative z-10">
        {/* Interactive Fluid Liquid Gauge */}
        <div className="md:col-span-5 flex flex-col items-center">
          <div className="w-48 h-56 rounded-3xl border-2 border-cyan-400/25 bg-gradient-to-b from-[#0e1d38]/80 to-[#07101f]/90 relative overflow-hidden shadow-[inset_0_2px_18px_rgba(6,182,212,0.15)] p-1">
            {/* Glass reflection top highlight */}
            <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-white/[0.08] to-transparent pointer-events-none rounded-t-2xl z-20" />
            <div className="absolute top-2 left-3 w-1.5 h-12 bg-white/20 rounded-full blur-[1px] pointer-events-none z-20" />

            {/* Fluid Wave Fill */}
            <div
              className="absolute bottom-0 left-0 right-0 transition-all duration-700 ease-out z-10"
              style={{ height: `${waveFillHeight}%` }}
            >
              {/* Animated Wave crest */}
              <div className="absolute -top-3 left-0 right-0 w-[200%] h-5 opacity-70 animate-[wave_6s_linear_infinite]">
                <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-full fill-cyan-400/60">
                  <path d="M0,0 C150,90 350,-40 500,40 C650,120 900,10 1200,40 L1200,120 L0,120 Z" />
                </svg>
              </div>
              <div className="absolute -top-2 left-0 right-0 w-[200%] h-4 opacity-50 animate-[wave_4s_linear_infinite_reverse]">
                <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-full fill-teal-300/40">
                  <path d="M0,20 C200,-20 400,60 600,20 C800,-20 1000,50 1200,20 L1200,120 L0,120 Z" />
                </svg>
              </div>

              {/* Liquid Body */}
              <div className="w-full h-full bg-gradient-to-t from-cyan-600/90 via-sky-500/75 to-cyan-400/60 shadow-[0_-4px_24px_rgba(6,182,212,0.4)] backdrop-blur-sm" />
            </div>

            {/* Center Percentage Display */}
            <div className="absolute inset-0 flex flex-col items-center justify-center z-20 pointer-events-none select-none">
              <span className="text-3xl md:text-4xl font-extrabold font-mono text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]">
                {percent}%
              </span>
              <span className="text-xs font-medium text-cyan-100/90 drop-shadow">
                {totalMl.toLocaleString()} / {dailyGoalMl.toLocaleString()} ml
              </span>
            </div>
          </div>
        </div>

        {/* Quick Add Actions */}
        <div className="md:col-span-7 flex flex-col gap-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-content-secondary flex items-center justify-between">
            <span>Quick Log Intake</span>
            <span className="text-[11px] font-normal lowercase opacity-75">Klik butang untuk rekod serta-merta</span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => handleQuickAdd(250)}
              className="flex flex-col items-center justify-center p-3.5 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:bg-cyan-500/15 hover:border-cyan-400/40 active:scale-95 transition-all group"
            >
              <GlassWater className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform mb-1" />
              <span className="text-sm font-semibold text-content-primary">+250 ml</span>
              <span className="text-[10px] text-content-secondary">Glass (Cawan)</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickAdd(500)}
              className="flex flex-col items-center justify-center p-3.5 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:bg-cyan-500/15 hover:border-cyan-400/40 active:scale-95 transition-all group"
            >
              <Droplet className="w-5 h-5 text-sky-400 group-hover:scale-110 transition-transform mb-1" />
              <span className="text-sm font-semibold text-content-primary">+500 ml</span>
              <span className="text-[10px] text-content-secondary">Bottle (Botol)</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickAdd(1000)}
              className="flex flex-col items-center justify-center p-3.5 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:bg-cyan-500/15 hover:border-cyan-400/40 active:scale-95 transition-all group"
            >
              <Sparkles className="w-5 h-5 text-teal-400 group-hover:scale-110 transition-transform mb-1" />
              <span className="text-sm font-semibold text-content-primary">+1,000 ml</span>
              <span className="text-[10px] text-content-secondary">Flask (Bekas Besar)</span>
            </button>
          </div>

          {/* Custom Add Form */}
          <form onSubmit={handleCustomAdd} className="flex items-center gap-2 mt-1">
            <div className="relative flex-1">
              <input
                type="number"
                min="10"
                max="5000"
                step="10"
                value={customMl}
                onChange={(e) => setCustomMl(e.target.value)}
                placeholder="Jumlah khusus (contoh: 350)"
                className="w-full rounded-xl bg-white/[0.04] border border-white/[0.09] px-3.5 py-2.5 text-xs text-content-primary placeholder:text-content-secondary/50 focus:outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/30"
              />
              <span className="absolute right-3 top-2.5 text-[11px] text-content-secondary">ml</span>
            </div>
            <button
              type="submit"
              disabled={!customMl}
              className="px-4 py-2.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-300 font-medium text-xs flex items-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" /> Log Masuk
            </button>
          </form>

          {/* Feedback banner */}
          {statusMessage && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-cyan-500/10 border border-cyan-400/30 text-xs text-cyan-300 font-medium animate-fade-in">
              <CheckCheck className="w-4 h-4 text-cyan-400" />
              <span>{statusMessage}</span>
            </div>
          )}
        </div>
      </div>

      {/* Today's History Log List & Management */}
      <div className="mt-6 pt-5 border-t border-white/[0.08] relative z-10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-content-secondary uppercase tracking-wider">
              Senarai Rekod Hari Ini ({todayLogs.length})
            </span>
            <span className="text-[11px] text-content-secondary/70">
              — Boleh edit jumlah atau padam jika silap tekan
            </span>
          </div>
          {todayLogs.length > 0 && (
            <span className="text-xs font-mono font-medium text-cyan-300">
              Jumlah: {totalMl.toLocaleString()} ml
            </span>
          )}
        </div>

        {todayLogs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-4 text-center">
            <Droplet className="w-6 h-6 text-cyan-400/50 mx-auto mb-1.5" />
            <p className="text-xs text-content-secondary font-medium">
              Belum ada rekod hidrasi untuk hari ini.
            </p>
            <p className="text-[11px] text-content-secondary/60 mt-0.5">
              Klik butang <strong>+250ml</strong>, <strong>+500ml</strong>, <strong>+1,000ml</strong> atau masukkan jumlah sendiri di atas.
              Bila dah rekod, butang <strong>Edit</strong> dan <strong>Padam</strong> akan muncul di sini.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 max-h-48 overflow-y-auto pr-1">
            {todayLogs.map((log) => {
              const time = new Date(log.loggedAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              });
              return (
                <div
                  key={log.id}
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs hover:border-cyan-400/30 hover:bg-white/[0.05] transition-all group"
                >
                  <div className="flex flex-col">
                    <span className="font-mono text-cyan-300 font-bold text-sm">+{log.amountMl} ml</span>
                    <span className="text-[10px] text-content-secondary/70">{time}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    {onUpdateLog && (
                      <button
                        type="button"
                        onClick={() => startEditLog(log)}
                        title="Edit amaun ml"
                        aria-label="Edit hydration log"
                        className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/25 border border-cyan-500/20 hover:border-cyan-400/40 transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeleteWithFeedback(log.id, log.amountMl)}
                      title="Padam rekod ini"
                      aria-label="Remove hydration entry"
                      className="p-1.5 rounded-lg bg-rose-500/10 text-rose-300 hover:bg-rose-500/25 border border-rose-500/20 hover:border-rose-400/40 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Entry Modal */}
      {editingLog && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#0c1527] p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h4 className="text-sm font-semibold text-content-primary flex items-center gap-2">
                <Pencil className="w-4 h-4 text-cyan-400" />
                Kemaskini Rekod Air
              </h4>
              <button
                type="button"
                onClick={() => setEditingLog(null)}
                className="text-content-secondary hover:text-content-primary p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="text-xs text-content-secondary block mb-1.5">
                Jumlah Pengambilan Air (ml)
              </label>
              <input
                type="number"
                min="0"
                max="5000"
                step="50"
                value={editAmountMl}
                onChange={(e) => setEditAmountMl(parseInt(e.target.value, 10) || 0)}
                className="w-full rounded-xl bg-white/[0.05] border border-white/10 px-3 py-2 text-sm text-cyan-300 font-mono font-bold focus:outline-none focus:border-cyan-400"
              />
            </div>

            {/* Quick adjust buttons */}
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { label: '-100', delta: -100 },
                { label: '-50', delta: -50 },
                { label: '+50', delta: +50 },
                { label: '+100', delta: +100 },
              ].map((btn) => (
                <button
                  key={btn.label}
                  type="button"
                  onClick={() => setEditAmountMl((prev) => Math.max(0, prev + btn.delta))}
                  className="py-1 px-2 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] font-mono text-content-secondary hover:text-cyan-300 border border-white/5 transition-colors"
                >
                  {btn.label}ml
                </button>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setEditingLog(null)}
                className="px-3.5 py-2 rounded-xl text-xs text-content-secondary hover:text-content-primary transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs transition-colors"
              >
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Daily Objective Goal Modal */}
      {isEditingGoal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleSaveGoal} className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#0c1527] p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h4 className="text-sm font-semibold text-content-primary flex items-center gap-2">
                <Droplet className="w-4 h-4 text-cyan-400" />
                Tetapkan Sasaran Harian
              </h4>
              <button
                type="button"
                onClick={() => setIsEditingGoal(false)}
                className="text-content-secondary hover:text-content-primary p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="text-xs text-content-secondary block mb-1.5">
                Sasaran Air Harian (ml)
              </label>
              <input
                type="number"
                min="500"
                max="6000"
                step="100"
                value={targetGoalInput}
                onChange={(e) => setTargetGoalInput(parseInt(e.target.value, 10) || 2000)}
                className="w-full rounded-xl bg-white/[0.05] border border-white/10 px-3 py-2 text-sm text-cyan-300 font-mono font-bold focus:outline-none focus:border-cyan-400"
              />
              <span className="text-[11px] text-content-secondary/70 mt-1 block">
                Cadangan umum: 2,000 ml hingga 3,000 ml bergantung kepada berat badan dan aktiviti fizikal.
              </span>
            </div>

            {/* Presets */}
            <div className="flex items-center gap-2">
              {[2000, 2500, 3000, 3500].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setTargetGoalInput(preset)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-medium border transition-colors ${
                    targetGoalInput === preset
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40'
                      : 'bg-white/5 text-content-secondary hover:text-content-primary border-white/5'
                  }`}
                >
                  {preset}ml
                </button>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setIsEditingGoal(false)}
                className="px-3.5 py-2 rounded-xl text-xs text-content-secondary hover:text-content-primary transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs transition-colors"
              >
                Simpan Sasaran
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};