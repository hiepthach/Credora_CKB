'use client';

import { ReactNode, HTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export type BadgeVariant = 'neutral' | 'success' | 'warning' | 'danger' | 'lavender' | 'default';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  pulse?: boolean;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-midnight text-ash border-dusk',
  neutral: 'bg-midnight text-ash border-dusk',
  success:
    'bg-emerald-500/10 text-emerald-800 border-emerald-500/25 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800',
  warning:
    'bg-amber-500/10 text-amber-800 border-amber-500/25 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800',
  danger:
    'bg-red-500/10 text-red-800 border-red-500/25 dark:bg-red-950 dark:text-red-400 dark:border-red-800',
  lavender:
    'bg-lavender-spark/10 text-lavender-spark border-lavender-spark/25 shadow-glow-violet/30 dark:bg-deep-indigo dark:text-lavender dark:border-iris dark:shadow-glow-violet',
};

const pulseColors: Record<BadgeVariant, string> = {
  default: 'bg-ash',
  neutral: 'bg-ash',
  success: 'bg-emerald-600 dark:bg-emerald-400',
  warning: 'bg-amber-600 dark:bg-amber-400',
  danger: 'bg-red-600 dark:bg-red-400',
  lavender: 'bg-lavender-spark dark:bg-lavender',
};

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = 'neutral', pulse = false, className, children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={twMerge(
          clsx(
            'inline-flex items-center gap-1.5 px-3 py-1 rounded-badge text-xs font-medium tracking-wide transition-all duration-200 border',
            variantStyles[variant],
            className
          )
        )}
        {...props}
      >
        {pulse && (
          <span className="relative flex h-2 w-2 mr-0.5">
            <span className={clsx('animate-ping-slow absolute inline-flex h-full w-full rounded-full opacity-75', pulseColors[variant])} />
            <span className={clsx('relative inline-flex rounded-full h-2 w-2', pulseColors[variant])} />
          </span>
        )}
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

