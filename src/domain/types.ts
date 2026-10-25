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
  isWatchlist?: boolean;
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
  | 'assetBlob'
  | 'hydrationLog'
  | 'dietLog'
  | 'workoutLog'
  | 'bodyMetric'
  | 'financialProfile'
  | 'financialCommitment'
  | 'debtItem'
  | 'debtPayment'
  | 'wishlistItem'
  | 'savingsGoal'
  | 'savingsDeposit'
  | 'visionItem'
  | 'monthlyRoadmap'
  | 'incomeItem'
  | 'ibadahDailyLog'
  | 'qadhaPrayer'
  | 'qadhaFasting';

// ============================================================================
// HEALTH & WELLNESS DOMAIN TYPES
// ============================================================================

export interface HydrationLog {
  id: string; // 'hyd_...'
  date: string; // YYYY-MM-DD
  amountMl: number; // e.g. 250, 500, 1000
  loggedAt: string; // ISO string
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface DietLog {
  id: string; // 'diet_...'
  date: string; // YYYY-MM-DD
  mealType: MealType;
  foodName: string;
  calories: number;
  proteinG?: number;
  carbsG?: number;
  fatG?: number;
  loggedAt: string; // ISO string
}

export type ActivityType = 'running' | 'jogging' | 'cycling' | 'strength' | 'hiit' | 'custom';

export interface WorkoutSet {
  setNumber: number;
  reps: number;
  weightKg?: number;
  completed: boolean;
}

export interface WorkoutExercise {
  id: string;
  name: string;
  sets: WorkoutSet[];
}

export interface WorkoutLog {
  id: string; // 'wkt_...'
  date: string; // YYYY-MM-DD
  type: ActivityType;
  title: string;
  durationMinutes: number;
  distanceKm?: number;
  caloriesBurned?: number;
  exercises?: WorkoutExercise[];
  notes?: string;
  completedAt: string; // ISO string
}

export interface BodyMetric {
  id: string; // 'bm_...'
  date: string; // YYYY-MM-DD
  weightKg: number;
  bodyFatPercent?: number;
  loggedAt: string; // ISO string
}

// ============================================================================
// FINANCE & WEALTH DOMAIN TYPES
// ============================================================================

export interface FinancialProfile {
  id: string; // 'default'
  monthlyIncomeGross?: number;
  monthlyIncomeNet: number;
  paydayDayOfMonth?: number; // 1 - 31
  currency: string; // default 'MYR'
  updatedAt: string;
}

export type FinancialCommitmentCategory = 'needs' | 'utilities' | 'lifestyle' | 'protection' | 'other';

export interface FinancialCommitment {
  id: string; // 'com_...'
  title: string;
  amount: number;
  category: FinancialCommitmentCategory;
  dueDayOfMonth: number; // 1 - 31
  isPaidThisMonth: boolean;
  lastPaidMonthYear?: string; // 'YYYY-MM'
  notes?: string;
  autoRenew: boolean;
  createdAt: string;
  updatedAt: string;
}

export type DebtPriority = 'snowball' | 'avalanche' | 'normal';
export type DebtType = 'installment' | 'lumpsum_flexible';

export interface DebtItem {
  id: string; // 'debt_...'
  title: string;
  creditor: string;
  debtType?: DebtType;
  originalPrincipal: number;
  currentBalance: number;
  monthlyInstallment: number;
  interestRatePercent?: number;
  targetPayoffDate?: string; // YYYY-MM-DD
  priority: DebtPriority;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DebtPayment {
  id: string; // 'dp_...'
  debtId: string;
  amount: number;
  paidAt: string; // ISO string
  note?: string;
}

export type WishlistPriority = 'high' | 'medium' | 'low';

export interface WishlistItem {
  id: string; // 'wsh_...'
  title: string;
  estimatedPrice: number;
  priority: WishlistPriority;
  storeUrl?: string;
  isBought: boolean;
  boughtAt?: string;
  coolingOffDays: number; // default 7
  addedAt: string; // ISO string
  targetSavingsGoalId?: string;
  notes?: string;
}

export type SavingsGoalCategory = 'travel' | 'gadget' | 'emergency' | 'vehicle' | 'other';

export interface SavingsGoal {
  id: string; // 'svg_...'
  title: string;
  targetAmount: number;
  currentAmount: number;
  category: SavingsGoalCategory;
  targetDate?: string; // YYYY-MM-DD
  color: string;
  icon?: string;
  createdAt: string;
  updatedAt: string;
}

export type SavingsDepositType = 'deposit' | 'withdrawal';

export interface SavingsDeposit {
  id: string; // 'dep_...'
  savingsGoalId: string;
  amount: number;
  type: SavingsDepositType;
  loggedAt: string; // ISO string
  note?: string;
}

// ============================================================================
// VISION BOARD DOMAIN TYPES
// ============================================================================

export type VisionHorizon = 'short_term' | 'mid_term' | 'long_term' | 'north_star';

export type VisionCategory =
  | 'wealth_finance'
  | 'career_tech'
  | 'travel_adventure'
  | 'health_lifestyle'
  | 'personal_spiritual'
  | 'other';

export type VisionStatus = 'dreaming' | 'in_progress' | 'manifested';

export interface VisionItem {
  id: string;
  title: string;
  description?: string;
  imageUrl: string;
  imageThumbnailUrl?: string;
  horizon: VisionHorizon;
  category: VisionCategory;
  targetDate?: string;
  estimatedCost?: number;
  linkedGoalId?: string;
  linkedSavingsGoalId?: string;
  whyItMatters?: string;
  status: VisionStatus;
  manifestedAt?: string;
  order: number;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
}

// ============================================================================
// MONTHLY JOURNEY ROADMAP DOMAIN TYPES
// ============================================================================

export type RoadmapMascot =
  | 'rocket'
  | 'coder'
  | 'scholar'
  | 'wealth'
  | 'archer'
  | 'zen'
  | 'sprinter'
  | 'champion';

export type RoadmapStatus = 'upcoming' | 'in_progress' | 'completed';

export interface MonthlyRoadmapItem {
  id: string; // e.g. "rm_2026_01"
  year: number; // e.g. 2026
  month: number; // 1 to 12
  theme: string; // e.g. "Habit Reboot & Reset"
  primaryGoal: string; // e.g. "Ship Nemo v1 and achieve 30-day streak"
  strategy: string; // e.g. "Daily 90m deep focus, zero phone before 9am"
  mascot: RoadmapMascot;
  status: RoadmapStatus;
  completedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// FINANCE INCOME STREAM TYPES
// ============================================================================

export type IncomeStreamType =
  | 'monthly_salary'
  | 'freelance_project'
  | 'business_sales'
  | 'passive_other';

export interface IncomeItem {
  id: string; // e.g. "inc_..."
  title: string; // e.g. "Gaji Hakiki", "Projek Freelance Web"
  amount: number;
  type: IncomeStreamType;
  dateReceived?: string; // YYYY-MM-DD
  isRecurring: boolean; // true if recurring monthly salary, false for one-off
  sourceNotes?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// IBADAH & SPIRITUAL HUB DOMAIN TYPES
// ============================================================================

export type PrayerTimeName = 'subuh' | 'zohor' | 'asar' | 'maghrib' | 'isyak';
export type PrayerStatus = 'on_time' | 'congregation' | 'alone' | 'qadha' | 'missed' | 'excused';

export interface DailyPrayerRecord {
  status: PrayerStatus;
  completed?: boolean;
  isCongregation?: boolean;
  timestamp?: string;
}

export interface DailySunnahPrayers {
  dhuha?: boolean;
  tahajjud?: boolean;
  witir?: boolean;
  rawatib?: boolean;
}

export interface IbadahDailyLog {
  id: string; // 'ibd_YYYY-MM-DD'
  date: string; // 'YYYY-MM-DD'
  prayers: Record<PrayerTimeName, DailyPrayerRecord>;
  sunnahPrayers: DailySunnahPrayers;
  quranPagesRead: number;
  quranLastSurah?: string;
  quranLastAyah?: number;
  dhikrCount: number;
  sedekahDone: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface QadhaPrayerItem {
  id: string; // e.g. 'qp_subuh', 'qp_zohor'
  prayerType: PrayerTimeName;
  totalMissed: number;
  completedCount: number;
  remainingCount: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface QadhaFastingRecord {
  id: string; // e.g. 'qf_1444'
  yearHijri: number; // e.g. 1444
  yearGregorian: number; // e.g. 2023
  missedDays: number;
  qadhaCompletedDays: number;
  remainingDays: number;
  yearsDelayed: number; // Compounding multiplier
  fidyahRate: number; // RM per cupak (e.g. 4.00)
  totalFidyahAmount: number; // remainingDays * yearsDelayed * fidyahRate
  isFidyahPaid: boolean;
  fidyahPaidAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IslamicQuote {
  id: string;
  textArabic?: string;
  translation: string;
  source: string; // e.g. "Surah Al-Baqarah: 286", "Sahih Al-Bukhari"
  category: 'sabar' | 'syukur' | 'rezeki' | 'taubat' | 'istiqamah';
}

export interface SyncMutation {
  id: string;
  /** The account allowed to receive this mutation. Missing means quarantined legacy/local-only data. */
  ownerUserId?: string;
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
