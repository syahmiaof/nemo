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
  KeyRound,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useAuth } from '@/features/auth/AuthContext';
import { useSync } from '@/sync/useSync';
import { syncEngine } from '@/sync/syncEngine';
import { useToast } from '@/components/ui/Toast';

export const AccountSyncPanel: React.FC = () => {
  const { user, openAuthModal, signOut, updatePassword } = useAuth();
  const { status, lastSyncAt, pendingCount, errorMessage, isSyncing, triggerSync } = useSync();
  const { success, error: toastError } = useToast();

  const [isUploading, setIsUploading] = useState(false);

  // Change Password State
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [showNewPasswordText, setShowNewPasswordText] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState<{ type: 'error' | 'success'; message: string } | null>(null);

  const handleManualSync = async () => {
    const res = await triggerSync();
    if (res.success) {
      success('Sync Completed', 'All workspace changes are up to date.');
    } else {
      toastError('Sync Failed', res.error || 'Please check your internet connection.');
    }
  };

  const handleInitialUpload = async () => {
    if (!user) return;
    setIsUploading(true);
    const res = await syncEngine.uploadAllLocalData(user.id);
    setIsUploading(false);

    if (res.success) {
      success('Upload Complete', `${res.count} records successfully uploaded to cloud.`);
    } else {
      toastError('Error', res.error || 'Failed to upload workspace data.');
    }
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setPasswordFeedback({ type: 'error', message: 'Password must be at least 6 characters long.' });
      return;
    }

    setIsUpdatingPassword(true);
    setPasswordFeedback(null);
    const res = await updatePassword(newPassword);
    setIsUpdatingPassword(false);

    if (res.success) {
      setPasswordFeedback({ type: 'success', message: 'Your password has been updated successfully!' });
      success('Password Updated', 'Your new owner password is now active on all devices.');
      setTimeout(() => {
        setShowChangePassword(false);
        setNewPassword('');
        setPasswordFeedback(null);
      }, 1500);
    } else {
      const msg = res.error || 'Failed to update password.';
      setPasswordFeedback({ type: 'error', message: msg });
      toastError('Update Failed', msg);
    }
  };

  const renderStatusBadge = () => {
    switch (status) {
      case 'syncing':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/15 text-amber-300 border border-amber-500/30">
            <RefreshCw className="w-3 h-3 animate-spin" />
            Syncing
          </span>
        );
      case 'up_to_date':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-mint-500/15 text-mint-400 border border-mint-500/30">
            <Check className="w-3 h-3" />
            Synced
          </span>
        );
      case 'offline':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-navy-800 text-navy-400 border border-navy-700">
            <CloudOff className="w-3 h-3" />
            Offline
          </span>
        );
      case 'error':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/15 text-red-400 border border-red-500/30">
            <AlertCircle className="w-3 h-3" />
            Connection Error
          </span>
        );
      case 'signed_in':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/15 text-blue-400 border border-blue-500/30">
            <Cloud className="w-3 h-3" />
            Connected
          </span>
        );
      case 'local_only':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-navy-800 text-navy-400 border border-navy-700">
            <Database className="w-3 h-3" />
            Local Mode
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
              Cloud Synchronization
            </h3>
            {renderStatusBadge()}
          </div>

          {user ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setShowChangePassword(!showChangePassword);
                  setPasswordFeedback(null);
                }}
                className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors ${
                  showChangePassword
                    ? 'bg-navy-800 border-accent-mint/50 text-accent-mint'
                    : 'bg-surface-subtle border-border-subtle hover:border-border-emphasis text-content-secondary hover:text-content-primary'
                }`}
                title="Change your owner login password"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Change Password</span>
              </button>

              <button
                onClick={handleManualSync}
                disabled={isSyncing}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-accent-mint hover:bg-accent-mint/90 text-navy-950 font-semibold text-xs transition-colors disabled:opacity-60"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? 'Syncing...' : 'Sync Now'}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={openAuthModal}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-accent-mint hover:bg-accent-mint/90 text-navy-950 font-semibold text-xs transition-colors"
              >
                <Lock className="w-3.5 h-3.5" />
                Owner Sign In
              </button>
            </div>
          )}
        </div>

        {/* Content row */}
        {user ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-3 rounded-xl bg-surface-subtle border border-border-subtle space-y-0.5">
              <span className="text-[11px] text-content-tertiary">Owner Account</span>
              <p className="text-xs font-semibold text-content-primary truncate">{user.email}</p>
            </div>

            <div className="p-3 rounded-xl bg-surface-subtle border border-border-subtle space-y-0.5">
              <span className="text-[11px] text-content-tertiary">Data Status</span>
              <p className="text-xs font-semibold text-content-primary">
                {pendingCount > 0
                  ? `${pendingCount} item(s) pending sync`
                  : lastSyncAt
                  ? `Up to date (${new Date(lastSyncAt).toLocaleTimeString()})`
                  : 'Ready to sync'}
              </p>
            </div>
          </div>
        ) : (
          <div className="pt-1 space-y-3">
            <p className="text-xs text-content-secondary leading-relaxed">
              Sign in with your owner password to enable real-time bidirectional synchronization between your laptop and mobile devices.
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={openAuthModal}
                className="inline-flex items-center gap-1.5 text-xs text-accent-mint hover:underline font-medium"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Want to set or change your password? Sign in first</span>
              </button>
            </div>
          </div>
        )}

        {/* Inline Change Password Form */}
        {user && showChangePassword && (
          <form
            onSubmit={handleChangePasswordSubmit}
            className="p-4 rounded-xl bg-navy-950/60 border border-accent-mint/30 space-y-3 animate-fade-in"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-accent-mint">
                <KeyRound className="w-4 h-4" />
                <span>Set New Owner Password</span>
              </div>
              <span className="text-[10px] text-content-tertiary">Applies immediately to phone & laptop</span>
            </div>

            <div className="relative">
              <input
                type={showNewPasswordText ? 'text' : 'password'}
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter your custom password (min. 6 characters)"
                className="w-full pl-3 pr-10 py-2 text-xs rounded-xl bg-surface border border-border-subtle focus:border-accent-mint focus:ring-1 focus:ring-accent-mint text-content-primary placeholder-content-tertiary transition-colors"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowNewPasswordText(!showNewPasswordText)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-content-tertiary hover:text-content-primary"
                aria-label={showNewPasswordText ? 'Hide password' : 'Show password'}
              >
                {showNewPasswordText ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>

            {passwordFeedback && (
              <p
                className={`text-xs ${
                  passwordFeedback.type === 'success' ? 'text-accent-mint' : 'text-red-400'
                }`}
              >
                {passwordFeedback.message}
              </p>
            )}

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setShowChangePassword(false);
                  setNewPassword('');
                  setPasswordFeedback(null);
                }}
                className="px-3 py-1.5 rounded-lg bg-surface-subtle hover:bg-surface border border-border-subtle text-xs text-content-secondary transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUpdatingPassword || newPassword.length < 6}
                className="px-3.5 py-1.5 rounded-lg bg-accent-mint hover:bg-accent-mint/90 text-navy-950 font-semibold text-xs transition-colors disabled:opacity-50"
              >
                {isUpdatingPassword ? 'Updating...' : 'Save New Password'}
              </button>
            </div>
          </form>
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
              className="text-content-tertiary hover:text-content-secondary transition-colors inline-flex items-center gap-1.5 disabled:opacity-50"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>{isUploading ? 'Uploading...' : 'Upload local workspace to cloud'}</span>
            </button>

            <button
              onClick={signOut}
              className="text-red-400/80 hover:text-red-400 transition-colors inline-flex items-center gap-1.5 font-medium"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
