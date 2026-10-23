import Dexie, { type EntityTable } from 'dexie';
import type {
  WorkspaceSettings,
  Project,
  Task,
  Milestone,
  Semester,
  Subject,
  Assignment,
  CalendarEvent,
  Goal,
  GoalTaskLink,
  FocusSelection,
  AssetBlob,
  SyncMutation,
  HydrationLog,
  DietLog,
  WorkoutLog,
  BodyMetric,
} from '@/domain/types';
import { BackupSchema, type BackupData } from '@/domain/schemas';
import { databaseNameForMode, getWorkspaceMode, REAL_DATABASE_NAME } from './workspaceMode';
import { validateReferentialIntegrity } from './operations';
import { registerDexieSyncHooks } from '@/sync/dexieHooks';

export * from './operations';

export class NemoDatabase extends Dexie {
  settings!: EntityTable<WorkspaceSettings, 'id'>;
  projects!: EntityTable<Project, 'id'>;
  tasks!: EntityTable<Task, 'id'>;
  milestones!: EntityTable<Milestone, 'id'>;
  semesters!: EntityTable<Semester, 'id'>;
  subjects!: EntityTable<Subject, 'id'>;
  assignments!: EntityTable<Assignment, 'id'>;
  calendarEvents!: EntityTable<CalendarEvent, 'id'>;
  goals!: EntityTable<Goal, 'id'>;
  goalTaskLinks!: EntityTable<GoalTaskLink, 'id'>;
  focusSelections!: EntityTable<FocusSelection, 'id'>;
  assetBlobs!: EntityTable<AssetBlob, 'id'>;
  syncMutations!: EntityTable<SyncMutation, 'id'>;
  hydrationLogs!: EntityTable<HydrationLog, 'id'>;
  dietLogs!: EntityTable<DietLog, 'id'>;
  workoutLogs!: EntityTable<WorkoutLog, 'id'>;
  bodyMetrics!: EntityTable<BodyMetric, 'id'>;

