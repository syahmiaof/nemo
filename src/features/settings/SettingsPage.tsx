import React, { useState, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  Settings as SettingsIcon,
  ShieldCheck,
  DownloadCloud,
  UploadCloud,
  Trash2,
  Moon,
  Sun,
  HardDrive,
  User,
  AlertTriangle,
} from 'lucide-react';
import { db, exportWorkspaceBackup, importWorkspaceBackup, resetWorkspaceData } from '@/db/nemoDb';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import type { WorkspaceSettings } from '@/domain/types';

export const SettingsPage: React.FC = () => {
  const { success, error } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const settings = useLiveQuery(() => db.settings.get('default'), []);

  // Form states
  const [displayName, setDisplayName] = useState('');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [weekStartsOn, setWeekStartsOn] = useState<0 | 1>(1);
  const [hourFormat, setHourFormat] = useState<'12h' | '24h'>('24h');
  const [reduceMotion, setReduceMotion] = useState(false);

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

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      error('Name cannot be empty');
      return;
    }
    await db.settings.update('default', {
      displayName: displayName.trim(),
    });
    success('Profile updated');
  };

  const handleUpdatePreferences = async (updates: Partial<WorkspaceSettings>) => {
    await db.settings.update('default', updates);
    if (updates.theme) {
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
    // Reset file input so same file can be re-selected if desired
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

  return (
    <div className="space-y-8 max-w-4xl mx-auto animate-in fade-in duration-200">
      {/* Privacy Manifesto Card */}
      <div className="p-6 rounded-2xl bg-surface border border-border-subtle space-y-3">
        <div className="flex items-center gap-2.5 text-accent-mint">
          <ShieldCheck className="w-5 h-5 flex-shrink-0" />
          <h2 className="text-base font-bold text-content-primary">Privacy & Storage Guarantee</h2>
        </div>
        <p className="text-xs text-content-secondary leading-relaxed">
          Nemo does not use cloud databases, tracking analytics, or external accounts. All your data lives securely in this browser’s IndexedDB storage. Remember: <strong className="text-content-primary">local-first does not mean automatically backed up</strong>. Export backups regularly to safeguard against browser cache clears or to transfer data to another machine.
        </p>
      </div>

      {/* Profile & Identity */}
      <div className="p-6 rounded-2xl bg-surface border border-border-subtle space-y-5">
        <div className="flex items-center gap-2.5 border-b border-border-subtle pb-3">
          <User className="w-5 h-5 text-accent-mint" />
          <h3 className="text-base font-bold text-content-primary">Workspace Profile</h3>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4 max-w-md">
          <Input
            label="Display / Workspace Name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="e.g. Alex's Command Center"
            required
          />

          <Button type="submit" size="sm">
            Save Name
          </Button>
        </form>
      </div>

      {/* Preferences & Appearance */}
      <div className="p-6 rounded-2xl bg-surface border border-border-subtle space-y-5">
        <div className="flex items-center gap-2.5 border-b border-border-subtle pb-3">
          <SettingsIcon className="w-5 h-5 text-accent-mint" />
          <h3 className="text-base font-bold text-content-primary">Appearance & Behavior</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Theme Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-content-secondary">Theme</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setTheme('dark');
                  handleUpdatePreferences({ theme: 'dark' });
                }}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-semibold transition-all ${
                  theme === 'dark'
                    ? 'bg-surface-hover border-accent-mint text-accent-mint font-bold shadow-sm'
                    : 'bg-surface-solid border-border-subtle text-content-secondary hover:text-content-primary'
                }`}
              >
                <Moon className="w-4 h-4" />
                <span>Midnight Navy</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTheme('light');
                  handleUpdatePreferences({ theme: 'light' });
                }}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-semibold transition-all ${
                  theme === 'light'
                    ? 'bg-surface-hover border-accent-mint text-accent-mint font-bold shadow-sm'
                    : 'bg-surface-solid border-border-subtle text-content-secondary hover:text-content-primary'
                }`}
              >
                <Sun className="w-4 h-4" />
                <span>Clean Slate</span>
              </button>
            </div>
          </div>

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
          <div className="space-y-2 flex flex-col justify-end">
            <label className="flex items-center gap-2 text-xs font-medium text-content-primary cursor-pointer select-none">
              <input
                type="checkbox"
                checked={reduceMotion}
                onChange={(e) => {
                  setReduceMotion(e.target.checked);
                  handleUpdatePreferences({ reduceMotion: e.target.checked });
                }}
                className="rounded border-border-subtle text-accent-mint focus:ring-accent-ring"
              />
              <span>Respect / Force Reduced Motion</span>
            </label>
            <p className="text-[11px] text-content-tertiary">
              Disables spatial transitions and decorative GSAP animations.
            </p>
          </div>
        </div>
      </div>

      {/* Backup, Export & Restore */}
      <div className="p-6 rounded-2xl bg-surface border border-border-subtle space-y-5">
        <div className="flex items-center gap-2.5 border-b border-border-subtle pb-3">
          <HardDrive className="w-5 h-5 text-accent-mint" />
          <h3 className="text-base font-bold text-content-primary">Data Backup & Migration</h3>
        </div>

        <p className="text-xs text-content-secondary leading-relaxed">
          Export your entire workspace (projects, tasks, coursework, milestones, images, and settings) into a single, validated JSON file. You can restore this file into any fresh browser instance running Nemo.
        </p>

        <div className="flex flex-wrap items-center gap-3">
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
      <div className="p-6 rounded-2xl bg-accent-ember/5 border border-accent-ember/25 space-y-4">
        <div className="flex items-center gap-2.5 text-accent-ember">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <h3 className="text-base font-bold">Danger Zone: Reset Workspace</h3>
        </div>

        <p className="text-xs text-content-secondary leading-relaxed">
          Wiping your workspace clears all IndexedDB tables and returns Nemo to an empty first-run state. This action is immediate and cannot be undone unless you have an exported backup.
        </p>

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
