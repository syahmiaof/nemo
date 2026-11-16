import React, { useState, useEffect, useMemo } from 'react';
import {
  Moon,
  Check,
  Plus,
  Pencil,
  Trash2,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

export interface IbadahChecklistItem {
  id: string;
  name: string;
  createdAt?: string;
}

const ITEMS_STORAGE_KEY = 'nemo_ibadah_custom_items_v1';
const TICKS_STORAGE_KEY = 'nemo_ibadah_daily_ticks_v1';

export const DEFAULT_IBADAH_ITEMS: IbadahChecklistItem[] = [
  { id: 'ibd_1', name: 'Qiamullail' },
  { id: 'ibd_2', name: 'Subuh' },
  { id: 'ibd_3', name: 'Dhuha' },
  { id: 'ibd_4', name: 'Zuhur' },
  { id: 'ibd_5', name: 'Asar' },
  { id: 'ibd_6', name: 'Maghrib' },
  { id: 'ibd_7', name: 'Isyak' },
  { id: 'ibd_8', name: 'Zikir' },
  { id: 'ibd_9', name: 'Al-Quran' },
  { id: 'ibd_10', name: 'Sedekah' },
  { id: 'ibd_11', name: 'Tolong Orang' },
  { id: 'ibd_12', name: 'Jaga Mulut' },
  { id: 'ibd_13', name: 'Jaga Mata' },
  { id: 'ibd_14', name: 'Jaga Telinga' },
  { id: 'ibd_15', name: 'Jaga Perbuatan' },
];

interface IbadahChecklistCardProps {
  todayStr: string;
  onCountChange?: (completedCount: number, totalCount: number) => void;
}

export const IbadahChecklistCard: React.FC<IbadahChecklistCardProps> = ({
  todayStr,
  onCountChange,
}) => {
  // Checklist items definitions (user can add/edit/delete)
  const [items, setItems] = useState<IbadahChecklistItem[]>(() => {
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem(ITEMS_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      }
    } catch {
      // ignore
    }
    return DEFAULT_IBADAH_ITEMS;
  });

  // Daily ticks dictionary: { [dateStr]: { [itemId]: boolean } }
  const [dailyTicks, setDailyTicks] = useState<Record<string, Record<string, boolean>>>(() => {
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem(TICKS_STORAGE_KEY);
        if (saved) return JSON.parse(saved);
      }
    } catch {
      // ignore
    }
    return {};
  });

  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string>('');
  const [isAdding, setIsAdding] = useState(false);
  const [newItemName, setNewItemName] = useState('');

  // Persist items
  useEffect(() => {
    try {
      localStorage.setItem(ITEMS_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore
    }
  }, [items]);

  // Persist daily ticks
  useEffect(() => {
    try {
      localStorage.setItem(TICKS_STORAGE_KEY, JSON.stringify(dailyTicks));
    } catch {
      // ignore
    }
  }, [dailyTicks]);

  // Today's ticks mapping
  const todayTicksMap = useMemo(() => {
    return dailyTicks[todayStr] || {};
  }, [dailyTicks, todayStr]);

  // Completed count for today
  const completedTodayCount = useMemo(() => {
    return items.filter((item) => todayTicksMap[item.id]).length;
  }, [items, todayTicksMap]);

  useEffect(() => {
    onCountChange?.(completedTodayCount, items.length);
  }, [completedTodayCount, items.length, onCountChange]);

  // Toggle tick for an item today
  const handleToggleTick = (itemId: string) => {
    setDailyTicks((prev) => {
      const currentDayMap = prev[todayStr] || {};
      const nextChecked = !currentDayMap[itemId];
      return {
        ...prev,
        [todayStr]: {
          ...currentDayMap,
          [itemId]: nextChecked,
        },
      };
    });
  };

  // Add new checklist item
  const handleAddItem = () => {
    const trimmed = newItemName.trim();
    if (!trimmed) {
      setIsAdding(false);
      return;
    }

    const newItem: IbadahChecklistItem = {
      id: `ibd_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: trimmed,
      createdAt: new Date().toISOString(),
    };

    setItems((prev) => [...prev, newItem]);
    setNewItemName('');
    setIsAdding(false);
  };

  // Start edit item
  const handleStartEdit = (item: IbadahChecklistItem) => {
    setEditingItemId(item.id);
    setEditingName(item.name);
  };

  // Save edit
  const handleSaveEdit = (id: string) => {
    const trimmed = editingName.trim();
    if (trimmed) {
      setItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, name: trimmed } : i))
      );
    }
    setEditingItemId(null);
  };

  // Delete item
  const handleDeleteItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  // Reset today's ticks back to 0
  const handleResetToday = () => {
    if (!window.confirm('Reset semula checklist ibadah untuk hari ini?')) return;
    setDailyTicks((prev) => {
      const next = { ...prev };
      delete next[todayStr];
      return next;
    });
  };

  // Reset to default 15 items
  const handleResetToDefaultItems = () => {
    if (!window.confirm('Reset semula ke 15 checklist amalan asal?')) return;
    setItems(DEFAULT_IBADAH_ITEMS);
  };

  // Filtered items
  const displayedItems = useMemo(() => {
    return items.filter((item) => {
      const isChecked = Boolean(todayTicksMap[item.id]);
      if (filter === 'pending') return !isChecked;
      if (filter === 'completed') return isChecked;
      return true;
    });
  }, [items, todayTicksMap, filter]);

  const percentage = Math.round((completedTodayCount / (items.length || 1)) * 100);

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#0c1527]/85 backdrop-blur-xl p-5 md:p-6 shadow-2xl relative overflow-hidden transition-all duration-300">
      {/* Ambient background glow */}
      <div className="absolute -top-24 -right-24 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 relative z-10 border-b border-white/[0.08] pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.25)]">
            <Moon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base md:text-lg font-bold text-content-primary flex items-center gap-2">
              Checklist Ibadah Harian
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {completedTodayCount}/{items.length} Selesai ({percentage}%)
              </span>
            </h3>
            <p className="text-xs text-content-secondary mt-0.5">
              Tick amalan harian, solat, zikir, al-quran, dan akhlak rohani anda.
            </p>
          </div>
        </div>

        {/* Filter & Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center p-1 bg-white/[0.04] border border-white/10 rounded-xl">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                filter === 'all'
                  ? 'bg-emerald-500/20 text-emerald-300 font-semibold'
                  : 'text-content-secondary hover:text-content-primary'
              }`}
            >
              Semua ({items.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('pending')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                filter === 'pending'
                  ? 'bg-amber-500/20 text-amber-300 font-semibold'
                  : 'text-content-secondary hover:text-content-primary'
              }`}
            >
              Belum ({items.length - completedTodayCount})
            </button>
            <button
              type="button"
              onClick={() => setFilter('completed')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                filter === 'completed'
                  ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                  : 'text-content-secondary hover:text-content-primary'
              }`}
            >
              Selesai ({completedTodayCount})
            </button>
          </div>

          {completedTodayCount > 0 && (
            <button
              type="button"
              onClick={handleResetToday}
              className="p-1.5 rounded-lg text-content-secondary hover:text-rose-300 hover:bg-rose-500/10 border border-white/10 hover:border-rose-500/20 transition-colors cursor-pointer"
              title="Reset checklist hari ini"
              aria-label="Reset checklist hari ini"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={handleResetToDefaultItems}
            className="p-1.5 rounded-lg text-content-secondary hover:text-content-primary hover:bg-white/[0.05] border border-white/10 transition-colors cursor-pointer"
            title="Reset ke senarai asal 15 amalan"
            aria-label="Reset ke senarai asal"
          >
            <Sparkles className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-white/[0.04] h-2 rounded-full overflow-hidden mb-5 border border-white/[0.05]">
        <div
          className="bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 h-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Checklist Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 relative z-10 mb-4">
        {displayedItems.map((item) => {
          const isChecked = Boolean(todayTicksMap[item.id]);
          const isEditing = editingItemId === item.id;

          return (
            <div
              key={item.id}
              className={`group flex items-center justify-between p-3 rounded-xl border transition-all ${
                isChecked
                  ? 'bg-emerald-500/[0.08] border-emerald-400/40 shadow-[0_0_15px_rgba(16,185,129,0.12)]'
                  : 'bg-white/[0.02] border-white/[0.07] hover:bg-white/[0.04] hover:border-white/15'
              }`}
            >
              {/* Checkbox & Name */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <button
                  type="button"
                  onClick={() => handleToggleTick(item.id)}
                  className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                    isChecked
                      ? 'bg-emerald-500 border-emerald-400 text-white shadow-[0_0_10px_rgba(16,185,129,0.5)]'
                      : 'border-slate-500/60 bg-white/[0.03] hover:border-emerald-400 text-transparent'
                  }`}
                  aria-label={`Tick ${item.name}`}
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </button>

                {isEditing ? (
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveEdit(item.id);
                      if (e.key === 'Escape') setEditingItemId(null);
                    }}
                    onBlur={() => handleSaveEdit(item.id)}
                    autoFocus
                    className="w-full text-xs bg-white/10 border border-emerald-400/50 rounded px-2 py-1 text-content-primary focus:outline-none focus:ring-1 focus:ring-emerald-400"
                  />
                ) : (
                  <span
                    onClick={() => handleToggleTick(item.id)}
                    className={`text-xs font-medium cursor-pointer select-none transition-colors truncate ${
                      isChecked
                        ? 'text-emerald-200 line-through opacity-85'
                        : 'text-content-primary'
                    }`}
                  >
                    {item.name}
                  </span>
                )}
              </div>

              {/* Hover Actions */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2">
                {!isEditing && (
                  <button
                    type="button"
                    onClick={() => handleStartEdit(item)}
                    className="p-1 text-content-secondary hover:text-cyan-300 rounded transition-colors cursor-pointer"
                    title="Ubah nama"
                    aria-label="Ubah nama"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleDeleteItem(item.id)}
                  className="p-1 text-content-secondary hover:text-rose-400 rounded transition-colors cursor-pointer"
                  title="Padam amalan"
                  aria-label="Padam amalan"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add New Checklist Item Form */}
      <div className="pt-3 border-t border-white/[0.06] relative z-10">
        {isAdding ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAddItem();
            }}
            className="flex items-center gap-2 max-w-md"
          >
            <input
              type="text"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              placeholder="Nama amalan / checklist baru (cth: Solat Taubat)..."
              autoFocus
              className="flex-1 text-xs bg-white/[0.06] border border-emerald-400/40 rounded-xl px-3 py-2 text-content-primary placeholder:text-content-secondary/50 focus:outline-none focus:border-emerald-400"
            />
            <button
              type="submit"
              disabled={!newItemName.trim()}
              className="px-3.5 py-2 rounded-xl bg-emerald-500/25 hover:bg-emerald-500/35 border border-emerald-400/40 text-emerald-200 font-semibold text-xs flex items-center gap-1.5 transition-all disabled:opacity-40 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Tambah
            </button>
            <button
              type="button"
              onClick={() => {
                setIsAdding(false);
                setNewItemName('');
              }}
              className="px-2.5 py-2 rounded-xl text-content-secondary hover:text-content-primary text-xs transition-colors cursor-pointer"
            >
              Batal
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => {
              setIsAdding(true);
              setNewItemName('');
            }}
            className="py-2 px-3.5 rounded-xl text-xs font-semibold text-emerald-300 hover:text-emerald-200 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Tambah Checklist Amalan Baru
          </button>
        )}
      </div>
    </div>
  );
};
