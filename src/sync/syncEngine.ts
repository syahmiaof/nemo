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
  private async isMutationCurrent(mut: SyncMutation): Promise<boolean> {
    const tables: Record<SyncEntityType, { get: (id: string) => Promise<unknown> }> = {
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
    };
    const current = await tables[mut.entityType].get(mut.entityId);
    if (mut.operation === 'DELETE') return current === undefined;
    if (!current || typeof current !== 'object') return false;
    // A newer local write supersedes this queued snapshot. Its own outbox
    // record will carry the current payload and be processed separately.
    return Object.entries(mut.payload).every(([key, queuedValue]) =>
      JSON.stringify((current as Record<string, unknown>)[key]) === JSON.stringify(queuedValue)
    );
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

    if (mut.entityType === 'settings') {
      let avatarData: string | null = null;
      if (mut.payload?.avatarBlobId) {
        const blob = await db.assetBlobs.get(mut.payload.avatarBlobId);
        if (blob?.data) {
          avatarData = blob.data;
        }
      }
      remotePayload = mappers.settings.toRemote(mut.payload as any, userId, this.currentUserEmail || undefined, avatarData);
    } else if (mapper?.toRemote) {
      remotePayload = mapper.toRemote(mut.payload, userId, this.currentUserEmail);
    } else {
      remotePayload = {
        ...mut.payload,
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
