# CKB Credential Registry - Test Report

**Project:** CKB Credential Registry (Credora)
**Test Date:** 2026-09-17
**Test Framework:** Vitest 2.0.5
**Total Tests:** 310
**Status:** ✅ ALL PASSING

---

## Executive Summary

| Metric | Value |
|--------|-------|
| Total Test Files | 34 |
| Total Tests | 310 |
| Passed | 310 |
| Failed | 0 |
| Test Duration | ~10.4s |

---

## Test Files Overview

| Category | File | Tests | Status |
|----------|------|-------|--------|
| **Integration** | `tests/integration/batch-flow.test.ts` | 1 | ✅ Pass |
| **Integration** | `tests/integration/certificate-lifecycle.test.ts` | 2 | ✅ Pass |
| **Integration** | `tests/integration/did-integration.test.ts` | 11 | ✅ Pass |
| **Batch Unit** | `tests/unit/batch/BatchIssuePage.test.tsx` | 8 | ✅ Pass |
| **Batch Unit** | `tests/unit/batch/BatchPreview.test.tsx` | 8 | ✅ Pass |
| **Batch Unit** | `tests/unit/batch/BatchUpload.test.tsx` | 5 | ✅ Pass |
| **Certificate Unit** | `tests/unit/certificate/CertificateDetail.test.tsx` | 11 | ✅ Pass |
| **Certificate Unit** | `tests/unit/certificate/CertificateForm.test.tsx` | 4 | ✅ Pass |
| **Certificate Unit** | `tests/unit/certificate/PaperCertificate.test.tsx` | 13 | ✅ Pass |
| **Certificate Unit** | `tests/unit/certificates/InstitutionSelector.test.tsx` | 3 | ✅ Pass |
| **CKB Config** | `tests/unit/ckb/config.test.ts` | 12 | ✅ Pass |
| **Credentials** | `tests/unit/credentials/batch.test.ts` | 28 | ✅ Pass |
| **Credentials** | `tests/unit/credentials/cluster.test.ts` | 9 | ✅ Pass |
| **Credentials** | `tests/unit/credentials/decoder.test.ts` | 19 | ✅ Pass |
| **Credentials** | `tests/unit/credentials/encoder.test.ts` | 9 | ✅ Pass |
| **Credentials** | `tests/unit/credentials/issuer.test.ts` | 32 | ✅ Pass |
| **Credentials** | `tests/unit/credentials/services.test.ts` | 26 | ✅ Pass |
| **Credentials** | `tests/unit/credentials/template-types.test.ts` | 2 | ✅ Pass |
| **Credentials** | `tests/unit/credentials/verifier.test.ts` | 10 | ✅ Pass |
| **DID** | `tests/unit/did/resolver.test.ts` | 5 | ✅ Pass |
| **Hooks** | `tests/unit/hooks/useIssuerClusters.test.tsx` | 2 | ✅ Pass |
| **Lib** | `tests/unit/lib/share.test.ts` | 6 | ✅ Pass |
| **Template** | `tests/unit/template/TemplateShowcase.test.tsx` | 4 | ✅ Pass |
| **UI Components** | `tests/unit/ui/Alert.test.tsx` | 5 | ✅ Pass |
| **UI Components** | `tests/unit/ui/Badge.test.tsx` | 11 | ✅ Pass |
| **UI Components** | `tests/unit/ui/Button.test.tsx` | 17 | ✅ Pass |
| **UI Components** | `tests/unit/ui/Card.test.tsx` | 14 | ✅ Pass |
| **UI Components** | `tests/unit/ui/ClusterComponentsLabeling.test.tsx` | 2 | ✅ Pass |
| **UI Components** | `tests/unit/ui/EmptyState.test.tsx` | 2 | ✅ Pass |
| **UI Components** | `tests/unit/ui/HeaderLanding.test.tsx` | 1 | ✅ Pass |
| **UI Components** | `tests/unit/ui/Input.test.tsx` | 18 | ✅ Pass |
| **UI Components** | `tests/unit/ui/Spinner.test.tsx` | 3 | ✅ Pass |
| **Utils** | `tests/unit/utils/errors.test.ts` | 6 | ✅ Pass |
| **Verification** | `tests/unit/verification/VerifyResult.test.tsx` | 1 | ✅ Pass |

