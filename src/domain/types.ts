/**
 * Canonical domain entity definitions for Nemo.
 * Track it, finish it.
 */

export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export type ProjectStatus = 'not_started' | 'in_progress' | 'on_hold' | 'completed';

export type TaskStatus = 'todo' | 'in_progress' | 'done';

export type AssignmentStatus = 'not_started' | 'in_progress' | 'submitted' | 'graded';

export type GoalStatus = 'planned' | 'active' | 'paused' | 'achieved';

export type SemesterStatus = 'upcoming' | 'active' | 'completed';

export interface WorkspaceSettings {
  id: string; // Singleton ID: 'default'
  displayName: string;
  avatarBlobId?: string;
  theme: 'dark' | 'light' | 'aurora' | 'midnight' | 'daylight';
  accent: 'mint' | 'amber' | 'ember';
  weekStartsOn: 0 | 1; // 0: Sunday, 1: Monday
  hourFormat: '12h' | '24h';
  reduceMotion: boolean;
  onboardingCompleted: boolean;
  databaseVersion: number;
}

export interface Project {
  id: string;
  title: string;
  description?: string;
  category?: string;
  priority: Priority;
  status: ProjectStatus;
  archivedAt?: string;
  createdAt: string;
  startedAt?: string;
  dueDate?: string; // YYYY-MM-DD
  completedAt?: string; // ISO String
  clientLabel?: string;
  tags: string[];
  techStack: string[];
  liveUrl?: string;
  repoUrl?: string;
  notes?: string;
  previewBlobId?: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  title: string;
  notes?: string;
  status: TaskStatus;
  priority: Priority;
  dueDate?: string; // YYYY-MM-DD
  dueTime?: string; // HH:mm
  startDate?: string; // YYYY-MM-DD
  estimatedMinutes?: number;
  tags: string[];
  blockedReason?: string;
  parentType?: 'project' | 'assignment' | 'goal';
  parentId?: string;
  createdAt: string;
  completedAt?: string;
  updatedAt: string;
}

export interface Milestone {
  id: string;
  ownerType: 'project' | 'goal';
  ownerId: string;
  title: string;
  targetDate?: string; // YYYY-MM-DD
  completedAt?: string;
  order: number;
}

export interface Semester {
  id: string;
  title: string;
  startDate?: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
  status: SemesterStatus;
  createdAt: string;
}

export interface Subject {
  id: string;
  semesterId: string;
  code?: string;
  title: string;
  lecturer?: string;
  color: string;
  createdAt: string;
}

export interface Assignment {
  id: string;
  subjectId: string;
  title: string;
  description?: string;
  status: AssignmentStatus;
  dueDate?: string; // YYYY-MM-DD
  dueTime?: string; // HH:mm
  submissionUrl?: string;
  weightPercent?: number;
  scoreObtained?: number;
  scoreMaximum?: number;
  submittedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  location?: string;
  startAt: string; // ISO datetime or YYYY-MM-DD
  endAt: string;   // ISO datetime or YYYY-MM-DD
  isAllDay: boolean;
  subjectId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Goal {
  id: string;
  title: string;
  why?: string;
  category?: string;
  status: GoalStatus;
  targetDate?: string; // YYYY-MM-DD
  createdAt: string;
  achievedAt?: string;
  updatedAt: string;
}

export interface GoalTaskLink {
  id: string;
  goalId: string;
  taskId: string;
  createdAt: string;
}

export interface FocusSelection {
  id: string;
  taskId: string;
  effectiveLocalDate: string; // YYYY-MM-DD
  chosenAt: string;
}

export interface AssetBlob {
  id: string;
  ownerType: 'profile' | 'project';
  ownerId: string;
  mimeType: string;
  size: number;
  data: string; // Base64 data URL
  createdAt: string;
}

/**
 * Calendar Unified Projection item.
 * Computed dynamically without persisting duplicate records.
 */
export interface ProjectedCalendarItem {
  id: string;
  sourceType: 'task' | 'assignment' | 'milestone' | 'event';
  sourceId: string;
  title: string;
  date: string; // YYYY-MM-DD
  time?: string;
  isAllDay: boolean;
  status?: string;
  priority?: Priority;
  color?: string;
  meta?: Record<string, unknown>;
}


export type SyncStatus = 'local_only' | 'signed_in' | 'syncing' | 'up_to_date' | 'offline' | 'error';

export type SyncEntityType =
  | 'project'
  | 'task'
  | 'milestone'
  | 'semester'
  | 'subject'
  | 'assignment'
  | 'calendarEvent'
  | 'goal'
  | 'goalTaskLink'
  | 'focusSelection'
  | 'settings'
  | 'assetBlob';

export interface SyncMutation {
  id: string;
  entityType: SyncEntityType;
  entityId: string;
  operation: 'UPSERT' | 'DELETE';
  payload: Record<string, unknown>;
  clientTimestamp: string;
  status: 'pending' | 'in_flight' | 'failed' | 'applied';
  retryCount: number;
  lastError?: string;
  createdAt: string;
}

export interface SyncState {
  status: SyncStatus;
  lastSyncAt?: string;
  pendingCount: number;
  errorMessage?: string;
  ownerEmail?: string;
}
