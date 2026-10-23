import React, { useState } from 'react';
import type { DietLog, MealType } from '@/domain/types';
import { Utensils, Plus, Trash2, Flame } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';

interface DietNutritionCardProps {
  logs: DietLog[];
  todayStr: string;
  dailyCalorieTarget?: number;
  macroTargets?: { proteinG: number; carbsG: number; fatG: number };
  onLogMeal: (meal: Omit<DietLog, 'id'>) => Promise<void>;
  onDeleteMeal: (id: string) => Promise<void>;
}

const MEAL_CATEGORIES: { type: MealType; label: string; icon: string; defaultKcal: number }[] = [
  { type: 'breakfast', label: 'Breakfast', icon: '🌅', defaultKcal: 450 },
  { type: 'lunch', label: 'Lunch', icon: '☀️', defaultKcal: 700 },
  { type: 'dinner', label: 'Dinner', icon: '🌙', defaultKcal: 650 },
  { type: 'snack', label: 'Snacks & Bites', icon: '🍎', defaultKcal: 250 },
];

export const DietNutritionCard: React.FC<DietNutritionCardProps> = ({
  logs,
  todayStr,
  dailyCalorieTarget = 2200,
  macroTargets = { proteinG: 130, carbsG: 240, fatG: 65 },
  onLogMeal,
  onDeleteMeal,
}) => {
  const [modalOpen, setModalOpen] = useState(false);

  // Form state
  const [foodName, setFoodName] = useState('');
  const [mealType, setMealType] = useState<MealType>('breakfast');
  const [calories, setCalories] = useState<string>('');
  const [proteinG, setProteinG] = useState<string>('');
  const [carbsG, setCarbsG] = useState<string>('');
  const [fatG, setFatG] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const todayMeals = logs.filter((m) => m.date === todayStr);

  const totalCalories = todayMeals.reduce((sum, m) => sum + (m.calories || 0), 0);
  const totalProtein = todayMeals.reduce((sum, m) => sum + (m.proteinG || 0), 0);
  const totalCarbs = todayMeals.reduce((sum, m) => sum + (m.carbsG || 0), 0);
  const totalFat = todayMeals.reduce((sum, m) => sum + (m.fatG || 0), 0);

  const caloriePercent = Math.min(100, Math.round((totalCalories / dailyCalorieTarget) * 100));
  const remainingCalories = Math.max(0, dailyCalorieTarget - totalCalories);

  const proteinPercent = Math.min(100, Math.round((totalProtein / macroTargets.proteinG) * 100));
  const carbsPercent = Math.min(100, Math.round((totalCarbs / macroTargets.carbsG) * 100));
  const fatPercent = Math.min(100, Math.round((totalFat / macroTargets.fatG) * 100));

  const handleOpenAddModal = (type: MealType = 'breakfast') => {
    setMealType(type);
    setFoodName('');
    setCalories('');
    setProteinG('');
    setCarbsG('');
    setFatG('');
    setModalOpen(true);
  };

  const handleSubmitMeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!foodName.trim() || !calories) return;

    setIsSubmitting(true);
    try {
      await onLogMeal({
        date: todayStr,
        mealType,
        foodName: foodName.trim(),
        calories: Math.max(0, parseInt(calories, 10) || 0),
        proteinG: proteinG ? Math.max(0, parseFloat(proteinG) || 0) : undefined,
        carbsG: carbsG ? Math.max(0, parseFloat(carbsG) || 0) : undefined,
        fatG: fatG ? Math.max(0, parseFloat(fatG) || 0) : undefined,
        loggedAt: new Date().toISOString(),
      });
      setModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#0c1527]/80 backdrop-blur-xl p-5 md:p-6 shadow-2xl relative overflow-hidden transition-all duration-300">
      {/* Background ambient glow */}
      <div className="absolute -top-16 -right-16 w-56 h-56 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between mb-6 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.25)]">
            <Utensils className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-content-primary flex items-center gap-2">
              Diet & Nutrition
            </h3>
            <p className="text-xs text-content-secondary">
              Energy balance: {dailyCalorieTarget.toLocaleString()} kcal target ({remainingCalories.toLocaleString()} kcal remaining)
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => handleOpenAddModal('breakfast')}
          className="px-3.5 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/35 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 shadow-[0_0_12px_rgba(16,185,129,0.2)]"
        >
          <Plus className="w-4 h-4" /> Log Meal
        </button>
      </div>

      {/* Calories Overview Banner */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 relative z-10">
        {/* Total Calories Card */}
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-content-secondary mb-1">
            <span className="flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-amber-400" /> Calories Consumed
            </span>
            <span className="font-mono text-content-primary">{caloriePercent}%</span>
          </div>
          <div className="text-2xl font-bold font-mono tracking-tight text-white mb-2">
            {totalCalories.toLocaleString()}
            <span className="text-xs font-normal text-content-secondary ml-1">/ {dailyCalorieTarget} kcal</span>
          </div>
          <div className="w-full bg-white/[0.06] rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-amber-500 to-emerald-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${caloriePercent}%` }}
            />
          </div>
        </div>

        {/* Protein Macro */}
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-content-secondary mb-1">
            <span className="text-emerald-400 font-medium">Protein</span>
            <span className="font-mono">{Math.round(totalProtein)}g / {macroTargets.proteinG}g</span>
          </div>
          <div className="text-lg font-bold font-mono tracking-tight text-emerald-300 mb-2">
            {proteinPercent}%
          </div>
          <div className="w-full bg-white/[0.06] rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-emerald-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${proteinPercent}%` }}
            />
          </div>
        </div>

        {/* Carbs Macro */}
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-content-secondary mb-1">
            <span className="text-sky-400 font-medium">Carbs</span>
            <span className="font-mono">{Math.round(totalCarbs)}g / {macroTargets.carbsG}g</span>
          </div>
          <div className="text-lg font-bold font-mono tracking-tight text-sky-300 mb-2">
            {carbsPercent}%
          </div>
          <div className="w-full bg-white/[0.06] rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-sky-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${carbsPercent}%` }}
            />
          </div>
        </div>

        {/* Fats Macro */}
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-content-secondary mb-1">
            <span className="text-rose-400 font-medium">Fats</span>
            <span className="font-mono">{Math.round(totalFat)}g / {macroTargets.fatG}g</span>
          </div>
          <div className="text-lg font-bold font-mono tracking-tight text-rose-300 mb-2">
            {fatPercent}%
          </div>
          <div className="w-full bg-white/[0.06] rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-rose-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${fatPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Meal Breakdown by Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
        {MEAL_CATEGORIES.map((cat) => {
          const catMeals = todayMeals.filter((m) => m.mealType === cat.type);
          const catCalories = catMeals.reduce((sum, m) => sum + (m.calories || 0), 0);

          return (
            <div
              key={cat.type}
              className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 hover:border-white/[0.12] transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-base">{cat.icon}</span>
                  <span className="text-sm font-semibold text-content-primary">{cat.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-medium text-emerald-400">
                    {catCalories} kcal
                  </span>
                  <button
                    type="button"
                    onClick={() => handleOpenAddModal(cat.type)}
                    className="p-1 rounded-lg bg-white/[0.05] hover:bg-emerald-500/20 text-content-secondary hover:text-emerald-300 transition-colors"
                    title={`Add food to ${cat.label}`}
                    aria-label={`Add food to ${cat.label}`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Items List */}
              {catMeals.length === 0 ? (
                <div className="text-xs text-content-secondary/60 italic py-2">
                  No meals logged for {cat.label.toLowerCase()} yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {catMeals.map((meal) => (
                    <div
                      key={meal.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-white/[0.03] border border-white/[0.05] group text-xs"
                    >
                      <div>
                        <div className="font-medium text-content-primary">{meal.foodName}</div>
                        <div className="text-[11px] text-content-secondary flex items-center gap-2">
                          <span>{meal.calories} kcal</span>
                          {meal.proteinG !== undefined && <span>P: {meal.proteinG}g</span>}
                          {meal.carbsG !== undefined && <span>C: {meal.carbsG}g</span>}
                          {meal.fatG !== undefined && <span>F: {meal.fatG}g</span>}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => onDeleteMeal(meal.id)}
                        className="opacity-0 group-hover:opacity-100 hover:text-red-400 p-1 rounded transition-opacity"
                        title="Delete meal"
                        aria-label="Delete meal"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Log Meal Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Log Meal & Nutrition">
        <form onSubmit={handleSubmitMeal} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-medium text-content-secondary mb-1">Meal Category</label>
            <div className="grid grid-cols-4 gap-2">
              {MEAL_CATEGORIES.map((c) => (
                <button
                  key={c.type}
                  type="button"
                  onClick={() => setMealType(c.type)}
                  className={`px-2 py-2 rounded-xl text-xs font-medium border flex flex-col items-center gap-1 transition-all ${
                    mealType === c.type
                      ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300'
                      : 'bg-white/[0.03] border-white/[0.08] text-content-secondary hover:bg-white/[0.06]'
                  }`}
                >
                  <span>{c.icon}</span>
                  <span className="truncate">{c.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-content-secondary mb-1">Food / Meal Name *</label>
            <input
              type="text"
              required
              value={foodName}
              onChange={(e) => setFoodName(e.target.value)}
              placeholder="e.g. Oatmeal with Chia Seeds & Honey"
              className="w-full rounded-xl bg-white/[0.04] border border-white/[0.1] px-3.5 py-2.5 text-xs text-content-primary placeholder:text-content-secondary/50 focus:outline-none focus:border-emerald-400/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-content-secondary mb-1">Calories (kcal) *</label>
              <input
                type="number"
                required
                min="0"
                max="5000"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                placeholder="e.g. 450"
                className="w-full rounded-xl bg-white/[0.04] border border-white/[0.1] px-3.5 py-2.5 text-xs text-content-primary focus:outline-none focus:border-emerald-400/50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-content-secondary mb-1">Protein (g)</label>
              <input
                type="number"
                min="0"
                max="500"
                step="0.5"
                value={proteinG}
                onChange={(e) => setProteinG(e.target.value)}
                placeholder="e.g. 25"
                className="w-full rounded-xl bg-white/[0.04] border border-white/[0.1] px-3.5 py-2.5 text-xs text-content-primary focus:outline-none focus:border-emerald-400/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-content-secondary mb-1">Carbs (g)</label>
              <input
                type="number"
                min="0"
                max="500"
                step="0.5"
                value={carbsG}
                onChange={(e) => setCarbsG(e.target.value)}
                placeholder="e.g. 50"
                className="w-full rounded-xl bg-white/[0.04] border border-white/[0.1] px-3.5 py-2.5 text-xs text-content-primary focus:outline-none focus:border-emerald-400/50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-content-secondary mb-1">Fat (g)</label>
              <input
                type="number"
                min="0"
                max="500"
                step="0.5"
                value={fatG}
                onChange={(e) => setFatG(e.target.value)}
                placeholder="e.g. 12"
                className="w-full rounded-xl bg-white/[0.04] border border-white/[0.1] px-3.5 py-2.5 text-xs text-content-primary focus:outline-none focus:border-emerald-400/50"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-white/[0.08] text-content-secondary hover:text-content-primary text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !foodName.trim() || !calories}
              className="px-4 py-2 rounded-xl bg-emerald-500/25 hover:bg-emerald-500/35 border border-emerald-400/40 text-emerald-300 font-semibold text-xs flex items-center gap-1.5 transition-all disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5" /> Save Meal
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
