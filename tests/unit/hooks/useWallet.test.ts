import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useWallet } from '@/hooks/useWallet';
import { useCcc } from '@ckb-ccc/connector-react';
import { findIssuerDid, listIssuerDids } from '@/lib/did';

vi.mock('@ckb-ccc/connector-react', () => ({
  useCcc: vi.fn(),
}));

vi.mock('@/lib/did', () => ({
  findIssuerDid: vi.fn(),
  listIssuerDids: vi.fn(),
}));

describe('useWallet issuer DID auto-detection', () => {
  const mockOpen = vi.fn();
  const mockClose = vi.fn();
  const mockDisconnect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(findIssuerDid).mockResolvedValue(null);
    vi.mocked(listIssuerDids).mockResolvedValue([]);
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
    expect(result.current.issuerDids).toEqual([]);
    expect(result.current.isLoadingIssuerDid).toBe(false);
    expect(result.current.isLoadingIssuerDids).toBe(false);
    expect(findIssuerDid).not.toHaveBeenCalled();
    expect(listIssuerDids).not.toHaveBeenCalled();
  });

  it('resolves issuerDids array when signer owns multiple DIDs', async () => {
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

    const mockDids = [
      'did:ckb:qqfirstdid00000000000000',
      'did:ckb:qqseconddid0000000000000',
    ];
    vi.mocked(listIssuerDids).mockResolvedValueOnce(mockDids);
    vi.mocked(findIssuerDid).mockResolvedValueOnce(mockDids[0]);

    const { result } = renderHook(() => useWallet());

    await waitFor(() => {
      expect(result.current.address).toBe('ckt1qtestaddress');
      expect(result.current.issuerDids).toEqual(mockDids);
      expect(result.current.issuerDid).toBe(mockDids[0]);
      expect(result.current.isLoadingIssuerDids).toBe(false);
    });

    expect(listIssuerDids).toHaveBeenCalledWith(mockSigner);
  });
});

