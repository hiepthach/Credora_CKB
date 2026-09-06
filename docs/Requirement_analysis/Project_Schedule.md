# CKB Credential Registry — 4-Week Project Schedule

> **Project Focus**: Course completion certificate registry for course providers, students, and verifiers.

## Overview

| Item | Details |
|------|---------|
| **Duration** | Week 9 – Week 12 (4 weeks) |
| **Goal** | Build a working MVP of course credential registry on CKB |

---

## Weekly Summary

| Week | Focus | Core Deliverables |
|------|-------|-------------------|
| **Week 9** | Project Setup & Provider Registration | Scaffold, wallet connection, Cluster creation |
| **Week 10** | Certificate Issuance & View | Single issuance, W3C VC encoding, holder dashboard |
| **Week 11** | Verification & Extended Features | Verify, templates, batch issuance, melt certificate |
| **Week 12** | Polish & Documentation | Error handling, testing, README, demo |

---

## Week 9: Project Setup & Provider Registration

**Estimated Time**: 10 hours

### Goals
- Set up Next.js project with TypeScript
- Configure CCC SDK and Spore SDK for testnet
- Implement wallet connection
- Create Course Provider registration (Cluster creation)

### Tasks

#### 1. Project Initialization (3h)

- [ ] Create Next.js project with TypeScript
  ```bash
  npx create-next-app@latest dob-credential-protocol --typescript --tailwind --eslint
  ```
  - Reference: [Next.js Setup](https://nextjs.org/docs)

- [ ] Install dependencies
  ```bash
  npm install @ckb-ccc/connector-react @ckb-ccc/core @ckb-ccc/spore
  ```
  - Reference: [CCC SDK](https://docs.ckbccc.com), [CCC Spore](https://github.com/ckb-ecofund/ccc)

- [ ] Configure Tailwind CSS and project folder structure

#### 2. CKB Client & SDK Configuration (2h)

- [ ] Configure CKB client for testnet
  - Network: `https://testnet.ckb.dev`
  - Reference: [CCC Client Setup](https://docs.ckbccc.com)

- [ ] Configure Spore SDK
  - Use `predefinedSporeConfigs.Testnet`
  - Reference: [Spore SDK Config](https://docs.spore.pro/)

#### 3. Wallet Connection (2h)

- [ ] Set up `CccProvider` in root layout
  ```tsx
  import { CccProvider } from "@ckb-ccc/connector-react";
  ```
  - Reference: [CCC React Connector](https://docs.ckbccc.com)

- [ ] Implement `WalletConnect` component
  - Support: JoyID, MetaMask, Neuron, Portal Wallet
  - Display: connected wallet name, address

- [ ] Test wallet connection with multiple wallets

#### 4. Provider Registration (Cluster Creation) (3h)

- [ ] Define TypeScript interfaces
  - `ClusterConfig`
  - `CredentialPolicy`
  - `ProviderInfo`

- [ ] Implement `createCluster` service
  - Use Spore SDK's `createCluster()`
  - Reference: [Spore Cluster](https://docs.spore.pro/)

- [ ] Create `ClusterForm` component
  - Provider name, description, policy settings

- [ ] Build Provider dashboard page
  - List created clusters
  - Create new cluster

### Tech References
| Tech | Link | Purpose |
|------|------|---------|
| Next.js | https://nextjs.org/docs | React framework |
| TypeScript | https://www.typescriptlang.org/docs/ | Type safety |
| Tailwind CSS | https://tailwindcss.com/docs | Styling |
| CCC SDK | https://docs.ckbccc.com | CKB SDK |
| Spore SDK | https://docs.spore.pro/ | DOB protocol |
| JoyID | https://docs.joyid.dev/ | Wallet integration |
| Omnilock | https://github.com/nervosnetwork/rfcs/blob/master/rfcs/0042-omnilock/0042-omnilock.md | Multi-chain wallet |

### Definition of Done
- [ ] Project runs on localhost
- [ ] Can connect wallet (JoyID or MetaMask)
- [ ] Can create a Cluster on testnet
- [ ] Can view list of created Clusters

---

## Week 10: Certificate Issuance & View

**Estimated Time**: 10 hours

### Goals
- Implement W3C VC compliant certificate encoding/decoding
- Build single certificate issuance
- Create holder dashboard to view certificates

### Tasks

#### 1. Certificate Data Layer (3h)

- [ ] Define TypeScript interfaces
  - `VerifiableCredential`
  - `CertificateSubject` (course-specific fields)
  - `CredentialStatus`
  - Reference: [W3C VC Data Model](https://www.w3.org/TR/vc-data-model/)

- [ ] Implement `encodeCertificateDNA()`
  - Encode to W3C VC JSON
  - Include `@context`, `id`, `issuanceDate`
  - Reference: [JSON-LD](https://json-ld.org/)

- [ ] Implement `decodeCertificateDNA()`
  - Decode JSON bytes to credential object
  - Add validation

#### 2. Certificate Issuance (4h)

- [ ] Implement `issueCertificate()`
  - Single certificate issuance
  - Fields: course name, completion date, grade, skills
  - Reference: [Spore createSpore](https://docs.spore.pro/)

- [ ] Create certificate issuance form
  - Select provider's cluster
  - Enter recipient wallet address
  - Fill certificate fields
  - Add validation

- [ ] Handle transaction completion
  - Show transaction hash
  - Display certificate ID

#### 3. Holder Dashboard (3h)

- [ ] Implement `getHolderCertificates()`
  - Query Spore cells by holder address
  - Filter for W3C VC credentials
  - Reference: [Cell Query](https://docs.ckbccc.com/api/ccc)

- [ ] Create `CertificateCard` component
  - Display: course name, provider, date, status

- [ ] Build holder dashboard page
  - List all certificates in wallet
  - Show certificate count

### Tech References
| Tech | Link | Purpose |
|------|------|---------|
| W3C VC Data Model | https://www.w3.org/TR/vc-data-model/ | Credential standard |
| JSON-LD | https://json-ld.org/ | JSON for linked data |
| Spore createSpore | https://docs.spore.pro/ | DOB creation |
| Cell Query | https://docs.ckbccc.com/api/ccc | Query cells |

### Definition of Done
- [ ] Can issue a course completion certificate
- [ ] Holder can view all certificates in dashboard
- [ ] Full issuance flow works end-to-end
- [ ] Certificate shows on holder dashboard

---

## Week 11: Verification & Extended Features

**Estimated Time**: 10 hours

### Goals
- Build certificate verification functionality
- Add certificate templates
- Implement batch issuance
- Add melt certificate capability

### Tasks

#### 1. Verification (3h)

- [ ] Implement `verifyCertificate()`
  - Query certificate cell by ID
  - Decode and validate credential DNA
  - Check expiration status

- [ ] Implement `isExpired()`

- [ ] Define `VerificationResult` type

- [ ] Build verifier page
  - Input: certificate ID
  - Output: verification result with details

- [ ] Create `CertificateDetail` component
  - Full certificate view
  - Show all credential fields

#### 2. Certificate Templates (2h)

- [ ] Define `CertificateTemplate` interface
  - Template name
  - Field definitions
  - Required fields
  - Default values

- [ ] Create template management
  - List templates
  - Create new template
  - Edit template

- [ ] Use template in issuance form
  - Select template
  - Auto-fill fields

#### 3. Batch Issuance (3h)

- [ ] Design batch issuance input format
  - CSV upload
  - JSON list

- [ ] Implement batch issuance service
  - Parse input
  - Create multiple Spore DOBs
  - Send transaction

- [ ] Create batch issuance UI
  - Upload CSV/JSON
  - Preview list
  - Confirm and issue

#### 4. Melt Certificate (2h)

- [ ] Implement `meltCertificate()`
  - Destroy Spore DOB cell on CKB
  - Reclaim CKB capacity to holder wallet

- [ ] Add melt certificate UI
  - Holder selects certificate to melt
  - Confirm melt

- [ ] Add "Melt" action in certificate detail

### Tech References
| Tech | Link | Purpose |
|------|------|---------|
| CKB Explorer | https://explorer.nervos.org/ | Transaction lookup |
| Cell findCellsByType | https://docs.ckbccc.com/api/ccc | Cell queries |
| Clipboard API | https://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API | Copy to clipboard |

### Definition of Done
- [ ] Can verify certificate by ID
- [ ] Verification shows expiration status
- [ ] Can view full certificate details
- [ ] Templates work
- [ ] Batch issuance works
- [ ] Melt certificate works

---

## Week 12: Polish & Documentation

**Estimated Time**: 10 hours

### Goals
- Improve error handling and UX
- Write tests for core functions
- Document the project
- Prepare demo

### Tasks

#### 1. Error Handling & UX (3h)

- [x] Review all error cases
  - Network errors
  - Invalid inputs
  - Transaction failures

- [x] Add loading states
  - Spinners during transactions
  - Disabled buttons during loading

- [x] Add empty states
  - "No certificates yet" message
  - "No clusters created" message

- [x] Add share functionality
  - Copy certificate ID
  - Open in CKB Explorer

#### 2. Testing (3h)

- [x] Write unit tests for `encoder`
  ```typescript
  // Test encodeCertificateDNA
  // Test validateCertificateDNA
  ```

- [x] Write unit tests for `decoder`
  ```typescript
  // Test isExpired
  // Test formatCertificateDisplay
  ```

- [x] Integration test: full certificate lifecycle
  - Create cluster → Issue certificate → Verify → Display

#### 3. Documentation (2h)

- [x] Write comprehensive README
  - Project description
  - Setup instructions
  - Usage guide
  - Architecture overview
  - Screenshots

- [x] Document API (if applicable)

#### 4. Demo Preparation (2h)

- [x] Prepare demo script
  - Step-by-step walkthrough
  - Test data ready

- [x] Final polish
  - Responsive design check
  - Browser compatibility check

### Tech References
| Tech | Link | Purpose |
|------|------|---------|
| Vitest | https://vitest.dev/guide/ | Unit testing |
| Playwright | https://playwright.dev/ | E2E testing |

### Definition of Done
- [x] All error cases handled gracefully
- [x] Loading and empty states implemented
- [x] Unit tests for encoder/decoder pass
- [x] README is complete with setup instructions
- [x] Demo script prepared
- [x] Can run full demo end-to-end

---

## Feature Scope Summary

### MVP (Week 9-10) ✅
| Feature | Status |
|---------|--------|
| Course Provider Registration | Week 9 |
| Certificate Issuance | Week 10 |
| Student View Certificates | Week 10 |
| Student Share (Copy ID) | Week 10 |
| Verifier Check | Week 11 |

### Extended (Week 11) ✅
| Feature | Status |
|---------|--------|
| Certificate Templates | Week 11 |
| Batch Issuance | Week 11 |
| Expiration Check | Week 11 |
| Revocation | Week 11 |

### Polish & Quality (Week 12) ✅
| Feature | Status |
|---------|--------|
| Error Handling & RPC Formatting | Week 12 |
| Route & Component Loading States | Week 12 |
| Actionable Empty States | Week 12 |
| Unit & Integration Testing (289 tests) | Week 12 |
| Production README & Demo Script | Week 12 |

### Future (Post-Capstone)
| Feature | Notes |
|---------|-------|
| Renewal | Update expiration date |
| Embedding | Embed on external platforms |
| Trust Layer | Verified issuers registry |
| Analytics Dashboard | Provider statistics |
| Comments/Reviews | Social features |

---

## Core Value Propositions

| Feature | Status | Implementation |
|---------|--------|----------------|
| Fully on-chain | ✅ | Spore DOB DNA |
| Holder-owned | ✅ | Spore lock script |
| CKB-backed | ✅ | Spore capacity + melt |
| Zero transfer fees | ✅ | CKB UTXO model |
| Cluster organization | ✅ | Spore Cluster |

---

## Master Task Checklist

### Week 9
- [ ] Create Next.js project with TypeScript
- [ ] Install CCC SDK and Spore SDK
- [ ] Configure testnet connection
- [ ] Implement wallet connection (JoyID, MetaMask)
- [ ] Define Cluster/Credential interfaces
- [ ] Implement createCluster service
- [ ] Build cluster creation UI
- [ ] Build provider dashboard

### Week 10
- [ ] Define certificate interfaces (W3C VC)
- [ ] Implement encodeCertificateDNA
- [ ] Implement decodeCertificateDNA
- [ ] Implement issueCertificate
- [ ] Build certificate issuance form
- [ ] Implement getHolderCertificates
- [ ] Build holder dashboard

### Week 11
- [ ] Implement verifyCertificate
- [ ] Implement isExpired
- [ ] Build verifier page
- [ ] Build CertificateDetail component
- [ ] Define CertificateTemplate interface
- [ ] Implement template management
- [ ] Implement batch issuance
- [ ] Implement meltCertificate

### Week 12
- [x] Add error handling
- [x] Add loading states
- [x] Add empty states
- [x] Add share functionality
- [x] Write encoder tests
- [x] Write decoder tests
- [x] Integration test
- [x] Write README
- [x] Prepare demo
- [x] Final polish

---

## Time Tracking

| Week | Planned | Actual | Notes |
|------|---------|--------|-------|
| Week 9 | 10h | 10h | ✅ Scaffold, wallet, cluster management |
| Week 10 | 10h | 10h | ✅ Single issuance, W3C VC DNA encoding, holder dashboard |
| Week 11 | 10h | 10h | ✅ Verification, templates, batch issuance, melt certificate |
| Week 12 | 10h | 10h | ✅ Error handling, loading/empty states, unit & integration tests, docs, demo |
| **Total** | **40h** | **40h** | ✅ Project complete |

---

## Related Documents

| Document | Path |
|----------|------|
| Project Analysis | `Requirement_analysis/Project_Analysis.md` |
| Implementation Architecture | `Requirement_analysis/Implementation_Architecture.md` |
