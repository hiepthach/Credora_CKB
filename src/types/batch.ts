import type { CertificateLayout, CertificateTheme, VisualStyleConfig } from './template';

export interface BatchEntry {
  row: number;
  recipientAddress: string;
  recipientName?: string;
  courseName: string;
  completionDate: string;
  expirationDate?: string;
  grade?: string;
  score?: number;
  skills?: string[];
  metadata?: Record<string, unknown>;
  errors?: string[];
  valid: boolean;
  layout?: CertificateLayout;
  theme?: CertificateTheme;
  customColor?: string;
  customTitle?: string;
  /** Resolved CKB address when input is a DID */
  resolvedAddress?: string;
  /** Whether the input was a DID */
  isDid?: boolean;
  /** Error message if DID resolution failed */
  resolutionError?: string;
}

export interface ParseBatchResult {
  entries: BatchEntry[];
  totalRows: number;
  validCount: number;
  invalidCount: number;
}

export interface BatchIssueParams {
  clusterId: string;
  issuerName: string;
  issuerDescription?: string;
  entries: BatchEntry[];
  expirationDate?: string;
  templateId?: string;
  defaultStyle?: VisualStyleConfig;
}

export interface BatchProgress {
  current: number;
  total: number;
  currentAddress: string;
  status: 'encoding' | 'building' | 'signing' | 'sending';
}

export interface BatchCertificateResult {
  row: number;
  recipientAddress: string;
  recipientName?: string;
  courseName?: string;
  certificateId?: string;
  transactionHash?: string;
  success: boolean;
  error?: string;
  /** Whether the recipient was a DID */
  isDid?: boolean;
}

export interface BatchIssueResult {
  total: number;
  successful: number;
  failed: number;
  certificates: BatchCertificateResult[];
  errors: BatchError[];
}

export interface BatchError {
  code: string;
  message: string;
  row?: number;
}

export interface BatchPreview {
  clusterId: string;
  totalEntries: number;
  validEntries: BatchEntry[];
  invalidEntries: BatchEntry[];
  estimatedFee: string;
  warnings: string[];
}

export interface BatchValidationResult {
  valid: boolean;
  entries: BatchEntry[];
}
