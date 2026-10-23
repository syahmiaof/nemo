import React, { useState, useRef, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  ShieldCheck,
  DownloadCloud,
  UploadCloud,
  Trash2,
  Moon,
  Sun,
  Sparkles,
  HardDrive,
  User,
  AlertTriangle,
  FlaskConical,
  Sliders,
  Palette,
  Cloud,
  Upload,
  LogOut,
  type LucideIcon,
} from 'lucide-react';
import { db, exportWorkspaceBackup, importWorkspaceBackup, resetWorkspaceData } from '@/db/nemoDb';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import type { WorkspaceSettings } from '@/domain/types';
import { DemoWorkspacePanel } from './DemoWorkspacePanel';
import { AccountSyncPanel } from './AccountSyncPanel';
import { getInitials, saveProfileAvatar, removeProfileAvatar } from '@/lib/avatar';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { syncEngine } from '@/sync/syncEngine';
import { useAuth } from '@/features/auth/AuthContext';
import { replayWelcomeAnimation } from '@/app/WelcomeOverlay';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useReducedMotion } from '@/design/useReducedMotion';
import { MotionTitle } from '@/components/ui/MotionTitle';
gsap.registerPlugin(useGSAP);

type SettingsTab = 'appearance' | 'profile' | 'account_sync' | 'preferences' | 'data' | 'demo' | 'about';

