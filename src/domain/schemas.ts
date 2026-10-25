import { z } from 'zod';

export const PrioritySchema = z.enum(['low', 'medium', 'high', 'urgent']);
export const ProjectStatusSchema = z.enum(['not_started', 'in_progress', 'on_hold', 'completed']);
export const TaskStatusSchema = z.enum(['todo', 'in_progress', 'done']);
export const AssignmentStatusSchema = z.enum(['not_started', 'in_progress', 'submitted', 'graded']);
export const GoalStatusSchema = z.enum(['planned', 'active', 'paused', 'achieved']);
export const SemesterStatusSchema = z.enum(['upcoming', 'active', 'completed']);

export const WorkspaceSettingsSchema = z.object({
  id: z.string().default('default'),
  displayName: z.string().min(1, 'Display name cannot be empty').max(50),
  avatarBlobId: z.string().optional(),
  theme: z.enum(['dark', 'light', 'aurora', 'midnight', 'daylight']).default('dark'),
  accent: z.enum(['mint', 'amber', 'ember']).default('mint'),
  weekStartsOn: z.union([z.literal(0), z.literal(1)]).default(1),
  hourFormat: z.enum(['12h', '24h']).default('24h'),
  reduceMotion: z.boolean().default(false),
  onboardingCompleted: z.boolean().default(false),
  databaseVersion: z.number().default(1),
});

export const ProjectSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1, 'Project title is required').max(100),
  description: z.string().max(1000).optional(),
  category: z.string().max(50).optional(),
  priority: PrioritySchema.default('medium'),
  status: ProjectStatusSchema.default('not_started'),
  archivedAt: z.string().optional(),
  createdAt: z.string(),
  startedAt: z.string().optional(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD').optional(),
  completedAt: z.string().optional(),
  clientLabel: z.string().max(50).optional(),
  tags: z.array(z.string()).default([]),
  techStack: z.array(z.string()).default([]),
  liveUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  repoUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  notes: z.string().max(5000).optional(),
  previewBlobId: z.string().optional(),
  updatedAt: z.string(),
});

export const TaskSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1, 'Task title is required').max(200),
  notes: z.string().max(2000).optional(),
  status: TaskStatusSchema.default('todo'),
  priority: PrioritySchema.default('medium'),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD').optional(),
  dueTime: z.string().regex(/^\d{2}:\d{2}$/, 'Must be HH:mm').optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD').optional(),
  estimatedMinutes: z.number().int().nonnegative().optional(),
  tags: z.array(z.string()).default([]),
  blockedReason: z.string().max(500).optional(),
  parentType: z.enum(['project', 'assignment', 'goal']).optional(),
  parentId: z.string().optional(),
  isWatchlist: z.boolean().optional(),
  createdAt: z.string(),
  completedAt: z.string().optional(),
  updatedAt: z.string(),
});

export const MilestoneSchema = z.object({
  id: z.string().min(1),
  ownerType: z.enum(['project', 'goal']),
  ownerId: z.string().min(1),
  title: z.string().min(1, 'Milestone title is required').max(150),
  targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD').optional(),
  completedAt: z.string().optional(),
  order: z.number().int().default(0),
});

export const SemesterSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1, 'Semester title is required').max(100),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD').optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD').optional(),
  status: SemesterStatusSchema.default('active'),
  createdAt: z.string(),
});

export const SubjectSchema = z.object({
  id: z.string().min(1),
  semesterId: z.string().min(1),
  code: z.string().max(20).optional(),
  title: z.string().min(1, 'Subject title is required').max(100),
  lecturer: z.string().max(100).optional(),
  color: z.string().default('#A8DCC8'),
  createdAt: z.string(),
});

export const AssignmentSchema = z.object({
  id: z.string().min(1),
  subjectId: z.string().min(1),
  title: z.string().min(1, 'Assignment title is required').max(150),
  description: z.string().max(2000).optional(),
  status: AssignmentStatusSchema.default('not_started'),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD').optional(),
  dueTime: z.string().regex(/^\d{2}:\d{2}$/, 'Must be HH:mm').optional(),
  submissionUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  weightPercent: z.number().min(0).max(100).optional(),
  scoreObtained: z.number().min(0).optional(),
  scoreMaximum: z.number().min(0).optional(),
  submittedAt: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const CalendarEventSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1, 'Event title is required').max(150),
  description: z.string().max(2000).optional(),
  location: z.string().max(200).optional(),
  startAt: z.string().min(1),
  endAt: z.string().min(1),
  isAllDay: z.boolean().default(false),
  subjectId: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const GoalSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1, 'Goal title is required').max(150),
  why: z.string().max(1000).optional(),
  category: z.string().max(50).optional(),
  status: GoalStatusSchema.default('active'),
  targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD').optional(),
  createdAt: z.string(),
  achievedAt: z.string().optional(),
  updatedAt: z.string(),
});

