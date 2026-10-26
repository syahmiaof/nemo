import React, { useState } from 'react';
import { Cloud, CloudOff, RefreshCw, AlertCircle, Database, Check } from 'lucide-react';
import { useAuth } from '@/features/auth/AuthContext';
import { useSync } from '@/sync/useSync';
import { useToast } from '@/components/ui/Toast';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

export const SyncIndicator: React.FC = () => {
  const { user, openAuthModal } = useAuth();
  const { status, isSyncing, triggerForceSync } = useSync();
  const { success, error } = useToast();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const handleClick = () => {
    if (!user) {
      openAuthModal();
      return;
    }
    setIsConfirmOpen(true);
  };

  const handleForceSync = async () => {
    setIsConfirmOpen(false);
    try {
      const result = await triggerForceSync();
      if (result.success) {
        success('Force sync complete', `${result.count} local records uploaded and cloud updates downloaded.`);
      } else {
        error('Force sync failed', result.error || 'Check your connection and retry.');
      }
    } catch (syncError) {
      error('Force sync failed', syncError instanceof Error ? syncError.message : 'Check your connection and retry.');
    }
  };

  const getTooltip = () => {
    if (!user) return 'Local Mode · Sign in to force sync';
    if (isSyncing) return 'Uploading local records and downloading cloud updates...';
    if (status === 'up_to_date') return `Synced with ${user.email} · Click to force sync all local records`;
    if (status === 'offline') return 'Offline · Changes saved locally in IndexedDB';
    if (status === 'error') return 'Sync error · Click to retry';
    return `Connected (${user.email}) · Click to force sync all local records`;
  };

  return (
    <>
      <button
        onClick={handleClick}
        className={`header-time-pill flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs transition-colors cursor-pointer ${
          !user
            ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20 shadow-sm animate-pulse'
            : 'bg-surface border-border-subtle hover:border-border-emphasis text-content-secondary hover:text-content-primary'
        }`}
        title={getTooltip()}
        aria-label={user ? 'Force sync local workspace with cloud' : 'Sign in to force sync'}
        disabled={isSyncing && !!user}
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
            <span className="hidden md:inline text-[11px] font-medium text-accent-mint">Force Sync</span>
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
            <span className="hidden md:inline text-[11px] font-medium text-blue-400">Force Sync</span>
          </>
        ) : (
          <>
            <Database className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[11px] font-semibold text-amber-300">Sign In to Sync</span>
          </>
        )}
      </button>
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleForceSync}
        title="Force sync this device?"
        description="This uploads all records stored on this device to your cloud workspace, then downloads cloud updates. If this device has older data, its records may replace newer cloud values. Continue from the device with the latest data."
        confirmLabel="Upload and sync"
        cancelLabel="Cancel"
        variant="primary"
        isLoading={isSyncing}
      />
    </>
  );
};