---

## Detailed Test Results

### 1. CKB Config Tests (`tests/unit/ckb/config.test.ts`)

**Coverage:** Network configuration, explorer URLs, network scripts

| # | Test Case | Status |
|---|-----------|--------|
| 1 | should use testnet config by default | ✅ Pass |
| 2 | should use testnet config when set | ✅ Pass |
| 3 | should use mainnet config when set | ✅ Pass |
| 4 | should return correct config for testnet | ✅ Pass |
| 5 | should have explorer URL for testnet | ✅ Pass |
| 6 | should generate transaction URL | ✅ Pass |
| 7 | should generate cell URL | ✅ Pass |
| 8 | should generate address URL | ✅ Pass |
| 9 | should return correct display names | ✅ Pass |
| 10 | should have correct script configs | ✅ Pass |
| 11 | should have correct hash types | ✅ Pass |
| 12 | should return explorer URL for testnet | ✅ Pass |

---

### 2. Encoder Tests (`tests/unit/credentials/encoder.test.ts`)

**Coverage:** W3C VC certificate DNA encoding, ID generation, serialization

#### encodeCertificateDNA
| # | Test Case | Status |
|---|-----------|--------|
| 1 | should encode valid certificate data | ✅ Pass |
| 2 | should encode minimal data with required fields only | ✅ Pass |
| 3 | should include expiration date when provided | ✅ Pass |
| 4 | should not include expiration date when not provided | ✅ Pass |

#### generateCertificateId
| # | Test Case | Status |
|---|-----------|--------|
| 5 | should generate a unique ID | ✅ Pass |
| 6 | should start with 0x prefix | ✅ Pass |
| 7 | should have correct length | ✅ Pass |

#### serializeDNA / getDNASize
| # | Test Case | Status |
|---|-----------|--------|
| 8 | should serialize DNA to JSON string | ✅ Pass |
| 9 | should return correct size in bytes | ✅ Pass |

---

### 3. Decoder Tests (`tests/unit/credentials/decoder.test.ts`)

**Coverage:** W3C VC decoding, expiration checks, format validation

#### decodeCertificateDNA
| # | Test Case | Status |
|---|-----------|--------|
| 1 | should decode valid JSON to CertificateDNA | ✅ Pass |
| 2 | should throw error for invalid JSON | ✅ Pass |
| 3 | should throw error for missing @context | ✅ Pass |
| 4 | should throw error for missing required fields | ✅ Pass |

#### isExpired
| # | Test Case | Status |
|---|-----------|--------|
| 5 | should return false for certificate without expiration | ✅ Pass |
| 6 | should return false for certificate with future expiration | ✅ Pass |
| 7 | should return true for certificate with past expiration | ✅ Pass |

#### getExpirationStatus
| # | Test Case | Status |
|---|-----------|--------|
| 10 | should return not expired when no expiration date | ✅ Pass |
| 11 | should return correct expiration status | ✅ Pass |
| 12 | should return positive days until expiration | ✅ Pass |

#### formatCertificateDisplay
| # | Test Case | Status |
|---|-----------|--------|
| 13 | should format valid certificate correctly | ✅ Pass |
| 14 | should return Unknown for missing fields | ✅ Pass |
| 15 | should return expired status for expired certificate | ✅ Pass |

#### isValidDNAFormat
| # | Test Case | Status |
|---|-----------|--------|
| 17 | should return true for valid DNA object | ✅ Pass |
| 18 | should return false for null | ✅ Pass |
| 19 | should return false for undefined | ✅ Pass |
| 20 | should return false for non-object | ✅ Pass |
| 21 | should return false for object missing required fields | ✅ Pass |
| 22 | should return false for VC without VerifiableCredential type | ✅ Pass |

---

### 4. Batch Issuance Tests (`tests/unit/credentials/batch.test.ts`)

**Coverage:** CSV/JSON parsing, entry validation, fee estimation

