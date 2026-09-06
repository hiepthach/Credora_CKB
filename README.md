# Credora (CKB Credential Registry)

A verifiable credentials system built on Nervos CKB using the Spore Protocol. Issue, manage, and verify course completion certificates as on-chain credentials.

## Tech Stack

- **Blockchain**: Nervos CKB
- **Credential Standard**: W3C Verifiable Credentials
- **Storage**: Spore Protocol (DOB/Cluster cells)
- **SDK**: CCC SDK (@ckb-ccc/core, @ckb-ccc/connector-react, @ckb-ccc/did-ckb)
- **Identity / DID**: @ckb-ccc/did-ckb (`did:ckb` resolver & portable identity)
- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **State**: React Query

## Prerequisites

1. **Node.js** 18+ installed

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

### 3. Select Network

Click the network selector in the top-right corner to switch between:
- **Testnet (Aggron)** - For development and testing
- **Mainnet** - For production use (real transactions)

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── clusters/          # Cluster management page
│   ├── certificates/      # Certificate pages
│   │   ├── page.tsx      # My certificates list
│   │   └── issue/        # Issue certificate page
│   └── verify/           # Certificate verification
├── components/
│   ├── ui/               # Base UI components
│   ├── wallet/           # Wallet connection
│   ├── cluster/          # Cluster components
│   ├── certificate/      # Certificate components
│   ├── template/         # Template components
│   ├── batch/            # Batch issuance
│   └── verification/     # Verification components
├── lib/
│   ├── ckb/              # CKB config & client
│   ├── credentials/       # Core credential logic
│   └── did/              # DID resolution & formatting utilities
├── types/                # TypeScript types
├── hooks/                # Custom React hooks
└── utils/                # Utility functions
```

## Features

### Core Features
- [x] Cluster Management (Provider Registration)
- [x] Certificate Issuance (Single)
- [x] Certificate Viewing
- [x] Certificate Verification
- [x] Share Functionality (Copy ID, Native Share, Explorer Link)

### Extended Features (Week 11)
- [x] Certificate Templates
  - Visual template configuration (classic, modern, compact, badge, detailed layouts)
  - Customizable colors, typography, and branding
  - Pre-defined certificate fields
- [x] Batch Issuance
  - CSV/JSON file upload
  - Batch validation and preview
  - Progress tracking during issuance
- [x] Expiration Tracking
  - Expiration date on certificates
  - Visual "Expired" status badges
  - Verification checks expiration
- [x] Melt Certificate
  - Holder can permanently destroy certificates
  - Reclaims locked CKB capacity
  - Melted certificates are no longer verifiable on-chain

### DID (did:ckb) Integration (Week 13)
- [x] DID Recipient Support
  - Issue certificates to did:ckb: identifiers
  - Automatic DID resolution to on-chain lock script
  - Visual DID badge on certificates
  - Link to Vellum profile for DID verification
- [x] Portable Identity
  - Certificates survive wallet rotations
  - Backward compatible with address-only certificates
  - Batch issuance supports mixed DID/address recipients

### Quality & Polish (Week 12)
- [x] Error Handling (Error boundary, Alert component, CKB RPC error formatter)
- [x] Loading States (Spinner component, route loading fallbacks)
- [x] Empty States (EmptyState component across all views)
- [x] Unit Tests (280+ tests passing)
- [x] Integration Tests (Lifecycle, batch issuance flow, DID resolution)
- [] Demo/Screencast

## DID (did:ckb) Support

CertifyCKB supports issuing certificates to [did:ckb](https://vellum-lyart.vercel.app) identifiers, enabling portable identity for certificate recipients.

**Benefits:**
- Recipients can change wallets without losing certificates
- Certificates are linked to the recipient's DID, not a specific wallet address
- Visual DID badge shows verification status

**Usage:**
1. When issuing a certificate, enter the recipient's DID instead of their wallet address
2. The system automatically resolves the DID to the current wallet address
3. View certificates with DID recipients - they show a DID badge linking to Vellum

**For Recipients:**
If you have a DID registered on [Vellum](https://vellum-lyart.vercel.app), any certificates issued to your DID will automatically appear in your certificate list, even if you change wallets.

## Wallet Support

| Wallet | Status | Notes |
|--------|--------|-------|
| JoyID | ✅ | Recommended |
| MetaMask | ✅ | Via @ckb-ccc/core |
| WalletConnect | ✅ | Requires project ID |

## Networks

Switch networks using the network selector in the app UI:

| Network | Node URL | Explorer |
|---------|----------|----------|
| testnet | testnet.ckb.dev | explorer.nervos.org/aggron2 |
| mainnet | mainnet.ckb.com | explorer.nervos.org |

## Available Scripts

```bash
npm run dev          # Start dev server (with Turbopack)
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run typecheck    # TypeScript check
npm run test         # Run tests (Vitest)
npm run test:run     # Run tests once
npm run test:ui      # Run tests with UI
npm run test:coverage # Run tests with coverage
```

## Testing

Run unit & integration tests (289 tests passing across 34 test files):

```bash
npm test
# or run once:
npm run test:run
```

Test coverage includes:
- UI Components (Alert, Badge, Button, Card, EmptyState, Input, Spinner)
- Credentials (Encoder, Decoder, Issuer, Verifier, Template Types)
- Services (Template, Cluster)
- Batch Issuance (Validation, preview, and execution flow)
- Utilities & Errors (Share utility, CKB RPC error formatting)
- Integration Tests (Certificate lifecycle, batch issuance flow, and DID integration)

## Resources

- [CCC SDK Documentation](https://docs.ckbccc.com)
- [Spore Protocol](https://docs.spore.pro/)
- [W3C Verifiable Credentials](https://www.w3.org/TR/vc-data-model/)

## License

MIT
