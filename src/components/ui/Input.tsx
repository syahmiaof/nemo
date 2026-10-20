import React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, id, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id || props.name || generatedId;

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-medium text-content-secondary">
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={cn(
            'w-full px-3 py-2 bg-surface border rounded-lg text-sm text-content-primary placeholder:text-content-tertiary transition-colors',
            'border-border-subtle focus:border-border-emphasis focus:ring-1 focus:ring-accent-ring focus:outline-none',
            error && 'border-accent-ember focus:border-accent-ember focus:ring-accent-ember',
            className
          )}
          {...props}
        />
        {error ? (
          <p className="text-xs text-accent-ember">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-content-tertiary">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
