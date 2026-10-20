import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { exportWorkspaceBackup, importWorkspaceBackup, resetWorkspaceData, db } from '@/db/nemoDb';
import { auditDatabaseIntegrity } from '@/db/operations';
import type { BackupData } from '@/domain/schemas';

describe('Sprint 2 — Backup, Export & Disaster Recovery', () => {
  beforeEach(async () => {
    await resetWorkspaceData();
  });

  afterEach(async () => {
    await resetWorkspaceData();
  });

  it('exports and restores a complete workspace round-trip with byte-identical asset blobs', async () => {
    const now = new Date().toISOString();
    const testImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFElEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

    // 1. Seed comprehensive workspace data
    await db.projects.add({
      id: 'proj_backup_test',
      title: 'Full Export Test',
      priority: 'urgent',
      status: 'in_progress',
      tags: ['backup', 'reliability'],
      techStack: ['TypeScript', 'Dexie'],
      previewBlobId: 'blob_test_cover',
      createdAt: now,
      updatedAt: now,
    });

    await db.assetBlobs.add({
      id: 'blob_test_cover',
      ownerType: 'project',
      ownerId: 'proj_backup_test',
      mimeType: 'image/png',
      size: testImageBase64.length,
      data: testImageBase64,
      createdAt: now,
    });

    await db.tasks.bulkAdd([
      {
        id: 'task_b1',
        title: 'Task under project',
        status: 'done',
        priority: 'high',
        parentType: 'project',
        parentId: 'proj_backup_test',
        tags: ['important'],
        completedAt: now,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'task_b2',
        title: 'Standalone task',
        status: 'todo',
        priority: 'low',
        tags: [],
        createdAt: now,
        updatedAt: now,
      },
    ]);

    await db.milestones.add({
      id: 'mile_b1',
      ownerType: 'project',
      ownerId: 'proj_backup_test',
      title: 'Milestone 1',
      order: 0,
    });

    await db.goals.add({
      id: 'goal_b1',
      title: 'Master Local First',
      status: 'active',
      createdAt: now,
      updatedAt: now,
    });

    await db.goalTaskLinks.add({
      id: 'gtl_b1',
      goalId: 'goal_b1',
      taskId: 'task_b1',
      createdAt: now,
    });

    await db.focusSelections.add({
      id: 'focus_b1',
      taskId: 'task_b2',
      effectiveLocalDate: '2026-10-20',
      chosenAt: now,
    });

    // 2. Export backup
    const backupJson = await exportWorkspaceBackup();
    expect(backupJson).toBeTypeOf('string');

    const parsedEnvelope = JSON.parse(backupJson);
    expect(parsedEnvelope.app).toBe('nemo');
    expect(parsedEnvelope.version).toBe(1);
    expect(parsedEnvelope.data.projects.length).toBe(1);
    expect(parsedEnvelope.data.tasks.length).toBe(2);
    expect(parsedEnvelope.data.assetBlobs.length).toBe(1);
    expect(parsedEnvelope.data.assetBlobs[0].data).toBe(testImageBase64);

    // 3. Clear database to simulate clean browser profile / recovery scenario
    await resetWorkspaceData();
    expect(await db.projects.count()).toBe(0);
    expect(await db.tasks.count()).toBe(0);
    expect(await db.assetBlobs.count()).toBe(0);

    // 4. Import backup back
    const importResult = await importWorkspaceBackup(backupJson);
    expect(importResult.success).toBe(true);
    expect(importResult.error).toBeUndefined();

    // 5. Verify byte-level and reference-level equality
    expect(await db.projects.count()).toBe(1);
    expect(await db.tasks.count()).toBe(2);
    expect(await db.assetBlobs.count()).toBe(1);
    expect(await db.goals.count()).toBe(1);
    expect(await db.goalTaskLinks.count()).toBe(1);
    expect(await db.focusSelections.count()).toBe(1);

    const restoredBlob = await db.assetBlobs.get('blob_test_cover');
    expect(restoredBlob?.data).toBe(testImageBase64);
    expect(restoredBlob?.size).toBe(testImageBase64.length);

    // Audit restored database
    const audit = await auditDatabaseIntegrity(db);
    expect(audit.valid).toBe(true);
    expect(audit.issues).toHaveLength(0);
  });

  it('rejects corrupt JSON without modifying existing database data', async () => {
    // Seed existing task
    await db.tasks.add({
      id: 'task_survivor',
      title: 'Survivor Task',
      status: 'todo',
      priority: 'high',
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const malformedJson = '{"app": "nemo", "version": 1, "data": { TRUNCATED...';
    const result = await importWorkspaceBackup(malformedJson);

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();

    // Verify existing database was untouched
    expect(await db.tasks.count()).toBe(1);
    expect(await db.tasks.get('task_survivor')).toBeDefined();
  });

  it('rejects invalid backup envelope schema and wrong app identifier', async () => {
    await db.tasks.add({
      id: 'task_survivor_2',
      title: 'Protected Task',
      status: 'todo',
      priority: 'high',
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const wrongAppJson = JSON.stringify({
      app: 'not-nemo',
      version: 1,
      exportedAt: new Date().toISOString(),
      data: {},
    });

    const result = await importWorkspaceBackup(wrongAppJson);
    expect(result.success).toBe(false);
    expect(result.error).toContain('Invalid backup schema');

    expect(await db.tasks.count()).toBe(1);
  });

  it('rejects unsupported future version numbers', async () => {
    const futureVersionJson = JSON.stringify({
      app: 'nemo',
      version: 99,
      exportedAt: new Date().toISOString(),
      data: {
        settings: { id: 'default', displayName: 'Workspace' },
      },
    });

    const result = await importWorkspaceBackup(futureVersionJson);
    expect(result.success).toBe(false);
    expect(result.error).toContain('Invalid backup schema');
  });

  it('rejects backup with referential integrity violations before writing to storage', async () => {
    const now = new Date().toISOString();

    // Backup with a task pointing to a non-existent project
    const invalidRefBackup: BackupData = {
      app: 'nemo',
      version: 1,
      exportedAt: now,
      data: {
        settings: {
          id: 'default',
          displayName: 'Test',
          theme: 'dark',
          accent: 'mint',
          weekStartsOn: 1,
          hourFormat: '24h',
          reduceMotion: false,
          onboardingCompleted: true,
          databaseVersion: 1,
        },
        projects: [], // No projects!
        tasks: [
          {
            id: 'task_orphan_import',
            title: 'Orphan Task',
            status: 'todo',
            priority: 'medium',
            parentType: 'project',
            parentId: 'proj_ghost_404', // Dangling reference
            tags: [],
            createdAt: now,
            updatedAt: now,
          },
        ],
        milestones: [],
        semesters: [],
        subjects: [],
        assignments: [],
        calendarEvents: [],
        goals: [],
        goalTaskLinks: [],
        focusSelections: [],
        assetBlobs: [],
      },
    };

    const result = await importWorkspaceBackup(JSON.stringify(invalidRefBackup));
    expect(result.success).toBe(false);
    expect(result.error).toContain('Referential integrity validation failed');
    expect(result.error).toContain('proj_ghost_404');
  });
});
