/**
 * Certificate Service Tests - Issuer Module
 *
 * Tests for certificate issuance, retrieval, and melting.
 * Reference: Design_spec/03_Certificate_Service.md
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { meltSpore, findSpore } from '@ckb-ccc/spore';
import { Address } from '@ckb-ccc/core';
import {
  issueCertificate,
  getCertificate,
  getHolderCertificates,
  clearCertificateCache,
} from '../../../src/lib/credentials/issuer';
import type { CredentialSubject } from '@/types';

// Mock the DID resolution module
vi.mock('@/lib/did', () => ({
  resolveRecipientInput: vi.fn().mockImplementation(async (_client: unknown, input: string) => {
    // Mock implementation: if input looks like a DID, resolve it; otherwise treat as address
    if (input.startsWith('did:ckb:')) {
      return {
        targetAddress: 'ckt1q9gry5zgxmpjnmhrp4raggde4gf2vqqyzd5x3lt7pf5m8c2kzwfxnsvpq',
        targetLock: { args: '0x', codeHash: '0x', hashType: 'type' },
        did: input,
        isDid: true,
      };
    }
    // For CKB addresses, return as-is
    return {
      targetAddress: input,
      targetLock: { args: '0x', codeHash: '0x', hashType: 'type' },
      isDid: false,
    };
  }),
}));

describe('Certificate Service (Issuer)', () => {
  beforeEach(() => {
    // Clear mock storage before each test
    clearCertificateCache();
    // Reset mock states
    vi.clearAllMocks();
    // Reset Address.fromString mock
    vi.mocked(Address.fromString).mockResolvedValue({
      script: {
        args: '0x',
        codeHash: '0x',
        hashType: 'type',
      },
    } as any);
  });

  // Test fixtures
  const validRecipientAddress = 'ckt1q9gry5zgxmpjnmhrp4raggde4gf2vqqyzd5x3lt7pf5m8c2kzwfxnsvpq';
  const testClusterId = '0x1234567890abcdef';
  const testIssuerName = 'Test Academy';
  const testIssuerDescription = 'Premier blockchain education provider';

  // Helper: create a mock signer with SDK-compatible interface
  const createMockSigner = (address: string = validRecipientAddress) => ({
    client: {
      getTransaction: vi.fn().mockResolvedValue({ transaction: { outputsData: [] } }),
      findCellsByLock: vi.fn().mockReturnValue({
        [Symbol.asyncIterator]: () => ({
          next: vi.fn().mockResolvedValue({ done: true, value: undefined }),
        }),
      }),
    },
    sendTransaction: vi.fn().mockResolvedValue('0x' + 'a'.repeat(64)),
    signTransaction: vi.fn().mockReturnValue({}),
    getRecommendedAddressObj: vi.fn().mockResolvedValue({
      toString: () => address,
      script: { args: address, codeHash: '0xabcd', hashType: 'type' },
    }),
  });

  const validSubject: CredentialSubject = {
    id: validRecipientAddress,
    type: 'CourseCertificate',
    name: 'John Doe',
    courseName: 'CKB Blockchain Fundamentals',
    completionDate: '2024-01-15',
    grade: 'A',
    score: 95,
    skills: ['CKB', 'Smart Contracts', 'Blockchain'],
  };

  describe('issueCertificate', () => {
    // Test: Issue certificate with valid parameters
    // Input: Valid signer, clusterId, issuerName, and subject
    // Expected: Returns certificateId and transactionHash
    it('should issue certificate with valid parameters', async () => {
      const result = await issueCertificate({
        signer: createMockSigner(),
        clusterId: testClusterId,
        issuerName: testIssuerName,
        issuerDescription: testIssuerDescription,
        subject: validSubject,
      });

      expect(result.certificateId).toBeDefined();
      expect(result.certificateId).toMatch(/^0x[0-9a-f]+$/);
      expect(result.transactionHash).toBeDefined();
      expect(result.transactionHash).toMatch(/^0x[a-f0-9]+$/);
    });

    // Test: Issue certificate with expiration date
    // Input: Valid params with future expirationDate
    // Expected: Certificate is issued successfully
    it('should issue certificate with expiration date', async () => {
      const futureDate = '2025-12-31';

      const result = await issueCertificate({
        signer: createMockSigner(),
        clusterId: testClusterId,
        issuerName: testIssuerName,
        subject: validSubject,
        expirationDate: futureDate,
      });

      expect(result.certificateId).toBeDefined();
    });

    // Test: Certificate ID is unique for each issuance
    // Input: Issue two certificates
    // Expected: Each has a unique certificateId
    it('should generate unique certificate IDs', async () => {
      const result1 = await issueCertificate({
        signer: createMockSigner(),
        clusterId: testClusterId,
        issuerName: testIssuerName,
        subject: validSubject,
      });

      const result2 = await issueCertificate({
        signer: createMockSigner(),
        clusterId: testClusterId,
        issuerName: testIssuerName,
        subject: { ...validSubject, name: 'Jane Doe' },
      });

      expect(result1.certificateId).not.toBe(result2.certificateId);
    });

    // Test: Issue certificate with minimal subject data
    // Input: Subject with required fields including recipient address
    // Expected: Certificate is issued successfully
    it('should issue certificate with minimal subject data', async () => {
      const minimalSubject: CredentialSubject = {
        id: validRecipientAddress,
        type: 'CourseCertificate',
        courseName: 'Basic Course',
        completionDate: '2024-01-01',
      };

      const result = await issueCertificate({
        signer: createMockSigner(),
        clusterId: testClusterId,
        issuerName: testIssuerName,
        subject: minimalSubject,
      });

      expect(result.certificateId).toBeDefined();
    });

    // Test: Issue certificate with optional metadata
    // Input: Subject with additional metadata fields
    // Expected: Certificate is issued with metadata preserved
    it('should issue certificate with metadata', async () => {
      const subjectWithMetadata: CredentialSubject = {
        ...validSubject,
        metadata: {
          institution: 'CKB Academy',
          duration: '8 weeks',
          certificationNumber: 'CERT-2024-001',
        },
      };

      const result = await issueCertificate({
        signer: createMockSigner(),
        clusterId: testClusterId,
        issuerName: testIssuerName,
        subject: subjectWithMetadata,
      });

      expect(result.certificateId).toBeDefined();

      // Verify metadata is stored
      const certResult = await getCertificate(result.certificateId);
      expect(certResult).not.toBeNull();
    });
  });

  describe('getCertificate', () => {
    // Test: Retrieve existing certificate by ID
    // Input: certificateId from issued certificate
    // Expected: Returns certificate data with certificateId and txHash
    it('should retrieve existing certificate by ID', async () => {
      const issued = await issueCertificate({
        signer: createMockSigner(),
        clusterId: testClusterId,
        issuerName: testIssuerName,
        subject: validSubject,
      });

      const retrieved = await getCertificate(issued.certificateId);

      expect(retrieved).not.toBeNull();
      expect(retrieved?.certificateId).toBe(issued.certificateId);
      expect(retrieved?.transactionHash).toBeDefined();
    });

    // Test: Return null for non-existent certificate
    // Input: certificateId that was never issued
    // Expected: Returns null
    it('should return null for non-existent certificate', async () => {
      const result = await getCertificate('0x' + 'f'.repeat(64));

      expect(result).toBeNull();
    });

    // Test: Retrieved certificate has correct structure
    // Input: Valid certificateId
    // Expected: Certificate has @context, type, issuer, credentialSubject
    it('should return certificate with correct W3C VC structure', async () => {
      const issued = await issueCertificate({
        signer: createMockSigner(),
        clusterId: testClusterId,
        issuerName: testIssuerName,
        subject: validSubject,
      });

      const retrieved = await getCertificate(issued.certificateId);

      expect(retrieved?.certificate['@context']).toBeDefined();
      expect(Array.isArray(retrieved?.certificate['@context'])).toBe(true);
      expect(retrieved?.certificate['type']).toContain('VerifiableCredential');
      expect(retrieved?.certificate.issuer).toBeDefined();
      expect(retrieved?.certificate.issuer.id).toBe(testClusterId);
      expect(retrieved?.certificate.issuer.name).toBe(testIssuerName);
    });

    // Test: Retrieved certificate contains subject data
    // Input: Certificate with specific subject fields
    // Expected: All subject fields are preserved
    it('should preserve subject data in retrieved certificate', async () => {
      const issued = await issueCertificate({
        signer: createMockSigner(),
        clusterId: testClusterId,
        issuerName: testIssuerName,
        subject: validSubject,
      });

      const retrieved = await getCertificate(issued.certificateId);

      expect(retrieved?.certificate.credentialSubject.name).toBe(validSubject.name);
      expect(retrieved?.certificate.credentialSubject.courseName).toBe(validSubject.courseName);
      expect(retrieved?.certificate.credentialSubject.completionDate).toBe(validSubject.completionDate);
      expect(retrieved?.certificate.credentialSubject.grade).toBe(validSubject.grade);
    });
  });

  describe('getHolderCertificates', () => {
    beforeEach(() => {
      clearCertificateCache();
    });

    // Test: Get all certificates for a holder address
    // Note: This test verifies basic getHolderCertificates functionality
    // Full multi-certificate testing requires isolated storage or different architecture
    it('should return certificates for a holder address', async () => {
      // Issue a certificate
      await issueCertificate({
        signer: createMockSigner(),
        clusterId: testClusterId,
        issuerName: testIssuerName,
        subject: {
          id: validRecipientAddress,
          type: 'CourseCertificate',
          name: 'John Doe',
          courseName: 'Course 1',
          completionDate: '2024-01-15',
        },
      });

      const certificates = await getHolderCertificates(validRecipientAddress);
      expect(certificates.length).toBeGreaterThanOrEqual(1);
    });

    // Test: Return empty array for holder with no certificates
    // Input: Address that has never received a certificate
    // Expected: Returns empty array
    it('should return empty array for holder with no certificates', async () => {
      const certificates = await getHolderCertificates('ckt1qy0000000000000000000000000000000000000');

      expect(certificates).toHaveLength(0);
    });

    // Test: Only return certificates for specified holder
    // Input: Two different holder addresses, certificates issued for only one
    // Expected: getHolderCertificates returns only the relevant certificates
    it('should only return certificates for specified holder', async () => {
      const holder1 = 'ckt1q9gry5zgxmpjnmhrp4raggde4gf2vqqyzd5x3lt7pf5m8c2kzwfxnsvpq';
      const holder2 = 'ckt1q9gry5zgxmpjnmhrp4raggde4gf2vqqyzd5x3lt7pf5m8c2kzwfxnsvpz';

      await issueCertificate({
        signer: createMockSigner(),
        clusterId: testClusterId,
        issuerName: testIssuerName,
        subject: { id: holder1, type: 'CourseCertificate', courseName: 'Course 1', completionDate: '2024-01-01' },
      });

      await issueCertificate({
        signer: createMockSigner(),
        clusterId: testClusterId,
        issuerName: testIssuerName,
        subject: { id: holder2, type: 'CourseCertificate', courseName: 'Course 2', completionDate: '2024-01-01' },
      });

      const holder1Certs = await getHolderCertificates(holder1);

      expect(holder1Certs).toHaveLength(1);
      expect(holder1Certs[0].certificate.credentialSubject.name).toBeUndefined();
    });

    // Test: Certificate entries include certificateId and clusterId
    // Input: Certificate for a holder
    // Expected: Each entry has certificateId and clusterId
    it('should include certificateId and clusterId in results', async () => {
      await issueCertificate({
        signer: createMockSigner(),
        clusterId: testClusterId,
        issuerName: testIssuerName,
        subject: { id: validRecipientAddress, type: 'CourseCertificate', courseName: 'Test', completionDate: '2024-01-01' },
      });

      const certificates = await getHolderCertificates(validRecipientAddress);

      expect(certificates[0].certificateId).toBeDefined();
      expect(certificates[0].clusterId).toBe(testClusterId);
      expect(certificates[0].transactionHash).toBeDefined();
    });
  });

  describe('CredentialSubject structure', () => {
    // Test: Handle subject with id field
    // Input: Subject with explicit id field
    // Expected: id is preserved in certificate
    it('should preserve explicit subject id field', async () => {
      const subjectWithId: CredentialSubject = {
        id: validRecipientAddress,
        type: 'CourseCertificate',
        name: 'Jane Doe',
        courseName: 'Advanced CKB',
        completionDate: '2024-02-01',
      };

      const issued = await issueCertificate({
        signer: createMockSigner(),
        clusterId: testClusterId,
        issuerName: testIssuerName,
        subject: subjectWithId,
      });

      const cert = await getCertificate(issued.certificateId);
      expect(cert?.certificate.credentialSubject.id).toBe(validRecipientAddress);
    });

    // Test: Fail-fast when subject id is missing
    it('should throw error when subject id is missing', async () => {
      await expect(
        issueCertificate({
          signer: createMockSigner(),
          clusterId: testClusterId,
          issuerName: testIssuerName,
          subject: {
            type: 'CourseCertificate',
            name: 'Bob Smith',
            courseName: 'Basic CKB',
            completionDate: '2024-03-01',
            // No id field
          },
        })
      ).rejects.toThrow(/Recipient identifier \(address or DID\) is required/);
    });

    // Test: Fail-fast when live signer is used with missing recipient address
    it('should throw error when live signer is used without recipient address', async () => {
      const mockLiveSigner = {
        client: {},
        sendTransaction: vi.fn(),
      };

      await expect(
        issueCertificate({
          signer: mockLiveSigner,
          clusterId: testClusterId,
          issuerName: testIssuerName,
          subject: {
            type: 'CourseCertificate',
            courseName: 'Basic CKB',
            completionDate: '2024-03-01',
            id: '',
          },
        })
      ).rejects.toThrow(/Recipient identifier \(address or DID\) is required/);
    });

    // Test: Fail-fast when live signer is used with invalid recipient address
    it('should throw error when live signer is used with invalid recipient address', async () => {
      // Mock resolveRecipientInput to throw for invalid address
      const { resolveRecipientInput } = await import('@/lib/did');
      vi.mocked(resolveRecipientInput).mockRejectedValueOnce(
        new Error('Invalid recipient format')
      );

      await expect(
        issueCertificate({
          signer: createMockSigner(),
          clusterId: testClusterId,
          issuerName: testIssuerName,
          subject: {
            id: 'invalid_ckb_address_12345',
            type: 'CourseCertificate',
            courseName: 'Basic CKB',
            completionDate: '2024-03-01',
          },
        })
      ).rejects.toThrow(/Failed to resolve recipient/);
    });
  });

  describe('meltCertificate', () => {
    beforeEach(() => {
      clearCertificateCache();
    });

    // Test: melts certificate and removes from storage
    it('should melt certificate and remove from local storage', async () => {
      // Issue a certificate first (mock signer path)
      const issued = await issueCertificate({
        signer: createMockSigner(),
        clusterId: testClusterId,
        issuerName: testIssuerName,
        subject: { id: validRecipientAddress, type: 'CourseCertificate', courseName: 'Test', completionDate: '2024-01-01' },
      });

      // Verify it exists before melting
      const before = await getCertificate(issued.certificateId);
      expect(before).not.toBeNull();

      // Mock getCell to return a cell owned by the holder
      const mockClient = {
        getCell: vi.fn().mockResolvedValue({
          output: {
            lock: { args: validRecipientAddress, codeHash: '0xabcd', hashType: 'type' },
          },
          outPoint: { txHash: issued.transactionHash, index: '0x0' },
        }),
      };

      const mockHolderSigner = {
        client: mockClient,
        sendTransaction: vi.fn().mockResolvedValue('0x' + 'c'.repeat(64)),
        signTransaction: vi.fn().mockReturnValue({}),
        getRecommendedAddressObj: vi.fn().mockResolvedValue({
          toString: () => validRecipientAddress,
          script: { args: validRecipientAddress, codeHash: '0xabcd', hashType: 'type' },
        }),
      };

      // Mock findSpore to return a found cell (required for meltCertificate to work)
      vi.mocked(findSpore).mockResolvedValue({
        cell: {
          cellOutput: {
            lock: { args: validRecipientAddress, codeHash: '0xabcd', hashType: 'type' },
          },
          outputData: new TextEncoder().encode(JSON.stringify({
            '@context': ['https://www.w3.org/2018/credentials/v1'],
            id: issued.certificateId,
            type: ['VerifiableCredential', 'CourseCertificate'],
            issuer: { id: testClusterId },
            credentialSubject: { type: 'CourseCertificate' },
          })),
        },
      } as any);

      // Mock meltSpore to return a valid tx
      const mockTx = {
        completeInputsByCapacity: vi.fn().mockResolvedValue(undefined),
        completeFeeBy: vi.fn().mockResolvedValue(undefined),
      };
      vi.mocked(meltSpore).mockResolvedValue({
        tx: mockTx as any,
      });

      const { meltCertificate } = await import('../../../src/lib/credentials/issuer');
      const result = await meltCertificate(mockHolderSigner, issued.certificateId);

      expect(result.transactionHash).toBeDefined();
      expect(result.transactionHash).toMatch(/^0x[a-f0-9]+$/);

      // Verify meltSpore was called with a valid spore ID
      expect(vi.mocked(meltSpore)).toHaveBeenCalledWith(
        expect.objectContaining({
          signer: mockHolderSigner,
          id: expect.stringMatching(/^0x[a-f0-9]{64}$/),
        })
      );

      // Verify removed from storage
      const after = await getCertificate(issued.certificateId);
      // In mock mode, meltCertificate deletes from storage
      expect(after).toBeNull();
    });

    // Test: throws if no live signer
    it('should throw if signer is not a live signer', async () => {
      const { meltCertificate } = await import('../../../src/lib/credentials/issuer');
      await expect(
        meltCertificate({}, '0x' + 'a'.repeat(64))
      ).rejects.toThrow('Live signer is required to melt a certificate');
    });

    // Test: throws if certificate not found
    it('should throw if certificate not found', async () => {
      const mockSigner = {
        client: {},
        sendTransaction: vi.fn(),
        getRecommendedAddressObj: vi.fn().mockResolvedValue({
          toString: () => validRecipientAddress,
          script: { args: '0x1234', codeHash: '0xabcd', hashType: 'type' },
        }),
      };

      const { meltCertificate } = await import('../../../src/lib/credentials/issuer');
      await expect(
        meltCertificate(mockSigner, '0x' + 'f'.repeat(64))
      ).rejects.toThrow('Certificate not found');
    });

    // Test: throws if signer is not the holder
    it('should throw if signer is not the holder', async () => {
      // Issue a certificate first
      const issued = await issueCertificate({
        signer: createMockSigner(),
        clusterId: testClusterId,
        issuerName: testIssuerName,
        subject: { id: validRecipientAddress, type: 'CourseCertificate', courseName: 'Test', completionDate: '2024-01-01' },
      });

      // Mock findSpore to return the cell owned by the holder
      vi.mocked(findSpore).mockResolvedValue({
        cell: {
          cellOutput: {
            lock: { args: '0x1234', codeHash: '0xabcd', hashType: 'type' },
          },
          outputData: new TextEncoder().encode(JSON.stringify({
            '@context': ['https://www.w3.org/2018/credentials/v1'],
            id: issued.certificateId,
            type: ['VerifiableCredential', 'CourseCertificate'],
            issuer: { id: testClusterId },
            credentialSubject: { type: 'CourseCertificate' },
          })),
        },
      } as any);

      // Mock signer whose lock does NOT match the certificate holder's lock
      const mockEvilSigner = {
        client: {},
        sendTransaction: vi.fn(),
        signTransaction: vi.fn().mockReturnValue({}),
        // But this signer pretends to be someone else (different address)
        getRecommendedAddressObj: vi.fn().mockResolvedValue({
          toString: () => 'ckt1qyq...evil',
          // Different lock args than the cell — ownership check fails
          script: { args: '0x' + 'ee'.repeat(20), codeHash: '0xabcd', hashType: 'type' },
        }),
      };

      const { meltCertificate } = await import('../../../src/lib/credentials/issuer');
      await expect(
        meltCertificate(mockEvilSigner as unknown, issued.certificateId)
      ).rejects.toThrow('Only the certificate holder can melt this certificate');
    });

    // Test 1: melts only the target certificate when multiple certificates exist in cache
    it('should melt only the target certificate when multiple certificates exist in cache', async () => {
      // 1. Issue Certificate A
      const issuedA = await issueCertificate({
        signer: createMockSigner(),
        clusterId: testClusterId,
        issuerName: testIssuerName,
        subject: { id: validRecipientAddress, type: 'CourseCertificate', courseName: 'Course A', completionDate: '2024-01-01' },
      });

      // 2. Issue Certificate B
      const issuedB = await issueCertificate({
        signer: createMockSigner(),
        clusterId: testClusterId,
        issuerName: testIssuerName,
        subject: { id: validRecipientAddress, type: 'CourseCertificate', courseName: 'Course B', completionDate: '2024-02-01' },
      });

      expect(issuedA.certificateId).not.toEqual(issuedB.certificateId);

      const mockClient = {
        getCell: vi.fn().mockResolvedValue({
          output: {
            lock: { args: validRecipientAddress, codeHash: '0xabcd', hashType: 'type' },
          },
          outPoint: { txHash: issuedB.transactionHash, index: '0x0' },
        }),
      };

      const mockHolderSigner = {
        client: mockClient,
        sendTransaction: vi.fn().mockResolvedValue('0x' + 'c'.repeat(64)),
        signTransaction: vi.fn().mockReturnValue({}),
        getRecommendedAddressObj: vi.fn().mockResolvedValue({
          toString: () => validRecipientAddress,
          script: { args: validRecipientAddress, codeHash: '0xabcd', hashType: 'type' },
        }),
      };

      // Mock findSpore to return cell matching the queried ID
      vi.mocked(findSpore).mockImplementation(async (_client, id) => {
        const idStr = String(id);
        if (idStr === issuedA.sporeId || idStr === issuedA.certificateId) {
          return {
            cell: {
              cellOutput: {
                lock: { args: validRecipientAddress, codeHash: '0xabcd', hashType: 'type' },
              },
              outputData: new TextEncoder().encode(JSON.stringify({
                '@context': ['https://www.w3.org/2018/credentials/v1'],
                id: issuedA.certificateId,
                type: ['VerifiableCredential', 'CourseCertificate'],
                issuer: { id: testClusterId },
                credentialSubject: { type: 'CourseCertificate' },
              })),
            },
          } as any;
        }
        if (idStr === issuedB.sporeId || idStr === issuedB.certificateId) {
          return {
            cell: {
              cellOutput: {
                lock: { args: validRecipientAddress, codeHash: '0xabcd', hashType: 'type' },
              },
              outputData: new TextEncoder().encode(JSON.stringify({
                '@context': ['https://www.w3.org/2018/credentials/v1'],
                id: issuedB.certificateId,
                type: ['VerifiableCredential', 'CourseCertificate'],
                issuer: { id: testClusterId },
                credentialSubject: { type: 'CourseCertificate' },
              })),
            },
          } as any;
        }
        return undefined;
      });

      const mockTx = {
        completeInputsByCapacity: vi.fn().mockResolvedValue(undefined),
        completeFeeBy: vi.fn().mockResolvedValue(undefined),
      };
      vi.mocked(meltSpore).mockResolvedValue({ tx: mockTx as any });

      // Action: Melt Certificate B
      const { meltCertificate: meltCert } = await import('../../../src/lib/credentials/issuer');
      const result = await meltCert(mockHolderSigner, issuedB.certificateId);

      expect(result.transactionHash).toBeDefined();

      // Assert: meltSpore must be called with Certificate B's sporeId, NOT Certificate A
      expect(vi.mocked(meltSpore)).toHaveBeenCalledWith(
        expect.objectContaining({
          id: issuedB.sporeId,
        })
      );
      expect(vi.mocked(meltSpore)).not.toHaveBeenCalledWith(
        expect.objectContaining({
          id: issuedA.sporeId,
        })
      );

      // Certificate A must still exist in cache
      const certAAfter = await getCertificate(issuedA.certificateId);
      expect(certAAfter).not.toBeNull();

      // Certificate B must be removed from cache
      const certBAfter = await getCertificate(issuedB.certificateId);
      expect(certBAfter).toBeNull();
    });

    // Test 2: does not melt Certificate A if Certificate B cell is pending/not found on-chain
    it('should fail and not melt Certificate A if Certificate B cell is not found on-chain', async () => {
      // 1. Issue Certificate A (confirmed)
      const issuedA = await issueCertificate({
        signer: createMockSigner(),
        clusterId: testClusterId,
        issuerName: testIssuerName,
        subject: { id: validRecipientAddress, type: 'CourseCertificate', courseName: 'Course A', completionDate: '2024-01-01' },
      });

      // 2. Issue Certificate B (simulating pending / unindexed)
      const issuedB = await issueCertificate({
        signer: createMockSigner(),
        clusterId: testClusterId,
        issuerName: testIssuerName,
        subject: { id: validRecipientAddress, type: 'CourseCertificate', courseName: 'Course B', completionDate: '2024-02-01' },
      });

      const mockHolderSigner = {
        client: { getCell: vi.fn().mockResolvedValue(null) },
        sendTransaction: vi.fn().mockResolvedValue('0x' + 'c'.repeat(64)),
        signTransaction: vi.fn().mockReturnValue({}),
        getRecommendedAddressObj: vi.fn().mockResolvedValue({
          toString: () => validRecipientAddress,
          script: { args: validRecipientAddress, codeHash: '0xabcd', hashType: 'type' },
        }),
      };

      // Mock findSpore: A exists, B does NOT exist yet (pending)
      vi.mocked(findSpore).mockImplementation(async (_client, id) => {
        const idStr = String(id);
        if (idStr === issuedA.sporeId || idStr === issuedA.certificateId) {
          return {
            cell: {
              cellOutput: {
                lock: { args: validRecipientAddress, codeHash: '0xabcd', hashType: 'type' },
              },
            },
          } as any;
        }
        return undefined;
      });

      // Melting Certificate B must reject with error and NOT melt Certificate A
      const { meltCertificate: meltCert } = await import('../../../src/lib/credentials/issuer');
      await expect(
        meltCert(mockHolderSigner, issuedB.certificateId)
      ).rejects.toThrow(/could not be found on CKB/);

      // Verify meltSpore was NEVER called
      expect(vi.mocked(meltSpore)).not.toHaveBeenCalled();

      // Certificate A must still exist in cache
      const certA = await getCertificate(issuedA.certificateId);
      expect(certA).not.toBeNull();
    });

    // Test 3: DNA verification - must not melt wrong certificate even if sporeId exists
    it('should verify DNA content matches before melting', async () => {
      // Issue Certificate B (the target)
      const issuedB = await issueCertificate({
        signer: createMockSigner(),
        clusterId: testClusterId,
        issuerName: testIssuerName,
        subject: { id: validRecipientAddress, type: 'CourseCertificate', courseName: 'Course B', completionDate: '2024-02-01' },
      });

      const mockHolderSigner = {
        client: { getCell: vi.fn().mockResolvedValue(null) },
        sendTransaction: vi.fn().mockResolvedValue('0x' + 'c'.repeat(64)),
        signTransaction: vi.fn().mockReturnValue({}),
        getRecommendedAddressObj: vi.fn().mockResolvedValue({
          toString: () => validRecipientAddress,
          script: { args: validRecipientAddress, codeHash: '0xabcd', hashType: 'type' },
        }),
      };

      // Mock findSpore returns a cell but with WRONG DNA (simulating collision)
      vi.mocked(findSpore).mockImplementation(async (_client, id) => {
        const idStr = String(id);
        // When querying Certificate B's sporeId, return a cell with Certificate A's DNA
        if (idStr === issuedB.sporeId) {
          return {
            cell: {
              cellOutput: {
                lock: { args: validRecipientAddress, codeHash: '0xabcd', hashType: 'type' },
              },
              outputData: new TextEncoder().encode(JSON.stringify({
                '@context': ['https://www.w3.org/2018/credentials/v1'],
                id: '0x' + 'aa'.repeat(16), // WRONG DNA ID!
                type: ['VerifiableCredential', 'CourseCertificate'],
                issuer: { id: testClusterId },
                credentialSubject: { type: 'CourseCertificate' },
              })),
            },
          } as any;
        }
        return undefined;
      });

      // Should reject because DNA does not match
      const { meltCertificate: meltCert } = await import('../../../src/lib/credentials/issuer');
      await expect(
        meltCert(mockHolderSigner, issuedB.certificateId)
      ).rejects.toThrow(/could not be found on CKB|DNA mismatch/);

      // meltSpore must NEVER be called
      expect(vi.mocked(meltSpore)).not.toHaveBeenCalled();
    });
  });

  describe('verifyCellDNA', () => {
    it('returns true when certRecord has no expected ID', async () => {
      const { verifyCellDNA } = await import('../../../src/lib/credentials/issuer');
      expect(verifyCellDNA(new Uint8Array(), {})).toBe(true);
    });

    it('returns true when cell DNA ID matches certificate.id', async () => {
      const { verifyCellDNA } = await import('../../../src/lib/credentials/issuer');
      const data = new TextEncoder().encode(JSON.stringify({
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        id: 'cert-123',
        type: ['VerifiableCredential'],
      }));
      expect(verifyCellDNA(data, { certificate: { id: 'cert-123' } })).toBe(true);
    });

    it('returns true when cell DNA ID matches sporeId or certificateId', async () => {
      const { verifyCellDNA } = await import('../../../src/lib/credentials/issuer');
      const data = new TextEncoder().encode(JSON.stringify({
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        id: 'spore-456',
        type: ['VerifiableCredential'],
      }));
      expect(verifyCellDNA(data, { sporeId: 'spore-456' })).toBe(true);
      expect(verifyCellDNA(data, { certificateId: 'spore-456' })).toBe(true);
    });

    it('returns false when cell DNA does not match expected ID', async () => {
      const { verifyCellDNA } = await import('../../../src/lib/credentials/issuer');
      const data = new TextEncoder().encode(JSON.stringify({
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        id: 'wrong-id',
        type: ['VerifiableCredential'],
      }));
      expect(verifyCellDNA(data, { certificate: { id: 'cert-123' } })).toBe(false);
    });

    it('returns false when outputData cannot be parsed and expected ID is set', async () => {
      const { verifyCellDNA } = await import('../../../src/lib/credentials/issuer');
      expect(verifyCellDNA('0x1234', { certificate: { id: 'cert-123' } })).toBe(false);
    });
  });
});

