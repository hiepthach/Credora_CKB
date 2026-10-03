import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ccc } from '@ckb-ccc/core';
import { meltVellumClaim, meltVellumClaimWithCellDeps, buildAtomicMeltTransaction } from '@/lib/credentials/meltClaim';

// Mock @usevellum/sdk at the top level
vi.mock('@usevellum/sdk', () => ({
  readClaims: vi.fn(),
}));

vi.mock('@ckb-ccc/did-ckb', () => ({
  isDidCkb: vi.fn((did: string) => typeof did === 'string' && did.startsWith('did:ckb:')),
  resolveDidCkb: vi.fn(),
}));

vi.mock('@ckb-ccc/spore', () => ({
  meltSpore: vi.fn(),
}));

import { findClaimBySporeId, VELLUM_DEPLOYMENT_TX_HASH } from '@/lib/credentials/vellumClaim';
import { readClaims } from '@usevellum/sdk';
import { resolveDidCkb } from '@ckb-ccc/did-ckb';
import { meltSpore } from '@ckb-ccc/spore';

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

    it('should delegate to meltVellumClaimWithCellDeps when includeCellDeps is true', async () => {
      const targetSporeId = '0x' + 'ab'.repeat(32);
      const mockOutPoint = { txHash: '0x' + '01'.repeat(32), index: 0 };

      (readClaims as ReturnType<typeof vi.fn>).mockResolvedValue({
        claims: [{
          ...createMockClaim({ claimId: 'claim_123', outPoint: mockOutPoint, payload: { spore_id: targetSporeId } }),
          cell: { outPoint: mockOutPoint },
        }],
        invalid: [],
      });

      const mockSigner = {
        client: {
          getLiveCells: vi.fn(),
          getKnownScript: vi.fn(),
          getCell: vi.fn().mockResolvedValue(
            ccc.Cell.from({
              outPoint: mockOutPoint,
              cellOutput: {
                capacity: BigInt(100_000_000_000),
                lock: { codeHash: '0x' + '00'.repeat(32), hashType: 'type', args: '0x' },
              },
              outputData: '0x',
            })
          ),
        },
        getRecommendedAddressObj: vi.fn().mockResolvedValue({
          script: { codeHash: '0x' + '00'.repeat(32), hashType: 'type', args: '0x' },
        }),
        findCells: vi.fn().mockReturnValue((async function* () {})()),
        prepareTransaction: vi.fn((tx) => tx),
        sendTransaction: vi.fn().mockResolvedValue('0x' + 'tx'.repeat(32)),
      } as any;

      const result = await meltVellumClaim(
        mockSigner,
        'did:ckb:qqtest000',
        targetSporeId,
        { includeCellDeps: true },
      );

      expect(result.transactionHash).toBe('0x' + 'tx'.repeat(32));
      expect(mockSigner.sendTransaction).toHaveBeenCalled();
      const sentTx = mockSigner.sendTransaction.mock.calls[0][0];
      expect(sentTx.cellDeps.length).toBeGreaterThan(0);
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

    it('should include Claim Type, DID Lock, and subject Identity cellDeps when claim exists', async () => {
      const targetSporeId = '0x' + 'ab'.repeat(32);
      const mockOutPoint = { txHash: '0x' + '01'.repeat(32), index: 0 };
      const mockDidCellOutPoint = { txHash: '0x' + 'dd'.repeat(32), index: 0 };

      (readClaims as ReturnType<typeof vi.fn>).mockResolvedValue({
        claims: [{
          ...createMockClaim({ claimId: 'claim_123', outPoint: mockOutPoint, payload: { spore_id: targetSporeId } }),
          cell: { outPoint: mockOutPoint },
        }],
        invalid: [],
      });

      (resolveDidCkb as ReturnType<typeof vi.fn>).mockResolvedValue({
        did: 'did:ckb:qqtest000',
        cell: { outPoint: mockDidCellOutPoint },
      });

      const mockSigner = {
        client: {
          getLiveCells: vi.fn(),
          getKnownScript: vi.fn(),
          getCell: vi.fn().mockResolvedValue(
            ccc.Cell.from({
              outPoint: mockOutPoint,
              cellOutput: {
                capacity: BigInt(100_000_000_000),
                lock: { codeHash: '0x' + '00'.repeat(32), hashType: 'type', args: '0x' },
              },
              outputData: '0x',
            })
          ),
        },
        getRecommendedAddressObj: vi.fn().mockResolvedValue({
          script: { codeHash: '0x' + '00'.repeat(32), hashType: 'type', args: '0x' },
        }),
        findCells: vi.fn().mockReturnValue((async function* () {})()),
        prepareTransaction: vi.fn((tx) => tx),
        sendTransaction: vi.fn().mockResolvedValue('0x' + 'tx'.repeat(32)),
      } as any;

      const result = await meltVellumClaimWithCellDeps(
        mockSigner,
        'did:ckb:qqtest000',
        targetSporeId,
      );

      expect(result.transactionHash).toBe('0x' + 'tx'.repeat(32));
      expect(mockSigner.sendTransaction).toHaveBeenCalled();
      const sentTx = mockSigner.sendTransaction.mock.calls[0][0];

      const depOutPoints = sentTx.cellDeps.map((cd: any) => ({
        txHash: cd.outPoint.txHash,
        index: Number(cd.outPoint.index),
      }));

      expect(depOutPoints).toContainEqual({
        txHash: VELLUM_DEPLOYMENT_TX_HASH,
        index: 0,
      });
      expect(depOutPoints).toContainEqual({
        txHash: VELLUM_DEPLOYMENT_TX_HASH,
        index: 1,
      });
      expect(depOutPoints).toContainEqual({
        txHash: mockDidCellOutPoint.txHash,
        index: 0,
      });
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

    it('should combine Spore melt and Claim melt preserving spore cellDeps and witnesses', async () => {
      const targetSporeId = ('0x' + 'ab'.repeat(32)) as `0x${string}`;
      const mockClaimOutPoint = { txHash: '0x' + '01'.repeat(32), index: 0 };
      const mockSporeOutPoint = { txHash: '0x' + 'ee'.repeat(32), index: 0 };
      const mockSporeDepOutPoint = { txHash: '0x' + 'ff'.repeat(32), index: 0 };
      const mockDidCellOutPoint = { txHash: '0x' + 'dd'.repeat(32), index: 0 };

      (readClaims as ReturnType<typeof vi.fn>).mockResolvedValue({
        claims: [{
          ...createMockClaim({ claimId: 'claim_123', outPoint: mockClaimOutPoint, payload: { spore_id: targetSporeId } }),
          cell: { outPoint: mockClaimOutPoint },
        }],
        invalid: [],
      });

      (resolveDidCkb as ReturnType<typeof vi.fn>).mockResolvedValue({
        did: 'did:ckb:qqtest000',
        cell: { outPoint: mockDidCellOutPoint },
      });

      const sporeInput = new ccc.CellInput(ccc.OutPoint.from(mockSporeOutPoint), BigInt(0));
      const sporeDep = ccc.CellDep.from({ outPoint: mockSporeDepOutPoint, depType: 'code' });
      const mockSporeTx = new ccc.Transaction(
        BigInt(0),
        [sporeDep],
        [],
        [sporeInput],
        [],
        [],
        ['0x1234'],
      );

      (meltSpore as ReturnType<typeof vi.fn>).mockResolvedValue({
        tx: mockSporeTx,
      });

      const mockSigner = {
        client: {
          getKnownScript: vi.fn(),
        },
      } as unknown as ccc.Signer;

      const combinedTx = await buildAtomicMeltTransaction(
        mockSigner,
        targetSporeId,
        'did:ckb:qqtest000',
      );

      expect(combinedTx).not.toBeNull();
      // Both spore input and claim input
      expect(combinedTx!.inputs.length).toBe(2);
      expect(combinedTx!.inputs[0].previousOutput.txHash).toBe(mockSporeOutPoint.txHash);
      expect(combinedTx!.inputs[1].previousOutput.txHash).toBe(mockClaimOutPoint.txHash);

      // Cobuild witnesses preserved
      expect(combinedTx!.witnesses).toEqual(['0x1234']);

      // Cell deps include Spore dep, Claim Type dep, DID Lock dep, and Subject Identity cellDep
      const depOutPoints = combinedTx!.cellDeps.map((cd) => ({
        txHash: cd.outPoint.txHash,
        index: Number(cd.outPoint.index),
      }));

      expect(depOutPoints).toContainEqual({
        txHash: mockSporeDepOutPoint.txHash,
        index: 0,
      });
      expect(depOutPoints).toContainEqual({
        txHash: VELLUM_DEPLOYMENT_TX_HASH,
        index: 0,
      });
      expect(depOutPoints).toContainEqual({
        txHash: VELLUM_DEPLOYMENT_TX_HASH,
        index: 1,
      });
      expect(depOutPoints).toContainEqual({
        txHash: mockDidCellOutPoint.txHash,
        index: 0,
      });
    });

    it('should deduplicate cellDeps if sporeTx already contains Vellum cellDeps', async () => {
      const targetSporeId = ('0x' + 'ab'.repeat(32)) as `0x${string}`;
      const mockClaimOutPoint = { txHash: '0x' + '01'.repeat(32), index: 0 };
      const mockSporeOutPoint = { txHash: '0x' + 'ee'.repeat(32), index: 0 };

      (readClaims as ReturnType<typeof vi.fn>).mockResolvedValue({
        claims: [{
          ...createMockClaim({ claimId: 'claim_123', outPoint: mockClaimOutPoint, payload: { spore_id: targetSporeId } }),
          cell: { outPoint: mockClaimOutPoint },
        }],
        invalid: [],
      });

      // Spore transaction that already has Claim Type cellDep
      const duplicateDep = ccc.CellDep.from({
        outPoint: { txHash: VELLUM_DEPLOYMENT_TX_HASH, index: 0 },
        depType: 'code',
      });
      const sporeInput = new ccc.CellInput(ccc.OutPoint.from(mockSporeOutPoint), BigInt(0));
      const mockSporeTx = new ccc.Transaction(
        BigInt(0),
        [duplicateDep],
        [],
        [sporeInput],
        [],
        [],
        [],
      );

      (meltSpore as ReturnType<typeof vi.fn>).mockResolvedValue({
        tx: mockSporeTx,
      });

      const mockSigner = {
        client: {
          getKnownScript: vi.fn(),
        },
      } as unknown as ccc.Signer;

      const combinedTx = await buildAtomicMeltTransaction(
        mockSigner,
        targetSporeId,
        'did:ckb:qqtest000',
      );

      expect(combinedTx).not.toBeNull();
      // Count how many times VELLUM_DEPLOYMENT_TX_HASH:0 appears
      const matches = combinedTx!.cellDeps.filter(
        (cd) => cd.outPoint.txHash.toLowerCase() === VELLUM_DEPLOYMENT_TX_HASH.toLowerCase() && Number(cd.outPoint.index) === 0
      );
      expect(matches.length).toBe(1);
    });
  });
});

