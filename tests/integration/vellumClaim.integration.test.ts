/**
 * Vellum Claim Integration Tests
 *
 * Full flow integration tests for dual-output certificate minting:
 * Spore DOB + Vellum Claim Cell.
 *
 * Scenarios:
 * 1. Full dual-output flow: issueCertificate with withVellumClaim: true and DID recipient
 * 2. Single-output flow: issueCertificate with withVellumClaim: false
 * 3. Non-DID recipient with withVellumClaim: true (validation rejection)
 * 4. Preview integration: previewCertificateMint returning combined capacity (500 + 350 = 850 CKB)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  issueCertificate,
  previewCertificateMint,
  clearCertificateCache,
} from '@/lib/credentials/issuer';
import {
  CredoraCourseSchemaHash,
  VELLUM_DID_LOCK_DEPLOYMENT,
  VELLUM_CLAIM_TYPE_DEPLOYMENT,
} from '@/lib/credentials/vellumClaim';
import { createSpore } from '@ckb-ccc/spore';
import { readClaims, writeClaim, parseClaimPayload } from '@usevellum/sdk';
import type { CredentialSubject } from '@/types';

// Mock @usevellum/sdk
vi.mock('@usevellum/sdk', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@usevellum/sdk')>();
  return {
    ...actual,
    readClaims: vi.fn().mockResolvedValue({ claims: [], invalid: [] }),
    writeClaim: vi.fn().mockImplementation(async (props: any) => {
      if (props?.tx && typeof props.tx.addOutput === 'function') {
        props.tx.addOutput(
          {
            capacity: BigInt(350_00000000),
            lock: {
              codeHash: '0xe1562cc57b4bd91619ada2f7e74d63805ea7038a7b6de0b18a529d51aa883d2d',
              hashType: 'type',
              args: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
            },
            type: {
              codeHash: '0xfb2757e524b3f83161d8b85b8b3e00186e2019ff04f5dfe833c5a72731e13157',
              hashType: 'type',
              args: '0x' + '11'.repeat(32) + '2151e638f99c8fe85110c1ffc151dd753d3e4334f2c1f9a30679cb3e654e65a4',
            },
          },
          new Uint8Array([1, 2, 3]),
        );
      }
      return {
        tx: props?.tx ?? {},
        claimId: 'claim_' + '1'.repeat(64),
        outputIndex: 1,
        issuerSource: { kind: 'output', outputIndex: 1 },
        controllerInputIndex: 0,
        built: { txHash: '0x' + 'a'.repeat(64) },
      };
    }),
    parseClaimPayload: vi.fn(),
  };
});

// Mock @/lib/did for DID resolution
vi.mock('@/lib/did', () => ({
  isDidInput: vi.fn((val: string) => typeof val === 'string' && val.startsWith('did:ckb:')),
  resolveRecipientInput: vi.fn().mockImplementation(async (_client: unknown, input: string) => {
    if (input && input.startsWith('did:ckb:')) {
      return {
        targetAddress: 'ckt1q9gry5zgxmpjnmhrp4raggde4gf2vqqyzd5x3lt7pf5m8c2kzwfxnsvpq',
        targetLock: {
          codeHash: '0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8',
          hashType: 'type',
          args: '0x1234567890abcdef1234567890abcdef12345678',
        },
        did: input,
        isDid: true,
      };
    }
    return {
      targetAddress: input,
      targetLock: {
        codeHash: '0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8',
        hashType: 'type',
        args: '0x1234567890abcdef1234567890abcdef12345678',
      },
      isDid: false,
    };
  }),
}));

describe('Vellum Claim Integration', () => {
  const testClusterId =
    '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
  const testSporeId =
    '0x2222222222222222222222222222222222222222222222222222222222222222';
  const testTxHash = '0x' + 'a'.repeat(64);
  const testDid = 'did:ckb:qqstudentreceiver00000000000000000';
  const standardAddress =
    'ckt1q9gry5zgxmpjnmhrp4raggde4gf2vqqyzd5x3lt7pf5m8c2kzwfxnsvpq';
  const testIssuerDid =
    'did:ckb:qq2m72u8u6dxq2qru9w4f5m4h7x3z6k8u4n9p2r3s';

  const testSubjectWithDid: CredentialSubject = {
    id: testDid,
    type: 'CourseCertificate',
    name: 'Alice Developer',
    courseName: 'CKB Blockchain Fundamentals',
    completionDate: '2026-09-26',
    grade: 'A',
    score: 98,
    skills: ['CKB', 'Spore DOB', 'Vellum Claim'],
  };

  const testSubjectWithAddress: CredentialSubject = {
    id: standardAddress,
    type: 'CourseCertificate',
    name: 'Bob Learner',
    courseName: 'CKB Smart Contracts',
    completionDate: '2026-09-26',
  };

  let mockTx: {
    outputs: Array<{
      capacity: bigint;
      lock: { args: string; codeHash: string; hashType: string };
      type: { args: string; codeHash: string; hashType: string };
    }>;
    outputsData: string[];
    addOutput: ReturnType<typeof vi.fn>;
    completeInputsByCapacity: ReturnType<typeof vi.fn>;
    completeFeeBy: ReturnType<typeof vi.fn>;
  };

  const createMockSigner = () => ({
    client: {
      getTransaction: vi
        .fn()
        .mockResolvedValue({ transaction: { outputsData: [] } }),
      findCellsByLock: vi.fn().mockReturnValue({
        [Symbol.asyncIterator]: () => ({
          next: vi.fn().mockResolvedValue({ done: true, value: undefined }),
        }),
      }),
    },
    sendTransaction: vi.fn().mockResolvedValue(testTxHash),
    signTransaction: vi.fn().mockReturnValue({}),
    getRecommendedAddressObj: vi.fn().mockResolvedValue({
      toString: () => standardAddress,
      script: {
        args: '0x1234567890abcdef1234567890abcdef12345678',
        codeHash:
          '0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8',
        hashType: 'type',
      },
    }),
  });

  beforeEach(() => {
    clearCertificateCache();
    vi.clearAllMocks();

    mockTx = {
      outputs: [
        {
          capacity: BigInt(500_00000000), // 500 CKB for DOB cell
          lock: {
            args: '0x1234567890abcdef1234567890abcdef12345678',
            codeHash:
              '0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8',
            hashType: 'type',
          },
          type: {
            args: testSporeId,
            codeHash: '0x' + '22'.repeat(32),
            hashType: 'type',
          },
        },
      ],
      outputsData: ['0x'],
      addOutput: vi.fn((output, data) => {
        mockTx.outputs.push(output);
        mockTx.outputsData.push(data);
      }),
      completeInputsByCapacity: vi.fn().mockResolvedValue(undefined),
      completeFeeBy: vi.fn().mockResolvedValue(undefined),
    };

    vi.mocked(createSpore).mockImplementation(
      async () =>
        ({
          tx: mockTx,
          id: testSporeId,
        }) as any,
    );
  });

  describe('Scenario 1: Full dual-output flow', () => {
    it('issues certificate with both DOB and Claim Cell outputs', async () => {
      const mockSigner = createMockSigner();

      const result = await issueCertificate({
        signer: mockSigner,
        clusterId: testClusterId,
        issuerName: 'Credora Academy',
        issuerDescription: 'CKB Credential Issuance Authority',
        issuerDid: testIssuerDid,
        subject: testSubjectWithDid,
        withVellumClaim: true,
      });

      // Verify returned identifiers
      expect(result.sporeId).toBe(testSporeId);
      expect(result.certificateId).toBe(testSporeId);
      expect(result.transactionHash).toBe(testTxHash);
      expect(result.claimId).toBeDefined();
      expect(result.claimId).toMatch(/^claim_/);

      // Verify tx.addOutput was called with Claim Cell output (capacity 350 CKB) and data
      expect(mockTx.addOutput).toHaveBeenCalledTimes(1);
      expect(mockTx.addOutput).toHaveBeenCalledWith(
        expect.objectContaining({
          capacity: BigInt(350_00000000), // 350 CKB in shannons
          lock: expect.any(Object),
          type: expect.any(Object),
        }),
        expect.any(Uint8Array),
      );

      // Verify outputs array now contains both DOB cell and Claim Cell
      expect(mockTx.outputs).toHaveLength(2);
      expect(mockTx.outputs[0].capacity).toBe(BigInt(500_00000000));
      expect(mockTx.outputs[1].capacity).toBe(BigInt(350_00000000));

      // Verify transaction lifecycle methods were executed
      expect(mockTx.completeInputsByCapacity).toHaveBeenCalledWith(mockSigner);
      expect(mockTx.completeFeeBy).toHaveBeenCalledWith(mockSigner, 1000);
      expect(mockSigner.sendTransaction).toHaveBeenCalledWith(mockTx);
    });

    it('issues dual-output certificate when recipientDid is provided explicitly', async () => {
      const mockSigner = createMockSigner();

      const result = await issueCertificate({
        signer: mockSigner,
        clusterId: testClusterId,
        issuerName: 'Credora Academy',
        issuerDid: testIssuerDid,
        subject: testSubjectWithDid,
        withVellumClaim: true,
        recipientDid: testDid,
      });

      expect(result.claimId).toBeDefined();
      expect(mockTx.addOutput).toHaveBeenCalledTimes(1);
      expect(mockTx.outputs).toHaveLength(2);
    });

    it('distinguishes issuerDid from subjectDid and passes recipient lock and schema hash to Claim Cell', async () => {
      const mockSigner = createMockSigner();
      const customIssuerDid = 'did:ckb:qqteacherissuerplatform000000000';

      const result = await issueCertificate({
        signer: mockSigner,
        clusterId: testClusterId,
        issuerName: 'Credora Academy',
        subject: testSubjectWithDid,
        withVellumClaim: true,
        issuerDid: customIssuerDid,
      });

      expect(result.claimId).toBeDefined();
      expect(mockTx.addOutput).toHaveBeenCalledTimes(1);
      const [claimOutput] = mockTx.addOutput.mock.calls[0];

      // Verify DID lock was used for the Claim Cell
      expect(claimOutput.lock.codeHash).toBe(
        VELLUM_DID_LOCK_DEPLOYMENT.codeHash,
      );
      // Verify Claim Type script has CredoraCourseSchemaHash in args
      expect(claimOutput.type.args).toContain(CredoraCourseSchemaHash.slice(2));
      // Verify issuerDid and subjectDid are distinct
      expect(customIssuerDid).not.toBe(testSubjectWithDid.id);
    });

    it('sends the updated transaction returned by writeClaim (cloned tx)', async () => {
      const mockSigner = createMockSigner();
      const updatedTx = {
        ...mockTx,
        completeInputsByCapacity: vi.fn().mockResolvedValue(undefined),
        completeFeeBy: vi.fn().mockResolvedValue(undefined),
      };

      vi.mocked(writeClaim).mockResolvedValueOnce({
        tx: updatedTx as any,
        claimId: 'claim_' + '2'.repeat(64),
        outputIndex: 1,
        issuerSource: { kind: 'output', outputIndex: 1 },
        controllerInputIndex: 0,
        built: { txHash: '0x' + 'b'.repeat(64) },
      });

      await issueCertificate({
        signer: mockSigner,
        clusterId: testClusterId,
        issuerName: 'Credora Academy',
        issuerDid: testIssuerDid,
        subject: testSubjectWithDid,
        withVellumClaim: true,
      });

      expect(updatedTx.completeInputsByCapacity).toHaveBeenCalledWith(mockSigner);
      expect(updatedTx.completeFeeBy).toHaveBeenCalledWith(mockSigner, 1000);
      expect(mockSigner.sendTransaction).toHaveBeenCalledWith(updatedTx);
    });
  });

  describe('Scenario 2: Single-output flow', () => {
    it('issues certificate with only DOB cell when withVellumClaim is false', async () => {
      const mockSigner = createMockSigner();

      const result = await issueCertificate({
        signer: mockSigner,
        clusterId: testClusterId,
        issuerName: 'Credora Academy',
        subject: testSubjectWithDid,
        withVellumClaim: false,
      });

      // Verify returned identifiers
      expect(result.sporeId).toBe(testSporeId);
      expect(result.certificateId).toBe(testSporeId);
      expect(result.transactionHash).toBe(testTxHash);
      expect(result.claimId).toBeUndefined();

      // Verify tx.addOutput was NOT called
      expect(mockTx.addOutput).not.toHaveBeenCalled();
      expect(mockTx.outputs).toHaveLength(1);
    });

    it('issues certificate with only DOB cell when withVellumClaim is omitted', async () => {
      const mockSigner = createMockSigner();

      const result = await issueCertificate({
        signer: mockSigner,
        clusterId: testClusterId,
        issuerName: 'Credora Academy',
        subject: testSubjectWithAddress,
      });

      expect(result.claimId).toBeUndefined();
      expect(mockTx.addOutput).not.toHaveBeenCalled();
      expect(mockTx.outputs).toHaveLength(1);
    });
  });

  describe('Scenario 3: Non-DID recipient validation', () => {
    it('rejects with error when recipient is a standard address and withVellumClaim is true', async () => {
      const mockSigner = createMockSigner();

      await expect(
        issueCertificate({
          signer: mockSigner,
          clusterId: testClusterId,
          issuerName: 'Credora Academy',
          issuerDid: testIssuerDid,
          subject: testSubjectWithAddress, // standard CKB address, not a DID
          withVellumClaim: true,
        }),
      ).rejects.toThrow('Recipient must be a DID for Vellum Claim');

      // Verify transaction was never built or output added
      expect(mockTx.addOutput).not.toHaveBeenCalled();
      expect(mockSigner.sendTransaction).not.toHaveBeenCalled();
    });

    it('rejects with error when recipientDid is an invalid DID string', async () => {
      const mockSigner = createMockSigner();

      await expect(
        issueCertificate({
          signer: mockSigner,
          clusterId: testClusterId,
          issuerName: 'Credora Academy',
          issuerDid: testIssuerDid,
          subject: testSubjectWithDid,
          withVellumClaim: true,
          recipientDid: 'ckt1qznotadid', // invalid DID
        }),
      ).rejects.toThrow('Recipient must be a DID for Vellum Claim');

      expect(mockTx.addOutput).not.toHaveBeenCalled();
    });
  });

  describe('Scenario 4: Preview integration', () => {
    it('returns combined capacity with dynamic claimCellCapacity (>= 350 CKB)', async () => {
      const mockSigner = createMockSigner();

      const preview = await previewCertificateMint({
        signer: mockSigner,
        clusterId: testClusterId,
        issuerName: 'Credora Academy',
        issuerDid: testIssuerDid,
        subject: testSubjectWithDid,
        withVellumClaim: true,
      });

      expect(preview.dobCellCapacity).toBe(500);
      expect(preview.claimCellCapacity).toBe(401);
      expect(preview.exactCapacity).toBe(901);
      expect(preview.sporeId).toBe(testSporeId);
    });

    it('returns single DOB capacity (500 CKB) when withVellumClaim is false', async () => {
      const mockSigner = createMockSigner();

      const preview = await previewCertificateMint({
        signer: mockSigner,
        clusterId: testClusterId,
        issuerName: 'Credora Academy',
        subject: testSubjectWithDid,
        withVellumClaim: false,
      });

      expect(preview.dobCellCapacity).toBe(500);
      expect(preview.claimCellCapacity).toBeUndefined();
      expect(preview.exactCapacity).toBe(500);
    });

    it('supports two-argument overload previewCertificateMint(signer, params)', async () => {
      const mockSigner = createMockSigner();

      const preview = await previewCertificateMint(mockSigner, {
        clusterId: testClusterId,
        issuerName: 'Credora Academy',
        issuerDid: testIssuerDid,
        subject: testSubjectWithDid,
        withVellumClaim: true,
      });

      expect(preview.dobCellCapacity).toBe(500);
      expect(preview.claimCellCapacity).toBe(401);
      expect(preview.exactCapacity).toBe(901);
    });

    it('calculates claimCellCapacity dynamically when payload exceeds 350 CKB standard', async () => {
      const mockSigner = createMockSigner();
      const longIssuerName = 'Super Detailed Academy For Advanced Nervos CKB Architecture '.repeat(5);

      const preview = await previewCertificateMint({
        signer: mockSigner,
        clusterId: testClusterId,
        issuerName: longIssuerName,
        issuerDid: testIssuerDid,
        subject: testSubjectWithDid,
        withVellumClaim: true,
      });

      expect(preview.claimCellCapacity).toBeGreaterThan(350);
      expect(preview.exactCapacity).toBe(500 + preview.claimCellCapacity!);
    });
  });

  describe('Scenario 5: Vellum SDK API mocking', () => {
    it('provides mock implementations for readClaims, writeClaim, and parseClaimPayload', async () => {
      const readResult = await readClaims({} as any);
      expect(readResult).toEqual({ claims: [], invalid: [] });

      const writeResult = await writeClaim({} as any);
      expect((writeResult as any).built?.txHash).toBe('0x' + 'a'.repeat(64));
      expect(writeResult.claimId).toBeDefined();

      expect(parseClaimPayload).toBeDefined();
    });
  });
});
