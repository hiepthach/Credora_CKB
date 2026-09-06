# Unit Design Documents — Index

## Overview

This folder contains detailed unit designs for each module in the CKB Credential Registry project.

---

## Documents

| # | Module | File | Purpose |
|---|--------|------|---------|
| 1 | Cluster Service | [01_Cluster_Service.md](01_Cluster_Service.md) | Course Provider registration via Spore Clusters |
| 2 | Encoder/Decoder | [02_Encoder_Decoder.md](02_Encoder_Decoder.md) | W3C VC JSON encoding/decoding |
| 3 | Certificate Service | [03_Certificate_Service.md](03_Certificate_Service.md) | Certificate issuance and management |
| 4 | Verification Service | [04_Verification_Service.md](04_Verification_Service.md) | Certificate verification |
| 5 | Template Service | [05_Template_Service.md](05_Template_Service.md) | Certificate templates management |
| 6 | Batch Issuance | [06_Batch_Issuance.md](06_Batch_Issuance.md) | Multi-certificate issuance |
| 7 | CKB Client | [07_CKB_Client.md](07_CKB_Client.md) | Network and SDK configuration |
| 8 | UI Components | [08_UI_Components.md](08_UI_Components.md) | React component designs |

---

## Module Dependency Graph

```mermaid
graph TD
    subgraph Config
        CKB_CLIENT["CKB Client<br/>(07)"]
    end

    subgraph Core
        ENCODER["Encoder/Decoder<br/>(02)"]
        CLUSTER_SVC["Cluster Service<br/>(01)"]
    end

    subgraph Business
        CERT_SVC["Certificate Service<br/>(03)"]
        VERIFY_SVC["Verification Service<br/>(04)"]
        TEMPLATE_SVC["Template Service<br/>(05)"]
        BATCH["Batch Issuance<br/>(06)"]
    end

    subgraph UI
        UI["UI Components<br/>(08)"]
    end

    CKB_CLIENT --> CLUSTER_SVC
    CKB_CLIENT --> CERT_SVC
    CKB_CLIENT --> VERIFY_SVC
    CLUSTER_SVC --> CERT_SVC
    ENCODER --> CERT_SVC
    ENCODER --> BATCH
    CERT_SVC --> VERIFY_SVC
    TEMPLATE_SVC --> CERT_SVC
    TEMPLATE_SVC --> BATCH
    CLUSTER_SVC --> UI
    CERT_SVC --> UI
    VERIFY_SVC --> UI
    TEMPLATE_SVC --> UI
    BATCH --> UI
```

---

## Module Summary

### Config Layer
| Module | File | Key Functions |
|--------|------|---------------|
| CKB Client | 07_CKB_Client.md | `getSporeConfig()`, `createClient()`, network config |

### Core Layer
| Module | File | Key Functions |
|--------|------|---------------|
| Encoder/Decoder | 02_Encoder_Decoder.md | `encodeCertificateDNA()`, `decodeCertificateDNA()`, `isExpired()` |
| Cluster Service | 01_Cluster_Service.md | `createCluster()`, `getCluster()` |

### Business Layer
| Module | File | Key Functions |
|--------|------|---------------|
| Certificate Service | 03_Certificate_Service.md | `issueCertificate()`, `getHolderCertificates()`, `meltCertificate()` |
| Verification Service | 04_Verification_Service.md | `verifyCertificate()` |
| Template Service | 05_Template_Service.md | `createTemplate()`, `applyTemplate()` |
| Batch Issuance | 06_Batch_Issuance.md | `parseBatchFile()`, `issueBatchCertificates()` |

### UI Layer
| Module | File | Key Components |
|--------|------|---------------|
| UI Components | 08_UI_Components.md | `WalletConnect`, `ClusterCard`, `CertificateCard`, `VerifyForm` |

---

## File Structure Mapping

```
src/
├── lib/
│   ├── ckb/
│   │   ├── config.ts      ← 07_CKB_Client.md
│   │   └── client.ts      ← 07_CKB_Client.md
│   └── credentials/
│       ├── encoder.ts     ← 02_Encoder_Decoder.md
│       ├── decoder.ts     ← 02_Encoder_Decoder.md
│       ├── cluster.ts     ← 01_Cluster_Service.md
│       ├── issuer.ts      ← 03_Certificate_Service.md
│       ├── verifier.ts    ← 04_Verification_Service.md
│       ├── templates.ts   ← 05_Template_Service.md
│       └── batch.ts       ← 06_Batch_Issuance.md
└── components/
    ├── ui/               ← 08_UI_Components.md
    ├── wallet/           ← 08_UI_Components.md
    ├── cluster/          ← 08_UI_Components.md
    ├── certificate/      ← 08_UI_Components.md
    ├── template/         ← 08_UI_Components.md
    ├── verification/     ← 08_UI_Components.md
    └── batch/            ← 08_UI_Components.md
```

---

## Quick Reference

### Data Types

```typescript
// Certificate DNA (W3C VC)
interface CertificateDNA {
  "@context": string[];
  id: string;
  type: string[];
  issuer: Issuer;
  issuanceDate: string;
  expirationDate?: string;
  credentialSubject: CertificateSubject;
  credentialStatus?: CredentialStatus;
}

// Verification Result
interface VerificationResult {
  valid: boolean;
  certificateId: string;
  issuer: { id: string; name: string; };
  certificate: { isExpired: boolean; };
}
```

### Key Operations

| Operation | Module | Function |
|----------|--------|----------|
| Create Provider Cluster | Cluster Service | `createCluster(signer, config)` |
| Issue Certificate | Certificate Service | `issueCertificate(signer, params)` |
| Get Holder Certificates | Certificate Service | `getHolderCertificates(client, holder)` |
| Verify Certificate | Verification Service | `verifyCertificate(client, id)` |
| Create Template | Template Service | `createTemplate(clusterId, data)` |
| Batch Issue | Batch Issuance | `issueBatchCertificates(signer, params)` |

---

*Last Updated: 2026-08-11*
