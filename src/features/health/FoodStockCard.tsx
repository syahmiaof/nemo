import React, { useState, useEffect } from 'react';
import {
  UtensilsCrossed,
  Check,
  Plus,
  Pencil,
  Trash2,
  RotateCcw,
  Fish,
  Flame,
  Leaf,
  Pill,
} from 'lucide-react';

export interface FoodStockItem {
  id: string;
  name: string;
  category: 'protein' | 'carbs' | 'produce' | 'supplements';
  inStock: boolean;
}

const STORAGE_KEY = 'nemo_food_stock_checklist_v1';

export const DEFAULT_FOOD_CATEGORIES = [
  {
    id: 'protein' as const,
    title: 'Protein',
    icon: Fish,
    badgeColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-400/20',
    accentBorder: 'border-cyan-500/30',
  },
  {
    id: 'carbs' as const,
    title: 'Karbohidrat Sihat',
    icon: Flame,
    badgeColor: 'text-amber-400 bg-amber-500/10 border-amber-400/20',
    accentBorder: 'border-amber-500/30',
  },
  {
    id: 'produce' as const,
    title: 'Sayur, Buah & Serat',
    icon: Leaf,
    badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-400/20',
    accentBorder: 'border-emerald-500/30',
  },
  {
    id: 'supplements' as const,
    title: 'Supplement & Kesihatan',
    icon: Pill,
    badgeColor: 'text-purple-400 bg-purple-500/10 border-purple-400/20',
    accentBorder: 'border-purple-500/30',
  },
];

export const INITIAL_FOOD_ITEMS: FoodStockItem[] = [
  // 1. Protein
  { id: 'fstk_1', category: 'protein', name: 'Dada ayam / Ikan / daging / sotong / udang', inStock: true },
  { id: 'fstk_2', category: 'protein', name: 'Telur sepapan', inStock: true },
  { id: 'fstk_3', category: 'protein', name: 'Tauhu putih', inStock: true },
  { id: 'fstk_4', category: 'protein', name: 'Tempe', inStock: true },
  { id: 'fstk_5', category: 'protein', name: 'HK Soy Protein & Creatine', inStock: true },

  // 2. Karbohidrat Sihat
  { id: 'fstk_6', category: 'carbs', name: 'Ubi keledek purple', inStock: true },
  { id: 'fstk_7', category: 'carbs', name: 'Ubi kentang', inStock: true },
  { id: 'fstk_8', category: 'carbs', name: 'Oat', inStock: true },

  // 3. Sayur, buah Serat, Vitamin & Probiotik
  { id: 'fstk_9', category: 'produce', name: 'Sawi kecil', inStock: true },
  { id: 'fstk_10', category: 'produce', name: 'Cendawan White Snow / Enoki', inStock: true },
  { id: 'fstk_11', category: 'produce', name: 'Kiwi hijau', inStock: true },
  { id: 'fstk_12', category: 'produce', name: 'Avocado warna gelap', inStock: true },
  { id: 'fstk_13', category: 'produce', name: 'Bawang besar, bawang merah, bawang putih', inStock: true },
  { id: 'fstk_14', category: 'produce', name: 'Cili hidup / Cili padi & Lemon', inStock: true },

  // 4. Supplement
  { id: 'fstk_15', category: 'supplements', name: 'Madu CED asli & Peanut Butter CED', inStock: true },
  { id: 'fstk_16', category: 'supplements', name: 'French Celtic Salt dan vitamin c 21st century', inStock: true },
  { id: 'fstk_17', category: 'supplements', name: 'Ahmad Tea Jasmine Green Tea & Camomile', inStock: true },
  { id: 'fstk_18', category: 'supplements', name: 'Air kelapa fresh', inStock: true },
];

interface FoodStockCardProps {
  onCountChange?: (inStockCount: number, totalCount: number) => void;
}

