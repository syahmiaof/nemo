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
  FinancialProfile,
  FinancialCommitment,
  DebtItem,
  DebtPayment,
  WishlistItem,
  SavingsGoal,
  SavingsDeposit,
  VisionItem,
  MonthlyRoadmapItem,
  IncomeItem,
  IbadahDailyLog,
  QadhaPrayerItem,
  QadhaFastingRecord,
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
  financialProfiles!: EntityTable<FinancialProfile, 'id'>;
  financialCommitments!: EntityTable<FinancialCommitment, 'id'>;
  debts!: EntityTable<DebtItem, 'id'>;
  debtPayments!: EntityTable<DebtPayment, 'id'>;
  wishlistItems!: EntityTable<WishlistItem, 'id'>;
  savingsGoals!: EntityTable<SavingsGoal, 'id'>;
  savingsDeposits!: EntityTable<SavingsDeposit, 'id'>;
  visionItems!: EntityTable<VisionItem, 'id'>;
  monthlyRoadmaps!: EntityTable<MonthlyRoadmapItem, 'id'>;
  incomeItems!: EntityTable<IncomeItem, 'id'>;
  ibadahDailyLogs!: EntityTable<IbadahDailyLog, 'id'>;
  qadhaPrayers!: EntityTable<QadhaPrayerItem, 'id'>;
  qadhaFastings!: EntityTable<QadhaFastingRecord, 'id'>;

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
    this.version(4).stores({
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
      financialProfiles: 'id, updatedAt',
      financialCommitments: 'id, category, dueDayOfMonth, isPaidThisMonth, lastPaidMonthYear, createdAt',
      debts: 'id, priority, targetPayoffDate, createdAt',
      debtPayments: 'id, debtId, paidAt',
      wishlistItems: 'id, priority, isBought, targetSavingsGoalId, addedAt',
      savingsGoals: 'id, category, targetDate, createdAt',
      savingsDeposits: 'id, savingsGoalId, type, loggedAt',
    });
    this.version(5).stores({
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
      financialProfiles: 'id, updatedAt',
      financialCommitments: 'id, category, dueDayOfMonth, isPaidThisMonth, lastPaidMonthYear, createdAt',
      debts: 'id, priority, targetPayoffDate, createdAt',
      debtPayments: 'id, debtId, paidAt',
      wishlistItems: 'id, priority, isBought, targetSavingsGoalId, addedAt',
      savingsGoals: 'id, category, targetDate, createdAt',
      savingsDeposits: 'id, savingsGoalId, type, loggedAt',
      visionItems: 'id, horizon, category, status, linkedGoalId, linkedSavingsGoalId, targetDate, order, updatedAt',
    });
    this.version(6).stores({
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
      financialProfiles: 'id, updatedAt',
      financialCommitments: 'id, category, dueDayOfMonth, isPaidThisMonth, lastPaidMonthYear, createdAt',
      debts: 'id, priority, targetPayoffDate, createdAt',
      debtPayments: 'id, debtId, paidAt',
      wishlistItems: 'id, priority, isBought, targetSavingsGoalId, addedAt',
      savingsGoals: 'id, category, targetDate, createdAt',
      savingsDeposits: 'id, savingsGoalId, type, loggedAt',
      visionItems: 'id, horizon, category, status, linkedGoalId, linkedSavingsGoalId, targetDate, order, updatedAt',
      monthlyRoadmaps: 'id, year, month, status, mascot, updatedAt',
    });
    this.version(7).stores({
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
      financialProfiles: 'id, updatedAt',
      financialCommitments: 'id, category, dueDayOfMonth, isPaidThisMonth, lastPaidMonthYear, createdAt',
      debts: 'id, priority, targetPayoffDate, createdAt',
      debtPayments: 'id, debtId, paidAt',
      wishlistItems: 'id, priority, isBought, targetSavingsGoalId, addedAt',
      savingsGoals: 'id, category, targetDate, createdAt',
      savingsDeposits: 'id, savingsGoalId, type, loggedAt',
      visionItems: 'id, horizon, category, status, linkedGoalId, linkedSavingsGoalId, targetDate, order, updatedAt',
      monthlyRoadmaps: 'id, year, month, status, mascot, updatedAt',
      incomeItems: 'id, type, dateReceived, isRecurring, createdAt',
      ibadahDailyLogs: 'id, date, updatedAt',
      qadhaPrayers: 'id, prayerType, updatedAt',
      qadhaFastings: 'id, yearHijri, yearGregorian, isFidyahPaid, updatedAt',
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
export async function ensureSettings(targetDb: NemoDatabase = db): Promise<WorkspaceSettings> {
  const existing = await targetDb.settings.get('default');
  if (existing) {
    // Graceful migration: upgrade legacy default 'dark' to 'aurora' if not explicitly changed
    if (typeof window !== 'undefined') {
      const explicitlyChosen = localStorage.getItem('nemo:theme-explicitly-chosen');
      if (existing.theme === 'dark' && !explicitlyChosen) {
        existing.theme = 'aurora';
        await targetDb.settings.put(existing);
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
  await targetDb.settings.put(defaultSettings);
  return defaultSettings;
}

/**
 * Exports all user data and binary assets into a validated, portable JSON backup structure.
 */
export async function exportWorkspaceBackup(targetDb: NemoDatabase = db): Promise<string> {
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
    financialProfiles,
    financialCommitments,
    debts,
    debtPayments,
    wishlistItems,
    savingsGoals,
    savingsDeposits,
    visionItems,
    monthlyRoadmaps,
    incomeItems,
    ibadahDailyLogs,
    qadhaPrayers,
    qadhaFastings,
  ] = await Promise.all([
    ensureSettings(targetDb),
    targetDb.projects.toArray(),
    targetDb.tasks.toArray(),
    targetDb.milestones.toArray(),
    targetDb.semesters.toArray(),
    targetDb.subjects.toArray(),
    targetDb.assignments.toArray(),
    targetDb.calendarEvents.toArray(),
    targetDb.goals.toArray(),
    targetDb.goalTaskLinks.toArray(),
    targetDb.focusSelections.toArray(),
    targetDb.assetBlobs.toArray(),
    targetDb.hydrationLogs.toArray(),
    targetDb.dietLogs.toArray(),
    targetDb.workoutLogs.toArray(),
    targetDb.bodyMetrics.toArray(),
    targetDb.financialProfiles.toArray(),
    targetDb.financialCommitments.toArray(),
    targetDb.debts.toArray(),
    targetDb.debtPayments.toArray(),
    targetDb.wishlistItems.toArray(),
    targetDb.savingsGoals.toArray(),
    targetDb.savingsDeposits.toArray(),
    targetDb.visionItems.toArray(),
    targetDb.monthlyRoadmaps.toArray(),
    targetDb.incomeItems.toArray(),
    targetDb.ibadahDailyLogs.toArray(),
    targetDb.qadhaPrayers.toArray(),
    targetDb.qadhaFastings.toArray(),
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
      financialProfiles,
      financialCommitments,
      debts,
      debtPayments,
      wishlistItems,
      savingsGoals,
      savingsDeposits,
      visionItems,
      monthlyRoadmaps,
      incomeItems,
      ibadahDailyLogs,
      qadhaPrayers,
      qadhaFastings,
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
export async function importWorkspaceBackup(jsonContent: string, targetDb: NemoDatabase = db): Promise<{ success: boolean; error?: string }> {
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
    await targetDb.transaction('rw', [
      targetDb.settings,
      targetDb.projects,
      targetDb.tasks,
      targetDb.milestones,
      targetDb.semesters,
      targetDb.subjects,
      targetDb.assignments,
      targetDb.calendarEvents,
      targetDb.goals,
      targetDb.goalTaskLinks,
      targetDb.focusSelections,
      targetDb.assetBlobs,
      targetDb.syncMutations,
      targetDb.hydrationLogs,
      targetDb.dietLogs,
      targetDb.workoutLogs,
      targetDb.bodyMetrics,
      targetDb.financialProfiles,
      targetDb.financialCommitments,
      targetDb.debts,
      targetDb.debtPayments,
      targetDb.wishlistItems,
      targetDb.savingsGoals,
      targetDb.savingsDeposits,
      targetDb.visionItems,
      targetDb.monthlyRoadmaps,
      targetDb.incomeItems,
      targetDb.ibadahDailyLogs,
      targetDb.qadhaPrayers,
      targetDb.qadhaFastings,
    ], async () => {
      // Clear existing records
      await Promise.all([
        targetDb.settings.clear(),
        targetDb.projects.clear(),
        targetDb.tasks.clear(),
        targetDb.milestones.clear(),
        targetDb.semesters.clear(),
        targetDb.subjects.clear(),
        targetDb.assignments.clear(),
        targetDb.calendarEvents.clear(),
        targetDb.goals.clear(),
        targetDb.goalTaskLinks.clear(),
        targetDb.focusSelections.clear(),
        targetDb.assetBlobs.clear(),
        targetDb.hydrationLogs.clear(),
        targetDb.dietLogs.clear(),
        targetDb.workoutLogs.clear(),
        targetDb.bodyMetrics.clear(),
        targetDb.financialProfiles.clear(),
        targetDb.financialCommitments.clear(),
        targetDb.debts.clear(),
        targetDb.debtPayments.clear(),
        targetDb.wishlistItems.clear(),
        targetDb.savingsGoals.clear(),
        targetDb.savingsDeposits.clear(),
        targetDb.visionItems.clear(),
        targetDb.monthlyRoadmaps.clear(),
        targetDb.incomeItems.clear(),
        targetDb.ibadahDailyLogs.clear(),
        targetDb.qadhaPrayers.clear(),
        targetDb.qadhaFastings.clear(),
      ]);

      // Insert backup records
      await targetDb.settings.put(data.settings);
      if (data.projects.length) await targetDb.projects.bulkAdd(data.projects);
      if (data.tasks.length) await targetDb.tasks.bulkAdd(data.tasks);
      if (data.milestones.length) await targetDb.milestones.bulkAdd(data.milestones);
      if (data.semesters.length) await targetDb.semesters.bulkAdd(data.semesters);
      if (data.subjects.length) await targetDb.subjects.bulkAdd(data.subjects);
      if (data.assignments.length) await targetDb.assignments.bulkAdd(data.assignments);
      if (data.calendarEvents.length) await targetDb.calendarEvents.bulkAdd(data.calendarEvents);
      if (data.goals.length) await targetDb.goals.bulkAdd(data.goals);
      if (data.goalTaskLinks.length) await targetDb.goalTaskLinks.bulkAdd(data.goalTaskLinks);
      if (data.focusSelections.length) await targetDb.focusSelections.bulkAdd(data.focusSelections);
      if (data.assetBlobs.length) await targetDb.assetBlobs.bulkAdd(data.assetBlobs);
      if (data.hydrationLogs?.length) await targetDb.hydrationLogs.bulkAdd(data.hydrationLogs);
      if (data.dietLogs?.length) await targetDb.dietLogs.bulkAdd(data.dietLogs);
      if (data.workoutLogs?.length) await targetDb.workoutLogs.bulkAdd(data.workoutLogs);
      if (data.bodyMetrics?.length) await targetDb.bodyMetrics.bulkAdd(data.bodyMetrics);
      if (data.financialProfiles?.length) await targetDb.financialProfiles.bulkAdd(data.financialProfiles);
      if (data.financialCommitments?.length) await targetDb.financialCommitments.bulkAdd(data.financialCommitments);
      if (data.debts?.length) await targetDb.debts.bulkAdd(data.debts);
      if (data.debtPayments?.length) await targetDb.debtPayments.bulkAdd(data.debtPayments);
      if (data.wishlistItems?.length) await targetDb.wishlistItems.bulkAdd(data.wishlistItems);
      if (data.savingsGoals?.length) await targetDb.savingsGoals.bulkAdd(data.savingsGoals);
      if (data.savingsDeposits?.length) await targetDb.savingsDeposits.bulkAdd(data.savingsDeposits);
      if (data.visionItems?.length) await targetDb.visionItems.bulkAdd(data.visionItems);
      if (data.monthlyRoadmaps?.length) await targetDb.monthlyRoadmaps.bulkAdd(data.monthlyRoadmaps);
      if (data.incomeItems?.length) await targetDb.incomeItems.bulkAdd(data.incomeItems);
      if (data.ibadahDailyLogs?.length) await targetDb.ibadahDailyLogs.bulkAdd(data.ibadahDailyLogs);
      if (data.qadhaPrayers?.length) await targetDb.qadhaPrayers.bulkAdd(data.qadhaPrayers);
      if (data.qadhaFastings?.length) await targetDb.qadhaFastings.bulkAdd(data.qadhaFastings);
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
export async function resetWorkspaceData(targetDb: NemoDatabase = db): Promise<void> {
  let syncEngineRef: any = null;
  try {
    const { syncEngine } = await import('@/sync/syncEngine');
    syncEngineRef = syncEngine;
    if (typeof syncEngineRef?.setIngestingRemote === 'function') {
      syncEngineRef.setIngestingRemote(true);
    }
  } catch {
    // Optional syncEngine import
  }

  try {
    await targetDb.transaction('rw', [
      targetDb.settings,
      targetDb.projects,
      targetDb.tasks,
      targetDb.milestones,
      targetDb.semesters,
      targetDb.subjects,
      targetDb.assignments,
      targetDb.calendarEvents,
      targetDb.goals,
      targetDb.goalTaskLinks,
      targetDb.focusSelections,
      targetDb.assetBlobs,
      targetDb.syncMutations,
      targetDb.hydrationLogs,
      targetDb.dietLogs,
      targetDb.workoutLogs,
      targetDb.bodyMetrics,
      targetDb.financialProfiles,
      targetDb.financialCommitments,
      targetDb.debts,
      targetDb.debtPayments,
      targetDb.wishlistItems,
      targetDb.savingsGoals,
      targetDb.savingsDeposits,
      targetDb.visionItems,
      targetDb.monthlyRoadmaps,
      targetDb.incomeItems,
      targetDb.ibadahDailyLogs,
      targetDb.qadhaPrayers,
      targetDb.qadhaFastings,
    ], async () => {
      await Promise.all([
        targetDb.settings.clear(),
        targetDb.projects.clear(),
        targetDb.tasks.clear(),
        targetDb.milestones.clear(),
        targetDb.semesters.clear(),
        targetDb.subjects.clear(),
        targetDb.assignments.clear(),
        targetDb.calendarEvents.clear(),
        targetDb.goals.clear(),
        targetDb.goalTaskLinks.clear(),
        targetDb.focusSelections.clear(),
        targetDb.assetBlobs.clear(),
        targetDb.syncMutations.clear(),
        targetDb.hydrationLogs.clear(),
        targetDb.dietLogs.clear(),
        targetDb.workoutLogs.clear(),
        targetDb.bodyMetrics.clear(),
        targetDb.financialProfiles.clear(),
        targetDb.financialCommitments.clear(),
        targetDb.debts.clear(),
        targetDb.debtPayments.clear(),
        targetDb.wishlistItems.clear(),
        targetDb.savingsGoals.clear(),
        targetDb.savingsDeposits.clear(),
        targetDb.visionItems.clear(),
        targetDb.monthlyRoadmaps.clear(),
        targetDb.incomeItems.clear(),
        targetDb.ibadahDailyLogs.clear(),
        targetDb.qadhaPrayers.clear(),
        targetDb.qadhaFastings.clear(),
      ]);
    });
    try {
      const { syncDb } = await import('@/sync/syncDb');
      await syncDb.syncMutations.clear();
    } catch {
      // Legacy sync DB optional cleanup
    }
    await ensureSettings(targetDb);
    await targetDb.syncMutations.clear();
  } finally {
    if (typeof syncEngineRef?.setIngestingRemote === 'function') {
      syncEngineRef.setIngestingRemote(false);
    }
  }
}
