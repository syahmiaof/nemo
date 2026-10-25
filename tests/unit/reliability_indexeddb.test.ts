import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { NemoDatabase } from '@/db/nemoDb';
import {
  atomicDeleteProject,
  atomicDeleteTask,
  atomicDeleteAssignment,
  atomicDeleteSubject,
  atomicDeleteSemester,
  atomicDeleteGoal,
  atomicSetTaskStatus,
  cleanupOrphanAssetBlobs,
  auditDatabaseIntegrity,
} from '@/db/operations';

describe('Sprint 2 — IndexedDB Reliability & Multi-Table Transactions', () => {
  let testDb: NemoDatabase;
  const TEST_DB_NAME = 'NemoTestReliability_' + Math.random().toString(36).substring(7);

  beforeEach(async () => {
    testDb = new NemoDatabase(TEST_DB_NAME);
    await testDb.open();
  });

  afterEach(async () => {
    await testDb.delete();
  });

  it('preserves all object stores with proper indices and schema version 5', () => {
    expect(testDb.verno).toBe(5);
    const storeNames = testDb.tables.map((t) => t.name);
    const expectedStores = [
      'settings',
      'projects',
      'tasks',
      'milestones',
      'semesters',
      'subjects',
      'assignments',
      'calendarEvents',
      'goals',
      'goalTaskLinks',
      'focusSelections',
      'assetBlobs',
      'syncMutations',
      'hydrationLogs',
      'dietLogs',
      'workoutLogs',
      'bodyMetrics',
      'financialProfiles',
      'financialCommitments',
      'debts',
      'debtPayments',
      'wishlistItems',
      'savingsGoals',
      'savingsDeposits',
      'visionItems',
    ];
    for (const name of expectedStores) {
      expect(storeNames).toContain(name);
    }
    expect(storeNames.length).toBe(25);
  });

  it('performs atomic project deletion, cleaning up asset blobs and milestones while safely unlinking tasks', async () => {
    const now = new Date().toISOString();
    const projectId = 'proj_alpha';
    const blobId = 'blob_alpha_cover';

    // Seed project, cover blob, milestones, and linked tasks
    await testDb.projects.add({
      id: projectId,
      title: 'Reliability Overhaul',
      priority: 'high',
      status: 'in_progress',
      tags: ['db', 'pwa'],
      techStack: ['React', 'Dexie'],
      previewBlobId: blobId,
      createdAt: now,
      updatedAt: now,
    });

    await testDb.assetBlobs.add({
      id: blobId,
      ownerType: 'project',
      ownerId: projectId,
      mimeType: 'image/png',
      size: 1024,
      data: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
      createdAt: now,
    });

    await testDb.milestones.add({
      id: 'mile_1',
      ownerType: 'project',
      ownerId: projectId,
      title: 'Architecture Verified',
      order: 0,
    });

    await testDb.tasks.bulkAdd([
      {
        id: 'task_p1',
        title: 'Task in project',
        status: 'todo',
        priority: 'high',
        parentType: 'project',
        parentId: projectId,
        tags: [],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'task_standalone',
        title: 'Independent task',
        status: 'todo',
        priority: 'low',
        tags: [],
        createdAt: now,
        updatedAt: now,
      },
    ]);

    // Verify initial count
    expect(await testDb.projects.count()).toBe(1);
    expect(await testDb.assetBlobs.count()).toBe(1);
    expect(await testDb.milestones.count()).toBe(1);
    expect(await testDb.tasks.count()).toBe(2);

    // Execute atomic delete
    await atomicDeleteProject(testDb, projectId);

    // Assert project is deleted
    expect(await testDb.projects.get(projectId)).toBeUndefined();

    // Assert cover blob is deleted (zero orphan asset leak)
    expect(await testDb.assetBlobs.get(blobId)).toBeUndefined();
    expect(await testDb.assetBlobs.where('ownerId').equals(projectId).count()).toBe(0);

    // Assert milestones are deleted
    expect(await testDb.milestones.where('ownerId').equals(projectId).count()).toBe(0);

    // Assert linked task is NOT lost, but safely converted to standalone
    const unlinkedTask = await testDb.tasks.get('task_p1');
    expect(unlinkedTask).toBeDefined();
    expect(unlinkedTask?.parentType).toBeUndefined();
    expect(unlinkedTask?.parentId).toBeUndefined();

    // Assert independent task was untouched
    expect(await testDb.tasks.get('task_standalone')).toBeDefined();
  });

  it('performs atomic task deletion and evicts focus selections and goal task links', async () => {
    const now = new Date().toISOString();
    const taskId = 'task_focused';

    await testDb.tasks.add({
      id: taskId,
      title: 'Important task',
      status: 'in_progress',
      priority: 'urgent',
      tags: [],
      createdAt: now,
      updatedAt: now,
    });

    await testDb.focusSelections.add({
      id: 'focus_1',
      taskId,
      effectiveLocalDate: '2026-10-20',
      chosenAt: now,
    });

    await testDb.goalTaskLinks.add({
      id: 'gtl_1',
      goalId: 'goal_ship_nemo',
      taskId,
      createdAt: now,
    });

    expect(await testDb.focusSelections.count()).toBe(1);
    expect(await testDb.goalTaskLinks.count()).toBe(1);

    // Atomic delete
    await atomicDeleteTask(testDb, taskId);

    expect(await testDb.tasks.get(taskId)).toBeUndefined();
    expect(await testDb.focusSelections.where('taskId').equals(taskId).count()).toBe(0);
    expect(await testDb.goalTaskLinks.where('taskId').equals(taskId).count()).toBe(0);
  });

  it('atomically enforces task completion timestamps and evicts focus slot upon completion', async () => {
    const now = new Date().toISOString();
    const taskId = 'task_toggle_test';

    await testDb.tasks.add({
      id: taskId,
      title: 'In progress task',
      status: 'todo',
      priority: 'medium',
      tags: [],
      createdAt: now,
      updatedAt: now,
    });

    await testDb.focusSelections.add({
      id: 'focus_active',
      taskId,
      effectiveLocalDate: '2026-10-20',
      chosenAt: now,
    });

    // Mark as done
    await atomicSetTaskStatus(testDb, taskId, 'done');

    const doneTask = await testDb.tasks.get(taskId);
    expect(doneTask?.status).toBe('done');
    expect(doneTask?.completedAt).toBeDefined();
    expect(typeof doneTask?.completedAt).toBe('string');
    // Focus selection must be evicted
    expect(await testDb.focusSelections.where('taskId').equals(taskId).count()).toBe(0);

    // Reopen task
    await atomicSetTaskStatus(testDb, taskId, 'todo');
    const reopenedTask = await testDb.tasks.get(taskId);
    expect(reopenedTask?.status).toBe('todo');
    expect(reopenedTask?.completedAt).toBeUndefined();
  });

  it('cascades academic deletion completely across semesters, subjects, assignments, and tasks', async () => {
    const now = new Date().toISOString();
    const semesterId = 'sem_2026';
    const subjectId = 'sub_cs101';
    const assignmentId = 'assign_homework1';
    const subtaskId = 'task_sub_1';

    await testDb.semesters.add({ id: semesterId, title: 'Fall 2026', status: 'active', createdAt: now });
    await testDb.subjects.add({ id: subjectId, semesterId, title: 'Computer Science', color: '#10b981', createdAt: now });
    await testDb.assignments.add({ id: assignmentId, subjectId, title: 'Lab 1', status: 'in_progress', createdAt: now, updatedAt: now });
    await testDb.tasks.add({
      id: subtaskId,
      title: 'Subtask for Lab 1',
      status: 'todo',
      priority: 'high',
      parentType: 'assignment',
      parentId: assignmentId,
      tags: [],
      createdAt: now,
      updatedAt: now,
    });
    await testDb.focusSelections.add({ id: 'focus_sub', taskId: subtaskId, effectiveLocalDate: '2026-10-20', chosenAt: now });
    await testDb.calendarEvents.add({ id: 'cal_sub', title: 'CS Lecture', subjectId, startAt: now, endAt: now, isAllDay: false, createdAt: now, updatedAt: now });

    expect(await testDb.semesters.count()).toBe(1);
    expect(await testDb.subjects.count()).toBe(1);
    expect(await testDb.assignments.count()).toBe(1);
    expect(await testDb.tasks.count()).toBe(1);
    expect(await testDb.focusSelections.count()).toBe(1);
    expect(await testDb.calendarEvents.count()).toBe(1);

    // Delete entire semester atomically
    await atomicDeleteSemester(testDb, semesterId);

    expect(await testDb.semesters.count()).toBe(0);
    expect(await testDb.subjects.count()).toBe(0);
    expect(await testDb.assignments.count()).toBe(0);
    expect(await testDb.tasks.count()).toBe(0);
    expect(await testDb.focusSelections.count()).toBe(0);
    expect(await testDb.calendarEvents.count()).toBe(0);
  });

  it('atomically deletes goals and goal links while keeping linked tasks intact', async () => {
    const now = new Date().toISOString();
    const goalId = 'goal_learning';
    const taskId = 'task_study_db';

    await testDb.goals.add({ id: goalId, title: 'Learn Dexie', status: 'active', createdAt: now, updatedAt: now });
    await testDb.milestones.add({ id: 'mile_g1', ownerType: 'goal', ownerId: goalId, title: 'Finish Ch 1', order: 0 });
    await testDb.tasks.add({ id: taskId, title: 'Read documentation', status: 'todo', priority: 'medium', tags: [], createdAt: now, updatedAt: now });
    await testDb.goalTaskLinks.add({ id: 'gtl_g1', goalId, taskId, createdAt: now });

    expect(await testDb.goals.count()).toBe(1);
    expect(await testDb.goalTaskLinks.count()).toBe(1);
    expect(await testDb.tasks.count()).toBe(1);

    await atomicDeleteGoal(testDb, goalId);

    expect(await testDb.goals.get(goalId)).toBeUndefined();
    expect(await testDb.milestones.where('ownerId').equals(goalId).count()).toBe(0);
    expect(await testDb.goalTaskLinks.where('goalId').equals(goalId).count()).toBe(0);
    // Linked task must remain safe and intact
    expect(await testDb.tasks.get(taskId)).toBeDefined();
  });

  it('atomically deletes single assignments and subjects with complete cascade', async () => {
    const now = new Date().toISOString();
    await testDb.subjects.add({ id: 'sub_standalone', semesterId: 'sem_1', title: 'Math', color: '#38bdf8', createdAt: now });
    await testDb.assignments.add({ id: 'assign_hw2', subjectId: 'sub_standalone', title: 'HW 2', status: 'not_started', createdAt: now, updatedAt: now });
    await testDb.tasks.add({ id: 'task_hw2', title: 'Problem 1', status: 'todo', priority: 'high', parentType: 'assignment', parentId: 'assign_hw2', tags: [], createdAt: now, updatedAt: now });
    await testDb.focusSelections.add({ id: 'focus_hw2', taskId: 'task_hw2', effectiveLocalDate: '2026-10-20', chosenAt: now });

    // Delete assignment
    await atomicDeleteAssignment(testDb, 'assign_hw2');
    expect(await testDb.assignments.get('assign_hw2')).toBeUndefined();
    expect(await testDb.tasks.get('task_hw2')).toBeUndefined();
    expect(await testDb.focusSelections.get('focus_hw2')).toBeUndefined();

    // Delete subject
    await atomicDeleteSubject(testDb, 'sub_standalone');
    expect(await testDb.subjects.get('sub_standalone')).toBeUndefined();
  });

  it('runs auditDatabaseIntegrity to detect healthy and corrupted states', async () => {
    const now = new Date().toISOString();
    await testDb.settings.put({
      id: 'default',
      displayName: 'Test',
      theme: 'dark',
      accent: 'mint',
      weekStartsOn: 1,
      hourFormat: '24h',
      reduceMotion: false,
      onboardingCompleted: true,
      databaseVersion: 1,
    });

    const cleanAudit = await auditDatabaseIntegrity(testDb);
    expect(cleanAudit.valid).toBe(true);
    expect(cleanAudit.issues).toHaveLength(0);

    // Inject an invalid state: task marked done without completedAt
    await testDb.tasks.add({
      id: 'task_corrupt_invar',
      title: 'Broken invariant',
      status: 'done',
      priority: 'low',
      tags: [],
      createdAt: now,
      updatedAt: now,
    });

    const dirtyAudit = await auditDatabaseIntegrity(testDb);
    expect(dirtyAudit.valid).toBe(false);
    expect(dirtyAudit.issues.some((i) => i.includes('completedAt'))).toBe(true);
  });

  it('cleans up orphan asset blobs without deleting valid project covers', async () => {
    const now = new Date().toISOString();
    const validProjId = 'proj_valid';
    const validBlobId = 'blob_valid_cover';
    const orphanBlobId1 = 'blob_orphan_deleted_project';
    const orphanBlobId2 = 'blob_unreferenced_draft';

    await testDb.projects.add({
      id: validProjId,
      title: 'Active Project',
      priority: 'medium',
      status: 'in_progress',
      tags: [],
      techStack: [],
      previewBlobId: validBlobId,
      createdAt: now,
      updatedAt: now,
    });

    await testDb.assetBlobs.bulkAdd([
      {
        id: validBlobId,
        ownerType: 'project',
        ownerId: validProjId,
        mimeType: 'image/png',
        size: 512,
        data: 'valid_data',
        createdAt: now,
      },
      {
        id: orphanBlobId1,
        ownerType: 'project',
        ownerId: 'proj_nonexistent_123',
        mimeType: 'image/png',
        size: 512,
        data: 'orphan_data_1',
        createdAt: now,
      },
      {
        id: orphanBlobId2,
        ownerType: 'project',
        ownerId: 'pending',
        mimeType: 'image/png',
        size: 512,
        data: 'orphan_data_2',
        createdAt: now,
      },
    ]);

    expect(await testDb.assetBlobs.count()).toBe(3);

    const deleted = await cleanupOrphanAssetBlobs(testDb);
    expect(deleted).toBe(2);

    expect(await testDb.assetBlobs.count()).toBe(1);
    expect(await testDb.assetBlobs.get(validBlobId)).toBeDefined();
    expect(await testDb.assetBlobs.get(orphanBlobId1)).toBeUndefined();
    expect(await testDb.assetBlobs.get(orphanBlobId2)).toBeUndefined();
  });

  it('rolls back completely if an error occurs mid-transaction', async () => {
    const now = new Date().toISOString();
    await testDb.tasks.add({
      id: 'task_stable',
      title: 'Must survive failure',
      status: 'todo',
      priority: 'medium',
      tags: [],
      createdAt: now,
      updatedAt: now,
    });

    let thrown = false;
    try {
      await testDb.transaction('rw', [testDb.tasks, testDb.projects], async () => {
        await testDb.tasks.add({
          id: 'task_temporary',
          title: 'Should be rolled back',
          status: 'todo',
          priority: 'low',
          tags: [],
          createdAt: now,
          updatedAt: now,
        });

        await testDb.projects.add({
          id: 'proj_temp',
          title: 'Should be rolled back',
          priority: 'low',
          status: 'not_started',
          tags: [],
          techStack: [],
          createdAt: now,
          updatedAt: now,
        });

        // Intentional mid-transaction failure
        throw new Error('Simulated atomic abort trigger');
      });
    } catch (e: any) {
      thrown = true;
      expect(e.message).toContain('Simulated atomic abort trigger');
    }

    expect(thrown).toBe(true);

    // Verify rollback: task_temporary and proj_temp must NOT exist
    expect(await testDb.tasks.get('task_temporary')).toBeUndefined();
    expect(await testDb.projects.get('proj_temp')).toBeUndefined();
    // Original record must remain unharmed
    expect(await testDb.tasks.get('task_stable')).toBeDefined();
    expect(await testDb.tasks.count()).toBe(1);
  });
});
