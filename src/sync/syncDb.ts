import Dexie, { type EntityTable } from 'dexie';
import type { SyncMutation } from '@/domain/types';

export class NemoSyncDatabase extends Dexie {
  syncMutations!: EntityTable<SyncMutation, 'id'>;

  constructor(name = 'nemo_sync') {
    super(name);
    this.version(1).stores({
      syncMutations: 'id, entityType, entityId, status, createdAt',
    });
    // v1 mutations intentionally remain ownerless after this upgrade. They are
    // quarantined until the workspace owner explicitly chooses a recovery path.
    this.version(2).stores({
      syncMutations: 'id, entityType, entityId, status, createdAt, ownerUserId, [ownerUserId+status]',
    });
  }
}

export const syncDb = new NemoSyncDatabase();
