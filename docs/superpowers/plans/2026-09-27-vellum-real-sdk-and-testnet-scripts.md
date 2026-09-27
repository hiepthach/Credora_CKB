# Vellum Testnet Real Scripts & SDK Integration Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the Credora Vellum Claim integration from placeholders and mock scripts to official Vellum CKB Testnet deployments (`Claim Type`, `DID Lock`), canonical JCS BLAKE2b-256 schema hashing (`credora.course.v1`), and pure deep integration with `@usevellum/sdk` via `writeClaim()` without mock/fallback logic in source code.

**Architecture:** Replace hardcoded dummy hashes with real Testnet contract locators (`0xaf69...` tx outpoints), compute the canonical JCS RFC 8785 schema hash, construct dynamic `identity_type_hash` DID locks for recipients, and directly integrate `@usevellum/sdk`\'s `writeClaim()` inside the dual-output transaction flow in `issueCertificate()`. No fallback or mock logic in production source code.

**Tech Stack:** TypeScript, `@ckb-ccc/core`, `@usevellum/sdk`, `@ckb-ccc/did-ckb`, Vitest

**Spec:**
- `docs/Design_spec/09_Vellum_Integration_Design.md`
- [Vellum Claim Cell Protocol](https://github.com/truthixify/vellum/blob/main/docs/claim-cell.md)
- [Vellum Testnet Deployment](https://github.com/truthixify/vellum/blob/main/deployments/testnet.json)
- [Vellum Schema Package](https://github.com/truthixify/vellum/tree/main/packages/schemas) - Reference for JCS implementation

## Global Constraints

- Never break existing single-output Spore DOB minting flow (`withVellumClaim: false` or omitted).
- All new/updated schema hashes must be computed using canonical RFC 8785 (JCS) and CKB BLAKE2b-256 (`ckb-default-hash`).
- Claim Type deployment: codeHash `0xfb2757e524b3f83161d8b85b8b3e00186e2019ff04f5dfe833c5a72731e13157`, hashType `type`, CellDep outPoint `0xaf693346282063a5d51f79d180fc807cdba1b8ac9d7af30085ff0aa190e2686c` index `0`.
- DID Lock deployment: codeHash `0xe1562cc57b4bd91619ada2f7e74d63805ea7038a7b6de0b18a529d51aa883d2d`, hashType `type`, CellDep outPoint `0xaf693346282063a5d51f79d180fc807cdba1b8ac9d7af30085ff0aa190e2686c` index `1`.
- Clean production code: No fallback or mock mechanisms in `src/lib/credentials/`. Mocks belong exclusively in test files (`tests/`).
- Follow strict TDD: each task writes a failing test first, passes it, and verifies existing test suites remain green.

---

### Task 1: Canonical Schema Manifest and Hash Computation (Fix Note 1)

**Files:**
- Create: `src/lib/credentials/schemas/credoraCourse.ts`
- Modify: `src/lib/credentials/vellumClaim.ts`
- Test: `tests/unit/credentials/schemaHash.test.ts`

**Interfaces:**
- Produces:
  - `CREDORA_COURSE_SCHEMA_MANIFEST`: The exact canonical JSON schema manifest object.
  - `computeCanonicalSchemaHash(manifest: unknown): string`: Utility computing `CKB_HASH(UTF8(JCS(manifest)))`.
  - `CredoraCourseSchemaHash`: Computed from actual schema manifest (no hardcoded value).

**JCS Reference:** See [vellum/packages/schemas](https://github.com/truthixify/vellum/tree/main/packages/schemas) for reference implementation.

- [ ] **Step 1: Write failing unit test for schema manifest and canonical hash**

Create `tests/unit/credentials/schemaHash.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import {
  CREDORA_COURSE_SCHEMA_MANIFEST,
  computeCanonicalSchemaHash,
  CredoraCourseSchemaHash,
} from "@/lib/credentials/schemas/credoraCourse";

describe("credora.course.v1 Schema Manifest & Hash", () => {
  it("should have valid schema manifest metadata", () => {
    expect(CREDORA_COURSE_SCHEMA_MANIFEST.name).toBe("credora.course.v1");
    expect(CREDORA_COURSE_SCHEMA_MANIFEST.version).toBe("1.0.0");
    expect(CREDORA_COURSE_SCHEMA_MANIFEST.payload.required).toEqual([
      "spore_id",
      "course_id",
      "issuer_did",
      "issued_at",
      "metadata",
    ]);
  });

  it("computes canonical schema hash from manifest", () => {
    const computed = computeCanonicalSchemaHash(CREDORA_COURSE_SCHEMA_MANIFEST);
    // Hash is 32 bytes = 64 hex chars + 0x prefix = 66 chars
    expect(computed).toMatch(/^0x[a-f0-9]{64}$/);
    expect(CredoraCourseSchemaHash).toBe(computed);
  });

  it("schema hash is deterministic across calls", () => {
    const hash1 = computeCanonicalSchemaHash(CREDORA_COURSE_SCHEMA_MANIFEST);
    const hash2 = computeCanonicalSchemaHash(CREDORA_COURSE_SCHEMA_MANIFEST);
    expect(hash1).toBe(hash2);
  });

  it("schema manifest canonicalization matches RFC 8785", () => {
    // Reference test: Verify that keys are sorted and values are properly encoded
    const manifest = CREDORA_COURSE_SCHEMA_MANIFEST;
    const canonical = computeCanonicalSchemaHash(manifest);

    // Different key order should produce same hash
    const reorderedManifest = {
      ...manifest,
      payload: {
        ...manifest.payload,
        properties: Object.keys(manifest.payload.properties)
          .sort()
          .reduce((acc, key) => ({ ...acc, [key]: manifest.payload.properties[key as keyof typeof manifest.payload.properties] }), {} as typeof manifest.payload.properties),
      },
    };

    expect(computeCanonicalSchemaHash(reorderedManifest)).toBe(canonical);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/credentials/schemaHash.test.ts`
Expected: FAIL - cannot find module `@/lib/credentials/schemas/credoraCourse`

- [ ] **Step 3: Implement `credoraCourse.ts` with proper JCS RFC 8785 canonicalization**

Create `src/lib/credentials/schemas/credoraCourse.ts`:
```typescript
import { ccc } from "@ckb-ccc/core";

export const CREDORA_COURSE_SCHEMA_MANIFEST = {
  name: "credora.course.v1",
  version: "1.0.0",
  description: "Credora course completion attestation",
  payload: {
    type: "object",
    required: ["spore_id", "course_id", "issuer_did", "issued_at", "metadata"],
    properties: {
      spore_id: { type: "string" },
      course_id: { type: "string" },
      issuer_did: { type: "string" },
      issued_at: { type: "integer" },
      expires_at: { type: "integer" },
      metadata: {
        type: "object",
        required: ["course_name", "completion_date"],
        properties: {
          course_name: { type: "string" },
          completion_date: { type: "string" },
          grade: { type: "string" },
        },
      },
    },
  },
} as const;

/**
 * RFC 8785 JSON Canonicalization - Recursively canonicalize JSON value
 * Reference: https://datatracker.ietf.org/doc/html/rfc8785
 */
function canonicalizeValue(value: unknown): string {
  if (value === null) return "null";
  if (value === true) return "true";
  if (value === false) return "false";

  if (typeof value === "number") {
    // RFC 8785: Use JSON number representation (no unnecessary decimals)
    return String(value);
  }

  if (typeof value === "string") {
    // RFC 8785: JSON string encoding
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return "[" + value.map(canonicalizeValue).join(",") + "]";
  }

  if (typeof value === "object") {
    // RFC 8785: Sort keys lexicographically
    const keys = Object.keys(value as Record<string, unknown>).sort();
    const pairs = keys.map((k) => JSON.stringify(k) + ":" + canonicalizeValue((value as Record<string, unknown>)[k]));
    return "{" + pairs.join(",") + "}";
  }

  throw new Error(`Unsupported value type: ${typeof value}`);
}

/**
 * Compute canonical JSON string per RFC 8785
 */
export function canonicalizeJson(obj: unknown): string {
  return canonicalizeValue(obj);
}

/**
 * Compute schema hash: CKB_BLAKE2B_256(UTF8(JCS(manifest)))
 */
export function computeCanonicalSchemaHash(manifest: unknown): string {
  const canonical = canonicalizeJson(manifest);
  return ccc.hashCkb(new TextEncoder().encode(canonical));
}

export const CredoraCourseSchemaHash = computeCanonicalSchemaHash(
  CREDORA_COURSE_SCHEMA_MANIFEST
) as `0x${string}`;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/credentials/schemaHash.test.ts`
Expected: PASS

- [ ] **Step 5: Update vellumClaim.ts to re-export from schema module**

Update `src/lib/credentials/vellumClaim.ts` to re-export:
```typescript
export {
  CREDORA_COURSE_SCHEMA_MANIFEST,
  CredoraCourseSchemaHash,
  computeCanonicalSchemaHash,
} from "./schemas/credoraCourse";
```

- [ ] **Step 6: Run existing tests and commit**

Run: `npx vitest run tests/unit/credentials/vellumClaim.test.ts`
Expected: PASS

Commit:
```bash
git add src/lib/credentials/schemas/credoraCourse.ts src/lib/credentials/vellumClaim.ts tests/unit/credentials/schemaHash.test.ts
git commit -m "feat(vellum): compute canonical schema hash for credora.course.v1

- Add CREDORA_COURSE_SCHEMA_MANIFEST with proper structure
- Implement RFC 8785 JCS canonicalization
- Compute schema hash using ccc.hashCkb()

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 2: Real Testnet Deployments for Claim Type & DID Lock (Fix Note 2 & Note 3)

**Files:**
- Modify: `src/lib/credentials/vellumClaim.ts`
- Test: `tests/unit/credentials/vellumDeployments.test.ts`

**Interfaces:**
- Produces:
  - `VELLUM_CLAIM_TYPE_DEPLOYMENT`: Object with `codeHash`, `hashType: "type"`, and `cellDep`.
  - `VELLUM_DID_LOCK_DEPLOYMENT`: Object with `codeHash`, `hashType: "type"`, and `cellDep`.
  - `getVellumScriptConfig()`: Returns `ClaimScriptConfigLike` for `@usevellum/sdk`.

**DID Lock Args Construction:**
- For a Claim Cell, the lock script uses DID Lock with the subject's DID-derived identity
- The SDK's `writeClaim()` handles DID Lock construction automatically from `subject.did`
- Reference: [Vellum Claim Cell Protocol](https://github.com/truthixify/vellum/blob/main/docs/claim-cell.md)

- [ ] **Step 1: Write failing unit test for Vellum deployment constants**

Create `tests/unit/credentials/vellumDeployments.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import {
  VELLUM_CLAIM_TYPE_DEPLOYMENT,
  VELLUM_DID_LOCK_DEPLOYMENT,
  getVellumScriptConfig,
} from "@/lib/credentials/vellumClaim";

describe("Vellum Testnet Deployments", () => {
  it("has official Testnet Claim Type deployment locators", () => {
    expect(VELLUM_CLAIM_TYPE_DEPLOYMENT.codeHash).toBe(
      "0xfb2757e524b3f83161d8b85b8b3e00186e2019ff04f5dfe833c5a72731e13157"
    );
    expect(VELLUM_CLAIM_TYPE_DEPLOYMENT.hashType).toBe("type");
    expect(VELLUM_CLAIM_TYPE_DEPLOYMENT.cellDep.outPoint.txHash).toBe(
      "0xaf693346282063a5d51f79d180fc807cdba1b8ac9d7af30085ff0aa190e2686c"
    );
    expect(VELLUM_CLAIM_TYPE_DEPLOYMENT.cellDep.outPoint.index).toBe(0);
  });

  it("has official Testnet DID Lock deployment locators", () => {
    expect(VELLUM_DID_LOCK_DEPLOYMENT.codeHash).toBe(
      "0xe1562cc57b4bd91619ada2f7e74d63805ea7038a7b6de0b18a529d51aa883d2d"
    );
    expect(VELLUM_DID_LOCK_DEPLOYMENT.hashType).toBe("type");
    expect(VELLUM_DID_LOCK_DEPLOYMENT.cellDep.outPoint.txHash).toBe(
      "0xaf693346282063a5d51f79d180fc807cdba1b8ac9d7af30085ff0aa190e2686c"
    );
    expect(VELLUM_DID_LOCK_DEPLOYMENT.cellDep.outPoint.index).toBe(1);
  });

  it("generates valid ClaimScriptConfigLike compatible with @usevellum/sdk", () => {
    const config = getVellumScriptConfig();
    expect(config.claimType.codeHash).toBe(VELLUM_CLAIM_TYPE_DEPLOYMENT.codeHash);
    expect(config.didLock?.codeHash).toBe(VELLUM_DID_LOCK_DEPLOYMENT.codeHash);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/credentials/vellumDeployments.test.ts`
Expected: FAIL - symbols not defined

- [ ] **Step 3: Implement deployment constants and script config generator**

In `src/lib/credentials/vellumClaim.ts`:
```typescript
export const VELLUM_DEPLOYMENT_TX_HASH =
  "0xaf693346282063a5d51f79d180fc807cdba1b8ac9d7af30085ff0aa190e2686c" as `0x${string}`;

export const VELLUM_CLAIM_TYPE_DEPLOYMENT = {
  codeHash:
    "0xfb2757e524b3f83161d8b85b8b3e00186e2019ff04f5dfe833c5a72731e13157" as `0x${string}`,
  hashType: "type" as ccc.HashType,
  cellDep: {
    outPoint: {
      txHash: VELLUM_DEPLOYMENT_TX_HASH,
      index: 0,
    },
    depType: "code" as ccc.DepType,
  },
};

export const VELLUM_DID_LOCK_DEPLOYMENT = {
  codeHash:
    "0xe1562cc57b4bd91619ada2f7e74d63805ea7038a7b6de0b18a529d51aa883d2d" as `0x${string}`,
  hashType: "type" as ccc.HashType,
  cellDep: {
    outPoint: {
      txHash: VELLUM_DEPLOYMENT_TX_HASH,
      index: 1,
    },
    depType: "code" as ccc.DepType,
  },
};

export function getVellumScriptConfig(): {
  claimType: ccc.ScriptInfoLike;
  didLock: ccc.ScriptInfoLike;
} {
  return {
    claimType: {
      codeHash: VELLUM_CLAIM_TYPE_DEPLOYMENT.codeHash,
      hashType: VELLUM_CLAIM_TYPE_DEPLOYMENT.hashType,
      cellDeps: [
        {
          cellDep: VELLUM_CLAIM_TYPE_DEPLOYMENT.cellDep,
        },
      ],
    },
    didLock: {
      codeHash: VELLUM_DID_LOCK_DEPLOYMENT.codeHash,
      hashType: VELLUM_DID_LOCK_DEPLOYMENT.hashType,
      cellDeps: [
        {
          cellDep: VELLUM_DID_LOCK_DEPLOYMENT.cellDep,
        },
      ],
    },
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/credentials/vellumDeployments.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/credentials/vellumClaim.ts tests/unit/credentials/vellumDeployments.test.ts
git commit -m "feat(vellum): add official Testnet deployments for Claim Type and DID Lock

- Add VELLUM_CLAIM_TYPE_DEPLOYMENT with correct codeHash and CellDep
- Add VELLUM_DID_LOCK_DEPLOYMENT with correct codeHash and CellDep
- Add getVellumScriptConfig() for SDK integration

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 3: Pure SDK Integration with writeClaim (No Mock/Fallback in Source Code) (Fix Note 4)

**Files:**
- Modify: `src/lib/credentials/vellumClaim.ts`
- Modify: `src/lib/credentials/issuer.ts`
- Test: `tests/integration/vellumClaim.integration.test.ts`

**SDK API Verification:**
Before implementation, verify `@usevellum/sdk` `writeClaim()` interface:
```bash
# Check SDK source for exact API
cat node_modules/@usevellum/sdk/dist/index.d.ts
```

Expected interface:
```typescript
writeClaim(props: {
  issuerSigner: ccc.Signer;
  scripts: ClaimScriptConfigLike;
  input: {
    subject: { did: string };
    issuerDid: string;
    schemaHash: string;
    payload: unknown;
    issuedAt: number | bigint;
    expiresAt?: number | bigint;
  };
  tx: ccc.TransactionLike;
}): Promise<{ claimId: string; tx: ccc.TransactionLike }>;
```

**Note:** `issuerDid` is now a required parameter - no default. Caller must provide the issuer DID.

- [ ] **Step 1: Verify SDK API interface**

```bash
cat node_modules/@usevellum/sdk/dist/index.d.ts | grep -A 30 "writeClaim"
```

Document the exact interface in code comments.

- [ ] **Step 2: Write integration test for pure writeClaim call**

In `tests/integration/vellumClaim.integration.test.ts`:
```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock @usevellum/sdk
vi.mock("@usevellum/sdk", () => ({
  writeClaim: vi.fn().mockResolvedValue({
    claimId: "claim_test123",
    tx: { outputs: [] },
  }),
}));

describe("Vellum Claim SDK Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call writeClaim with correct parameters", async () => {
    const { writeClaim } = await import("@usevellum/sdk");
    const { issueVellumClaimCell } = await import("@/lib/credentials/vellumClaim");

    const mockSigner = {} as ccc.Signer;
    const mockTx = {} as ccc.TransactionLike;

    await issueVellumClaimCell({
      signer: mockSigner,
      tx: mockTx,
      claimRecipientDid: "did:ckb:test123",
      issuerDid: "did:ckb:issuer456",
      sporeId: "0x1234567890abcdef",
      courseId: "course-001",
      issuerName: "Test Academy",
      issuedAt: Date.now(),
    });

    expect(writeClaim).toHaveBeenCalledWith(
      expect.objectContaining({
        issuerSigner: mockSigner,
        scripts: expect.objectContaining({
          claimType: expect.anything(),
          didLock: expect.anything(),
        }),
        input: expect.objectContaining({
          subject: { did: "did:ckb:test123" },
          issuerDid: "did:ckb:issuer456",
          schemaHash: expect.stringMatching(/^0x[a-f0-9]{64}$/),
          payload: expect.objectContaining({
            spore_id: "0x1234567890abcdef",
            course_id: "course-001",
          }),
        }),
        tx: mockTx,
      })
    );
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run tests/integration/vellumClaim.integration.test.ts`
Expected: FAIL - issueVellumClaimCell not defined

- [ ] **Step 4: Implement issueVellumClaimCell in vellumClaim.ts**

In `src/lib/credentials/vellumClaim.ts`:
```typescript
import { writeClaim } from "@usevellum/sdk";

export interface IssueVellumClaimParams {
  signer: ccc.Signer;
  tx: ccc.TransactionLike;
  claimRecipientDid: string;
  issuerDid: string;
  sporeId: string;
  courseId: string;
  issuerName: string;
  issuedAt: number;
  expiresAt?: number;
  grade?: string;
}

/**
 * Issue a Vellum Claim Cell using @usevellum/sdk writeClaim.
 * Directly appends the Claim Cell output and required dependencies to the transaction.
 * Pure implementation without mock or fallback in source code.
 */
export async function issueVellumClaimCell(
  params: IssueVellumClaimParams
): Promise<{ claimId: string; tx: ccc.TransactionLike }> {
  const payload = buildCredoraCoursePayload({
    sporeId: params.sporeId,
    courseId: params.courseId,
    subjectDid: params.claimRecipientDid,
    issuerName: params.issuerName,
    issuedAt: params.issuedAt,
    expiresAt: params.expiresAt,
    grade: params.grade,
  });

  if (!isValidCredoraCoursePayload(payload)) {
    throw new Error("Invalid CredoraCoursePayload");
  }

  const scripts = getVellumScriptConfig();

  // Direct call to @usevellum/sdk writeClaim
  const result = await writeClaim({
    issuerSigner: params.signer,
    scripts,
    input: {
      subject: { did: params.claimRecipientDid },
      issuerDid: params.issuerDid,
      schemaHash: CredoraCourseSchemaHash,
      payload,
      issuedAt: params.issuedAt,
      expiresAt: params.expiresAt,
    },
    tx: params.tx,
  });

  return { claimId: result.claimId, tx: result.tx };
}
```

- [ ] **Step 5: Update issuer.ts to use issueVellumClaimCell**

In `src/lib/credentials/issuer.ts`, update `IssueCertificateParams` and `issueCertificate`:
```typescript
interface IssueCertificateParams {
  // ... existing fields
  withVellumClaim?: boolean;
  /** Required when withVellumClaim is true: DID of the certificate holder */
  recipientDid?: string;
  /** Required when withVellumClaim is true: DID of the issuer/organization */
  issuerDid?: string;
}
```

And in `issueCertificate` function, replace manual Claim Cell creation with:
```typescript
      if (params.withVellumClaim && resolvedDid) {
        if (!params.issuerDid) {
          throw new Error("issuerDid is required when withVellumClaim is true");
        }
        const claimResult = await issueVellumClaimCell({
          signer: liveSigner,
          tx,
          claimRecipientDid: resolvedDid,
          issuerDid: params.issuerDid,
          sporeId: sporeId || certificateId,
          courseId:
            (subject as any).course?.id ||
            (subject as any).courseId ||
            subject.courseName ||
            "unknown",
          issuerName,
          issuedAt: Math.floor(Date.now() / 1000),
          expiresAt: expirationDate
            ? Math.floor(new Date(expirationDate).getTime() / 1000)
            : undefined,
          grade: subject.grade,
        });

        claimId = claimResult.claimId;
      }
```

- [ ] **Step 6: Run integration and unit tests**

Run: `npx vitest run tests/integration/vellumClaim.integration.test.ts tests/unit/credentials/issuer.test.ts`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/lib/credentials/vellumClaim.ts src/lib/credentials/issuer.ts tests/integration/vellumClaim.integration.test.ts
git commit -m "feat(vellum): integrate @usevellum/sdk writeClaim directly

- Add issueVellumClaimCell() using pure SDK integration
- issuerDid is now required parameter (no default)
- Remove manual Claim Cell construction

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 4: Complete Suite Verification and Plan Notes Resolution

**Files:**
- Test: All tests across the repository
- Update: `docs/superpowers/plans/2026-09-26-vellum-phase2-dual-output.md`

- [ ] **Step 1: Run the full test suite**

Run: `npm run test:run`
Expected: All 39+ test files PASS with 0 failures

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck`
Expected: No errors

- [ ] **Step 3: Update previous plan notes**

Update `docs/superpowers/plans/2026-09-26-vellum-phase2-dual-output.md` section `Post-Implementation Notes`:
```markdown
## Post-Implementation Notes (Resolved)

1. **Schema Hash**: ✅ Computed from actual schema manifest using RFC 8785 JCS + CKB BLAKE2b-256
2. **Claim Type Script**: ✅ Using official Testnet deployment `0xfb27...` with CellDep
3. **DID Lock Script**: ✅ Using official Testnet deployment `0xe156...` with CellDep; SDK handles args construction
4. **Real SDK Integration**: ✅ Pure `writeClaim()` integration without fallback

Resolution: docs/superpowers/plans/2026-09-27-vellum-real-sdk-and-testnet-scripts.md
```

- [ ] **Step 4: Commit**

```bash
git add docs/superpowers/plans/2026-09-26-vellum-phase2-dual-output.md
git commit -m "docs(vellum): resolve all post-implementation notes

All 4 notes from Phase 2 are now resolved:
- Schema hash computed from canonical manifest
- Real Testnet contract deployments
- Pure SDK integration without fallbacks

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Summary

| Task | Type | Description |
|------|------|-------------|
| Task 1 | Feature | Canonical schema manifest with RFC 8785 JCS |
| Task 2 | Feature | Real Testnet deployments for Claim Type & DID Lock |
| Task 3 | Feature | Pure `@usevellum/sdk` `writeClaim()` integration |
| Task 4 | Verification | Full test suite + plan notes resolution |

**Total Tasks:** 4

---

## Key Changes from Original Plan

1. **Schema Hash**: Computed from actual manifest, not hardcoded
2. **issuerDid**: Now required parameter (removed `DEFAULT_CREDORA_ISSUER_DID`)
3. **JCS Implementation**: Proper RFC 8785 canonicalization with test
4. **SDK API**: Verified before implementation
5. **DID Lock**: Documented that SDK handles args construction automatically

---

*Plan updated: September 2026*
