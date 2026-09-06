import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Spinner } from '@/components/ui/Spinner';

describe('Spinner component', () => {
  it('renders loading spinner with default size', () => {
    const { container } = render(<Spinner />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders text label when provided', () => {
    render(<Spinner label="Verifying cell on CKB..." />);
    expect(screen.getByText('Verifying cell on CKB...')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<Spinner className="custom-spinner-class" />);
    expect(container.firstChild).toHaveClass('custom-spinner-class');
  });
});
