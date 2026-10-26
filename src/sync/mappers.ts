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
  AssetBlob,
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
      const tags = [...(local.tags || [])];
      if (local.isWatchlist && !tags.includes('watchlist')) {
        tags.push('watchlist');
      }

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
        tags,
        blocked_reason: local.blockedReason || null,
        parent_type: local.parentType || null,
        parent_id: local.parentId || null,
        is_watchlist: local.isWatchlist ?? false,
        completed_at: local.completedAt || null,
        created_at: local.createdAt,
        updated_at: local.updatedAt,
      };
    },
    toLocal(remote: any): Task {
      const isWatchlist = Boolean(
        remote.is_watchlist ||
        (Array.isArray(remote.tags) && remote.tags.includes('watchlist'))
      );

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
        isWatchlist,
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
  assetBlob: {
    toRemote(local: AssetBlob, userId: string) {
      return {
        id: local.id,
        user_id: userId,
        owner_type: local.ownerType,
        owner_id: local.ownerId,
        mime_type: local.mimeType,
        size: local.size,
        data: local.data,
        is_deleted: false,
        created_at: local.createdAt,
        updated_at: new Date().toISOString(),
      };
    },
    toLocal(remote: any): AssetBlob {
      return {
        id: remote.id,
        ownerType: remote.owner_type,
        ownerId: remote.owner_id,
        mimeType: remote.mime_type,
        size: remote.size,
        data: remote.data,
        createdAt: remote.created_at,
      };
    },
  },

  hydrationLog: {
    toRemote(local: HydrationLog, userId: string) {
      return {
        id: local.id,
        user_id: userId,
        date: local.date,
        amount_ml: local.amountMl,
        logged_at: local.loggedAt,
        version: 1,
        is_deleted: false,
      };
    },
    toLocal(remote: any): HydrationLog {
      return {
        id: remote.id,
        date: remote.date,
        amountMl: Number(remote.amount_ml),
        loggedAt: remote.logged_at,
      };
    },
  },

  dietLog: {
    toRemote(local: DietLog, userId: string) {
      return {
        id: local.id,
        user_id: userId,
        date: local.date,
        meal_type: local.mealType,
        food_name: local.foodName,
        calories: local.calories,
        protein_g: local.proteinG ?? null,
        carbs_g: local.carbsG ?? null,
        fat_g: local.fatG ?? null,
        logged_at: local.loggedAt,
        version: 1,
        is_deleted: false,
      };
    },
    toLocal(remote: any): DietLog {
      return {
        id: remote.id,
        date: remote.date,
        mealType: remote.meal_type,
        foodName: remote.food_name,
        calories: Number(remote.calories),
        proteinG: remote.protein_g != null ? Number(remote.protein_g) : undefined,
        carbsG: remote.carbs_g != null ? Number(remote.carbs_g) : undefined,
        fatG: remote.fat_g != null ? Number(remote.fat_g) : undefined,
        loggedAt: remote.logged_at,
      };
    },
  },

  workoutLog: {
    toRemote(local: WorkoutLog, userId: string) {
      return {
        id: local.id,
        user_id: userId,
        date: local.date,
        type: local.type,
        title: local.title,
        duration_minutes: local.durationMinutes,
        distance_km: local.distanceKm ?? null,
        calories_burned: local.caloriesBurned ?? null,
        exercises: local.exercises ?? [],
        notes: local.notes || null,
        completed_at: local.completedAt,
        version: 1,
        is_deleted: false,
      };
    },
    toLocal(remote: any): WorkoutLog {
      return {
        id: remote.id,
        date: remote.date,
        type: remote.type,
        title: remote.title,
        durationMinutes: Number(remote.duration_minutes),
        distanceKm: remote.distance_km != null ? Number(remote.distance_km) : undefined,
        caloriesBurned: remote.calories_burned != null ? Number(remote.calories_burned) : undefined,
        exercises: Array.isArray(remote.exercises) ? remote.exercises : undefined,
        notes: remote.notes || undefined,
        completedAt: remote.completed_at,
      };
    },
  },

  bodyMetric: {
    toRemote(local: BodyMetric, userId: string) {
      return {
        id: local.id,
        user_id: userId,
        date: local.date,
        weight_kg: local.weightKg,
        body_fat_percent: local.bodyFatPercent ?? null,
        logged_at: local.loggedAt,
        version: 1,
        is_deleted: false,
      };
    },
    toLocal(remote: any): BodyMetric {
      return {
        id: remote.id,
        date: remote.date,
        weightKg: Number(remote.weight_kg),
        bodyFatPercent: remote.body_fat_percent != null ? Number(remote.body_fat_percent) : undefined,
        loggedAt: remote.logged_at,
      };
    },
  },

  financialProfile: {
    toRemote(local: FinancialProfile, userId: string) {
      return {
        id: local.id,
        user_id: userId,
        monthly_income_gross: local.monthlyIncomeGross ?? null,
        monthly_income_net: local.monthlyIncomeNet,
        payday_day_of_month: local.paydayDayOfMonth ?? 25,
        currency: local.currency || 'MYR',
        version: 1,
        is_deleted: false,
        updated_at: local.updatedAt,
      };
    },
    toLocal(remote: any): FinancialProfile {
      return {
        id: remote.id,
        monthlyIncomeGross: remote.monthly_income_gross != null ? Number(remote.monthly_income_gross) : undefined,
        monthlyIncomeNet: Number(remote.monthly_income_net),
        paydayDayOfMonth: remote.payday_day_of_month != null ? Number(remote.payday_day_of_month) : 25,
        currency: remote.currency || 'MYR',
        updatedAt: remote.updated_at,
      };
    },
  },

  financialCommitment: {
    toRemote(local: FinancialCommitment, userId: string) {
      return {
        id: local.id,
        user_id: userId,
        title: local.title,
        amount: local.amount,
        category: local.category,
        due_day_of_month: local.dueDayOfMonth,
        is_paid_this_month: local.isPaidThisMonth,
        last_paid_month_year: local.lastPaidMonthYear || null,
        notes: local.notes || null,
        auto_renew: local.autoRenew,
        version: 1,
        is_deleted: false,
        created_at: local.createdAt,
        updated_at: local.updatedAt,
      };
    },
    toLocal(remote: any): FinancialCommitment {
      return {
        id: remote.id,
        title: remote.title,
        amount: Number(remote.amount),
        category: remote.category,
        dueDayOfMonth: Number(remote.due_day_of_month),
        isPaidThisMonth: Boolean(remote.is_paid_this_month),
        lastPaidMonthYear: remote.last_paid_month_year || undefined,
        notes: remote.notes || undefined,
        autoRenew: Boolean(remote.auto_renew),
        createdAt: remote.created_at,
        updatedAt: remote.updated_at,
      };
    },
  },

  debtItem: {
    toRemote(local: DebtItem, userId: string) {
      return {
        id: local.id,
        user_id: userId,
        title: local.title,
        creditor: local.creditor,
        debt_type: local.debtType || null,
        original_principal: local.originalPrincipal,
        current_balance: local.currentBalance,
        monthly_installment: local.monthlyInstallment,
        interest_rate_percent: local.interestRatePercent ?? null,
        target_payoff_date: local.targetPayoffDate || null,
        priority: local.priority,
        notes: local.notes || null,
        version: 1,
        is_deleted: false,
        created_at: local.createdAt,
        updated_at: local.updatedAt,
      };
    },
    toLocal(remote: any): DebtItem {
      return {
        id: remote.id,
        title: remote.title,
        creditor: remote.creditor,
        debtType: remote.debt_type || undefined,
        originalPrincipal: Number(remote.original_principal),
        currentBalance: Number(remote.current_balance),
        monthlyInstallment: Number(remote.monthly_installment),
        interestRatePercent: remote.interest_rate_percent != null ? Number(remote.interest_rate_percent) : undefined,
        targetPayoffDate: remote.target_payoff_date || undefined,
        priority: remote.priority,
        notes: remote.notes || undefined,
        createdAt: remote.created_at,
        updatedAt: remote.updated_at,
      };
    },
  },

  debtPayment: {
    toRemote(local: DebtPayment, userId: string) {
      return {
        id: local.id,
        user_id: userId,
        debt_id: local.debtId,
        amount: local.amount,
        paid_at: local.paidAt,
        note: local.note || null,
        version: 1,
        is_deleted: false,
      };
    },
    toLocal(remote: any): DebtPayment {
      return {
        id: remote.id,
        debtId: remote.debt_id,
        amount: Number(remote.amount),
        paidAt: remote.paid_at,
        note: remote.note || undefined,
      };
    },
  },

  wishlistItem: {
    toRemote(local: WishlistItem, userId: string) {
      return {
        id: local.id,
        user_id: userId,
        title: local.title,
        estimated_price: local.estimatedPrice,
        priority: local.priority,
        store_url: local.storeUrl || null,
        is_bought: local.isBought,
        bought_at: local.boughtAt || null,
        cooling_off_days: local.coolingOffDays,
        target_savings_goal_id: local.targetSavingsGoalId || null,
        notes: local.notes || null,
        version: 1,
        is_deleted: false,
        added_at: local.addedAt,
      };
    },
    toLocal(remote: any): WishlistItem {
      return {
        id: remote.id,
        title: remote.title,
        estimatedPrice: Number(remote.estimated_price),
        priority: remote.priority,
        storeUrl: remote.store_url || undefined,
        isBought: Boolean(remote.is_bought),
        boughtAt: remote.bought_at || undefined,
        coolingOffDays: Number(remote.cooling_off_days),
        targetSavingsGoalId: remote.target_savings_goal_id || undefined,
        notes: remote.notes || undefined,
        addedAt: remote.added_at || remote.created_at || new Date().toISOString(),
      };
    },
  },

  savingsGoal: {
    toRemote(local: SavingsGoal, userId: string) {
      return {
        id: local.id,
        user_id: userId,
        title: local.title,
        target_amount: local.targetAmount,
        current_amount: local.currentAmount,
        category: local.category,
        target_date: local.targetDate || null,
        color: local.color,
        icon: local.icon || null,
        version: 1,
        is_deleted: false,
        created_at: local.createdAt,
        updated_at: local.updatedAt,
      };
    },
    toLocal(remote: any): SavingsGoal {
      return {
        id: remote.id,
        title: remote.title,
        targetAmount: Number(remote.target_amount),
        currentAmount: Number(remote.current_amount),
        category: remote.category,
        targetDate: remote.target_date || undefined,
        color: remote.color,
        icon: remote.icon || undefined,
        createdAt: remote.created_at,
        updatedAt: remote.updated_at,
      };
    },
  },

  savingsDeposit: {
    toRemote(local: SavingsDeposit, userId: string) {
      return {
        id: local.id,
        user_id: userId,
        savings_goal_id: local.savingsGoalId,
        amount: local.amount,
        type: local.type,
        logged_at: local.loggedAt,
        note: local.note || null,
        version: 1,
        is_deleted: false,
      };
    },
    toLocal(remote: any): SavingsDeposit {
      return {
        id: remote.id,
        savingsGoalId: remote.savings_goal_id,
        amount: Number(remote.amount),
        type: remote.type,
        loggedAt: remote.logged_at,
        note: remote.note || undefined,
      };
    },
  },

  visionItem: {
    toRemote(local: VisionItem, userId: string) {
      return toRemoteVisionItem(local, userId);
    },
    toLocal(remote: any): VisionItem {
      return toLocalVisionItem(remote);
    },
  },

  monthlyRoadmap: {
    toRemote(local: MonthlyRoadmapItem, userId: string) {
      return toRemoteMonthlyRoadmap(local, userId);
    },
    toLocal(remote: any): MonthlyRoadmapItem {
      return toLocalMonthlyRoadmap(remote);
    },
  },

  incomeItem: {
    toRemote(local: IncomeItem, userId: string) {
      return {
        id: local.id,
        user_id: userId,
        title: local.title,
        amount: local.amount,
        type: local.type,
        is_recurring: local.isRecurring,
        date_received: local.dateReceived || null,
        notes: local.sourceNotes || null,
        version: 1,
        is_deleted: false,
        created_at: local.createdAt,
        updated_at: local.updatedAt,
      };
    },
    toLocal(remote: any): IncomeItem {
      return {
        id: remote.id,
        title: remote.title,
        amount: Number(remote.amount),
        type: remote.type,
        isRecurring: Boolean(remote.is_recurring),
        dateReceived: remote.date_received || undefined,
        sourceNotes: remote.notes || remote.source_notes || undefined,
        createdAt: remote.created_at,
        updatedAt: remote.updated_at,
      };
    },
  },

  ibadahDailyLog: {
    toRemote(local: IbadahDailyLog, userId: string) {
      return {
        id: local.id,
        user_id: userId,
        date: local.date,
        prayers: local.prayers || {},
        sunnah_prayers: local.sunnahPrayers || {},
        quran_pages_read: local.quranPagesRead ?? 0,
        quran_last_surah: local.quranLastSurah || null,
        quran_last_ayah: local.quranLastAyah ?? null,
        dhikr_count: local.dhikrCount ?? 0,
        sedekah_subuh_done: local.sedekahDone ?? false,
        fasting_status: (local as any).fastingStatus || 'none',
        daily_reflection: local.notes || null,
        version: 1,
        is_deleted: false,
        created_at: local.createdAt,
        updated_at: local.updatedAt,
      };
    },
    toLocal(remote: any): IbadahDailyLog {
      return {
        id: remote.id,
        date: remote.date,
        prayers: remote.prayers || {},
        sunnahPrayers: remote.sunnah_prayers || {},
        quranPagesRead: Number(remote.quran_pages_read ?? 0),
        quranLastSurah: remote.quran_last_surah || undefined,
        quranLastAyah: remote.quran_last_ayah != null ? Number(remote.quran_last_ayah) : undefined,
        dhikrCount: Number(remote.dhikr_count ?? 0),
        sedekahDone: Boolean(remote.sedekah_subuh_done ?? remote.sedekah_done),
        notes: remote.daily_reflection || remote.notes || undefined,
        createdAt: remote.created_at,
        updatedAt: remote.updated_at,
      };
    },
  },

  qadhaPrayer: {
    toRemote(local: QadhaPrayerItem, userId: string) {
      return {
        id: local.id,
        user_id: userId,
        prayer_type: local.prayerType,
        count_remaining: local.remainingCount,
        count_completed: local.completedCount,
        notes: local.notes || null,
        version: 1,
        is_deleted: false,
        created_at: local.createdAt,
        updated_at: local.updatedAt,
      };
    },
    toLocal(remote: any): QadhaPrayerItem {
      const remaining = Number(remote.count_remaining ?? 0);
      const completed = Number(remote.count_completed ?? 0);
      return {
        id: remote.id,
        prayerType: remote.prayer_type,
        totalMissed: remaining + completed,
        completedCount: completed,
        remainingCount: remaining,
        notes: remote.notes || undefined,
        createdAt: remote.created_at,
        updatedAt: remote.updated_at,
      };
    },
  },

  qadhaFasting: {
    toRemote(local: QadhaFastingRecord, userId: string) {
      return {
        id: local.id,
        user_id: userId,
        year_hijri: local.yearHijri,
        year_gregorian: local.yearGregorian,
        days_missed: local.missedDays,
        days_qadha_done: local.qadhaCompletedDays,
        years_delayed: local.yearsDelayed,
        fidyah_rate_per_day: local.fidyahRate,
        is_fidyah_paid: local.isFidyahPaid,
        fidyah_paid_amount: local.totalFidyahAmount,
        fidyah_paid_at: local.fidyahPaidAt || null,
        notes: local.notes || null,
        version: 1,
        is_deleted: false,
        created_at: local.createdAt,
        updated_at: local.updatedAt,
      };
    },
    toLocal(remote: any): QadhaFastingRecord {
      const missed = Number(remote.days_missed ?? 0);
      const qadhaDone = Number(remote.days_qadha_done ?? 0);
      const remaining = Math.max(0, missed - qadhaDone);
      const delayed = Number(remote.years_delayed ?? 0);
      const rate = Number(remote.fidyah_rate_per_day ?? 4.0);
      return {
        id: remote.id,
        yearHijri: Number(remote.year_hijri),
        yearGregorian: Number(remote.year_gregorian),
        missedDays: missed,
        qadhaCompletedDays: qadhaDone,
        remainingDays: remaining,
        yearsDelayed: delayed,
        fidyahRate: rate,
        totalFidyahAmount: remaining * delayed * rate,
        isFidyahPaid: Boolean(remote.is_fidyah_paid),
        fidyahPaidAt: remote.fidyah_paid_at || undefined,
        notes: remote.notes || undefined,
        createdAt: remote.created_at,
        updatedAt: remote.updated_at,
      };
    },
  },
};

