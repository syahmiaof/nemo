import type {
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
  WorkspaceSettings,
} from '@/domain/types';

export const mappers = {
  project: {
    toRemote(local: Project, userId: string) {
      return {
        id: local.id,
        user_id: userId,
        title: local.title,
        description: local.description || null,
        category: local.category || null,
        priority: local.priority,
        status: local.status,
        due_date: local.dueDate || null,
        started_at: local.startedAt || null,
        completed_at: local.completedAt || null,
        archived_at: local.archivedAt || null,
        client_label: local.clientLabel || null,
        tags: local.tags || [],
        tech_stack: local.techStack || [],
        live_url: local.liveUrl || null,
        repo_url: local.repoUrl || null,
        notes: local.notes || null,
        preview_blob_id: local.previewBlobId || null,
        created_at: local.createdAt,
        updated_at: local.updatedAt,
      };
    },
    toLocal(remote: any): Project {
      return {
        id: remote.id,
        title: remote.title,
        description: remote.description || undefined,
        category: remote.category || undefined,
        priority: remote.priority,
        status: remote.status,
        dueDate: remote.due_date || undefined,
        startedAt: remote.started_at || undefined,
        completedAt: remote.completed_at || undefined,
        archivedAt: remote.archived_at || undefined,
        clientLabel: remote.client_label || undefined,
        tags: remote.tags || [],
        techStack: remote.tech_stack || [],
        liveUrl: remote.live_url || undefined,
        repoUrl: remote.repo_url || undefined,
        notes: remote.notes || undefined,
        previewBlobId: remote.preview_blob_id || undefined,
        createdAt: remote.created_at,
        updatedAt: remote.updated_at,
      };
    },
  },

  task: {
    toRemote(local: Task, userId: string) {
      return {
        id: local.id,
        user_id: userId,
        title: local.title,
        notes: local.notes || null,
        status: local.status,
        priority: local.priority,
        due_date: local.dueDate || null,
        due_time: local.dueTime || null,
        start_date: local.startDate || null,
        estimated_minutes: local.estimatedMinutes || null,
        tags: local.tags || [],
        blocked_reason: local.blockedReason || null,
        parent_type: local.parentType || null,
        parent_id: local.parentId || null,
        completed_at: local.completedAt || null,
        created_at: local.createdAt,
        updated_at: local.updatedAt,
      };
    },
    toLocal(remote: any): Task {
      return {
        id: remote.id,
        title: remote.title,
        notes: remote.notes || undefined,
        status: remote.status,
        priority: remote.priority,
        dueDate: remote.due_date || undefined,
        dueTime: remote.due_time || undefined,
        startDate: remote.start_date || undefined,
        estimatedMinutes: remote.estimated_minutes ?? undefined,
        tags: remote.tags || [],
        blockedReason: remote.blocked_reason || undefined,
        parentType: remote.parent_type || undefined,
        parentId: remote.parent_id || undefined,
        completedAt: remote.completed_at || undefined,
        createdAt: remote.created_at,
        updatedAt: remote.updated_at,
      };
    },
  },

  milestone: {
    toRemote(local: Milestone, userId: string) {
      return {
        id: local.id,
        user_id: userId,
        owner_type: local.ownerType,
        owner_id: local.ownerId,
        title: local.title,
        target_date: local.targetDate || null,
        completed_at: local.completedAt || null,
        order_num: local.order || 0,
      };
    },
    toLocal(remote: any): Milestone {
      return {
        id: remote.id,
        ownerType: remote.owner_type,
        ownerId: remote.owner_id,
        title: remote.title,
        targetDate: remote.target_date || undefined,
        completedAt: remote.completed_at || undefined,
        order: remote.order_num ?? 0,
      };
    },
  },

  semester: {
    toRemote(local: Semester, userId: string) {
      return {
        id: local.id,
        user_id: userId,
        title: local.title,
        start_date: local.startDate || null,
        end_date: local.endDate || null,
        status: local.status,
        created_at: local.createdAt,
      };
    },
    toLocal(remote: any): Semester {
      return {
        id: remote.id,
        title: remote.title,
        startDate: remote.start_date || undefined,
        endDate: remote.end_date || undefined,
        status: remote.status,
        createdAt: remote.created_at,
      };
    },
  },

  subject: {
    toRemote(local: Subject, userId: string) {
      return {
        id: local.id,
        user_id: userId,
        semester_id: local.semesterId,
        code: local.code || null,
        title: local.title,
        lecturer: local.lecturer || null,
        color: local.color,
        created_at: local.createdAt,
      };
    },
    toLocal(remote: any): Subject {
      return {
        id: remote.id,
        semesterId: remote.semester_id,
        code: remote.code || undefined,
        title: remote.title,
        lecturer: remote.lecturer || undefined,
        color: remote.color,
        createdAt: remote.created_at,
      };
    },
  },

  assignment: {
    toRemote(local: Assignment, userId: string) {
      return {
        id: local.id,
        user_id: userId,
        subject_id: local.subjectId,
        title: local.title,
        description: local.description || null,
        status: local.status,
        due_date: local.dueDate || null,
        due_time: local.dueTime || null,
        submission_url: local.submissionUrl || null,
        weight_percent: local.weightPercent ?? null,
        score_obtained: local.scoreObtained ?? null,
        score_maximum: local.scoreMaximum ?? null,
        submitted_at: local.submittedAt || null,
        created_at: local.createdAt,
        updated_at: local.updatedAt,
      };
    },
    toLocal(remote: any): Assignment {
      return {
        id: remote.id,
        subjectId: remote.subject_id,
        title: remote.title,
        description: remote.description || undefined,
        status: remote.status,
        dueDate: remote.due_date || undefined,
        dueTime: remote.due_time || undefined,
        submissionUrl: remote.submission_url || undefined,
        weightPercent: remote.weight_percent !== null ? Number(remote.weight_percent) : undefined,
        scoreObtained: remote.score_obtained !== null ? Number(remote.score_obtained) : undefined,
        scoreMaximum: remote.score_maximum !== null ? Number(remote.score_maximum) : undefined,
        submittedAt: remote.submitted_at || undefined,
        createdAt: remote.created_at,
        updatedAt: remote.updated_at,
      };
    },
  },

  calendarEvent: {
    toRemote(local: CalendarEvent, userId: string) {
      return {
        id: local.id,
        user_id: userId,
        title: local.title,
        description: local.description || null,
        location: local.location || null,
        start_at: local.startAt,
        end_at: local.endAt,
        is_all_day: local.isAllDay,
        subject_id: local.subjectId || null,
        created_at: local.createdAt,
        updated_at: local.updatedAt,
      };
    },
    toLocal(remote: any): CalendarEvent {
      return {
        id: remote.id,
        title: remote.title,
        description: remote.description || undefined,
        location: remote.location || undefined,
        startAt: remote.start_at,
        endAt: remote.end_at,
        isAllDay: remote.is_all_day,
        subjectId: remote.subject_id || undefined,
        createdAt: remote.created_at,
        updatedAt: remote.updated_at,
      };
    },
  },

  goal: {
    toRemote(local: Goal, userId: string) {
      return {
        id: local.id,
        user_id: userId,
        title: local.title,
        why: local.why || null,
        category: local.category || null,
        status: local.status,
        target_date: local.targetDate || null,
        achieved_at: local.achievedAt || null,
        created_at: local.createdAt,
        updated_at: local.updatedAt,
      };
    },
    toLocal(remote: any): Goal {
      return {
        id: remote.id,
        title: remote.title,
        why: remote.why || undefined,
        category: remote.category || undefined,
        status: remote.status,
        targetDate: remote.target_date || undefined,
        achievedAt: remote.achieved_at || undefined,
        createdAt: remote.created_at,
        updatedAt: remote.updated_at,
      };
    },
  },

  goalTaskLink: {
    toRemote(local: GoalTaskLink, userId: string) {
      return {
        id: local.id,
        user_id: userId,
        goal_id: local.goalId,
        task_id: local.taskId,
        created_at: local.createdAt,
      };
    },
    toLocal(remote: any): GoalTaskLink {
      return {
        id: remote.id,
        goalId: remote.goal_id,
        taskId: remote.task_id,
        createdAt: remote.created_at,
      };
    },
  },

  focusSelection: {
    toRemote(local: FocusSelection, userId: string) {
      return {
        id: local.id,
        user_id: userId,
        task_id: local.taskId,
        effective_local_date: local.effectiveLocalDate,
        chosen_at: local.chosenAt,
      };
    },
    toLocal(remote: any): FocusSelection {
      return {
        id: remote.id,
        taskId: remote.task_id,
        effectiveLocalDate: remote.effective_local_date,
        chosenAt: remote.chosen_at,
      };
    },
  },

  settings: {
    toRemote(local: WorkspaceSettings, userId: string, userEmail?: string, avatarUrl?: string | null) {
      return {
        id: userId,
        email: userEmail || null,
        display_name: local.displayName,
        avatar_url: avatarUrl !== undefined ? avatarUrl : (local as any).avatarUrl || null,
        theme: local.theme,
        accent: local.accent,
        week_starts_on: local.weekStartsOn,
        hour_format: local.hourFormat,
        reduce_motion: local.reduceMotion,
        onboarding_completed: local.onboardingCompleted,
      };
    },
    toLocal(remote: any, localId = 'default'): WorkspaceSettings {
      return {
        id: localId,
        displayName: remote.display_name || 'My Workspace',
        theme: remote.theme || 'dark',
        accent: remote.accent || 'mint',
        weekStartsOn: remote.week_starts_on ?? 1,
        hourFormat: remote.hour_format || '24h',
        reduceMotion: remote.reduce_motion ?? false,
        onboardingCompleted: remote.onboarding_completed ?? true,
        databaseVersion: 2,
      };
    },
  },
};
