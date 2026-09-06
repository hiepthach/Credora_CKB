/**
 * Batch Issuance Tests - CSV/JSON Parsing and Validation
 *
 * Tests for batch certificate issuance including file parsing,
 * entry validation, and fee estimation.
 * Reference: Design_spec/06_Batch_Issuance.md
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  parseCSV,
  parseJSON,
  validateBatchEntries,
  previewBatch,
  issueBatchCertificates,
} from '../../../src/lib/credentials/batch';
import { issueCertificate } from '../../../src/lib/credentials/issuer';
import type { BatchEntry } from '../../../src/types';

vi.mock('../../../src/lib/credentials/issuer', () => ({
  issueCertificate: vi.fn(),
}));

describe('Batch Issuance', () => {
  // Valid batch entry fixture for testing
  const validEntries: BatchEntry[] = [
    {
      row: 1,
      recipientAddress: 'ckt1q9gry5zgxmpjnmhrp4raggde4gf2vqqyzd5x3lt7pf5m8c2kzwfxnsvpq',
      recipientName: 'John Doe',
      courseName: 'CKB Basics',
      completionDate: '2024-01-15',
      grade: 'A',
      score: 95,
      errors: [],
      valid: false,
    },
  ];

  describe('validateBatchEntries', () => {
    // Test: Validate all valid entries pass validation
    // Input: BatchEntry[] with valid address and required fields
    // Expected: All entries marked valid=true, errors=[]
    it('should validate all valid entries', () => {
      const result = validateBatchEntries(validEntries);

      expect(result.valid).toBe(true);
      expect(result.entries[0].valid).toBe(true);
      expect(result.entries[0].errors).toHaveLength(0);
    });

    // Test: Detect invalid CKB address format
    // Input: BatchEntry with address not starting with 'ckt'
    // Expected: Entry marked invalid with 'Invalid format: must be CKB address (ckt/ckb) or did:ckb:...' error
    it('should detect invalid address format', () => {
      const entriesWithBadAddress: BatchEntry[] = [
        {
          row: 1,
          recipientAddress: 'invalid_address',
          courseName: 'CKB Basics',
          completionDate: '2024-01-15',
          errors: [],
          valid: false,
        },
      ];

      const result = validateBatchEntries(entriesWithBadAddress);

      expect(result.valid).toBe(false);
      expect(result.entries[0].valid).toBe(false);
      expect(result.entries[0].errors).toContain('Invalid format: must be CKB address (ckt/ckb) or did:ckb:...');
    });

    // Test: Detect missing course name
    // Input: BatchEntry with empty courseName
    // Expected: Entry marked invalid with 'Course name is required' error
    it('should detect missing course name', () => {
      const entriesWithMissingCourse: BatchEntry[] = [
        {
          row: 1,
          recipientAddress: 'ckt1q9gry5zgxmpjnmhrp4raggde4gf2vqqyzd5x3lt7pf5m8c2kzwfxnsvpq',
          courseName: '',
          completionDate: '2024-01-15',
          errors: [],
          valid: false,
        },
      ];

      const result = validateBatchEntries(entriesWithMissingCourse);

      expect(result.valid).toBe(false);
      expect(result.entries[0].errors).toContain('Course name is required');
    });

    // Test: Detect invalid date format
    // Input: BatchEntry with non-parseable date string
    // Expected: Entry marked invalid with 'Invalid date format' error
    it('should detect invalid date format', () => {
      const entriesWithBadDate: BatchEntry[] = [
        {
          row: 1,
          recipientAddress: 'ckt1q9gry5zgxmpjnmhrp4raggde4gf2vqqyzd5x3lt7pf5m8c2kzwfxnsvpq',
          courseName: 'CKB Basics',
          completionDate: 'not-a-date',
          errors: [],
          valid: false,
        },
      ];

      const result = validateBatchEntries(entriesWithBadDate);

      expect(result.valid).toBe(false);
      expect(result.entries[0].errors).toContain('Invalid date format');
    });

    // Test: Track multiple errors per entry
    // Input: BatchEntry with invalid address, missing course, bad date
    // Expected: Entry has multiple errors, all tracked
    it('should validate multiple entries and track errors', () => {
      const mixedEntries: BatchEntry[] = [
        {
          row: 1,
          recipientAddress: 'ckt1q9gry5zgxmpjnmhrp4raggde4gf2vqqyzd5x3lt7pf5m8c2kzwfxnsvpq',
          courseName: 'CKB Basics',
          completionDate: '2024-01-15',
          errors: [],
          valid: false,
        },
        {
          row: 2,
          recipientAddress: 'invalid',
          courseName: '',
          completionDate: 'bad-date',
          errors: [],
          valid: false,
        },
      ];

      const result = validateBatchEntries(mixedEntries);

      // First entry is valid
      expect(result.entries[0].valid).toBe(true);
      // Second entry has multiple errors
      expect(result.entries[1].valid).toBe(false);
      expect(result.entries[1].errors?.length ?? 0).toBeGreaterThan(1);
    });

    it('should detect invalid layout', () => {
      const entries: BatchEntry[] = [
        {
          row: 1,
          recipientAddress: 'ckt1q9gry5zgxmpjnmhrp4raggde4gf2vqqyzd5x3lt7pf5m8c2kzwfxnsvpq',
          courseName: 'CKB Basics',
          completionDate: '2024-01-15',
          layout: 'invalid-layout' as any,
          errors: [],
          valid: false,
        },
      ];

      const result = validateBatchEntries(entries);
      expect(result.valid).toBe(false);
      expect(result.entries[0].errors).toContain('Invalid layout');
    });

    it('should detect invalid theme', () => {
      const entries: BatchEntry[] = [
        {
          row: 1,
          recipientAddress: 'ckt1q9gry5zgxmpjnmhrp4raggde4gf2vqqyzd5x3lt7pf5m8c2kzwfxnsvpq',
          courseName: 'CKB Basics',
          completionDate: '2024-01-15',
          theme: 'invalid-theme' as any,
          errors: [],
          valid: false,
        },
      ];

      const result = validateBatchEntries(entries);
      expect(result.valid).toBe(false);
      expect(result.entries[0].errors).toContain('Invalid theme');
    });

    it('should detect invalid hex color format', () => {
      const entries: BatchEntry[] = [
        {
          row: 1,
          recipientAddress: 'ckt1q9gry5zgxmpjnmhrp4raggde4gf2vqqyzd5x3lt7pf5m8c2kzwfxnsvpq',
          courseName: 'CKB Basics',
          completionDate: '2024-01-15',
          theme: 'custom',
          customColor: '#GGGGGG',
          errors: [],
          valid: false,
        },
      ];

      const result = validateBatchEntries(entries);
      expect(result.valid).toBe(false);
      expect(result.entries[0].errors).toContain('Invalid hex color format (expected #RRGGBB)');
    });

    it('should accept valid hex color format', () => {
      const entries: BatchEntry[] = [
        {
          row: 1,
          recipientAddress: 'ckt1q9gry5zgxmpjnmhrp4raggde4gf2vqqyzd5x3lt7pf5m8c2kzwfxnsvpq',
          courseName: 'CKB Basics',
          completionDate: '2024-01-15',
          theme: 'custom',
          customColor: '#FF5500',
          errors: [],
          valid: false,
        },
      ];

      const result = validateBatchEntries(entries);
      expect(result.valid).toBe(true);
      expect(result.entries[0].errors).toHaveLength(0);
    });

    it('should validate valid layout and theme', () => {
      const entries: BatchEntry[] = [
        {
          row: 1,
          recipientAddress: 'ckt1q9gry5zgxmpjnmhrp4raggde4gf2vqqyzd5x3lt7pf5m8c2kzwfxnsvpq',
          courseName: 'CKB Basics',
          completionDate: '2024-01-15',
          layout: 'modern',
          theme: 'gold',
          customColor: '#FFD700',
          customTitle: 'HONORS',
          errors: [],
          valid: false,
        },
      ];

      const result = validateBatchEntries(entries);
      expect(result.valid).toBe(true);
      expect(result.entries[0].errors).toHaveLength(0);
    });
  });

  describe('previewBatch', () => {
    // Two valid entries for fee calculation
    const twoValidEntries: BatchEntry[] = [
      {
        row: 1,
        recipientAddress: 'ckt1q9gry5zgxmpjnmhrp4raggde4gf2vqqyzd5x3lt7pf5m8c2kzwfxnsvpq',
        recipientName: 'John Doe',
        courseName: 'CKB Basics',
        completionDate: '2024-01-15',
        errors: [],
        valid: true,
      },
      {
        row: 2,
        recipientAddress: 'ckt1q9gry5zgxmpjnmhrp4raggde4gf2vqqyzd5x3lt7pf5m8c2kzwfxnsvpq',
        recipientName: 'Jane Smith',
        courseName: 'CKB Advanced',
        completionDate: '2024-01-16',
        errors: [],
        valid: true,
      },
    ];

    // Mixed entries: 2 valid + 1 invalid
    const mixedEntries: BatchEntry[] = [
      ...twoValidEntries,
      {
        row: 3,
        recipientAddress: 'invalid',
        courseName: '',
        completionDate: 'bad',
        errors: ['Invalid format: must be CKB address (ckt/ckb) or did:ckb:...', 'Course name is required'],
        valid: false,
      },
    ];

    // Test: Calculate fee estimate correctly
    // Input: 2 valid entries
    // Expected: Fee = 2 * 151 CKB = 302 CKB
    it('should calculate correct fee estimate', () => {
      const preview = previewBatch(twoValidEntries, 'cluster-123');

      // 2 entries * 151 CKB per certificate = 302 CKB
      expect(preview.estimatedFee).toBe('302 CKB');
    });

    // Test: Separate valid and invalid entries
    // Input: 3 entries (2 valid, 1 invalid)
    // Expected: validEntries=[2], invalidEntries=[1], totalEntries=3
    it('should separate valid and invalid entries', () => {
      const preview = previewBatch(mixedEntries, 'cluster-123');

      expect(preview.validEntries).toHaveLength(2);
      expect(preview.invalidEntries).toHaveLength(1);
      expect(preview.totalEntries).toBe(3);
    });

    // Test: Add warning for invalid entries
    // Input: Mixed entries with 1 invalid
    // Expected: Warning includes count of invalid entries
    it('should add warning for invalid entries', () => {
      const preview = previewBatch(mixedEntries, 'cluster-123');

      expect(preview.warnings).toContain('1 entries have validation errors and will be skipped');
    });

    // Test: Add warning for large batches
    // Input: 101 valid entries (>100 threshold)
    // Expected: Warning about processing time
    it('should add warning for large batches', () => {
      const largeEntries: BatchEntry[] = Array.from({ length: 101 }, (_, i) => ({
        row: i + 1,
        recipientAddress: 'ckt1q9gry5zgxmpjnmhrp4raggde4gf2vqqyzd5x3lt7pf5m8c2kzwfxnsvpq',
        courseName: 'Course',
        completionDate: '2024-01-15',
        errors: [],
        valid: true,
      }));

      const preview = previewBatch(largeEntries, 'cluster-123');

      expect(preview.warnings).toContain('Large batch may take several minutes to process');
    });

    // Test: Handle empty entries
    // Input: Empty array
    // Expected: 0 CKB fee, empty arrays
    it('should handle empty entries', () => {
      const preview = previewBatch([], 'cluster-123');

      expect(preview.validEntries).toHaveLength(0);
      expect(preview.invalidEntries).toHaveLength(0);
      expect(preview.estimatedFee).toBe('0 CKB');
    });
  });

  describe('parseCSV', () => {
    // Test: Parse CSV content correctly
    // Input: CSV string with 2 certificate entries
    // Expected: Returns totalRows=2, entries with correct field values
    it('should parse CSV content correctly', () => {
      const csvContent = `recipientAddress,recipientName,courseName,completionDate,grade
ckt1q9gry5zgxmpjnmhrp4raggde4gf2vqqyzd5x3lt7pf5m8c2kzwfxnsvpq,John Doe,CKB Basics,2024-01-15,A
ckt1q9gry5zgxmpjnmhrp4raggde4gf2vqqyzd5x3lt7pf5m8c2kzwfxnsvpq,Jane Smith,CKB Advanced,2024-01-16,B+`;

      const result = parseCSV(csvContent);

      expect(result.totalRows).toBe(2);
      expect(result.entries).toHaveLength(2);
      expect(result.entries[0].recipientName).toBe('John Doe');
      expect(result.entries[0].grade).toBe('A');
      expect(result.entries[1].courseName).toBe('CKB Advanced');
      expect(result.entries[1].grade).toBe('B+');
    });

    it('should parse optional style columns from CSV (layout, theme, customColor, customTitle)', () => {
      const csv = `recipientAddress,recipientName,courseName,completionDate,layout,theme,customColor,customTitle
ckt1q9gry5zgxmpjnmhrp4raggde4gf2vqqyzd5x3lt7pf5m8c2kzwfxnsvpq,Alice,Rust 101,2026-03-01,modern,custom,#F26F21,DIPLOMA WITH HONORS
ckt1q9gry5zgxmpjnmhrp4raggde4gf2vqqyzd5x3lt7pf5m8c2kzwfxnsvpq,Bob,Rust 101,2026-03-01,,,,`;

      const { entries } = parseCSV(csv);
      expect(entries[0].layout).toBe('modern');
      expect(entries[0].theme).toBe('custom');
      expect(entries[0].customColor).toBe('#F26F21');
      expect(entries[0].customTitle).toBe('DIPLOMA WITH HONORS');
      expect(entries[1].layout).toBeUndefined();
      expect(entries[1].theme).toBeUndefined();
      expect(entries[1].customColor).toBeUndefined();
      expect(entries[1].customTitle).toBeUndefined();
    });
  });

  describe('parseJSON', () => {
    // Test: Parse JSON content correctly
    // Input: JSON string with 1 certificate entry
    // Expected: Returns totalRows=1, entry with correct field values
    it('should parse JSON content correctly', () => {
      const jsonContent = JSON.stringify([
        {
          recipientAddress: 'ckt1q9gry5zgxmpjnmhrp4raggde4gf2vqqyzd5x3lt7pf5m8c2kzwfxnsvpq',
          recipientName: 'John Doe',
          courseName: 'CKB Basics',
          completionDate: '2024-01-15',
        },
      ]);

      const result = parseJSON(jsonContent);

      expect(result.totalRows).toBe(1);
      expect(result.entries).toHaveLength(1);
      expect(result.entries[0].recipientName).toBe('John Doe');
      expect(result.entries[0].courseName).toBe('CKB Basics');
    });

    it('should parse optional style fields from JSON (layout, theme, customColor, customTitle)', () => {
      const jsonContent = JSON.stringify([
        {
          recipientAddress: 'ckt1q9gry5zgxmpjnmhrp4raggde4gf2vqqyzd5x3lt7pf5m8c2kzwfxnsvpq',
          courseName: 'Rust 101',
          completionDate: '2026-03-01',
          layout: 'badge',
          theme: 'gold',
          customColor: '#FFD700',
          customTitle: 'BADGE OF MERIT',
        },
        {
          recipientAddress: 'ckt1q9gry5zgxmpjnmhrp4raggde4gf2vqqyzd5x3lt7pf5m8c2kzwfxnsvpq',
          courseName: 'Rust 101',
          completionDate: '2026-03-01',
        },
      ]);

      const { entries } = parseJSON(jsonContent);
      expect(entries[0].layout).toBe('badge');
      expect(entries[0].theme).toBe('gold');
      expect(entries[0].customColor).toBe('#FFD700');
      expect(entries[0].customTitle).toBe('BADGE OF MERIT');
      expect(entries[1].layout).toBeUndefined();
      expect(entries[1].theme).toBeUndefined();
      expect(entries[1].customColor).toBeUndefined();
      expect(entries[1].customTitle).toBeUndefined();
    });

    // Test: Parse JSON array with multiple entries
    // Input: JSON array with 3 entries
    // Expected: Returns totalRows=3
    it('should parse multiple JSON entries', () => {
      const jsonContent = JSON.stringify([
        { recipientAddress: 'ckt1q1', recipientName: 'Alice', courseName: 'Course 1', completionDate: '2024-01-01' },
        { recipientAddress: 'ckt1q2', recipientName: 'Bob', courseName: 'Course 2', completionDate: '2024-01-02' },
        { recipientAddress: 'ckt1q3', recipientName: 'Charlie', courseName: 'Course 3', completionDate: '2024-01-03' },
      ]);

      const result = parseJSON(jsonContent);

      expect(result.totalRows).toBe(3);
      expect(result.entries[0].recipientName).toBe('Alice');
      expect(result.entries[2].recipientName).toBe('Charlie');
    });

    // Test: Handle JSON that is not an array
    // Input: JSON object instead of array
    // Expected: Throws error
    it('should throw error for non-array JSON', () => {
      const jsonContent = JSON.stringify({ name: 'test' });

      expect(() => parseJSON(jsonContent)).toThrow('JSON must be an array of entries');
    });
  });

  describe('issueBatchCertificates', () => {
    beforeEach(() => {
      vi.clearAllMocks();
      vi.mocked(issueCertificate).mockResolvedValue({
        certificateId: 'cert-mock-123',
        transactionHash: '0x123abc',
      });
    });

    it('should resolve metadata style with precedence: row override > defaultStyle > fallback', async () => {
      const mockSigner = {};
      const entries: BatchEntry[] = [
        {
          row: 1,
          recipientAddress: 'ckt1q9gry5zgxmpjnmhrp4raggde4gf2vqqyzd5x3lt7pf5m8c2kzwfxnsvpq',
          recipientName: 'Alice',
          courseName: 'Rust 101',
          completionDate: '2026-03-01',
          layout: 'modern',
          theme: 'gold',
          customColor: '#FFD700',
          customTitle: 'HONORS',
          errors: [],
          valid: true,
        },
        {
          row: 2,
          recipientAddress: 'ckt1q9gry5zgxmpjnmhrp4raggde4gf2vqqyzd5x3lt7pf5m8c2kzwfxnsvpq',
          recipientName: 'Bob',
          courseName: 'Rust 101',
          completionDate: '2026-03-01',
          errors: [],
          valid: true,
        },
      ];

      await issueBatchCertificates(mockSigner, {
        clusterId: 'cluster-1',
        issuerName: 'Test Issuer',
        entries,
        defaultStyle: {
          layout: 'compact',
          theme: 'purple',
          customColor: '#800080',
          customTitle: 'DEFAULT TITLE',
        },
      });

      expect(issueCertificate).toHaveBeenCalledTimes(2);

      // Entry 1: row style takes precedence over defaultStyle
      expect(issueCertificate).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          subject: expect.objectContaining({
            metadata: {
              layout: 'modern',
              theme: 'gold',
              customColor: '#FFD700',
              customTitle: 'HONORS',
            },
          }),
        })
      );

      // Entry 2: defaultStyle is applied when row has no style
      expect(issueCertificate).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          subject: expect.objectContaining({
            metadata: {
              layout: 'compact',
              theme: 'purple',
              customColor: '#800080',
              customTitle: 'DEFAULT TITLE',
            },
          }),
        })
      );
    });

    it('should fallback to classic and blue when neither row nor defaultStyle provides style', async () => {
      const mockSigner = {};
      const entries: BatchEntry[] = [
        {
          row: 1,
          recipientAddress: 'ckt1q9gry5zgxmpjnmhrp4raggde4gf2vqqyzd5x3lt7pf5m8c2kzwfxnsvpq',
          recipientName: 'Charlie',
          courseName: 'Rust 101',
          completionDate: '2026-03-01',
          errors: [],
          valid: true,
        },
      ];

      await issueBatchCertificates(mockSigner, {
        clusterId: 'cluster-1',
        issuerName: 'Test Issuer',
        entries,
      });

      expect(issueCertificate).toHaveBeenCalledTimes(1);
      expect(issueCertificate).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: expect.objectContaining({
            metadata: {
              layout: 'classic',
              theme: 'blue',
              customColor: undefined,
              customTitle: undefined,
            },
          }),
        })
      );
    });

    it('should accurately capture row details, recipientName, and error message when issuance fails', async () => {
      const mockSigner = {};
      const entries: BatchEntry[] = [
        {
          row: 1,
          recipientAddress: 'ckt1q9gry5zgxmpjnmhrp4raggde4gf2vqqyzd5x3lt7pf5m8c2kzwfxnsvpq',
          recipientName: 'Alice Success',
          courseName: 'Rust 101',
          completionDate: '2026-03-01',
          errors: [],
          valid: true,
        },
        {
          row: 2,
          recipientAddress: 'ckt1q9gry5zgxmpjnmhrp4raggde4gf2vqqyzd5x3lt7pf5m8c2kzwfxnsvpr',
          recipientName: 'Bob Failed',
          courseName: 'CKB Basics',
          completionDate: '2026-03-02',
          errors: [],
          valid: true,
        },
      ];

      vi.mocked(issueCertificate)
        .mockResolvedValueOnce({
          certificateId: 'cert-1',
          transactionHash: '0xabc',
        } as any)
        .mockRejectedValueOnce(new Error('Insufficient capacity in wallet'));

      const result = await issueBatchCertificates(mockSigner, {
        clusterId: 'cluster-1',
        issuerName: 'Test Issuer',
        entries,
      });

      expect(result.total).toBe(2);
      expect(result.successful).toBe(1);
      expect(result.failed).toBe(1);

      // Verify successful certificate
      expect(result.certificates[0]).toEqual(
        expect.objectContaining({
          row: 1,
          recipientName: 'Alice Success',
          recipientAddress: 'ckt1q9gry5zgxmpjnmhrp4raggde4gf2vqqyzd5x3lt7pf5m8c2kzwfxnsvpq',
          success: true,
          certificateId: 'cert-1',
        })
      );

      // Verify failed certificate has full row context and error
      expect(result.certificates[1]).toEqual(
        expect.objectContaining({
          row: 2,
          recipientName: 'Bob Failed',
          recipientAddress: 'ckt1q9gry5zgxmpjnmhrp4raggde4gf2vqqyzd5x3lt7pf5m8c2kzwfxnsvpr',
          success: false,
          error: 'Insufficient capacity in wallet',
        })
      );

      // Verify errors array contains formatted error with row number and recipient
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].row).toBe(2);
      expect(result.errors[0].message).toContain('Row 2 [Bob Failed');
      expect(result.errors[0].message).toContain('Insufficient capacity in wallet');
    });
  });
});

