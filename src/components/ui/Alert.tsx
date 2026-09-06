'use client';

import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, ExternalLink } from 'lucide-react';
import { cn } from '@/utils';

export type AlertVariant = 'error' | 'warning' | 'info' | 'success';

export interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children: React.ReactNode;
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
  className?: string;
}

const variantStyles: Record<AlertVariant, { container: string; iconColor: string; titleColor: string }> = {
  error: {
    container: 'bg-red-950/40 border-red-800/50 text-red-300',
    iconColor: 'text-red-400',
    titleColor: 'text-red-200',
  },
  warning: {
    container: 'bg-yellow-950/40 border-yellow-700/50 text-yellow-300',
    iconColor: 'text-yellow-400',
    titleColor: 'text-yellow-200',
  },
  info: {
    container: 'bg-midnight-plum/80 border-lavender-spark/30 text-mid-ash',
    iconColor: 'text-lavender-spark',
    titleColor: 'text-bone-white',
  },
  success: {
    container: 'bg-emerald-950/40 border-emerald-800/50 text-emerald-300',
    iconColor: 'text-emerald-400',
    titleColor: 'text-emerald-200',
  },
};

export function Alert({ variant = 'error', title, children, action, className }: AlertProps) {
  const styles = variantStyles[variant];

  const IconComponent = {
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
    success: CheckCircle2,
  }[variant];

  return (
    <div className={cn('p-4 rounded-xl border flex items-start gap-3 text-sm transition-all', styles.container, className)}>
      <IconComponent className={cn('w-5 h-5 flex-shrink-0 mt-0.5', styles.iconColor)} />
      <div className="flex-1 min-w-0 space-y-1">
        {title && <h4 className={cn('font-semibold tracking-tight', styles.titleColor)}>{title}</h4>}
        <div className="leading-relaxed text-xs sm:text-sm break-words">{children}</div>
        {action && (
          <div className="pt-2">
            {action.href ? (
              <a
                href={action.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-lavender-spark hover:underline"
              >
                <span>{action.label}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            ) : (
              <button
                type="button"
                onClick={action.onClick}
                className="inline-flex items-center text-xs font-semibold text-lavender-spark hover:underline cursor-pointer"
              >
                {action.label}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