export const SettingsPage: React.FC = () => {
  const { success, error } = useToast();
  const { user, signOut, openAuthModal } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const handleLogout = async () => {
    try {
      await signOut();
      success('Logged out', 'You have been signed out of Nemo Cloud.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sign out failed';
      error('Error', msg);
    }
  };

  const settings = useLiveQuery(() => db.settings.get('default'), []);
  const avatarBlob = useLiveQuery(
    () => (settings?.avatarBlobId ? db.assetBlobs.get(settings.avatarBlobId) : undefined),
    [settings?.avatarBlobId]
  );

  // Active subtab
  const [activeTab, setActiveTab] = useState<SettingsTab>('appearance');
  const root = useRef<HTMLDivElement>(null);
  const animatedTab = useRef(false);
  const reduced = useReducedMotion();

  // Header, profile card, and tabs animated on entry
  useGSAP(() => {
    if (reduced) return;
    const tl = gsap.timeline();
    tl.fromTo(
      '.settings-header-banner',
      { opacity: 0, y: -16 },
      { opacity: 1, y: 0, duration: 0.48, ease: 'power3.out' }
    )
      .fromTo(
        '.settings-profile-card',
        { opacity: 0, scale: 0.94, y: -8 },
        { opacity: 1, scale: 1, y: 0, duration: 0.42, ease: 'back.out(1.6)' },
        '-=0.28'
      )
      .fromTo(
        '.settings-tabs-wrapper',
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.45, ease: 'power3.out' },
        '-=0.25'
      )
      .fromTo(
        '.settings-tab-btn',
        { opacity: 0, scale: 0.92, y: 8 },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 0.38,
          stagger: 0.035,
          ease: 'back.out(1.5)',
          clearProps: 'transform,opacity',
        },
        '-=0.3'
      );
  }, { scope: root, dependencies: [reduced] });

  // Tab switch panel choreography
  useGSAP(() => {
    if (!animatedTab.current) {
      animatedTab.current = true;
      return;
    }
    if (reduced) return;
    gsap.fromTo(
      '[data-enter]',
      { opacity: 0, y: 16, scale: 0.99 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.48,
        stagger: 0.045,
        ease: 'power3.out',
        clearProps: 'opacity,transform',
      }
    );
  }, { scope: root, dependencies: [activeTab, reduced], revertOnUpdate: true });

  // Settings panels animated on scroll into view with bi-directional in/out motion
  useEffect(() => {
    if (reduced) {
      const panels = root.current?.querySelectorAll<HTMLElement>('[data-scroll-panel]');
      panels?.forEach((panel) => {
        gsap.set(panel, { opacity: 1, y: 0, scale: 1, clearProps: 'all' });
      });
      return;
    }

    let lastScrollY = window.scrollY;
    let scrollDirection: 'down' | 'up' = 'down';

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      scrollDirection = currentScrollY >= lastScrollY ? 'down' : 'up';
      lastScrollY = currentScrollY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const el = entry.target as HTMLElement;
          if (entry.isIntersecting) {
            // Animate in from direction of scroll
            const initialY = scrollDirection === 'down' ? 24 : -24;
            gsap.fromTo(
              el,
              { opacity: 0.25, y: initialY, scale: 0.985 },
              {
                opacity: 1,
                y: 0,
                scale: 1,
                duration: 0.55,
                ease: 'power3.out',
                overwrite: 'auto',
              }
            );
          } else {
            // Bi-directional out motion based on whether element exited top or bottom
            const rect = entry.boundingClientRect;
            const isAbove = rect.bottom < (entry.rootBounds?.top ?? 0) + 40;
            const outY = isAbove ? -22 : 22;
            gsap.to(el, {
              opacity: 0.2,
              y: outY,
              scale: 0.985,
              duration: 0.38,
              ease: 'power2.inOut',
              overwrite: 'auto',
            });
          }
        });
      },
      {
        threshold: [0.08, 0.92],
        rootMargin: '20px 0px -20px 0px',
      }
    );

    const panels = root.current?.querySelectorAll<HTMLElement>('[data-scroll-panel]');
    panels?.forEach((p) => observer.observe(p));

    return () => {
      window.removeEventListener('scroll', handleScroll);
      observer.disconnect();
    };
  }, [activeTab, reduced]);

  // Theme preview card hover & selection micro-interactions
  const handleThemeHoverEnter = (target: HTMLElement) => {
    if (reduced) return;
    gsap.to(target, {
      y: -5,
      scale: 1.018,
      duration: 0.28,
      ease: 'power2.out',
      boxShadow: '0 14px 30px -8px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.18)',
    });
    const icon = target.querySelector('.theme-card-icon');
    if (icon) {
      gsap.to(icon, { scale: 1.25, rotate: 8, duration: 0.32, ease: 'back.out(2)' });
    }
    const preview = target.querySelector('.theme-preview-box');
    if (preview) {
      gsap.to(preview, { scale: 1.025, duration: 0.28, ease: 'power2.out' });
    }
  };

  const handleThemeHoverLeave = (target: HTMLElement) => {
    if (reduced) return;
    gsap.to(target, {
      y: 0,
      scale: 1,
      duration: 0.28,
      ease: 'power2.out',
      boxShadow: 'none',
      clearProps: 'boxShadow,transform',
    });
    const icon = target.querySelector('.theme-card-icon');
    if (icon) {
      gsap.to(icon, { scale: 1, rotate: 0, duration: 0.28, ease: 'power2.out', clearProps: 'transform' });
    }
    const preview = target.querySelector('.theme-preview-box');
    if (preview) {
      gsap.to(preview, { scale: 1, duration: 0.28, ease: 'power2.out', clearProps: 'transform' });
    }
  };

  const handleThemeSelect = (themeKey: WorkspaceSettings['theme'], cardEl: HTMLElement) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('nemo:theme-explicitly-chosen', 'true');
    }
    setTheme(themeKey);
    handleUpdatePreferences({ theme: themeKey });
    if (!reduced && cardEl) {
      gsap.fromTo(
        cardEl,
        { scale: 0.95 },
        { scale: 1, duration: 0.45, ease: 'back.out(2.4)' }
      );
      const badge = cardEl.querySelector('.theme-active-badge');
      if (badge) {
        gsap.fromTo(
          badge,
          { scale: 0.4, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(3)' }
        );
      }
    }
  };

  // Form states
  const [displayName, setDisplayName] = useState('');
  const [theme, setTheme] = useState<WorkspaceSettings['theme']>('aurora');
  const [weekStartsOn, setWeekStartsOn] = useState<0 | 1>(1);
  const [hourFormat, setHourFormat] = useState<'12h' | '24h'>('24h');
  const [reduceMotion, setReduceMotion] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Dialogs
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [pendingBackupContent, setPendingBackupContent] = useState<string | null>(null);
  const [pendingBackupSummary, setPendingBackupSummary] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  React.useEffect(() => {
    if (settings) {
      setDisplayName(settings.displayName);
      setTheme(settings.theme);
      setWeekStartsOn(settings.weekStartsOn);
      setHourFormat(settings.hourFormat);
      setReduceMotion(settings.reduceMotion);
    }
  }, [settings]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      error('File too large', 'Please choose an image under 10MB.');
      return;
    }

    try {
      setIsUploadingAvatar(true);
      await saveProfileAvatar(file);
      syncEngine.syncNow().catch(() => {});
      success('Avatar updated', 'Your profile picture was compressed to 256x256 WebP and synced to cloud.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      error('Avatar Error', msg);
    } finally {
      setIsUploadingAvatar(false);
      e.target.value = '';
    }
  };

  const handleAvatarRemove = async () => {
    try {
      await removeProfileAvatar();
      syncEngine.syncNow().catch(() => {});
      success('Avatar removed', 'Profile avatar reset to initials fallback.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Removal failed';
      error('Avatar Error', msg);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = displayName.trim();
    if (!cleanName) {
      error('Name cannot be empty');
      return;
    }
    await db.settings.update('default', {
      displayName: cleanName,
    });

    if (isSupabaseConfigured) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.id) {
          await supabase
            .from('profiles')
            .update({ display_name: cleanName, updated_at: new Date().toISOString() })
            .eq('id', user.id);
        }
      } catch (cloudErr) {
        console.warn('Direct name cloud update deferred:', cloudErr);
      }
    }

    syncEngine.syncNow().catch(() => {});
    success('Profile updated', 'Workspace display name saved and synced across devices.');
  };

  const handleUpdatePreferences = async (updates: Partial<WorkspaceSettings>) => {
    await db.settings.update('default', updates);
    if (updates.theme) {
      document.documentElement.dataset.theme = updates.theme;
      document.documentElement.setAttribute('data-theme', updates.theme);
    }
    success('Preferences saved');
  };

  // 1-Click JSON Backup Export
  const handleExportBackup = async () => {
    try {
      const backupJson = await exportWorkspaceBackup();
      const dateStr = new Date().toISOString().slice(0, 10);
      const filename = `nemo_backup_${dateStr}_v1.json`;

      const blob = new Blob([backupJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      success('Backup exported successfully', `Saved as ${filename}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Export failed';
      error('Export Error', msg);
    }
  };

  // Backup File Selection
  const handleSelectBackupFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      error('File too large', 'Backup file exceeds the 25MB safety limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = reader.result as string;
        const parsed = JSON.parse(text);

        if (parsed.app !== 'nemo' || parsed.version !== 1) {
          error('Incompatible backup', 'This file was not exported by a compatible version of Nemo.');
          return;
        }

        const d = parsed.data || {};
        const summary = `Exported: ${parsed.exportedAt || 'Unknown'}\nProjects: ${d.projects?.length || 0}\nTasks: ${d.tasks?.length || 0}\nAssignments: ${d.assignments?.length || 0}\nGoals: ${d.goals?.length || 0}\nAssets: ${d.assetBlobs?.length || 0}`;

        setPendingBackupContent(text);
        setPendingBackupSummary(summary);
        setIsRestoreModalOpen(true);
      } catch {
        error('Invalid JSON', 'The selected file is not valid JSON.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Confirm Restore
  const handleConfirmRestore = async () => {
    if (!pendingBackupContent) return;
    setIsImporting(true);

    try {
      const result = await importWorkspaceBackup(pendingBackupContent);
      if (result.success) {
        setIsRestoreModalOpen(false);
        setPendingBackupContent(null);
        success('Workspace restored successfully', 'All records and assets have been recovered.');
      } else {
        error('Restore failed', result.error || 'Failed to parse backup.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Import failed';
      error('Restore Error', msg);
    } finally {
      setIsImporting(false);
    }
  };

  // Reset Data
  const handleConfirmReset = async () => {
    await resetWorkspaceData();
    setIsResetConfirmOpen(false);
    success('Workspace reset', 'All records have been cleared to default state.');
  };

  const tabs: { key: SettingsTab; label: string; icon: LucideIcon }[] = [
    { key: 'appearance', label: 'Appearance', icon: Palette },
    { key: 'profile', label: 'Profile', icon: User },
    { key: 'account_sync', label: 'Account & Sync', icon: Cloud },
    { key: 'preferences', label: 'Preferences', icon: Sliders },
    { key: 'data', label: 'Data & Backups', icon: HardDrive },
    { key: 'demo', label: 'Demo Mode', icon: FlaskConical },
    { key: 'about', label: 'About & Notice', icon: Sparkles },
  ];

  return (
    <div ref={root} className="settings-page space-y-6">
      <div className="module-heading settings-header-banner flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <MotionTitle text="Settings" />
          <p>Make this space yours.</p>
        </div>
        {user ? (
          <div className="settings-profile-card flex items-center gap-3 bg-white/[0.04] border border-white/10 px-3.5 py-2 rounded-xl">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-semibold text-white">{user.email}</div>
              <div className="text-[10px] text-accent-mint flex items-center justify-end gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-mint inline-block" />
                Cloud Connected
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-red-400 hover:text-red-300 hover:bg-red-500/10 gap-1.5 text-xs font-medium"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </Button>
          </div>
        ) : (
          <div className="settings-profile-card">
            <Button
              variant="secondary"
              size="sm"
              onClick={openAuthModal}
              className="gap-1.5 text-xs"
            >
              <Cloud className="w-3.5 h-3.5 text-accent-mint" />
              <span>Sign In to Cloud</span>
            </Button>
          </div>
        )}
      </div>
      {/* Tavola-Style Nested Navigation Capsule */}
      <div className="settings-tabs-wrapper w-full overflow-x-auto pb-1 flex justify-start sm:justify-center">
        <div className="tabs" style={{ width: 'fit-content', margin: '0 auto 1.5rem auto' }}>
        <div className="tabs__track" role="tablist" aria-label="Settings sections">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                role="tab"
                id={`settings-tab-${tab.key}`}
                aria-controls="settings-panel"
                tabIndex={isActive ? 0 : -1}
                onKeyDown={event => {
                  const index = tabs.findIndex(item => item.key === activeTab);
                  const next = event.key === 'ArrowRight' ? (index + 1) % tabs.length : event.key === 'ArrowLeft' ? (index - 1 + tabs.length) % tabs.length : event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : -1;
                  if (next >= 0) { event.preventDefault(); setActiveTab(tabs[next].key); document.getElementById(`settings-tab-${tabs[next].key}`)?.focus(); }
                }}
                aria-selected={isActive}
                onClick={() => setActiveTab(tab.key)}
                className={`tab settings-tab-btn flex items-center gap-2 ${isActive ? 'is-active' : ''}`}
                style={{
                  position: 'relative',
                  zIndex: 2,
                  borderRadius: '999px',
                  background: isActive ? 'var(--accent-ember, #EEB2A3)' : 'transparent',
                  color: isActive ? '#0A1222' : 'inherit',
                  transition: 'all 0.24s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
      </div>

      <section id="settings-panel" role="tabpanel" aria-labelledby={`settings-tab-${activeTab}`} tabIndex={0}>
      {/* Profile Panel */}
      {activeTab === 'profile' && (
        <div data-enter data-scroll-panel="true" className="p-6 rounded-2xl glass-panel relative z-10 space-y-6">
          <div className="flex items-center gap-2.5 border-b border-white/[0.08] pb-3 relative z-10">
            <User className="w-5 h-5 text-accent-mint" />
            <div>
              <h3 className="text-base font-bold text-content-primary">Workspace Profile</h3>
              <p className="text-xs text-content-secondary mt-0.5">
                Personalize your workspace identity with an avatar and display name.
              </p>
            </div>
          </div>

          {/* Avatar Upload & Preview Section */}
          <div data-scroll-panel="true" className="flex flex-col sm:flex-row items-start sm:items-center gap-5 p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] relative z-10">
            <div className="relative w-20 h-20 rounded-full border-2 border-accent-mint/30 shadow-lg overflow-hidden flex-shrink-0 bg-[#0F1A2D] grid place-items-center">
              {avatarBlob?.data ? (
                <img
                  src={avatarBlob.data}
                  alt={displayName || 'Profile Avatar'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="font-extrabold text-2xl text-accent-mint tracking-wider select-none">
                  {getInitials(displayName || settings?.displayName)}
                </span>
              )}
            </div>

            <div className="space-y-2 flex-1">
              <h4 className="text-sm font-semibold text-white">Profile Picture</h4>
              <p className="text-xs text-content-secondary leading-relaxed">
                Client-side compressed to max 256&times;256 WebP and saved in local IndexedDB.
              </p>

              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />

                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                  className="gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{avatarBlob ? 'Replace Avatar' : 'Upload Avatar'}</span>
                </Button>

                {avatarBlob && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleAvatarRemove}
                    className="gap-1.5 text-accent-ember hover:bg-accent-ember/10"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove</span>
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Display Name Form */}
          <form onSubmit={handleSaveProfile} className="space-y-4 max-w-md relative z-10">
            <Input
              label="Display / Workspace Name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Alex's Command Center"
              required
              className="bg-white/[0.04] border-white/10"
            />

            <Button type="submit" size="sm">
              Save Name
            </Button>
          </form>

          {/* Dedicated Account & Session Management */}
          <div data-scroll-panel="true" className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-semibold text-white">Active Session & Cloud Account</h4>
              <p className="text-xs text-content-secondary mt-0.5">
                {user ? `Currently signed in as ${user.email}.` : 'Currently in local offline mode.'}
              </p>
            </div>
            {user ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="gap-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 w-fit"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out</span>
              </Button>
            ) : (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={openAuthModal}
                className="gap-1.5 w-fit"
              >
                <Cloud className="w-4 h-4 text-accent-mint" />
                <span>Sign In to Sync</span>
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Appearance Panel with Tavola Luxury Cards */}
      {activeTab === 'appearance' && (
        <div data-enter className="space-y-6">
          <div data-scroll-panel="true" className="p-6 rounded-2xl glass-panel relative z-10 space-y-5">
            <div className="flex items-center gap-2.5 border-b border-white/[0.08] pb-3 relative z-10">
              <Palette className="w-5 h-5 text-accent-mint" />
              <div>
                <h3 className="text-base font-bold text-content-primary">Theme Atmosphere</h3>
                <p className="text-xs text-content-secondary mt-0.5">
                  Choose your ambient workspace palette: Midnight, Daylight, or Aurora.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 relative z-10">
              {/* Midnight Theme Card */}
              <button
                type="button"
                onClick={(e) => handleThemeSelect('midnight', e.currentTarget)}
                onMouseEnter={(e) => handleThemeHoverEnter(e.currentTarget)}
                onMouseLeave={(e) => handleThemeHoverLeave(e.currentTarget)}
                className={`p-5 rounded-2xl border text-left transition-colors cursor-pointer ${
                  theme === 'dark' || theme === 'midnight'
                    ? 'border-accent-ember ring-2 ring-accent-ember/30 bg-[#0F1A2D]'
                    : 'border-white/10 hover:border-white/20 bg-[#0F1A2D]/70'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Moon className="theme-card-icon w-4 h-4 text-accent-mint" />
                    <span className="text-sm font-bold text-white">Midnight</span>
                  </div>
                  {(theme === 'dark' || theme === 'midnight') && (
                    <span className="theme-active-badge text-[10px] font-mono px-2 py-0.5 rounded-full bg-accent-ember/20 text-accent-ember border border-accent-ember/40">
                      Active
                    </span>
                  )}
                </div>
                {/* Mini preview illustration */}
                <div className="theme-preview-box w-full h-20 rounded-xl bg-[#0A1222] border border-white/10 p-2.5 flex gap-2 overflow-hidden">
                  <div className="w-4 h-full rounded-md bg-[#1B2C44]" />
                  <div className="flex-1 space-y-1.5">
                    <div className="w-16 h-2 rounded bg-accent-ember/70" />
                    <div className="w-full h-2 rounded bg-white/10" />
                    <div className="w-24 h-2 rounded bg-white/10" />
                  </div>
                </div>
                <p className="text-xs text-content-tertiary mt-3">
                  Midnight navy foundation with warm peach and soft mint accents.
                </p>
              </button>

              {/* Daylight Theme Card */}
              <button
                type="button"
                onClick={(e) => handleThemeSelect('daylight', e.currentTarget)}
                onMouseEnter={(e) => handleThemeHoverEnter(e.currentTarget)}
                onMouseLeave={(e) => handleThemeHoverLeave(e.currentTarget)}
                className={`p-5 rounded-2xl border text-left transition-colors cursor-pointer ${
                  theme === 'light' || theme === 'daylight'
                    ? 'border-accent-ember ring-2 ring-accent-ember/30 bg-[#FFFFFF]'
                    : 'border-white/10 hover:border-white/20 bg-[#F4F7FB]'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Sun className="theme-card-icon w-4 h-4 text-amber-500" />
                    <span className="text-sm font-bold text-gray-900">Daylight</span>
                  </div>
                  {(theme === 'light' || theme === 'daylight') && (
                    <span className="theme-active-badge text-[10px] font-mono px-2 py-0.5 rounded-full bg-accent-ember/20 text-accent-ember border border-accent-ember/40">
                      Active
                    </span>
                  )}
                </div>
                {/* Mini preview illustration */}
                <div className="theme-preview-box w-full h-20 rounded-xl bg-[#FFFFFF] border border-gray-300 p-2.5 flex gap-2 overflow-hidden">
                  <div className="w-4 h-full rounded-md bg-[#EDF2F9]" />
                  <div className="flex-1 space-y-1.5">
                    <div className="w-16 h-2 rounded bg-[#0F766E]" />
                    <div className="w-full h-2 rounded bg-gray-200" />
                    <div className="w-24 h-2 rounded bg-gray-200" />
                  </div>
                </div>
                <p className="text-xs text-gray-600 mt-3">
                  High-contrast daylight canvas with dark slate typography and crisp surfaces.
                </p>
              </button>

              {/* Aurora Theme Card */}
              <button
                type="button"
                onClick={(e) => handleThemeSelect('aurora', e.currentTarget)}
                onMouseEnter={(e) => handleThemeHoverEnter(e.currentTarget)}
                onMouseLeave={(e) => handleThemeHoverLeave(e.currentTarget)}
                className={`p-5 rounded-2xl border text-left transition-colors cursor-pointer ${
                  theme === 'aurora'
                    ? 'border-emerald-400 ring-2 ring-emerald-400/30 bg-[#070B14]'
                    : 'border-white/10 hover:border-white/20 bg-[#070B14]/80'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="theme-card-icon w-4 h-4 text-emerald-400" />
                    <span className="text-sm font-bold text-white">Aurora</span>
                  </div>
                  {theme === 'aurora' && (
                    <span className="theme-active-badge text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-400/40">
                      Active
                    </span>
                  )}
                </div>
                {/* Mini preview illustration */}
                <div className="theme-preview-box w-full h-20 rounded-xl bg-[#070B14] border border-emerald-500/30 p-2.5 flex gap-2 overflow-hidden relative">
                  <div className="w-4 h-full rounded-md bg-[#102A45]" />
                  <div className="flex-1 space-y-1.5">
                    <div className="w-16 h-2 rounded bg-gradient-to-r from-emerald-400 to-[#F5C8BC]" />
                    <div className="w-full h-2 rounded bg-[#123B38]/60" />
                    <div className="w-24 h-2 rounded bg-[#2A1F3D]/60" />
                  </div>
                </div>
                <p className="text-xs text-content-tertiary mt-3">
                  Atmospheric deep navy with flowing ambient aurora gradients and glass layering.
                </p>
              </button>
            </div>
          </div>

          {/* Signature Brand & Launch Experience */}
          <div data-scroll-panel="true" className="p-6 rounded-2xl glass-panel relative z-10 space-y-4">
            <div className="flex items-center gap-2.5 border-b border-white/[0.08] pb-3 relative z-10">
              <Sparkles className="w-5 h-5 text-accent-mint" />
              <div>
                <h3 className="text-base font-bold text-content-primary">Signature Brand Experience</h3>
                <p className="text-xs text-content-secondary mt-0.5">
                  The official flowing route emblem initialization, mint checkpoint, and peach completion reveal.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-1 relative z-10">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-content-primary">Welcome Launch Animation</p>
                <p className="text-xs text-content-tertiary">
                  Replays the initial brand welcome overlay with full spatial route drawing.
                </p>
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('nemo:replay-welcome'));
                }}
                className="gap-2"
              >
                <Sparkles className="w-4 h-4 text-accent-mint" />
                <span>Replay Welcome Animation</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Preferences Panel */}
      {activeTab === 'preferences' && (
        <div data-enter data-scroll-panel="true" className="p-6 rounded-2xl glass-panel relative z-10 space-y-5">
          <div className="flex items-center gap-2.5 border-b border-white/[0.08] pb-3 relative z-10">
            <Sliders className="w-5 h-5 text-accent-mint" />
            <h3 className="text-base font-bold text-content-primary">Workspace Behavior</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 relative z-10">
            {/* Week Start */}
            <div className="space-y-2">
              <Select
                label="Calendar Week Starts On"
                value={weekStartsOn.toString()}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10) as 0 | 1;
                  setWeekStartsOn(val);
                  handleUpdatePreferences({ weekStartsOn: val });
                }}
                options={[
                  { value: '1', label: 'Monday (Standard)' },
                  { value: '0', label: 'Sunday' },
                ]}
              />
            </div>

            {/* Clock format */}
            <div className="space-y-2">
              <Select
                label="Clock Format"
                value={hourFormat}
                onChange={(e) => {
                  const val = e.target.value as '12h' | '24h';
                  setHourFormat(val);
                  handleUpdatePreferences({ hourFormat: val });
                }}
                options={[
                  { value: '24h', label: '24-Hour (14:30)' },
                  { value: '12h', label: '12-Hour (2:30 PM)' },
                ]}
              />
            </div>

            {/* Reduced motion */}
            <div className="space-y-2 col-span-full">
              <label className="flex items-center gap-2.5 text-xs font-semibold text-content-primary cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={reduceMotion}
                  onChange={(e) => {
                    setReduceMotion(e.target.checked);
                    handleUpdatePreferences({ reduceMotion: e.target.checked });
                  }}
                  className="rounded border-border-subtle text-accent-mint focus:ring-accent-ring w-4 h-4"
                />
                <span>Respect / Force Reduced Motion</span>
              </label>
              <p className="text-xs text-content-secondary pl-6 leading-relaxed">
                Immediately cancels spatial transitions and decorative GSAP timelines, ensuring accessible instant state switches.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Data & Backups Panel */}
      {activeTab === 'data' && (
        <div data-enter className="space-y-6">
          {/* Privacy Guarantee Card */}
          <div data-scroll-panel="true" className="p-6 rounded-2xl glass-panel relative z-10 space-y-3">
            <div className="flex items-center gap-2.5 text-accent-mint relative z-10">
              <ShieldCheck className="w-5 h-5 flex-shrink-0" />
              <h3 className="text-base font-bold text-content-primary">Privacy & Storage</h3>
            </div>
            <p className="text-xs text-content-secondary leading-relaxed relative z-10">
              Nemo stores your workspace in this browser using IndexedDB. If you sign in and enable cloud sync, your workspace records are also synced to your account. Export periodic backups so you can restore your work in another browser profile.
            </p>
          </div>

          {/* Backup, Export & Restore */}
          <div data-scroll-panel="true" className="p-6 rounded-2xl glass-panel relative z-10 space-y-5">
            <div className="flex items-center gap-2.5 border-b border-white/[0.08] pb-3 relative z-10">
              <HardDrive className="w-5 h-5 text-accent-mint" />
              <h3 className="text-base font-bold text-content-primary">Data Backup & Migration</h3>
            </div>

            <p className="text-xs text-content-secondary leading-relaxed relative z-10">
              Export your entire workspace (projects, tasks, coursework, milestones, images, and settings) into a single, validated JSON file. You can restore this file into any fresh browser instance running Nemo.
            </p>

            <div className="flex flex-wrap items-center gap-3 relative z-10">
              <Button onClick={handleExportBackup} className="gap-2">
                <DownloadCloud className="w-4 h-4" />
                <span>Export Backup (.json)</span>
              </Button>

              <input
                type="file"
                ref={fileInputRef}
                accept=".json,application/json"
                onChange={handleSelectBackupFile}
                className="hidden"
              />

              <Button
                variant="secondary"
                onClick={() => fileInputRef.current?.click()}
                className="gap-2"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Restore Backup</span>
              </Button>
            </div>
          </div>

          {/* Danger Zone: Workspace Reset */}
          <div data-scroll-panel="true" className="p-6 rounded-2xl glass-panel border border-red-500/30 bg-red-950/15 relative z-10 space-y-4">
            <div className="flex items-center gap-2.5 text-accent-ember relative z-10">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <h3 className="text-base font-bold">Danger Zone: Reset Workspace</h3>
            </div>

            <p className="text-xs text-content-secondary leading-relaxed relative z-10">
              Wiping your workspace clears all IndexedDB tables and returns Nemo to an empty first-run state. This action is immediate and cannot be undone unless you have an exported backup.
            </p>

            <div className="relative z-10">
              <Button
                variant="danger"
                size="sm"
                onClick={() => setIsResetConfirmOpen(true)}
                className="gap-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>Reset All Workspace Data</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Account & Sync Panel */}
      {activeTab === 'account_sync' && (
        <div data-enter>
          <AccountSyncPanel />
        </div>
      )}

      {/* Demo Mode Panel */}
      {activeTab === 'demo' && (
        <div data-enter>
          <DemoWorkspacePanel />
        </div>
      )}

      {/* About & Welcome Notice Panel */}
      {activeTab === 'about' && (
        <div data-enter className="space-y-6">
          <div data-scroll-panel="true" className="p-6 rounded-2xl glass-panel relative z-10 space-y-5">
            <div className="flex items-center gap-2.5 border-b border-white/[0.08] pb-3 relative z-10">
              <Sparkles className="w-5 h-5 text-accent-mint" />
              <div>
                <h3 className="text-base font-bold text-content-primary">Welcome to Nemo</h3>
                <p className="text-xs text-content-secondary mt-0.5">
                  The intentional workspace for focused work, coursework, projects, and goals.
                </p>
              </div>
            </div>

            <div className="space-y-4 text-xs text-content-secondary leading-relaxed relative z-10">
              <p>
                <strong className="text-white">Track it, finish it.</strong> Nemo is designed as a calm, distraction-free command center that prioritizes your commitments without noisy popups or overwhelming feeds.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-2">
                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                  <div className="font-semibold text-accent-mint text-sm mb-1">100% Local Durability</div>
                  <p className="text-[11px] text-content-tertiary">
                    All your records live directly in your browser's IndexedDB. Full speed, zero latency, and works completely offline.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                  <div className="font-semibold text-accent-ember text-sm mb-1">Seamless Cloud Sync</div>
                  <p className="text-[11px] text-content-tertiary">
                    When you sign in, changes sync smoothly across your laptop, phone, and tablet with end-to-end cryptographic integrity.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                  <div className="font-semibold text-white text-sm mb-1">Zero Telemetry</div>
                  <p className="text-[11px] text-content-tertiary">
                    No third-party trackers, no invasive analytics, and no spammy emails. Only you control your workspace data.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-3 relative z-10">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  replayWelcomeAnimation();
                  success('Brand Animation', 'Playing signature Nemo welcome intro.');
                }}
                className="gap-2 text-xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-accent-mint" />
                <span>Replay Brand Intro Animation</span>
              </Button>
            </div>
          </div>

          <div data-scroll-panel="true" className="p-5 rounded-2xl border border-white/[0.08] bg-white/[0.02] flex items-center justify-between text-xs text-content-tertiary">
            <div>
              <span className="font-semibold text-white">Nemo Workspace</span> &bull; Version 0.1.0
            </div>
            <div className="font-mono text-[11px]">
              Tavola Motion Release
            </div>
          </div>
        </div>
      )}

      </section>
      {/* Restore Confirmation Modal */}
      <Modal
        isOpen={isRestoreModalOpen}
        onClose={() => setIsRestoreModalOpen(false)}
        title="Confirm Backup Restore"
        maxWidth="md"
      >
        <div className="space-y-4">
          <p className="text-xs text-content-secondary leading-relaxed">
            Restoring will replace all current workspace records atomically with the contents of this backup file:
          </p>

          <div className="p-3.5 rounded-xl bg-surface border border-border-subtle font-mono text-xs text-content-primary whitespace-pre-line">
            {pendingBackupSummary}
          </div>

          <div className="p-3 rounded-lg bg-accent-amber/10 border border-accent-amber/30 text-xs text-accent-amber">
            <strong>Warning:</strong> Any unsaved changes on this device will be replaced.
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-border-subtle">
            <Button
              variant="ghost"
              onClick={() => setIsRestoreModalOpen(false)}
              disabled={isImporting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmRestore}
              isLoading={isImporting}
            >
              Confirm Restore
            </Button>
          </div>
        </div>
      </Modal>

      {/* Reset Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={handleConfirmReset}
        title="Reset Entire Workspace?"
        description="Are you absolutely sure? All projects, tasks, academic courses, milestones, and settings will be permanently erased from this browser profile."
        confirmLabel="Yes, Erase Everything"
        variant="danger"
      />
    </div>
  );
};