export function toRemoteVisionItem(local: VisionItem, userId: string) {
  return {
    id: local.id,
    user_id: userId,
    title: local.title,
    description: local.description || null,
    image_url: local.imageUrl,
    image_thumbnail_url: local.imageThumbnailUrl || null,
    horizon: local.horizon,
    category: local.category,
    target_date: local.targetDate || null,
    estimated_cost: local.estimatedCost ?? null,
    linked_goal_id: local.linkedGoalId || null,
    linked_savings_goal_id: local.linkedSavingsGoalId || null,
    why_it_matters: local.whyItMatters || null,
    status: local.status,
    manifested_at: local.manifestedAt || null,
    order: local.order ?? 0,
    archived_at: local.archivedAt || null,
    version: 1,
    is_deleted: false,
    created_at: local.createdAt,
    updated_at: local.updatedAt,
  };
}

export function toLocalVisionItem(remote: any): VisionItem {
  return {
    id: remote.id,
    title: remote.title,
    description: remote.description || undefined,
    imageUrl: remote.image_url,
    imageThumbnailUrl: remote.image_thumbnail_url || undefined,
    horizon: remote.horizon,
    category: remote.category,
    targetDate: remote.target_date || undefined,
    estimatedCost: remote.estimated_cost !== null && remote.estimated_cost !== undefined ? Number(remote.estimated_cost) : undefined,
    linkedGoalId: remote.linked_goal_id || undefined,
    linkedSavingsGoalId: remote.linked_savings_goal_id || undefined,
    whyItMatters: remote.why_it_matters || undefined,
    status: remote.status,
    manifestedAt: remote.manifested_at || undefined,
    order: remote.order !== null && remote.order !== undefined ? Number(remote.order) : 0,
    archivedAt: remote.archived_at || undefined,
    createdAt: remote.created_at,
    updatedAt: remote.updated_at,
  };
}

export function toRemoteMonthlyRoadmap(local: MonthlyRoadmapItem, userId: string) {
  return {
    id: local.id,
    user_id: userId,
    year: local.year,
    month: local.month,
    theme: local.theme,
    primary_goal: local.primaryGoal,
    strategy: local.strategy,
    mascot: local.mascot,
    status: local.status,
    completed_at: local.completedAt || null,
    notes: local.notes || null,
    version: 1,
    is_deleted: false,
    created_at: local.createdAt,
    updated_at: local.updatedAt,
  };
}

export function toLocalMonthlyRoadmap(remote: any): MonthlyRoadmapItem {
  return {
    id: remote.id,
    year: Number(remote.year),
    month: Number(remote.month),
    theme: remote.theme,
    primaryGoal: remote.primary_goal,
    strategy: remote.strategy,
    mascot: remote.mascot,
    status: remote.status,
    completedAt: remote.completed_at || undefined,
    notes: remote.notes || undefined,
    createdAt: remote.created_at,
    updatedAt: remote.updated_at,
  };
}