#### validateBatchEntries
| # | Test Case | Status |
|---|-----------|--------|
| 1 | should validate all valid entries | ✅ Pass |
| 2 | should detect invalid address format | ✅ Pass |
| 3 | should detect missing course name | ✅ Pass |
| 4 | should detect invalid date format | ✅ Pass |
| 5 | should validate multiple entries and track errors | ✅ Pass |

#### previewBatch
| # | Test Case | Status |
|---|-----------|--------|
| 6 | should calculate correct fee estimate | ✅ Pass |
| 7 | should separate valid and invalid entries | ✅ Pass |
| 8 | should add warning for invalid entries | ✅ Pass |
| 9 | should add warning for large batches | ✅ Pass |
| 10 | should handle empty entries | ✅ Pass |

#### parseCSV
| # | Test Case | Status |
|---|-----------|--------|
| 11 | should parse CSV content correctly | ✅ Pass |

#### parseJSON
| # | Test Case | Status |
|---|-----------|--------|
| 12 | should parse JSON content correctly | ✅ Pass |
| 13 | should parse multiple JSON entries | ✅ Pass |
| 14 | should throw error for non-array JSON | ✅ Pass |

---

### 5. Cluster Service Tests (`tests/unit/credentials/cluster.test.ts`)

**Coverage:** Cluster types, validation, URL/email validation

#### Cluster Types
| # | Test Case | Status |
|---|-----------|--------|
| 1 | should define cluster config correctly | ✅ Pass |
| 2 | should allow optional fields to be undefined | ✅ Pass |
| 3 | should define cluster with all fields | ✅ Pass |

#### Cluster ID Generation
| # | Test Case | Status |
|---|-----------|--------|
| 4 | should generate valid cluster ID format | ✅ Pass |

#### Cluster Validation
| # | Test Case | Status |
|---|-----------|--------|
| 5 | should validate required fields | ✅ Pass |
| 6 | should detect missing name | ✅ Pass |
| 7 | should detect long name | ✅ Pass |

#### Cluster URL Validation
| # | Test Case | Status |
|---|-----------|--------|
| 8 | should validate URL format | ✅ Pass |
| 9 | should validate email format | ✅ Pass |

---

### 6. Verification Service Tests (`tests/unit/credentials/verifier.test.ts`)

**Coverage:** Certificate verification logic, result structure, credential validation

#### Certificate Verification Logic
| # | Test Case | Status |
|---|-----------|--------|
| 1 | should consider valid certificate as valid | ✅ Pass |
| 2 | should detect expired certificate | ✅ Pass |
| 3 | should detect melted certificate (cell not found) | ✅ Pass |
| 5 | should validate W3C VC structure | ✅ Pass |
| 6 | should extract issuer information correctly | ✅ Pass |
| 7 | should handle certificate with no expiration | ✅ Pass |

#### Verification Result Structure
| # | Test Case | Status |
|---|-----------|--------|
| 8 | should build valid verification result | ✅ Pass |
| 9 | should include errors in invalid result | ✅ Pass |
| 10 | should include expiration status in result | ✅ Pass |

#### Credential Subject Validation
| # | Test Case | Status |
|---|-----------|--------|
| 11 | should handle optional fields correctly | ✅ Pass |
| 12 | should validate required subject fields | ✅ Pass |

---

### 7. Certificate Service Tests (`tests/unit/credentials/issuer.test.ts`)

**Coverage:** Certificate issuance, retrieval, melting, and credential subject handling

#### issueCertificate
| # | Test Case | Status |
|---|-----------|--------|
| 1 | should issue certificate with valid parameters | ✅ Pass |
| 2 | should issue certificate with expiration date | ✅ Pass |
| 3 | should generate unique certificate IDs | ✅ Pass |
| 4 | should issue certificate with minimal subject data | ✅ Pass |
| 5 | should issue certificate with metadata | ✅ Pass |

#### getCertificate
| # | Test Case | Status |
|---|-----------|--------|
| 6 | should retrieve existing certificate by ID | ✅ Pass |
| 7 | should return null for non-existent certificate | ✅ Pass |
| 8 | should return certificate with correct W3C VC structure | ✅ Pass |
| 9 | should preserve subject data in retrieved certificate | ✅ Pass |

