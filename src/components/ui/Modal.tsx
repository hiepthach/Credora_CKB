'use client';

import { ReactNode, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl';
}

const sizeStyles = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
  '6xl': 'max-w-6xl',
};

export function Modal({ isOpen, onClose, title, children, footer, size = 'md' }: ModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 dark:bg-midnight-plum/80 backdrop-blur-sm transition-opacity duration-300 z-0 no-print"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Surface — Doppler elevated panel */}
      <div
        className={twMerge(
          clsx(
            'relative bg-shadow-plum border border-fog-line/15 rounded-card shadow-2xl',
            'w-full mx-auto animate-fade-in-scale z-10 flex flex-col max-h-[90vh] overflow-hidden my-auto',
            sizeStyles[size]
          )
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-fog-line/10 flex-shrink-0 bg-midnight-plum/40 no-print">
            <h2 className="text-base font-semibold text-bone-white tracking-tight">{title}</h2>
            <button
              onClick={onClose}
              className="p-1.5 text-ash-veil hover:text-bone-white transition-colors rounded-btn hover:bg-white/5"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="px-6 py-5 overflow-y-auto flex-1">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-6 py-4 border-t border-fog-line/10 flex justify-end gap-3 bg-midnight-plum/40 flex-shrink-0 no-print">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

