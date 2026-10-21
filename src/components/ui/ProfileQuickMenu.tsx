import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Settings,
  RefreshCw,
  Sun,
  Moon,
  Sparkles,
  Camera,
  Check,
  Edit2,
  ExternalLink,
  Cloud,
} from 'lucide-react';
import { db } from '@/db/nemoDb';
import { useLiveQuery } from 'dexie-react-hooks';
import { getInitials, saveProfileAvatar } from '@/lib/avatar';
import { useAuth } from '@/features/auth/AuthContext';
import { useSync } from '@/sync/useSync';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';
import type { WorkspaceSettings } from '@/domain/types';

interface ProfileQuickMenuProps {
  className?: string;
}

export const ProfileQuickMenu: React.FC<ProfileQuickMenuProps> = ({ className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');

  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { success, error } = useToast();

  const { user } = useAuth();
  const { status: syncStatus, isSyncing, triggerSync } = useSync();

  const settings = useLiveQuery(() => db.settings.get('default'), []);
  const avatarBlob = useLiveQuery(
    () => (settings?.avatarBlobId ? db.assetBlobs.get(settings.avatarBlobId) : undefined),
    [settings?.avatarBlobId]
  );

  const currentTheme = settings?.theme || 'midnight';

  useEffect(() => {
    if (settings?.displayName) {
      setNameInput(settings.displayName);
    }
  }, [settings?.displayName]);

  // Click outside or Escape to close
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setIsEditingName(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        setIsEditingName(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleTriggerSync = async () => {
    try {
      await triggerSync();
      success('Sync complete', 'Workspace is synchronized with cloud storage.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sync failed';
      error('Sync error', msg);
    }
  };

  const handleThemeChange = async (newTheme: WorkspaceSettings['theme']) => {
    try {
      document.documentElement.dataset.theme = newTheme;
      document.documentElement.setAttribute('data-theme', newTheme);
      await db.settings.update('default', { theme: newTheme });
      success('Theme updated', `Switched atmosphere to ${newTheme}.`);
    } catch (err: unknown) {
      error('Theme update failed', err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const handleSaveName = async () => {
    const trimmed = nameInput.trim();
    if (!trimmed) return;
    try {
      await db.settings.update('default', { displayName: trimmed });
      setIsEditingName(false);
      success('Profile updated', `Display name saved as ${trimmed}.`);
    } catch (err: unknown) {
      error('Update failed', err instanceof Error ? err.message : 'Could not save name');
    }
  };

  const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await saveProfileAvatar(file);
      success('Avatar updated', 'Your new profile picture is active.');
    } catch (err: unknown) {
      error('Upload failed', err instanceof Error ? err.message : 'Image upload failed');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div ref={menuRef} className={cn('relative inline-block', className)}>
      {/* Hidden File Input for Avatar Upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleAvatarFile}
        className="hidden"
        aria-hidden="true"
      />

      {/* Profile Avatar Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Profile and quick settings"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        className="profile-button relative overflow-hidden ring-2 ring-white/10 hover:ring-accent-mint/50 focus-visible:ring-accent-mint transition-all cursor-pointer shadow-md group select-none"
        style={{
          width: '42px',
          height: '42px',
        }}
      >
        {avatarBlob?.data ? (
          <img
            src={avatarBlob.data}
            alt={settings?.displayName || 'Profile'}
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <span className="text-sm font-bold tracking-tight">
            {getInitials(settings?.displayName)}
          </span>
        )}

        {/* Online / Synced Subtle Status Pip */}
        <span
          className={cn(
            'absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-surface-solid',
            syncStatus === 'up_to_date' || syncStatus === 'signed_in'
              ? 'bg-accent-mint'
              : syncStatus === 'syncing'
              ? 'bg-amber-400 animate-pulse'
              : 'bg-content-tertiary'
          )}
          title={`Sync status: ${syncStatus || 'idle'}`}
        />
      </button>

      {/* Quick Settings Glass Popover Dropdown */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Quick Settings & Profile"
          className="profile-quick-menu absolute right-0 top-full mt-2.5 w-80 max-w-[calc(100vw-32px)] rounded-2xl glass-panel shadow-pop border border-border-emphasis/60 p-4 space-y-4 z-50 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200"
        >
          {/* Header: Avatar, Name & Edit */}
          <div className="flex items-center gap-3 pb-3 border-b border-border-subtle">
            <div className="relative group/avatar cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <div className="w-12 h-12 rounded-full overflow-hidden border border-border-emphasis bg-surface-muted flex items-center justify-center font-bold text-base text-accent-mint shadow-inner">
                {avatarBlob?.data ? (
                  <img src={avatarBlob.data} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  getInitials(settings?.displayName)
                )}
              </div>
              <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover/avatar:opacity-100 flex items-center justify-center transition-opacity text-white text-xs">
                <Camera size={14} />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              {isEditingName ? (
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveName();
                      if (e.key === 'Escape') setIsEditingName(false);
                    }}
                    autoFocus
                    className="w-full px-2 py-0.5 rounded-md bg-surface border border-accent-mint/50 text-xs text-content-primary focus:outline-none"
                    placeholder="Your Name"
                  />
                  <button
                    onClick={handleSaveName}
                    className="p-1 rounded-md bg-accent-mint text-canvas hover:opacity-90"
                    title="Save"
                  >
                    <Check size={13} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <h4 className="font-bold text-sm text-content-primary truncate">
                    {settings?.displayName || 'My Workspace'}
                  </h4>
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="text-content-tertiary hover:text-content-primary p-0.5 rounded transition-colors"
                    title="Edit Name"
                  >
                    <Edit2 size={12} />
                  </button>
                </div>
              )}
              <p className="text-[11px] text-content-secondary truncate">
                {user?.email || 'Local-First Workspace'}
              </p>
            </div>
          </div>

          {/* Quick Action: Cloud Sync */}
          <div className="p-2.5 rounded-xl bg-surface-muted/50 border border-border-subtle flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Cloud size={15} className="text-accent-mint shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-content-primary">Cloud Sync</p>
                <p className="text-[10px] text-content-secondary capitalize">
                  {isSyncing ? 'Syncing...' : syncStatus || 'Active'}
                </p>
              </div>
            </div>
            <button
              onClick={handleTriggerSync}
              disabled={isSyncing}
              className="px-2.5 py-1 rounded-lg bg-surface border border-border-subtle hover:border-border-emphasis text-xs font-medium text-content-primary transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw size={12} className={cn(isSyncing && 'animate-spin text-accent-mint')} />
              <span>Sync</span>
            </button>
          </div>

          {/* Quick Action: Theme Atmosphere */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold text-content-secondary">
              <span>Theme Atmosphere</span>
              <span className="text-[10px] uppercase font-mono tracking-wider text-accent-mint">
                {currentTheme}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-surface-muted/50 border border-border-subtle">
              <button
                type="button"
                onClick={() => handleThemeChange('midnight')}
                className={cn(
                  'flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all select-none',
                  currentTheme === 'midnight' || currentTheme === 'dark'
                    ? 'bg-accent-mint text-canvas font-bold shadow-sm'
                    : 'text-content-secondary hover:text-content-primary'
                )}
              >
                <Moon size={12} />
                <span>Night</span>
              </button>

              <button
                type="button"
                onClick={() => handleThemeChange('daylight')}
                className={cn(
                  'flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all select-none',
                  currentTheme === 'daylight' || currentTheme === 'light'
                    ? 'bg-accent-mint text-canvas font-bold shadow-sm'
                    : 'text-content-secondary hover:text-content-primary'
                )}
              >
                <Sun size={12} />
                <span>Day</span>
              </button>

              <button
                type="button"
                onClick={() => handleThemeChange('aurora')}
                className={cn(
                  'flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all select-none',
                  currentTheme === 'aurora'
                    ? 'bg-accent-mint text-canvas font-bold shadow-sm'
                    : 'text-content-secondary hover:text-content-primary'
                )}
              >
                <Sparkles size={12} />
                <span>Aurora</span>
              </button>
            </div>
          </div>

          {/* Quick Action: Change Avatar Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 p-2 rounded-xl border border-border-subtle bg-surface hover:bg-surface-hover text-xs font-medium text-content-primary transition-all cursor-pointer"
          >
            <Camera size={14} className="text-accent-ember" />
            <span>Upload New Photo</span>
          </button>

          {/* Navigation to Full Settings */}
          <div className="pt-2 border-t border-border-subtle flex items-center justify-between">
            <Link
              to="/settings"
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center justify-between text-xs font-semibold text-accent-mint hover:underline group/link"
            >
              <div className="flex items-center gap-1.5">
                <Settings size={14} />
                <span>All Workspace Settings</span>
              </div>
              <ExternalLink size={12} className="transition-transform group-hover/link:translate-x-0.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
