import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ccc } from '@ckb-ccc/core';
import { issueCertificate, getCertificate, meltCertificate } from '@/lib/credentials/issuer';
import { verifyCertificate, isExpired } from '@/lib/credentials/verifier';
import { encodeCertificateDNA } from '@/lib/credentials/encoder';
import { decodeCertificateDNA } from '@/lib/credentials/decoder';

vi.mock('@ckb-ccc/spore', () => ({
  createSpore: vi.fn(async () => ({
    tx: {
      completeInputsByCapacity: vi.fn(),
      completeFeeBy: vi.fn(),
    },
    id: '0x11223344556677889900aabbccddeeff11223344556677889900aabbccddeeff',
  })),
  findSpore: vi.fn(async () => ({
    cell: {
      cellOutput: {
        capacity: '0x3b9aca00',
        lock: { codeHash: '0x99', hashType: 'type', args: '0x1234' },
      },
      outputData: new TextEncoder().encode(
        JSON.stringify({
          '@context': ['https://www.w3.org/2018/credentials/v1'],
          id: '0x11223344556677889900aabbccddeeff11223344556677889900aabbccddeeff',
          type: ['VerifiableCredential', 'CourseCertificate'],
          issuer: { id: 'ckt1qcluster', name: 'CKB Developer Academy' },
          issuanceDate: '2026-01-01T00:00:00Z',
          expirationDate: '2027-01-01T00:00:00Z',
          credentialSubject: {
            id: 'ckt1qzda0cr08m85hc8j9np9u2xnjvs2tsq8q5h5xcmr',
            type: 'CourseCertificate',
            name: 'Alice Developer',
            courseName: 'Full-Stack CKB App Architecture',
            completionDate: '2026-01-01',
            grade: 'Distinction',
          },
        })
      ),
    },
  })),
  meltSpore: vi.fn(async () => ({
    tx: {
      completeInputsByCapacity: vi.fn(),
      completeFeeBy: vi.fn(),
    },
  })),
}));

describe('Certificate Lifecycle Integration', () => {
  const mockSigner = {
    client: {
      addressToScript: vi.fn(async () => ({ codeHash: '0x99', hashType: 'type', args: '0x1234' })),
      addressFromScript: vi.fn(async () => 'ckt1qzda0cr08m85hc8j9np9u2xnjvs2tsq8q5h5xcmr'),
    },
    getRecommendedAddress: vi.fn(async () => 'ckt1qissuer'),
    sendTransaction: vi.fn(async () => '0xtxhash123456'),
  } as unknown as ccc.Signer;

  it('encodes and decodes W3C VC DNA faithfully', () => {
    const vcData = {
      courseName: 'CKB Architecture',
      courseProvider: 'Nervos Academy',
      completionDate: '2026-02-01',
      recipientAddress: 'ckt1qzda0cr08m85hc8j9np9u2xnjvs2tsq8q5h5xcmr',
      recipientName: 'Alice Developer',
      clusterId: '0xcluster123',
    };

    const encoded = encodeCertificateDNA(vcData);
    expect(encoded).toBeDefined();

    const decoded = decodeCertificateDNA(encoded);
    expect(decoded.credentialSubject.courseName).toBe('CKB Architecture');
    expect(decoded.credentialSubject.name).toBe('Alice Developer');
  });

  it('completes issuance, verification, expiration checking, and melting', async () => {
    // 1. Issue
    const issueRes = await issueCertificate({
      signer: mockSigner,
      clusterId: '0xcluster123',
      issuerName: 'Nervos Academy',
      subject: {
        id: 'ckt1qzda0cr08m85hc8j9np9u2xnjvs2tsq8q5h5xcmr',
        type: 'CourseCertificate',
        name: 'Alice Developer',
        courseName: 'Full-Stack CKB App Architecture',
      },
      expirationDate: '2027-01-01T00:00:00Z',
    });

    expect(issueRes.certificateId).toBeDefined();
    expect(issueRes.transactionHash).toBe('0xtxhash123456');

    // 2. Fetch and Verify
    const cert = await getCertificate(issueRes.certificateId, mockSigner.client);
    expect(cert).not.toBeNull();
    expect(cert?.certificate.credentialSubject.name).toBe('Alice Developer');

    const verifyRes = await verifyCertificate(issueRes.certificateId, mockSigner.client);
    expect(verifyRes.valid).toBe(true);
    expect(verifyRes.isExpired).toBe(false);

    // 3. Expiration logic
    expect(isExpired('2020-01-01T00:00:00Z')).toBe(true);
    expect(isExpired('2030-01-01T00:00:00Z')).toBe(false);

    // 4. Melt
    const meltRes = await meltCertificate(mockSigner, issueRes.certificateId);
    expect(meltRes.transactionHash).toBe('0xtxhash123456');
  });
});
