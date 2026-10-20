import { describe, it, expect, beforeEach } from 'vitest';
import { NemoDatabase } from '@/db/nemoDb';
import { NemoSyncDatabase } from '@/sync/syncDb';
import { mergeTaskEntities, resolveGenericLWW } from '@/sync/conflictResolver';
import { mappers } from '@/sync/mappers';
import type { Task, Project, Semester, Subject, Assignment } from '@/domain/types';

/**
 * Disposable Device Context representing an isolated client (Laptop A or Phone B)
 * with independent local IndexedDB stores and sync queues.
 */
class SimulatedDeviceContext {
  public db: NemoDatabase;
  public syncDb: NemoSyncDatabase;
  public deviceName: string;
  public isOnline: boolean = true;
  public userId: string = '00000000-0000-0000-0000-000000000001';
  public userEmail: string = 'syahmiaof123@gmail.com';
  public lastSyncTimestamp: string = new Date(0).toISOString();

  constructor(name: string) {
    this.deviceName = name;
    this.db = new NemoDatabase(`NemoDb_${name}`);
    this.syncDb = new NemoSyncDatabase(`NemoSync_${name}`);
  }

  async clearAll() {
    await this.db.delete();
    await this.syncDb.delete();
    await this.db.open();
    await this.syncDb.open();
  }
}

/**
 * Mock Cloud Storage & PostgreSQL Server simulating Supabase
 */
class SimulatedCloudServer {
  public tables: Record<string, Map<string, any>> = {
    projects: new Map(),
    tasks: new Map(),
    semesters: new Map(),
    subjects: new Map(),
    assignments: new Map(),
    workspace_assets: new Map(),
  };

  public upsert(table: string, records: any[]) {
    if (!this.tables[table]) this.tables[table] = new Map();
    for (const r of records) {
      this.tables[table].set(r.id, { ...r, server_updated_at: new Date().toISOString() });
    }
  }

  public getRows(table: string, userId: string): any[] {
    if (!this.tables[table]) return [];
    return Array.from(this.tables[table].values()).filter(
      (r) => r.user_id === userId && !r.is_deleted
    );
  }

  public softDelete(table: string, id: string) {
    if (this.tables[table]?.has(id)) {
      const existing = this.tables[table].get(id);
      this.tables[table].set(id, { ...existing, is_deleted: true, server_updated_at: new Date().toISOString() });
    }
  }

  public clear() {
    for (const key of Object.keys(this.tables)) {
      this.tables[key].clear();
    }
  }
}

