import type { CertificateLayout, CertificateTheme } from './template';

// W3C Verifiable Credentials Types
export interface Issuer {
  id: string;
  name?: string;
  description?: string;
}

export interface CredentialSubjectMetadata {
  layout?: CertificateLayout;
  theme?: CertificateTheme;
  customColor?: string;
  customTitle?: string;
  [key: string]: unknown;
}

export interface CredentialSubject {
  id?: string;
  type: string;
  name?: string;
  courseName?: string;
  completionDate?: string;
  issuerName?: string;
  issuerDescription?: string;
  grade?: string;
  score?: number;
  skills?: string[];
  metadata?: CredentialSubjectMetadata;
  /** Original wallet address when id is a DID (for backward compatibility) */
  walletAddress?: string;
}


export interface CredentialStatus {
  id: string;
  type: string;
}

export interface CertificateDNA {
  '@context': string[];
  id: string;
  type: string[];
  issuer: Issuer;
  issuanceDate: string;
  expirationDate?: string;
  credentialSubject: CredentialSubject;
  credentialStatus?: CredentialStatus;
}

export interface VerificationChecks {
  cellExists: boolean;
  dnaValid: boolean;
  issuerVerified: boolean;
  expirationVerified: boolean;
}

export interface VerificationResult {
  valid: boolean;
  certificateId: string;
  issuer: { id: string; name: string };
  certificate: {
    isExpired: boolean;
    issuanceDate: string;
    expirationDate?: string;
  };
  checks: VerificationChecks;
  errors?: string[];
  timestamp?: string;
  transactionHash?: string;
}

export interface VerificationHistory {
  certificateId: string;
  verifiedAt: string;
  result: VerificationResult;
}

export interface CertificateDisplay {
  title: string;
  recipient: string;
  course: string;
  issuer: string;
  date?: string;
  status: 'active' | 'expired';
}
