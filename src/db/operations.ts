import type { NemoDatabase } from './nemoDb';
import type { TaskStatus } from '@/domain/types';
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
      theme: 'dark',
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