export const FoodStockCard: React.FC<FoodStockCardProps> = ({ onCountChange }) => {
  const [items, setItems] = useState<FoodStockItem[]>(() => {
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      }
    } catch {
      // ignore
    }
    return INITIAL_FOOD_ITEMS;
  });

  const [activeFilter, setActiveFilter] = useState<'all' | 'need_buy' | 'in_stock'>('all');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string>('');
  const [addingCategory, setAddingCategory] = useState<string | null>(null);
  const [newItemName, setNewItemName] = useState<string>('');

  // Persist to localStorage whenever items change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore
    }
    const inStock = items.filter((i) => i.inStock).length;
    onCountChange?.(inStock, items.length);
  }, [items, onCountChange]);

  // Toggle item in stock
  const handleToggleStock = (id: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, inStock: !item.inStock } : item))
    );
  };

  // Add item to category
  const handleAddItem = (category: FoodStockItem['category']) => {
    const trimmed = newItemName.trim();
    if (!trimmed) {
      setAddingCategory(null);
      return;
    }

    const newItem: FoodStockItem = {
      id: `fstk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: trimmed,
      category,
      inStock: true,
    };

    setItems((prev) => [...prev, newItem]);
    setNewItemName('');
    setAddingCategory(null);
  };

  // Start editing item
  const handleStartEdit = (item: FoodStockItem) => {
    setEditingItemId(item.id);
    setEditingName(item.name);
  };

  // Save edit
  const handleSaveEdit = (id: string) => {
    const trimmed = editingName.trim();
    if (trimmed) {
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, name: trimmed } : item))
      );
    }
    setEditingItemId(null);
  };

  // Delete item
  const handleDeleteItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Reset to default checklist
  const handleResetDefaults = () => {
    if (window.confirm('Reset semula ke senarai makanan asal?')) {
      setItems(INITIAL_FOOD_ITEMS);
    }
  };

  // Derived counts
  const totalCount = items.length;
  const inStockCount = items.filter((i) => i.inStock).length;
  const needBuyCount = totalCount - inStockCount;

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#0c1527]/85 backdrop-blur-xl p-5 md:p-6 shadow-2xl relative overflow-hidden transition-all duration-300">
      {/* Background ambient glow */}
      <div className="absolute -top-24 -right-24 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 relative z-10 border-b border-white/[0.08] pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.25)]">
            <UtensilsCrossed className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base md:text-lg font-bold text-content-primary flex items-center gap-2">
              Checklist Stok Makanan
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {inStockCount}/{totalCount} Ada
              </span>
            </h3>
            <p className="text-xs text-content-secondary mt-0.5">
              Semak stok bahan dapur, tandakan yang habis untuk beli, atau tambah item baru.
            </p>
          </div>
        </div>

        {/* Action Controls & Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center p-1 bg-white/[0.04] border border-white/10 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                activeFilter === 'all'
                  ? 'bg-emerald-500/20 text-emerald-300 font-semibold'
                  : 'text-content-secondary hover:text-content-primary'
              }`}
            >
              Semua ({totalCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('need_buy')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                activeFilter === 'need_buy'
                  ? 'bg-amber-500/20 text-amber-300 font-semibold'
                  : 'text-content-secondary hover:text-content-primary'
              }`}
            >
              Perlu Beli ({needBuyCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('in_stock')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                activeFilter === 'in_stock'
                  ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                  : 'text-content-secondary hover:text-content-primary'
              }`}
            >
              Ada Stok ({inStockCount})
            </button>
          </div>

          <button
            type="button"
            onClick={handleResetDefaults}
            className="p-1.5 rounded-lg text-content-secondary hover:text-content-primary hover:bg-white/[0.05] border border-white/10 transition-colors cursor-pointer"
            title="Reset ke senarai asal"
            aria-label="Reset senarai makanan"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 4 CATEGORIES GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10 items-start">
        {DEFAULT_FOOD_CATEGORIES.map((cat) => {
          const categoryItems = items.filter((item) => {
            if (item.category !== cat.id) return false;
            if (activeFilter === 'need_buy') return !item.inStock;
            if (activeFilter === 'in_stock') return item.inStock;
            return true;
          });

          const totalInCat = items.filter((item) => item.category === cat.id).length;
          const inStockInCat = items.filter((item) => item.category === cat.id && item.inStock).length;
          const Icon = cat.icon;

          return (
            <div
              key={cat.id}
              className={`rounded-2xl border bg-white/[0.02] border-white/[0.08] p-4 flex flex-col justify-between transition-all duration-200 hover:border-white/15`}
            >
              {/* Category Header */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg border ${cat.badgeColor}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <h4 className="text-xs font-bold text-content-primary tracking-wide">
                    {cat.title}
                  </h4>
                </div>
                <span className="text-[11px] font-mono text-content-secondary font-medium">
                  {inStockInCat}/{totalInCat}
                </span>
              </div>

              {/* Items List */}
              <div className="space-y-1.5 min-h-[160px] flex-1">
                {categoryItems.length === 0 ? (
                  <div className="py-6 text-center text-[11px] text-content-secondary/60 italic">
                    {activeFilter === 'need_buy'
                      ? 'Tiada item yang habis! Semua ada stok ✨'
                      : 'Tiada item dalam kategori ini.'}
                  </div>
                ) : (
                  categoryItems.map((item) => {
                    const isEditing = editingItemId === item.id;

                    return (
                      <div
                        key={item.id}
                        className={`group flex items-start justify-between gap-2 p-2 rounded-xl border transition-all ${
                          item.inStock
                            ? 'bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.04]'
                            : 'bg-amber-500/[0.04] border-amber-500/20 hover:border-amber-500/30'
                        }`}
                      >
                        {/* Checkbox + Name */}
                        <div className="flex items-start gap-2.5 flex-1 min-w-0">
                          <button
                            type="button"
                            onClick={() => handleToggleStock(item.id)}
                            className={`mt-0.5 w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                              item.inStock
                                ? 'bg-emerald-500 border-emerald-400 text-white shadow-[0_0_8px_rgba(16,185,129,0.4)]'
                                : 'border-amber-400/50 bg-amber-500/10 hover:border-amber-400 text-transparent'
                            }`}
                            title={item.inStock ? 'Tandakan sebagai Habis' : 'Tandakan sebagai Ada Stok'}
                            aria-label={`Toggle ${item.name}`}
                          >
                            <Check className="w-3 h-3 stroke-[3]" />
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
                              className="w-full text-xs bg-white/10 border border-cyan-400/40 rounded px-2 py-0.5 text-content-primary focus:outline-none focus:ring-1 focus:ring-cyan-400"
                            />
                          ) : (
                            <span
                              onClick={() => handleToggleStock(item.id)}
                              className={`text-xs leading-snug cursor-pointer select-none transition-colors ${
                                item.inStock
                                  ? 'text-content-primary'
                                  : 'text-amber-200/90 font-medium'
                              }`}
                            >
                              {item.name}
                              {!item.inStock && (
                                <span className="block text-[10px] text-amber-400 font-normal mt-0.5">
                                  ● Perlu Beli / Habis
                                </span>
                              )}
                            </span>
                          )}
                        </div>

                        {/* Action buttons (Edit & Delete) */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          {!isEditing && (
                            <button
                              type="button"
                              onClick={() => handleStartEdit(item)}
                              className="p-1 text-content-secondary hover:text-cyan-300 rounded transition-colors"
                              title="Edit item"
                              aria-label="Edit item"
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteItem(item.id)}
                            className="p-1 text-content-secondary hover:text-rose-400 rounded transition-colors"
                            title="Padam item"
                            aria-label="Padam item"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Add Item Row */}
              <div className="mt-3 pt-2.5 border-t border-white/[0.06]">
                {addingCategory === cat.id ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleAddItem(cat.id);
                    }}
                    className="flex items-center gap-1.5"
                  >
                    <input
                      type="text"
                      value={newItemName}
                      onChange={(e) => setNewItemName(e.target.value)}
                      placeholder="Nama item baru..."
                      autoFocus
                      className="w-full text-xs bg-white/[0.06] border border-cyan-400/30 rounded-lg px-2.5 py-1.5 text-content-primary placeholder:text-content-secondary/50 focus:outline-none focus:border-cyan-400"
                    />
                    <button
                      type="submit"
                      disabled={!newItemName.trim()}
                      className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 hover:bg-emerald-500/30 disabled:opacity-40 transition-colors shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAddingCategory(null);
                        setNewItemName('');
                      }}
                      className="p-1.5 rounded-lg text-content-secondary hover:text-content-primary transition-colors text-xs"
                    >
                      Batal
                    </button>
                  </form>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setAddingCategory(cat.id);
                      setNewItemName('');
                    }}
                    className="w-full py-1.5 px-2 rounded-lg text-xs font-medium text-content-secondary hover:text-cyan-300 hover:bg-white/[0.04] border border-dashed border-white/10 hover:border-cyan-400/30 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Plus className="w-3 h-3" /> Tambah Item
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
