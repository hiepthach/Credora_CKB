import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ClusterForm } from '@/components/cluster/ClusterForm';
import { useWallet } from '@/hooks/useWallet';

vi.mock('@/hooks/useWallet', () => ({
  useWallet: vi.fn(),
}));

describe('ClusterForm issuerDid binding', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders issuerDid dropdown when wallet owns DIDs and includes it on submit', () => {
    vi.mocked(useWallet).mockReturnValue({
      issuerDids: ['did:ckb:qqschool000000000000000000', 'did:ckb:qqpersonal0000000000000000'],
      isConnected: true,
    } as any);

    const handleSubmit = vi.fn();
    render(<ClusterForm onSubmit={handleSubmit} />);

    fireEvent.change(screen.getByPlaceholderText(/e\.g\., CKB Blockchain Academy/i), {
      target: { value: 'CKB Academy' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Describe your organization/i), {
      target: { value: 'Leading academy for CKB' },
    });

    const didSelect = screen.getByRole('combobox', { name: /Associated Issuer DID/i });
    expect(didSelect).toBeInTheDocument();

    fireEvent.change(didSelect, {
      target: { value: 'did:ckb:qqschool000000000000000000' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Register Institution/i }));

    expect(handleSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'CKB Academy',
        description: 'Leading academy for CKB',
        issuerDid: 'did:ckb:qqschool000000000000000000',
      })
    );
  });

  it('renders standard note when wallet has 0 DIDs and submits without issuerDid', () => {
    vi.mocked(useWallet).mockReturnValue({
      issuerDids: [],
      isConnected: true,
    } as any);

    const handleSubmit = vi.fn();
    render(<ClusterForm onSubmit={handleSubmit} />);

    expect(screen.queryByRole('combobox', { name: /Associated Issuer DID/i })).not.toBeInTheDocument();
    expect(screen.getByText(/Tip: If your wallet owns a did:ckb on Vellum/i)).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText(/e\.g\., CKB Blockchain Academy/i), {
      target: { value: 'Minimal Academy' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Describe your organization/i), {
      target: { value: 'Minimal Description' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Register Institution/i }));

    expect(handleSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Minimal Academy',
        description: 'Minimal Description',
        issuerDid: undefined,
      })
    );
  });
});
