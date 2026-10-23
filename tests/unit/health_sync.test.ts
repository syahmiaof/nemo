import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mappers } from '@/sync/mappers';
import { NemoDatabase } from '@/db/nemoDb';
import { registerDexieSyncHooks } from '@/sync/dexieHooks';
import type { HydrationLog, DietLog, WorkoutLog, BodyMetric } from '@/domain/types';

describe('Health & Wellness Sync Mappers and Hooks', () => {
  const userId = '11111111-2222-3333-4444-555555555555';

  describe('Sync Mappers Round-trip', () => {
    it('correctly maps hydration logs to remote and back to local', () => {
      const local: HydrationLog = {
        id: 'hyd_test_1',
        date: '2026-10-23',
        amountMl: 500,
        loggedAt: '2026-10-23T08:00:00.000Z',
      };

      const remote = mappers.hydrationLog.toRemote(local, userId);
      expect(remote).toEqual({
        id: 'hyd_test_1',
        user_id: userId,
        date: '2026-10-23',
        amount_ml: 500,
        logged_at: '2026-10-23T08:00:00.000Z',
        version: 1,
        is_deleted: false,
      });

      const roundTrip = mappers.hydrationLog.toLocal(remote);
      expect(roundTrip).toEqual(local);
    });

    it('correctly maps diet logs to remote and back to local', () => {
      const local: DietLog = {
        id: 'diet_test_1',
        date: '2026-10-23',
        mealType: 'breakfast',
        foodName: 'Oatmeal & Berries',
        calories: 350,
        proteinG: 12,
        carbsG: 60,
        fatG: 5,
        loggedAt: '2026-10-23T08:30:00.000Z',
      };

      const remote = mappers.dietLog.toRemote(local, userId);
      expect(remote.meal_type).toBe('breakfast');
      expect(remote.calories).toBe(350);
      expect(remote.protein_g).toBe(12);

      const roundTrip = mappers.dietLog.toLocal(remote);
      expect(roundTrip).toEqual(local);
    });

    it('correctly maps workout logs to remote and back to local', () => {
      const local: WorkoutLog = {
        id: 'wkt_test_1',
        date: '2026-10-23',
        type: 'running',
        title: 'Morning 5K Jog',
        durationMinutes: 30,
        distanceKm: 5.2,
        caloriesBurned: 320,
        exercises: [
          {
            id: 'ex_1',
            name: 'Pacing intervals',
            sets: [{ setNumber: 1, reps: 5, completed: true }],
          },
        ],
        notes: 'Felt energized and smooth pace',
        completedAt: '2026-10-23T07:30:00.000Z',
      };

      const remote = mappers.workoutLog.toRemote(local, userId);
      expect(remote.duration_minutes).toBe(30);
      expect(remote.distance_km).toBe(5.2);
      expect(remote.exercises).toHaveLength(1);

      const roundTrip = mappers.workoutLog.toLocal(remote);
      expect(roundTrip).toEqual(local);
    });

    it('correctly maps body metrics to remote and back to local', () => {
      const local: BodyMetric = {
        id: 'bm_test_1',
        date: '2026-10-23',
        weightKg: 72.5,
        bodyFatPercent: 15.4,
        loggedAt: '2026-10-23T07:00:00.000Z',
      };

      const remote = mappers.bodyMetric.toRemote(local, userId);
      expect(remote.weight_kg).toBe(72.5);
      expect(remote.body_fat_percent).toBe(15.4);

      const roundTrip = mappers.bodyMetric.toLocal(remote);
      expect(roundTrip).toEqual(local);
    });
  });

  describe('Dexie Sync Hooks for Health Tables', () => {
    let testDb: NemoDatabase;

    beforeEach(async () => {
      testDb = new NemoDatabase(`test_health_sync_${Date.now()}`);
      registerDexieSyncHooks(testDb);
      await testDb.open();
    });

    afterEach(async () => {
      await testDb.delete();
    });

    it('captures hydration log creation in syncMutations outbox', async () => {
      await testDb.hydrationLogs.put({
        id: 'hyd_hook_1',
        date: '2026-10-23',
        amountMl: 300,
        loggedAt: new Date().toISOString(),
      });

      const mutations = await testDb.syncMutations.where('entityType').equals('hydrationLog').toArray();
      expect(mutations.length).toBeGreaterThanOrEqual(1);
      expect(mutations[0].entityId).toBe('hyd_hook_1');
      expect(mutations[0].operation).toBe('UPSERT');
    });

    it('captures workout log creation in syncMutations outbox', async () => {
      await testDb.workoutLogs.put({
        id: 'wkt_hook_1',
        date: '2026-10-23',
        type: 'strength',
        title: 'Upper Body Workout',
        durationMinutes: 45,
        completedAt: new Date().toISOString(),
      });

      const mutations = await testDb.syncMutations.where('entityType').equals('workoutLog').toArray();
      expect(mutations.length).toBeGreaterThanOrEqual(1);
      expect(mutations[0].entityId).toBe('wkt_hook_1');
      expect(mutations[0].operation).toBe('UPSERT');
    });
  });
});
