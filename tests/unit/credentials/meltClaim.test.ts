import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ccc } from '@ckb-ccc/core';
import { meltVellumClaim, meltVellumClaimWithCellDeps, buildAtomicMeltTransaction } from '@/lib/credentials/meltClaim';

// Mock @usevellum/sdk at the top level
vi.mock('@usevellum/sdk', () => ({
  readClaims: vi.fn(),
}));

import { findClaimBySporeId } from '@/lib/credentials/vellumClaim';
import { readClaims } from '@usevellum/sdk';

// Helper to create mock claims with proper Claim structure
function createMockClaim(overrides: Partial<{
  claimId: string;
  outPoint: { txHash: string; index: number };
  payload: Record<string, unknown>;
}> = {}) {
  return {
    claimId: overrides.claimId ?? '0x' + 'ab'.repeat(32),
    outPoint: {
      txHash: overrides.outPoint?.txHash ?? '0x' + '01'.repeat(32),
      index: overrides.outPoint?.index ?? 0,
    },
    payload: overrides.payload ?? { spore_id: '0x' + 'ab'.repeat(32) },
  };
}

describe('MeltClaim', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('findClaimBySporeId', () => {
    it('should return null when no claims exist for subject', async () => {
      (readClaims as ReturnType<typeof vi.fn>).mockResolvedValue({
        claims: [],
        invalid: [],
      });

      const mockClient = {
        getLiveCells: vi.fn().mockResolvedValue({ objects: [] }),
        getKnownScript: vi.fn(),
      } as any;
      const mockScripts = { claimType: {}, didLock: {} };

      const result = await findClaimBySporeId({
        client: mockClient,
        subjectDid: 'did:ckb:qqtest000',
        sporeId: '0x' + 'ab'.repeat(32),
        scripts: mockScripts as any,
      });

      expect(result).toBeNull();
      expect(readClaims).toHaveBeenCalledWith(
        expect.objectContaining({
          client: mockClient,
          filter: expect.objectContaining({
            subject: { did: 'did:ckb:qqtest000' },
          }),
        })
      );
    });

    it('should return claim when spore_id matches', async () => {
      const targetSporeId = '0x' + 'ab'.repeat(32);
      const mockOutPoint = { txHash: '0x' + '01'.repeat(32), index: 0 };

      (readClaims as ReturnType<typeof vi.fn>).mockResolvedValue({
        claims: [{
          ...createMockClaim({ claimId: 'claim_123', outPoint: mockOutPoint, payload: { spore_id: targetSporeId } }),
          // Include cell with outPoint for the actual implementation
          cell: { outPoint: mockOutPoint },
        }],
        invalid: [],
      });

      const mockClient = {
        getLiveCells: vi.fn().mockResolvedValue({ objects: [] }),
        getKnownScript: vi.fn(),
      } as any;
      const mockScripts = { claimType: {}, didLock: {} };

      const result = await findClaimBySporeId({
        client: mockClient,
        subjectDid: 'did:ckb:qqtest000',
        sporeId: targetSporeId,
        scripts: mockScripts as any,
      });

      expect(result).not.toBeNull();
      expect(result?.claim.claimId).toBe('claim_123');
      expect(result?.outPoint).toEqual(mockOutPoint);
    });

    it('should return null when spore_id does not match', async () => {
      const mockOutPoint = { txHash: '0x' + '01'.repeat(32), index: 0 };

      (readClaims as ReturnType<typeof vi.fn>).mockResolvedValue({
        claims: [{
          ...createMockClaim({ claimId: 'claim_456', outPoint: mockOutPoint, payload: { spore_id: '0x' + 'cc'.repeat(32) } }),
          cell: { outPoint: mockOutPoint },
        }],
        invalid: [],
      });

      const mockClient = {
        getLiveCells: vi.fn().mockResolvedValue({ objects: [] }),
        getKnownScript: vi.fn(),
      } as any;
      const mockScripts = { claimType: {}, didLock: {} };

      const result = await findClaimBySporeId({
        client: mockClient,
        subjectDid: 'did:ckb:qqtest000',
        sporeId: '0x' + 'ab'.repeat(32), // different from mock
        scripts: mockScripts as any,
      });

      expect(result).toBeNull();
    });

    it('should skip claims with invalid payload', async () => {
      const targetSporeId = '0x' + 'ab'.repeat(32);
      const mockOutPoint1 = { txHash: '0x' + 'dd'.repeat(32), index: 0 };
      const mockOutPoint2 = { txHash: '0x' + '01'.repeat(32), index: 0 };

      (readClaims as ReturnType<typeof vi.fn>).mockResolvedValue({
        claims: [
          {
            ...createMockClaim({ claimId: 'claim_invalid', outPoint: mockOutPoint1, payload: { invalid: 'payload' } }),
            cell: { outPoint: mockOutPoint1 },
          },
          {
            ...createMockClaim({ claimId: 'claim_123', outPoint: mockOutPoint2, payload: { spore_id: targetSporeId } }),
            cell: { outPoint: mockOutPoint2 },
          },
        ],
        invalid: [],
      });

      const mockClient = {
        getLiveCells: vi.fn().mockResolvedValue({ objects: [] }),
        getKnownScript: vi.fn(),
      } as any;
      const mockScripts = { claimType: {}, didLock: {} };

      const result = await findClaimBySporeId({
        client: mockClient,
        subjectDid: 'did:ckb:qqtest000',
        sporeId: targetSporeId,
        scripts: mockScripts as any,
      });

      expect(result).not.toBeNull();
      expect(result?.claim.claimId).toBe('claim_123');
    });
  });

  describe('meltVellumClaim', () => {
    it('should return empty transaction hash when no claim exists', async () => {
      (readClaims as ReturnType<typeof vi.fn>).mockResolvedValue({
        claims: [],
        invalid: [],
      });

      const mockSigner = {
        client: {
          getLiveCells: vi.fn(),
          getKnownScript: vi.fn(),
        },
      } as any;

      const result = await meltVellumClaim(
        mockSigner,
        'did:ckb:qqtest000',
        '0x' + 'ab'.repeat(32)
      );

      expect(result.transactionHash).toBe('');
    });

    it('should return empty transaction hash when findClaimBySporeId returns null', async () => {
      (readClaims as ReturnType<typeof vi.fn>).mockResolvedValue({
        claims: [],
        invalid: [],
      });

      const mockSigner = {
        client: {
          getLiveCells: vi.fn(),
          getKnownScript: vi.fn(),
        },
        sendTransaction: vi.fn(),
      } as any;

      const result = await meltVellumClaim(
        mockSigner,
        'did:ckb:qqtest000',
        '0x' + 'ab'.repeat(32)
      );

      expect(result.transactionHash).toBe('');
      expect(mockSigner.sendTransaction).not.toHaveBeenCalled();
    });
  });

  describe('meltVellumClaimWithCellDeps', () => {
    it('should return empty hash when no claim exists', async () => {
      (readClaims as ReturnType<typeof vi.fn>).mockResolvedValue({
        claims: [],
        invalid: [],
      });

      const mockSigner = {
        client: {
          getLiveCells: vi.fn(),
          getKnownScript: vi.fn(),
        },
        sendTransaction: vi.fn(),
      } as any;

      const result = await meltVellumClaimWithCellDeps(
        mockSigner,
        'did:ckb:qqtest000',
        '0x' + 'ab'.repeat(32)
      );

      expect(result.transactionHash).toBe('');
      expect(mockSigner.sendTransaction).not.toHaveBeenCalled();
    });
  });

  describe('buildAtomicMeltTransaction', () => {
    it('should return null when no claim cell exists', async () => {
      (readClaims as ReturnType<typeof vi.fn>).mockResolvedValue({
        claims: [],
        invalid: [],
      });

      const mockSigner = {
        client: {
          getKnownScript: vi.fn(),
        },
      } as unknown as ccc.Signer;

      const targetSporeId = '0x' + 'ab'.repeat(32) as `0x${string}`;
      const result = await buildAtomicMeltTransaction(
        mockSigner,
        targetSporeId,
        'did:ckb:qqtest000',
      );

      expect(result).toBeNull();
    });

    it('should return null when readClaims throws', async () => {
      (readClaims as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'));

      const mockSigner = {
        client: {
          getKnownScript: vi.fn(),
        },
      } as unknown as ccc.Signer;

      const targetSporeId = '0x' + 'ab'.repeat(32) as `0x${string}`;
      const result = await buildAtomicMeltTransaction(
        mockSigner,
        targetSporeId,
        'did:ckb:qqtest000',
      );

      expect(result).toBeNull();
    });
  });
});
