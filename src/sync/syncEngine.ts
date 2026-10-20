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
      });
      return;
    }

    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    this.updateState({
      status: isOnline ? 'signed_in' : 'offline',
      ownerEmail: email || undefined,
      errorMessage: undefined,
    });

    if (isOnline) {
      this.scheduleSync(500);
    }
  }

  public async updatePendingCount(): Promise<number> {
    try {
      const count = await syncDb.syncMutations.where('status').equals('pending').count();
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
        entityType,
        entityId,
        operation,
        payload,
        clientTimestamp: new Date().toISOString(),
        status: 'pending',
        retryCount: 0,
        createdAt: new Date().toISOString(),
      };

      await syncDb.syncMutations.put(mutation);
      await this.updatePendingCount();

      if (this.currentUserId && navigator.onLine) {
        this.scheduleSync(1000);
      }
    } catch (err) {
      console.warn('Failed to enqueue sync mutation:', err);
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

    const pending = await syncDb.syncMutations
      .where('status')
      .equals('pending')
      .limit(50)
      .toArray();

    if (!pending.length) return;

    for (const mut of pending) {
      try {
        await this.applyOutboxMutation(mut, userId);
        await syncDb.syncMutations.delete(mut.id);
      } catch (err) {
        console.warn(`Mutation push failed for ${mut.id}:`, err);
        const retryCount = mut.retryCount + 1;
        const lastError = err instanceof Error ? err.message : 'Unknown network failure';
        await syncDb.syncMutations.update(mut.id, {
          retryCount,
          lastError,
          status: retryCount > 5 ? 'failed' : 'pending',
        });
      }
    }
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
      // Soft delete on cloud
      const { error } = await supabase
        .from(tableName)
        .update({ is_deleted: true, updated_at: new Date().toISOString() })
        .eq('id', mut.entityId)
        .eq('user_id', userId);

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
    const { data: remoteTasks, error: taskErr } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .eq('is_deleted', false);

    if (!taskErr && remoteTasks) {
      for (const remoteRow of remoteTasks) {
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
    }

    // Pull projects
    const { data: remoteProjects, error: projErr } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .eq('is_deleted', false);

    if (!projErr && remoteProjects) {
      for (const remoteRow of remoteProjects) {
        const local = await db.projects.get(remoteRow.id);
        const remoteProj = mappers.project.toLocal(remoteRow);

        if (!local) {
          await db.projects.put(remoteProj);
        } else {
          const { resolved } = resolveGenericLWW(local, remoteProj);
          await db.projects.put(resolved);
        }
      }
    }

    // Pull milestones
    const { data: remoteMilestones } = await supabase
      .from('milestones')
      .select('*')
      .eq('user_id', userId)
      .eq('is_deleted', false);

    if (remoteMilestones) {
      for (const row of remoteMilestones) {
        await db.milestones.put(mappers.milestone.toLocal(row));
      }
    }

    // Pull academics (semesters, subjects, assignments)
    const { data: remoteSemesters } = await supabase
      .from('semesters')
      .select('*')
      .eq('user_id', userId)
      .eq('is_deleted', false);
    if (remoteSemesters) {
      for (const row of remoteSemesters) {
        await db.semesters.put(mappers.semester.toLocal(row));
      }
    }

    const { data: remoteSubjects } = await supabase
      .from('subjects')
      .select('*')
      .eq('user_id', userId)
      .eq('is_deleted', false);
    if (remoteSubjects) {
      for (const row of remoteSubjects) {
        await db.subjects.put(mappers.subject.toLocal(row));
      }
    }

    const { data: remoteAssignments } = await supabase
      .from('assignments')
      .select('*')
      .eq('user_id', userId)
      .eq('is_deleted', false);
    if (remoteAssignments) {
      for (const row of remoteAssignments) {
        await db.assignments.put(mappers.assignment.toLocal(row));
      }
    }

    // Pull calendar events
    const { data: remoteEvents } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('user_id', userId)
      .eq('is_deleted', false);
    if (remoteEvents) {
      for (const row of remoteEvents) {
        await db.calendarEvents.put(mappers.calendarEvent.toLocal(row));
      }
    }

    // Pull goals & links
    const { data: remoteGoals } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .eq('is_deleted', false);
    if (remoteGoals) {
      for (const row of remoteGoals) {
        await db.goals.put(mappers.goal.toLocal(row));
      }
    }

    const { data: remoteLinks } = await supabase
      .from('goal_task_links')
      .select('*')
      .eq('user_id', userId)
      .eq('is_deleted', false);
    if (remoteLinks) {
      for (const row of remoteLinks) {
        await db.goalTaskLinks.put(mappers.goalTaskLink.toLocal(row));
      }
    }

    // Pull workspace assets (covers, screenshots, attachments)
    const { data: remoteAssets } = await supabase
      .from('workspace_assets')
      .select('*')
      .eq('user_id', userId);
    if (remoteAssets) {
      for (const row of remoteAssets) {
        if (row.owner_type !== 'profile') {
          await db.assetBlobs.put(mappers.assetBlob.toLocal(row));
        }
      }
    }

    // Pull profile settings & avatar
    const { data: remoteProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

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

      await db.settings.update('default', {
        displayName: remoteProfile.display_name || currentSettings?.displayName || 'My Workspace',
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

  /**
   * Upload all local records to the cloud account.
   * Used on initial authenticated consent.
   */
  public async uploadAllLocalData(userId: string): Promise<{ success: boolean; count: number; error?: string }> {
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

      let uploadCount = 0;

      if (settings) {
        let avatarData: string | null = null;
        if (settings.avatarBlobId) {
          const blob = await db.assetBlobs.get(settings.avatarBlobId);
          if (blob?.data) {
            avatarData = blob.data;
          }
        }
        await supabase.from('profiles').upsert(
          mappers.settings.toRemote(settings, userId, this.currentUserEmail || undefined, avatarData)
        );
        uploadCount++;
      }

      if (projects.length) {
        const rows = projects.map((p) => mappers.project.toRemote(p, userId));
        await supabase.from('projects').upsert(rows);
        uploadCount += projects.length;
      }

      if (tasks.length) {
        const rows = tasks.map((t) => mappers.task.toRemote(t, userId));
        await supabase.from('tasks').upsert(rows);
        uploadCount += tasks.length;
      }

      if (milestones.length) {
        const rows = milestones.map((m) => mappers.milestone.toRemote(m, userId));
        await supabase.from('milestones').upsert(rows);
        uploadCount += milestones.length;
      }

      if (semesters.length) {
        const rows = semesters.map((s) => mappers.semester.toRemote(s, userId));
        await supabase.from('semesters').upsert(rows);
        uploadCount += semesters.length;
      }

      if (subjects.length) {
        const rows = subjects.map((s) => mappers.subject.toRemote(s, userId));
        await supabase.from('subjects').upsert(rows);
        uploadCount += subjects.length;
      }

      if (assignments.length) {
        const rows = assignments.map((a) => mappers.assignment.toRemote(a, userId));
        await supabase.from('assignments').upsert(rows);
        uploadCount += assignments.length;
      }

      if (calendarEvents.length) {
        const rows = calendarEvents.map((e) => mappers.calendarEvent.toRemote(e, userId));
        await supabase.from('calendar_events').upsert(rows);
        uploadCount += calendarEvents.length;
      }

      if (goals.length) {
        const rows = goals.map((g) => mappers.goal.toRemote(g, userId));
        await supabase.from('goals').upsert(rows);
        uploadCount += goals.length;
      }

      if (goalTaskLinks.length) {
        const rows = goalTaskLinks.map((l) => mappers.goalTaskLink.toRemote(l, userId));
        await supabase.from('goal_task_links').upsert(rows);
        uploadCount += goalTaskLinks.length;
      }

      if (focusSelections.length) {
        const rows = focusSelections.map((f) => mappers.focusSelection.toRemote(f, userId));
        await supabase.from('focus_selections').upsert(rows);
        uploadCount += focusSelections.length;
      }

      const nonProfileAssets = assetBlobs.filter((b) => b.ownerType !== 'profile');
      if (nonProfileAssets.length) {
        const rows = nonProfileAssets.map((b) => mappers.assetBlob.toRemote(b, userId));
        await supabase.from('workspace_assets').upsert(rows);
        uploadCount += nonProfileAssets.length;
      }

      return { success: true, count: uploadCount };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Initial upload failed';
      return { success: false, count: 0, error: message };
    }
  }
}

export const syncEngine = new SyncEngine();