#### getHolderCertificates
| # | Test Case | Status |
|---|-----------|--------|
| 10 | should get all certificates for a holder address | ✅ Pass |
| 11 | should return empty array for holder with no certificates | ✅ Pass |
| 12 | should only return certificates for specified holder | ✅ Pass |
| 13 | should include certificateId and clusterId in results | ✅ Pass |

#### meltCertificate
| # | Test Case | Status |
|---|-----------|--------|
| 14 | should melt certificate and remove from local storage | ✅ Pass |
| 15 | should throw if signer is not a live signer | ✅ Pass |
| 16 | should throw if certificate not found | ✅ Pass |
| 17 | should throw if signer is not the holder | ✅ Pass |

#### CredentialSubject structure
| # | Test Case | Status |
|---|-----------|--------|
| 17 | should preserve explicit subject id field | ✅ Pass |
| 18 | should handle subject without explicit id field | ✅ Pass |

---

### 8. Template Service Tests (`tests/unit/credentials/services.test.ts`)

**Coverage:** Template CRUD operations, template application, and visual configuration

#### createTemplate
| # | Test Case | Status |
|---|-----------|--------|
| 1 | should create template with required fields | ✅ Pass |
| 2 | should create template with description | ✅ Pass |
| 3 | should create template with visual config | ✅ Pass |
| 4 | should generate unique template IDs | ✅ Pass |

#### getTemplate / getTemplates
| # | Test Case | Status |
|---|-----------|--------|
| 5 | should retrieve existing template by ID | ✅ Pass |
| 6 | should return null for non-existent template | ✅ Pass |
| 7 | should get all templates for a cluster | ✅ Pass |
| 8 | should return empty array for cluster with no templates | ✅ Pass |
| 9 | should only return templates for specified cluster | ✅ Pass |

#### updateTemplate
| # | Test Case | Status |
|---|-----------|--------|
| 10 | should update template name | ✅ Pass |
| 11 | should update template description | ✅ Pass |
| 12 | should update template fields | ✅ Pass |
| 13 | should return null for non-existent template update | ✅ Pass |
| 14 | should set updatedAt timestamp on update | ✅ Pass |

#### deleteTemplate
| # | Test Case | Status |
|---|-----------|--------|
| 15 | should delete existing template | ✅ Pass |
| 16 | should return false for non-existent template deletion | ✅ Pass |

#### applyTemplate
| # | Test Case | Status |
|---|-----------|--------|
| 17 | should apply template to data with all fields | ✅ Pass |
| 18 | should apply template default values | ✅ Pass |
| 19 | should handle partial data | ✅ Pass |
| 20 | should handle empty data | ✅ Pass |

#### Visual Config & Fields
| # | Test Case | Status |
|---|-----------|--------|
| 21 | should create complete default visual config | ✅ Pass |
| 22 | should return standard certificate fields | ✅ Pass |
| 23 | should mark required fields correctly | ✅ Pass |
| 24 | should mark optional fields correctly | ✅ Pass |
| 25 | should have options for select fields | ✅ Pass |

#### Integration
| # | Test Case | Status |
|---|-----------|--------|
| 26 | should handle full CRUD lifecycle | ✅ Pass |

---

### 9. Button Component Tests (`tests/unit/ui/Button.test.tsx`)

**Coverage:** Button variants, sizes, loading state, accessibility

| # | Test Case | Status |
|---|-----------|--------|
| 1 | should render button with default props | ✅ Pass |
| 2 | should render primary variant | ✅ Pass |
| 3 | should render secondary variant | ✅ Pass |
| 4 | should render danger variant | ✅ Pass |
| 5 | should render ghost variant | ✅ Pass |
| 6 | should render small size | ✅ Pass |
| 7 | should render medium size | ✅ Pass |
| 8 | should render large size | ✅ Pass |
| 9 | should show loading spinner when loading | ✅ Pass |
| 10 | should be disabled when loading | ✅ Pass |
| 11 | should be disabled when disabled prop is true | ✅ Pass |
| 12 | should have full width when fullWidth is true | ✅ Pass |
| 13 | should handle click events | ✅ Pass |
| 14 | should not call onClick when disabled | ✅ Pass |
| 15 | should apply custom className | ✅ Pass |
| 16 | should render with children | ✅ Pass |
| 17 | should have focus styles | ✅ Pass |

