import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/nemoDb';
import {
  atomicAddHydration,
  atomicUpdateHydration,
  atomicDeleteHydration,
  atomicClearHydrationLogs,
} from '@/db/operations';
import type { HydrationLog } from '@/domain/types';
import { Modal } from '@/components/ui/Modal';
import {
  Droplet,
  Pencil,
  Trash2,
  Plus,
  AlertCircle,
  Check,
  X,
  RotateCcw,
  Info,
  Calendar,
} from 'lucide-react';

interface ManageHydrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ManageHydrationModal: React.FC<ManageHydrationModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'7days' | 'all'>('7days');
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [editAmountMl, setEditAmountMl] = useState<number>(250);
  const [editDate, setEditDate] = useState<string>('');
  const [isAddingNew, setIsAddingNew] = useState<boolean>(false);
  const [newAmountMl, setNewAmountMl] = useState<number>(250);
  const [newDate, setNewDate] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [confirmClearType, setConfirmClearType] = useState<'7days' | 'all' | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const logs = useLiveQuery(() => db.hydrationLogs.toArray(), []) ?? [];

  const showFeedback = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  // Date boundary calculations
  const today = useMemo(() => new Date(), []);
  const formatLocalDate = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const todayStr = useMemo(() => formatLocalDate(today), [today]);

  const sevenDaysAgoStr = useMemo(() => {
    const d = new Date(today);
    d.setDate(today.getDate() - 6);
    return formatLocalDate(d);
  }, [today]);

  const past7Logs = useMemo(() => {
    return logs
      .filter((l) => l.date >= sevenDaysAgoStr && l.date <= todayStr)
      .sort((a, b) => (b.loggedAt > a.loggedAt ? 1 : -1));
  }, [logs, sevenDaysAgoStr, todayStr]);

  const allLogsSorted = useMemo(() => {
    return [...logs].sort((a, b) => (b.loggedAt > a.loggedAt ? 1 : -1));
  }, [logs]);

  const displayedLogs = activeTab === '7days' ? past7Logs : allLogsSorted;

  const past7TotalMl = useMemo(() => {
    return past7Logs.reduce((sum, l) => sum + (l.amountMl || 0), 0);
  }, [past7Logs]);

  const avg7DayMl = useMemo(() => {
    return Math.round(past7TotalMl / 7);
  }, [past7TotalMl]);

  // Handlers
  const handleStartEdit = (log: HydrationLog) => {
    setEditingLogId(log.id);
    setEditAmountMl(log.amountMl);
    setEditDate(log.date);
    setIsAddingNew(false);
  };

  const handleSaveEdit = async (id: string) => {
    if (editAmountMl <= 0) {
      await atomicDeleteHydration(db, id);
      showFeedback('Entry removed (amount was 0 ml).');
    } else {
      await atomicUpdateHydration(db, id, {
        amountMl: editAmountMl,
        date: editDate || todayStr,
      });
      showFeedback(`Updated entry to ${editAmountMl.toLocaleString()} ml.`);
    }
    setEditingLogId(null);
  };

  const handleDeleteLog = async (id: string, amount: number) => {
    await atomicDeleteHydration(db, id);
    showFeedback(`Deleted ${amount} ml entry.`);
  };

  const handleClearLogs = async (type: '7days' | 'all') => {
    if (type === '7days') {
      const idsToDelete = past7Logs.map((l) => l.id);
      await atomicClearHydrationLogs(db, idsToDelete);
      showFeedback(`Cleared ${idsToDelete.length} logs from past 7 days. Average reset to 0 ml.`);
    } else {
      await atomicClearHydrationLogs(db);
      showFeedback('All hydration records cleared. Average reset to 0 ml.');
    }
    setConfirmClearType(null);
  };

  const handleAddNew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newAmountMl <= 0) return;

    await atomicAddHydration(db, {
      date: newDate || todayStr,
      amountMl: newAmountMl,
      loggedAt: new Date().toISOString(),
    });

    showFeedback(`Added ${newAmountMl.toLocaleString()} ml entry.`);
    setIsAddingNew(false);
    setNewAmountMl(250);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Manage Hydration History"
      description="View, edit, or reset water intake records that calculate your daily and 7-day hydration average."
      maxWidth="lg"
    >
      <div className="space-y-5 py-2">
        {/* Status Toast Message */}
        {statusMessage && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 text-xs animate-in fade-in duration-200">
            <Check className="w-4 h-4 shrink-0 text-cyan-400" />
            <span className="font-medium">{statusMessage}</span>
          </div>
        )}

        {/* Rolling Calculation Explanation Banner */}
        <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-500/20 text-xs text-slate-300 space-y-2">
          <div className="flex items-start gap-2.5">
            <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-cyan-200">
                How is the 7-Day Hydration average calculated?
              </p>
              <p className="text-content-secondary leading-relaxed">
                Nemo sums all water logged over the rolling 7-day window ({sevenDaysAgoStr} to {todayStr}) and divides by 7 days:
              </p>
              <div className="font-mono text-cyan-300 text-[11px] bg-black/30 p-2 rounded-lg border border-white/5 flex items-center justify-between">
                <span>
                  {past7TotalMl.toLocaleString()} ml total ÷ 7 days ={' '}
                  <strong className="text-white text-xs">{avg7DayMl.toLocaleString()} ml/day</strong>
                </span>
                <span className="text-[10px] text-content-secondary">
                  {past7Logs.length} {past7Logs.length === 1 ? 'log' : 'logs'} in window
                </span>
              </div>
              <p className="text-[11px] text-content-secondary/80">
                If a past log was created during testing or entered by mistake, edit its amount below or click <strong>Clear Logs</strong> to reset your average to zero.
              </p>
            </div>
          </div>
        </div>

        {/* Metric Badges & Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-white/[0.04] border border-white/10 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('7days')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === '7days'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold'
                  : 'text-content-secondary hover:text-content-primary'
              }`}
            >
              Past 7 Days ({past7Logs.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'all'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold'
                  : 'text-content-secondary hover:text-content-primary'
              }`}
            >
              All History ({logs.length})
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {!isAddingNew && (
              <button
                type="button"
                onClick={() => {
                  setIsAddingNew(true);
                  setEditingLogId(null);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 border border-cyan-500/20 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add Log
              </button>
            )}

            {displayedLogs.length > 0 && !confirmClearType && (
              <button
                type="button"
                onClick={() => setConfirmClearType(activeTab)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 border border-rose-500/20 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Clear {activeTab === '7days' ? 'Past 7 Days' : 'All'}
              </button>
            )}
          </div>
        </div>

        {/* Clear Confirmation Prompt */}
        {confirmClearType && (
          <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/30 space-y-3 animate-in fade-in duration-150">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-rose-200">
                  Confirm reset of {confirmClearType === '7days' ? 'past 7-day hydration logs' : 'all hydration history'}?
                </p>
                <p className="text-[11px] text-rose-300/80 mt-0.5">
                  This will permanently delete {confirmClearType === '7days' ? past7Logs.length : logs.length} records.
                  Your 7-day average will immediately reset to <strong>0 ml / day</strong>.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setConfirmClearType(null)}
                className="px-3 py-1.5 rounded-lg text-xs text-content-secondary hover:text-content-primary border border-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleClearLogs(confirmClearType)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white transition-colors"
              >
                Yes, Clear and Reset to 0
              </button>
            </div>
          </div>
        )}

        {/* Add New Entry Form */}
        {isAddingNew && (
          <form
            onSubmit={handleAddNew}
            className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/30 space-y-3 animate-in fade-in duration-150"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-cyan-200 flex items-center gap-1.5">
                <Droplet className="w-3.5 h-3.5 text-cyan-400" /> Add Hydration Entry
              </span>
              <button
                type="button"
                onClick={() => setIsAddingNew(false)}
                className="text-content-secondary hover:text-content-primary p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-content-secondary block mb-1">
                  Intake Volume (ml)
                </label>
                <input
                  type="number"
                  min="50"
                  max="5000"
                  step="50"
                  value={newAmountMl}
                  onChange={(e) => setNewAmountMl(parseInt(e.target.value, 10) || 0)}
                  className="w-full rounded-xl bg-white/[0.05] border border-white/10 px-3 py-2 text-sm text-cyan-300 font-mono font-bold focus:outline-none focus:border-cyan-400"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] text-content-secondary block mb-1">
                  Log Date
                </label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full rounded-xl bg-white/[0.05] border border-white/10 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-400"
                  required
                />
              </div>
            </div>

            {/* Presets */}
            <div className="flex items-center gap-2">
              {[250, 500, 750, 1000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setNewAmountMl(preset)}
                  className={`flex-1 py-1 rounded-lg text-xs font-mono border transition-colors ${
                    newAmountMl === preset
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                      : 'bg-white/5 text-content-secondary hover:text-content-primary border-white/5'
                  }`}
                >
                  {preset}ml
                </button>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-1 border-t border-white/10">
              <button
                type="button"
                onClick={() => setIsAddingNew(false)}
                className="px-3 py-1.5 rounded-lg text-xs text-content-secondary hover:text-content-primary transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs transition-colors"
              >
                Save Log
              </button>
            </div>
          </form>
        )}

        {/* Logs List Container */}
        <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
          {displayedLogs.length === 0 ? (
            <div className="p-8 text-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02]">
              <Droplet className="w-8 h-8 text-cyan-400/40 mx-auto mb-2" />
              <p className="text-sm font-medium text-content-primary">No hydration logs recorded</p>
              <p className="text-xs text-content-secondary/70 mt-1 max-w-sm mx-auto">
                {activeTab === '7days'
                  ? 'There are no water intake logs in the past 7 days. Your 7-day rolling average is currently 0 ml/day.'
                  : 'Your hydration database is currently empty.'}
              </p>
              <button
                type="button"
                onClick={() => {
                  setIsAddingNew(true);
                  setNewAmountMl(250);
                }}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Log 250 ml Water
              </button>
            </div>
          ) : (
            displayedLogs.map((log) => {
              const isEditing = editingLogId === log.id;
              const dateObj = new Date(log.loggedAt || log.date);
              const formattedDate = log.date === todayStr ? 'Today' : log.date;
              const formattedTime = !isNaN(dateObj.getTime())
                ? dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : '';

              if (isEditing) {
                return (
                  <div
                    key={log.id}
                    className="p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-400/40 space-y-3 animate-in fade-in duration-100"
                  >
                    <div className="flex items-center justify-between text-xs text-cyan-300 font-medium">
                      <span>Editing Log ({log.id})</span>
                      <span className="text-[11px] text-content-secondary">{log.loggedAt}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="text-[10px] text-content-secondary block mb-1">
                          Amount (ml)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="5000"
                          step="50"
                          value={editAmountMl}
                          onChange={(e) => setEditAmountMl(parseInt(e.target.value, 10) || 0)}
                          className="w-full rounded-lg bg-black/40 border border-cyan-500/30 px-3 py-1.5 text-sm font-mono text-cyan-200 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-content-secondary block mb-1">
                          Date
                        </label>
                        <input
                          type="date"
                          value={editDate}
                          onChange={(e) => setEditDate(e.target.value)}
                          className="w-full rounded-lg bg-black/40 border border-cyan-500/30 px-3 py-1.5 text-xs text-slate-200 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Quick delta chips */}
                    <div className="flex items-center gap-1.5">
                      {[-100, -50, +50, +100].map((delta) => (
                        <button
                          key={delta}
                          type="button"
                          onClick={() => setEditAmountMl((prev) => Math.max(0, prev + delta))}
                          className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-[11px] font-mono text-content-secondary hover:text-cyan-300 transition-colors"
                        >
                          {delta > 0 ? `+${delta}` : delta}ml
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-white/10">
                      <button
                        type="button"
                        onClick={() => setEditingLogId(null)}
                        className="px-3 py-1 rounded-lg text-xs text-content-secondary hover:text-content-primary"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(log.id)}
                        className="px-3.5 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs"
                      >
                        Save Changes
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.07] hover:border-cyan-500/30 hover:bg-white/[0.05] transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                      <Droplet className="w-4 h-4 fill-cyan-400/30" />
                    </div>
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="font-mono text-sm font-bold text-cyan-300">
                          +{log.amountMl.toLocaleString()} ml
                        </span>
                        <span className="text-[11px] font-medium text-slate-300">
                          {formattedDate}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-content-secondary">
                        <Calendar className="w-3 h-3 text-content-secondary/60" />
                        <span>{log.date}</span>
                        {formattedTime && (
                          <>
                            <span>•</span>
                            <span>{formattedTime}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleStartEdit(log)}
                      title="Edit amount or date"
                      className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 border border-cyan-500/20 transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteLog(log.id, log.amountMl)}
                      title="Delete this entry"
                      className="p-1.5 rounded-lg bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 border border-rose-500/20 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info & close */}
        <div className="flex items-center justify-between pt-3 border-t border-white/10 text-xs text-content-secondary">
          <span>All updates apply immediately to Insights & Health</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-content-primary font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};
