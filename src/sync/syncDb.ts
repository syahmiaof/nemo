import Dexie, { type EntityTable } from 'dexie';
import type { SyncMutation } from '@/domain/types';

export class NemoSyncDatabase extends Dexie {
  syncMutations!: EntityTable<SyncMutation, 'id'>;

  constructor(name = 'nemo_sync') {
    super(name);
    this.version(1).stores({
      syncMutations: 'id, entityType, entityId, status, createdAt',
    });
  }
}

export const syncDb = new NemoSyncDatabase();
