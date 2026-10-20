import React from 'react';
import { Cloud, CloudOff, RefreshCw, AlertCircle, Database, Check } from 'lucide-react';
import { useAuth } from '@/features/auth/AuthContext';
import { useSync } from '@/sync/useSync';

export const SyncIndicator: React.FC = () => {
  const { user, openAuthModal } = useAuth();
  const { status, isSyncing, triggerSync } = useSync();

  const handleClick = () => {
    if (!user) {
      openAuthModal();
    } else {
      triggerSync();
    }
  };

  const getTooltip = () => {
    if (!user) return 'Local Mode · Click to sign in & sync cloud';
    if (isSyncing) return 'Syncing data with Supabase...';
    if (status === 'up_to_date') return `Synced with ${user.email} · Click to sync now`;
    if (status === 'offline') return 'Offline · Changes saved locally in IndexedDB';
    if (status === 'error') return 'Sync error · Click to retry';
    return `Connected (${user.email})`;
  };

  return (
    <button
      onClick={handleClick}
      className="header-time-pill flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface border border-border-subtle hover:border-border-emphasis text-xs text-content-secondary hover:text-content-primary transition-colors cursor-pointer"
      title={getTooltip()}
      aria-label="Cloud Sync Status"
    >
      {isSyncing ? (
        <>
          <RefreshCw className="w-3.5 h-3.5 text-accent-amber animate-spin" />
          <span className="hidden md:inline text-[11px] font-medium text-accent-amber">Syncing...</span>
        </>
      ) : status === 'up_to_date' ? (
        <>
          <div className="relative flex items-center justify-center">
            <Cloud className="w-3.5 h-3.5 text-accent-mint" />
            <Check className="w-2 h-2 text-accent-mint absolute -bottom-0.5 -right-0.5 stroke-[3]" />
          </div>
          <span className="hidden md:inline text-[11px] font-medium text-accent-mint">Cloud Sync</span>
        </>
      ) : status === 'offline' ? (
        <>
          <CloudOff className="w-3.5 h-3.5 text-content-tertiary" />
          <span className="hidden md:inline text-[11px] font-medium text-content-tertiary">Offline</span>
        </>
      ) : status === 'error' ? (
        <>
          <AlertCircle className="w-3.5 h-3.5 text-red-400" />
          <span className="hidden md:inline text-[11px] font-medium text-red-400">Sync Error</span>
        </>
      ) : user ? (
        <>
          <Cloud className="w-3.5 h-3.5 text-blue-400" />
          <span className="hidden md:inline text-[11px] font-medium text-blue-400">Connected</span>
        </>
      ) : (
        <>
          <Database className="w-3.5 h-3.5 text-content-tertiary" />
          <span className="hidden md:inline text-[11px] font-medium text-content-tertiary">Local</span>
        </>
      )}
    </button>
  );
};
