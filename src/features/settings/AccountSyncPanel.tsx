import React, { useState } from 'react';
import {
  Cloud,
  CloudOff,
  Check,
  RefreshCw,
  LogOut,
  AlertCircle,
  Database,
  Lock,
  UploadCloud,
} from 'lucide-react';
import { useAuth } from '@/features/auth/AuthContext';
import { useSync } from '@/sync/useSync';
import { syncEngine } from '@/sync/syncEngine';
import { useToast } from '@/components/ui/Toast';

export const AccountSyncPanel: React.FC = () => {
  const { user, openAuthModal, signOut } = useAuth();
  const { status, lastSyncAt, pendingCount, errorMessage, isSyncing, triggerSync } = useSync();
  const { success, error: toastError } = useToast();
  const [isUploading, setIsUploading] = useState(false);

  const handleManualSync = async () => {
    const res = await triggerSync();
    if (res.success) {
      success('Sinkronisasi Berjaya', 'Semua perubahan telah diselaraskan.');
    } else {
      toastError('Gagal Sinkron', res.error || 'Sila semak sambungan internet anda.');
    }
  };

  const handleInitialUpload = async () => {
    if (!user) return;
    setIsUploading(true);
    const res = await syncEngine.uploadAllLocalData(user.id);
    setIsUploading(false);

    if (res.success) {
      success('Muat Naik Selesai', `${res.count} rekod berjaya dimuat naik ke awan.`);
    } else {
      toastError('Ralat', res.error || 'Gagal memuat naik data.');
    }
  };

  const renderStatusBadge = () => {
    switch (status) {
      case 'syncing':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/15 text-amber-300 border border-amber-500/30">
            <RefreshCw className="w-3 h-3 animate-spin" />
            Sedang Diselaraskan
          </span>
        );
      case 'up_to_date':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-mint-500/15 text-mint-400 border border-mint-500/30">
            <Check className="w-3 h-3" />
            Disegerakkan
          </span>
        );
      case 'offline':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-navy-800 text-navy-400 border border-navy-700">
            <CloudOff className="w-3 h-3" />
            Luar Talian
          </span>
        );
      case 'error':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/15 text-red-400 border border-red-500/30">
            <AlertCircle className="w-3 h-3" />
            Ralat Sambungan
          </span>
        );
      case 'signed_in':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/15 text-blue-400 border border-blue-500/30">
            <Cloud className="w-3 h-3" />
            Bersambung
          </span>
        );
      case 'local_only':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-navy-800 text-navy-400 border border-navy-700">
            <Database className="w-3 h-3" />
            Mod Tempatan
          </span>
        );
    }
  };

  return (
    <div className="space-y-4" data-enter>
      {/* Minimalist Cloud Sync Card */}
      <div className="rounded-2xl bg-surface border border-border-subtle p-5 space-y-4">
        {/* Header row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <h3 className="text-sm font-semibold text-content-primary">
              Penyegerakan Awan
            </h3>
            {renderStatusBadge()}
          </div>

          {user ? (
            <button
              onClick={handleManualSync}
              disabled={isSyncing}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-accent-mint hover:bg-accent-mint/90 text-navy-950 font-semibold text-xs transition-colors disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Sedang Sync...' : 'Sync Sekarang'}
            </button>
          ) : (
            <button
              onClick={openAuthModal}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-accent-mint hover:bg-accent-mint/90 text-navy-950 font-semibold text-xs transition-colors"
            >
              <Lock className="w-3.5 h-3.5" />
              Log Masuk Pemilik
            </button>
          )}
        </div>

        {/* Content row */}
        {user ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-3 rounded-xl bg-surface-subtle border border-border-subtle space-y-0.5">
              <span className="text-[11px] text-content-tertiary">Akaun Pemilik</span>
              <p className="text-xs font-semibold text-content-primary truncate">{user.email}</p>
            </div>

            <div className="p-3 rounded-xl bg-surface-subtle border border-border-subtle space-y-0.5">
              <span className="text-[11px] text-content-tertiary">Status Data</span>
              <p className="text-xs font-semibold text-content-primary">
                {pendingCount > 0
                  ? `${pendingCount} item menunggu sync`
                  : lastSyncAt
                  ? `Terkini (${new Date(lastSyncAt).toLocaleTimeString()})`
                  : 'Sedia disegerakkan'}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-xs text-content-secondary leading-relaxed pt-1">
            Log masuk dengan kata laluan pemilik untuk menyegerakkan data secara langsung antara komputer riba dan telefon pintar anda.
          </p>
        )}

        {errorMessage && (
          <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Minimalist actions when logged in */}
        {user && (
          <div className="flex items-center justify-between pt-2 border-t border-border-subtle text-xs">
            <button
              onClick={handleInitialUpload}
              disabled={isUploading}
              className="text-content-tertiary hover:text-content-secondary transition-colors inline-flex items-center gap-1 disabled:opacity-50"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>{isUploading ? 'Memuat naik...' : 'Muat naik data tempatan'}</span>
            </button>

            <button
              onClick={signOut}
              className="text-red-400/80 hover:text-red-400 transition-colors inline-flex items-center gap-1 font-medium"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Keluar</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
