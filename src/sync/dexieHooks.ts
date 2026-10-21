import Dexie, { type Table } from 'dexie';
import type { NemoDatabase } from '@/db/nemoDb';
import { syncEngine } from './syncEngine';
import type { SyncEntityType, SyncMutation } from '@/domain/types';

type SyncableTable = Table<any, any>;

/**
 * Register write-ahead log hooks. The outbox lives in the same IndexedDB
 * database as workspace data, so each mutation is committed or rolled back
 * with the entity write.
 */
export function registerDexieSyncHooks(database: NemoDatabase) {
  const syncableTables: Array<{ table: SyncableTable; entityType: SyncEntityType }> = [
    { table: database.projects, entityType: 'project' },
    { table: database.tasks, entityType: 'task' },
    { table: database.milestones, entityType: 'milestone' },
    { table: database.semesters, entityType: 'semester' },
    { table: database.subjects, entityType: 'subject' },
    { table: database.assignments, entityType: 'assignment' },
    { table: database.calendarEvents, entityType: 'calendarEvent' },
    { table: database.goals, entityType: 'goal' },
    { table: database.goalTaskLinks, entityType: 'goalTaskLink' },
    { table: database.focusSelections, entityType: 'focusSelection' },
    { table: database.settings, entityType: 'settings' },
    { table: database.assetBlobs, entityType: 'assetBlob' },
  ];

  const createMutation = (
    entityType: SyncEntityType,
    entityId: string,
    operation: SyncMutation['operation'],
    payload: Record<string, unknown>
  ): SyncMutation => {
    const now = new Date().toISOString();
    return {
      id: `mut_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      ownerUserId: syncEngine.getAuthenticatedUserId() || undefined,
      entityType,
      entityId,
      operation,
      payload,
      clientTimestamp: now,
      status: 'pending',
      retryCount: 0,
      createdAt: now,
    };
  };

  for (const { table, entityType } of syncableTables) {
    if (!table) continue;

    table.hook('creating', (primKey: any, obj: any) => {
      if (syncEngine.isIngestingRemote()) return;
      const entityId = obj?.id || String(primKey);
      void database.syncMutations.put(createMutation(entityType, entityId, 'UPSERT', { ...obj }));
      syncEngine.onLocalMutation();
    });

    table.hook('updating', (modifications: any, primKey: any, obj: any) => {
      if (syncEngine.isIngestingRemote()) return;
      const entityId = obj?.id || String(primKey);
      void database.syncMutations.put(createMutation(entityType, entityId, 'UPSERT', { ...obj, ...modifications }));
      syncEngine.onLocalMutation();
    });

    table.hook('deleting', (primKey: any) => {
      if (syncEngine.isIngestingRemote()) return;
      const entityId = String(primKey);
      void database.syncMutations.put(createMutation(entityType, entityId, 'DELETE', { id: entityId }));
      syncEngine.onLocalMutation();
    });

    // A direct table write creates a transaction with only that table. Wrap it
    // so its outbox hook can write both stores atomically. Existing multi-table
    // transactions include syncMutations at their call sites.
    for (const methodName of ['add', 'put', 'update', 'delete', 'bulkAdd', 'bulkPut', 'bulkDelete'] as const) {
      const original = (table as any)[methodName].bind(table);
      (table as any)[methodName] = (...args: unknown[]) => {
        const transaction = Dexie.currentTransaction;
        if (transaction?.db === database) {
          return original(...args);
        }
        return database.transaction('rw', [table, database.syncMutations], () => original(...args));
      };
    }
  }
}
