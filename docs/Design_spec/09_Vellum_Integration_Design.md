# Design Spec: Credora & Vellum Integration

> **Status:** Phase 1 Live | Phase 2 Ready to Implement
> **Target:** dApp Integration between Credora & Vellum
> **Vellum Repository:** [truthixify/vellum](https://github.com/truthixify/vellum)
> **Vellum Dashboard:** [dashboard.usevellum.xyz](https://dashboard.usevellum.xyz)
> **Vellum M1 Report:** [talk.nervos.org](https://talk.nervos.org/t/dis-vellum-reputation-extension-on-did-ckb/10613/9)
> **SDK:** [@usevellum/sdk v0.1.0](https://www.npmjs.com/package/@usevellum/sdk)

---

## 1. Overview

Credora là nền tảng phát hành và quản lý chứng chỉ số trên Nervos CKB sử dụng Spore Protocol. [Vellum](https://usevellum.xyz/) là hệ thống identity và reputation cho CKB builders với Claim Cell Protocol.

### 1.1 Integration Goals

| Goal | Description |
|------|-------------|
| **Portable Identity** | Certificates survive wallet rotations via DID |
| **Reputation Indexing** | Course completions indexed by Vellum |
| **Lock Rotation Resilience** | Claims follow DID, not wallet address |
| **Cross-Platform Verification** | Deep-link between Credora and Vellum profiles |

---

## 2. Phase 1: `did:ckb` Identity & Resolution (Live ✅)

### 2.1 Current Implementation

Phase 1 cho phép Credora phát hành certificate trực tiếp đến `did:ckb` identifiers:

1. **Recipient Resolution:** Khi issuer nhập `did:ckb:...`, Credora query DID cell để resolve sang active lock script
2. **W3C Compliance:** Spore DOB ghi `credentialSubject.id = did:ckb:...`
3. **Profile Link:** DID badge trên certificate link đến Vellum profile
4. **Backward Compatibility:** Certificates cũ (`ckt1...`) vẫn hoạt động 100%

### 2.2 Tech Stack

| Package | Purpose |
|---------|---------|
| `@ckb-ccc/did-ckb` | DID resolution, identity operations |
| `@ckb-ccc/core` | CKB client, codecs |

---

## 3. Phase 2: Dual-Output Transaction Architecture (Ready)

### 3.1 Background

**Vellum M1 đã hoàn thành** với Claim Cell Protocol production-ready:

| Component | Status | Details |
|-----------|--------|---------|
| Claim Type Script | ✅ Live | 47,752 bytes, ~146K cycles |
| DID Lock Script | ✅ Live | 30,336 bytes, rotation resilience |
| SDK | ✅ v0.1.0 | `@usevellum/sdk` on npm |
| Schemas | ✅ 7 schemas | Social + Community platforms |
| Reputation Scoring | ✅ v5 | Policy live on testnet |

### 3.2 Why Dual-Output?

| Problem | Solution |
|---------|----------|
| Spore DOB chứa arbitrary JSON, Vellum không thể index | Claim Cell cung cấp standardized signal |
| Spore gắn với lock address | Claim Cell gắn với DID identifier |
| Lock rotation breaks Spore ownership | DID Lock script handles rotation |

### 3.3 Architecture

```
+-------------------------------------------------------------------------------+
|                      1 Single Mint Transaction (Credora)                       |
+-------------------------------------------------------------------------------+
        |
        +---> [Output 0: Spore DOB Cell]
        |       - Lock: Recipient Wallet (secp256k1/omnilock)
        |       - Type: Spore Type (Cluster binding)
        |       - Data: W3C VC JSON + SVG layout + DNA
        |       - Purpose: Rich certificate on Credora
        |
        +---> [Output 1: Vellum Claim Cell]
                - Lock: DID Lock (subject's did:ckb)
                - Type: Claim Type (issuer DID hash + schema hash)
                - Data: ClaimDataV1 (DAG-CBOR payload)
                - Purpose: On-chain attestation for Vellum
```

### 3.4 Claim Cell Structure

**Claim Type Arguments (65 bytes):**

| Offset | Size | Value |
|--------|------|-------|
| 0 | 32 | issuer_did_code_hash |
| 32 | 1 | issuer_did_hash_type |
| 33 | 32 | schema_hash |

**ClaimData V1:**

| Field | Type | Description |
|-------|------|-------------|
| `issuer_id` | 20 bytes | Method-specific identifier |
| `nonce` | 32 bytes | Random (never reused) |
| `issued_at` | uint64 LE | Unix timestamp |
| `expires_at` | optional uint64 | Expiration |
| `payload` | bytes | DAG-CBOR (1-16,384 bytes) |

### 3.5 DID Lock Behavior

- Finds Cells matching identity Type Script hash
- Reads controller lock from identity Cell state
- Prevents self-recursion (controller ≠ current DID Lock)
- Requires controller-owned input for authorization
- **Result:** Claims survive wallet rotation automatically

---

## 4. Schema Design: `credora.course.v1`

### 4.1 Schema Definition

```typescript
// DAG-CBOR payload structure
interface CredoraCoursePayload {
  spore_id: string;           // "0x..." - Reference to Credora Spore DOB
  course_id: string;          // Course identifier
  issuer_did: string;        // "did:ckb:..." - Credora issuer DID
  issued_at: number;          // Unix timestamp
  expires_at?: number;        // Optional expiration timestamp
  metadata: {
    course_name: string;      // Display name
    completion_date: string;   // ISO date "2026-09-26"
    grade?: string;           // Optional grade
  };
}
```

### 4.2 Schema Hash

Schema hash = CKB_BLAKE2B_256(JCS(schema_manifest))

```json
{
  "name": "credora.course.v1",
  "version": "1.0.0",
  "description": "Credora course completion attestation",
  "payload": {
    "type": "object",
    "required": ["spore_id", "course_id", "issuer_did", "issued_at", "metadata"],
    "properties": {
      "spore_id": { "type": "string" },
      "course_id": { "type": "string" },
      "issuer_did": { "type": "string" },
      "issued_at": { "type": "integer" },
      "expires_at": { "type": "integer" },
      "metadata": {
        "type": "object",
        "required": ["course_name", "completion_date"],
        "properties": {
          "course_name": { "type": "string" },
          "completion_date": { "type": "string" },
          "grade": { "type": "string" }
        }
      }
    }
  }
}
```

---

## 5. SDK Integration

### 5.1 Installation

```bash
npm install @usevellum/sdk @ckb-ccc/core
```

### 5.2 Key APIs

```typescript
import { ccc } from "@ckb-ccc/core";
import { readClaims, writeClaim, writeClaims, parseClaimPayload } from "@usevellum/sdk";

// Read claims for a DID
const result = await readClaims({
  client: new ccc.ClientPublicTestnet(),
  scripts, filter: { subject: { did: subjectDid } }
});

// Write single claim
const built = await writeClaim({
  issuerSigner, scripts,
  input: { subject: { did }, issuerDid, schemaHash, payload, issuedAt }
});

// Parse claim payload
const parsed = parseClaimPayload(claim, schemaHash);
```

### 5.3 Signing Workflow

1. `writeClaim()` → returns prepared, balanced transaction
2. `signOnlyTransaction()` per signer
3. Capture tx hash before signing
4. Verify hash after each signature
5. `client.sendTransaction()` after all signatures

---

## 6. Capacity Estimation

### 6.1 Cell Sizes

| Cell Type | Base Size | Data Size | Total Estimate |
|-----------|-----------|-----------|----------------|
| **Spore DOB** | 204 bytes | ~700 bytes JSON | ~900 CKB |
| **Claim Cell** | ~150 bytes | ~200 bytes DAG-CBOR | ~350 CKB |

### 6.2 Transaction Cost

| Output | Capacity | Notes |
|--------|----------|-------|
| Spore DOB | ~900 CKB | Issuer sponsors |
| Claim Cell | ~350 CKB | Issuer sponsors |
| **Total** | **~1,250 CKB** | Dual-output mint |

---

## 7. Integration Roadmap

| Phase | Milestone | Focus | Status |
|-------|----------|-------|--------|
| **Phase 1** | `did:ckb` Recipient Support | Resolve DID, batch CSV/JSON, Vellum profile link | **Complete ✅** |
| **Phase 2A** | SDK Integration | Add `@usevellum/sdk`, design schema | **Ready** |
| **Phase 2B** | Dual-Output Transaction | Compose Claim Cell output in minting flow | **Planned** |
| **Phase 2C** | UI Enhancement | Toggle for Claim Cell issuance, profile link | **Planned** |
| **Phase 3** | Vellum Profile | Bidirectional navigation, course badges | **M2 pending** |

---

## 8. Testing Strategy

### 8.1 Unit Tests

| Test | Coverage |
|------|----------|
| Schema hash computation | Verify DAG-CBOR encoding |
| Claim payload structure | Required fields validation |
| Capacity calculation | Dual-output vs single output |
| SDK mock | `readClaims`, `writeClaim` |

### 8.2 Integration Tests

| Test | Flow |
|------|------|
| Mint with Claim Cell | Single transaction, two outputs |
| DID resolution | Resolve DID, verify Claim Cell |
| Lock rotation | Rotate DID, verify Claim Cell still accessible |
| Verification | Vellum SDK reads Credora claims |

---

## 9. Files to Modify

### 9.1 New Files

| File | Purpose |
|------|---------|
| `src/lib/credentials/vellumClaim.ts` | Vellum Claim Cell integration |
| `src/lib/credentials/schemas/credoraCourse.ts` | Schema definition + hash |
| `tests/unit/credentials/vellumClaim.test.ts` | Unit tests |
| `tests/integration/vellumClaim.test.ts` | Integration tests |

### 9.2 Modified Files

| File | Changes |
|------|---------|
| `src/lib/credentials/issuer.ts` | Add dual-output option |
| `src/lib/credentials/index.ts` | Export new functions |
| `src/components/certificate/CertificateForm.tsx` | Add Claim Cell toggle |
| `src/components/batch/BatchPreview.tsx` | Show Claim Cell cost |
| `package.json` | Add `@usevellum/sdk` dependency |

---

## 10. Open Questions

1. **Schema Registration:** Should Credora publish schema to Vellum registry?
2. **Issuer DID:** Create dedicated Credora issuer DID or use existing?
3. **Optional vs Default:** Should Claim Cell issuance be opt-in or default?
4. **Mainnet Timing:** Wait for Vellum mainnet deployment?

---

## 11. References

- [Vellum Repository](https://github.com/truthixify/vellum)
- [@usevellum/sdk npm](https://www.npmjs.com/package/@usevellum/sdk)
- [M1 Delivery Report](https://talk.nervos.org/t/dis-vellum-reputation-extension-on-did-ckb/10613/9)
- [Claim Cell Protocol](https://github.com/truthixify/vellum/blob/main/docs/claim-cell.md)
- [Claim SDK Docs](https://github.com/truthixify/vellum/blob/main/docs/claim-sdk.md)

---

*Last Updated: September 2026*
*Phase 2 Implementation Plan: `docs/superpowers/plans/2026-09-26-vellum-phase2-dual-output.md`
