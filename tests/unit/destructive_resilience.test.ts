import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NemoDatabase } from '@/db/nemoDb';
import { getWorkspaceMode, WORKSPACE_MODE_KEY } from '@/db/workspaceMode';
import { atomicSetTaskStatus, atomicDeleteTask } from '@/db/operations';

describe('Sprint 2 — Destructive Scenarios & Resilience', () => {
  let testDb: NemoDatabase;
  const TEST_DB_NAME = 'NemoTestResilience_' + Math.random().toString(36).substring(7);

  beforeEach(async () => {
    testDb = new NemoDatabase(TEST_DB_NAME);
    await testDb.open();
    localStorage.clear();
  });

  afterEach(async () => {
    await testDb.delete();
    localStorage.clear();
  });

  it('safely falls back to "real" mode when localStorage is corrupted, throws, or contains garbage', () => {
    // 1. Garbage value
    localStorage.setItem(WORKSPACE_MODE_KEY, 'corrupted_state_999');
    expect(getWorkspaceMode()).toBe('real');

    // 2. LocalStorage throws security/quota error
    vi.spyOn(Storage.prototype, 'getItem').mockImplementationOnce(() => {
      throw new Error('Access denied to localStorage');
    });
    expect(getWorkspaceMode()).toBe('real');
  });

  it('handles rapid concurrent asynchronous mutations without lost updates or race conditions', async () => {
    const now = new Date().toISOString();
    const taskCount = 20;

    // Create 20 tasks
    const initialTasks = Array.from({ length: taskCount }, (_, i) => ({
      id: `task_concurrent_${i}`,
      title: `Concurrent Task ${i}`,
      status: 'todo' as const,
      priority: 'medium' as const,
      tags: [],
      createdAt: now,
      updatedAt: now,
    }));
    await testDb.tasks.bulkAdd(initialTasks);
    expect(await testDb.tasks.count()).toBe(taskCount);

    // Concurrently toggle all 20 tasks
    await Promise.all(
      initialTasks.map((t) => atomicSetTaskStatus(testDb, t.id, 'done'))
    );

    const completedTasks = await testDb.tasks.where('status').equals('done').toArray();
    expect(completedTasks.length).toBe(taskCount);
    for (const t of completedTasks) {
      expect(t.completedAt).toBeDefined();
    }

    // Concurrently delete half of them
    const toDelete = initialTasks.slice(0, 10);
    await Promise.all(
      toDelete.map((t) => atomicDeleteTask(testDb, t.id))
    );

    expect(await testDb.tasks.count()).toBe(10);
  });

  it('recovers cleanly when storage quota or write failure is simulated', async () => {
    // Mock bulkAdd on a table to simulate QuotaExceededError
    const originalBulkAdd = testDb.tasks.bulkAdd.bind(testDb.tasks);
    testDb.tasks.bulkAdd = vi.fn().mockImplementation(async () => {
      const quotaErr = new Error('The quota has been exceeded.');
      quotaErr.name = 'QuotaExceededError';
      throw quotaErr;
    });

    let caughtError: Error | null = null;
    try {
      await testDb.transaction('rw', [testDb.tasks], async () => {
        await testDb.tasks.bulkAdd([
          {
            id: 'task_quota_fail',
            title: 'Will fail due to quota',
            status: 'todo',
            priority: 'urgent',
            tags: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ]);
      });
    } catch (e: any) {
      caughtError = e;
    }

    expect(caughtError).toBeDefined();
    expect(caughtError?.name).toBe('QuotaExceededError');

    // Restore original method and verify database integrity remains intact
    testDb.tasks.bulkAdd = originalBulkAdd;
    expect(await testDb.tasks.count()).toBe(0);

    // Normal operations can immediately resume
    await testDb.tasks.add({
      id: 'task_resumed',
      title: 'Resumed after quota mitigation',
      status: 'todo',
      priority: 'high',
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    expect(await testDb.tasks.count()).toBe(1);
  });
});