export const GoalTaskLinkSchema = z.object({
  id: z.string().min(1),
  goalId: z.string().min(1),
  taskId: z.string().min(1),
  createdAt: z.string(),
});

export const FocusSelectionSchema = z.object({
  id: z.string().min(1),
  taskId: z.string().min(1),
  effectiveLocalDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
  chosenAt: z.string(),
});

export const AssetBlobSchema = z.object({
  id: z.string().min(1),
  ownerType: z.enum(['profile', 'project']),
  ownerId: z.string().min(1),
  mimeType: z.string().min(1),
  size: z.number().nonnegative(),
  data: z.string().min(1), // Base64 data url
  createdAt: z.string(),
});

export const HydrationLogSchema = z.object({
  id: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
  amountMl: z.number().positive(),
  loggedAt: z.string(),
});

export const DietLogSchema = z.object({
  id: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  foodName: z.string().min(1),
  calories: z.number().nonnegative(),
  proteinG: z.number().nonnegative().optional(),
  carbsG: z.number().nonnegative().optional(),
  fatG: z.number().nonnegative().optional(),
  loggedAt: z.string(),
});

export const WorkoutSetSchema = z.object({
  setNumber: z.number().int().positive(),
  reps: z.number().int().nonnegative(),
  weightKg: z.number().nonnegative().optional(),
  completed: z.boolean(),
});

export const WorkoutExerciseSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  sets: z.array(WorkoutSetSchema),
});

export const WorkoutLogSchema = z.object({
  id: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
  type: z.enum(['running', 'jogging', 'cycling', 'strength', 'hiit', 'custom']),
  title: z.string().min(1),
  durationMinutes: z.number().positive(),
  distanceKm: z.number().nonnegative().optional(),
  caloriesBurned: z.number().nonnegative().optional(),
  exercises: z.array(WorkoutExerciseSchema).optional(),
  notes: z.string().optional(),
  completedAt: z.string(),
});

export const BodyMetricSchema = z.object({
  id: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
  weightKg: z.number().positive(),
  bodyFatPercent: z.number().nonnegative().optional(),
  loggedAt: z.string(),
});

// ============================================================================
// FINANCE & WEALTH SCHEMAS
// ============================================================================

export const FinancialProfileSchema = z.object({
  id: z.string().min(1),
  monthlyIncomeGross: z.number().nonnegative().optional(),
  monthlyIncomeNet: z.number().nonnegative(),
  paydayDayOfMonth: z.number().min(1).max(31).optional(),
  currency: z.string().min(1).default('MYR'),
  updatedAt: z.string(),
});

export const FinancialCommitmentSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  amount: z.number().positive(),
  category: z.enum(['needs', 'utilities', 'lifestyle', 'protection', 'other']),
  dueDayOfMonth: z.number().min(1).max(31),
  isPaidThisMonth: z.boolean(),
  lastPaidMonthYear: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  notes: z.string().optional(),
  autoRenew: z.boolean().default(true),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const DebtItemSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  creditor: z.string().min(1),
  originalPrincipal: z.number().positive(),
  currentBalance: z.number().nonnegative(),
  monthlyInstallment: z.number().positive(),
  interestRatePercent: z.number().nonnegative().optional(),
  targetPayoffDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  priority: z.enum(['snowball', 'avalanche', 'normal']),
  notes: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const DebtPaymentSchema = z.object({
  id: z.string().min(1),
  debtId: z.string().min(1),
  amount: z.number().positive(),
  paidAt: z.string(),
  note: z.string().optional(),
});

export const WishlistItemSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  estimatedPrice: z.number().positive(),
  priority: z.enum(['high', 'medium', 'low']),
  storeUrl: z.string().optional(),
  isBought: z.boolean(),
  boughtAt: z.string().optional(),
  coolingOffDays: z.number().nonnegative().default(7),
  addedAt: z.string(),
  targetSavingsGoalId: z.string().optional(),
  notes: z.string().optional(),
});

