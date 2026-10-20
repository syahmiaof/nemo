import React from 'react';
import { cn } from '@/lib/utils';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: SelectOption[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, id, ...props }, ref) => {
    const generatedId = React.useId();
    const selectId = id || props.name || generatedId;

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={selectId} className="block text-xs font-medium text-content-secondary">
            {label}
          </label>
        )}
        <select
          id={selectId}
          ref={ref}
          className={cn(
            'w-full px-3 py-2 bg-surface border rounded-lg text-sm text-content-primary transition-colors cursor-pointer',
            'border-border-subtle focus:border-border-emphasis focus:ring-1 focus:ring-accent-ring focus:outline-none',
            error && 'border-accent-ember',
            className
          )}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-surface-solid text-content-primary">
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="text-xs text-accent-ember">{error}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
