import { useState } from 'react';
import {
  FlaskConical,
  RotateCcw,
  FolderGit2,
  CheckSquare,
  GraduationCap,
  Compass,
  Moon,
  Wallet,
} from 'lucide-react';
import { getWorkspaceMode, switchWorkspace, resetDemoWorkspace } from '@/db/workspace';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';

export function DemoWorkspacePanel() {
  const demo = getWorkspaceMode() === 'demo';
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const { error, success } = useToast();

  const switchMode = () => {
    try {
      switchWorkspace(demo ? 'real' : 'demo');
    } catch (e) {
      error('Could not switch workspace', e instanceof Error ? e.message : 'Please retry.');
    }
  };

  const reset = async () => {
    setBusy(true);
    try {
      await resetDemoWorkspace();
      setConfirm(false);
      success('Demo restored', 'Your personal workspace was not changed.');
    } catch (e) {
      error('Reset failed', e instanceof Error ? e.message : 'Please retry.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl glass-panel relative z-10 space-y-5">
        <div className="flex items-center gap-2.5 border-b border-white/[0.08] pb-3 relative z-10">
          <FlaskConical className="w-5 h-5 text-accent-mint" />
          <div>
            <h3 className="text-base font-bold text-content-primary">Demo Workspace Environment</h3>
            <p className="text-xs text-content-secondary mt-0.5">
              Experience Nemo with an isolated, rich fictional dataset without modifying personal records.
            </p>
          </div>
        </div>

        {/* Current State Card */}
        <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${demo ? 'bg-amber-400 animate-pulse' : 'bg-accent-mint'}`} />
              <span className="text-xs font-semibold uppercase tracking-wider text-content-primary">
                Current Status: {demo ? 'Demo Sandbox Active' : 'Personal Workspace Active'}
              </span>
            </div>
            <p className="text-xs text-content-secondary leading-relaxed">
              {demo
                ? 'You are currently inside the isolated demo sandbox. Edits stay separate from your personal data.'
                : 'You are using your real, private workspace. All data is securely stored in local IndexedDB.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 flex-shrink-0">
            <Button
              onClick={switchMode}
              variant={demo ? 'secondary' : 'primary'}
              size="sm"
              className="gap-1.5"
            >
              <FlaskConical className="w-4 h-4" />
              <span>{demo ? 'Return to Personal Workspace' : 'Enter Demo Mode'}</span>
            </Button>

            {demo && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirm(true)}
                className="gap-1.5 text-accent-ember hover:bg-accent-ember/10"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Demo Data</span>
              </Button>
            )}
          </div>
        </div>

        {/* Feature Overview Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-2 relative z-10">
          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-1.5">
            <div className="flex items-center gap-2 text-white font-semibold text-xs">
              <FolderGit2 className="w-4 h-4 text-accent-mint" />
              <span>18 Curated Projects & Covers</span>
            </div>
            <p className="text-[11px] text-content-secondary leading-relaxed">
              Full case studies, tech stacks (TypeScript, React, Node.js), client labels, and linked milestones.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-1.5">
            <div className="flex items-center gap-2 text-white font-semibold text-xs">
              <CheckSquare className="w-4 h-4 text-accent-ember" />
              <span>150 Unified Tasks & Focus Slots</span>
            </div>
            <p className="text-[11px] text-content-secondary leading-relaxed">
              Priority tags (urgent, high, medium), Today's Focus slots (max 3), and realistic completion histories.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-1.5">
            <div className="flex items-center gap-2 text-white font-semibold text-xs">
              <GraduationCap className="w-4 h-4 text-indigo-400" />
              <span>Academics, Subjects & Exams</span>
            </div>
            <p className="text-[11px] text-content-secondary leading-relaxed">
              Two terms of coursework, assignments, live countdowns, and scheduled exam dates on calendar.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-1.5">
            <div className="flex items-center gap-2 text-white font-semibold text-xs">
              <Compass className="w-4 h-4 text-amber-400" />
              <span>Vision Board & 12M Roadmaps</span>
            </div>
            <p className="text-[11px] text-content-secondary leading-relaxed">
              1-year, 3-year, and 5-year vision cards with Unsplash imagery, cost tracking, and monthly mascots.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-1.5">
            <div className="flex items-center gap-2 text-white font-semibold text-xs">
              <Moon className="w-4 h-4 text-emerald-400" />
              <span>Ibadah & Spiritual Hub</span>
            </div>
            <p className="text-[11px] text-content-secondary leading-relaxed">
              5 daily prayers with congregation tracking, Sunnah, tasbih counter, and Mazhab Syafi'i fidyah calculator.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-1.5">
            <div className="flex items-center gap-2 text-white font-semibold text-xs">
              <Wallet className="w-4 h-4 text-cyan-400" />
              <span>Finance & Health Metrics</span>
            </div>
            <p className="text-[11px] text-content-secondary leading-relaxed">
              Recurring salary and freelance incomes, safe-to-spend ratios, debts, hydration, and workout logs.
            </p>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirm}
        onClose={() => setConfirm(false)}
        onConfirm={reset}
        title="Reset Demo Workspace?"
        description="This will restore all demo projects, coursework, tasks, and goals back to their original factory state. Your personal workspace will remain completely untouched."
        confirmLabel={busy ? 'Resetting…' : 'Reset Demo'}
        variant="danger"
      />
    </div>
  );
}
