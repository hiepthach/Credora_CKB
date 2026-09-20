import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AccountMenu } from '@/components/wallet/AccountMenu';
import * as walletHook from '@/hooks/useWallet';

vi.mock('@/hooks/useWallet');

describe('AccountMenu component', () => {
  const mockDisconnect = vi.fn();
  const sampleAddress = 'ckt1qrejnmlar3r452tcg57gvq8patctcgy8acync0hxfnyka35ywafvkqgj2xytre60kv8kr43syxjj45769h77qzd5qq790twu';

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(walletHook.useWallet).mockReturnValue({
      address: sampleAddress,
      disconnect: mockDisconnect,
      open: vi.fn(),
      isConnected: true,
    } as any);

    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it('renders trigger button with truncated address', () => {
    render(<AccountMenu />);
    // Address is 100+ chars, should be truncated to ckt1qr...0twu
    expect(screen.getByText('ckt1qr...0twu')).toBeInTheDocument();
  });

  it('returns null when address is not present', () => {
    vi.mocked(walletHook.useWallet).mockReturnValue({
      address: null,
      disconnect: mockDisconnect,
      open: vi.fn(),
      isConnected: false,
    } as any);

    const { container } = render(<AccountMenu />);
    expect(container.firstChild).toBeNull();
  });

  it('opens dropdown popover when trigger is clicked', () => {
    render(<AccountMenu />);
    const trigger = screen.getByRole('button', { name: /account menu/i });

    expect(screen.queryByText('Connected Wallet')).not.toBeInTheDocument();

    fireEvent.click(trigger);

    expect(screen.getByText('Connected Wallet')).toBeInTheDocument();
    expect(screen.getByText(sampleAddress)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /view on ckb explorer/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /disconnect wallet/i })).toBeInTheDocument();
  });

  it('copies address to clipboard and shows visual feedback', async () => {
    render(<AccountMenu />);
    fireEvent.click(screen.getByRole('button', { name: /account menu/i }));

    const copyBtn = screen.getByRole('button', { name: /copy/i });
    fireEvent.click(copyBtn);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(sampleAddress);
    await waitFor(() => {
      expect(screen.getByText('Copied')).toBeInTheDocument();
    });
  });

  it('calls disconnect when disconnect button is clicked', () => {
    render(<AccountMenu />);
    fireEvent.click(screen.getByRole('button', { name: /account menu/i }));

    const disconnectBtn = screen.getByRole('button', { name: /disconnect wallet/i });
    fireEvent.click(disconnectBtn);

    expect(mockDisconnect).toHaveBeenCalledTimes(1);
    // Menu should be closed after disconnect
    expect(screen.queryByText('Connected Wallet')).not.toBeInTheDocument();
  });

  it('closes dropdown when clicking outside', () => {
    render(
      <div>
        <div data-testid="outside">Outside area</div>
        <AccountMenu />
      </div>
    );

    fireEvent.click(screen.getByRole('button', { name: /account menu/i }));
    expect(screen.getByText('Connected Wallet')).toBeInTheDocument();

    fireEvent.mouseDown(screen.getByTestId('outside'));
    expect(screen.queryByText('Connected Wallet')).not.toBeInTheDocument();
  });

  it('closes dropdown when pressing Escape key', () => {
    render(<AccountMenu />);
    fireEvent.click(screen.getByRole('button', { name: /account menu/i }));
    expect(screen.getByText('Connected Wallet')).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByText('Connected Wallet')).not.toBeInTheDocument();
  });
});
