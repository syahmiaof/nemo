import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db, resetWorkspaceData, exportWorkspaceBackup, importWorkspaceBackup } from '@/db/nemoDb';
import {
  atomicAddHydration,
  atomicUpdateHydration,
  atomicDeleteHydration,
  atomicLogDiet,
  atomicDeleteDiet,
  atomicLogWorkout,
  atomicDeleteWorkout,
  atomicLogBodyMetric,
  atomicDeleteBodyMetric,
  auditDatabaseIntegrity,
} from '@/db/operations';

describe('Health & Wellness — Key-In Data & Aggregations Suite', () => {
  beforeEach(async () => {
    await resetWorkspaceData();
  });

  afterEach(async () => {
    await resetWorkspaceData();
  });

  // ==========================================================================
  // 1. HYDRATION KEY-IN & AGGREGATIONS
  // ==========================================================================
  describe('1. Hydration Key-In & Daily Aggregations', () => {
    it('keys in multiple water logs (+250ml, +500ml, +1000ml) using atomicAddHydration and verifies daily accumulation', async () => {
      const today = '2026-10-23';

      const entry1 = await atomicAddHydration(db, {
        date: today,
        amountMl: 250,
      });

      const entry2 = await atomicAddHydration(db, {
        date: today,
        amountMl: 500,
      });

      const entry3 = await atomicAddHydration(db, {
        date: today,
        amountMl: 1000,
      });

      // Verify returned objects
      expect(entry1.id).toMatch(/^hyd_/);
      expect(entry1.amountMl).toBe(250);
      expect(entry2.amountMl).toBe(500);
      expect(entry3.amountMl).toBe(1000);

      // Verify records in Dexie
      const allHydration = await db.hydrationLogs.toArray();
      expect(allHydration).toHaveLength(3);

      // Verify daily accumulation
      const todayLogs = await db.hydrationLogs.where('date').equals(today).toArray();
      const totalMl = todayLogs.reduce((sum, l) => sum + l.amountMl, 0);
      expect(totalMl).toBe(1750); // 250 + 500 + 1000 = 1750 ml

      const targetMl = 2500;
      const progressPercent = Math.min(100, Math.round((totalMl / targetMl) * 100));
      expect(progressPercent).toBe(70);
    });

    it('filters hydration logs accurately across different calendar dates', async () => {
      // Key in logs for today (2026-10-23)
      await atomicAddHydration(db, { date: '2026-10-23', amountMl: 250 });
      await atomicAddHydration(db, { date: '2026-10-23', amountMl: 500 });

      // Key in logs for yesterday (2026-10-22)
      await atomicAddHydration(db, { date: '2026-10-22', amountMl: 1000 });
      await atomicAddHydration(db, { date: '2026-10-22', amountMl: 750 });

      // Key in logs for previous day (2026-10-21)
      await atomicAddHydration(db, { date: '2026-10-21', amountMl: 500 });

      const todayLogs = await db.hydrationLogs.where('date').equals('2026-10-23').toArray();
      const yesterdayLogs = await db.hydrationLogs.where('date').equals('2026-10-22').toArray();
      const pastLogs = await db.hydrationLogs.where('date').equals('2026-10-21').toArray();

      expect(todayLogs).toHaveLength(2);
      expect(todayLogs.reduce((sum, l) => sum + l.amountMl, 0)).toBe(750);

      expect(yesterdayLogs).toHaveLength(2);
      expect(yesterdayLogs.reduce((sum, l) => sum + l.amountMl, 0)).toBe(1750);

      expect(pastLogs).toHaveLength(1);
      expect(pastLogs.reduce((sum, l) => sum + l.amountMl, 0)).toBe(500);
    });

    it('deletes a hydration entry via atomicDeleteHydration and verifies persistence & updated totals', async () => {
      const today = '2026-10-23';

      const entry1 = await atomicAddHydration(db, { date: today, amountMl: 250 });
      const entry2 = await atomicAddHydration(db, { date: today, amountMl: 500 });
      const entry3 = await atomicAddHydration(db, { date: today, amountMl: 1000 });

      let currentLogs = await db.hydrationLogs.where('date').equals(today).toArray();
      expect(currentLogs.reduce((sum, l) => sum + l.amountMl, 0)).toBe(1750);

      // Delete entry2 (+500ml)
      await atomicDeleteHydration(db, entry2.id);

      // Verify record is deleted
      const deletedEntry = await db.hydrationLogs.get(entry2.id);
      expect(deletedEntry).toBeUndefined();

      // Verify updated total
      const remainingLogs = await db.hydrationLogs.where('date').equals(today).toArray();
      expect(remainingLogs).toHaveLength(2);
      expect(remainingLogs.map((l) => l.id)).toEqual(expect.arrayContaining([entry1.id, entry3.id]));
      const updatedTotal = remainingLogs.reduce((sum, l) => sum + l.amountMl, 0);
      expect(updatedTotal).toBe(1250); // 250 + 1000 = 1250 ml
    });

    it('updates a hydration entry via atomicUpdateHydration and verifies updated amount and total', async () => {
      const today = '2026-10-23';

      const entry = await atomicAddHydration(db, { date: today, amountMl: 250 });
      expect(entry.amountMl).toBe(250);

      // User modifies 250ml to 450ml
      await atomicUpdateHydration(db, entry.id, { amountMl: 450 });

      const updated = await db.hydrationLogs.get(entry.id);
      expect(updated?.amountMl).toBe(450);

      const logs = await db.hydrationLogs.where('date').equals(today).toArray();
      const total = logs.reduce((sum, l) => sum + l.amountMl, 0);
      expect(total).toBe(450);
    });
  });

  // ==========================================================================
  // 2. DIET & MACROS KEY-IN & AGGREGATIONS
  // ==========================================================================
  describe('2. Diet & Macros Key-In & Aggregations', () => {
    it('keys in meals for breakfast, lunch, dinner, snack via atomicLogDiet', async () => {
      const today = '2026-10-23';

      const breakfast = await atomicLogDiet(db, {
        date: today,
        mealType: 'breakfast',
        foodName: 'Rolled Oats with Blueberries & Whey',
        calories: 420,
        proteinG: 32,
        carbsG: 58,
        fatG: 8,
      });

      const lunch = await atomicLogDiet(db, {
        date: today,
        mealType: 'lunch',
        foodName: 'Grilled Chicken Breast with Brown Rice & Avocado',
        calories: 680,
        proteinG: 55,
        carbsG: 62,
        fatG: 20,
      });

      const dinner = await atomicLogDiet(db, {
        date: today,
        mealType: 'dinner',
        foodName: 'Wild Caught Salmon, Steamed Asparagus & Sweet Potato',
        calories: 590,
        proteinG: 46,
        carbsG: 42,
        fatG: 22,
      });

      const snack = await atomicLogDiet(db, {
        date: today,
        mealType: 'snack',
        foodName: 'Greek Yogurt 0% with Almonds & Honey',
        calories: 230,
        proteinG: 20,
        carbsG: 18,
        fatG: 9,
      });

      expect(breakfast.id).toMatch(/^diet_/);
      expect(breakfast.mealType).toBe('breakfast');
      expect(lunch.mealType).toBe('lunch');
      expect(dinner.mealType).toBe('dinner');
      expect(snack.mealType).toBe('snack');

      const allMeals = await db.dietLogs.where('date').equals(today).toArray();
      expect(allMeals).toHaveLength(4);
    });

    it('verifies aggregated daily macro totals (calories, protein, carbs, fat)', async () => {
      const today = '2026-10-23';

      await atomicLogDiet(db, {
        date: today,
        mealType: 'breakfast',
        foodName: 'Oatmeal & Eggs',
        calories: 420,
        proteinG: 28,
        carbsG: 45,
        fatG: 12,
      });

      await atomicLogDiet(db, {
        date: today,
        mealType: 'lunch',
        foodName: 'Grilled Chicken Quinoa Bowl',
        calories: 650,
        proteinG: 52,
        carbsG: 55,
        fatG: 18,
      });

      await atomicLogDiet(db, {
        date: today,
        mealType: 'dinner',
        foodName: 'Atlantic Salmon & Asparagus',
        calories: 580,
        proteinG: 44,
        carbsG: 30,
        fatG: 22,
      });

      await atomicLogDiet(db, {
        date: today,
        mealType: 'snack',
        foodName: 'Greek Yogurt & Almonds',
        calories: 230,
        proteinG: 18,
        carbsG: 12,
        fatG: 10,
      });

      const todayMeals = await db.dietLogs.where('date').equals(today).toArray();

      const totalCalories = todayMeals.reduce((sum, m) => sum + (m.calories || 0), 0);
      const totalProtein = todayMeals.reduce((sum, m) => sum + (m.proteinG || 0), 0);
      const totalCarbs = todayMeals.reduce((sum, m) => sum + (m.carbsG || 0), 0);
      const totalFat = todayMeals.reduce((sum, m) => sum + (m.fatG || 0), 0);

      expect(totalCalories).toBe(1880); // 420 + 650 + 580 + 230
      expect(totalProtein).toBe(142); // 28 + 52 + 44 + 18
      expect(totalCarbs).toBe(142); // 45 + 55 + 30 + 12
      expect(totalFat).toBe(62); // 12 + 18 + 22 + 10

      // Macro targets comparison
      const macroTargets = { proteinG: 130, carbsG: 240, fatG: 65, calories: 2200 };
      const proteinPercent = Math.round((totalProtein / macroTargets.proteinG) * 100);
      const remainingCalories = macroTargets.calories - totalCalories;

      expect(proteinPercent).toBe(109); // Exceeded protein target
      expect(remainingCalories).toBe(320); // 2200 - 1880
    });

    it('deletes a meal via atomicDeleteDiet and ensures totals update accurately', async () => {
      const today = '2026-10-23';

      const meal1 = await atomicLogDiet(db, {
        date: today,
        mealType: 'breakfast',
        foodName: 'Breakfast Burrito',
        calories: 500,
        proteinG: 30,
        carbsG: 40,
        fatG: 15,
      });

      const meal2 = await atomicLogDiet(db, {
        date: today,
        mealType: 'snack',
        foodName: 'Protein Shake',
        calories: 200,
        proteinG: 25,
        carbsG: 5,
        fatG: 2,
      });

      let meals = await db.dietLogs.where('date').equals(today).toArray();
      expect(meals.reduce((sum, m) => sum + m.calories, 0)).toBe(700);

      // Delete snack
      await atomicDeleteDiet(db, meal2.id);

      // Verify deletion in Dexie
      const checkDeleted = await db.dietLogs.get(meal2.id);
      expect(checkDeleted).toBeUndefined();

      meals = await db.dietLogs.where('date').equals(today).toArray();
      expect(meals).toHaveLength(1);
      expect(meals[0].id).toBe(meal1.id);
      expect(meals.reduce((sum, m) => sum + m.calories, 0)).toBe(500);
      expect(meals.reduce((sum, m) => sum + (m.proteinG || 0), 0)).toBe(30);
    });
  });

  // ==========================================================================
  // 3. WORKOUT KEY-IN & ROUTINES
  // ==========================================================================
  describe('3. Workout Key-In & Routines', () => {
    it('keys in cardio/jogging sessions with distance & duration and verifies pace computation', async () => {
      const today = '2026-10-23';

      const cardioLog = await atomicLogWorkout(db, {
        date: today,
        type: 'jogging',
        title: 'Morning 5K Jog',
        durationMinutes: 30,
        distanceKm: 5.0,
        caloriesBurned: 325,
        notes: 'Steady aerobic pace along river trail',
      });

      expect(cardioLog.id).toMatch(/^wkt_/);
      expect(cardioLog.durationMinutes).toBe(30);
      expect(cardioLog.distanceKm).toBe(5.0);
      expect(cardioLog.caloriesBurned).toBe(325);

      // Pace computation: (durationMinutes / distanceKm)
      const durNum = cardioLog.durationMinutes;
      const distNum = cardioLog.distanceKm!;
      const totalPaceMinutes = durNum / distNum; // 6.0 min/km
      const paceMin = Math.floor(totalPaceMinutes);
      const paceSec = Math.round((totalPaceMinutes - paceMin) * 60);
      const paceDisplay = `${paceMin}:${paceSec.toString().padStart(2, '0')}`;

      expect(paceDisplay).toBe('6:00');

      // Test a second tempo cardio session with non-round pace
      const tempoLog = await atomicLogWorkout(db, {
        date: today,
        type: 'running',
        title: 'Evening 10K Tempo Run',
        durationMinutes: 45,
        distanceKm: 10.0,
        caloriesBurned: 680,
      });

      const tempoPace = tempoLog.durationMinutes / tempoLog.distanceKm!;
      const tempoPaceMin = Math.floor(tempoPace);
      const tempoPaceSec = Math.round((tempoPace - tempoPaceMin) * 60);
      expect(`${tempoPaceMin}:${tempoPaceSec.toString().padStart(2, '0')}`).toBe('4:30');
    });

    it('keys in strength sessions with structured exercises and sets checkoffs', async () => {
      const today = '2026-10-23';

      const strengthLog = await atomicLogWorkout(db, {
        date: today,
        type: 'strength',
        title: 'Push Day Hypertrophy Routine',
        durationMinutes: 50,
        caloriesBurned: 310,
        exercises: [
          {
            id: 'ex-bench',
            name: 'Barbell Flat Bench Press',
            sets: [
              { setNumber: 1, reps: 10, weightKg: 60, completed: true },
              { setNumber: 2, reps: 10, weightKg: 65, completed: true },
              { setNumber: 3, reps: 8, weightKg: 70, completed: true },
            ],
          },
          {
            id: 'ex-incline-db',
            name: 'Incline Dumbbell Press',
            sets: [
              { setNumber: 1, reps: 12, weightKg: 24, completed: true },
              { setNumber: 2, reps: 10, weightKg: 26, completed: false },
            ],
          },
          {
            id: 'ex-triceps',
            name: 'Overhead Cable Triceps Extension',
            sets: [
              { setNumber: 1, reps: 15, weightKg: 15, completed: true },
              { setNumber: 2, reps: 12, weightKg: 15, completed: false },
            ],
          },
        ],
        notes: 'Solid chest activation; pushed to near failure on incline',
      });

      // Verify persisted in Dexie
      const storedWorkout = await db.workoutLogs.get(strengthLog.id);
      expect(storedWorkout).toBeDefined();
      expect(storedWorkout?.exercises).toHaveLength(3);

      const benchPress = storedWorkout?.exercises?.find((e) => e.id === 'ex-bench');
      expect(benchPress?.sets).toHaveLength(3);
      expect(benchPress?.sets.every((s) => s.completed)).toBe(true);

      const allSets = storedWorkout?.exercises?.flatMap((e) => e.sets) ?? [];
      expect(allSets).toHaveLength(7);
      const completedSets = allSets.filter((s) => s.completed);
      const uncompletedSets = allSets.filter((s) => !s.completed);
      expect(completedSets).toHaveLength(5);
      expect(uncompletedSets).toHaveLength(2);

      // Verify total tonnage / volume calculation: sum(reps * weightKg)
      const totalVolume = completedSets.reduce((sum, s) => sum + s.reps * (s.weightKg || 0), 0);
      // (10*60) + (10*65) + (8*70) + (12*24) + (15*15) = 600 + 650 + 560 + 288 + 225 = 2323 kg
      expect(totalVolume).toBe(2323);
    });

    it('aggregates active calorie totals and verifies deletion via atomicDeleteWorkout', async () => {
      const today = '2026-10-23';

      const w1 = await atomicLogWorkout(db, {
        date: today,
        type: 'jogging',
        title: 'Morning 5K Jog',
        durationMinutes: 30,
        distanceKm: 5.0,
        caloriesBurned: 325,
      });

      const w2 = await atomicLogWorkout(db, {
        date: today,
        type: 'running',
        title: 'Evening 10K Tempo Run',
        durationMinutes: 45,
        distanceKm: 10.0,
        caloriesBurned: 680,
      });

      const w3 = await atomicLogWorkout(db, {
        date: today,
        type: 'strength',
        title: 'Upper Body Workout',
        durationMinutes: 50,
        caloriesBurned: 310,
      });

      let todayWorkouts = await db.workoutLogs.where('date').equals(today).toArray();
      expect(todayWorkouts).toHaveLength(3);

      const totalActiveCalories = todayWorkouts.reduce((sum, w) => sum + (w.caloriesBurned || 0), 0);
      expect(totalActiveCalories).toBe(1315); // 325 + 680 + 310 = 1315 kcal

      const totalDuration = todayWorkouts.reduce((sum, w) => sum + w.durationMinutes, 0);
      expect(totalDuration).toBe(125); // 30 + 45 + 50 = 125 min

      // Delete the strength workout
      await atomicDeleteWorkout(db, w3.id);

      const checkDeleted = await db.workoutLogs.get(w3.id);
      expect(checkDeleted).toBeUndefined();

      todayWorkouts = await db.workoutLogs.where('date').equals(today).toArray();
      expect(todayWorkouts).toHaveLength(2);
      expect(todayWorkouts.map((w) => w.id)).toEqual(expect.arrayContaining([w1.id, w2.id]));
      const updatedActiveCalories = todayWorkouts.reduce((sum, w) => sum + (w.caloriesBurned || 0), 0);
      expect(updatedActiveCalories).toBe(1005); // 325 + 680 = 1005 kcal
    });
  });

  // ==========================================================================
  // 4. BODY METRICS KEY-IN & TRENDS
  // ==========================================================================
  describe('4. Body Metrics Key-In & Trends', () => {
    it('keys in weight and body fat entries via atomicLogBodyMetric across chronological dates', async () => {
      const entry1 = await atomicLogBodyMetric(db, {
        date: '2026-10-01',
        weightKg: 75.5,
        bodyFatPercent: 17.2,
      });

      const entry2 = await atomicLogBodyMetric(db, {
        date: '2026-10-08',
        weightKg: 74.8,
        bodyFatPercent: 16.8,
      });

      const entry3 = await atomicLogBodyMetric(db, {
        date: '2026-10-15',
        weightKg: 74.0,
        bodyFatPercent: 16.3,
      });

      const entry4 = await atomicLogBodyMetric(db, {
        date: '2026-10-23',
        weightKg: 73.1,
        bodyFatPercent: 15.7,
      });

      expect(entry1.id).toMatch(/^bm_/);
      expect(entry2.id).toMatch(/^bm_/);
      expect(entry3.id).toMatch(/^bm_/);
      expect(entry4.weightKg).toBe(73.1);

      const allMetrics = await db.bodyMetrics.toArray();
      expect(allMetrics).toHaveLength(4);
      expect(allMetrics.map((m) => m.id)).toEqual(
        expect.arrayContaining([entry1.id, entry2.id, entry3.id, entry4.id])
      );
    });

    it('verifies chronological sorting, latest current weight, and net weight delta', async () => {
      // Intentionally insert out of chronological order
      await atomicLogBodyMetric(db, { date: '2026-10-15', weightKg: 74.0, bodyFatPercent: 16.3 });
      await atomicLogBodyMetric(db, { date: '2026-10-01', weightKg: 75.5, bodyFatPercent: 17.2 });
      await atomicLogBodyMetric(db, { date: '2026-10-23', weightKg: 73.1, bodyFatPercent: 15.7 });
      await atomicLogBodyMetric(db, { date: '2026-10-08', weightKg: 74.8, bodyFatPercent: 16.8 });

      const allMetrics = await db.bodyMetrics.toArray();
      const sortedMetrics = [...allMetrics].sort((a, b) => (a.date > b.date ? 1 : -1));

      expect(sortedMetrics[0].date).toBe('2026-10-01');
      expect(sortedMetrics[sortedMetrics.length - 1].date).toBe('2026-10-23');

      const initialMetric = sortedMetrics[0];
      const latestMetric = sortedMetrics[sortedMetrics.length - 1];

      // Net weight delta: latest - initial
      const netWeightDelta = parseFloat((latestMetric.weightKg - initialMetric.weightKg).toFixed(2));
      expect(netWeightDelta).toBe(-2.4); // 73.1 - 75.5 = -2.4 kg (lost 2.4 kg)

      // Net body fat delta: latest - initial
      const netBodyFatDelta = parseFloat(((latestMetric.bodyFatPercent ?? 0) - (initialMetric.bodyFatPercent ?? 0)).toFixed(2));
      expect(netBodyFatDelta).toBe(-1.5); // 15.7 - 17.2 = -1.5% body fat
    });

    it('verifies net energy balance computation against daily diet intake and active workout burn', async () => {
      const today = '2026-10-23';

      // Record daily diet meals totaling 1880 kcal
      await atomicLogDiet(db, { date: today, mealType: 'breakfast', foodName: 'Oatmeal', calories: 420 });
      await atomicLogDiet(db, { date: today, mealType: 'lunch', foodName: 'Chicken Rice', calories: 650 });
      await atomicLogDiet(db, { date: today, mealType: 'dinner', foodName: 'Salmon Bowl', calories: 580 });
      await atomicLogDiet(db, { date: today, mealType: 'snack', foodName: 'Greek Yogurt', calories: 230 });

      // Record daily active workouts totaling 1005 kcal burned
      await atomicLogWorkout(db, { date: today, type: 'jogging', title: 'Morning Jog', durationMinutes: 30, caloriesBurned: 325 });
      await atomicLogWorkout(db, { date: today, type: 'running', title: 'Evening Run', durationMinutes: 45, caloriesBurned: 680 });

      // Query and compute totals
      const todayMeals = await db.dietLogs.where('date').equals(today).toArray();
      const todayWorkouts = await db.workoutLogs.where('date').equals(today).toArray();

      const dietCalories = todayMeals.reduce((sum, m) => sum + m.calories, 0);
      const burnedCalories = todayWorkouts.reduce((sum, w) => sum + (w.caloriesBurned || 0), 0);

      expect(dietCalories).toBe(1880);
      expect(burnedCalories).toBe(1005);

      // Net energy balance: Intake - Burned
      const netCalories = dietCalories - burnedCalories;
      expect(netCalories).toBe(875); // +875 kcal surplus

      // Verify deficit scenario
      const heavyBurnCalories = 2200;
      const deficitNet = dietCalories - heavyBurnCalories;
      expect(deficitNet).toBe(-320); // In caloric deficit
    });

    it('deletes a body metric entry via atomicDeleteBodyMetric', async () => {
      const entry = await atomicLogBodyMetric(db, {
        date: '2026-10-18',
        weightKg: 73.9,
      });

      expect(await db.bodyMetrics.get(entry.id)).toBeDefined();

      await atomicDeleteBodyMetric(db, entry.id);

      expect(await db.bodyMetrics.get(entry.id)).toBeUndefined();
    });
  });

  // ==========================================================================
  // 5. BACKUP & RESTORE ENVELOPE WITH HEALTH DATA
  // ==========================================================================
  describe('5. Backup & Restore Envelope with Health Data', () => {
    it('exports workspace with health & wellness records and validates JSON envelope schema', async () => {
      const today = '2026-10-23';

      // 1. Seed complete health data
      const hyd = await atomicAddHydration(db, { date: today, amountMl: 500 });
      const diet = await atomicLogDiet(db, {
        date: today,
        mealType: 'lunch',
        foodName: 'Grilled Chicken & Quinoa',
        calories: 650,
        proteinG: 50,
        carbsG: 60,
        fatG: 18,
      });
      const workout = await atomicLogWorkout(db, {
        date: today,
        type: 'jogging',
        title: 'Midday 5K Run',
        durationMinutes: 28,
        distanceKm: 5.0,
        caloriesBurned: 310,
        exercises: [
          {
            id: 'ex-jog',
            name: 'Pacing intervals',
            sets: [{ setNumber: 1, reps: 5, completed: true }],
          },
        ],
      });
      const bodyMetric = await atomicLogBodyMetric(db, {
        date: today,
        weightKg: 72.5,
        bodyFatPercent: 15.2,
      });

      // 2. Also seed standard project and task to verify co-existence
      const now = new Date().toISOString();
      await db.projects.add({
        id: 'proj_health_integration',
        title: 'Health App Integration',
        priority: 'high',
        status: 'in_progress',
        createdAt: now,
        updatedAt: now,
        tags: ['health', 'fitness'],
        techStack: ['Dexie', 'TypeScript'],
      });

      await db.tasks.add({
        id: 'task_health_integration',
        title: 'Validate Health Backup Envelope',
        status: 'done',
        priority: 'urgent',
        parentType: 'project',
        parentId: 'proj_health_integration',
        completedAt: now,
        createdAt: now,
        updatedAt: now,
        tags: ['health'],
      });

      // 3. Ensure database referential integrity is 100% valid before export
      const auditBefore = await auditDatabaseIntegrity(db);
      expect(auditBefore.valid).toBe(true);
      expect(auditBefore.issues).toEqual([]);
      expect(auditBefore.stats.hydrationLogs).toBe(1);
      expect(auditBefore.stats.dietLogs).toBe(1);
      expect(auditBefore.stats.workoutLogs).toBe(1);
      expect(auditBefore.stats.bodyMetrics).toBe(1);

      // 4. Export backup
      const backupJson = await exportWorkspaceBackup();
      expect(typeof backupJson).toBe('string');

      const parsed = JSON.parse(backupJson);
      expect(parsed.version).toBe(1);
      expect(parsed.app).toBe('nemo');
      expect(parsed.data).toBeDefined();

      // Verify health records exist in exported envelope
      expect(parsed.data.hydrationLogs).toHaveLength(1);
      expect(parsed.data.hydrationLogs[0].id).toBe(hyd.id);
      expect(parsed.data.hydrationLogs[0].amountMl).toBe(500);

      expect(parsed.data.dietLogs).toHaveLength(1);
      expect(parsed.data.dietLogs[0].id).toBe(diet.id);
      expect(parsed.data.dietLogs[0].foodName).toBe('Grilled Chicken & Quinoa');

      expect(parsed.data.workoutLogs).toHaveLength(1);
      expect(parsed.data.workoutLogs[0].id).toBe(workout.id);
      expect(parsed.data.workoutLogs[0].exercises[0].name).toBe('Pacing intervals');

      expect(parsed.data.bodyMetrics).toHaveLength(1);
      expect(parsed.data.bodyMetrics[0].id).toBe(bodyMetric.id);
      expect(parsed.data.bodyMetrics[0].weightKg).toBe(72.5);
    });

    it('restores workspace backup cleanly and recovers all health records without loss or corruption', async () => {
      const today = '2026-10-23';

      // 1. Seed multiple records across all health tables
      const hyd1 = await atomicAddHydration(db, { date: today, amountMl: 250 });
      const hyd2 = await atomicAddHydration(db, { date: today, amountMl: 750 });

      const diet1 = await atomicLogDiet(db, {
        date: today,
        mealType: 'breakfast',
        foodName: 'Avocado Toast',
        calories: 380,
        proteinG: 12,
        carbsG: 40,
        fatG: 18,
      });
      const diet2 = await atomicLogDiet(db, {
        date: today,
        mealType: 'dinner',
        foodName: 'Grilled Ribeye & Salad',
        calories: 720,
        proteinG: 60,
        carbsG: 10,
        fatG: 48,
      });

      const wkt1 = await atomicLogWorkout(db, {
        date: today,
        type: 'strength',
        title: 'Full Body Compound Session',
        durationMinutes: 60,
        caloriesBurned: 400,
        exercises: [
          {
            id: 'ex-squat',
            name: 'Barbell Back Squat',
            sets: [
              { setNumber: 1, reps: 5, weightKg: 100, completed: true },
              { setNumber: 2, reps: 5, weightKg: 100, completed: true },
              { setNumber: 3, reps: 5, weightKg: 105, completed: true },
            ],
          },
        ],
      });

      const bm1 = await atomicLogBodyMetric(db, {
        date: '2026-10-20',
        weightKg: 73.5,
        bodyFatPercent: 16.0,
      });
      const bm2 = await atomicLogBodyMetric(db, {
        date: '2026-10-23',
        weightKg: 72.8,
        bodyFatPercent: 15.6,
      });

      // 2. Export backup JSON
      const backupJson = await exportWorkspaceBackup();

      // 3. Completely wipe database
      await resetWorkspaceData();

      // Confirm clean wipe of health tables
      expect(await db.hydrationLogs.toArray()).toHaveLength(0);
      expect(await db.dietLogs.toArray()).toHaveLength(0);
      expect(await db.workoutLogs.toArray()).toHaveLength(0);
      expect(await db.bodyMetrics.toArray()).toHaveLength(0);

      // 4. Restore workspace from backup
      const result = await importWorkspaceBackup(backupJson);
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();

      // 5. Verify all health data recovered cleanly
      const recoveredHydration = await db.hydrationLogs.toArray();
      expect(recoveredHydration).toHaveLength(2);
      expect(recoveredHydration.find((h) => h.id === hyd1.id)?.amountMl).toBe(250);
      expect(recoveredHydration.find((h) => h.id === hyd2.id)?.amountMl).toBe(750);

      const recoveredDiet = await db.dietLogs.toArray();
      expect(recoveredDiet).toHaveLength(2);
      expect(recoveredDiet.find((d) => d.id === diet1.id)?.foodName).toBe('Avocado Toast');
      expect(recoveredDiet.find((d) => d.id === diet2.id)?.calories).toBe(720);

      const recoveredWorkouts = await db.workoutLogs.toArray();
      expect(recoveredWorkouts).toHaveLength(1);
      expect(recoveredWorkouts[0].id).toBe(wkt1.id);
      expect(recoveredWorkouts[0].exercises).toHaveLength(1);
      expect(recoveredWorkouts[0].exercises?.[0].name).toBe('Barbell Back Squat');
      expect(recoveredWorkouts[0].exercises?.[0].sets).toHaveLength(3);
      expect(recoveredWorkouts[0].exercises?.[0].sets[2].weightKg).toBe(105);

      const recoveredMetrics = await db.bodyMetrics.toArray();
      expect(recoveredMetrics).toHaveLength(2);
      expect(recoveredMetrics.find((m) => m.id === bm1.id)?.weightKg).toBe(73.5);
      expect(recoveredMetrics.find((m) => m.id === bm2.id)?.weightKg).toBe(72.8);

      // 6. Post-restore integrity audit verification
      const auditAfter = await auditDatabaseIntegrity(db);
      expect(auditAfter.valid).toBe(true);
      expect(auditAfter.issues).toEqual([]);
      expect(auditAfter.stats.hydrationLogs).toBe(2);
      expect(auditAfter.stats.dietLogs).toBe(2);
      expect(auditAfter.stats.workoutLogs).toBe(1);
      expect(auditAfter.stats.bodyMetrics).toBe(2);
    });
  });
});