---

### 10. Badge Component Tests (`tests/unit/ui/Badge.test.tsx`)

**Coverage:** Badge variants, styling, display behavior

| # | Test Case | Status |
|---|-----------|--------|
| 1 | should render badge with default props | ✅ Pass |
| 2 | should render success variant | ✅ Pass |
| 3 | should render warning variant | ✅ Pass |
| 4 | should render danger variant | ✅ Pass |
| 5 | should render info variant | ✅ Pass |
| 6 | should render neutral variant | ✅ Pass |
| 7 | should apply custom className | ✅ Pass |
| 8 | should render with complex content | ✅ Pass |
| 9 | should have border styling | ✅ Pass |
| 10 | should have pill shape | ✅ Pass |
| 11 | should have small text size | ✅ Pass |

---

### 11. Card Component Tests (`tests/unit/ui/Card.test.tsx`)

**Coverage:** Card variants, padding options, content rendering

| # | Test Case | Status |
|---|-----------|--------|
| 1 | should render card with default props | ✅ Pass |
| 2 | should render default variant | ✅ Pass |
| 3 | should render highlighted variant | ✅ Pass |
| 4 | should render interactive variant | ✅ Pass |
| 5 | should render with no padding | ✅ Pass |
| 6 | should render with small padding | ✅ Pass |
| 7 | should render with medium padding | ✅ Pass |
| 8 | should render with large padding | ✅ Pass |
| 9 | should have border styling | ✅ Pass |
| 10 | should have rounded corners | ✅ Pass |
| 11 | should render with complex content | ✅ Pass |
| 12 | should apply custom className | ✅ Pass |
| 13 | should apply id attribute | ✅ Pass |
| 14 | should handle click events | ✅ Pass |

---

### 12. Input Component Tests (`tests/unit/ui/Input.test.tsx`)

**Coverage:** Input label, error states, helper text, accessibility

| # | Test Case | Status |
|---|-----------|--------|
| 1 | should render input without label | ✅ Pass |
| 2 | should render input with label | ✅ Pass |
| 3 | should associate label with input | ✅ Pass |
| 4 | should show required asterisk | ✅ Pass |
| 5 | should show error message | ✅ Pass |
| 6 | should have error styling when error is present | ✅ Pass |
| 7 | should show helper text when no error | ✅ Pass |
| 8 | should hide helper text when error is present | ✅ Pass |
| 9 | should handle text input | ✅ Pass |
| 10 | should be disabled when disabled prop is true | ✅ Pass |
| 11 | should show placeholder text | ✅ Pass |
| 12 | should apply custom className | ✅ Pass |
| 13 | should have full width | ✅ Pass |
| 14 | should have focus ring styling | ✅ Pass |
| 15 | should generate id from label | ✅ Pass |
| 16 | should use provided id | ✅ Pass |
| 17 | should support different input types | ✅ Pass |
| 18 | should have dark theme styling | ✅ Pass |

---

## Test Commands

```bash
# Run all tests
npm test

# Run tests once
npm run test:run

# Run with UI
npm run test:ui

# Run with coverage
npm run test:coverage
```

---

## Test Structure

