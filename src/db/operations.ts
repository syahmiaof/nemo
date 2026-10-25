import type { NemoDatabase } from './nemoDb';
import type {
  TaskStatus,
  HydrationLog,
  DietLog,
  WorkoutLog,
  BodyMetric,
  FinancialProfile,
  FinancialCommitment,
  DebtItem,
  DebtPriority,
  DebtPayment,
  WishlistItem,
  WishlistPriority,
  SavingsGoal,
  SavingsGoalCategory,
  SavingsDeposit,
} from '@/domain/types';
import type { BackupData } from '@/domain/schemas';

export interface IntegrityAuditResult {
  valid: boolean;
  issues: string[];
  stats: Record<string, number>;
}

/**
 * Validates referential integrity of a backup payload in-memory BEFORE touching the database.
 */
export function validateReferentialIntegrity(data: BackupData['data']): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // 1. Check primary key uniqueness across tables
  const checkUniqueIds = (items: Array<{ id: string }>, tableName: string) => {
    const seen = new Set<string>();
    for (const item of items) {
      if (seen.has(item.id)) {
        errors.push(`Duplicate primary key "${item.id}" detected in ${tableName}.`);
      }
      seen.add(item.id);
    }
    return seen;
  };

  const projectIds = checkUniqueIds(data.projects, 'projects');
  const taskIds = checkUniqueIds(data.tasks, 'tasks');
  const semesterIds = checkUniqueIds(data.semesters, 'semesters');
  const subjectIds = checkUniqueIds(data.subjects, 'subjects');
  const assignmentIds = checkUniqueIds(data.assignments, 'assignments');
  const goalIds = checkUniqueIds(data.goals, 'goals');
  checkUniqueIds(data.milestones, 'milestones');
  checkUniqueIds(data.calendarEvents, 'calendarEvents');
  checkUniqueIds(data.goalTaskLinks, 'goalTaskLinks');
  checkUniqueIds(data.focusSelections, 'focusSelections');
  checkUniqueIds(data.assetBlobs, 'assetBlobs');
  if (data.hydrationLogs) checkUniqueIds(data.hydrationLogs, 'hydrationLogs');
  if (data.dietLogs) checkUniqueIds(data.dietLogs, 'dietLogs');
  if (data.workoutLogs) checkUniqueIds(data.workoutLogs, 'workoutLogs');
  if (data.bodyMetrics) checkUniqueIds(data.bodyMetrics, 'bodyMetrics');
  if (data.financialProfiles) checkUniqueIds(data.financialProfiles, 'financialProfiles');
  if (data.financialCommitments) checkUniqueIds(data.financialCommitments, 'financialCommitments');
  const debtIds = data.debts ? checkUniqueIds(data.debts, 'debts') : new Set<string>();
  if (data.debtPayments) checkUniqueIds(data.debtPayments, 'debtPayments');
  if (data.wishlistItems) checkUniqueIds(data.wishlistItems, 'wishlistItems');
  const savingsGoalIds = data.savingsGoals ? checkUniqueIds(data.savingsGoals, 'savingsGoals') : new Set<string>();
  if (data.savingsDeposits) checkUniqueIds(data.savingsDeposits, 'savingsDeposits');

  // 2. Validate foreign key references
  for (const task of data.tasks) {
    if (task.parentId) {
      if (task.parentType === 'project' && !projectIds.has(task.parentId)) {
        errors.push(`Task "${task.id}" references non-existent project parent "${task.parentId}".`);
      } else if (task.parentType === 'assignment' && !assignmentIds.has(task.parentId)) {
        errors.push(`Task "${task.id}" references non-existent assignment parent "${task.parentId}".`);
      } else if (task.parentType === 'goal' && !goalIds.has(task.parentId)) {
        errors.push(`Task "${task.id}" references non-existent goal parent "${task.parentId}".`);
      }
    }
  }

  for (const milestone of data.milestones) {
    if (milestone.ownerType === 'project' && !projectIds.has(milestone.ownerId)) {
      errors.push(`Milestone "${milestone.id}" references non-existent project owner "${milestone.ownerId}".`);
    } else if (milestone.ownerType === 'goal' && !goalIds.has(milestone.ownerId)) {
      errors.push(`Milestone "${milestone.id}" references non-existent goal owner "${milestone.ownerId}".`);
    }
  }

  for (const subject of data.subjects) {
    if (!semesterIds.has(subject.semesterId)) {
      errors.push(`Subject "${subject.id}" references non-existent semester "${subject.semesterId}".`);
    }
  }

  for (const assignment of data.assignments) {
    if (!subjectIds.has(assignment.subjectId)) {
      errors.push(`Assignment "${assignment.id}" references non-existent subject "${assignment.subjectId}".`);
    }
  }

  for (const event of data.calendarEvents) {
    if (event.subjectId && !subjectIds.has(event.subjectId)) {
      errors.push(`CalendarEvent "${event.id}" references non-existent subject "${event.subjectId}".`);
    }
  }

  for (const link of data.goalTaskLinks) {
    if (!goalIds.has(link.goalId)) {
      errors.push(`GoalTaskLink "${link.id}" references non-existent goal "${link.goalId}".`);
    }
    if (!taskIds.has(link.taskId)) {
      errors.push(`GoalTaskLink "${link.id}" references non-existent task "${link.taskId}".`);
    }
  }

  for (const focus of data.focusSelections) {
    if (!taskIds.has(focus.taskId)) {
      errors.push(`FocusSelection "${focus.id}" references non-existent task "${focus.taskId}".`);
    }
  }

  if (data.debtPayments) {
    for (const dp of data.debtPayments) {
      if (!debtIds.has(dp.debtId)) {
        errors.push(`DebtPayment "${dp.id}" references non-existent debt "${dp.debtId}".`);
      }
    }
  }

  if (data.savingsDeposits) {
    for (const sd of data.savingsDeposits) {
      if (!savingsGoalIds.has(sd.savingsGoalId)) {
        errors.push(`SavingsDeposit "${sd.id}" references non-existent savingsGoal "${sd.savingsGoalId}".`);
      }
    }
  }

  if (data.wishlistItems) {
    for (const wi of data.wishlistItems) {
      if (wi.targetSavingsGoalId && !savingsGoalIds.has(wi.targetSavingsGoalId)) {
        errors.push(`WishlistItem "${wi.id}" references non-existent targetSavingsGoal "${wi.targetSavingsGoalId}".`);
      }
    }
  }

  if (data.visionItems) {
    checkUniqueIds(data.visionItems, 'visionItems');
    for (const vi of data.visionItems) {
      if (vi.linkedGoalId && !goalIds.has(vi.linkedGoalId)) {
        errors.push(`VisionItem "${vi.id}" references non-existent goal "${vi.linkedGoalId}".`);
      }
      if (vi.linkedSavingsGoalId && !savingsGoalIds.has(vi.linkedSavingsGoalId)) {
        errors.push(`VisionItem "${vi.id}" references non-existent savingsGoal "${vi.linkedSavingsGoalId}".`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Performs a comprehensive audit of the live Dexie database instance.
 */
export async function auditDatabaseIntegrity(database: NemoDatabase): Promise<IntegrityAuditResult> {
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
  ] = await Promise.all([
    database.settings.get('default'),
    database.projects.toArray(),
    database.tasks.toArray(),
    database.milestones.toArray(),
    database.semesters.toArray(),
    database.subjects.toArray(),
    database.assignments.toArray(),
    database.calendarEvents.toArray(),
    database.goals.toArray(),
    database.goalTaskLinks.toArray(),
    database.focusSelections.toArray(),
    database.assetBlobs.toArray(),
    database.hydrationLogs.toArray(),
    database.dietLogs.toArray(),
    database.workoutLogs.toArray(),
    database.bodyMetrics.toArray(),
    database.financialProfiles.toArray(),
    database.financialCommitments.toArray(),
    database.debts.toArray(),
    database.debtPayments.toArray(),
    database.wishlistItems.toArray(),
    database.savingsGoals.toArray(),
    database.savingsDeposits.toArray(),
    database.visionItems.toArray(),
  ]);

  const stats: Record<string, number> = {
    settings: settings ? 1 : 0,
    projects: projects.length,
    tasks: tasks.length,
    milestones: milestones.length,
    semesters: semesters.length,
    subjects: subjects.length,
    assignments: assignments.length,
    calendarEvents: calendarEvents.length,
    goals: goals.length,
    goalTaskLinks: goalTaskLinks.length,
    focusSelections: focusSelections.length,
    assetBlobs: assetBlobs.length,
    hydrationLogs: hydrationLogs.length,
    dietLogs: dietLogs.length,
    workoutLogs: workoutLogs.length,
    bodyMetrics: bodyMetrics.length,
    financialProfiles: financialProfiles.length,
    financialCommitments: financialCommitments.length,
    debts: debts.length,
    debtPayments: debtPayments.length,
    wishlistItems: wishlistItems.length,
    savingsGoals: savingsGoals.length,
    savingsDeposits: savingsDeposits.length,
    visionItems: visionItems.length,
  };

  const issues: string[] = [];

  if (!settings) {
    issues.push('Missing workspace settings (default row).');
  }

  // Referential check using in-memory validator
  const refCheck = validateReferentialIntegrity({
    settings: settings || {
      id: 'default',
      displayName: 'My Workspace',
      theme: 'aurora',
      accent: 'mint',
      weekStartsOn: 1,
      hourFormat: '24h',
      reduceMotion: false,
      onboardingCompleted: true,
      databaseVersion: 1,
    },
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
  });

  issues.push(...refCheck.errors);

  // Invariant checks: Task completion timestamps
  for (const t of tasks) {
    if (t.status === 'done' && !t.completedAt) {
      issues.push(`Task "${t.id}" is marked done but has no completedAt timestamp.`);
    } else if (t.status !== 'done' && t.completedAt) {
      issues.push(`Task "${t.id}" is marked ${t.status} but retains a completedAt timestamp.`);
    }
  }

  // Invariant checks: Project completion timestamps
  for (const p of projects) {
    if (p.status === 'completed' && !p.completedAt) {
      issues.push(`Project "${p.id}" is completed but has no completedAt timestamp.`);
    } else if (p.status !== 'completed' && p.completedAt) {
      issues.push(`Project "${p.id}" is ${p.status} but retains a completedAt timestamp.`);
    }
  }

  return {
    valid: issues.length === 0,
    issues,
    stats,
  };
}

/**
 * Atomically deletes a project, cleans up associated cover asset blobs and milestones,
 * and safely unlinks associated tasks without data loss.
 */
export async function atomicDeleteProject(database: NemoDatabase, projectId: string): Promise<void> {
  const project = await database.projects.get(projectId);
  const now = new Date().toISOString();

  await database.transaction('rw', [
    database.projects,
    database.tasks,
    database.milestones,
    database.assetBlobs,
    database.syncMutations,
  ], async () => {
    // 1. Delete project record
    await database.projects.delete(projectId);

    // 2. Delete cover blob assets belonging to this project
    await database.assetBlobs.where('ownerId').equals(projectId).delete();
    if (project?.previewBlobId) {
      await database.assetBlobs.delete(project.previewBlobId);
    }

    // 3. Delete project milestones
    await database.milestones.where('ownerId').equals(projectId).delete();

    // 4. Safely unlink tasks to standalone without deleting them
    const linkedTasks = await database.tasks.where('parentId').equals(projectId).toArray();
    for (const t of linkedTasks) {
      await database.tasks.update(t.id, {
        parentType: undefined,
        parentId: undefined,
        updatedAt: now,
      });
    }
  });
}

/**
 * Atomically deletes a task and removes any focus selections or goal links referencing it.
 */
export async function atomicDeleteTask(database: NemoDatabase, taskId: string): Promise<void> {
  await database.transaction('rw', [
    database.tasks,
    database.focusSelections,
    database.goalTaskLinks,
    database.syncMutations,
  ], async () => {
    await database.tasks.delete(taskId);
    await database.focusSelections.where('taskId').equals(taskId).delete();
    await database.goalTaskLinks.where('taskId').equals(taskId).delete();
  });
}

/**
 * Atomically updates a task's status, managing the completedAt timestamp
 * and evicting the task from Today's Focus if it is marked done.
 */
export async function atomicSetTaskStatus(
  database: NemoDatabase,
  taskId: string,
  nextStatus: TaskStatus
): Promise<void> {
  const now = new Date().toISOString();
  const isDone = nextStatus === 'done';

  await database.transaction('rw', [
    database.tasks,
    database.focusSelections,
    database.syncMutations,
  ], async () => {
    await database.tasks.update(taskId, {
      status: nextStatus,
      completedAt: isDone ? now : undefined,
      updatedAt: now,
    });

    if (isDone) {
      await database.focusSelections.where('taskId').equals(taskId).delete();
    }
  });
}

/**
 * Atomically deletes an assignment and all its child tasks, removing any
 * child focus selections or goal links.
 */
export async function atomicDeleteAssignment(database: NemoDatabase, assignmentId: string): Promise<void> {
  await database.transaction('rw', [
    database.assignments,
    database.tasks,
    database.focusSelections,
    database.goalTaskLinks,
    database.syncMutations,
  ], async () => {
    const childTasks = await database.tasks.where('parentId').equals(assignmentId).toArray();
    for (const t of childTasks) {
      await database.focusSelections.where('taskId').equals(t.id).delete();
      await database.goalTaskLinks.where('taskId').equals(t.id).delete();
      await database.tasks.delete(t.id);
    }
    await database.assignments.delete(assignmentId);
  });
}

/**
 * Atomically deletes a subject, its assignments, their child tasks, and linked calendar events.
 */
export async function atomicDeleteSubject(database: NemoDatabase, subjectId: string): Promise<void> {
  await database.transaction('rw', [
    database.subjects,
    database.assignments,
    database.tasks,
    database.focusSelections,
    database.goalTaskLinks,
    database.calendarEvents,
    database.syncMutations,
  ], async () => {
    const assignments = await database.assignments.where('subjectId').equals(subjectId).toArray();
    for (const a of assignments) {
      const childTasks = await database.tasks.where('parentId').equals(a.id).toArray();
      for (const t of childTasks) {
        await database.focusSelections.where('taskId').equals(t.id).delete();
        await database.goalTaskLinks.where('taskId').equals(t.id).delete();
        await database.tasks.delete(t.id);
      }
      await database.assignments.delete(a.id);
    }
    await database.calendarEvents.where('subjectId').equals(subjectId).delete();
    await database.subjects.delete(subjectId);
  });
}

/**
 * Atomically deletes a semester and the entire hierarchy underneath it.
 */
export async function atomicDeleteSemester(database: NemoDatabase, semesterId: string): Promise<void> {
  await database.transaction('rw', [
    database.semesters,
    database.subjects,
    database.assignments,
    database.tasks,
    database.focusSelections,
    database.goalTaskLinks,
    database.calendarEvents,
    database.syncMutations,
  ], async () => {
    const subjects = await database.subjects.where('semesterId').equals(semesterId).toArray();
    for (const s of subjects) {
      const assignments = await database.assignments.where('subjectId').equals(s.id).toArray();
      for (const a of assignments) {
        const childTasks = await database.tasks.where('parentId').equals(a.id).toArray();
        for (const t of childTasks) {
          await database.focusSelections.where('taskId').equals(t.id).delete();
          await database.goalTaskLinks.where('taskId').equals(t.id).delete();
          await database.tasks.delete(t.id);
        }
        await database.assignments.delete(a.id);
      }
      await database.calendarEvents.where('subjectId').equals(s.id).delete();
      await database.subjects.delete(s.id);
    }
    await database.semesters.delete(semesterId);
  });
}

/**
 * Atomically deletes a goal, its milestones, and associated goal task links.
 * Linked tasks are preserved intact.
 */
export async function atomicDeleteGoal(database: NemoDatabase, goalId: string): Promise<void> {
  await database.transaction('rw', [
    database.goals,
    database.milestones,
    database.goalTaskLinks,
    database.syncMutations,
  ], async () => {
    await database.goals.delete(goalId);
    await database.milestones.where('ownerId').equals(goalId).delete();
    await database.goalTaskLinks.where('goalId').equals(goalId).delete();
  });
}

/**
 * Scans and purges unreferenced project asset blobs to prevent storage bloat.
 */
export async function cleanupOrphanAssetBlobs(database: NemoDatabase): Promise<number> {
  return await database.transaction('rw', [database.assetBlobs, database.projects, database.syncMutations], async () => {
    const allBlobs = await database.assetBlobs.toArray();
    const projects = await database.projects.toArray();
    const validBlobIds = new Set(projects.map((p) => p.previewBlobId).filter(Boolean));
    const validProjectIds = new Set(projects.map((p) => p.id));

    let deletedCount = 0;
    for (const blob of allBlobs) {
      if (blob.ownerType === 'project') {
        const isReferenced = validBlobIds.has(blob.id) || validProjectIds.has(blob.ownerId);
        if (!isReferenced) {
          await database.assetBlobs.delete(blob.id);
          deletedCount++;
        }
      }
    }
    return deletedCount;
  });
}

/**
 * Atomically records a hydration intake log.
 */
export async function atomicAddHydration(
  database: NemoDatabase,
  entry: Omit<HydrationLog, 'id' | 'loggedAt'> & { id?: string; loggedAt?: string }
): Promise<HydrationLog> {
  const log: HydrationLog = {
    id: entry.id || `hyd_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    date: entry.date,
    amountMl: entry.amountMl,
    loggedAt: entry.loggedAt || new Date().toISOString(),
  };
  await database.hydrationLogs.put(log);
  return log;
}

export async function atomicDeleteHydration(database: NemoDatabase, id: string): Promise<void> {
  await database.hydrationLogs.delete(id);
}

/**
 * Atomically records a diet meal log.
 */
export async function atomicLogDiet(
  database: NemoDatabase,
  entry: Omit<DietLog, 'id' | 'loggedAt'> & { id?: string; loggedAt?: string }
): Promise<DietLog> {
  const log: DietLog = {
    id: entry.id || `diet_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    date: entry.date,
    mealType: entry.mealType,
    foodName: entry.foodName,
    calories: entry.calories,
    proteinG: entry.proteinG,
    carbsG: entry.carbsG,
    fatG: entry.fatG,
    loggedAt: entry.loggedAt || new Date().toISOString(),
  };
  await database.dietLogs.put(log);
  return log;
}

export async function atomicDeleteDiet(database: NemoDatabase, id: string): Promise<void> {
  await database.dietLogs.delete(id);
}

/**
 * Atomically records a workout log (cardio, jogging, gym/strength, etc.).
 */
export async function atomicLogWorkout(
  database: NemoDatabase,
  entry: Omit<WorkoutLog, 'id' | 'completedAt'> & { id?: string; completedAt?: string }
): Promise<WorkoutLog> {
  const log: WorkoutLog = {
    id: entry.id || `wkt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    date: entry.date,
    type: entry.type,
    title: entry.title,
    durationMinutes: entry.durationMinutes,
    distanceKm: entry.distanceKm,
    caloriesBurned: entry.caloriesBurned,
    exercises: entry.exercises,
    notes: entry.notes,
    completedAt: entry.completedAt || new Date().toISOString(),
  };
  await database.workoutLogs.put(log);
  return log;
}

export async function atomicDeleteWorkout(database: NemoDatabase, id: string): Promise<void> {
  await database.workoutLogs.delete(id);
}

/**
 * Atomically records a body metric log (weight, body fat).
 */
export async function atomicLogBodyMetric(
  database: NemoDatabase,
  entry: Omit<BodyMetric, 'id' | 'loggedAt'> & { id?: string; loggedAt?: string }
): Promise<BodyMetric> {
  const log: BodyMetric = {
    id: entry.id || `bm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    date: entry.date,
    weightKg: entry.weightKg,
    bodyFatPercent: entry.bodyFatPercent,
    loggedAt: entry.loggedAt || new Date().toISOString(),
  };
  await database.bodyMetrics.put(log);
  return log;
}

export async function atomicDeleteBodyMetric(database: NemoDatabase, id: string): Promise<void> {
  await database.bodyMetrics.delete(id);
}

// ============================================================================
// FINANCE & WEALTH ATOMIC OPERATIONS
// ============================================================================

/**
 * Updates or initializes the user's financial profile.
 */
export async function atomicUpdateFinancialProfile(
  database: NemoDatabase,
  profile: Partial<FinancialProfile> & { monthlyIncomeNet: number }
): Promise<FinancialProfile> {
  const existing = await database.financialProfiles.get('default');
  const now = new Date().toISOString();
  const updated: FinancialProfile = {
    id: 'default',
    monthlyIncomeGross: profile.monthlyIncomeGross ?? existing?.monthlyIncomeGross,
    monthlyIncomeNet: profile.monthlyIncomeNet,
    paydayDayOfMonth: profile.paydayDayOfMonth ?? existing?.paydayDayOfMonth ?? 25,
    currency: profile.currency ?? existing?.currency ?? 'MYR',
    updatedAt: now,
  };
  await database.financialProfiles.put(updated);
  return updated;
}

/**
 * Adds or updates a recurring financial commitment.
 */
export async function atomicAddCommitment(
  database: NemoDatabase,
  entry: Omit<FinancialCommitment, 'id' | 'createdAt' | 'updatedAt' | 'isPaidThisMonth' | 'autoRenew'> & {
    id?: string;
    isPaidThisMonth?: boolean;
    autoRenew?: boolean;
    createdAt?: string;
    updatedAt?: string;
  }
): Promise<FinancialCommitment> {
  const now = new Date().toISOString();
  const commitment: FinancialCommitment = {
    id: entry.id || `com_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    title: entry.title.trim(),
    amount: entry.amount,
    category: entry.category,
    dueDayOfMonth: entry.dueDayOfMonth,
    isPaidThisMonth: entry.isPaidThisMonth ?? false,
    lastPaidMonthYear: entry.lastPaidMonthYear,
    notes: entry.notes?.trim() || undefined,
    autoRenew: entry.autoRenew ?? true,
    createdAt: entry.createdAt || now,
    updatedAt: now,
  };
  await database.financialCommitments.put(commitment);
  return commitment;
}

/**
 * Toggles a commitment payment status for the given month/year cycle.
 */
export async function atomicToggleCommitmentPaid(
  database: NemoDatabase,
  id: string,
  isPaid: boolean,
  monthYear?: string
): Promise<void> {
  const now = new Date().toISOString();
  const currentMonth = monthYear || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  await database.financialCommitments.update(id, {
    isPaidThisMonth: isPaid,
    lastPaidMonthYear: isPaid ? currentMonth : undefined,
    updatedAt: now,
  });
}

export async function atomicDeleteCommitment(database: NemoDatabase, id: string): Promise<void> {
  await database.financialCommitments.delete(id);
}

/**
 * Adds or updates a debt liability item.
 */
export async function atomicAddDebt(
  database: NemoDatabase,
  entry: Omit<DebtItem, 'id' | 'createdAt' | 'updatedAt' | 'priority'> & {
    id?: string;
    priority?: DebtPriority;
    createdAt?: string;
    updatedAt?: string;
  }
): Promise<DebtItem> {
  const now = new Date().toISOString();
  const debt: DebtItem = {
    id: entry.id || `debt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    title: entry.title.trim(),
    creditor: entry.creditor.trim(),
    originalPrincipal: entry.originalPrincipal,
    currentBalance: entry.currentBalance,
    monthlyInstallment: entry.monthlyInstallment,
    interestRatePercent: entry.interestRatePercent,
    targetPayoffDate: entry.targetPayoffDate,
    priority: entry.priority || 'snowball',
    notes: entry.notes?.trim() || undefined,
    createdAt: entry.createdAt || now,
    updatedAt: now,
  };
  await database.debts.put(debt);
  return debt;
}

/**
 * Records a debt payment and automatically decrements the remaining principal.
 */
export async function atomicRecordDebtPayment(
  database: NemoDatabase,
  entry: Omit<DebtPayment, 'id' | 'paidAt'> & { id?: string; paidAt?: string }
): Promise<DebtPayment> {
  return await database.transaction('rw', [database.debts, database.debtPayments], async () => {
    const debt = await database.debts.get(entry.debtId);
    if (!debt) {
      throw new Error(`Debt with ID "${entry.debtId}" does not exist.`);
    }

    const payment: DebtPayment = {
      id: entry.id || `dp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      debtId: entry.debtId,
      amount: entry.amount,
      paidAt: entry.paidAt || new Date().toISOString(),
      note: entry.note?.trim() || undefined,
    };

    await database.debtPayments.put(payment);

    // Atomically decrement remaining balance
    const updatedBalance = Math.max(0, debt.currentBalance - entry.amount);
    await database.debts.update(debt.id, {
      currentBalance: updatedBalance,
      updatedAt: new Date().toISOString(),
    });

    return payment;
  });
}

/**
 * Atomically deletes a debt and all its associated payment records.
 */
export async function atomicDeleteDebt(database: NemoDatabase, debtId: string): Promise<void> {
  await database.transaction('rw', [database.debts, database.debtPayments], async () => {
    await database.debts.delete(debtId);
    const payments = await database.debtPayments.where('debtId').equals(debtId).toArray();
    for (const p of payments) {
      await database.debtPayments.delete(p.id);
    }
  });
}

/**
 * Adds or updates a wishlist item.
 */
export async function atomicAddWishlistItem(
  database: NemoDatabase,
  entry: Omit<WishlistItem, 'id' | 'addedAt' | 'isBought' | 'coolingOffDays' | 'priority'> & {
    id?: string;
    priority?: WishlistPriority;
    isBought?: boolean;
    coolingOffDays?: number;
    addedAt?: string;
  }
): Promise<WishlistItem> {
  const item: WishlistItem = {
    id: entry.id || `wsh_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    title: entry.title.trim(),
    estimatedPrice: entry.estimatedPrice,
    priority: entry.priority || 'medium',
    storeUrl: entry.storeUrl?.trim() || undefined,
    isBought: entry.isBought ?? false,
    boughtAt: entry.boughtAt,
    coolingOffDays: entry.coolingOffDays ?? 7,
    addedAt: entry.addedAt || new Date().toISOString(),
    targetSavingsGoalId: entry.targetSavingsGoalId,
    notes: entry.notes?.trim() || undefined,
  };
  await database.wishlistItems.put(item);
  return item;
}

/**
 * Marks a wishlist item as purchased.
 */
export async function atomicToggleWishlistBought(
  database: NemoDatabase,
  id: string,
  isBought: boolean
): Promise<void> {
  await database.wishlistItems.update(id, {
    isBought,
    boughtAt: isBought ? new Date().toISOString() : undefined,
  });
}

/**
 * Converts a wishlist item into a target savings goal.
 */
export async function atomicConvertWishlistToSavings(
  database: NemoDatabase,
  wishlistId: string,
  goalOptions?: { color?: string; category?: SavingsGoal['category']; targetDate?: string }
): Promise<SavingsGoal> {
  return await database.transaction('rw', [database.wishlistItems, database.savingsGoals], async () => {
    const wish = await database.wishlistItems.get(wishlistId);
    if (!wish) {
      throw new Error(`Wishlist item "${wishlistId}" not found.`);
    }

    const now = new Date().toISOString();
    const goal: SavingsGoal = {
      id: `svg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title: wish.title,
      targetAmount: wish.estimatedPrice,
      currentAmount: 0,
      category: goalOptions?.category || 'gadget',
      targetDate: goalOptions?.targetDate,
      color: goalOptions?.color || '#34D399',
      createdAt: now,
      updatedAt: now,
    };

    await database.savingsGoals.put(goal);
    await database.wishlistItems.update(wishlistId, {
      targetSavingsGoalId: goal.id,
    });

    return goal;
  });
}

export async function atomicDeleteWishlistItem(database: NemoDatabase, id: string): Promise<void> {
  await database.wishlistItems.delete(id);
}

/**
 * Adds or updates a target savings goal (sinking fund).
 */
export async function atomicAddSavingsGoal(
  database: NemoDatabase,
  entry: Omit<SavingsGoal, 'id' | 'createdAt' | 'updatedAt' | 'category' | 'color' | 'currentAmount'> & {
    id?: string;
    category?: SavingsGoalCategory;
    color?: string;
    currentAmount?: number;
    createdAt?: string;
    updatedAt?: string;
  }
): Promise<SavingsGoal> {
  const now = new Date().toISOString();
  const goal: SavingsGoal = {
    id: entry.id || `svg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    title: entry.title.trim(),
    targetAmount: entry.targetAmount,
    currentAmount: entry.currentAmount ?? 0,
    category: entry.category || 'other',
    targetDate: entry.targetDate,
    color: entry.color || '#38BDF8',
    icon: entry.icon,
    createdAt: entry.createdAt || now,
    updatedAt: now,
  };
  await database.savingsGoals.put(goal);
  return goal;
}

/**
 * Records a deposit or withdrawal for a savings goal, updating current amount.
 */
export async function atomicRecordSavingsDeposit(
  database: NemoDatabase,
  entry: Omit<SavingsDeposit, 'id' | 'loggedAt'> & { id?: string; loggedAt?: string }
): Promise<SavingsDeposit> {
  return await database.transaction('rw', [database.savingsGoals, database.savingsDeposits], async () => {
    const goal = await database.savingsGoals.get(entry.savingsGoalId);
    if (!goal) {
      throw new Error(`Savings goal "${entry.savingsGoalId}" not found.`);
    }

    const deposit: SavingsDeposit = {
      id: entry.id || `dep_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      savingsGoalId: entry.savingsGoalId,
      amount: entry.amount,
      type: entry.type,
      loggedAt: entry.loggedAt || new Date().toISOString(),
      note: entry.note?.trim() || undefined,
    };

    await database.savingsDeposits.put(deposit);

    const newAmount = entry.type === 'deposit'
      ? goal.currentAmount + entry.amount
      : Math.max(0, goal.currentAmount - entry.amount);

    await database.savingsGoals.update(goal.id, {
      currentAmount: newAmount,
      updatedAt: new Date().toISOString(),
    });

    return deposit;
  });
}

/**
 * Atomically deletes a savings goal, its deposit logs, and unlinks related wishlist items.
 */
export async function atomicDeleteSavingsGoal(database: NemoDatabase, goalId: string): Promise<void> {
  await database.transaction('rw', [database.savingsGoals, database.savingsDeposits, database.wishlistItems], async () => {
    await database.savingsGoals.delete(goalId);
    const deposits = await database.savingsDeposits.where('savingsGoalId').equals(goalId).toArray();
    for (const d of deposits) {
      await database.savingsDeposits.delete(d.id);
    }
    const relatedWishes = await database.wishlistItems.where('targetSavingsGoalId').equals(goalId).toArray();
    for (const w of relatedWishes) {
      await database.wishlistItems.update(w.id, { targetSavingsGoalId: undefined });
    }
  });
}
