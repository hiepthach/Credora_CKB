import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useWallet } from '@/hooks/useWallet';
import { useCcc } from '@ckb-ccc/connector-react';
import { findIssuerDid } from '@/lib/did';

vi.mock('@ckb-ccc/connector-react', () => ({
  useCcc: vi.fn(),
}));

vi.mock('@/lib/did', () => ({
  findIssuerDid: vi.fn(),
}));

describe('useWallet issuer DID auto-detection', () => {
  const mockOpen = vi.fn();
  const mockClose = vi.fn();
  const mockDisconnect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('resolves issuerDid when signer is present and has a registered DID', async () => {
    const mockSigner = {
      getRecommendedAddress: vi.fn().mockResolvedValue('ckt1qtestaddress'),
    };
    const mockClient = {
      getBalance: vi.fn().mockResolvedValue(BigInt(1000)),
    };

    vi.mocked(useCcc).mockReturnValue({
      open: mockOpen,
      close: mockClose,
      disconnect: mockDisconnect,
      client: mockClient as any,
      signerInfo: { signer: mockSigner as any } as any,
      wallet: {} as any,
    } as any);

    vi.mocked(findIssuerDid).mockResolvedValueOnce('did:ckb:qqtestissuerdid0000000000000');

    const { result } = renderHook(() => useWallet());

    await waitFor(() => {
      expect(result.current.address).toBe('ckt1qtestaddress');
      expect(result.current.issuerDid).toBe('did:ckb:qqtestissuerdid0000000000000');
      expect(result.current.isLoadingIssuerDid).toBe(false);
    });

    expect(findIssuerDid).toHaveBeenCalledWith(mockSigner);
  });

  it('sets issuerDid to null when signer has no registered DID', async () => {
    const mockSigner = {
      getRecommendedAddress: vi.fn().mockResolvedValue('ckt1qtestaddress'),
    };
    const mockClient = {
      getBalance: vi.fn().mockResolvedValue(BigInt(1000)),
    };

    vi.mocked(useCcc).mockReturnValue({
      open: mockOpen,
      close: mockClose,
      disconnect: mockDisconnect,
      client: mockClient as any,
      signerInfo: { signer: mockSigner as any } as any,
      wallet: {} as any,
    } as any);

    vi.mocked(findIssuerDid).mockResolvedValueOnce(null);

    const { result } = renderHook(() => useWallet());

    await waitFor(() => {
      expect(result.current.address).toBe('ckt1qtestaddress');
      expect(result.current.issuerDid).toBeNull();
      expect(result.current.isLoadingIssuerDid).toBe(false);
    });
  });

  it('sets issuerDid to null on disconnect when no signer is present', async () => {
    vi.mocked(useCcc).mockReturnValue({
      open: mockOpen,
      close: mockClose,
      disconnect: mockDisconnect,
      client: null,
      signerInfo: null,
      wallet: null,
    } as any);

    const { result } = renderHook(() => useWallet());

    expect(result.current.address).toBeNull();
    expect(result.current.issuerDid).toBeNull();
    expect(result.current.isLoadingIssuerDid).toBe(false);
    expect(findIssuerDid).not.toHaveBeenCalled();
  });
});
