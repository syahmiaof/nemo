import React, { useState } from 'react';
import {
  Cloud,
  CloudOff,
  Check,
  RefreshCw,
  ShieldCheck,
  Lock,
  UploadCloud,
  LogOut,
  Mail,
  AlertCircle,
  Database,
} from 'lucide-react';
import { useAuth } from '@/features/auth/AuthContext';
import { useSync } from '@/sync/useSync';
import { syncEngine } from '@/sync/syncEngine';
import { useToast } from '@/components/ui/Toast';

export const AccountSyncPanel: React.FC = () => {
  const { user, isApprovedOwner, openAuthModal, signOut } = useAuth();
  const { status, lastSyncAt, pendingCount, errorMessage, isSyncing, triggerSync } = useSync();
  const { success, error: toastError } = useToast();
  const [isInitialUploading, setIsInitialUploading] = useState(false);

  const handleManualSync = async () => {
    const res = await triggerSync();
    if (res.success) {
      success('Sinkronisasi Berjaya', 'Semua perubahan telah diselaraskan dengan cloud.');
    } else {
      toastError('Sinkronisasi Gagal', res.error || 'Sila semak sambungan internet anda.');
    }
  };

  const handleInitialUpload = async () => {
    if (!user) return;
    setIsInitialUploading(true);
    const res = await syncEngine.uploadAllLocalData(user.id);
    setIsInitialUploading(false);

    if (res.success) {
      success('Muat Naik Selesai', `Berjaya memuat naik ${res.count} rekod tempatan ke akaun cloud.`);
    } else {
      toastError('Muat Naik Gagal', res.error || 'Sila cuba sebentar lagi.');
    }
  };

  const renderStatusBadge = () => {
    switch (status) {
      case 'syncing':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            Sedang Diselaraskan
          </span>
        );
      case 'up_to_date':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-mint-500/15 text-mint-400 border border-mint-500/30">
            <div className="relative flex items-center justify-center">
              <Cloud className="w-3.5 h-3.5 text-mint-400" />
              <Check className="w-2 h-2 text-mint-400 absolute -bottom-0.5 -right-0.5 stroke-[3]" />
            </div>
            Terkini & Disegerakkan
          </span>
        );
      case 'offline':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-navy-800 text-navy-400 border border-navy-700">
            <CloudOff className="w-3.5 h-3.5" />
            Luar Talian (Offline)
          </span>
        );
      case 'error':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-500/15 text-red-400 border border-red-500/30">
            <AlertCircle className="w-3.5 h-3.5" />
            Ralat Sinkronisasi
          </span>
        );
      case 'signed_in':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/30">
            <Cloud className="w-3.5 h-3.5" />
            Bersambung ke Cloud
          </span>
        );
      case 'local_only':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-navy-800 text-navy-300 border border-navy-700">
            <Database className="w-3.5 h-3.5" />
            Mod Tempatan (Local Only)
          </span>
        );
    }
  };

  return (
    <div className="space-y-6" data-enter>
      {/* Primary Card */}
      <div className="rounded-2xl bg-surface border border-border-subtle p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <h3 className="text-base font-semibold text-content-primary">
                Penyegerakan Awan Peribadi (Supabase)
              </h3>
              {renderStatusBadge()}
            </div>
            <p className="text-xs text-content-secondary">
              Pangkalan data peribadi dihoskan di Sydney (ap-southeast-2) dengan kawalan RLS ketat.
            </p>
          </div>

          {user ? (
            <button
              onClick={handleManualSync}
              disabled={isSyncing}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-accent-mint hover:bg-accent-mint/90 text-navy-950 font-semibold text-xs transition-colors disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Sedang Sinkron...' : 'Sync Sekarang'}
            </button>
          ) : (
            <button
              onClick={openAuthModal}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-accent-mint hover:bg-accent-mint/90 text-navy-950 font-semibold text-xs transition-colors"
            >
              <Mail className="w-3.5 h-3.5" />
              Log Masuk dengan Emel OTP
            </button>
          )}
        </div>

        {/* User Account Details */}
        {user ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-surface-subtle border border-border-subtle space-y-1">
              <span className="text-[11px] font-medium text-content-tertiary uppercase tracking-wider">
                Akaun Pemilik Sah
              </span>
              <p className="text-sm font-semibold text-content-primary flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-accent-mint" />
                {user.email}
              </p>
              <p className="text-[11px] text-content-tertiary">
                {isApprovedOwner
                  ? 'Status: Diluluskan oleh pelayan (is_approved_owner).'
                  : 'Status: Menunggu pengesahan.'}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-surface-subtle border border-border-subtle space-y-1">
              <span className="text-[11px] font-medium text-content-tertiary uppercase tracking-wider">
                Status Terakhir
              </span>
              <p className="text-sm font-semibold text-content-primary">
                {lastSyncAt ? new Date(lastSyncAt).toLocaleTimeString() : 'Belum diselaraskan'}
              </p>
              <p className="text-[11px] text-content-tertiary">
                {pendingCount > 0
                  ? `${pendingCount} perubahan tempatan sedang menunggu penghantaran.`
                  : 'Tiada perubahan menunggu. Data tempatan selaras dengan pangkalan awan.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-navy-950/40 border border-navy-800 space-y-2">
            <p className="text-xs text-content-secondary leading-relaxed">
              Anda kini beroperasi dalam <strong>Mod Tetamu Tempatan (Local-First)</strong>. Semua rekod,
              tugas, subjek, dan matlamat disimpan dengan selamat dalam storan <code>IndexedDB</code> pada
              pelayar ini. Log masuk dengan emel pemilik membolehkan data anda disegerakkan secara langsung
              antara komputer riba dan telefon pintar anda.
            </p>
          </div>
        )}

        {errorMessage && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Actions for authenticated user */}
        {user && (
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={handleInitialUpload}
              disabled={isInitialUploading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface-hover hover:bg-surface border border-border-subtle text-content-secondary hover:text-content-primary text-xs font-medium transition-colors disabled:opacity-50"
            >
              <UploadCloud className="w-3.5 h-3.5 text-accent-mint" />
              {isInitialUploading ? 'Sedang memuat naik...' : 'Muat Naik Semula Data Tempatan'}
            </button>

            <button
              onClick={signOut}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-medium transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Log Keluar Cloud (Kekalkan Data Tempatan)
            </button>
          </div>
        )}
      </div>

      {/* Security Architecture Verification Card */}
      <div className="rounded-2xl bg-surface border border-border-subtle p-6 space-y-4">
        <h4 className="text-sm font-semibold text-content-primary flex items-center gap-2">
          <Lock className="w-4 h-4 text-accent-mint" />
          Senibina Keselamatan & Privasi Peribadi
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-content-secondary">
          <div className="p-3.5 rounded-xl bg-surface-subtle border border-border-subtle space-y-1">
            <p className="font-semibold text-content-primary">Pencegahan Pendaftaran Awam</p>
            <p className="text-[11px] text-content-tertiary">
              Pendaftaran terbuka dimatikan. Hanya emel berdaftar tunggal boleh meminta akses.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-surface-subtle border border-border-subtle space-y-1">
            <p className="font-semibold text-content-primary">Row Level Security (RLS)</p>
            <p className="text-[11px] text-content-tertiary">
              Setiap panggilan SQL disemak terhadap <code className="text-accent-mint">auth.uid()</code> dan kebenaran pemilik.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-surface-subtle border border-border-subtle space-y-1">
            <p className="font-semibold text-content-primary">Enkripsi & TLS 1.3</p>
            <p className="text-[11px] text-content-tertiary">
              Semua komunikasi awan dilindungi melalui sambungan selamat HTTPS/WSS dan storan AES-256.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
