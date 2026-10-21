import { beforeEach, describe, expect, it, vi } from 'vitest';
import Dexie from 'dexie';

const remote = vi.hoisted(() => ({
  rows: {} as Record<string, Record<string, unknown>[]>,
  selectErrors: {} as Record<string, Error | null>,
  upsertErrors: {} as Record<string, Error | null>,
  upsertCalls: [] as Array<{ table: string; rows: unknown }>,
}));

vi.mock('@/lib/supabase', () => {
  const builderFor = (table: string) => {
    const result = () => ({ data: remote.rows[table] || [], error: remote.selectErrors[table] || null });
    const builder: any = {
      select: () => builder,
      eq: () => builder,
      maybeSingle: async () => ({ data: remote.rows[table]?.[0] || null, error: remote.selectErrors[table] || null }),
      upsert: async (rows: unknown) => {
        remote.upsertCalls.push({ table, rows });
        return { data: null, error: remote.upsertErrors[table] || null };
      },
      update: () => builder,
      delete: () => builder,
      then: (resolve: (value: unknown) => unknown, reject: (reason: unknown) => unknown) =>
        Promise.resolve(result()).then(resolve, reject),
    };
    return builder;
  };
  return { supabase: { from: vi.fn((table: string) => builderFor(table)) } };
});

import { db, NemoDatabase } from '@/db/nemoDb';
import { NemoSyncDatabase, syncDb } from '@/sync/syncDb';
import { syncEngine } from '@/sync/syncEngine';
import type { SyncMutation, Task } from '@/domain/types';

function stopScheduledSync() {
  const engine = syncEngine as any;
  if (engine.syncTimer) clearTimeout(engine.syncTimer);
  engine.syncTimer = null;
  engine.isProcessing = false;
  engine.isIngesting = false;
}

function setOnline(isOnline: boolean) {
  Object.defineProperty(navigator, 'onLine', { configurable: true, value: isOnline });
}

async function seedLocal(table: any, row: any) {
  const engine = syncEngine as any;
  engine.isIngesting = true;
  try {
    await table.put(row);
  } finally {
    engine.isIngesting = false;
  }
}

