import type { VerificationResult, VerificationHistory, CertificateDNA } from '@/types';
import { isExpired, isValidDNAFormat, decodeCertificateDNA } from './decoder';
import { getCertificate } from './issuer';
import { getCluster } from './cluster';

export { isExpired } from './decoder';

/**
 * Verify a certificate by its ID
 * Performs comprehensive verification including:
 * - Cell existence check
 * - DNA format validation
 * - Issuer verification
 * - Expiration check
 */
export async function verifyCertificate(
  certificateId: string,
  client?: unknown
): Promise<VerificationResult> {
  const errors: string[] = [];

  // Initialize checks object
  const checks = {
    cellExists: false,
    dnaValid: false,
    issuerVerified: false,
    expirationVerified: true,
  };

  try {
    // Step 1: Find the certificate
    const certResult = await getCertificate(certificateId, client);

    if (!certResult) {
      errors.push('Certificate not found on chain');
      return createInvalidResult(certificateId, errors, checks);
    }

    checks.cellExists = true;

    // Step 2: Get and validate the certificate DNA
    let certificate: CertificateDNA;
    try {
      if (typeof certResult.certificate === 'string') {
        certificate = decodeCertificateDNA(certResult.certificate);
      } else if (isValidDNAFormat(certResult.certificate)) {
        certificate = certResult.certificate;
      } else {
        errors.push('Invalid certificate format');
        return createInvalidResult(certificateId, errors, checks);
      }
      checks.dnaValid = true;
    } catch {
      errors.push('Invalid certificate format');
      return createInvalidResult(certificateId, errors, checks);
    }

    // Step 3: Verify issuer (cluster) exists
    const issuerId = certificate.issuer.id;
    let issuerName = certificate.issuer.name || 'Unknown';

    if (issuerId) {
      const cluster = await getCluster(issuerId, client);
      if (cluster) {
        issuerName = cluster.name;
        checks.issuerVerified = true;
      }
    }

    // Step 4: Check expiration
    const expired = isExpired(certificate);
    if (expired) {
      checks.expirationVerified = false;
      errors.push('Certificate has expired');
    }

    // Overall validity - all checks must pass
    const valid = checks.cellExists && checks.dnaValid && checks.expirationVerified;

    return {
      valid,
      certificateId,
      issuer: {
        id: issuerId,
        name: issuerName,
      },
      certificate: {
        isExpired: expired,
        issuanceDate: certificate.issuanceDate,
        expirationDate: certificate.expirationDate,
      },
      isExpired: expired,
      checks,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString(),
      transactionHash: certResult.transactionHash,
    };
  } catch (error) {
    errors.push(error instanceof Error ? error.message : 'Verification failed');
    return createInvalidResult(certificateId, errors, checks);
  }
}

/**
 * Create an invalid verification result with all checks failed
 */
function createInvalidResult(
  certificateId: string,
  errors: string[],
  checks: {
    cellExists: boolean;
    dnaValid: boolean;
    issuerVerified: boolean;
    expirationVerified: boolean;
  }
): VerificationResult {
  return {
    valid: false,
    certificateId,
    issuer: { id: '', name: '' },
    certificate: {
      isExpired: false,
      issuanceDate: '',
    },
    isExpired: false,
    checks,
    errors: errors.length > 0 ? errors : undefined,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Get verification history for a certificate
 */
export async function getVerificationHistory(certificateId: string): Promise<VerificationHistory[]> {
  // For MVP, this would store verification events off-chain
  // or query a verification registry contract
  // Return empty for now
  console.log('Getting verification history for:', certificateId);
  return [];
}
