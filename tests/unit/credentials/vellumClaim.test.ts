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

  describe('buildCredoraCoursePayload', () => {
    it('sets issuer_did to config.issuerDid when provided and distinguishes from subjectDid', async () => {
      const { buildCredoraCoursePayload } = await import(
        '@/lib/credentials/vellumClaim'
      );

      const customIssuer = 'did:ckb:qqcustomissuerinstitution000';
      const studentSubject = 'did:ckb:qqstudentreceiver0000000000';

      const payload = buildCredoraCoursePayload({
        sporeId: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        courseId: 'course-101',
        subjectDid: studentSubject,
        issuerDid: customIssuer,
        issuerName: 'Web3 University',
        issuedAt: 1700000000,
        grade: 'A+',
      });

      expect(payload.issuer_did).toBe(customIssuer);
      expect(payload.issuer_did).not.toBe(studentSubject);
      expect(payload.course_id).toBe('course-101');
      expect(payload.metadata.grade).toBe('A+');
    });

    it('sets empty issuer_did when issuerDid is omitted', async () => {
      const { buildCredoraCoursePayload } = await import(
        '@/lib/credentials/vellumClaim'
      );

      const studentSubject = 'did:ckb:qqstudentreceiver0000000000';

      const payload = buildCredoraCoursePayload({
        sporeId: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        courseId: 'course-101',
        subjectDid: studentSubject,
        issuerName: 'Web3 University',
        issuedAt: 1700000000,
      });

      expect(payload.issuer_did).toBe('');
    });
  });

  describe('issueVellumClaimCell', () => {
    it('calls writeClaim with prepared payload and scripts', async () => {
      const { issueVellumClaimCell, CredoraCourseSchemaHash } = await import(
        '@/lib/credentials/vellumClaim'
      );
      const { writeClaim } = await import('@usevellum/sdk');

      const mockSigner = {} as any;
      const mockTx = { outputs: [], outputsData: [] } as any;

      const result = await issueVellumClaimCell({
        signer: mockSigner,
        tx: mockTx,
        claimRecipientDid: 'did:ckb:recipient123',
        issuerDid: 'did:ckb:issuer456',
        sporeId: '0x' + '11'.repeat(32),
        courseId: 'course-101',
        issuerName: 'Credora Academy',
        issuedAt: 1700000000,
      });

      expect(writeClaim).toHaveBeenCalledWith(
        expect.objectContaining({
          issuerSigner: mockSigner,
          input: expect.objectContaining({
            subject: { did: 'did:ckb:recipient123' },
            issuerDid: 'did:ckb:issuer456',
            schemaHash: CredoraCourseSchemaHash,
            payload: expect.objectContaining({
              spore_id: '0x' + '11'.repeat(32),
              course_id: 'course-101',
            }),
          }),
          tx: mockTx,
        })
      );
      expect(result.claimId).toBeDefined();
    });
  });

  describe('createVellumClaimCell', () => {
    it('creates Claim Cell with recipient lock, schema hash in type args, and encoded data', async () => {
      const { createVellumClaimCell, CredoraCourseSchemaHash } =
        await import('@/lib/credentials/vellumClaim');

      const mockRecipientLock = {
        codeHash: '0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8',
        hashType: 'type' as const,
        args: '0xabcdef',
      };

      const result = await createVellumClaimCell({
        sporeId: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        courseId: 'course-101',
        subjectDid: 'did:ckb:qqstudentreceiver0000000000',
        issuerDid: 'did:ckb:qqcustomissuerinstitution000',
        recipientLock: mockRecipientLock as any,
        issuerName: 'Web3 Academy',
        issuedAt: 1700000000,
      });

      expect(result.claimCellOutput).toBeDefined();
      expect(result.claimCellOutput.capacity).toBe(BigInt(350_00000000));
      expect(result.claimCellOutput.lock).toEqual(mockRecipientLock);
      expect(result.claimCellOutput.type?.args).toContain(CredoraCourseSchemaHash.slice(2));
      expect(result.claimCellData).toBeInstanceOf(Uint8Array);
      expect(result.claimCellData.length).toBeGreaterThan(0);
      expect(result.claimId).toMatch(/^claim_/);
    });
  });
});
