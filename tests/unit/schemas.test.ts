import { describe, it, expect } from 'vitest';
import { ProjectSchema, TaskSchema, BackupSchema } from '@/domain/schemas';

describe('Zod Domain Schemas', () => {
  it('validates a valid project', () => {
    const valid = {
      id: 'p1',
      title: 'Nemo Core',
      priority: 'high',
      status: 'in_progress',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: ['typescript', 'react'],
      techStack: ['dexie', 'tailwind'],
    };
    const result = ProjectSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('rejects an empty project title', () => {
    const invalid = {
      id: 'p1',
      title: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const result = ProjectSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('validates task with strict local date format', () => {
    const validTask = {
      id: 't1',
      title: 'Implement database layer',
      status: 'todo',
      priority: 'urgent',
      dueDate: '2026-10-25',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: [],
    };
    expect(TaskSchema.safeParse(validTask).success).toBe(true);

    const invalidDateTask = {
      ...validTask,
      dueDate: '10/25/2026', // Invalid format
    };
    expect(TaskSchema.safeParse(invalidDateTask).success).toBe(false);
  });

  it('validates backup schema envelope and rejects corrupted versions', () => {
    const invalidBackup = {
      version: 999, // unsupported version
      exportedAt: new Date().toISOString(),
      app: 'nemo',
      data: {},
    };
    expect(BackupSchema.safeParse(invalidBackup).success).toBe(false);
  });
});
