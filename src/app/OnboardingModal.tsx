import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ShieldCheck, HardDrive, DownloadCloud, Sparkles } from 'lucide-react';
import { db } from '@/db/nemoDb';
import type { WorkspaceSettings } from '@/domain/types';

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: () => void;
  settings?: WorkspaceSettings;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onComplete,
  settings,
}) => {
  const [displayName, setDisplayName] = useState(settings?.displayName || 'My Workspace');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleStart = async () => {
    setIsSubmitting(true);
    try {
      await db.settings.update('default', {
        displayName: displayName.trim() || 'My Workspace',
        onboardingCompleted: true,
      });
      onComplete();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = async () => {
    await db.settings.update('default', {
      onboardingCompleted: true,
    });
    onComplete();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleSkip} maxWidth="md">
      <div className="text-center pt-2 pb-4">
        <div className="inline-flex p-3 rounded-2xl bg-surface border border-border-emphasis text-accent-mint mb-3 shadow-lg">
          <img src="/nemo-icon.svg" alt="Nemo" className="w-10 h-10" />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-content-primary">
          Welcome to <span className="text-accent-mint font-sans">nemo.</span>
        </h2>
        <p className="text-xs text-content-tertiary font-mono uppercase tracking-widest mt-1">
          Track it, finish it.
        </p>
      </div>

      {/* Honest Privacy Manifesto */}
      <div className="space-y-2.5 p-4 rounded-xl bg-surface/70 border border-border-subtle text-xs text-content-secondary leading-relaxed">
        <div className="flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-accent-mint flex-shrink-0 mt-0.5" />
          <p>
            <strong className="text-content-primary">100% Private & Browser-Local:</strong> Your workspace lives entirely inside this browser via IndexedDB. No accounts, no analytics, no external tracking.
          </p>
        </div>
        <div className="flex items-start gap-2.5">
          <HardDrive className="w-4 h-4 text-accent-amber flex-shrink-0 mt-0.5" />
          <p>
            <strong className="text-content-primary">No Automatic Cloud Sync:</strong> Your data never leaves this device without your action.
          </p>
        </div>
        <div className="flex items-start gap-2.5">
          <DownloadCloud className="w-4 h-4 text-accent-mint flex-shrink-0 mt-0.5" />
          <p>
            <strong className="text-content-primary">Portable Backups:</strong> Export your full database and images with a single click anytime in Settings to keep it safe or move between devices.
          </p>
        </div>
      </div>

      <div className="space-y-3 pt-2">
        <Input
          label="Workspace / Display Name"
          placeholder="e.g. Alex's Workspace"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
        />
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-border-subtle mt-4">
        <button
          type="button"
          onClick={handleSkip}
          className="text-xs text-content-tertiary hover:text-content-primary transition-colors underline"
        >
          Skip customization
        </button>
        <Button onClick={handleStart} isLoading={isSubmitting} className="gap-2">
          <Sparkles className="w-4 h-4" />
          <span>Start Workspace</span>
        </Button>
      </div>
    </Modal>
  );
};
