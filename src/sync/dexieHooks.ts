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
    { table: database.hydrationLogs, entityType: 'hydrationLog' },
    { table: database.dietLogs, entityType: 'dietLog' },
    { table: database.workoutLogs, entityType: 'workoutLog' },
    { table: database.bodyMetrics, entityType: 'bodyMetric' },
    { table: database.financialProfiles, entityType: 'financialProfile' },
    { table: database.financialCommitments, entityType: 'financialCommitment' },
    { table: database.debts, entityType: 'debtItem' },
    { table: database.debtPayments, entityType: 'debtPayment' },
    { table: database.wishlistItems, entityType: 'wishlistItem' },
    { table: database.savingsGoals, entityType: 'savingsGoal' },
    { table: database.savingsDeposits, entityType: 'savingsDeposit' },
    { table: database.visionItems, entityType: 'visionItem' },
    { table: database.monthlyRoadmaps, entityType: 'monthlyRoadmap' },
    { table: database.incomeItems, entityType: 'incomeItem' },
    { table: database.ibadahDailyLogs, entityType: 'ibadahDailyLog' },
    { table: database.qadhaPrayers, entityType: 'qadhaPrayer' },
    { table: database.qadhaFastings, entityType: 'qadhaFasting' },
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

    const safelyRecordMutation = (
      entityType: SyncEntityType,
      entityId: string,
      operation: SyncMutation['operation'],
      payload: Record<string, unknown>
    ) => {
      if (syncEngine.isIngestingRemote()) return;
      const mutation = createMutation(entityType, entityId, operation, payload);

      const currentTx = Dexie.currentTransaction;
      const hasSyncMutations = (tx: any): boolean => {
        if (!tx) return false;
        if (tx.storeNames) {
          if (typeof tx.storeNames.contains === 'function') return tx.storeNames.contains('syncMutations');
          if (typeof tx.storeNames.includes === 'function') return tx.storeNames.includes('syncMutations');
        }
        return Boolean(tx.tables?.['syncMutations'] || tx._tables?.['syncMutations']);
      };
      const isSyncMutationsInTx = Boolean(currentTx && currentTx.db === database && hasSyncMutations(currentTx));

      if (isSyncMutationsInTx) {
        void database.syncMutations.put(mutation);
        syncEngine.onLocalMutation();
      } else {
        setTimeout(async () => {
          try {
            await database.syncMutations.put(mutation);
            syncEngine.onLocalMutation();
          } catch (err) {
            console.warn('Failed to enqueue deferred sync mutation:', err);
          }
        }, 0);
      }
    };

    table.hook('creating', (primKey: any, obj: any) => {
      const entityId = obj?.id || String(primKey);
      safelyRecordMutation(entityType, entityId, 'UPSERT', { ...obj });
    });

    table.hook('updating', (modifications: any, primKey: any, obj: any) => {
      const entityId = obj?.id || String(primKey);
      safelyRecordMutation(entityType, entityId, 'UPSERT', { ...obj, ...modifications });
    });

    table.hook('deleting', (primKey: any) => {
      const entityId = String(primKey);
      safelyRecordMutation(entityType, entityId, 'DELETE', { id: entityId });
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
