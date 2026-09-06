import { describe, it, expect, vi } from 'vitest';
import { parseBatchFile, validateBatchEntries, previewBatch } from '@/lib/credentials/batch';

vi.mock('@/lib/did', () => ({
  isDidInput: vi.fn((val: string) => val.startsWith('did:ckb:')),
}));

describe('Batch Issuance Integration Flow', () => {
  it('parses, validates, and previews mixed CKB address and DID CSV entries', async () => {
    const csvContent = `recipientAddress,recipientName,courseName,completionDate,grade,skills
ckt1qzda0cr08m85hc8j9np9u2xnjvs2tsq8q5h5xcmr,Bob Smith,CKB Core,2026-03-01,A,Rust;Nervos
did:ckb:0123456789abcdefghijklmnopqrstu,Alice Wong,CKB Core,2026-03-02,A+,DOB;W3C`;

    const file = new File([csvContent], 'students.csv', { type: 'text/csv' });
    const parsed = await parseBatchFile(file);

    expect(parsed.entries).toHaveLength(2);
    expect(parsed.totalRows).toBe(2);

    const validation = validateBatchEntries(parsed.entries);
    expect(validation.validCount).toBe(2);
    expect(validation.invalidCount).toBe(0);

    const preview = previewBatch(parsed.entries, '0xcluster123');
    expect(preview.totalCount).toBe(2);
    expect(preview.validCount).toBe(2);
    expect(preview.estimatedTotalCapacity).toBeDefined();
  });
});
