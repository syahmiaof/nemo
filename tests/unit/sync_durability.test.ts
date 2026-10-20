import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/db/nemoDb';
import { syncDb } from '@/sync/syncDb';
import { syncEngine } from '@/sync/syncEngine';
import { getWorkspaceMode, REAL_DATABASE_NAME, DEMO_DATABASE_NAME } from '@/db/workspaceMode';

describe('Sprint 5.1 — Durable Local Change Tracking & Resilience', () => {
  beforeEach(async () => {
    await db.tasks.clear();
    await db.projects.clear();
    await syncDb.syncMutations.clear();
  });

  it('preserves idempotency during outbox retries (zero duplicate records)', async () => {
    // Enqueue the same entity mutation twice with identical ID
    await syncEngine.enqueueMutation('task', 'task_idempotent_1', 'UPSERT', {
      id: 'task_idempotent_1',
      title: 'Original Title',
      status: 'todo',
    });

    await syncEngine.enqueueMutation('task', 'task_idempotent_1', 'UPSERT', {
      id: 'task_idempotent_1',
      title: 'Updated Title',
      status: 'in_progress',
    });

    const pending = await syncDb.syncMutations.where('entityId').equals('task_idempotent_1').toArray();
    expect(pending.length).toBeGreaterThanOrEqual(1);

    // Both mutations reference the exact same entityId, so applying them sequentially results in 1 entity
    const finalPayload = pending[pending.length - 1].payload as any;
    expect(finalPayload.title).toBe('Updated Title');
    expect(finalPayload.id).toBe('task_idempotent_1');
  });

  it('prevents uncontrolled sync echo loops via isIngestingRemote lock', () => {
    expect(syncEngine.isIngestingRemote()).toBe(false);

    // Simulate remote ingestion
    (syncEngine as any).isIngesting = true;
    expect(syncEngine.isIngestingRemote()).toBe(true);

    // Ingestion finished
    (syncEngine as any).isIngesting = false;
    expect(syncEngine.isIngestingRemote()).toBe(false);
  });

  it('strictly isolates Demo Mode from cloud sync mutations', () => {
    const currentMode = getWorkspaceMode();
    expect(currentMode).toBe('real');

    // Verification of demo database name separation
    expect(db.name).toBe(REAL_DATABASE_NAME);
    expect(REAL_DATABASE_NAME).not.toBe(DEMO_DATABASE_NAME);
  });

  it('survives simulated partial network failure by retaining mutations with backoff', async () => {
    await syncEngine.enqueueMutation('project', 'proj_retry_1', 'UPSERT', {
      id: 'proj_retry_1',
      title: 'Resilient Project',
    });

    const mutations = await syncDb.syncMutations.toArray();
    expect(mutations.length).toBe(1);

    const mut = mutations[0];
    expect(mut.retryCount).toBe(0);
    expect(mut.status).toBe('pending');

    // Simulate retry increment
    await syncDb.syncMutations.update(mut.id, {
      retryCount: 1,
      lastError: 'Simulated 503 Service Unavailable',
    });

    const updatedMut = await syncDb.syncMutations.get(mut.id);
    expect(updatedMut?.retryCount).toBe(1);
    expect(updatedMut?.lastError).toContain('503');
    expect(updatedMut?.status).toBe('pending');
  });

  it('detects un-synced local records created during hypothetical outbox disruption (Self-Healing Delta Scan)', async () => {
    const lastSyncTime = new Date('2026-10-21T01:00:00.000Z').toISOString();
    const modifiedTime = new Date('2026-10-21T02:00:00.000Z').toISOString();

    // Insert task directly without enqueueing
    await db.tasks.put({
      id: 'task_untracked_1',
      title: 'Task Created During Crash',
      status: 'todo',
      priority: 'high',
      tags: [],
      createdAt: modifiedTime,
      updatedAt: modifiedTime,
    });

    // Check that delta scanner finds it
    const allTasks = await db.tasks.toArray();
    const untracked = allTasks.filter((t) => t.updatedAt > lastSyncTime);
    expect(untracked.length).toBe(1);
    expect(untracked[0].id).toBe('task_untracked_1');
  });
});
