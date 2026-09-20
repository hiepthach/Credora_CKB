'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
}

const variantStyles = {
  primary:
    'bg-signal-green bg-iris text-white dark:text-black font-medium hover:bg-signal-green/90 hover:shadow-glow-green border border-transparent active:scale-[0.98]',
  secondary:
    'bg-shadow-plum bg-deep-indigo hover:bg-[#383042] text-bone-white text-lilac-white border border-fog-line/15 border-dusk/30 hover:border-fog-line/30 active:scale-[0.98]',
  danger:
    'bg-red-950/60 bg-red-900/50 hover:bg-red-900/70 text-red-300 border border-red-800/50 active:scale-[0.98]',
  ghost:
    'bg-transparent hover:bg-shadow-plum/60 text-ash-veil hover:text-bone-white border border-transparent hover:border-fog-line/15 active:scale-[0.98]',
};

const sizeStyles = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      fullWidth = false,
      disabled,
      className,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={twMerge(
          clsx(
            'group inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 ease-out select-none',
            'rounded-btn focus:outline-none',
            'focus-visible:ring-2 focus-visible:ring-lavender focus-visible:ring-offset-2 focus-visible:ring-offset-midnight-plum',
            'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none disabled:active:scale-100',
            variantStyles[variant],
            sizeStyles[size],
            fullWidth && 'w-full',
            className
          )
        )}
        {...props}
      >
        {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