  constructor(name = REAL_DATABASE_NAME) {
    super(name);
    this.version(1).stores({
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
    this.version(2).stores({
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
      syncMutations: 'id, entityType, entityId, status, createdAt, ownerUserId, [ownerUserId+status]',
    });
    this.version(3).stores({
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
      syncMutations: 'id, entityType, entityId, status, createdAt, ownerUserId, [ownerUserId+status]',
      hydrationLogs: 'id, date, amountMl, loggedAt',
      dietLogs: 'id, date, mealType, calories, loggedAt',
      workoutLogs: 'id, date, type, durationMinutes, distanceKm, completedAt',
      bodyMetrics: 'id, date, weightKg, loggedAt',
    });

  }
}

export const db = new NemoDatabase(databaseNameForMode(getWorkspaceMode()));

// Airgap: Only register sync outbox hooks on the real personal database, never demo
if (getWorkspaceMode() === 'real') {
  registerDexieSyncHooks(db);
}

/**
 * Initializes default settings if not already present.
 */
export async function ensureSettings(): Promise<WorkspaceSettings> {
  const existing = await db.settings.get('default');
  if (existing) {
    // Graceful migration: upgrade legacy default 'dark' to 'aurora' if not explicitly changed
    if (typeof window !== 'undefined') {
      const explicitlyChosen = localStorage.getItem('nemo:theme-explicitly-chosen');
      if (existing.theme === 'dark' && !explicitlyChosen) {
        existing.theme = 'aurora';
        await db.settings.put(existing);
      }
    }
    return existing;
  }
  const defaultSettings: WorkspaceSettings = {
    id: 'default',
    displayName: 'My Workspace',
    theme: 'aurora',
    accent: 'mint',
    weekStartsOn: 1, // Monday default
    hourFormat: '24h',
    reduceMotion: false,
    onboardingCompleted: true,
    databaseVersion: 1,
  };
  await db.settings.put(defaultSettings);
  return defaultSettings;
}

/**
 * Exports all user data and binary assets into a validated, portable JSON backup structure.
 */
export async function exportWorkspaceBackup(): Promise<string> {
  const [
    settings,
    projects,
    tasks,
    milestones,
    semesters,
    subjects,
    assignments,
    calendarEvents,
    goals,
    goalTaskLinks,
    focusSelections,
    assetBlobs,
    hydrationLogs,
    dietLogs,
    workoutLogs,
    bodyMetrics,
  ] = await Promise.all([
    ensureSettings(),
    db.projects.toArray(),
    db.tasks.toArray(),
    db.milestones.toArray(),
    db.semesters.toArray(),
    db.subjects.toArray(),
    db.assignments.toArray(),
    db.calendarEvents.toArray(),
    db.goals.toArray(),
    db.goalTaskLinks.toArray(),
    db.focusSelections.toArray(),
    db.assetBlobs.toArray(),
    db.hydrationLogs.toArray(),
    db.dietLogs.toArray(),
    db.workoutLogs.toArray(),
    db.bodyMetrics.toArray(),
  ]);

  const backup: BackupData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    app: 'nemo',
    data: {
      settings,
      projects,
      tasks,
      milestones,
      semesters,
      subjects,
      assignments,
      calendarEvents,
      goals,
      goalTaskLinks,
      focusSelections,
      assetBlobs,
      hydrationLogs,
      dietLogs,
      workoutLogs,
      bodyMetrics,
    },
  };

  // Validate envelope before serialization
  BackupSchema.parse(backup);
  return JSON.stringify(backup, null, 2);
}

/**
 * Atomically validates and restores a backup JSON string.
 * If validation fails or any error occurs, the existing database is left untouched.
 */
export async function importWorkspaceBackup(jsonContent: string): Promise<{ success: boolean; error?: string }> {
  try {
    const rawParsed = JSON.parse(jsonContent, (key, value) => {
      // Defense-in-depth: strip prototype pollution vectors during JSON parsing
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        return undefined;
      }
      return value;
    });
    const parsed = BackupSchema.safeParse(rawParsed);
    if (!parsed.success) {
      return { success: false, error: `Invalid backup schema: ${parsed.error.errors.map(e => e.message).join(', ')}` };
    }

    const { data } = parsed.data;

    // Validate referential integrity in-memory before modifying database
    const refCheck = validateReferentialIntegrity(data);
    if (!refCheck.valid) {
      return {
        success: false,
        error: `Referential integrity validation failed: ${refCheck.errors.slice(0, 3).join('; ')}${refCheck.errors.length > 3 ? ` (+${refCheck.errors.length - 3} more)` : ''}`,
      };
    }

    // Perform atomic transaction replacement across all tables
    await db.transaction('rw', [
      db.settings,
      db.projects,
      db.tasks,
      db.milestones,
      db.semesters,
      db.subjects,
      db.assignments,
      db.calendarEvents,
      db.goals,
      db.goalTaskLinks,
      db.focusSelections,
      db.assetBlobs,
      db.syncMutations,
      db.hydrationLogs,
      db.dietLogs,
      db.workoutLogs,
      db.bodyMetrics,
    ], async () => {
      // Clear existing records
      await Promise.all([
        db.settings.clear(),
        db.projects.clear(),
        db.tasks.clear(),
        db.milestones.clear(),
        db.semesters.clear(),
        db.subjects.clear(),
        db.assignments.clear(),
        db.calendarEvents.clear(),
        db.goals.clear(),
        db.goalTaskLinks.clear(),
        db.focusSelections.clear(),
        db.assetBlobs.clear(),
        db.hydrationLogs.clear(),
        db.dietLogs.clear(),
        db.workoutLogs.clear(),
        db.bodyMetrics.clear(),
      ]);

      // Insert backup records
      await db.settings.put(data.settings);
      if (data.projects.length) await db.projects.bulkAdd(data.projects);
      if (data.tasks.length) await db.tasks.bulkAdd(data.tasks);
      if (data.milestones.length) await db.milestones.bulkAdd(data.milestones);
      if (data.semesters.length) await db.semesters.bulkAdd(data.semesters);
      if (data.subjects.length) await db.subjects.bulkAdd(data.subjects);
      if (data.assignments.length) await db.assignments.bulkAdd(data.assignments);
      if (data.calendarEvents.length) await db.calendarEvents.bulkAdd(data.calendarEvents);
      if (data.goals.length) await db.goals.bulkAdd(data.goals);
      if (data.goalTaskLinks.length) await db.goalTaskLinks.bulkAdd(data.goalTaskLinks);
      if (data.focusSelections.length) await db.focusSelections.bulkAdd(data.focusSelections);
      if (data.assetBlobs.length) await db.assetBlobs.bulkAdd(data.assetBlobs);
      if (data.hydrationLogs?.length) await db.hydrationLogs.bulkAdd(data.hydrationLogs);
      if (data.dietLogs?.length) await db.dietLogs.bulkAdd(data.dietLogs);
      if (data.workoutLogs?.length) await db.workoutLogs.bulkAdd(data.workoutLogs);
      if (data.bodyMetrics?.length) await db.bodyMetrics.bulkAdd(data.bodyMetrics);
    });

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown import error';
    return { success: false, error: message };
  }
}

/**
 * Completely clears all workspace records and resets to default initial empty state.
 */
export async function resetWorkspaceData(): Promise<void> {
  await db.transaction('rw', [
    db.settings,
    db.projects,
    db.tasks,
    db.milestones,
    db.semesters,
    db.subjects,
    db.assignments,
    db.calendarEvents,
    db.goals,
    db.goalTaskLinks,
    db.focusSelections,
    db.assetBlobs,
    db.syncMutations,
    db.hydrationLogs,
    db.dietLogs,
    db.workoutLogs,
    db.bodyMetrics,
  ], async () => {
    await Promise.all([
      db.settings.clear(),
      db.projects.clear(),
      db.tasks.clear(),
      db.milestones.clear(),
      db.semesters.clear(),
      db.subjects.clear(),
      db.assignments.clear(),
      db.calendarEvents.clear(),
      db.goals.clear(),
      db.goalTaskLinks.clear(),
      db.focusSelections.clear(),
      db.assetBlobs.clear(),
      db.hydrationLogs.clear(),
      db.dietLogs.clear(),
      db.workoutLogs.clear(),
      db.bodyMetrics.clear(),
    ]);
  });
  await ensureSettings();
}
