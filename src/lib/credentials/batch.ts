/**
 * Batch Issuance - CSV/JSON Parsing and Validation
 *
 * Handles batch certificate issuance including file parsing,
 * entry validation, and fee estimation.
 */

import Papa from 'papaparse';
import type { BatchEntry, BatchValidationResult, BatchPreview, BatchIssueParams, BatchIssueResult, BatchCertificateResult, BatchError, CertificateLayout, CertificateTheme } from '@/types';
import { issueCertificate } from './issuer';
import { isDidInput } from '@/lib/did';

const CKB_PER_CERTIFICATE = 151;
const LARGE_BATCH_THRESHOLD = 100;
const VALID_LAYOUTS: readonly CertificateLayout[] = ['classic', 'modern', 'compact', 'detailed', 'badge'];
const VALID_THEMES: readonly CertificateTheme[] = ['blue', 'purple', 'green', 'gold', 'red', 'custom'];

/**
 * Parse batch file (CSV or JSON)
 */
export async function parseBatchFile(file: File): Promise<{
  totalRows: number;
  entries: BatchEntry[];
}> {
  const content = await file.text();
  const filename = file.name.toLowerCase();

  if (filename.endsWith('.csv')) {
    return parseCSV(content);
  } else if (filename.endsWith('.json')) {
    return parseJSON(content);
  } else {
    throw new Error('Unsupported file format');
  }
}

/**
 * Parse CSV content 
 */
export function parseCSV(content: string): {
  totalRows: number;
  entries: BatchEntry[];
} {
  const result = Papa.parse<Record<string, string>>(content, {
    header: true,
    skipEmptyLines: true,
  });

  const entries: BatchEntry[] = result.data.map((row, index) => ({
    row: index + 1,
    recipientAddress: row.recipientAddress || '',
    recipientName: row.recipientName || '',
    courseName: row.courseName || '',
    completionDate: row.completionDate || '',
    expirationDate: row.expirationDate || undefined,
    grade: row.grade || undefined,
    score: row.score ? parseInt(row.score, 10) : undefined,
    layout: (row.layout as CertificateLayout) || undefined,
    theme: (row.theme as CertificateTheme) || undefined,
    customColor: row.customColor || undefined,
    customTitle: row.customTitle || undefined,
    errors: [],
    valid: false,
  }));

  return {
    totalRows: entries.length,
    entries,
  };
}

/**
 * Parse JSON content 
 */
export function parseJSON(content: string): {
  totalRows: number;
  entries: BatchEntry[];
} {
  const data = JSON.parse(content);

  if (!Array.isArray(data)) {
    throw new Error('JSON must be an array of entries');
  }

  const entries: BatchEntry[] = data.map((item: Record<string, unknown>, index: number) => ({
    row: index + 1,
    recipientAddress: (item.recipientAddress as string) || '',
    recipientName: (item.recipientName as string) || '',
    courseName: (item.courseName as string) || '',
    completionDate: (item.completionDate as string) || '',
    expirationDate: (item.expirationDate as string) || undefined,
    grade: item.grade as string | undefined,
    score: item.score as number | undefined,
    layout: (item.layout as CertificateLayout) || undefined,
    theme: (item.theme as CertificateTheme) || undefined,
    customColor: (item.customColor as string) || undefined,
    customTitle: (item.customTitle as string) || undefined,
    errors: [],
    valid: false,
  }));

  return {
    totalRows: entries.length,
    entries,
  };
}

/**
 * Validate batch entries
 */
export function validateBatchEntries(entries: BatchEntry[]): BatchValidationResult {
  const validated = entries.map((entry) => validateEntry(entry));
  const validCount = validated.filter((e) => e.valid).length;
  const invalidCount = validated.length - validCount;
  const allValid = invalidCount === 0;

  return {
    valid: allValid,
    entries: validated,
    validCount,
    invalidCount,
  };
}

/**
 * Validate single entry
 */
