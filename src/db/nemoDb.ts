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
} from '@/domain/types';
import { BackupSchema, type BackupData } from '@/domain/schemas';
import { databaseNameForMode, getWorkspaceMode, REAL_DATABASE_NAME } from './workspaceMode';

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
  }
}

export const db = new NemoDatabase(databaseNameForMode(getWorkspaceMode()));

/**
 * Initializes default settings if not already present.
 */
export async function ensureSettings(): Promise<WorkspaceSettings> {
  const existing = await db.settings.get('default');
  if (existing) {
    return existing;
  }
  const defaultSettings: WorkspaceSettings = {
    id: 'default',
    displayName: 'My Workspace',
    theme: 'dark',
    accent: 'mint',
    weekStartsOn: 1, // Monday default
    hourFormat: '24h',
    reduceMotion: false,
    onboardingCompleted: false,
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
    const rawParsed = JSON.parse(jsonContent);
    const parsed = BackupSchema.safeParse(rawParsed);
    if (!parsed.success) {
      return { success: false, error: `Invalid backup schema: ${parsed.error.errors.map(e => e.message).join(', ')}` };
    }

    const { data } = parsed.data;

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
    ]);
  });
  await ensureSettings();
}
