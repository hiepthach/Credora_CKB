'use client';

import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';

export interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className = '' }: ThemeToggleProps) {
  const { isDark, toggleTheme, mounted } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`p-2 bg-shadow-plum rounded-xl border border-fog-line/15 hover:border-lavender-spark/40 text-mid-ash hover:text-bone-white transition-all duration-200 flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-lavender-spark/50 ${className}`}
      title={mounted ? (isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode') : 'Toggle Theme'}
      aria-label={mounted ? (isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode') : 'Toggle Theme'}
    >
      {!mounted ? (
        <Moon className="w-3.5 h-3.5" />
      ) : isDark ? (
        <Sun className="w-3.5 h-3.5 text-lavender-spark hover:rotate-45 transition-transform duration-300" />
      ) : (
        <Moon className="w-3.5 h-3.5 text-lavender-spark hover:-rotate-12 transition-transform duration-300" />
      )}
    </button>
  );
}

