# CKB Credential Registry — Implementation Architecture

> **Updated Scope**: Course completion certificate registry focusing on course providers, students, and verifiers.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Feature Specification](#2-feature-specification)
3. [System Architecture](#3-system-architecture)
4. [Project Structure](#4-project-structure)
5. [Data Structures](#5-data-structures)
6. [Module Design](#6-module-design)
7. [User Flows](#7-user-flows)
8. [Custom On-Chain Scripts (Future)](#8-custom-on-chain-scripts-future)
9. [Testing Strategy](#9-testing-strategy)
10. [Deployment Configuration](#10-deployment-configuration)
11. [Milestones](#11-milestones)

---

## 1. Overview

### 1.1 Design Principles

- **Self-Sovereign**: Users own their certificates as on-chain assets
- **Composable**: Built on existing standards (W3C VC, Spore, CCC SDK)
- **Course-Centric**: Focused on course completion certificates
- **CKB-Native**: Leverage CKB's unique advantages (zero fees, on-chain storage)

### 1.2 Core Value Propositions

| Feature | Status | Implementation |
|---------|--------|----------------|
| **Fully on-chain** | ✅ | Spore DOB DNA (certificate JSON) |
| **Holder-owned** | ✅ | Spore DOB lock = recipient wallet |
| **CKB-backed** | ✅ | Spore capacity + melt-to-reclaim |
| **Zero transfer fees** | ✅ | CKB UTXO model |
| **Cluster organization** | ✅ | Spore Cluster = Course Provider |

---

## 2. Feature Specification

### 2.1 Core Features (MVP)

| Feature | Priority | Description |
|---------|----------|-------------|
| **F1: Wallet Connection** | P0 | Connect via JoyID, MetaMask, Neuron, Portal |
| **F2: Provider Registration** | P0 | Course provider creates Cluster |
| **F3: Certificate Issuance** | P0 | Issue course completion certificate |
| **F4: Certificate Display** | P0 | Student views certificates in dashboard |
| **F5: Certificate Sharing** | P0 | Copy ID, open in Explorer |
| **F6: Certificate Verification** | P0 | Verify certificate by ID |

### 2.2 Extended Features

| Feature | Priority | Description |
|---------|----------|-------------|
| **F7: Certificate Templates** | P1 | Pre-defined certificate formats |
| **F8: Batch Issuance** | P1 | Issue multiple certificates at once |
| **F9: Expiration** | P1 | Time-based certificate validity |
| **F10: Melt Certificate** | P1 | Permanently destroy certificate and reclaim CKB |

### 2.3 Future Features

| Feature | Priority | Description |
|---------|----------|-------------|
| **F11: Renewal** | P2 | Update expiration date |
| **F12: Embedding** | P2 | Embed on external platforms |
| **F13: Trust Layer** | P2 | Verified issuers registry |
| **F14: Analytics** | P2 | Provider issuance statistics |
| **F15: Comments** | P3 | Student comments/reviews |

### 2.4 User Roles

| Role | Capabilities |
|------|-------------|
| **Course Provider** | Register, Issue Certificates |
| **Student** | View Own Certificates, Share, Transfer (if allowed) |
| **Verifier** | Verify Certificate Validity |

---

## 3. System Architecture

### 3.1 Architecture Overview

```mermaid
graph TB
    subgraph Frontend["Frontend Layer (React/Next.js)"]
        UI["UI Components"]
        PAGES["Pages<br/>(Provider, Student, Verifier)"]
    end

    subgraph SDK["SDK Layer"]
        CCC["@ckb-ccc/connector-react / @ckb-ccc/core"]
        SPORE["@ckb-ccc/spore"]
    end

    subgraph Blockchain["CKB Blockchain (L1)"]
        CLUSTERS["Cluster Cells<br/>(Course Providers)"]
        CERTS["Certificate DOBs<br/>(Students)"]
    end

    UI --> PAGES
    PAGES --> CCC
    CCC --> SPORE
    SPORE --> CLUSTERS
    SPORE --> CERTS
```

### 3.2 Component Interaction

```mermaid
graph LR
    subgraph Frontend
        PROVIDER["Provider UI"]
        STUDENT["Student UI"]
        VERIFIER["Verifier UI"]
    end

    subgraph Services
        PROVIDER_SVC["Provider Service"]
        CERT_SVC["Certificate Service"]
        VERIFY_SVC["Verify Service"]
    end

    subgraph Storage
        CKB["CKB Cells"]
    end

    PROVIDER --> PROVIDER_SVC
    PROVIDER_SVC --> CKB
    STUDENT --> CERT_SVC
    CERT_SVC --> CKB
    VERIFIER --> VERIFY_SVC
    VERIFY_SVC --> CKB
```

---

## 4. Project Structure

### 4.1 Directory Layout

```
dob-credential-protocol/
├── src/
│   ├── app/
│   │   ├── layout.tsx               # Root layout with CCC Provider
│   │   ├── page.tsx                 # Landing page
│   │   ├── provider/
│   │   │   └── page.tsx             # Provider dashboard
│   │   ├── student/
│   │   │   └── page.tsx             # Student dashboard
│   │   └── verifier/
│   │       └── page.tsx             # Verification page
│   │
│   ├── components/
│   │   ├── ui/                      # Generic UI components
│   │   ├── wallet/
│   │   │   └── WalletConnect.tsx
│   │   ├── certificate/
│   │   │   ├── CertificateCard.tsx
│   │   │   ├── CertificateDetail.tsx
│   │   │   ├── CertificateForm.tsx
│   │   │   └── BatchIssuance.tsx
│   │   ├── cluster/
│   │   │   ├── ClusterCard.tsx
│   │   │   └── ClusterForm.tsx
│   │   ├── template/
│   │   │   ├── TemplateCard.tsx
│   │   │   └── TemplateForm.tsx
│   │   └── verification/
│   │       └── VerifyResult.tsx
│   │
│   ├── lib/
│   │   ├── ckb/
│   │   │   ├── config.ts            # Network & script configs
│   │   │   └── client.ts            # Client setup
│   │   ├── certificates/
│   │   │   ├── types.ts             # TypeScript interfaces
│   │   │   ├── encoder.ts            # W3C VC JSON encoding
│   │   │   ├── decoder.ts            # W3C VC JSON decoding
│   │   │   ├── issuer.ts             # Certificate issuance logic
│   │   │   ├── verifier.ts           # Certificate verification logic
│   │   │   └── templates.ts          # Template management
│   │   └── utils/
│   │       └── formatters.ts
│   │
│   └── styles/
│       └── globals.css
│
├── contracts/                        # Rust on-chain scripts (future)
│   ├── Cargo.toml
│   └── src/
│       ├── main.rs
│       └── credential.rs
│
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.js
└── README.md
```

---

## 5. Data Structures

### 5.1 Certificate DNA (W3C VC)

```mermaid
classDiagram
    class VerifiableCredential {
        +@context: string[]
        +id: string
        +type: string[]
        +issuer: Issuer
        +issuanceDate: string
        +expirationDate?: string
        +credentialSubject: CertificateSubject
        +credentialStatus?: CredentialStatus
    }

    class Issuer {
        +id: string
        +name: string
        +description?: string
    }

    class CertificateSubject {
        +id: string
        +courseName: string
        +courseProvider: string
        +completionDate: string
        +grade?: string
        +skills?: string[]
    }

    class CredentialStatus {
        +id: string
        +type: string
    }

    VerifiableCredential --> Issuer
    VerifiableCredential --> CertificateSubject
    VerifiableCredential --> CredentialStatus
```

### 5.2 TypeScript Interfaces

```typescript
// Certificate DNA (W3C VC Compatible)
interface VerifiableCredential {
  "@context": string[];
  id: string;
  type: string[];
  issuer: Issuer;
  issuanceDate: string;
  expirationDate?: string;
  credentialSubject: CertificateSubject;
  credentialStatus?: CredentialStatus;
  metadata?: CertificateMetadata;
}

interface Issuer {
  id: string;
  name: string;
  description?: string;
}

interface CertificateSubject {
  id: string;
  courseName: string;
  courseProvider: string;
  completionDate: string;
  grade?: string;
  skills?: string[];
}

interface CredentialStatus {
  id: string;
  type: string;
}

interface CertificateMetadata {
  clusterId: string;
  templateId?: string;
  version: string;
}

// Cluster Configuration
interface ClusterConfig {
  name: string;
  description: string;
  providerInfo: ProviderInfo;
  certificatePolicy: CertificatePolicy;
  metadata?: Record<string, any>;
}

interface ProviderInfo {
  url?: string;
  logo?: string;
  contact?: string;
}

interface CertificatePolicy {
  transferable: boolean;
  expirationDefault?: string;
  allowRenewal: boolean;
}

// Certificate Template
interface CertificateTemplate {
  id: string;
  name: string;
  description: string;
  clusterId: string;
  fields: TemplateField[];
  requiredFields: string[];
  defaultValues?: Record<string, any>;
}

interface TemplateField {
  name: string;
  type: 'text' | 'date' | 'select' | 'number';
  label: string;
  required: boolean;
  options?: string[];
}

// Verification
interface VerificationResult {
  valid: boolean;
  certificateId: string;
  issuer: {
    id: string;
    name: string;
    clusterVerified: boolean;
  };
  holder: {
    address: string;
    ownershipVerified: boolean;
  };
  certificate: {
    type: string[];
    issuanceDate: string;
    expirationDate?: string;
    isExpired: boolean;
  };
  timestamp: string;
}
```

---

## 6. Module Design

### 6.1 Module Overview

```mermaid
graph TB
    subgraph Pages
        PROVIDER["Provider Page"]
        STUDENT["Student Page"]
        VERIFIER["Verifier Page"]
    end

    subgraph Services
        CLUSTER_SVC["Cluster Service"]
        CERT_SVC["Certificate Service"]
        VERIFY_SVC["Verify Service"]
        TEMPLATE_SVC["Template Service"]
    end

    subgraph Libraries
        ENCODER["Encoder"]
        DECODER["Decoder"]
    end

    subgraph SDK
        CCC["CCC SDK"]
        SPORE["Spore SDK"]
    end

    PROVIDER --> CLUSTER_SVC
    PROVIDER --> CERT_SVC
    PROVIDER --> TEMPLATE_SVC
    STUDENT --> CERT_SVC
    VERIFIER --> VERIFY_SVC

    CLUSTER_SVC --> SPORE
    CERT_SVC --> ENCODER
    CERT_SVC --> SPORE
    VERIFY_SVC --> DECODER
    VERIFY_SVC --> SPORE
    TEMPLATE_SVC --> CERT_SVC

    SPORE --> CCC
```

### 6.2 Service Responsibilities

| Module | Operations |
|--------|-----------|
| **Cluster Service** | `createCluster`, `getClusters` |
| **Certificate Service** | `issueCertificate`, `getHolderCertificates`, `meltCertificate` |
| **Verify Service** | `verifyCertificate`, `isExpired` |
| **Template Service** | `createTemplate`, `getTemplates`, `applyTemplate` |

### 6.3 SDK Usage

```mermaid
sequenceDiagram
    participant UI
    participant SVC
    participant SPORE as Spore SDK
    participant CCC
    participant CKB

    Note over UI,CKB: Certificate Issuance
    UI->>SVC: issueCertificate()
    SVC->>SPORE: createSpore()
    SPORE->>CCC: Build tx
    CCC->>CKB: signAndSendTransaction()
    CKB-->>CCC: txHash
    CCC-->>SVC: txHash
    SVC-->>UI: certificateId

    Note over UI,CKB: Certificate Verification
    UI->>SVC: verifyCertificate(id)
    SVC->>CCC: findCellsByType()
    CCC->>CKB: Query cell
    CKB-->>CCC: cell data
    CCC-->>SVC: cell
    SVC->>SVC: Decode DNA
    SVC-->>UI: VerificationResult
```

---

## 7. User Flows

### 7.1 Provider Registration Flow

```mermaid
sequenceDiagram
    participant Provider
    participant Frontend
    participant SPORE as Spore SDK
    participant CKB

    Provider->>Frontend: Connect wallet
    Provider->>Frontend: Fill cluster info
    Frontend->>SPORE: createCluster()
    SPORE->>CKB: Transaction
    CKB-->>SPORE: clusterId
    SPORE-->>Frontend: clusterId
    Frontend-->>Provider: Registration complete
```

### 7.2 Certificate Issuance Flow

```mermaid
sequenceDiagram
    participant Provider
    participant Frontend
    participant ENCODER
    participant SPORE as Spore SDK
    participant CKB

    Provider->>Frontend: Select cluster
    Provider->>Frontend: Enter student address
    Provider->>Frontend: Fill certificate data
    Frontend->>ENCODER: Encode to W3C VC JSON
    ENCODER-->>Frontend: Certificate DNA
    Frontend->>SPORE: createSpore()
    SPORE->>CKB: Transaction
    CKB-->>SPORE: txHash
    SPORE-->>Frontend: certificateId
    Frontend-->>Provider: Certificate issued
```

### 7.3 Verification Flow

```mermaid
sequenceDiagram
    participant Verifier
    participant Frontend
    participant CCC
    participant DECODER
    participant CKB

    Verifier->>Frontend: Enter certificate ID
    Frontend->>CCC: findCellsByType()
    CCC->>CKB: Query cell
    CKB-->>CCC: cell
    CCC-->>Frontend: cell
    Frontend->>DECODER: Decode DNA
    DECODER-->>Frontend: Certificate
    Frontend->>Frontend: Check expiration
    Frontend-->>Verifier: Verification result
```

### 7.4 Batch Issuance Flow

```mermaid
flowchart TD
    START["Provider uploads CSV/JSON"] --> PARSE["Parse recipient list"]
    PARSE --> VALIDATE["Validate each entry"]
    VALIDATE --> ERRORS{"Errors?"}
    ERRORS -->|Yes| FIX["Fix errors"]
    FIX --> PARSE
    ERRORS -->|No| PREVIEW["Preview list"]
    PREVIEW --> CONFIRM["Confirm batch"]
    CONFIRM --> ENCODE["Encode all certificates"]
    ENCODE --> TX["Create batch transaction"]
    TX --> SEND["Send to CKB"]
    SEND --> RESULTS["Show results"]
```

---

## 8. Custom On-Chain Scripts (Future)

### 8.1 Soulbound Certificate Script

For non-transferable certificates, a custom Type Script may be needed.

```mermaid
graph LR
    subgraph Transaction
        INPUT["Input Cell"]
        OUTPUT["Output Cell"]
    end

    subgraph Script
        CHECK["Check owner == input owner?"]
        PASS["Allow"]
        REJECT["Reject"]
    end

    INPUT --> CHECK
    CHECK -->|Same owner| PASS
    CHECK -->|Different owner| REJECT
    PASS --> OUTPUT
```

---

## 9. Testing Strategy

### 9.1 Test Layers

```mermaid
graph BT
    subgraph Tests
        E2E["E2E Tests"]
        INT["Integration Tests"]
        UNIT["Unit Tests"]
    end

    subgraph Targets
        UI["UI Components"]
        SERVICES["Services"]
        CONTRACTS["On-Chain Scripts"]
    end

    UNIT --> SERVICES
    INT --> UI
    E2E --> CONTRACTS
```

### 9.2 Test Matrix

| Test | Target | Tools |
|------|--------|-------|
| Unit Tests | Encoder/Decoder | Vitest |
| Unit Tests | Service functions | Vitest |
| Integration | Transaction building | CCC + Mock |
| E2E | Full flows | Playwright |

---

## 10. Deployment Configuration

### 10.1 Network Configuration

| Environment | Network | CKB Node | Indexer |
|-------------|---------|----------|---------|
| Development | OffCKB Devnet | localhost:28114 | localhost:28114 |
| Testnet | CKB Testnet | testnet.ckb.dev | testnet.ckb.dev |
| Mainnet | CKB Mainnet | mainnet.ckb.com | mainnet.ckb.com |

---

## 11. Milestones

### 11.1 Timeline

```mermaid
gantt
    title CKB Credential Registry - Timeline
    dateFormat  YYYY-MM-DD

    section Week 9
    Project Setup & Provider Registration    :2024-01-01, 10d

    section Week 10
    Certificate Issuance & View               :2024-01-08, 10d

    section Week 11
    Verification & Extended Features          :2024-01-15, 10d

    section Week 12
    Polish & Documentation                  :2024-01-22, 10d
```

### 11.2 Week-by-Week Milestones

| Week | Milestone | Deliverables |
|------|-----------|--------------|
| **Week 9** | Project Setup & Provider Registration | Scaffold, wallet connection, Cluster creation |
| **Week 10** | Certificate Issuance & View | Issuance, W3C VC encoding, holder dashboard |
| **Week 11** | Verification & Extended Features | Verify, templates, batch, melt certificate |
| **Week 12** | Polish & Documentation | Error handling, testing, README, demo |

---

## Appendix: Feature Coverage

### Original Core Value Propositions

| Feature | Status | Implementation |
|---------|--------|----------------|
| Fully on-chain | ✅ | Spore DOB DNA |
| Holder-owned | ✅ | Spore lock script |
| CKB-backed | ✅ | Spore capacity + melt |
| Zero transfer fees | ✅ | CKB UTXO model |
| Cluster organization | ✅ | Spore Cluster |

### New Scope Features

| Feature | Status | Week |
|---------|--------|------|
| Course Provider Registration | ✅ | Week 9 |
| Certificate Issuance | ✅ | Week 10 |
| Student View | ✅ | Week 10 |
| Student Share | ✅ | Week 10 |
| Verifier Check | ✅ | Week 11 |
| Certificate Templates | ✅ | Week 11 |
| Batch Issuance | ✅ | Week 11 |
| Expiration | ✅ | Week 11 |
| Revocation | ✅ | Week 11 |

---

## References

| Resource | Link |
|----------|-----|
| W3C VC Data Model | https://www.w3.org/TR/vc-data-model/ |
| Spore Protocol | https://docs.spore.pro/ |
| DOB/0 Protocol | https://docs.spore.pro/dob/dob0-protocol |
| CCC SDK | https://docs.ckbccc.com |
| CCC Spore SDK | https://github.com/ckb-ecofund/ccc |