describe('Sprint 5.4 sync integrity', () => {
  beforeEach(async () => {
    setOnline(false);
    syncEngine.setAuthenticatedUser(null, null);
    stopScheduledSync();
    remote.rows = {};
    remote.selectErrors = {};
    remote.upsertErrors = {};
    remote.upsertCalls = [];
    await Promise.all([
      db.syncMutations.clear(),
      syncDb.syncMutations.clear(),
      db.tasks.clear(), db.projects.clear(), db.milestones.clear(), db.semesters.clear(),
      db.subjects.clear(), db.assignments.clear(), db.calendarEvents.clear(), db.goals.clear(),
      db.goalTaskLinks.clear(), db.focusSelections.clear(), db.assetBlobs.clear(), db.settings.clear(),
    ]);
    (syncEngine as any).legacyOutboxMigrated = false;
  });

  it('keeps mutations bound to their creating account and quarantines ownerless/legacy rows', async () => {
    const base: Omit<SyncMutation, 'id' | 'ownerUserId'> = {
      entityType: 'task', entityId: 't1', operation: 'UPSERT', payload: { id: 't1' },
      clientTimestamp: new Date(0).toISOString(), status: 'pending', retryCount: 0, createdAt: new Date(0).toISOString(),
    };
    await seedLocal(db.tasks, { id: 't1', title: 'Account B copy', status: 'todo', priority: 'low', tags: [], createdAt: 'x', updatedAt: 'x' });
    syncEngine.setAuthenticatedUser('account-a', 'a@example.test');
    stopScheduledSync();
    await syncEngine.enqueueMutation('task', 't1', 'UPSERT', { id: 't1', title: 'Account A copy', status: 'todo', priority: 'low', tags: [], createdAt: 'x', updatedAt: 'x' });
    syncEngine.setAuthenticatedUser(null, null);
    await syncEngine.enqueueMutation('task', 'legacy', 'DELETE', { id: 'legacy' });
    await syncDb.syncMutations.put({ ...base, id: 'pre-migration', entityId: 'old' });
    (syncEngine as any).legacyOutboxMigrated = false;
    syncEngine.setAuthenticatedUser('account-b', 'b@example.test');
    stopScheduledSync();

    await (syncEngine as any).migrateLegacyOutbox();
    await (syncEngine as any).pushPendingMutations();

    expect(remote.upsertCalls).toHaveLength(0);
    const queued = await db.syncMutations.toArray();
    expect(queued).toHaveLength(3);
    expect(queued.find((item) => item.id === 'pre-migration')?.ownerUserId).toBeUndefined();
    expect(queued.find((item) => item.entityId === 'legacy')?.ownerUserId).toBeUndefined();
  });

  it('preserves legacy outbox records byte-for-byte while adding owner indexes', async () => {
    const name = `legacy_sync_${Date.now()}`;
    const legacyDb = new Dexie(name);
    legacyDb.version(1).stores({ syncMutations: 'id, entityType, entityId, status, createdAt' });
    await legacyDb.open();
    const legacyRow = {
      id: 'legacy-row', entityType: 'task', entityId: 'legacy-task', operation: 'UPSERT',
      payload: { id: 'legacy-task', title: 'Keep exact bytes', nested: { value: 7 } },
      clientTimestamp: '2026-10-20T10:00:00.000Z', status: 'pending', retryCount: 2,
      lastError: 'previous offline error', createdAt: '2026-10-20T10:00:00.000Z',
    };
    await legacyDb.table('syncMutations').put(legacyRow);
    legacyDb.close();

    const upgraded = new NemoSyncDatabase(name);
    await upgraded.open();
    expect(await upgraded.syncMutations.get('legacy-row')).toEqual(legacyRow);
    expect(await upgraded.syncMutations.where('[ownerUserId+status]').equals(['unclaimed', 'pending']).count()).toBe(0);
    await upgraded.delete();
  });

  it('upgrades an existing workspace without dropping local rows and adds the durable outbox', async () => {
    const name = `legacy_workspace_${Date.now()}`;
    const legacyDb = new Dexie(name);
    legacyDb.version(1).stores({
      settings: 'id',
      projects: 'id, status, priority, dueDate, createdAt, completedAt',
      tasks: 'id, status, priority, dueDate, parentType, parentId, createdAt, completedAt',
      milestones: 'id, ownerType, ownerId, targetDate, completedAt, order',
      semesters: 'id, status, createdAt',
      subjects: 'id, semesterId, createdAt',
      assignments: 'id, subjectId, status, dueDate, submittedAt, createdAt',
      calendarEvents: 'id, startAt, endAt, isAllDay, subjectId, createdAt',
      goals: 'id, status, targetDate, createdAt, achievedAt',
      goalTaskLinks: 'id, goalId, taskId, [goalId+taskId]',
      focusSelections: 'id, taskId, effectiveLocalDate, [effectiveLocalDate+taskId]',
      assetBlobs: 'id, ownerType, ownerId, mimeType, createdAt',
    });
    await legacyDb.open();
    const legacyTask = { id: 'kept-task', title: 'Survives upgrade' };
    await legacyDb.table('tasks').put(legacyTask);
    legacyDb.close();

    const upgraded = new NemoDatabase(name);
    await upgraded.open();
    expect(await upgraded.tasks.get('kept-task')).toEqual(legacyTask);
    expect(await upgraded.syncMutations.count()).toBe(0);
    expect(upgraded.syncMutations.schema.indexes.map((index) => index.name)).toContain('[ownerUserId+status]');
    await upgraded.delete();
  });

  it('pushes only current-user mutations and preserves other owners queues', async () => {
    const task: Task = { id: 'current', title: 'Current account task', status: 'todo', priority: 'low', tags: [], createdAt: 'x', updatedAt: 'x' };
    await seedLocal(db.tasks, task);
    syncEngine.setAuthenticatedUser('account-b', 'b@example.test');
    stopScheduledSync();
    await syncEngine.enqueueMutation('task', task.id, 'UPSERT', task as unknown as Record<string, unknown>);
    await db.syncMutations.put({
      id: 'account-a-queue', ownerUserId: 'account-a', entityType: 'task', entityId: 'other', operation: 'UPSERT',
      payload: { id: 'other' }, clientTimestamp: 'x', status: 'pending', retryCount: 0, createdAt: 'x',
    });

    await (syncEngine as any).pushPendingMutations();

    expect(remote.upsertCalls.map((call) => call.table)).toEqual(['tasks']);
    expect(await db.syncMutations.get('account-a-queue')).toBeDefined();
    expect((await db.syncMutations.where('[ownerUserId+status]').equals(['account-b', 'pending']).count())).toBe(0);
  });

  it('applies remote tombstones and treats any pull error as a failed sync', async () => {
    await seedLocal(db.tasks, { id: 'deleted-remotely', title: 'remove me', status: 'todo', priority: 'low', tags: [], createdAt: '2026-10-19T00:00:00.000Z', updatedAt: '2026-10-19T00:00:00.000Z' });
    syncEngine.setAuthenticatedUser('account-a', 'a@example.test');
    stopScheduledSync();
    remote.rows.tasks = [{ id: 'deleted-remotely', user_id: 'account-a', is_deleted: true, updated_at: '2026-10-21T00:00:00.000Z' }];
    (syncEngine as any).isIngesting = true;
    try {
      await (syncEngine as any).pullRemoteDelta();
    } finally {
      (syncEngine as any).isIngesting = false;
    }
    expect(await db.tasks.get('deleted-remotely')).toBeUndefined();

    remote.selectErrors.tasks = new Error('simulated network outage');
    setOnline(true);
    const result = await syncEngine.syncNow();
    expect(result.success).toBe(false);
    expect(result.error).toContain('Pull tasks failed');
    expect(syncEngine.getState().status).toBe('error');
  });

  it('surfaces mutation push failures instead of reporting a synced state', async () => {
    const task: Task = { id: 'will-fail', title: 'Retry me', status: 'todo', priority: 'low', tags: [], createdAt: 'x', updatedAt: 'x' };
    await seedLocal(db.tasks, task);
    syncEngine.setAuthenticatedUser('account-a', 'a@example.test');
    stopScheduledSync();
    await syncEngine.enqueueMutation('task', task.id, 'UPSERT', task as unknown as Record<string, unknown>);
    remote.upsertErrors.tasks = new Error('simulated upsert rejection');
    setOnline(true);

    const result = await syncEngine.syncNow();

    expect(result.success).toBe(false);
    expect(result.error).toContain('failed to sync');
    expect(syncEngine.getState().status).toBe('error');
    expect((await db.syncMutations.toArray()).some((item) => item.status === 'pending')).toBe(true);
  });

  it('returns a failed bulk upload with the exact table and successful partial count', async () => {
    await seedLocal(db.settings, { id: 'default', displayName: 'Workspace', theme: 'dark', accent: 'mint', weekStartsOn: 1, hourFormat: '24h', reduceMotion: false, onboardingCompleted: true, databaseVersion: 1 });
    await seedLocal(db.projects, { id: 'project-1', title: 'Project', priority: 'low', status: 'not_started', tags: [], techStack: [], createdAt: 'x', updatedAt: 'x' });
    remote.upsertErrors.projects = new Error('permission denied');

    const result = await syncEngine.uploadAllLocalData('account-a');

    expect(result.success).toBe(false);
    expect(result.count).toBe(1);
    expect(result.error).toContain('Upload projects failed: permission denied');
    expect(remote.upsertCalls.map((call) => call.table)).toEqual(['profiles', 'projects']);
  });

  it('commits local entity and mutation atomically through IndexedDB hooks', async () => {
    await db.tasks.put({ id: 'hook-task', title: 'Committed with WAL', status: 'todo', priority: 'low', tags: [], createdAt: 'x', updatedAt: 'x' });
    const queued = await db.syncMutations.where('entityId').equals('hook-task').toArray();
    expect(queued).toHaveLength(1);
    expect(queued[0].payload.title).toBe('Committed with WAL');

    await expect(db.transaction('rw', [db.tasks, db.syncMutations], async () => {
      await db.tasks.put({ id: 'rolled-back-task', title: 'Must roll back', status: 'todo', priority: 'low', tags: [], createdAt: 'x', updatedAt: 'x' });
      throw new Error('abort transaction');
    })).rejects.toThrow('abort transaction');
    expect(await db.tasks.get('rolled-back-task')).toBeUndefined();
    expect(await db.syncMutations.where('entityId').equals('rolled-back-task').count()).toBe(0);
  });
});
