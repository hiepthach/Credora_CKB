import { describe, it, expect } from 'vitest';
import { isValidCredoraCoursePayload, CredoraCoursePayload } from '@/lib/credentials/vellumClaim';

describe('VellumClaim', () => {
  describe('CredoraCoursePayload validation', () => {
    it('should validate a valid payload with all required fields', () => {
      const validPayload: CredoraCoursePayload = {
        spore_id: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        course_id: 'course-001',
        issuer_did: 'did:ckb:qq2m72u8u6dxq2qru9w4f5m4h7x3z6k8u4n9p2r3s',
        issued_at: Date.now(),
        metadata: {
          course_name: 'CKB Development',
          completion_date: '2026-09-26',
        },
      };

      expect(isValidCredoraCoursePayload(validPayload)).toBe(true);
    });

    it('should validate payload with optional fields', () => {
      const payloadWithOptional: CredoraCoursePayload = {
        spore_id: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        course_id: 'course-001',
        issuer_did: 'did:ckb:qq2m72u8u6dxq2qru9w4f5m4h7x3z6k8u4n9p2r3s',
        issued_at: Date.now(),
        expires_at: Date.now() + 86400 * 30 * 1000, // 30 days
        metadata: {
          course_name: 'CKB Development',
          completion_date: '2026-09-26',
          grade: 'A',
        },
      };

      expect(isValidCredoraCoursePayload(payloadWithOptional)).toBe(true);
    });

    it('should reject payload missing spore_id', () => {
      const invalidPayload = {
        course_id: 'course-001',
        issuer_did: 'did:ckb:qq2m72u8u6dxq2qru9w4f5m4h7x3z6k8u4n9p2r3s',
        issued_at: Date.now(),
        metadata: {
          course_name: 'CKB Development',
          completion_date: '2026-09-26',
        },
      };

      expect(isValidCredoraCoursePayload(invalidPayload)).toBe(false);
    });

    it('should reject payload missing course_id', () => {
      const invalidPayload = {
        spore_id: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        issuer_did: 'did:ckb:qq2m72u8u6dxq2qru9w4f5m4h7x3z6k8u4n9p2r3s',
        issued_at: Date.now(),
        metadata: {
          course_name: 'CKB Development',
          completion_date: '2026-09-26',
        },
      };

      expect(isValidCredoraCoursePayload(invalidPayload)).toBe(false);
    });

    it('should reject payload missing metadata', () => {
      const invalidPayload = {
        spore_id: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        course_id: 'course-001',
        issuer_did: 'did:ckb:qq2m72u8u6dxq2qru9w4f5m4h7x3z6k8u4n9p2r3s',
        issued_at: Date.now(),
      };

      expect(isValidCredoraCoursePayload(invalidPayload)).toBe(false);
    });

    it('should reject null input', () => {
      expect(isValidCredoraCoursePayload(null)).toBe(false);
    });

    it('should reject undefined input', () => {
      expect(isValidCredoraCoursePayload(undefined)).toBe(false);
    });

    it('should reject non-object input', () => {
      expect(isValidCredoraCoursePayload('string' as unknown)).toBe(false);
      expect(isValidCredoraCoursePayload(123 as unknown)).toBe(false);
    });
  });
});