export const SavingsGoalSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  targetAmount: z.number().positive(),
  currentAmount: z.number().nonnegative(),
  category: z.enum(['travel', 'gadget', 'emergency', 'vehicle', 'other']),
  targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  color: z.string().min(1),
  icon: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const SavingsDepositSchema = z.object({
  id: z.string().min(1),
  savingsGoalId: z.string().min(1),
  amount: z.number().positive(),
  type: z.enum(['deposit', 'withdrawal']),
  loggedAt: z.string(),
  note: z.string().optional(),
});

export const VisionHorizonSchema = z.enum(['short_term', 'mid_term', 'long_term', 'north_star']);

export const VisionCategorySchema = z.enum([
  'wealth_finance',
  'career_tech',
  'travel_adventure',
  'health_lifestyle',
  'personal_spiritual',
  'other',
]);

export const VisionStatusSchema = z.enum(['dreaming', 'in_progress', 'manifested']);

export const VisionItemSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(2000).optional(),
  imageUrl: z.string().min(1, 'Image URL is required'),
  imageThumbnailUrl: z.string().optional(),
  horizon: VisionHorizonSchema,
  category: VisionCategorySchema,
  targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD').optional(),
  estimatedCost: z.number().nonnegative().optional(),
  linkedGoalId: z.string().optional(),
  linkedSavingsGoalId: z.string().optional(),
  whyItMatters: z.string().max(2000).optional(),
  status: VisionStatusSchema.default('dreaming'),
  manifestedAt: z.string().optional(),
  order: z.number().int().default(0),
  createdAt: z.string(),
  updatedAt: z.string(),
  archivedAt: z.string().optional(),
});

export const RoadmapMascotSchema = z.enum([
  'rocket',
  'coder',
  'scholar',
  'wealth',
  'archer',
  'zen',
  'sprinter',
  'champion',
]);

export const RoadmapStatusSchema = z.enum(['upcoming', 'in_progress', 'completed']);

export const MonthlyRoadmapItemSchema = z.object({
  id: z.string().min(1),
  year: z.number().int().min(2020).max(2099),
  month: z.number().int().min(1).max(12),
  theme: z.string().min(1, 'Theme is required').max(120),
  primaryGoal: z.string().min(1, 'Primary goal is required').max(300),
  strategy: z.string().min(1, 'Strategy is required').max(300),
  mascot: RoadmapMascotSchema,
  status: RoadmapStatusSchema.default('upcoming'),
  completedAt: z.string().optional(),
  notes: z.string().max(2000).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

/**
 * Complete Backup Envelope Schema for atomic import and export
 */
export const BackupSchema = z.object({
  version: z.literal(1),
  exportedAt: z.string(),
  app: z.literal('nemo'),
  data: z.object({
    settings: WorkspaceSettingsSchema,
    projects: z.array(ProjectSchema),
    tasks: z.array(TaskSchema),
    milestones: z.array(MilestoneSchema),
    semesters: z.array(SemesterSchema),
    subjects: z.array(SubjectSchema),
    assignments: z.array(AssignmentSchema),
    calendarEvents: z.array(CalendarEventSchema),
    goals: z.array(GoalSchema),
    goalTaskLinks: z.array(GoalTaskLinkSchema),
    focusSelections: z.array(FocusSelectionSchema),
    assetBlobs: z.array(AssetBlobSchema),
    hydrationLogs: z.array(HydrationLogSchema).optional().default([]),
    dietLogs: z.array(DietLogSchema).optional().default([]),
    workoutLogs: z.array(WorkoutLogSchema).optional().default([]),
    bodyMetrics: z.array(BodyMetricSchema).optional().default([]),
    financialProfiles: z.array(FinancialProfileSchema).optional().default([]),
    financialCommitments: z.array(FinancialCommitmentSchema).optional().default([]),
    debts: z.array(DebtItemSchema).optional().default([]),
    debtPayments: z.array(DebtPaymentSchema).optional().default([]),
    wishlistItems: z.array(WishlistItemSchema).optional().default([]),
    savingsGoals: z.array(SavingsGoalSchema).optional().default([]),
    savingsDeposits: z.array(SavingsDepositSchema).optional().default([]),
    visionItems: z.array(VisionItemSchema).optional().default([]),
    monthlyRoadmaps: z.array(MonthlyRoadmapItemSchema).optional().default([]),
  }),
});

export type BackupData = z.infer<typeof BackupSchema>;
