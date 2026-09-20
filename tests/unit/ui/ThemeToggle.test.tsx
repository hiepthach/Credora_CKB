import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

describe('ThemeToggle component', () => {
  let localStorageMock: Record<string, string> = {};

  beforeEach(() => {
    localStorageMock = {};
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => localStorageMock[key] || null,
      setItem: (key: string, value: string) => {
        localStorageMock[key] = value;
      },
      removeItem: (key: string) => {
        delete localStorageMock[key];
      },
      clear: () => {
        localStorageMock = {};
      },
    });

    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }))
    );

    document.documentElement.className = '';
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    document.documentElement.className = '';
  });

  it('renders theme toggle button with accessible label', () => {
    render(<ThemeToggle />);
    const button = screen.getByRole('button', { name: /switch to light mode|toggle theme/i });
    expect(button).toBeInTheDocument();
  });

  it('defaults to dark mode when no preference is saved', () => {
    render(<ThemeToggle />);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(screen.getByRole('button', { name: /switch to light mode/i })).toBeInTheDocument();
  });

  it('toggles from dark to light mode on click', () => {
    render(<ThemeToggle />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(localStorageMock['credora_theme']).toBe('light');
    expect(screen.getByRole('button', { name: /switch to dark mode/i })).toBeInTheDocument();
  });

  it('toggles back from light to dark mode on second click', () => {
    render(<ThemeToggle />);

    const button = screen.getByRole('button');
    fireEvent.click(button); // switch to light
    expect(document.documentElement.classList.contains('dark')).toBe(false);

    fireEvent.click(button); // switch back to dark
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorageMock['credora_theme']).toBe('dark');
  });

  it('initializes in light mode when saved in localStorage', () => {
    localStorageMock['credora_theme'] = 'light';
    render(<ThemeToggle />);

    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(screen.getByRole('button', { name: /switch to dark mode/i })).toBeInTheDocument();
  });

  it('applies custom className to the button', () => {
    render(<ThemeToggle className="custom-toggle-class" />);
    const button = screen.getByRole('button');
    expect(button.className).toContain('custom-toggle-class');
  });
});

