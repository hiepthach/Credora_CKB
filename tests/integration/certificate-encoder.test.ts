import { describe, it, expect } from 'vitest';
import { encodeCertificateDNA } from '@/lib/credentials/encoder';
import { decodeCertificateDNA } from '@/lib/credentials/decoder';

describe('Certificate Encoder/Decoder', () => {
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
});
