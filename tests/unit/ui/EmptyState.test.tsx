import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { EmptyState } from '@/components/ui/EmptyState';

describe('EmptyState component', () => {
  it('renders icon, title and description', () => {
    render(
      <EmptyState
        icon="📜"
        title="No Records Found"
        description="Try broadening your search criteria."
      />
    );
    expect(screen.getByText('📜')).toBeInTheDocument();
    expect(screen.getByText('No Records Found')).toBeInTheDocument();
    expect(screen.getByText('Try broadening your search criteria.')).toBeInTheDocument();
  });

  it('triggers action callback when action button clicked', () => {
    const handleAction = vi.fn();
    render(
      <EmptyState
        title="Empty List"
        action={{ label: 'Create New', onClick: handleAction }}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Create New' }));
    expect(handleAction).toHaveBeenCalledTimes(1);
  });
});
