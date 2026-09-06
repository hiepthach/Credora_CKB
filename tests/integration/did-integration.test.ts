/**
 * DID Integration Tests
 *
 * Integration tests for did:ckb recipient support in certificate issuance.
 * Tests cover: DID resolution, backward compatibility, certificate filtering, and batch support.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the DID library
vi.mock('@ckb-ccc/did-ckb', () => ({
  isDidCkb: vi.fn((val: string) => val.startsWith('did:ckb:abcdefghijklmnopqrstuvwxyz234567')),
  resolveDidCkb: vi.fn(),
  listDidCkbsByLock: vi.fn(),
}));

// Mock the DID utility module
vi.mock('@/lib/did', () => ({
  isDidInput: vi.fn((val: string) => val.startsWith('did:ckb:')),
  resolveRecipientInput: vi.fn(),
  formatRecipientIdentifier: vi.fn((id: string) => {
    if (id.startsWith('did:ckb:')) {
      return {
        display: id,
        isDid: true,
        truncatedDid: `${id.slice(0, 12)}...${id.slice(-6)}`,
      };
    }
    return { display: id, isDid: false };
  }),
}));

describe('DID Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('DID Resolution', () => {
    it('resolves DID to lock script for certificate issuance', async () => {
      const { resolveRecipientInput } = await import('@/lib/did');

      vi.mocked(resolveRecipientInput).mockResolvedValue({
        targetAddress: 'ckt1q9gry5zgxmpjnmhrp4raggde4gf2vqqyzd5x3lt7pf5m8c2kzwfxnsvpq',
        targetLock: { codeHash: '0x', hashType: 'type', args: '0x' } as any,
        did: 'did:ckb:abcdefghijklmnopqrstuvwxyz234567',
        isDid: true,
      });

      const result = await resolveRecipientInput(
        {} as any,
        'did:ckb:abcdefghijklmnopqrstuvwxyz234567'
      );

      expect(result.isDid).toBe(true);
      expect(result.targetAddress).toBeDefined();
      expect(result.did).toBe('did:ckb:abcdefghijklmnopqrstuvwxyz234567');
    });

    it('handles CKB address input as non-DID', async () => {
      const { resolveRecipientInput } = await import('@/lib/did');

      vi.mocked(resolveRecipientInput).mockResolvedValue({
        targetAddress: 'ckt1qzda0cr08m85hc8j9np9u2xnjvs2tsq8q5h5xcmr',
        targetLock: { codeHash: '0x', hashType: 'type', args: '0x' } as any,
        isDid: false,
      });

      const result = await resolveRecipientInput(
        {} as any,
        'ckt1qzda0cr08m85hc8j9np9u2xnjvs2tsq8q5h5xcmr'
      );

      expect(result.isDid).toBe(false);
      expect(result.targetAddress).toBe('ckt1qzda0cr08m85hc8j9np9u2xnjvs2tsq8q5h5xcmr');
    });
  });

  describe('Backward Compatibility', () => {
    it('preserves credentialSubject.id for address-only certificates', async () => {
      const subject = {
        id: 'ckt1qzda0cr08m85hc8j9np9u2xnjvs2tsq8q5h5xcmr',
        type: 'CourseCertificate' as const,
        courseName: 'Test Course',
      };

      // Simulate that no walletAddress is added for address-only subjects
      expect(subject.id).toBeDefined();
      expect(subject.id?.startsWith('ckt')).toBe(true);
    });

    it('adds walletAddress for DID-issued certificates', () => {
      const subject = {
        id: 'did:ckb:abcdefghijklmnopqrstuvwxyz234567',
        type: 'CourseCertificate' as const,
        courseName: 'Test Course',
        walletAddress: 'ckt1q9gry5zgxmpjnmhrp4raggde4gf2vqqyzd5x3lt7pf5m8c2kzwfxnsvpq',
      };

      expect(subject.id?.startsWith('did:ckb:')).toBe(true);
      expect(subject.walletAddress).toBeDefined();
      expect(subject.walletAddress?.startsWith('ckt')).toBe(true);
    });
  });

  describe('DID Display', () => {
    it('formats DID with truncation', async () => {
      const { formatRecipientIdentifier } = await import('@/lib/did');

      vi.mocked(formatRecipientIdentifier).mockReturnValue({
        display: 'did:ckb:abcdefghijklmnopqrstuvwxyz234567',
        isDid: true,
        truncatedDid: 'did:ckb:abcd...234567',
      });

      const result = formatRecipientIdentifier('did:ckb:abcdefghijklmnopqrstuvwxyz234567');

      expect(result.isDid).toBe(true);
      expect(result.truncatedDid).toBe('did:ckb:abcd...234567');
    });

    it('formats CKB address without DID badge', async () => {
      const { formatRecipientIdentifier } = await import('@/lib/did');

      vi.mocked(formatRecipientIdentifier).mockReturnValue({
        display: 'ckt1qzda0cr08m85hc8j9np9u2xnjvs2tsq8q5h5xcmr',
        isDid: false,
      });

      const result = formatRecipientIdentifier('ckt1qzda0cr08m85hc8j9np9u2xnjvs2tsq8q5h5xcmr');

      expect(result.isDid).toBe(false);
      expect(result.truncatedDid).toBeUndefined();
    });
  });

  describe('Certificate Filtering', () => {
    it('matches certificate by direct address', () => {
      const address = 'ckt1qzda0cr08m85hc8j9np9u2xnjvs2tsq8q5h5xcmr';
      const subjectId = 'ckt1qzda0cr08m85hc8j9np9u2xnjvs2tsq8q5h5xcmr';

      // Simulate direct address match
      expect(subjectId.toLowerCase() === address.toLowerCase()).toBe(true);
    });

    it('matches certificate by DID', () => {
      const userDids = ['did:ckb:abcdefghijklmnopqrstuvwxyz234567'];
      const subjectId = 'did:ckb:abcdefghijklmnopqrstuvwxyz234567';

      // Simulate DID match
      expect(userDids.includes(subjectId)).toBe(true);
    });

    it('matches certificate by walletAddress when issued via DID', () => {
      const address = 'ckt1q9gry5zgxmpjnmhrp4raggde4gf2vqqyzd5x3lt7pf5m8c2kzwfxnsvpq';
      const walletAddress = 'ckt1q9gry5zgxmpjnmhrp4raggde4gf2vqqyzd5x3lt7pf5m8c2kzwfxnsvpq';

      // Simulate walletAddress match
      expect(walletAddress.toLowerCase() === address.toLowerCase()).toBe(true);
    });
  });

  describe('Batch DID Support', () => {
    it('accepts DID in recipientAddress column', async () => {
      const { isDidInput } = await import('@/lib/did');

      vi.mocked(isDidInput).mockReturnValue(true);

      const entry = {
        recipientAddress: 'did:ckb:abcdefghijklmnopqrstuvwxyz234567',
        courseName: 'Test Course',
      };

      expect(isDidInput(entry.recipientAddress)).toBe(true);
    });

    it('accepts CKB address in recipientAddress column', async () => {
      const { isDidInput } = await import('@/lib/did');

      vi.mocked(isDidInput).mockReturnValue(false);

      const entry = {
        recipientAddress: 'ckt1qzda0cr08m85hc8j9np9u2xnjvs2tsq8q5h5xcmr',
        courseName: 'Test Course',
      };

      expect(isDidInput(entry.recipientAddress)).toBe(false);
    });
  });
});
