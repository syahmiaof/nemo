import React from 'react';
import { cn } from '@/lib/utils';
import type { Priority, ProjectStatus, TaskStatus, AssignmentStatus, GoalStatus } from '@/domain/types';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'mint' | 'amber' | 'ember' | 'outline' | 'blue' | 'purple';
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
    sm: 'text-[11px] px-2.5 py-1 font-semibold tracking-wide',
    md: 'text-xs px-3 py-1.5 font-semibold',
  };

  const variantClasses = {
    default: 'bg-slate-900/85 text-slate-100 border border-slate-400/40 shadow-sm backdrop-blur-md',
    mint: 'bg-emerald-950/85 text-emerald-300 border border-emerald-400/60 shadow-[0_0_12px_rgba(16,185,129,0.3)] backdrop-blur-md',
    amber: 'bg-amber-950/85 text-amber-300 border border-amber-400/60 shadow-[0_0_12px_rgba(245,158,11,0.3)] backdrop-blur-md',
    ember: 'bg-rose-950/85 text-rose-200 border border-rose-400/60 shadow-[0_0_12px_rgba(244,63,94,0.3)] backdrop-blur-md',
    blue: 'bg-sky-950/85 text-sky-200 border border-sky-400/60 shadow-[0_0_12px_rgba(56,189,248,0.3)] backdrop-blur-md',
    purple: 'bg-purple-950/85 text-purple-200 border border-purple-400/60 shadow-[0_0_12px_rgba(168,85,247,0.3)] backdrop-blur-md',
    outline: 'border border-white/30 text-slate-100 bg-black/60 shadow-sm backdrop-blur-md',
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
  status: ProjectStatus | TaskStatus | AssignmentStatus | GoalStatus | 'archived';
  size?: 'sm' | 'md';
  withDot?: boolean;
}> = ({ status, size = 'sm', withDot = true }) => {
  let label = (status as string).replace('_', ' ');
  let variant: BadgeProps['variant'] = 'default';
  let dotColor = 'bg-slate-300 shadow-[0_0_6px_#cbd5e1]';

  const s = status as string;
  if (s === 'completed' || s === 'done' || s === 'achieved' || s === 'graded') {
    variant = 'mint';
    label = s === 'done' ? 'Done' : s === 'achieved' ? 'Achieved' : s === 'graded' ? 'Graded' : 'Completed';
    dotColor = 'bg-emerald-400 shadow-[0_0_8px_#34d399]';
  } else if (s === 'in_progress' || s === 'active' || s === 'submitted') {
    variant = 'amber';
    label = s === 'in_progress' ? 'In Progress' : s === 'submitted' ? 'Submitted' : 'Active';
    dotColor = 'bg-amber-400 shadow-[0_0_8px_#fbbf24]';
  } else if (s === 'on_hold' || s === 'paused') {
    variant = 'ember';
    label = s === 'on_hold' ? 'On Hold' : 'Paused';
    dotColor = 'bg-rose-400 shadow-[0_0_8px_#f43f5e]';
  } else if (s === 'not_started' || s === 'todo') {
    variant = 'default';
    label = s === 'todo' ? 'To Do' : 'Not Started';
    dotColor = 'bg-slate-300 shadow-[0_0_6px_#cbd5e1]';
  } else if (s === 'archived') {
    variant = 'purple';
    label = 'Archived';
    dotColor = 'bg-purple-400 shadow-[0_0_8px_#c084fc]';
  }

  return (
    <Badge variant={variant} size={size} className="capitalize flex items-center gap-1.5 shadow-md">
      {withDot && (
        <span
          className={cn(
            'rounded-full shrink-0',
            size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2',
            dotColor
          )}
          aria-hidden="true"
        />
      )}
      <span>{label}</span>
    </Badge>
  );
};
