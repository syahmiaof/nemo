import React from 'react';
import { cn } from '@/lib/utils';
import type { Priority, ProjectStatus, TaskStatus, AssignmentStatus, GoalStatus } from '@/domain/types';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'mint' | 'amber' | 'ember' | 'outline';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'default',
  size = 'md',
  children,
  ...props
}) => {
  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 font-medium tracking-wide',
    md: 'text-xs px-2.5 py-1 font-medium',
  };

  const variantClasses = {
    default: 'bg-surface-hover text-content-secondary border border-border-subtle',
    mint: 'bg-accent-mint/15 text-accent-mint border border-accent-mint/30',
    amber: 'bg-accent-amber/15 text-accent-amber border border-accent-amber/30',
    ember: 'bg-accent-ember/15 text-accent-ember border border-accent-ember/30',
    outline: 'border border-border-emphasis text-content-secondary',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full leading-none whitespace-nowrap select-none',
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};

export const PriorityBadge: React.FC<{ priority: Priority; size?: 'sm' | 'md' }> = ({ priority, size = 'sm' }) => {
  const map: Record<Priority, { label: string; variant: BadgeProps['variant'] }> = {
    low: { label: 'Low', variant: 'default' },
    medium: { label: 'Medium', variant: 'outline' },
    high: { label: 'High', variant: 'amber' },
    urgent: { label: 'Urgent', variant: 'ember' },
  };
  const { label, variant } = map[priority] || map.medium;
  return <Badge variant={variant} size={size}>{label}</Badge>;
};

export const StatusBadge: React.FC<{
  status: ProjectStatus | TaskStatus | AssignmentStatus | GoalStatus;
  size?: 'sm' | 'md';
}> = ({ status, size = 'sm' }) => {
  let label = status.replace('_', ' ');
  let variant: BadgeProps['variant'] = 'default';

  if (status === 'completed' || status === 'done' || status === 'achieved' || status === 'graded') {
    variant = 'mint';
    label = status === 'done' ? 'Done' : status === 'achieved' ? 'Achieved' : status === 'graded' ? 'Graded' : 'Completed';
  } else if (status === 'in_progress' || status === 'active' || status === 'submitted') {
    variant = 'amber';
    label = status === 'in_progress' ? 'In Progress' : status === 'submitted' ? 'Submitted' : 'Active';
  } else if (status === 'on_hold' || status === 'paused') {
    variant = 'ember';
    label = status === 'on_hold' ? 'On Hold' : 'Paused';
  }

  return (
    <Badge variant={variant} size={size} className="capitalize">
      {label}
    </Badge>
  );
};
