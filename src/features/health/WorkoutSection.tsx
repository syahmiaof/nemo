import React, { useState } from 'react';
import type { WorkoutLog, ActivityType, WorkoutExercise } from '@/domain/types';
import { Dumbbell, Activity, Plus, Trash2, CheckCircle2, Circle, Flame, Timer, Footprints, ChevronDown, ChevronUp } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';

interface WorkoutSectionProps {
  logs: WorkoutLog[];
  todayStr: string;
  onLogWorkout: (entry: Omit<WorkoutLog, 'id'>) => Promise<void>;
  onDeleteWorkout: (id: string) => Promise<void>;
}

export const WorkoutSection: React.FC<WorkoutSectionProps> = ({
  logs,
  todayStr,
  onLogWorkout,
  onDeleteWorkout,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState<'cardio' | 'strength'>('cardio');

  // Form states
  const [title, setTitle] = useState('');
  const [activityType, setActivityType] = useState<ActivityType>('jogging');
  const [durationMinutes, setDurationMinutes] = useState('30');
  const [distanceKm, setDistanceKm] = useState('5.0');
  const [caloriesBurned, setCaloriesBurned] = useState('');
  const [notes, setNotes] = useState('');

  // Strength exercises state
  const [exercises, setExercises] = useState<WorkoutExercise[]>([
    {
      id: 'ex-1',
      name: 'Bench Press',
      sets: [
        { setNumber: 1, reps: 10, weightKg: 60, completed: true },
        { setNumber: 2, reps: 10, weightKg: 60, completed: true },
        { setNumber: 3, reps: 8, weightKg: 65, completed: false },
      ],
    },
  ]);

  const [expandedWorkoutId, setExpandedWorkoutId] = useState<string | null>(null);

  const todayWorkouts = logs.filter((w) => w.date === todayStr);
  const totalCaloriesBurned = todayWorkouts.reduce((sum, w) => sum + (w.caloriesBurned || 0), 0);
  const totalDurationMinutes = todayWorkouts.reduce((sum, w) => sum + (w.durationMinutes || 0), 0);
  const totalDistanceKm = todayWorkouts.reduce((sum, w) => sum + (w.distanceKm || 0), 0);

  // Auto-calculated pace for cardio
  const durNum = parseFloat(durationMinutes) || 0;
  const distNum = parseFloat(distanceKm) || 0;
  let paceDisplay = '--:--';
  if (durNum > 0 && distNum > 0) {
    const totalPaceMinutes = durNum / distNum;
    const paceMin = Math.floor(totalPaceMinutes);
    const paceSec = Math.round((totalPaceMinutes - paceMin) * 60);
    paceDisplay = `${paceMin}:${paceSec.toString().padStart(2, '0')}`;
  }

  // Estimated cardio calories
  const autoEstimatedCalories = distNum > 0 ? Math.round(distNum * 65) : durNum > 0 ? Math.round(durNum * 8) : 200;

  const handleOpenAddModal = (initialMode: 'cardio' | 'strength' = 'cardio') => {
    setMode(initialMode);
    if (initialMode === 'cardio') {
      setTitle('Morning Jog');
      setActivityType('jogging');
      setDurationMinutes('30');
      setDistanceKm('5.0');
      setCaloriesBurned('');
    } else {
      setTitle('Push Day Routine');
      setActivityType('strength');
      setDurationMinutes('45');
      setDistanceKm('');
      setCaloriesBurned('280');
      setExercises([
        {
          id: `ex-${Date.now()}-1`,
          name: 'Barbell Bench Press',
          sets: [
            { setNumber: 1, reps: 10, weightKg: 60, completed: true },
            { setNumber: 2, reps: 10, weightKg: 60, completed: true },
            { setNumber: 3, reps: 8, weightKg: 65, completed: false },
          ],
        },
        {
          id: `ex-${Date.now()}-2`,
          name: 'Incline Dumbbell Press',
          sets: [
            { setNumber: 1, reps: 12, weightKg: 22, completed: false },
            { setNumber: 2, reps: 10, weightKg: 24, completed: false },
          ],
        },
      ]);
    }
    setNotes('');
    setModalOpen(true);
  };

  const handleAddExercise = () => {
    setExercises((prev) => [
      ...prev,
      {
        id: `ex-${Date.now()}-${prev.length + 1}`,
        name: 'New Exercise',
        sets: [{ setNumber: 1, reps: 10, weightKg: 20, completed: false }],
      },
    ]);
  };

  const handleAddSet = (exerciseIndex: number) => {
    setExercises((prev) => {
      const copy = [...prev];
      const target = copy[exerciseIndex];
      const lastSet = target.sets[target.sets.length - 1];
      target.sets.push({
        setNumber: target.sets.length + 1,
        reps: lastSet ? lastSet.reps : 10,
        weightKg: lastSet ? lastSet.weightKg : 20,
        completed: false,
      });
      return copy;
    });
  };

  const handleToggleSetCheck = (exerciseIndex: number, setIndex: number) => {
    setExercises((prev) => {
      const copy = [...prev];
      const set = copy[exerciseIndex].sets[setIndex];
      set.completed = !set.completed;
      return copy;
    });
  };

  const handleSubmitWorkout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !durationMinutes) return;

    const dur = parseInt(durationMinutes, 10) || 1;
    const dist = distanceKm ? parseFloat(distanceKm) : undefined;
    const cal = caloriesBurned ? parseInt(caloriesBurned, 10) : autoEstimatedCalories;

    await onLogWorkout({
      date: todayStr,
      type: activityType,
      title: title.trim(),
      durationMinutes: dur,
      distanceKm: dist,
      caloriesBurned: cal,
      exercises: mode === 'strength' ? exercises : undefined,
      notes: notes.trim() || undefined,
      completedAt: new Date().toISOString(),
    });

    setModalOpen(false);
  };

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#0c1527]/80 backdrop-blur-xl p-5 md:p-6 shadow-2xl relative overflow-hidden transition-all duration-300">
      {/* Ambient glow */}
      <div className="absolute -top-16 -right-16 w-56 h-56 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between mb-6 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/15 border border-orange-400/30 flex items-center justify-center text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.25)]">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-content-primary flex items-center gap-2">
              Workouts & Activity
            </h3>
            <p className="text-xs text-content-secondary">
              Jogging, cardio and strength routines
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleOpenAddModal('cardio')}
            className="px-3 py-2 rounded-xl bg-orange-500/20 hover:bg-orange-500/30 border border-orange-400/35 text-orange-300 text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 shadow-[0_0_12px_rgba(249,115,22,0.2)]"
          >
            <Footprints className="w-4 h-4" /> + Run
          </button>
          <button
            type="button"
            onClick={() => handleOpenAddModal('strength')}
            className="px-3 py-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/35 text-purple-300 text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 shadow-[0_0_12px_rgba(168,85,247,0.2)]"
          >
            <Dumbbell className="w-4 h-4" /> + Gym
          </button>
        </div>
      </div>

      {/* Daily Activity Stats Bar */}
      <div className="grid grid-cols-3 gap-3 mb-6 relative z-10">
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-3.5 flex flex-col justify-between">
          <div className="text-[11px] text-content-secondary flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-orange-400" /> Active Burn
          </div>
          <div className="text-xl font-bold font-mono text-orange-300 mt-1">
            {totalCaloriesBurned.toLocaleString()}
            <span className="text-xs font-normal text-content-secondary ml-1">kcal</span>
          </div>
        </div>

        <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-3.5 flex flex-col justify-between">
          <div className="text-[11px] text-content-secondary flex items-center gap-1.5">
            <Timer className="w-3.5 h-3.5 text-sky-400" /> Total Time
          </div>
          <div className="text-xl font-bold font-mono text-sky-300 mt-1">
            {totalDurationMinutes}
            <span className="text-xs font-normal text-content-secondary ml-1">min</span>
          </div>
        </div>

        <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-3.5 flex flex-col justify-between">
          <div className="text-[11px] text-content-secondary flex items-center gap-1.5">
            <Footprints className="w-3.5 h-3.5 text-emerald-400" /> Cardio Distance
          </div>
          <div className="text-xl font-bold font-mono text-emerald-300 mt-1">
            {totalDistanceKm.toFixed(1)}
            <span className="text-xs font-normal text-content-secondary ml-1">km</span>
          </div>
        </div>
      </div>

      {/* Workouts List */}
      <div className="space-y-3 relative z-10">
        {todayWorkouts.length === 0 ? (
          <div className="p-8 text-center rounded-xl border border-dashed border-white/[0.1] bg-white/[0.01]">
            <Dumbbell className="w-8 h-8 text-content-secondary/40 mx-auto mb-2" />
            <p className="text-xs text-content-secondary font-medium">No workouts logged yet today.</p>
            <p className="text-[11px] text-content-secondary/60 mt-0.5">
              Log your morning run, gym strength session, or evening walk.
            </p>
          </div>
        ) : (
          todayWorkouts.map((workout) => {
            const isExpanded = expandedWorkoutId === workout.id;
            const hasExercises = workout.exercises && workout.exercises.length > 0;
            const isCardio = workout.type === 'running' || workout.type === 'jogging' || workout.type === 'cycling';

            return (
              <div
                key={workout.id}
                className="rounded-xl border border-white/[0.08] bg-white/[0.03] overflow-hidden hover:border-white/[0.15] transition-all"
              >
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                        isCardio
                          ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                          : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                      }`}
                    >
                      {isCardio ? <Footprints className="w-4 h-4" /> : <Dumbbell className="w-4 h-4" />}
                    </div>

                    <div>
                      <div className="font-semibold text-sm text-content-primary flex items-center gap-2">
                        {workout.title}
                        <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-white/[0.06] text-content-secondary">
                          {workout.type}
                        </span>
                      </div>
                      <div className="text-xs text-content-secondary flex items-center gap-3 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Timer className="w-3 h-3 text-sky-400" /> {workout.durationMinutes} min
                        </span>
                        {workout.distanceKm && (
                          <span className="flex items-center gap-1">
                            <Footprints className="w-3 h-3 text-emerald-400" /> {workout.distanceKm} km
                          </span>
                        )}
                        {workout.caloriesBurned && (
                          <span className="flex items-center gap-1 font-mono text-orange-300">
                            <Flame className="w-3 h-3 text-orange-400" /> {workout.caloriesBurned} kcal
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {hasExercises && (
                      <button
                        type="button"
                        onClick={() => setExpandedWorkoutId(isExpanded ? null : workout.id)}
                        className="p-1.5 rounded-lg text-content-secondary hover:text-content-primary hover:bg-white/[0.05] transition-colors"
                        title={isExpanded ? 'Collapse exercises' : 'Expand exercises'}
                        aria-label={isExpanded ? 'Collapse exercises' : 'Expand exercises'}
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onDeleteWorkout(workout.id)}
                      className="p-1.5 rounded-lg text-content-secondary hover:text-red-400 hover:bg-white/[0.05] transition-colors"
                      title="Delete workout"
                      aria-label="Delete workout"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Expanded exercise details */}
                {isExpanded && hasExercises && (
                  <div className="px-4 pb-4 pt-1 border-t border-white/[0.06] bg-black/20 space-y-3">
                    {workout.exercises!.map((ex) => (
                      <div key={ex.id} className="rounded-lg bg-white/[0.02] p-2.5 border border-white/[0.04]">
                        <div className="text-xs font-semibold text-content-primary mb-2 flex items-center justify-between">
                          <span>{ex.name}</span>
                          <span className="text-[10px] text-content-secondary font-mono">
                            {ex.sets.filter((s) => s.completed).length}/{ex.sets.length} sets completed
                          </span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {ex.sets.map((set) => (
                            <div
                              key={set.setNumber}
                              className={`p-2 rounded-lg text-xs flex items-center justify-between border ${
                                set.completed
                                  ? 'bg-purple-500/10 border-purple-500/30 text-purple-200'
                                  : 'bg-white/[0.03] border-white/[0.06] text-content-secondary'
                              }`}
                            >
                              <span className="font-mono text-[11px]">Set {set.setNumber}</span>
                              <span className="font-semibold">
                                {set.reps} reps {set.weightKg ? `@ ${set.weightKg}kg` : ''}
                              </span>
                              {set.completed ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 ml-1" />
                              ) : (
                                <Circle className="w-3.5 h-3.5 text-content-secondary/40 ml-1" />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Log Workout Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Log Workout Session">
        <form onSubmit={handleSubmitWorkout} className="space-y-4 pt-2">
          {/* Mode switch */}
          <div className="flex rounded-xl bg-white/[0.04] p-1 border border-white/[0.08]">
            <button
              type="button"
              onClick={() => setMode('cardio')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                mode === 'cardio'
                  ? 'bg-orange-500/30 text-orange-200 shadow-sm border border-orange-400/40'
                  : 'text-content-secondary hover:text-content-primary'
              }`}
            >
              <Footprints className="w-3.5 h-3.5" /> Cardio / Jogging
            </button>
            <button
              type="button"
              onClick={() => setMode('strength')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                mode === 'strength'
                  ? 'bg-purple-500/30 text-purple-200 shadow-sm border border-purple-400/40'
                  : 'text-content-secondary hover:text-content-primary'
              }`}
            >
              <Dumbbell className="w-3.5 h-3.5" /> Strength Routine
            </button>
          </div>

          <div>
            <label className="block text-xs font-medium text-content-secondary mb-1">Session Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Morning 5K Pace Run"
              className="w-full rounded-xl bg-white/[0.04] border border-white/[0.1] px-3.5 py-2.5 text-xs text-content-primary focus:outline-none focus:border-orange-400/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-content-secondary mb-1">Duration (min) *</label>
              <input
                type="number"
                required
                min="1"
                max="600"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                className="w-full rounded-xl bg-white/[0.04] border border-white/[0.1] px-3.5 py-2.5 text-xs text-content-primary focus:outline-none focus:border-orange-400/50"
              />
            </div>

            {mode === 'cardio' ? (
              <div>
                <label className="block text-xs font-medium text-content-secondary mb-1">Distance (km)</label>
                <input
                  type="number"
                  min="0.1"
                  max="150"
                  step="0.05"
                  value={distanceKm}
                  onChange={(e) => setDistanceKm(e.target.value)}
                  className="w-full rounded-xl bg-white/[0.04] border border-white/[0.1] px-3.5 py-2.5 text-xs text-content-primary focus:outline-none focus:border-orange-400/50"
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-medium text-content-secondary mb-1">Est. Calories</label>
                <input
                  type="number"
                  min="0"
                  max="3000"
                  value={caloriesBurned}
                  onChange={(e) => setCaloriesBurned(e.target.value)}
                  placeholder="e.g. 300"
                  className="w-full rounded-xl bg-white/[0.04] border border-white/[0.1] px-3.5 py-2.5 text-xs text-content-primary focus:outline-none focus:border-purple-400/50"
                />
              </div>
            )}
          </div>

          {/* Cardio Pace badge */}
          {mode === 'cardio' && distNum > 0 && durNum > 0 && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 text-xs">
              <span className="text-content-secondary">Calculated Pace:</span>
              <span className="font-mono font-bold text-orange-300">{paceDisplay} min/km</span>
            </div>
          )}

          {/* Strength Exercises & Sets Builder */}
          {mode === 'strength' && (
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-content-secondary uppercase tracking-wider">
                  Exercises & Sets
                </span>
                <button
                  type="button"
                  onClick={handleAddExercise}
                  className="text-xs text-purple-300 hover:text-purple-200 font-medium flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Exercise
                </button>
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {exercises.map((ex, exIdx) => (
                  <div key={ex.id} className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.07] space-y-2">
                    <input
                      type="text"
                      value={ex.name}
                      onChange={(e) => {
                        const val = e.target.value;
                        setExercises((prev) => {
                          const copy = [...prev];
                          copy[exIdx].name = val;
                          return copy;
                        });
                      }}
                      placeholder="Exercise Name"
                      className="w-full font-semibold text-xs bg-transparent text-content-primary focus:outline-none border-b border-white/[0.1] pb-1"
                    />

                    <div className="space-y-1.5">
                      {ex.sets.map((set, setIdx) => (
                        <div key={set.setNumber} className="flex items-center gap-2 text-xs">
                          <button
                            type="button"
                            onClick={() => handleToggleSetCheck(exIdx, setIdx)}
                            className="p-0.5 text-purple-400 hover:scale-110 transition-transform"
                          >
                            {set.completed ? (
                              <CheckCircle2 className="w-4 h-4" />
                            ) : (
                              <Circle className="w-4 h-4 opacity-50" />
                            )}
                          </button>
                          <span className="text-[11px] font-mono text-content-secondary">Set {set.setNumber}:</span>
                          <input
                            type="number"
                            min="1"
                            max="200"
                            value={set.reps}
                            onChange={(e) => {
                              const reps = parseInt(e.target.value, 10) || 1;
                              setExercises((prev) => {
                                const copy = [...prev];
                                copy[exIdx].sets[setIdx].reps = reps;
                                return copy;
                              });
                            }}
                            className="w-14 rounded bg-white/[0.05] border border-white/[0.1] px-1.5 py-1 text-center font-mono text-xs text-content-primary"
                          />
                          <span className="text-[11px] text-content-secondary">reps @</span>
                          <input
                            type="number"
                            min="0"
                            max="500"
                            step="0.5"
                            value={set.weightKg ?? ''}
                            onChange={(e) => {
                              const weight = parseFloat(e.target.value) || 0;
                              setExercises((prev) => {
                                const copy = [...prev];
                                copy[exIdx].sets[setIdx].weightKg = weight;
                                return copy;
                              });
                            }}
                            placeholder="kg"
                            className="w-14 rounded bg-white/[0.05] border border-white/[0.1] px-1.5 py-1 text-center font-mono text-xs text-content-primary"
                          />
                          <span className="text-[11px] text-content-secondary">kg</span>
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={() => handleAddSet(exIdx)}
                        className="text-[11px] text-purple-400 hover:text-purple-300 font-medium flex items-center gap-1 pt-1"
                      >
                        <Plus className="w-3 h-3" /> Add Set
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-content-secondary mb-1">Notes (Optional)</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Great morning energy, steady cadence"
              className="w-full rounded-xl bg-white/[0.04] border border-white/[0.1] px-3.5 py-2 text-xs text-content-primary focus:outline-none focus:border-orange-400/50"
            />
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
              className="px-4 py-2 rounded-xl bg-orange-500/25 hover:bg-orange-500/35 border border-orange-400/40 text-orange-200 font-semibold text-xs flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-3.5 h-3.5" /> Save Workout
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
