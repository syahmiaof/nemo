import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/db/nemoDb';
import { mergeTaskEntities, mergeTextField, resolveGenericLWW } from '@/sync/conflictResolver';
import { mappers } from '@/sync/mappers';
import { syncEngine } from '@/sync/syncEngine';
import type { Task, Project } from '@/domain/types';

describe('Sprint 5 — Sync Engine & Conflict Resolution', () => {
  beforeEach(async () => {
    await db.syncMutations.clear();
    await db.tasks.clear();
    await db.projects.clear();
  });

  describe('Conflict Resolution & Non-destructive Merge', () => {
    it('preserves both local and remote notes when simultaneous edits collide', () => {
      const localNotes = 'Local meeting notes about sprint 5.';
      const remoteNotes = 'Remote meeting notes added from iPhone.';

      const result = mergeTextField(
        localNotes,
        remoteNotes,
        '2026-10-21T02:00:00.000Z',
        '2026-10-21T01:50:00.000Z'
      );

      expect(result.diverged).toBe(true);
      expect(result.text).toContain(localNotes);
      expect(result.text).toContain(remoteNotes);
      expect(result.text).toContain('Local Draft');
    });

    it('merges task field-level updates without discarding completion status', () => {
      const localTask: Partial<Task> = {
        id: 'task_abc',
        title: 'Complete Cloud Sync Spec',
        status: 'done',
        completedAt: '2026-10-21T03:00:00.000Z',
        updatedAt: '2026-10-21T03:00:00.000Z',
      };

      const remoteTask = {
        id: 'task_abc',
        title: 'Complete Cloud Sync Spec (Refined Title)',
        status: 'in_progress',
        updated_at: '2026-10-21T03:05:00.000Z',
      };

      const { resolved } = mergeTaskEntities(localTask as Task, remoteTask);

      // Title should take newer edit, but 'done' status must be preserved
      expect(resolved.status).toBe('done');
      expect(resolved.completedAt).toBe('2026-10-21T03:00:00.000Z');
      expect(resolved.title).toBe('Complete Cloud Sync Spec (Refined Title)');
    });

    it('resolves generic scalar fields using deterministic Last-Write-Wins (LWW)', () => {
      const localProject: Partial<Project> = {
        id: 'proj_123',
        title: 'Local Title Edit',
        priority: 'high',
        updatedAt: '2026-10-21T04:00:00.000Z',
      };

      const remoteProject = {
        id: 'proj_123',
        title: 'Remote Older Title',
        priority: 'urgent',
        updated_at: '2026-10-21T03:00:00.000Z',
      };

      const { resolved } = resolveGenericLWW(localProject as Project, remoteProject as any);
      expect(resolved.title).toBe('Local Title Edit');
    });
  });

  describe('Mappers & Bidirectional Transformation', () => {
    it('correctly maps Dexie camelCase Project to Supabase snake_case and back', () => {
      const local: Project = {
        id: 'proj_test_1',
        title: 'Nemo Production Launch',
        description: 'First public deployment',
        priority: 'urgent',
        status: 'in_progress',
        dueDate: '2026-11-01',
        tags: ['release', 'pwa'],
        techStack: ['React', 'Supabase'],
        createdAt: '2026-10-20T10:00:00.000Z',
        updatedAt: '2026-10-21T04:00:00.000Z',
      };

      const remote = mappers.project.toRemote(local, 'user_uuid_123');
      expect(remote.user_id).toBe('user_uuid_123');
      expect(remote.due_date).toBe('2026-11-01');
      expect(remote.tech_stack).toEqual(['React', 'Supabase']);

      const restoredLocal = mappers.project.toLocal(remote);
      expect(restoredLocal.id).toBe(local.id);
      expect(restoredLocal.title).toBe(local.title);
      expect(restoredLocal.dueDate).toBe(local.dueDate);
      expect(restoredLocal.techStack).toEqual(local.techStack);
    });
  });

  describe('Offline Outbox Queueing', () => {
    it('atomically enqueues mutations into Dexie syncMutations table', async () => {
      syncEngine.setAuthenticatedUser('test-owner', null);
      const engine = syncEngine as any;
      if (engine.syncTimer) clearTimeout(engine.syncTimer);
      engine.syncTimer = null;
      await syncEngine.enqueueMutation('task', 'task_999', 'UPSERT', {
        id: 'task_999',
        title: 'Offline Task Verification',
        status: 'todo',
      });

      const pendingCount = await syncEngine.updatePendingCount();
      expect(pendingCount).toBe(1);

      const queued = await db.syncMutations.toArray();
      expect(queued.length).toBe(1);
      expect(queued[0].entityType).toBe('task');
      expect(queued[0].entityId).toBe('task_999');
      expect(queued[0].status).toBe('pending');
      expect(queued[0].ownerUserId).toBe('test-owner');
      syncEngine.setAuthenticatedUser(null, null);
    });
  });
});