export function validateEntry(entry: BatchEntry): BatchEntry {
  const errors: string[] = [];

  // Validate address (supports both CKB address and DID)
  if (!entry.recipientAddress) {
    errors.push('Recipient address is required');
  } else if (!isDidInput(entry.recipientAddress) &&
             !entry.recipientAddress.startsWith('ckt') &&
             !entry.recipientAddress.startsWith('ckb')) {
    errors.push('Invalid format: must be CKB address (ckt/ckb) or did:ckb:...');
  }

  // Validate course name
  if (!entry.courseName || entry.courseName.trim() === '') {
    errors.push('Course name is required');
  }

  // Validate date
  if (entry.completionDate) {
    const date = new Date(entry.completionDate);
    if (isNaN(date.getTime())) {
      errors.push('Invalid date format');
    }
  }

  // Validate expiration date if provided
  if (entry.expirationDate) {
    const expDate = new Date(entry.expirationDate);
    if (isNaN(expDate.getTime())) {
      errors.push('Invalid expiration date format');
    }
  }

  // Validate layout if provided
  if (entry.layout && !VALID_LAYOUTS.includes(entry.layout)) {
    errors.push('Invalid layout');
  }

  // Validate theme if provided
  if (entry.theme && !VALID_THEMES.includes(entry.theme)) {
    errors.push('Invalid theme');
  }

  // Validate hex color format if provided
  if (entry.customColor && !/^#[0-9A-Fa-f]{6}$/.test(entry.customColor)) {
    errors.push('Invalid hex color format (expected #RRGGBB)');
  }

  return {
    ...entry,
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Preview batch issuance
 */
export function previewBatch(
  entries: BatchEntry[],
  clusterId: string
): BatchPreview {
  const validated = entries.map((e) => validateEntry(e));
  const validEntries = validated.filter((e) => e.valid);
  const invalidEntries = validated.filter((e) => !e.valid);
  const warnings: string[] = [];

  // Add warnings
  if (invalidEntries.length > 0) {
    warnings.push(`${invalidEntries.length} entries have validation errors and will be skipped`);
  }

  if (entries.length > LARGE_BATCH_THRESHOLD) {
    warnings.push('Large batch may take several minutes to process');
  }

  const fee = `${validEntries.length * CKB_PER_CERTIFICATE} CKB`;

  return {
    clusterId,
    totalEntries: entries.length,
    totalCount: entries.length,
    validEntries,
    validCount: validEntries.length,
    invalidEntries,
    invalidCount: invalidEntries.length,
    estimatedFee: fee,
    estimatedTotalCapacity: fee,
    warnings,
  };
}

/**
 * Issue certificates in batch
 */
export async function issueBatchCertificates(
  signer: unknown,
  params: BatchIssueParams,
  onProgress?: (progress: {
    current: number;
    total: number;
    currentAddress: string;
    status: 'encoding' | 'building' | 'signing' | 'sending';
  }) => void
): Promise<BatchIssueResult> {
  const { clusterId, issuerName, issuerDescription, entries, expirationDate } = params;

  const validEntries = entries.filter((e) => e.valid);
  const results: BatchCertificateResult[] = [];
  const errors: BatchError[] = [];

  for (let i = 0; i < validEntries.length; i++) {
    const entry = validEntries[i];

    onProgress?.({
      current: i + 1,
      total: validEntries.length,
      currentAddress: entry.recipientAddress,
      status: 'encoding',
    });

    try {
      const effectiveLayout = entry.layout || params.defaultStyle?.layout || 'classic';
      const effectiveTheme = entry.theme || params.defaultStyle?.theme || 'blue';
      const effectiveCustomColor = entry.customColor || params.defaultStyle?.customColor;
      const effectiveCustomTitle = entry.customTitle || params.defaultStyle?.customTitle;

      const result = await issueCertificate({
        signer,
        clusterId,
        issuerName,
        issuerDescription,
        subject: {
          id: entry.recipientAddress,
          type: 'CourseCertificate',
          name: entry.recipientName,
          courseName: entry.courseName,
          completionDate: entry.completionDate,
          grade: entry.grade,
          score: entry.score,
          skills: entry.skills,
          metadata: {
            layout: effectiveLayout,
            theme: effectiveTheme,
            customColor: effectiveCustomColor,
            customTitle: effectiveCustomTitle,
          },
        },
        expirationDate: entry.expirationDate || expirationDate,
      });

      results.push({
        row: entry.row,
        recipientAddress: entry.recipientAddress,
        recipientName: entry.recipientName,
        courseName: entry.courseName,
        certificateId: result.certificateId,
        transactionHash: result.transactionHash,
        success: true,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      results.push({
        row: entry.row,
        recipientAddress: entry.recipientAddress,
        recipientName: entry.recipientName,
        courseName: entry.courseName,
        success: false,
        error: errorMessage,
      });

      const identifier = entry.recipientName
        ? `${entry.recipientName} (${entry.recipientAddress.slice(0, 8)}...)`
        : entry.recipientAddress.slice(0, 10);

      errors.push({
        code: 'ISSUANCE_FAILED',
        message: `Row ${entry.row} [${identifier}]: ${errorMessage}`,
        row: entry.row,
      });
    }

    onProgress?.({
      current: i + 1,
      total: validEntries.length,
      currentAddress: entry.recipientAddress,
      status: 'sending',
    });
  }

  return {
    total: validEntries.length,
    successful: results.filter((r) => r.success).length,
    failed: results.filter((r) => !r.success).length,
    certificates: results,
    errors,
  };
}
