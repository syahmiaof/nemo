/**
 * Nemo Offline-First Synchronization Engine
 * Handles bidirectional local-first synchronization with Supabase,
 * offline mutation outbox, LWW & non-destructive conflict reconciliation.
 */

import { db } from '@/db/nemoDb';
import { syncDb } from './syncDb';
import { supabase } from '@/lib/supabase';
import { mappers } from './mappers';
import { mergeTaskEntities, resolveGenericLWW } from './conflictResolver';
import type { SyncMutation, SyncState, SyncEntityType } from '@/domain/types';

type SyncListener = (state: SyncState) => void;

class SyncEngine {
  private state: SyncState = {
    status: 'local_only',
    pendingCount: 0,
  };

  private listeners = new Set<SyncListener>();
  private syncTimer: ReturnType<typeof setTimeout> | null = null;
  private isProcessing = false;
  private currentUserId: string | null = null;
  private currentUserEmail: string | null = null;
  private isIngesting = false;
  private legacyOutboxMigrated = false;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleNetworkChange(true));
      window.addEventListener('offline', () => this.handleNetworkChange(false));
      this.updatePendingCount();
    }
  }

  public subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  public isIngestingRemote(): boolean {
    return this.isIngesting;
  }

  public getAuthenticatedUserId(): string | null {
    return this.currentUserId;
  }

  public onLocalMutation(): void {
    setTimeout(() => { void this.updatePendingCount(); }, 0);
    if (this.currentUserId && typeof navigator !== 'undefined' && navigator.onLine) {
      this.scheduleSync(1000);
    }
  }

  public getState(): SyncState {
    return { ...this.state };
  }

  private updateState(partial: Partial<SyncState>) {
    this.state = { ...this.state, ...partial };
    this.listeners.forEach((l) => l(this.getState()));
  }

  private handleNetworkChange(isOnline: boolean) {
    if (!isOnline) {
      this.updateState({ status: 'offline' });
    } else {
      if (this.currentUserId) {
        this.updateState({ status: 'signed_in' });
        this.scheduleSync(1000);
      } else {
        this.updateState({ status: 'local_only' });
      }
    }
  }

  public setAuthenticatedUser(userId: string | null, email: string | null) {
    this.currentUserId = userId;
    this.currentUserEmail = email;

    if (!userId) {
      this.updateState({
        status: 'local_only',
        ownerEmail: undefined,
        errorMessage: undefined,
        pendingCount: 0,
      });
      return;
    }

    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    this.updateState({
      status: isOnline ? 'signed_in' : 'offline',
      ownerEmail: email || undefined,
      errorMessage: undefined,
    });
    void this.updatePendingCount();

    if (isOnline) {
      this.scheduleSync(500);
    }
  }

  public async updatePendingCount(): Promise<number> {
    try {
      const count = this.currentUserId
        ? await db.syncMutations.where('[ownerUserId+status]').equals([this.currentUserId, 'pending']).count()
        : 0;
      this.updateState({ pendingCount: count });
      return count;
    } catch {
      return 0;
    }
  }

  public scheduleSync(delayMs = 1500) {
    if (this.syncTimer) clearTimeout(this.syncTimer);
    this.syncTimer = setTimeout(() => {
      this.syncNow().catch(() => {});
    }, delayMs);
  }

  /**
   * Enqueue a local mutation for cloud sync.
   * Dexie operations remain completely synchronous and non-blocking to the user.
   */
  public async enqueueMutation(
    entityType: SyncEntityType,
    entityId: string,
    operation: 'UPSERT' | 'DELETE',
    payload: Record<string, unknown>
  ): Promise<void> {
    try {
      const mutation: SyncMutation = {
        id: `mut_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        ownerUserId: this.currentUserId || undefined,
        entityType,
        entityId,
        operation,
        payload,
        clientTimestamp: new Date().toISOString(),
        status: 'pending',
        retryCount: 0,
        createdAt: new Date().toISOString(),
      };

      await db.syncMutations.put(mutation);
      await this.updatePendingCount();

      if (this.currentUserId && navigator.onLine) {
        this.scheduleSync(1000);
      }
    } catch (err) {
      console.warn('Failed to enqueue sync mutation:', err);
      throw err;
    }
  }

  /**
   * Primary entry point for executing full synchronization.
   * Coordinated across tabs via navigator.locks if supported.
   */
  public async syncNow(): Promise<{ success: boolean; error?: string }> {
    if (!this.currentUserId) {
      return { success: true };
    }

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      this.updateState({ status: 'offline' });
      return { success: false, error: 'Offline' };
    }

    if (this.isProcessing) {
      return { success: true };
    }

    if (typeof navigator !== 'undefined' && 'locks' in navigator) {
      return await navigator.locks.request('nemo_sync_mutex', { ifAvailable: true }, async (lock) => {
        if (!lock) {
          // Another tab is currently syncing
          return { success: true };
        }
        return await this.executeSyncCycle();
      });
    }

    return await this.executeSyncCycle();
  }

  private async executeSyncCycle(): Promise<{ success: boolean; error?: string }> {
    this.isProcessing = true;
    this.updateState({ status: 'syncing', errorMessage: undefined });

    try {
      await this.migrateLegacyOutbox();
      // Step 1: Push pending local mutations to Supabase
      await this.pushPendingMutations();

      // Step 2: Pull remote delta since last sync
      this.isIngesting = true;
      try {
        await this.pullRemoteDelta();
      } finally {
        this.isIngesting = false;
      }

      const lastSyncAt = new Date().toISOString();
      await this.updatePendingCount();
      this.updateState({
        status: 'up_to_date',
        lastSyncAt,
        errorMessage: undefined,
      });

      return { success: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Sync failed';
      console.error('Nemo Sync Engine error:', err);
      await this.updatePendingCount();
      this.updateState({
        status: 'error',
        errorMessage: message,
      });
      return { success: false, error: message };
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Pushes outbox mutations to Supabase.
   */
  private async pushPendingMutations(): Promise<void> {
    if (!this.currentUserId) return;
    const userId = this.currentUserId;

    const pending = await db.syncMutations
      .where('[ownerUserId+status]')
      .equals([userId, 'pending'])
      .limit(50)
      .toArray();

    if (!pending.length) return;

    const failures: string[] = [];
    for (const mut of pending) {
      if (this.currentUserId !== userId) {
        throw new Error('Account changed during sync; remaining mutations were kept in the outbox.');
      }
      try {
        const shouldApply = await this.isMutationCurrent(mut);
        if (shouldApply) await this.applyOutboxMutation(mut, userId);
        await db.syncMutations.delete(mut.id);
      } catch (err) {
        console.warn(`Mutation push failed for ${mut.id}:`, err);
        const retryCount = mut.retryCount + 1;
        const lastError = err instanceof Error ? err.message : 'Unknown network failure';
        await db.syncMutations.update(mut.id, {
          retryCount,
          lastError,
          status: retryCount > 5 ? 'failed' : 'pending',
        });
        failures.push(`${mut.entityType} ${mut.entityId}: ${lastError}`);
      }
    }
    if (failures.length) {
      throw new Error(`${failures.length} mutation(s) failed to sync. ${failures[0]}`);
    }
  }

  /**
   * Copy old outbox rows into the new same-database WAL without deleting or
   * modifying the original records. Ownerless copies remain quarantined.
   */
  private async migrateLegacyOutbox(): Promise<void> {
    if (this.legacyOutboxMigrated) return;
    const legacyRows = await syncDb.syncMutations.toArray();
    if (!legacyRows.length) {
      this.legacyOutboxMigrated = true;
      return;
    }
    await db.transaction('rw', [db.syncMutations], async () => {
      for (const row of legacyRows) {
        const existing = await db.syncMutations.get(row.id);
        if (!existing) {
          await db.syncMutations.put({ ...row, ownerUserId: undefined, status: 'pending' });
        }
      }
    });
    this.legacyOutboxMigrated = true;
  }

  /**
   * A WAL write happens before its corresponding local write completes. Verify
   * the committed local state before applying it, so a rolled-back/aborted
   * IndexedDB operation cannot create or delete a remote record by itself.
   */
  private async getEntityRecord(entityType: SyncEntityType, id: string): Promise<unknown> {
    const tables: Record<SyncEntityType, { get: (key: string) => Promise<unknown> }> = {
      project: db.projects,
      task: db.tasks,
      milestone: db.milestones,
      semester: db.semesters,
      subject: db.subjects,
      assignment: db.assignments,
      calendarEvent: db.calendarEvents,
      goal: db.goals,
      goalTaskLink: db.goalTaskLinks,
      focusSelection: db.focusSelections,
      settings: db.settings,
      assetBlob: db.assetBlobs,
      hydrationLog: db.hydrationLogs,
      dietLog: db.dietLogs,
      workoutLog: db.workoutLogs,
      bodyMetric: db.bodyMetrics,
      financialProfile: db.financialProfiles,
      financialCommitment: db.financialCommitments,
      debtItem: db.debts,
      debtPayment: db.debtPayments,
      wishlistItem: db.wishlistItems,
      savingsGoal: db.savingsGoals,
      savingsDeposit: db.savingsDeposits,
      visionItem: db.visionItems,
      monthlyRoadmap: db.monthlyRoadmaps,
      incomeItem: db.incomeItems,
      ibadahDailyLog: db.ibadahDailyLogs,
      qadhaPrayer: db.qadhaPrayers,
      qadhaFasting: db.qadhaFastings,
    };
    return tables[entityType]?.get(id);
  }

  /**
   * A WAL write happens before its corresponding local write completes. Verify
   * the committed local state before applying it, so a rolled-back/aborted
   * IndexedDB operation cannot create or delete a remote record by itself.
   */
  private async isMutationCurrent(mut: SyncMutation): Promise<boolean> {
    const current = await this.getEntityRecord(mut.entityType, mut.entityId);
    if (mut.operation === 'DELETE') return current === undefined;
    if (!current || typeof current !== 'object') return false;

    // Check if there is a strictly newer pending mutation for this same entity in the queue
    if (this.currentUserId) {
      const newerPending = await db.syncMutations
        .where('[ownerUserId+status]')
        .equals([this.currentUserId, 'pending'])
        .filter(
          (m) =>
            m.id !== mut.id &&
            m.entityType === mut.entityType &&
            m.entityId === mut.entityId &&
            m.createdAt > mut.createdAt
        )
        .count();

      if (newerPending > 0) return false;
    }

    return true;
  }

  private async applyOutboxMutation(mut: SyncMutation, userId: string): Promise<void> {
    const tableMap: Record<SyncEntityType, string> = {
      project: 'projects',
      task: 'tasks',
      milestone: 'milestones',
      semester: 'semesters',
      subject: 'subjects',
      assignment: 'assignments',
      calendarEvent: 'calendar_events',
      goal: 'goals',
      goalTaskLink: 'goal_task_links',
      focusSelection: 'focus_selections',
      settings: 'profiles',
      assetBlob: 'workspace_assets',
      hydrationLog: 'hydration_logs',
      dietLog: 'diet_logs',
      workoutLog: 'workout_logs',
      bodyMetric: 'body_metrics',
      financialProfile: 'financial_profiles',
      financialCommitment: 'financial_commitments',
      debtItem: 'debts',
      debtPayment: 'debt_payments',
      wishlistItem: 'wishlist_items',
      savingsGoal: 'savings_goals',
      savingsDeposit: 'savings_deposits',
      visionItem: 'vision_items',
      monthlyRoadmap: 'monthly_roadmaps',
      incomeItem: 'income_items',
      ibadahDailyLog: 'ibadah_daily_logs',
      qadhaPrayer: 'qadha_prayers',
      qadhaFasting: 'qadha_fastings',
    };

    const tableName = tableMap[mut.entityType];
    if (!tableName) return;

    if (mut.operation === 'DELETE') {
      const query = supabase.from(tableName)
        .update({ is_deleted: true, updated_at: new Date().toISOString() })
        .eq('id', mut.entityId)
        .eq('user_id', userId);
      const { error } = await query;

      if (error) throw error;
      return;
    }

    // UPSERT
    let remotePayload: Record<string, any>;
    const mapper = (mappers as any)[mut.entityType];
    const currentRecord = await this.getEntityRecord(mut.entityType, mut.entityId);
    const activePayload = (currentRecord && typeof currentRecord === 'object') ? (currentRecord as Record<string, any>) : mut.payload;

    if (mut.entityType === 'settings') {
      let avatarData: string | null = null;
      if (activePayload?.avatarBlobId) {
        const blob = await db.assetBlobs.get(activePayload.avatarBlobId);
        if (blob?.data) {
          avatarData = blob.data;
        }
      }
      remotePayload = mappers.settings.toRemote(activePayload as any, userId, this.currentUserEmail || undefined, avatarData);
    } else if (mapper?.toRemote) {
      remotePayload = mapper.toRemote(activePayload, userId, this.currentUserEmail);
    } else {
      remotePayload = {
        ...activePayload,
        user_id: userId,
        updated_at: new Date().toISOString(),
      };
    }

    const { error } = await supabase.from(tableName).upsert(remotePayload);
    if (error) throw error;
  }

  /**
   * Pulls remote changes from Supabase and applies them locally.
   */
  private async pullRemoteDelta(): Promise<void> {
    if (!this.currentUserId) return;
    const userId = this.currentUserId;

    // Pull tasks
    const remoteTasks = await this.fetchRemoteRows('tasks', userId);
    for (const remoteRow of remoteTasks) {
      if (remoteRow.is_deleted === true) {
        await this.applyRemoteTombstone('task', remoteRow);
        continue;
      }
      const local = await db.tasks.get(remoteRow.id);
      const remoteTask = mappers.task.toLocal(remoteRow);

      if (!local) {
        await db.tasks.put(remoteTask);
      } else {
        const { resolved } = mergeTaskEntities(local, remoteRow);
        const mergedLocal = mappers.task.toLocal(resolved);
        await db.tasks.put(mergedLocal);
      }
    }

    // Pull projects
    const remoteProjects = await this.fetchRemoteRows('projects', userId);
    for (const remoteRow of remoteProjects) {
      if (remoteRow.is_deleted === true) {
        await this.applyRemoteTombstone('project', remoteRow);
        continue;
      }
      const local = await db.projects.get(remoteRow.id);
      const remoteProj = mappers.project.toLocal(remoteRow);

      if (!local) {
        await db.projects.put(remoteProj);
      } else {
        const { resolved } = resolveGenericLWW(local, remoteProj);
        await db.projects.put(resolved);
      }
    }

    // Pull milestones
    const remoteMilestones = await this.fetchRemoteRows('milestones', userId);
    for (const row of remoteMilestones) {
      if (row.is_deleted === true) await this.applyRemoteTombstone('milestone', row);
      else {
        await db.milestones.put(mappers.milestone.toLocal(row));
      }
    }

    // Pull academics (semesters, subjects, assignments)
    const remoteSemesters = await this.fetchRemoteRows('semesters', userId);
    for (const row of remoteSemesters) {
      if (row.is_deleted === true) await this.applyRemoteTombstone('semester', row);
      else {
        await db.semesters.put(mappers.semester.toLocal(row));
      }
    }

    const remoteSubjects = await this.fetchRemoteRows('subjects', userId);
    for (const row of remoteSubjects) {
      if (row.is_deleted === true) await this.applyRemoteTombstone('subject', row);
      else {
        await db.subjects.put(mappers.subject.toLocal(row));
      }
    }

    const remoteAssignments = await this.fetchRemoteRows('assignments', userId);
    for (const row of remoteAssignments) {
      if (row.is_deleted === true) await this.applyRemoteTombstone('assignment', row);
      else {
        await db.assignments.put(mappers.assignment.toLocal(row));
      }
    }

    // Pull calendar events
    const remoteEvents = await this.fetchRemoteRows('calendar_events', userId);
    for (const row of remoteEvents) {
      if (row.is_deleted === true) await this.applyRemoteTombstone('calendarEvent', row);
      else {
        await db.calendarEvents.put(mappers.calendarEvent.toLocal(row));
      }
    }

    // Pull goals & links
    const remoteGoals = await this.fetchRemoteRows('goals', userId);
    for (const row of remoteGoals) {
      if (row.is_deleted === true) await this.applyRemoteTombstone('goal', row);
      else {
        await db.goals.put(mappers.goal.toLocal(row));
      }
    }

    const remoteLinks = await this.fetchRemoteRows('goal_task_links', userId);
    for (const row of remoteLinks) {
      if (row.is_deleted === true) await this.applyRemoteTombstone('goalTaskLink', row);
      else {
        await db.goalTaskLinks.put(mappers.goalTaskLink.toLocal(row));
      }
    }

    const remoteFocusSelections = await this.fetchRemoteRows('focus_selections', userId);
    for (const row of remoteFocusSelections) {
      if (row.is_deleted === true) await this.applyRemoteTombstone('focusSelection', row);
      else await db.focusSelections.put(mappers.focusSelection.toLocal(row));
    }

    // Pull workspace assets (covers, screenshots, attachments)
    const remoteAssets = await this.fetchRemoteRows('workspace_assets', userId);
    for (const row of remoteAssets) {
      if (row.is_deleted === true) {
        await this.applyRemoteTombstone('assetBlob', row);
        continue;
      }
      if (row.owner_type === 'profile') continue;
      await db.assetBlobs.put(mappers.assetBlob.toLocal(row));
    }

    // Pull health logs (hydration, diet, workout, body metrics)
    const remoteHydration = await this.fetchRemoteRows('hydration_logs', userId);
    for (const row of remoteHydration) {
      if (row.is_deleted === true) await this.applyRemoteTombstone('hydrationLog', row);
      else {
        const local = await db.hydrationLogs.get(row.id);
        const remoteItem = mappers.hydrationLog.toLocal(row);
        if (!local) await db.hydrationLogs.put(remoteItem);
        else {
          const { resolved } = resolveGenericLWW(local, remoteItem, 'loggedAt', 'logged_at');
          await db.hydrationLogs.put(resolved);
        }
      }
    }

    const remoteDiet = await this.fetchRemoteRows('diet_logs', userId);
    for (const row of remoteDiet) {
      if (row.is_deleted === true) await this.applyRemoteTombstone('dietLog', row);
      else {
        const local = await db.dietLogs.get(row.id);
        const remoteItem = mappers.dietLog.toLocal(row);
        if (!local) await db.dietLogs.put(remoteItem);
        else {
          const { resolved } = resolveGenericLWW(local, remoteItem, 'loggedAt', 'logged_at');
          await db.dietLogs.put(resolved);
        }
      }
    }

    const remoteWorkouts = await this.fetchRemoteRows('workout_logs', userId);
    for (const row of remoteWorkouts) {
      if (row.is_deleted === true) await this.applyRemoteTombstone('workoutLog', row);
      else {
        const local = await db.workoutLogs.get(row.id);
        const remoteItem = mappers.workoutLog.toLocal(row);
        if (!local) await db.workoutLogs.put(remoteItem);
        else {
          const { resolved } = resolveGenericLWW(local, remoteItem, 'loggedAt', 'logged_at');
          await db.workoutLogs.put(resolved);
        }
      }
    }

    const remoteBodyMetrics = await this.fetchRemoteRows('body_metrics', userId);
    for (const row of remoteBodyMetrics) {
      if (row.is_deleted === true) await this.applyRemoteTombstone('bodyMetric', row);
      else {
        const local = await db.bodyMetrics.get(row.id);
        const remoteItem = mappers.bodyMetric.toLocal(row);
        if (!local) await db.bodyMetrics.put(remoteItem);
        else {
          const { resolved } = resolveGenericLWW(local, remoteItem, 'loggedAt', 'logged_at');
          await db.bodyMetrics.put(resolved);
        }
      }
    }

    // Pull finance tables
    const remoteFinProfiles = await this.fetchRemoteRows('financial_profiles', userId);
    for (const row of remoteFinProfiles) {
      if (row.is_deleted === true) await this.applyRemoteTombstone('financialProfile', row);
      else {
        const local = await db.financialProfiles.get(row.id);
        const remoteItem = mappers.financialProfile.toLocal(row);
        if (!local) await db.financialProfiles.put(remoteItem);
        else {
          const { resolved } = resolveGenericLWW(local, remoteItem);
          await db.financialProfiles.put(resolved);
        }
      }
    }

    const remoteCommitments = await this.fetchRemoteRows('financial_commitments', userId);
    for (const row of remoteCommitments) {
      if (row.is_deleted === true) await this.applyRemoteTombstone('financialCommitment', row);
      else {
        const local = await db.financialCommitments.get(row.id);
        const remoteItem = mappers.financialCommitment.toLocal(row);
        if (!local) {
          await db.financialCommitments.put(remoteItem);
        } else {
          const { resolved } = resolveGenericLWW(local, remoteItem);
          await db.financialCommitments.put(resolved);
        }
      }
    }

    const remoteDebts = await this.fetchRemoteRows('debts', userId);
    for (const row of remoteDebts) {
      if (row.is_deleted === true) await this.applyRemoteTombstone('debtItem', row);
      else {
        const local = await db.debts.get(row.id);
        const remoteItem = mappers.debtItem.toLocal(row);
        if (!local) await db.debts.put(remoteItem);
        else {
          const { resolved } = resolveGenericLWW(local, remoteItem);
          await db.debts.put(resolved);
        }
      }
    }

    const remoteDebtPayments = await this.fetchRemoteRows('debt_payments', userId);
    for (const row of remoteDebtPayments) {
      if (row.is_deleted === true) await this.applyRemoteTombstone('debtPayment', row);
      else {
        const local = await db.debtPayments.get(row.id);
        const remoteItem = mappers.debtPayment.toLocal(row);
        if (!local) await db.debtPayments.put(remoteItem);
        else {
          const { resolved } = resolveGenericLWW(local, remoteItem, 'paidAt', 'paid_at');
          await db.debtPayments.put(resolved);
        }
      }
    }

    const remoteWishlist = await this.fetchRemoteRows('wishlist_items', userId);
    for (const row of remoteWishlist) {
      if (row.is_deleted === true) await this.applyRemoteTombstone('wishlistItem', row);
      else {
        const local = await db.wishlistItems.get(row.id);
        const remoteItem = mappers.wishlistItem.toLocal(row);
        if (!local) await db.wishlistItems.put(remoteItem);
        else {
          const { resolved } = resolveGenericLWW(local, remoteItem, 'addedAt', 'added_at');
          await db.wishlistItems.put(resolved);
        }
      }
    }

    const remoteSavingsGoals = await this.fetchRemoteRows('savings_goals', userId);
    for (const row of remoteSavingsGoals) {
      if (row.is_deleted === true) await this.applyRemoteTombstone('savingsGoal', row);
      else {
        const local = await db.savingsGoals.get(row.id);
        const remoteItem = mappers.savingsGoal.toLocal(row);
        if (!local) await db.savingsGoals.put(remoteItem);
        else {
          const { resolved } = resolveGenericLWW(local, remoteItem);
          await db.savingsGoals.put(resolved);
        }
      }
    }

    const remoteSavingsDeposits = await this.fetchRemoteRows('savings_deposits', userId);
    for (const row of remoteSavingsDeposits) {
      if (row.is_deleted === true) await this.applyRemoteTombstone('savingsDeposit', row);
      else {
        const local = await db.savingsDeposits.get(row.id);
        const remoteItem = mappers.savingsDeposit.toLocal(row);
        if (!local) await db.savingsDeposits.put(remoteItem);
        else {
          const { resolved } = resolveGenericLWW(local, remoteItem, 'loggedAt', 'logged_at');
          await db.savingsDeposits.put(resolved);
        }
      }
    }

    // Pull vision board items
    const remoteVisionItems = await this.fetchRemoteRows('vision_items', userId);
    for (const row of remoteVisionItems) {
      if (row.is_deleted === true) await this.applyRemoteTombstone('visionItem', row);
      else {
        const local = await db.visionItems.get(row.id);
        const remoteItem = mappers.visionItem.toLocal(row);
        if (!local) {
          await db.visionItems.put(remoteItem);
        } else {
          const { resolved } = resolveGenericLWW(local, remoteItem);
          await db.visionItems.put(resolved);
        }
      }
    }

    // Pull monthly roadmap items
    const remoteRoadmaps = await this.fetchRemoteRows('monthly_roadmaps', userId);
    for (const row of remoteRoadmaps) {
      if (row.is_deleted === true) await this.applyRemoteTombstone('monthlyRoadmap', row);
      else {
        const local = await db.monthlyRoadmaps.get(row.id);
        const remoteItem = mappers.monthlyRoadmap.toLocal(row);
        if (!local) {
          await db.monthlyRoadmaps.put(remoteItem);
        } else {
          const { resolved } = resolveGenericLWW(local, remoteItem);
          await db.monthlyRoadmaps.put(resolved);
        }
      }
    }

    // Pull income items
    const remoteIncomes = await this.fetchRemoteRows('income_items', userId);
    for (const row of remoteIncomes) {
      if (row.is_deleted === true) await this.applyRemoteTombstone('incomeItem', row);
      else {
        const local = await db.incomeItems.get(row.id);
        const remoteItem = mappers.incomeItem.toLocal(row);
        if (!local) {
          await db.incomeItems.put(remoteItem);
        } else {
          const { resolved } = resolveGenericLWW(local, remoteItem);
          await db.incomeItems.put(resolved);
        }
      }
    }

    // Pull ibadah daily logs
    const remoteIbadah = await this.fetchRemoteRows('ibadah_daily_logs', userId);
    for (const row of remoteIbadah) {
      if (row.is_deleted === true) await this.applyRemoteTombstone('ibadahDailyLog', row);
      else {
        const local = await db.ibadahDailyLogs.get(row.id);
        const remoteItem = mappers.ibadahDailyLog.toLocal(row);
        if (!local) {
          await db.ibadahDailyLogs.put(remoteItem);
        } else {
          const { resolved } = resolveGenericLWW(local, remoteItem);
          await db.ibadahDailyLogs.put(resolved);
        }
      }
    }

    // Pull qadha prayers
    const remoteQadhaPrayers = await this.fetchRemoteRows('qadha_prayers', userId);
    for (const row of remoteQadhaPrayers) {
      if (row.is_deleted === true) await this.applyRemoteTombstone('qadhaPrayer', row);
      else {
        const local = await db.qadhaPrayers.get(row.id);
        const remoteItem = mappers.qadhaPrayer.toLocal(row);
        if (!local) {
          await db.qadhaPrayers.put(remoteItem);
        } else {
          const { resolved } = resolveGenericLWW(local, remoteItem);
          await db.qadhaPrayers.put(resolved);
        }
      }
    }

    // Pull qadha fastings
    const remoteQadhaFastings = await this.fetchRemoteRows('qadha_fastings', userId);
    for (const row of remoteQadhaFastings) {
      if (row.is_deleted === true) await this.applyRemoteTombstone('qadhaFasting', row);
      else {
        const local = await db.qadhaFastings.get(row.id);
        const remoteItem = mappers.qadhaFasting.toLocal(row);
        if (!local) {
          await db.qadhaFastings.put(remoteItem);
        } else {
          const { resolved } = resolveGenericLWW(local, remoteItem);
          await db.qadhaFastings.put(resolved);
        }
      }
    }

    // Pull profile settings & avatar
    const { data: remoteProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    if (profileError) throw new Error(`Pull profiles failed: ${profileError.message}`);

    if (remoteProfile) {
      const currentSettings = await db.settings.get('default');
      let targetAvatarBlobId = currentSettings?.avatarBlobId;

      if (remoteProfile.avatar_url) {
        const currentBlob = targetAvatarBlobId ? await db.assetBlobs.get(targetAvatarBlobId) : null;
        if (!currentBlob || currentBlob.data !== remoteProfile.avatar_url) {
          const newBlobId = `avatar-synced-${Date.now()}`;
          const existingProfileBlobs = await db.assetBlobs.where('ownerType').equals('profile').toArray();
          for (const item of existingProfileBlobs) {
            await db.assetBlobs.delete(item.id);
          }

          await db.assetBlobs.put({
            id: newBlobId,
            ownerType: 'profile',
            ownerId: 'default',
            mimeType: 'image/webp',
            size: Math.round((remoteProfile.avatar_url.length * 3) / 4),
            data: remoteProfile.avatar_url,
            createdAt: new Date().toISOString(),
          });
          targetAvatarBlobId = newBlobId;
        }
      } else if (!remoteProfile.avatar_url && targetAvatarBlobId) {
        // If remote has no avatar, but local does, push the local avatar up to cloud
        const localBlob = await db.assetBlobs.get(targetAvatarBlobId);
        if (localBlob?.data) {
          try {
            await supabase
              .from('profiles')
              .update({ avatar_url: localBlob.data, updated_at: new Date().toISOString() })
              .eq('id', userId);
          } catch (pushErr) {
            console.warn('Could not push local avatar to remote profile:', pushErr);
          }
        }
      }

      // Bidirectional display name synchronization
      let targetDisplayName = currentSettings?.displayName || 'My Workspace';
      if (remoteProfile.display_name && remoteProfile.display_name.trim()) {
        targetDisplayName = remoteProfile.display_name.trim();
      } else if (currentSettings?.displayName && currentSettings.displayName !== 'My Workspace') {
        // If local has custom name but remote is empty, push local to remote
        try {
          await supabase
            .from('profiles')
            .update({ display_name: currentSettings.displayName, updated_at: new Date().toISOString() })
            .eq('id', userId);
        } catch {}
      }

      await db.settings.update('default', {
        displayName: targetDisplayName,
        theme: (remoteProfile.theme as any) || currentSettings?.theme || 'dark',
        accent: (remoteProfile.accent as any) || currentSettings?.accent || 'mint',
        weekStartsOn: remoteProfile.week_starts_on ?? currentSettings?.weekStartsOn ?? 1,
        hourFormat: (remoteProfile.hour_format as any) || currentSettings?.hourFormat || '24h',
        reduceMotion: remoteProfile.reduce_motion ?? currentSettings?.reduceMotion ?? false,
        onboardingCompleted: remoteProfile.onboarding_completed ?? currentSettings?.onboardingCompleted ?? true,
        avatarBlobId: targetAvatarBlobId,
      });
    }
  }

  private async fetchRemoteRows(table: string, userId: string): Promise<Record<string, any>[]> {
    // Include tombstones so a device that was offline can apply remote deletes.
    const { data, error } = await supabase
      .from(table as any)
      .select('*')
      .eq('user_id', userId);
    if (error) throw new Error(`Pull ${table} failed: ${error.message}`);
    return (data || []) as Record<string, any>[];
  }

  private async applyRemoteTombstone(entityType: SyncEntityType, row: Record<string, any>): Promise<void> {
    const tables: Record<SyncEntityType, { get: (key: string) => Promise<unknown>; delete: (key: string) => Promise<unknown> }> = {
      project: db.projects,
      task: db.tasks,
      milestone: db.milestones,
      semester: db.semesters,
      subject: db.subjects,
      assignment: db.assignments,
      calendarEvent: db.calendarEvents,
      goal: db.goals,
      goalTaskLink: db.goalTaskLinks,
      focusSelection: db.focusSelections,
      settings: db.settings,
      assetBlob: db.assetBlobs,
      hydrationLog: db.hydrationLogs,
      dietLog: db.dietLogs,
      workoutLog: db.workoutLogs,
      bodyMetric: db.bodyMetrics,
      financialProfile: db.financialProfiles,
      financialCommitment: db.financialCommitments,
      debtItem: db.debts,
      debtPayment: db.debtPayments,
      wishlistItem: db.wishlistItems,
      savingsGoal: db.savingsGoals,
      savingsDeposit: db.savingsDeposits,
      visionItem: db.visionItems,
      monthlyRoadmap: db.monthlyRoadmaps,
      incomeItem: db.incomeItems,
      ibadahDailyLog: db.ibadahDailyLogs,
      qadhaPrayer: db.qadhaPrayers,
      qadhaFasting: db.qadhaFastings,
    };
    const table = tables[entityType];
    const local = await table.get(row.id);
    if (local && typeof local === 'object') {
      const localRecord = local as Record<string, unknown>;
      const localTimestamp = typeof localRecord.updatedAt === 'string'
        ? localRecord.updatedAt
        : typeof localRecord.createdAt === 'string' ? localRecord.createdAt : undefined;
      const remoteTimestamp = typeof row.updated_at === 'string' ? row.updated_at : undefined;
      if (localTimestamp && remoteTimestamp && localTimestamp > remoteTimestamp) return;
    }
    await table.delete(row.id);
  }

  /**
   * Upload all local records to the cloud account.
   * Used on initial authenticated consent.
   */
  public async uploadAllLocalData(userId: string): Promise<{ success: boolean; count: number; error?: string }> {
    let uploadCount = 0;
    try {
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
        db.settings.get('default'),
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
        db.financialProfiles.toArray(),
        db.financialCommitments.toArray(),
        db.debts.toArray(),
        db.debtPayments.toArray(),
        db.wishlistItems.toArray(),
        db.savingsGoals.toArray(),
        db.savingsDeposits.toArray(),
        db.visionItems.toArray(),
        db.monthlyRoadmaps.toArray(),
        db.incomeItems.toArray(),
        db.ibadahDailyLogs.toArray(),
        db.qadhaPrayers.toArray(),
        db.qadhaFastings.toArray(),
      ]);

      const upsert = async (table: string, rows: Record<string, unknown>[], label: string) => {
        const { error } = await supabase.from(table as any).upsert(rows);
        if (error) throw new Error(`Upload ${label} failed: ${error.message}`);
        uploadCount += rows.length;
      };

      if (settings) {
        let avatarData: string | null = null;
        if (settings.avatarBlobId) {
          const blob = await db.assetBlobs.get(settings.avatarBlobId);
          if (blob?.data) {
            avatarData = blob.data;
          }
        }
        await upsert('profiles', [mappers.settings.toRemote(settings, userId, this.currentUserEmail || undefined, avatarData)], 'profile settings');
      }

      if (projects.length) {
        const rows = projects.map((p) => mappers.project.toRemote(p, userId));
        await upsert('projects', rows, 'projects');
      }

      if (tasks.length) {
        const rows = tasks.map((t) => mappers.task.toRemote(t, userId));
        await upsert('tasks', rows, 'tasks');
      }

      if (milestones.length) {
        const rows = milestones.map((m) => mappers.milestone.toRemote(m, userId));
        await upsert('milestones', rows, 'milestones');
      }

      if (semesters.length) {
        const rows = semesters.map((s) => mappers.semester.toRemote(s, userId));
        await upsert('semesters', rows, 'semesters');
      }

      if (subjects.length) {
        const rows = subjects.map((s) => mappers.subject.toRemote(s, userId));
        await upsert('subjects', rows, 'subjects');
      }

      if (assignments.length) {
        const rows = assignments.map((a) => mappers.assignment.toRemote(a, userId));
        await upsert('assignments', rows, 'assignments');
      }

      if (calendarEvents.length) {
        const rows = calendarEvents.map((e) => mappers.calendarEvent.toRemote(e, userId));
        await upsert('calendar_events', rows, 'calendar events');
      }

      if (goals.length) {
        const rows = goals.map((g) => mappers.goal.toRemote(g, userId));
        await upsert('goals', rows, 'goals');
      }

      if (goalTaskLinks.length) {
        const rows = goalTaskLinks.map((l) => mappers.goalTaskLink.toRemote(l, userId));
        await upsert('goal_task_links', rows, 'goal links');
      }

      if (focusSelections.length) {
        const rows = focusSelections.map((f) => mappers.focusSelection.toRemote(f, userId));
        await upsert('focus_selections', rows, 'focus selections');
      }

      const nonProfileAssets = assetBlobs.filter((b) => b.ownerType !== 'profile');
      if (nonProfileAssets.length) {
        const rows = nonProfileAssets.map((b) => mappers.assetBlob.toRemote(b, userId));
        await upsert('workspace_assets', rows, 'workspace assets');
      }

      if (hydrationLogs.length) {
        const rows = hydrationLogs.map((h) => mappers.hydrationLog.toRemote(h, userId));
        await upsert('hydration_logs', rows, 'hydration logs');
      }

      if (dietLogs.length) {
        const rows = dietLogs.map((d) => mappers.dietLog.toRemote(d, userId));
        await upsert('diet_logs', rows, 'diet logs');
      }

      if (workoutLogs.length) {
        const rows = workoutLogs.map((w) => mappers.workoutLog.toRemote(w, userId));
        await upsert('workout_logs', rows, 'workout logs');
      }

      if (bodyMetrics.length) {
        const rows = bodyMetrics.map((b) => mappers.bodyMetric.toRemote(b, userId));
        await upsert('body_metrics', rows, 'body metrics');
      }

      if (financialProfiles.length) {
        const rows = financialProfiles.map((p) => mappers.financialProfile.toRemote(p, userId));
        await upsert('financial_profiles', rows, 'financial profiles');
      }

      if (financialCommitments.length) {
        const rows = financialCommitments.map((c) => mappers.financialCommitment.toRemote(c, userId));
        await upsert('financial_commitments', rows, 'financial commitments');
      }

      if (debts.length) {
        const rows = debts.map((d) => mappers.debtItem.toRemote(d, userId));
        await upsert('debts', rows, 'debts');
      }

      if (debtPayments.length) {
        const rows = debtPayments.map((dp) => mappers.debtPayment.toRemote(dp, userId));
        await upsert('debt_payments', rows, 'debt payments');
      }

      if (wishlistItems.length) {
        const rows = wishlistItems.map((w) => mappers.wishlistItem.toRemote(w, userId));
        await upsert('wishlist_items', rows, 'wishlist items');
      }

      if (savingsGoals.length) {
        const rows = savingsGoals.map((s) => mappers.savingsGoal.toRemote(s, userId));
        await upsert('savings_goals', rows, 'savings goals');
      }

      if (savingsDeposits.length) {
        const rows = savingsDeposits.map((sd) => mappers.savingsDeposit.toRemote(sd, userId));
        await upsert('savings_deposits', rows, 'savings deposits');
      }

      if (visionItems.length) {
        const rows = visionItems.map((v) => mappers.visionItem.toRemote(v, userId));
        await upsert('vision_items', rows, 'vision items');
      }

      if (monthlyRoadmaps.length) {
        const rows = monthlyRoadmaps.map((r) => mappers.monthlyRoadmap.toRemote(r, userId));
        await upsert('monthly_roadmaps', rows, 'monthly roadmaps');
      }

      if (incomeItems.length) {
        const rows = incomeItems.map((inc) => mappers.incomeItem.toRemote(inc, userId));
        await upsert('income_items', rows, 'income items');
      }

      if (ibadahDailyLogs.length) {
        const rows = ibadahDailyLogs.map((log) => mappers.ibadahDailyLog.toRemote(log, userId));
        await upsert('ibadah_daily_logs', rows, 'ibadah daily logs');
      }

      if (qadhaPrayers.length) {
        const rows = qadhaPrayers.map((qp) => mappers.qadhaPrayer.toRemote(qp, userId));
        await upsert('qadha_prayers', rows, 'qadha prayers');
      }

      if (qadhaFastings.length) {
        const rows = qadhaFastings.map((qf) => mappers.qadhaFasting.toRemote(qf, userId));
        await upsert('qadha_fastings', rows, 'qadha fastings');
      }

      // Ownerless/legacy mutations deliberately stay quarantined. They cannot
      // be safely attributed from the current session alone.
      return { success: true, count: uploadCount };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Initial upload failed';
      return { success: false, count: uploadCount, error: message };
    }
  }
}

export const syncEngine = new SyncEngine();