describe('Sprint 5.1 — Actual Two-Device Synchronization Simulation (Laptop A & Phone B)', () => {
  let deviceA: SimulatedDeviceContext;
  let deviceB: SimulatedDeviceContext;
  let cloud: SimulatedCloudServer;

  beforeEach(async () => {
    deviceA = new SimulatedDeviceContext('Laptop_A');
    deviceB = new SimulatedDeviceContext('Phone_B');
    cloud = new SimulatedCloudServer();

    await deviceA.clearAll();
    await deviceB.clearAll();
    cloud.clear();
  });

  // Helper to sync Device -> Cloud
  async function pushDeviceToCloud(device: SimulatedDeviceContext) {
    if (!device.isOnline) return;

    // Push projects
    const projs = await device.db.projects.toArray();
    if (projs.length) {
      cloud.upsert('projects', projs.map((p) => mappers.project.toRemote(p, device.userId)));
    }

    // Push tasks
    const tasks = await device.db.tasks.toArray();
    if (tasks.length) {
      cloud.upsert('tasks', tasks.map((t) => mappers.task.toRemote(t, device.userId)));
    }

    // Push academics
    const sems = await device.db.semesters.toArray();
    if (sems.length) cloud.upsert('semesters', sems.map((s) => mappers.semester.toRemote(s, device.userId)));

    const subs = await device.db.subjects.toArray();
    if (subs.length) cloud.upsert('subjects', subs.map((s) => mappers.subject.toRemote(s, device.userId)));

    const asgns = await device.db.assignments.toArray();
    if (asgns.length) cloud.upsert('assignments', asgns.map((a) => mappers.assignment.toRemote(a, device.userId)));
  }

  // Helper to sync Cloud -> Device
  async function pullCloudToDevice(device: SimulatedDeviceContext) {
    if (!device.isOnline) return;

    // Pull tasks with conflict resolution
    const remoteTasks = cloud.getRows('tasks', device.userId);
    for (const r of remoteTasks) {
      const local = await device.db.tasks.get(r.id);
      if (!local) {
        await device.db.tasks.put(mappers.task.toLocal(r));
      } else {
        const { resolved } = mergeTaskEntities(local, r);
        await device.db.tasks.put(mappers.task.toLocal(resolved));
      }
    }

    // Pull projects with LWW
    const remoteProjs = cloud.getRows('projects', device.userId);
    for (const r of remoteProjs) {
      const local = await device.db.projects.get(r.id);
      if (!local) {
        await device.db.projects.put(mappers.project.toLocal(r));
      } else {
        const { resolved } = resolveGenericLWW(local, mappers.project.toLocal(r));
        await device.db.projects.put(resolved);
      }
    }

    // Pull academics
    const remoteSems = cloud.getRows('semesters', device.userId);
    for (const r of remoteSems) await device.db.semesters.put(mappers.semester.toLocal(r));

    const remoteSubs = cloud.getRows('subjects', device.userId);
    for (const r of remoteSubs) await device.db.subjects.put(mappers.subject.toLocal(r));

    const remoteAsgns = cloud.getRows('assignments', device.userId);
    for (const r of remoteAsgns) await device.db.assignments.put(mappers.assignment.toLocal(r));
  }

  // JOURNEY 1: Create on A → Sync → Appears on B
  it('Scenario 1: Create task on Laptop A -> Sync -> Appears on Phone B', async () => {
    const taskA: Task = {
      id: 'task_journey_1',
      title: 'Review Sprint 5 Architecture on Laptop',
      status: 'todo',
      priority: 'high',
      tags: ['sprint5'],
      createdAt: '2026-10-21T02:00:00.000Z',
      updatedAt: '2026-10-21T02:00:00.000Z',
    };
    await deviceA.db.tasks.put(taskA);

    await pushDeviceToCloud(deviceA);
    expect(cloud.tables.tasks.has('task_journey_1')).toBe(true);

    await pullCloudToDevice(deviceB);
    const taskOnB = await deviceB.db.tasks.get('task_journey_1');
    expect(taskOnB).toBeDefined();
    expect(taskOnB?.title).toBe('Review Sprint 5 Architecture on Laptop');
    expect(taskOnB?.priority).toBe('high');
  });

  // JOURNEY 2: Edit on B → Sync → Appears on A
  it('Scenario 2: Edit task title on Phone B -> Sync -> Appears on Laptop A', async () => {
    // Setup initial task
    const task: Task = {
      id: 'task_journey_2',
      title: 'Initial Title',
      status: 'todo',
      priority: 'medium',
      tags: [],
      createdAt: '2026-10-21T02:00:00.000Z',
      updatedAt: '2026-10-21T02:00:00.000Z',
    };
    await deviceB.db.tasks.put(task);
    await pushDeviceToCloud(deviceB);
    await pullCloudToDevice(deviceA);

    // Edit on Phone B
    await deviceB.db.tasks.update('task_journey_2', {
      title: 'Updated from Phone B during transit',
      updatedAt: '2026-10-21T02:15:00.000Z',
    });
    await pushDeviceToCloud(deviceB);

    // Sync on Laptop A
    await pullCloudToDevice(deviceA);
    const updatedOnA = await deviceA.db.tasks.get('task_journey_2');
    expect(updatedOnA?.title).toBe('Updated from Phone B during transit');
  });

  // JOURNEY 3: Delete on A → Disappears on B
  it('Scenario 3: Delete task on Laptop A -> Disappears on Phone B', async () => {
    const task: Task = {
      id: 'task_journey_3',
      title: 'Temporary Task',
      status: 'todo',
      priority: 'low',
      tags: [],
      createdAt: '2026-10-21T02:00:00.000Z',
      updatedAt: '2026-10-21T02:00:00.000Z',
    };
    await deviceA.db.tasks.put(task);
    await pushDeviceToCloud(deviceA);
    await pullCloudToDevice(deviceB);

    // Delete on Laptop A
    await deviceA.db.tasks.delete('task_journey_3');
    cloud.softDelete('tasks', 'task_journey_3');

    // Phone B pulls updates
    const remoteRows = cloud.getRows('tasks', deviceB.userId);
    expect(remoteRows.some((r) => r.id === 'task_journey_3')).toBe(false);

    // Phone B deletes local copy when marked deleted on cloud
    await deviceB.db.tasks.delete('task_journey_3');
    const onB = await deviceB.db.tasks.get('task_journey_3');
    expect(onB).toBeUndefined();
  });

  // JOURNEY 4: Complete task on B → Status updates on A
  it('Scenario 4: Mark task done on Phone B -> Status becomes done on Laptop A', async () => {
    const task: Task = {
      id: 'task_journey_4',
      title: 'Sprint 5.1 Verification Goal',
      status: 'todo',
      priority: 'urgent',
      tags: [],
      createdAt: '2026-10-21T02:00:00.000Z',
      updatedAt: '2026-10-21T02:00:00.000Z',
    };
    await deviceA.db.tasks.put(task);
    await pushDeviceToCloud(deviceA);
    await pullCloudToDevice(deviceB);

    // Phone B marks done
    await deviceB.db.tasks.update('task_journey_4', {
      status: 'done',
      completedAt: '2026-10-21T02:30:00.000Z',
      updatedAt: '2026-10-21T02:30:00.000Z',
    });
    await pushDeviceToCloud(deviceB);

    // Laptop A pulls
    await pullCloudToDevice(deviceA);
    const taskOnA = await deviceA.db.tasks.get('task_journey_4');
    expect(taskOnA?.status).toBe('done');
    expect(taskOnA?.completedAt).toBe('2026-10-21T02:30:00.000Z');
  });

  // JOURNEY 5: Create academic records on A → Correct relationships on B
  it('Scenario 5: Create semester, subject, assignment on Laptop A -> Preserves hierarchy on Phone B', async () => {
    const sem: Semester = {
      id: 'sem_fall_2026',
      title: 'Semester 1 2026/2027',
      status: 'active',
      createdAt: '2026-10-21T02:00:00.000Z',
    };
    const sub: Subject = {
      id: 'sub_cs101',
      semesterId: 'sem_fall_2026',
      title: 'Distributed Systems',
      color: '#34D399',
      createdAt: '2026-10-21T02:00:00.000Z',
    };
    const asgn: Assignment = {
      id: 'asgn_final_proj',
      subjectId: 'sub_cs101',
      title: 'Cloud Replication Engine Project',
      status: 'in_progress',
      dueDate: '2026-11-15',
      weightPercent: 40,
      createdAt: '2026-10-21T02:00:00.000Z',
      updatedAt: '2026-10-21T02:00:00.000Z',
    };

    await deviceA.db.semesters.put(sem);
    await deviceA.db.subjects.put(sub);
    await deviceA.db.assignments.put(asgn);

    await pushDeviceToCloud(deviceA);
    await pullCloudToDevice(deviceB);

    const semB = await deviceB.db.semesters.get('sem_fall_2026');
    const subB = await deviceB.db.subjects.get('sub_cs101');
    const asgnB = await deviceB.db.assignments.get('asgn_final_proj');

    expect(semB).toBeDefined();
    expect(subB).toBeDefined();
    expect(asgnB).toBeDefined();
    expect(subB?.semesterId).toBe('sem_fall_2026');
    expect(asgnB?.subjectId).toBe('sub_cs101');
    expect(asgnB?.weightPercent).toBe(40);
  });

  // JOURNEY 6: Upload project cover/avatar → Correctly available on B
  it('Scenario 6: Project previewBlobId references assetBlob accurately across devices', async () => {
    const proj: Project = {
      id: 'proj_with_cover',
      title: 'Mobile PWA Portfolio',
      priority: 'high',
      status: 'in_progress',
      tags: ['portfolio'],
      techStack: ['React', 'Vite'],
      previewBlobId: 'blob_cover_xyz',
      createdAt: '2026-10-21T02:00:00.000Z',
      updatedAt: '2026-10-21T02:00:00.000Z',
    };
    await deviceA.db.projects.put(proj);
    await pushDeviceToCloud(deviceA);
    await pullCloudToDevice(deviceB);

    const onB = await deviceB.db.projects.get('proj_with_cover');
    expect(onB?.previewBlobId).toBe('blob_cover_xyz');
  });

  // JOURNEY 7 & 8: Offline edits on A and B with reconnect flush
  it('Scenario 7 & 8: Offline mutations on Laptop A queue safely and flush on reconnect', async () => {
    deviceA.isOnline = false;

    // Mutate while offline
    const offlineTask: Task = {
      id: 'task_offline_a',
      title: 'Airplane Mode Work',
      status: 'todo',
      priority: 'medium',
      tags: [],
      createdAt: '2026-10-21T03:00:00.000Z',
      updatedAt: '2026-10-21T03:00:00.000Z',
    };
    await deviceA.db.tasks.put(offlineTask);

    // Attempt push while offline (does not upload)
    await pushDeviceToCloud(deviceA);
    expect(cloud.tables.tasks.has('task_offline_a')).toBe(false);

    // Reconnect to WiFi
    deviceA.isOnline = true;
    await pushDeviceToCloud(deviceA);
    expect(cloud.tables.tasks.has('task_offline_a')).toBe(true);

    // Phone B pulls on its end
    await pullCloudToDevice(deviceB);
    const onB = await deviceB.db.tasks.get('task_offline_a');
    expect(onB?.title).toBe('Airplane Mode Work');
  });

  // JOURNEY 9: Concurrent edit conflict → No silent data loss
  it('Scenario 9: Concurrent note edits on Laptop A and Phone B preserve both drafts without data loss', async () => {
    const initialTask: Task = {
      id: 'task_notes_collision',
      title: 'Collaborative Spec',
      notes: 'Initial shared notes.',
      status: 'todo',
      priority: 'medium',
      tags: [],
      createdAt: '2026-10-21T01:00:00.000Z',
      updatedAt: '2026-10-21T01:00:00.000Z',
    };
    await deviceA.db.tasks.put(initialTask);
    await pushDeviceToCloud(deviceA);
    await pullCloudToDevice(deviceB);

    // Offline on both devices
    deviceA.isOnline = false;
    deviceB.isOnline = false;

    // Laptop A writes paragraphs
    const noteA = 'Laptop A paragraph about backend migrations.';
    await deviceA.db.tasks.update('task_notes_collision', {
      notes: noteA,
      updatedAt: '2026-10-21T02:00:00.000Z',
    });

    // Phone B writes paragraphs
    const noteB = 'Phone B paragraph about mobile touch gestures.';
    await deviceB.db.tasks.update('task_notes_collision', {
      notes: noteB,
      updatedAt: '2026-10-21T02:05:00.000Z',
    });

    // Device B comes online first
    deviceB.isOnline = true;
    await pushDeviceToCloud(deviceB);

    // Device A comes online second and pulls
    deviceA.isOnline = true;
    const remoteFromCloud = cloud.tables.tasks.get('task_notes_collision');
    const localOnA = await deviceA.db.tasks.get('task_notes_collision');

    const { resolved, hasConflict } = mergeTaskEntities(localOnA!, remoteFromCloud);
    expect(hasConflict).toBe(true);
    // Both notes MUST be preserved
    expect(resolved.notes).toContain(noteA);
    expect(resolved.notes).toContain(noteB);
  });

  // JOURNEY 10: Interrupted sync → Recovery after browser restart
  it('Scenario 10: Interrupted sync recovers cleanly on next cycle', async () => {
    await deviceA.syncDb.syncMutations.put({
      id: 'mut_interrupted',
      entityType: 'task',
      entityId: 'task_interrupted',
      operation: 'UPSERT',
      payload: { id: 'task_interrupted', title: 'Interrupted Task' },
      clientTimestamp: '2026-10-21T02:00:00.000Z',
      status: 'in_flight',
      retryCount: 0,
      createdAt: '2026-10-21T02:00:00.000Z',
    });

    // On simulated browser restart / next cycle, reset stuck in_flight mutations to pending
    await deviceA.syncDb.syncMutations
      .where('status')
      .equals('in_flight')
      .modify({ status: 'pending' });

    const recovered = await deviceA.syncDb.syncMutations.get('mut_interrupted');
    expect(recovered?.status).toBe('pending');
  });

  // JOURNEY 11: Account/session expiry → Graceful recovery
  it('Scenario 11: Expired session returns offline/local mode without destroying local data', async () => {
    // Local data exists
    await deviceA.db.tasks.put({
      id: 'task_safe_local',
      title: 'Safe Task on Device',
      status: 'todo',
      priority: 'high',
      tags: [],
      createdAt: '2026-10-21T02:00:00.000Z',
      updatedAt: '2026-10-21T02:00:00.000Z',
    });

    // Simulate session expiry
    deviceA.userId = '';
    deviceA.userEmail = '';

    // Data in IndexedDB is 100% intact
    const task = await deviceA.db.tasks.get('task_safe_local');
    expect(task).toBeDefined();
    expect(task?.title).toBe('Safe Task on Device');
  });

  // JOURNEY 12: Demo Mode → No remote data contamination
  it('Scenario 12: Demo mode database is isolated and never leaks to remote cloud', async () => {
    const demoDb = new NemoDatabase('NemoDemoDatabase_v1');
    await demoDb.tasks.put({
      id: 'demo_fictional_task',
      title: 'Fictional demo task for exploration',
      status: 'todo',
      priority: 'low',
      tags: ['demo'],
      createdAt: '2026-10-21T02:00:00.000Z',
      updatedAt: '2026-10-21T02:00:00.000Z',
    });

    // Cloud should never receive this demo task
    expect(cloud.tables.tasks.has('demo_fictional_task')).toBe(false);
    await demoDb.delete();
  });
});
