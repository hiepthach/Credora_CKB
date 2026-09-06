# Credora (CertifyCKB) — Demo Script & Screencast Walkthrough Guide

> **Production Demo & Video Walkthrough Guide**  
> **Platform**: [Credora — Verifiable Credentials on Nervos CKB](https://github.com/hiepthach/CertifyCKB)  
> **Standard**: W3C Verifiable Credentials on Nervos CKB via Spore Protocol (DOB / Clusters)  
> **Identity**: Portable DID via `@ckb-ccc/did-ckb` (`did:ckb:`)  
> **Target Run Time**: 4 minutes 45 seconds (8 Scenes)  
> **Target Audience**: Nervos Hackathon Evaluators, Web3 Educators, Academic Registrars, Blockchain Architects

---

## Table of Contents

1. [Executive Overview](#1-executive-overview)
2. [Pre-Demo Environment & Testnet Setup](#2-pre-demo-environment--testnet-setup)
   - [2.1 Network & RPC Configuration](#21-network--rpc-configuration)
   - [2.2 Wallet Configuration (JoyID & MetaMask)](#22-wallet-configuration-joyid--metamask)
   - [2.3 Testnet Faucet & CKB Capacity Planning](#23-testnet-faucet--ckb-capacity-planning)
   - [2.4 Local Development Server](#24-local-development-server)
   - [2.5 Demo Data Inventory](#25-demo-data-inventory)
3. [Technical Screencast Recording Specifications](#3-technical-screencast-recording-specifications)
   - [3.1 Audio & Microphone Setup](#31-audio--microphone-setup)
   - [3.2 Screen Resolution & Frame Rate](#32-screen-resolution--frame-rate)
   - [3.3 Browser Environment](#33-browser-environment)
   - [3.4 Recording Software Presets](#34-recording-software-presets)
4. [Minute-by-Minute 8-Scene Storyboard](#4-minute-by-minute-8-scene-storyboard)
   - [Scene 1 (0:00 - 0:30): Introduction & Connecting Wallet](#scene-1-000---030-introduction--connecting-wallet)
   - [Scene 2 (0:30 - 1:15): Registering an Educational Institution (Cluster on CKB)](#scene-2-030---115-registering-an-educational-institution-cluster-on-ckb)
   - [Scene 3 (1:15 - 2:00): Choosing a Branded Certificate Template & Live Preview](#scene-3-115---200-choosing-a-branded-certificate-template--live-preview)
   - [Scene 4 (2:00 - 2:45): Issuing a Certificate (with CKB Address or DID)](#scene-4-200---245-issuing-a-certificate-with-ckb-address-or-did)
   - [Scene 5 (2:45 - 3:15): Student View, Paper Certificate & Sharing](#scene-5-245---315-student-view-paper-certificate--sharing)
   - [Scene 6 (3:15 - 3:45): Cryptographic Verification (/verify) on CKB Consensus](#scene-6-315---345-cryptographic-verification-verify-on-ckb-consensus)
   - [Scene 7 (3:45 - 4:15): Batch Issuance with CSV Upload](#scene-7-345---415-batch-issuance-with-csv-upload)
   - [Scene 8 (4:15 - 4:45): Melting Certificate & Reclaiming CKB Capacity](#scene-8-415---445-melting-certificate--reclaiming-ckb-capacity)
5. [Live Demo FAQ & Troubleshooting Guide](#5-live-demo-faq--troubleshooting-guide)
   - [5.1 Handling Slow Block Times & Mempool Latency](#51-handling-slow-block-times--mempool-latency)
   - [5.2 Cell Contention & UTXO Serialization](#52-cell-contention--utxo-serialization)
   - [5.3 Insufficient Capacity & Faucet Limits](#53-insufficient-capacity--faucet-limits)
   - [5.4 DID Resolution Fallback & Vellum Profile Linking](#54-did-resolution-fallback--vellum-profile-linking)
   - [5.5 Wallet Popup Blocker or Rejection](#55-wallet-popup-blocker-or-rejection)

---

## 1. Executive Overview

Credora solves the fundamental crisis of digital credential verification: counterfeit diplomas, vulnerable centralized databases, and recurring SaaS subscription paywalls.

By combining the **Nervos CKB Cell Model**, the **Spore Protocol (Digital Objects / DOBs)**, and **W3C Verifiable Credentials**, Credora turns educational degrees into sovereign, on-chain digital assets:
- **Zero Ongoing Cost**: Stored permanently in CKB Cell capacity (1 Byte = 1 CKB).
- **Sovereign Ownership**: The student holds the credential in their own cryptographic lock script. No third party can delete, alter, or hold their diploma hostage.
- **Portable Identity**: First-class support for `did:ckb:` identifiers via `@ckb-ccc/did-ckb` and [Vellum](https://vellum-lyart.vercel.app), allowing certificates to survive wallet key rotations.
- **Capacity Reclamation**: Obsolete or replaced credentials can be "melted" via Spore protocol rules, refunding 100% of the locked CKB capacity back to the owner.

---

## 2. Pre-Demo Environment & Testnet Setup

### 2.1 Network & RPC Configuration

Credora runs on **CKB Testnet (Aggron)** for demonstration:

| Parameter | Configuration Value | Notes |
|:---|:---|:---|
| **Network Name** | CKB Testnet (Aggron) | Selected via top-right network switch |
| **Node RPC URL** | `https://testnet.ckb.dev` | Public CKB node RPC endpoint |
| **Indexer RPC URL** | `https://testnet.ckb.dev/indexer` | Cell query indexer |
| **Block Explorer** | `https://explorer.nervos.org/aggron2` | Live transaction proof verification |
| **Spore Protocol Version** | Spore v2 on Aggron | On-chain contract scripts bundled in `@ckb-ccc/spore` |

### 2.2 Wallet Configuration (JoyID & MetaMask)

Credora leverages CCC (Common Chain Connector) OmniLock support:

1. **JoyID Passkey (Primary Recommended)**:
   - Zero installation required. Uses WebAuthn biometrics (TouchID / FaceID / Windows Hello).
   - Testnet JoyID URL: `https://testnet.joyid.dev`
   - Generates an Aggron address: `ckt1qzda0cr08m85hc8j9ngns49pn30ep606x4qp8nd500w494ps2qscq2fnsqv`
2. **MetaMask (Alternative)**:
   - Connected via CCC OmniLock provider.
   - Any standard Ethereum address (e.g., `0x71C...`) is automatically translated into an Aggron CKB address via OmniLock type script.

### 2.3 Testnet Faucet & CKB Capacity Planning

Each on-chain entity in Credora requires dedicated CKB storage capacity:

| Entity | Capacity Requirement | Purpose |
|:---|:---|:---|
| **Spore Cluster (Institution)** | ~185 CKB | Stores institution name, description, and admin lock script |
| **Spore DOB (Certificate)** | ~151 CKB | Stores W3C VC DNA (subject, course, grade, skills, layout metadata) |
| **Batch of 3 Certificates** | ~453 CKB | 3 × 151 CKB |
| **Transaction Gas Fees** | ~0.001 CKB | Per transaction |

> [!TIP]
> **Faucet Preparation**:  
> Visit [https://faucet.nervos.org](https://faucet.nervos.org) at least 30 minutes before recording. Request 50,000 testnet CKB to the demo presenter address. Ensure the wallet shows at least **1,000 CKB** balance to cover cluster registration and single + batch minting without interruption.

### 2.4 Local Development Server

Run the application locally:

```bash
# 1. Install dependencies
npm install

# 2. Verify all test suites pass
npm run test:run

# 3. Ensure zero TypeScript compilation errors
npm run typecheck

# 4. Start Next.js development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your clean browser window.

### 2.5 Demo Data Inventory

The repository contains pre-validated demo data for immediate use:

- **Sample CSV File**: `demo-data/sample-recipients.csv`
- **Contents**:
  ```csv
  recipientAddress,recipientName,courseName,completionDate,grade,skills
  ckt1qzda0cr08m85hc8j9ngns49pn30ep606x4qp8nd500w494ps2qscq2fnsqv,Alex Rivera,Full-Stack CKB Developer,2026-03-01,A+,Rust;CKB-VM;Spore DOB
  did:ckb:abcdefghijklmnopqrstuvwxyz234567,Elena Rostova,Zero-Knowledge & Decentralized Identity,2026-03-02,Distinction,did:ckb;Vellum;W3C VC
  ckt1q9gry5zgxmpjnmhrp4raggde4gf2vqqyzd5x3lt7pf5m8c2kzwfxnsvpq,Marcus Vance,Smart Contract Engineering on Nervos,2026-03-03,A,Cell Model;Omnilock
  ```
- **Live DID Reference**: `did:ckb:abcdefghijklmnopqrstuvwxyz234567` is an RFC4648 lowercase base32 identifier registered on [Vellum](https://vellum-lyart.vercel.app).

---

## 3. Technical Screencast Recording Specifications

### 3.1 Audio & Microphone Setup
- **Sample Rate**: 48,000 Hz, 24-bit PCM audio.
- **Microphone**: Cardioid condenser or dynamic USB/XLR mic placed 6–8 inches from speaker with pop filter.
- **Filters in OBS**: Noise Suppression (RNNoise), Noise Gate (Close: -42dB, Open: -36dB), Gentle Limiter (-1.5dB peak ceiling).

### 3.2 Screen Resolution & Frame Rate
- **Canvas Resolution**: 1920 × 1080 (1080p, 16:9 aspect ratio) or 3840 × 2160 downscaled.
- **Frame Rate**: 60 fps (guarantees fluid cursor motion and smooth Doppler UI gradient animations).
- **Color Format**: NV12 or sRGB, Full Color Range.

### 3.3 Browser Environment
- **Browser**: Google Chrome or Brave in a dedicated guest/demo profile.
- **Zoom Level**: 100% or 110% (for crisp typography on 1080p displays).
- **Interface**: Bookmarks bar hidden (`Ctrl+Shift+B` / `Cmd+Shift+B`). Extensions toolbar hidden except wallet extension.
- **Theme**: Dark Mode enabled system-wide to match Credora's Midnight Plum aesthetic.

### 3.4 Recording Software Presets (OBS Studio)
- **Output Mode**: Advanced
- **Encoder**: Apple VT H264 Hardware / NVIDIA NVENC H.264 / QuickSync
- **Rate Control**: CBR (Constant Bitrate) @ 12,000 Kbps
- **Keyframe Interval**: 2 seconds

---

## 4. Minute-by-Minute 8-Scene Storyboard

```mermaid
timeline
    title Credora 4:45 Screencast Journey
    0:00 : Scene 1 - Intro & Wallet Auth
    0:30 : Scene 2 - Register Institution (Cluster)
    1:15 : Scene 3 - Branded Template Studio
    2:00 : Scene 4 - Issue Certificate (CKB / DID)
    2:45 : Scene 5 - Student View & Sharing
    3:15 : Scene 6 - Consensus Verification (/verify)
    3:45 : Scene 7 - High-Throughput Batch CSV
    4:15 : Scene 8 - Melt DOB & Capacity Refund
```

---

### Scene 1 (0:00 - 0:30): Introduction & Connecting Wallet

#### Overview & Timing
- **Timecode**: `0:00 - 0:30` (Duration: 30 seconds)
- **Location**: Homepage (`/`)
- **Key Visuals**: Doppler Midnight Plum background, pulsing Aurora Glow backdrop, Credora logo lockup, interactive security console frame with live CKB proof badge.

#### Visual Cues & Screen State
1. Browser displays `http://localhost:3000`. The headline reads: *"The tamper-proof credential vault on blockchain."*
2. Right-hand Doppler console displays an active preview with green "LIVE ON CKB" badge.
3. Top header shows the network badge set to `Testnet (Aggron)` and a prominent `Connect Wallet` button.

#### Step-by-Step Operator Actions
1. **0:00 - 0:10**: Cursor rests gently near the center hero headline, then smoothly glides across the three trust badges (*On-chain Spore Protocol*, *W3C Verifiable Credentials*, *JoyID Passkey Ready*).
2. **0:10 - 0:20**: Move cursor to top-right header and click `Connect Wallet`. The CCC Wallet Connector modal pops up showing JoyID, MetaMask, and WalletConnect.
3. **0:20 - 0:30**: Select **JoyID Passkey** (or MetaMask). Authenticate with biometrics. The modal dismisses, and the button transitions to the connected state showing the truncated address `ckt1qz...fsqv` with a green indicator.

#### Word-for-Word Narration Script
> *"Welcome to Credora—a decentralized, verifiable credential registry built from first principles on Nervos CKB.*
> 
> *Every year, thousands of academic institutions and students struggle with counterfeit degrees, siloed SaaS platforms, and recurring subscription paywalls. Credora re-architects educational certifications by anchoring them directly onto layer-1 CKB cells using the Spore DOB protocol and the W3C Verifiable Credential standard.*
> 
> *Connecting to Credora is completely frictionless. With Common Chain Connector and JoyID passkeys, users authenticate using biometric passkeys—no seed phrases, no extensions, and complete sovereign security."*

#### Technical Mechanics Under the Hood
- **CCC Connector**: Authenticates user via WebAuthn or Ethereum secp256k1 signature and maps the public key to a CKB OmniLock script.
- **Client Script Discovery**: Resolves the user's recommended lock script hash and address format (`ckt1q...`).

---

### Scene 2 (0:30 - 1:15): Registering an Educational Institution (Cluster on CKB)

#### Overview & Timing
- **Timecode**: `0:30 - 1:15` (Duration: 45 seconds)
- **Location**: Institutions Page (`/clusters`)
- **Key Visuals**: Empty/Active cluster list, "Register Institution" button, modal dialog with institution metadata fields.

#### Visual Cues & Screen State
1. Navigate to `/clusters`. The page title reads: *"Accredited Issuing Institutions"*.
2. Subtitle: *"Manage on-chain Spore Clusters that anchor your institution's authority."*
3. Click `+ Register Institution` to open the modal dialog.

#### Step-by-Step Operator Actions
1. **0:30 - 0:38**: Click **Institutions** in the top navigation bar. The `/clusters` route transitions with smooth fade-in.
2. **0:38 - 0:45**: Click the `+ Register Institution` button in the top right. The modal dialog opens smoothly.
3. **0:45 - 0:58**: Fill out the form fields with demo data:
   - **Institution Name**: `CKB Blockchain Academy`
   - **Description**: `Premier educational center for Nervos CKB-VM smart contracts, cell architecture, and digital object design.`
   - **Website URL**: `https://academy.nervos.org`
   - **Contact Email**: `credentials@nervos.org`
4. **0:58 - 1:15**: Click `Create Institution (Cluster on CKB)`. The wallet pops up asking to sign the transaction. Approve the prompt. A Spinner appears: *"Minting Spore Cluster cell on CKB..."*. The transaction confirms, modal closes, and the new institution card appears with its 32-byte Cluster ID chip (`0x9a8f...21ce`) and a green `Active Authority` badge.

#### Word-for-Word Narration Script
> *"Before issuing certificates, an educational institution establishes its on-chain sovereign identity. On Nervos CKB, this is represented as a Spore Cluster cell.*
> 
> *Let's register our school—the 'CKB Blockchain Academy'. We input our accredited curriculum description, official website, and contact email.*
> 
> *When we submit this transaction, CKB's layer-1 locks approximately 185 CKB capacity to store this cluster cell permanently. This cluster ID serves as the immutable parent identity for every certificate we will ever issue. Only our institution's private key can authorize new credentials under this cluster, making impersonation mathematically impossible."*

#### Technical Mechanics Under the Hood
- **Spore Cluster Cell Creation**: Calls `@ckb-ccc/spore` `createCluster()`.
- **Output Cell**: Emits a cell with the Spore Cluster type script. The Cluster ID is derived from the hash of the first input transaction cell output, preventing collision and ensuring global uniqueness.

---

### Scene 3 (1:15 - 2:00): Choosing a Branded Certificate Template & Live Preview

#### Overview & Timing
- **Timecode**: `1:15 - 2:00` (Duration: 45 seconds)
- **Location**: Issue Certificate Page (`/certificates/issue`)
- **Key Visuals**: Two-column studio layout. Left: Configuration form. Right: Sticky WYSIWYG `PaperCertificate` live rendering with parchment texture, ornate borders, and gold seal.

#### Visual Cues & Screen State
1. Left column: Institution Selector dropdown, Section 1 (Recipient & Credential Info), and Section 2 (Certificate Style & Appearance).
2. Right column: `PaperCertificate` component previewing in real-time with responsive scaling.

#### Step-by-Step Operator Actions
1. **1:15 - 1:25**: Click **Issue Certificates** in the header. The URL `/certificates/issue` loads. Notice `CKB Blockchain Academy` is pre-selected in the Issuing Institution selector.
2. **1:25 - 1:40**: Scroll to **2. Certificate Style & Appearance**. Click through the Layout options:
   - Click `Classic` (observe traditional ornate double-border and laurel seal).
   - Click `Modern` (observe bold header banner with modern typography).
   - Click `Detailed` (observe full academic transcript section and skills chips).
   - Return to `Classic` layout.
3. **1:40 - 2:00**: Click through Theme palettes:
   - Click `Blue` (sapphire accents).
   - Click `Purple` (deep amethyst accents).
   - Click `Gold` (warm gilded borders).
   - Toggle to `Green` (emerald theme matching Nervos branding). Watch the right-hand preview instantly update without any page reload.

#### Word-for-Word Narration Script
> *"Credora treats digital certificates not as sterile JSON blobs, but as rich, beautiful Digital Objects. Our integrated Visual Studio gives universities complete creative control over their brand.*
> 
> *Here in the certificate studio, we can choose between multiple layout standards: Classic for ceremonial diplomas, Modern for tech bootcamps, or Detailed for comprehensive transcripts with verified skill lists.*
> 
> *Every style change, font hierarchy, and theme color—from Royal Blue to Nervos Emerald—renders immediately in our real-time WYSIWYG canvas. These visual attributes aren't stored on an external cloud server; they are deterministically encoded into the certificate's on-chain DNA."*

#### Technical Mechanics Under the Hood
- **React State Synchronization**: `CertificateForm` invokes `onChange` debounced handler to propagate layout and theme states to `PaperCertificate`.
- **W3C VC Metadata Standard**: Embeds layout, theme, and color codes into `credentialSubject.metadata` according to W3C VC specification.

---

### Scene 4 (2:00 - 2:45): Issuing a Certificate (with CKB Address or DID)

#### Overview & Timing
- **Timecode**: `2:00 - 2:45` (Duration: 45 seconds)
- **Location**: Issue Certificate Page (`/certificates/issue`)
- **Key Visuals**: Recipient input field with live DID resolution badge, course inputs, date pickers, grade dropdown, and transaction broadcast modal.

#### Visual Cues & Screen State
1. Operator inputs recipient DID: `did:ckb:abcdefghijklmnopqrstuvwxyz234567`.
2. A subtle spinner appears: *"Resolving DID on CKB..."*, quickly replaced by a green checkmark box: *"DID Resolved to ckt1qz...234567"*.
3. Form completed with course name, completion date, grade, score, and verified skills.

#### Step-by-Step Operator Actions
1. **2:00 - 2:12**: In the **Recipient Address or DID** input, type:
   `did:ckb:abcdefghijklmnopqrstuvwxyz234567`
   Pause for 1 second. Point cursor to the green banner that appears below the field: `✓ DID Resolved to ckt1qzda0cr08m85hc8j...`.
2. **2:12 - 2:25**: Fill out credential subject fields:
   - **Recipient Full Name**: `Elena Rostova`
   - **Course / Program Name**: `Zero-Knowledge & Decentralized Identity`
   - **Completion Date**: `2026-03-02`
   - **Expiration Date**: Leave empty (*Lifetime Validity*)
   - **Grade**: Select `Distinction`
   - **Score (%)**: `98`
   - **Skills Certified**: `did:ckb, Vellum, W3C VC, CKB-VM`
3. **2:25 - 2:45**: Click the primary action button: `Mint Certificate on CKB (151 CKB)`.
   - The JoyID/MetaMask approval window opens.
   - Confirm the transaction.
   - A celebratory modal appears with green checkmark: *"Certificate Minted On CKB!"*.
   - Displays Certificate ID: `0x7b3f021e89ad549ef0768b4495c065e1281862ef2a912bb3e7215392d2427a1c` and Transaction Hash: `0x4a1b2c...cdef`.

#### Word-for-Word Narration Script
> *"Now let's mint a certificate for our graduate, Elena Rostova.*
> 
> *Notice that instead of a traditional hex address, we enter Elena's decentralized identifier: `did:ckb:abcdefghijklmnopqrstuvwxyz234567`.*
> 
> *Credora's native DID resolver immediately queries the CKB layer-1 DID registry and resolves her active lock script. This means Elena's diploma is bound to her decentralized identity. If Elena ever rotates her underlying hardware wallet or changes keys, her diploma remains intact and verifiable under her sovereign DID.*
> 
> *We enter the course title—'Zero-Knowledge & Decentralized Identity'—award a Distinction with a 98% score, and click Mint. With one biometric touch on JoyID, the transaction is broadcast to the Nervos Aggron network, sealing the credential into CKB consensus."*

#### Technical Mechanics Under the Hood
- **DID Resolution**: Calls `resolveRecipientInput()` using `@ckb-ccc/did-ckb` to fetch the cell holding the DID record and extracts its lock script.
- **Spore DOB Minting**: Calls `createSpore()` with `clusterId`, encoding W3C VC payload via `encodeCertificateDNA()`.
- **Capacity Requirement**: ~151 CKB is allocated from the issuer wallet to fund the newly created Spore cell.

---

### Scene 5 (2:45 - 3:15): Student View, Paper Certificate & Sharing

#### Overview & Timing
- **Timecode**: `2:45 - 3:15` (Duration: 30 seconds)
- **Location**: My Certificates Page (`/certificates`)
- **Key Visuals**: Filter tabs (*All*, *Received*, *Issued*), Certificate card grid with DID badges, detailed modal dialog with print preview and sharing tools.

#### Visual Cues & Screen State
1. Navigate to `/certificates`.
2. Elena's new certificate is listed prominently at the top of the grid with a purple `did:ckb` badge and green `Verified On-Chain DOB` badge.
3. Clicking the card opens the full-screen `CertificateDetail` view.

#### Step-by-Step Operator Actions
1. **2:45 - 2:53**: Click **My Certificates** in the top navigation bar.
2. **2:53 - 3:02**: Click on Elena Rostova's certificate card. The modal dialog opens.
3. **3:02 - 3:15**: Point out the key elements in the modal:
   - Click the `Visual` / `Technical` view toggle switch.
   - Show the W3C VC JSON-LD payload in Technical view.
   - Switch back to `Visual` view.
   - Hover over the action buttons: `Print / PDF Export`, `Copy Certificate ID`, `Share Link`, and `View on Explorer`.
   - Click `Copy Certificate ID` (tooltip displays *"Copied to clipboard!"*).

#### Word-for-Word Narration Script
> *"Let's see this from the student's perspective. In 'My Certificates', Elena sees her verifiable credentials.*
> 
> *Because her certificate was issued to her DID, it displays an official DID badge linking directly to her verified profile on Vellum.*
> 
> *Clicking into the certificate opens our high-fidelity credential viewer. Elena can toggle between the artistic visual certificate and the raw cryptographic W3C JSON-LD credential. With built-in sharing tools, Elena can copy her verification link, export a print-ready vector PDF for framing, or inspect the exact transaction on the CKB Explorer."*

#### Technical Mechanics Under the Hood
- **Dynamic Lock Query**: `getHolderCertificates()` queries CKB cells matching both the user's connected wallet address and all registered `did:ckb:` records resolved from their lock script.
- **W3C VC Compliance**: Decodes cell data using `decodeCertificateDNA()` to reconstruct context `https://www.w3.org/2018/credentials/v1`.

---

### Scene 6 (3:15 - 3:45): Cryptographic Verification (/verify) on CKB Consensus

#### Overview & Timing
- **Timecode**: `3:15 - 3:45` (Duration: 30 seconds)
- **Location**: Verification Portal (`/verify`)
- **Key Visuals**: Hex search input, verification spinner, zero-trust verification card with green pulsing shield, block confirmation height, and cluster issuer validation.

#### Visual Cues & Screen State
1. Navigate to `/verify`. The page displays a search bar: *"Enter Spore DOB Certificate ID (0x...)"*.
2. Paste the copied Certificate ID: `0x7b3f021e89ad549ef0768b4495c065e1281862ef2a912bb3e7215392d2427a1c`.
3. Click `Verify Credential`.

#### Step-by-Step Operator Actions
1. **3:15 - 3:22**: Click **Verify** in the top navigation.
2. **3:22 - 3:30**: Paste the Certificate ID into the search input. Click `Verify Credential`.
3. **3:30 - 3:45**: A brief spinner appears (*"Querying CKB nodes and validating Spore DNA..."*).
   The screen updates with the comprehensive verification report:
   - Green Shield Icon: **Cryptographically Verified On-Chain**
   - **Issuer**: `CKB Blockchain Academy` (Cluster: `0x9a8f...21ce`)
   - **Recipient**: `did:ckb:abcdefghijklmnopqrstuvwxyz234567` (Elena Rostova)
   - **Validity**: `Valid (Lifetime)`
   - **Cell Proof**: Confirmed in CKB Block `#12,840,119`

#### Word-for-Word Narration Script
> *"Now imagine you are an employer or university admissions officer. How do you verify this diploma without emailing registrar offices or relying on third-party verification companies?*
> 
> *You visit Credora's public verifier and paste the 32-byte Certificate ID.*
> 
> *In less than a second, Credora queries the decentralized CKB blockchain node, reads the live Spore cell directly from consensus state, confirms that the cell has not been melted, verifies that the issuer cluster matches the accredited CKB Blockchain Academy, and checks the cryptographic DNA.*
> 
> *Zero trust. Zero intermediaries. Pure mathematical proof."*

#### Technical Mechanics Under the Hood
- **Spore Cell Validation**: Calls `verifyCertificate()`, executing `findSpore()` to ensure the cell exists in the live UTXO set.
- **Cluster Integrity Check**: Verifies that the Spore cell's `clusterId` matches the accredited institution's cell on CKB.
- **Expiration Logic**: Evaluates `isExpired()` against current UTC timestamp.

---

### Scene 7 (3:45 - 4:15): Batch Issuance with CSV Upload

#### Overview & Timing
- **Timecode**: `3:45 - 4:15` (Duration: 30 seconds)
- **Location**: Issue Certificate Page -> Batch Tab (`/certificates/issue?tab=batch`)
- **Key Visuals**: File drag-and-drop zone, automated validation summary table, capacity fee calculation, batch progress bar.

#### Visual Cues & Screen State
1. Open `/certificates/issue?tab=batch`.
2. Drag and drop `demo-data/sample-recipients.csv`.
3. Table renders 3 recipient rows with green badges: Alex Rivera (CKB address), Elena Rostova (DID), and Marcus Vance (CKB address).
4. Estimated CKB capacity calculator displays: `453 CKB (3 certificates × ~151 CKB)`.

#### Step-by-Step Operator Actions
1. **3:45 - 3:52**: Return to `/certificates/issue` and click the `Batch Issuance` tab switcher.
2. **3:52 - 4:02**: Click the file upload dropzone and select `demo-data/sample-recipients.csv` (or drag and drop it from the desktop).
3. **4:02 - 4:15**: Point out the validation UI:
   - `3 of 3 Rows Valid` (0 errors).
   - Point out mixed address support: row 1 and 3 use standard `ckt1q...` addresses; row 2 uses `did:ckb:abcdefghijklmnopqrstuvwxyz234567`.
   - Click `Issue All 3 Certificates (453 CKB)`.
   - Watch the animated progress bar advance `1/3 → 2/3 → 3/3` as all three transactions complete.

#### Word-for-Word Narration Script
> *"For institutions graduating hundreds or thousands of students, issuing certificates one by one is impractical. Credora includes a high-throughput batch issuance engine.*
> 
> *We simply drop in our cohort spreadsheet: `sample-recipients.csv`.*
> 
> *Credora parses the file client-side, validates every address and `did:ckb` identifier, verifies date formats, and computes the exact CKB capacity required—here, exactly 453 CKB for our three graduates.*
> 
> *With a single batch execution, Credora queues and broadcasts the minting transactions across CKB, turning an entire graduation cohort into verifiable on-chain credentials in minutes."*

#### Technical Mechanics Under the Hood
- **Client-Side CSV Parsing**: Utilizes `parseBatchFile()` and `Papa.parse` with strict schema validation.
- **Capacity Forecasting**: Multiplies valid entry count by 151 CKB per certificate (`previewBatch()`).
- **Sequential Cell Execution**: Executes sequential cell creation using `issueBatchCertificates()` to avoid CKB UTXO contention errors.

---

### Scene 8 (4:15 - 4:45): Melting Certificate & Reclaiming CKB Capacity

#### Overview & Timing
- **Timecode**: `4:15 - 4:45` (Duration: 30 seconds)
- **Location**: My Certificates Page (`/certificates`) & Verifier (`/verify`)
- **Key Visuals**: Certificate detail modal with red "Melt Certificate" button, confirmation warning modal, capacity refund indicator, and verifier showing "Certificate Not Found / Melted".

#### Visual Cues & Screen State
1. In `CertificateDetail`, click the flame icon: `Melt Certificate`.
2. Warning modal: *"Melting permanently destroys this certificate on CKB and refunds 151 CKB back to your wallet."*
3. Confirm melt transaction. Certificate disappears from the active list.
4. Refresh `/verify`: status changes to unverified / burned.

#### Step-by-Step Operator Actions
1. **4:15 - 4:24**: Open one of the test certificates in `/certificates`. Scroll to the bottom of the modal and click `Melt Certificate (Reclaim 151 CKB)`.
2. **4:24 - 4:32**: A confirmation modal appears. Point cursor to the message highlighting capacity reclamation: `151 CKB will be returned to your balance`. Click `Confirm & Melt`. Approve the wallet transaction.
3. **4:32 - 4:45**: Copy the melted Certificate ID. Go to `/verify`, paste the ID, and click `Verify Credential`. Point out the red status: `Certificate Inactive or Melted`. Return to the home screen for closing remarks.

#### Word-for-Word Narration Script
> *"Finally, Credora showcases the unique economic elegance of the Nervos Cell Model: capacity reclamation.*
> 
> *If a certificate was issued with an error, has expired, or the student wishes to revoke it, they can 'melt' the Spore DOB.*
> 
> *Melting consumes the cell on-chain, permanently destroying the credential so it can never be verified again. More importantly, the 151 CKB that was locked inside the cell is immediately refunded back to the wallet balance.*
> 
> *No dead data on the blockchain. No wasted storage. Complete economic sovereignty.*
> 
> *This is Credora—verifiable, portable, and permanent credentials powered by Nervos CKB. Thank you."*

#### Technical Mechanics Under the Hood
- **Spore Melt Transaction**: Invokes `@ckb-ccc/spore` `meltSpore()`. Consumes the live Spore cell as a transaction input and routes its capacity to the signer's change output without creating a new Spore output cell.
- **Permanent Invalidation**: Once consumed as an input, the Spore cell is no longer live. Any subsequent `findSpore()` call returns `null`, causing `/verify` to immediately fail.

---

## 5. Live Demo FAQ & Troubleshooting Guide

### 5.1 Handling Slow Block Times & Mempool Latency

- **Issue**: On CKB testnet, block median times vary between 8 and 30 seconds depending on difficulty epoch adjustments.
- **Screencast Mitigation**:
  - Keep the narration moving while the spinner displays *"Minting Spore cell on CKB..."*. Use this time to explain the cell model or capacity mechanics.
  - In post-production, trim any waiting window exceeding 5 seconds using a smooth jump-cut or 2× speed ramp.
  - Do not hit browser refresh while a transaction is pending in the mempool; CCC will automatically notify the React Query cache upon transaction confirmation.

### 5.2 Cell Contention & UTXO Serialization

- **Issue**: Attempting to send two transactions from the same wallet in rapid succession before the first transaction has been mined into a block causes `PoolRejectedDuplicatedTransaction` or `InputsAlreadySpent` errors because both transactions attempt to consume the same input cell.
- **Solution in Credora**:
  - The batch issuance engine (`issueBatchCertificates`) automatically serializes transactions sequentially, waiting for the previous transaction to complete before building the next cell.
  - When recording individual scenes, wait for the green success modal before navigating to the next action.

### 5.3 Insufficient Capacity & Faucet Limits

- **Issue**: Issuance fails with an error: *"Insufficient capacity to create Spore cell"*.
- **Root Cause**: Creating a Spore DOB cell requires at least ~151 CKB to store the cell data and lock/type scripts.
- **Solution**:
  - Always verify your wallet holds at least **1,000 CKB** prior to starting the demo recording.
  - If capacity falls low, visit [https://faucet.nervos.org](https://faucet.nervos.org) and claim 50,000 testnet CKB.
  - In Credora, the batch preview specifically calculates and displays the exact CKB requirement before you broadcast, preventing mid-batch failures.

### 5.4 DID Resolution Fallback & Vellum Profile Linking

- **Issue**: Entering a newly registered `did:ckb:` identifier fails to resolve with *"DID not found on CKB"*.
- **Root Cause**: The DID was either typed incorrectly, uses uppercase characters, or has not yet been confirmed on CKB.
- **Formatting Rule**:
  - Must conform to RFC4648 base32 lowercase: exactly 32 characters after `did:ckb:`, using only `a-z` and `2-7` (no capital letters, no `0`, `1`, `8`, or `9`).
  - Canonical demo DID: `did:ckb:abcdefghijklmnopqrstuvwxyz234567`.
  - For live audience verification, open [https://vellum-lyart.vercel.app](https://vellum-lyart.vercel.app) to show the decentralized identity profile corresponding to this DID.

### 5.5 Wallet Popup Blocker or Rejection

- **Issue**: Clicking "Connect Wallet" or "Mint Certificate" does not open the JoyID or MetaMask signing window.
- **Mitigation**:
  - Check browser address bar for pop-up blocker icons; set pop-ups to "Always allow on localhost:3000".
  - If JoyID connection stalls, ensure third-party storage is permitted in browser privacy settings.
  - If user accidentally closes the signature window, Credora's error boundary will display a gentle alert: *"Transaction Cancelled — The signature request was declined in your wallet"*, allowing immediate one-click retry.

---

## 6. Screencast Production Checklist

Before pressing Record in OBS Studio, verify every item:

- [ ] **Node & Dependencies**: Next.js running on `http://localhost:3000` with zero console errors.
- [ ] **Testnet Wallet Funded**: JoyID / MetaMask balance ≥ 1,000 CKB on Aggron testnet.
- [ ] **Sample Data Ready**: `demo-data/sample-recipients.csv` verified and accessible on Desktop.
- [ ] **Cluster Established**: "CKB Blockchain Academy" pre-registered or ready to be created in Scene 2.
- [ ] **Audio Levels**: Microphone peaks between -12dB and -6dB with zero clipping.
- [ ] **Display Setup**: 1920×1080 resolution, 100% zoom, bookmarks bar hidden, notifications silenced (`Do Not Disturb` on).
- [ ] **OBS Output**: 1080p 60fps CBR @ 12,000 Kbps.
- [ ] **Storyboard Aligned**: 8 scenes rehearsed to fit within 4:45 target runtime.
