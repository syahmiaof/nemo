import type { NemoDatabase } from '@/db/nemoDb';
import { syncEngine } from './syncEngine';
import type { SyncEntityType } from '@/domain/types';

export function registerDexieSyncHooks(database: NemoDatabase) {
  const syncableTables: Array<{ table: any; entityType: SyncEntityType }> = [
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

  for (const { table, entityType } of syncableTables) {
    if (!table) continue;

    table.hook('creating', function (_primKey: any, obj: any) {
      if (syncEngine.isIngestingRemote()) return;
      const entityId = obj?.id || String(_primKey);
      const snapshot = { ...obj };
      setTimeout(() => {
        syncEngine.enqueueMutation(entityType, entityId, 'UPSERT', snapshot).catch(() => {});
      }, 0);
    });

    table.hook('updating', function (modifications: any, _primKey: any, obj: any) {
      if (syncEngine.isIngestingRemote()) return;
      const entityId = obj?.id || String(_primKey);
      const updated = { ...obj, ...modifications };
      setTimeout(() => {
        syncEngine.enqueueMutation(entityType, entityId, 'UPSERT', updated).catch(() => {});
      }, 0);
    });

    table.hook('deleting', function (primKey: any) {
      if (syncEngine.isIngestingRemote()) return;
      const entityId = String(primKey);
      setTimeout(() => {
        syncEngine.enqueueMutation(entityType, entityId, 'DELETE', { id: entityId }).catch(() => {});
      }, 0);
    });
  }
}
