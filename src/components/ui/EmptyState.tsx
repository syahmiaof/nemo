import React from 'react';
import { Button } from './Button';
import { type LucideIcon } from 'lucide-react';

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}) => {
  return (
    <div className="relative flex flex-col items-center justify-center p-8 sm:p-14 text-center rounded-[28px] border border-dashed border-border-subtle bg-gradient-to-b from-surface/40 to-surface/10 overflow-hidden my-4">
      {/* Subtle radial ambient light behind the icon */}
      <div
        className="absolute w-44 h-44 rounded-full pointer-events-none -top-10 bg-accent-mint/10 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative p-4 rounded-2xl bg-surface/90 border border-border-emphasis text-accent-mint mb-4 shadow-glass-pop backdrop-blur-md">
        <Icon className="w-7 h-7 stroke-[1.8]" />
      </div>

      <h3 className="text-lg font-bold tracking-tight text-content-primary mb-1.5">{title}</h3>
      <p className="text-xs text-content-secondary max-w-md mb-6 leading-relaxed font-medium">
        {description}
      </p>

      {actionLabel && onAction && (
        <Button onClick={onAction} size="md">
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
