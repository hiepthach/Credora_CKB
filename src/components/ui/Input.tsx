'use client';

import { InputHTMLAttributes, forwardRef, ChangeEvent } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label?: string;
  error?: string;
  helperText?: string;
  onChange?: (value: string) => void;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className, id, onChange, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
      onChange?.(e.target.value);
    };

    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-ash-veil"
          >
            {label}
            {props.required && <span className="text-red-500 dark:text-red-400 ml-1">*</span>}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={twMerge(
            clsx(
              'w-full px-3.5 py-2.5 rounded-xl text-sm',
              'bg-midnight-plum border border-fog-line/15',
              'text-bone-white placeholder-mid-ash',
              'transition-all duration-200 ease-out',
              'focus:outline-none focus:ring-2 focus:ring-lavender-spark/40 focus:border-lavender-spark/50',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              error && 'border-red-500 focus:ring-red-500',
              className
            )
          )}
          onChange={handleChange}
          {...props}
        />
        {error && <p className="text-sm font-medium text-red-600 dark:text-red-400 animate-fade-in">{error}</p>}
        {helperText && !error && (
          <p className="text-sm text-ash-veil">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';