```
tests/
├── setup.ts                                # Global test setup & mocks
├── integration/
│   ├── batch-flow.test.ts                  # Batch issuance flow end-to-end (1 test)
│   ├── certificate-lifecycle.test.ts       # Mint, verify, melt lifecycle (2 tests)
│   └── did-integration.test.ts             # did:ckb resolution & backward compat (11 tests)
└── unit/
    ├── batch/
    │   ├── BatchIssuePage.test.tsx         # Batch issuance page orchestration (8 tests)
    │   ├── BatchPreview.test.tsx           # Capacity preview & style recalculation (8 tests)
    │   └── BatchUpload.test.tsx            # File dropzone & CSV/JSON parsing (5 tests)
    ├── certificate/
    │   ├── CertificateDetail.test.tsx      # Certificate detail & status badges (11 tests)
    │   ├── CertificateForm.test.tsx        # Real-time CKB preview & form validation (4 tests)
    │   └── PaperCertificate.test.tsx       # Printable paper diploma & QR (13 tests)
    ├── certificates/
    │   └── InstitutionSelector.test.tsx    # Provider cluster selector (3 tests)
    ├── ckb/
    │   └── config.test.ts                  # Network config & explorer URLs (12 tests)
    ├── credentials/
    │   ├── batch.test.ts                   # CSV/JSON, validation & exact capacity (28 tests)
    │   ├── cluster.test.ts                 # Cluster validation tests (9 tests)
    │   ├── decoder.test.ts                 # W3C VC decoding tests (19 tests)
    │   ├── encoder.test.ts                 # W3C VC encoding tests (9 tests)
    │   ├── issuer.test.ts                  # Mint, preview, melt & capacity (32 tests)
    │   ├── services.test.ts                # Template service tests (26 tests)
    │   ├── template-types.test.ts          # Template interface typings (2 tests)
    │   └── verifier.test.ts                # Verification logic tests (10 tests)
    ├── did/
    │   └── resolver.test.ts                # DID resolver utilities (5 tests)
    ├── hooks/
    │   └── useIssuerClusters.test.tsx      # Cluster indexing hook (2 tests)
    ├── lib/
    │   └── share.test.ts                   # Social & clipboard share helper (6 tests)
    ├── template/
    │   └── TemplateShowcase.test.tsx       # Template gallery & preview (4 tests)
    ├── ui/                                 # Base UI atomic components (68 tests)
    ├── utils/
    │   └── errors.test.ts                  # CKB RPC error parser (6 tests)
    └── verification/
        └── VerifyResult.test.tsx           # Verification result card (1 test)
```

---

## Design Spec Reference

Tests implemented according to `docs/Design_spec/`:

| Design Spec Section | Test Coverage |
|--------------------|---------------|
| 01_Cluster_Service.md | ✅ Unit Tests - Cluster (`cluster.test.ts`) |
| 02_Encoder_Decoder.md | ✅ Unit Tests - Encoder/Decoder (`encoder.test.ts`, `decoder.test.ts`) |
| 03_Certificate_Service.md | ✅ Unit Tests - Issuer, Mint Preview & Melt (`issuer.test.ts`, 32 tests) |
| 04_Verification_Service.md | ✅ Unit Tests - Verification (`verifier.test.ts`, `VerifyResult.test.tsx`) |
| 05_Template_Service.md | ✅ Unit Tests - Template Service & Types (`services.test.ts`, `template-types.test.ts`) |
| 06_Batch_Issuance.md | ✅ Unit Tests - Batch Validation & Capacity (`batch.test.ts`, `BatchPreview.test.tsx`, `BatchIssuePage.test.tsx`) |
| 07_CKB_Client.md | ✅ Unit Tests - Config & RPC (`config.test.ts`, `errors.test.ts`) |
| 08_UI_Components.md | ✅ Unit Tests - UI Components (Alert, Badge, Button, Card, Input, EmptyState, Spinner, etc.) |
| 09_Vellum_Integration_Design.md | ✅ Integration Tests - DID resolution & compatibility (`did-integration.test.ts`) |

---

## Notes

- All tests use Vitest with jsdom environment
- Tests are isolated and do not depend on external live networks
- Mock data is used for CKB SDK dependencies with accurate Spore DOB Molecule data packing
- Tests follow the arrange-act-assert pattern with descriptive comments
- UI components tested with @testing-library/react
- Exact CKB capacity calculations covered:
  - `previewCertificateMint()` skeleton transaction testing
  - `calculateEntryCapacity()` and `calculateBatchCapacity()` testing
  - Batch preview table dynamic recalculation upon style change
- Melt certificate tests: `issuer.test.ts` covers permanent certificate destruction with 100% CKB capacity reclaim

---

**Report Generated:** 2026-09-17
