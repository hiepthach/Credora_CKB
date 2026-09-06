import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Alert } from '@/components/ui/Alert';

describe('Alert component', () => {
  it('renders title and message with default error styling', () => {
    render(<Alert title="Error Title">Detailed error message</Alert>);
    expect(screen.getByText('Error Title')).toBeInTheDocument();
    expect(screen.getByText('Detailed error message')).toBeInTheDocument();
  });

  it('renders action link when action provided with href', () => {
    render(
      <Alert action={{ label: 'Faucet Link', href: 'https://faucet.nervos.org' }}>
        Low funds
      </Alert>
    );
    const link = screen.getByRole('link', { name: 'Faucet Link' });
    expect(link).toHaveAttribute('href', 'https://faucet.nervos.org');
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('handles action button click when onClick provided', () => {
    const handleClick = vi.fn();
    render(
      <Alert action={{ label: 'Retry', onClick: handleClick }}>
        Network timeout
      </Alert>
    );
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('renders with different variants', () => {
    const { rerender } = render(<Alert variant="warning">Warning message</Alert>);
    expect(screen.getByText('Warning message')).toBeInTheDocument();

    rerender(<Alert variant="info">Info message</Alert>);
    expect(screen.getByText('Info message')).toBeInTheDocument();

    rerender(<Alert variant="success">Success message</Alert>);
    expect(screen.getByText('Success message')).toBeInTheDocument();
  });

  it('applies custom className when provided', () => {
    const { container } = render(<Alert className="custom-alert-class">Alert body</Alert>);
    expect(container.firstChild).toHaveClass('custom-alert-class');
  });
});

