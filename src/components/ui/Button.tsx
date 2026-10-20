import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading = false, children, disabled, ...props }, ref) => {
    const baseClasses =
      'inline-flex items-center justify-center font-bold rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring disabled:opacity-50 disabled:pointer-events-none select-none active:scale-[0.98]';

    const sizeClasses = {
      sm: 'text-xs px-3.5 py-1.5 h-8 gap-1.5',
      md: 'text-sm px-4 py-2 h-10 gap-2',
      lg: 'text-base px-6 py-2.5 h-12 gap-2.5',
    };

    const variantClasses = {
      // Tavola luxury ember gradient: warm, readable, zero eye strain
      primary:
        'bg-gradient-to-br from-[#F5C8BC] to-[#EAA999] text-[#2E1813] dark:text-[#2E1813] shadow-[0_8px_22px_-10px_rgba(245,200,188,0.6)] hover:brightness-105 border border-white/20',
      secondary:
        'bg-surface/80 hover:bg-surface-hover text-content-primary border border-border-subtle hover:border-border-emphasis shadow-sm backdrop-blur-md',
      ghost:
        'hover:bg-surface-hover/80 text-content-secondary hover:text-content-primary',
      danger:
        'bg-accent-ember/20 text-accent-ember hover:bg-accent-ember/30 border border-accent-ember/40',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseClasses, sizeClasses[size], variantClasses[variant], className)}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
