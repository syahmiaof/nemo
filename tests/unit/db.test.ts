import { describe, it, expect, beforeEach } from 'vitest';
import { db, ensureSettings, exportWorkspaceBackup, importWorkspaceBackup, resetWorkspaceData } from '@/db/nemoDb';

describe('Dexie Database & Backup Operations', () => {
  beforeEach(async () => {
    await resetWorkspaceData();
  });

  it('ensures default settings on clean initialization', async () => {
    const settings = await ensureSettings();
    expect(settings.id).toBe('default');
    expect(settings.displayName).toBe('My Workspace');
    expect(settings.theme).toBe('dark');
  });

  it('persists and retrieves projects and canonical tasks', async () => {
    const now = new Date().toISOString();
    await db.projects.add({
      id: 'proj_1',
      title: 'Personal Website',
      priority: 'high',
      status: 'in_progress',
      createdAt: now,
      updatedAt: now,
      tags: [],
      techStack: [],
    });

    await db.tasks.add({
      id: 'task_1',
      title: 'Design Hero',
      status: 'todo',
      priority: 'urgent',
      parentType: 'project',
      parentId: 'proj_1',
      dueDate: '2026-10-22',
      createdAt: now,
      updatedAt: now,
      tags: [],
    });

    const project = await db.projects.get('proj_1');
    expect(project).toBeDefined();
    expect(project?.title).toBe('Personal Website');

    const tasks = await db.tasks.where('parentId').equals('proj_1').toArray();
    expect(tasks).toHaveLength(1);
    expect(tasks[0].id).toBe('task_1');
  });

  it('exports and round-trip restores backup data atomically', async () => {
    const now = new Date().toISOString();
    await db.projects.add({
      id: 'proj_backup_test',
      title: 'Backup Test Project',
      priority: 'medium',
      status: 'not_started',
      createdAt: now,
      updatedAt: now,
      tags: ['test'],
      techStack: ['ts'],
    });

    const backupJson = await exportWorkspaceBackup();
    expect(backupJson).toContain('Backup Test Project');

    // Wipe database
    await resetWorkspaceData();
    let project = await db.projects.get('proj_backup_test');
    expect(project).toBeUndefined();

    // Restore from backup
    const result = await importWorkspaceBackup(backupJson);
    expect(result.success).toBe(true);

    project = await db.projects.get('proj_backup_test');
    expect(project).toBeDefined();
    expect(project?.title).toBe('Backup Test Project');
  });

  it('rejects invalid backup JSON without mutating existing database', async () => {
    const now = new Date().toISOString();
    await db.projects.add({
      id: 'proj_safe',
      title: 'Safe Project',
      priority: 'medium',
      status: 'not_started',
      createdAt: now,
      updatedAt: now,
      tags: [],
      techStack: [],
    });

    const maliciousOrCorruptJson = JSON.stringify({ corrupted: true });
    const result = await importWorkspaceBackup(maliciousOrCorruptJson);
    expect(result.success).toBe(false);

    // Existing project must still be intact
    const project = await db.projects.get('proj_safe');
    expect(project).toBeDefined();
  });
});
