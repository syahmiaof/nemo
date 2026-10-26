import { useState, useEffect } from 'react';
import { syncEngine } from './syncEngine';
import type { SyncState } from '@/domain/types';

export function useSync() {
  const [syncState, setSyncState] = useState<SyncState>(syncEngine.getState());
  const [isSyncing, setIsSyncing] = useState<boolean>(syncState.status === 'syncing');

  useEffect(() => {
    const unsubscribe = syncEngine.subscribe((newState) => {
      setSyncState(newState);
      setIsSyncing(newState.status === 'syncing');
    });
    return unsubscribe;
  }, []);

  const triggerSync = async () => {
    setIsSyncing(true);
    try {
      return await syncEngine.syncNow();
    } finally {
      setIsSyncing(syncEngine.getState().status === 'syncing');
    }
  };

  const triggerForceSync = async () => {
    setIsSyncing(true);
    try {
      return await syncEngine.forceSync();
    } finally {
      setIsSyncing(syncEngine.getState().status === 'syncing');
    }
  };

  return {
    ...syncState,
    isSyncing,
    triggerSync,
    triggerForceSync,
  };
}
