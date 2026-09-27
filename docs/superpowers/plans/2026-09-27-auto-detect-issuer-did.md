# Auto-Detect Issuer DID for Vellum Claim Cells Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Automatically detect the connected wallet's on-chain CKB DID via its Lock Script upon login, auto-populate it as `issuerDid` for Vellum Claim Cells, and disable Claim Cell creation if the connected wallet has no registered DID on CKB.

**Architecture:**
1. Query on-chain DID cells using `@ckb-ccc/did-ckb`'s `listDidCkbsByLock({ client, lock })` to detect if the connected wallet owns any `did:ckb:` records.
2. Expose `issuerDid` and `isLoadingIssuerDid` through the application's `useWallet` hook.
3. In `CertificateForm`, when a recipient is a DID:
   - If the issuer wallet has a registered DID, auto-fill `issuerDid` and enable the Vellum Claim Cell option.
   - If the issuer wallet has NO registered DID, disable the Vellum option and show a clear informative banner explaining that an on-chain DID is required to issue Vellum Claims.
4. Pass `issuerDid` explicitly from `CertificateForm` through `issue/page.tsx` into `issueCertificate()`, preserving the strict requirement in the Core SDK.

**Tech Stack:** Next.js 14, React 18, TypeScript, `@ckb-ccc/core`, `@ckb-ccc/did-ckb`, `@usevellum/sdk`, Vitest, React Testing Library.

**Spec / Requirements:**
- Auto-detect: When wallet logs in, look up whether wallet has a DID on CKB (via Lock Script).
- If wallet has DID: Auto-populate this DID as `issuerDid`.
- If wallet does NOT have a DID: Cannot create certificate with Claim Cell (disable toggle + clear explanation).

---

## File Structure & Responsibilities

| File | Responsibility |
|------|----------------|
| `src/lib/did/index.ts` | Add `findDidByLock` and `findIssuerDid` functions using `@ckb-ccc/did-ckb` |
| `tests/unit/did/resolver.test.ts` | Unit tests for `findDidByLock` and `findIssuerDid` |
| `src/hooks/useWallet.ts` | Integrate DID lookup on connect; expose `issuerDid` and `isLoadingIssuerDid` |
| `tests/unit/hooks/useWallet.test.ts` | Unit tests for wallet DID detection behavior |
| `src/components/certificate/CertificateForm.tsx` | Add `issuerDid` to `CertificateData`; enforce Vellum disablement when no issuer DID; show detected DID badge |
| `tests/unit/certificate/CertificateForm.test.tsx` | Unit tests for form behavior with & without issuer DID |
| `src/app/certificates/issue/page.tsx` | Pass `data.issuerDid` into `issueCertificate` |

---

## Key Parameter Naming

| Parameter | Type | Description |
|-----------|------|-------------|
| `recipientDid` | `string \| undefined` | DID of the certificate recipient (from previous plan) |
| `issuerDid` | `string \| undefined` | DID of the certificate issuer/organization (Credora platform) |

---

## Tasks

### Task 1: Add `findDidByLock` and `findIssuerDid` to DID Library

**Files:**
- Modify: `src/lib/did/index.ts`
- Test: `tests/unit/did/resolver.test.ts`

**Interfaces:**
- Consumes: `@ckb-ccc/core` (`ccc.Client`, `ccc.ScriptLike`, `ccc.Signer`), `@ckb-ccc/did-ckb` (`listDidCkbsByLock`, `DidCkbRecord`)
- Produces:
  - `findDidByLock(client: ccc.Client, lock: ccc.ScriptLike): Promise<string | null>`
  - `findIssuerDid(signer: ccc.Signer): Promise<string | null>`

- [ ] **Step 1: Write unit tests in `tests/unit/did/resolver.test.ts`**

Add tests covering:
1. `findDidByLock` returns the DID string when `listDidCkbsByLock` finds at least one record.
2. `findDidByLock` returns `null` when `listDidCkbsByLock` returns an empty array.
3. `findDidByLock` handles errors gracefully and returns `null`.
4. `findIssuerDid` extracts lock script from `signer.getRecommendedAddressObj()` and calls `findDidByLock`.

**Important**: Add mock setup for `listDidCkbsByLock`:
```typescript
// At top of test file
vi.mock('@ckb-ccc/did-ckb', () => ({
  listDidCkbsByLock: vi.fn(),
}));

// In tests
import { listDidCkbsByLock } from '@ckb-ccc/did-ckb';

// Mock return value
vi.mocked(listDidCkbsByLock).mockResolvedValue([
  { did: 'did:ckb:test123', lock: { args: '0x', codeHash: '0x', hashType: 'type' } }
]);

// Mock empty return
vi.mocked(listDidCkbsByLock).mockResolvedValue([]);

// Mock error
vi.mocked(listDidCkbsByLock).mockRejectedValue(new Error('Network error'));
```

- [ ] **Step 2: Run test to confirm it fails**

Run: `npx vitest run tests/unit/did/resolver.test.ts`
Expected: FAIL (functions not yet exported)

- [ ] **Step 3: Implement `findDidByLock` and `findIssuerDid` in `src/lib/did/index.ts`**

```typescript
import { listDidCkbsByLock } from "@ckb-ccc/did-ckb";

/**
 * Look up whether a lock script owns any registered did:ckb on-chain
 */
export async function findDidByLock(
  client: ccc.Client,
  lock: ccc.ScriptLike
): Promise<string | null> {
  try {
    const records = await listDidCkbsByLock({ client, lock });
    if (records && records.length > 0 && records[0].did) {
      return records[0].did;
    }
    return null;
  } catch (err) {
    console.warn("Failed to lookup DID by lock:", err);
    return null;
  }
}

/**
 * Look up whether the connected signer owns a registered did:ckb on-chain
 */
export async function findIssuerDid(
  signer: ccc.Signer
): Promise<string | null> {
  try {
    const addressObj = await signer.getRecommendedAddressObj();
    return await findDidByLock(signer.client, addressObj.script);
  } catch (err) {
    console.warn("Failed to lookup issuer DID for signer:", err);
    return null;
  }
}
```

- [ ] **Step 4: Run test to confirm it passes**

Run: `npx vitest run tests/unit/did/resolver.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/did/index.ts tests/unit/did/resolver.test.ts
git commit -m "feat(did): add findDidByLock and findIssuerDid helpers using listDidCkbsByLock"
```

---

### Task 2: Expose `issuerDid` and `isLoadingIssuerDid` in `useWallet`

**Files:**
- Modify: `src/hooks/useWallet.ts`
- Test: `tests/unit/hooks/useWallet.test.ts`

**Interfaces:**
- Consumes: `findIssuerDid` from `@/lib/did`
- Produces: `useWallet` hook returning `{ address, balance, signer, client, issuerDid, isLoadingIssuerDid, ... }`

**Notes:**
- Loading state: `isLoadingIssuerDid` starts as `false`, becomes `true` during lookup, then `false` when done
- Race condition handling: Use `isCancelled` ref to prevent state updates after unmount
- No caching: Each wallet connect triggers a fresh lookup

- [ ] **Step 1: Write test for `useWallet` DID auto-detection**

```typescript
// tests/unit/hooks/useWallet.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useWallet } from '@/hooks/useWallet';

// Mock findIssuerDid
vi.mock('@/lib/did', () => ({
  findIssuerDid: vi.fn(),
}));

describe('useWallet issuer DID auto-detection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('resolves issuerDid when signer is present and has a registered DID', async () => {
    const { findIssuerDid } = await import('@/lib/did');
    vi.mocked(findIssuerDid).mockResolvedValue('did:ckb:test123');

    // Mock wallet connect
    // ... render and test
  });

  it('sets issuerDid to null when signer has no registered DID', async () => {
    const { findIssuerDid } = await import('@/lib/did');
    vi.mocked(findIssuerDid).mockResolvedValue(null);

    // ... test
  });

  it('sets issuerDid to null on disconnect', async () => {
    // ... test
  });

  it('shows isLoadingIssuerDid true during lookup', async () => {
    const { findIssuerDid } = await import('@/lib/did');
    vi.mocked(findIssuerDid).mockImplementation(() => new Promise(r => setTimeout(r, 100)));

    // ... test isLoadingIssuerDid is true then false
  });
});
```

- [ ] **Step 2: Update `src/hooks/useWallet.ts`**

Add state for `issuerDid` and `isLoadingIssuerDid`:
```typescript
const [issuerDid, setIssuerDid] = useState<string | null>(null);
const [isLoadingIssuerDid, setIsLoadingIssuerDid] = useState(false);
```

In the `loadAddressAndBalance` flow:
```typescript
// Query on-chain DID for the connected signer
if (signer && client) {
  setIsLoadingIssuerDid(true);
  try {
    const detectedDid = await findIssuerDid(signer);
    if (!isCancelled) {
      setIssuerDid(detectedDid);
    }
  } catch (err) {
    console.warn('Failed to detect issuer DID:', err);
    if (!isCancelled) {
      setIssuerDid(null);
    }
  } finally {
    if (!isCancelled) {
      setIsLoadingIssuerDid(false);
    }
  }
}

// Clear DID on disconnect
if (!signer && !isCancelled) {
  setIssuerDid(null);
  setIsLoadingIssuerDid(false);
}
```

Expose in return object:
```typescript
return {
  // ... existing fields
  issuerDid,
  isLoadingIssuerDid,
};
```

- [ ] **Step 3: Run tests to verify**

Run: `npx vitest run tests/unit/hooks/useWallet.test.ts`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useWallet.ts tests/unit/hooks/useWallet.test.ts
git commit -m "feat(wallet): auto-detect issuer DID via lock script on wallet connection"
```

---

### Task 3: Update `CertificateForm` with Auto-Detection, Validation, and Disabling

**Files:**
- Modify: `src/components/certificate/CertificateForm.tsx`
- Test: `tests/unit/certificate/CertificateForm.test.tsx`

**Interfaces:**
- Consumes: `issuerDid` and `isLoadingIssuerDid` from `useWallet()`
- Produces:
  - `CertificateData.issuerDid?: string`
  - Vellum Claim toggle disabled if `issuerDid === null` or `isLoadingIssuerDid === true`
  - Informative banner explaining DID requirement when disabled
  - Verified Issuer DID badge when enabled
  - Submits `withVellumClaim: true` and `issuerDid: string`

- [ ] **Step 1: Update `CertificateData` interface in `CertificateForm.tsx`**

```typescript
export interface CertificateData {
  // ... existing fields
  withVellumClaim?: boolean;
  issuerDid?: string;
}
```

- [ ] **Step 2: Update Form Logic & UI in `CertificateForm.tsx`**

1. Read `issuerDid` and `isLoadingIssuerDid` from `useWallet()`.
2. Sync `formData.issuerDid` when `issuerDid` changes.
3. If `!issuerDid && addToVellum`: auto-uncheck `addToVellum` and `withVellumClaim: false`.
4. Use `isDidCkb()` from `@ckb-ccc/did-ckb` to validate recipient DID:
   ```typescript
   import { isDidCkb } from '@ckb-ccc/did-ckb';

   const isRecipientDid = isDidCkb(data.recipientAddress);
   ```
5. In JSX for the Vellum Section (when `isRecipientDid` is true):
   - If `isLoadingIssuerDid`: show skeleton/spinner "Checking issuer DID on CKB...".
   - If `issuerDid` is present:
     - Render checkbox `Add to Vellum (Claim Cell) (+350 CKB)`.
     - When checked, show:
       ```tsx
       <div className="flex items-center gap-2 text-xs text-lavender-spark bg-lavender-spark/10 p-2.5 rounded-lg border border-lavender-spark/20">
         <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
         <span>Issuer DID: <strong className="font-mono text-bone-white">{issuerDid}</strong> (Detected from connected wallet)</span>
       </div>
       ```
   - If `!issuerDid` (not loading):
     - Render checkbox as `disabled`.
     - Show warning banner:
       ```tsx
       <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs">
         <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
         <div>
           <p className="font-medium text-amber-300">Issuer DID required for Vellum</p>
           <p className="mt-0.5 text-amber-200/80">
             Your connected wallet has no registered DID on CKB. To issue Vellum Claim Cells, your wallet must own an on-chain CKB DID.
           </p>
         </div>
       </div>
       ```
6. In `handleSubmit`:
   ```typescript
   onSubmit({
     ...formData,
     expirationDate: formData.expirationDate ? formData.expirationDate : undefined,
     skills: skillsInput ? skillsInput.split(',').map((s) => s.trim()).filter(Boolean) : undefined,
     withVellumClaim: Boolean(addToVellum && issuerDid && isRecipientDid),
     issuerDid: addToVellum && issuerDid ? issuerDid : undefined,
   });
   ```
7. In `previewCertificateMint`:
   Pass `issuerDid: issuerDid || undefined`.

- [ ] **Step 3: Update `tests/unit/certificate/CertificateForm.test.tsx`**

Mock `useWallet` to provide different `issuerDid` states:

```typescript
// Mock useWallet hook
vi.mock('@/hooks/useWallet', () => ({
  useWallet: vi.fn().mockReturnValue({
    issuerDid: 'did:ckb:test123',
    isLoadingIssuerDid: false,
  }),
}));

// Test case: When useWallet provides an issuerDid, Vellum toggle is enabled
// Test case: When useWallet provides issuerDid: null, Vellum toggle is disabled and shows warning
// Test case: When isLoadingIssuerDid is true, shows loading state
```

- [ ] **Step 4: Run form unit tests to verify**

Run: `npx vitest run tests/unit/certificate/CertificateForm.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/certificate/CertificateForm.tsx tests/unit/certificate/CertificateForm.test.tsx
git commit -m "feat(ui): auto-populate issuerDid in CertificateForm and disable Claim Cells when wallet has no DID"
```

---

### Task 4: Connect `issuerDid` in `src/app/certificates/issue/page.tsx`

**Files:**
- Modify: `src/app/certificates/issue/page.tsx`
- Test: Full integration test & test suite

**Interfaces:**
- Consumes: `CertificateData` containing `withVellumClaim` and `issuerDid` from `CertificateForm`
- Calls: `issueCertificate({ ..., withVellumClaim: data.withVellumClaim, issuerDid: data.issuerDid })`

- [ ] **Step 1: Update `issueMutation` in `src/app/certificates/issue/page.tsx`**

Pass `issuerDid` explicitly (note: `recipientDid` is the recipient's DID, `issuerDid` is the issuer's DID):

```typescript
return issueCertificate({
  signer,
  clusterId: activeClusterId,
  issuerName: cluster.name,
  issuerDescription: cluster.description,
  subject: {
    id: data.recipientAddress,
    type: 'CourseCertificate',
    name: data.recipientName,
    courseName: data.courseName,
    completionDate: data.completionDate,
    grade: data.grade,
    score: data.score,
    skills: data.skills,
    metadata: {
      layout: data.layout,
      theme: data.theme,
      customColor: data.customColor,
      customTitle: data.customTitle,
    },
  },
  expirationDate: data.expirationDate,
  // Only enable Vellum Claim if: checkbox checked AND recipient is DID AND issuer has DID
  withVellumClaim: data.withVellumClaim && Boolean(data.issuerDid),
  // recipientDid: DID of the certificate recipient (used for Vellum Claim Cell lock)
  recipientDid: data.recipientAddress,
  // issuerDid: DID of the certificate issuer/organization (required for Vellum Claim)
  issuerDid: data.issuerDid,
});
```

**Important**: Both `recipientDid` and `issuerDid` are passed to `issueCertificate`. The function validates:
- If `withVellumClaim` is true, both must be valid DIDs
- The Claim Cell's lock uses the recipient's DID-derived lock
- The Claim Cell's authorization requires the issuer's DID controller

- [ ] **Step 2: Run all unit and integration tests**

Run: `npm run test:run`
Expected: All 41+ test files PASS with 0 failures

- [ ] **Step 3: Run typecheck**

Run: `npm run typecheck`
Expected: 0 errors

- [ ] **Step 4: Run production build**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 5: Commit**

```bash
git add src/app/certificates/issue/page.tsx
git commit -m "fix(issue): pass auto-detected issuerDid to issueCertificate"
```

---

## Verification Checklist

1. [ ] Auto-detection: `findDidByLock` correctly uses `listDidCkbsByLock` from `@ckb-ccc/did-ckb`.
2. [ ] Wallet state: `useWallet` provides `issuerDid` (`string | null`) and `isLoadingIssuerDid` (`boolean`).
3. [ ] If wallet HAS DID:
   - Checkbox "Add to Vellum (Claim Cell)" is enabled.
   - UI shows verified badge with the detected DID string.
   - When submitted, `issueCertificate` receives the detected `issuerDid`.
   - No `issuerDid is required` error occurs.
4. [ ] If wallet HAS NO DID:
   - Checkbox "Add to Vellum (Claim Cell)" is disabled.
   - UI displays clear warning explaining why Claim Cell is unavailable.
   - Certificate can still be minted as Spore DOB (single output).
5. [ ] Loading state: "Checking issuer DID..." shown during DID lookup.
6. [ ] DID validation: Uses `isDidCkb()` for proper DID format validation.
7. [ ] Full test suite (`npm run test:run`): 100% pass (390+ tests).
8. [ ] Typecheck (`npm run typecheck`): 0 errors.
9. [ ] Build (`npm run build`): Next.js production build succeeds.

---

## Summary

| Task | Type | Description |
|------|------|-------------|
| Task 1 | Feature | `findDidByLock` and `findIssuerDid` helpers |
| Task 2 | Feature | Expose `issuerDid` and `isLoadingIssuerDid` in `useWallet` |
| Task 3 | UI | Update `CertificateForm` with auto-detection and disable logic |
| Task 4 | Integration | Connect `issuerDid` to `issueCertificate` |

**Total Tasks:** 4

---

## Key Changes from Original Plan

1. **Mock setup**: Added explicit `vi.mock('@ckb-ccc/did-ckb')` setup for tests
2. **DID validation**: Use `isDidCkb()` instead of string prefix check
3. **Parameter naming**: Clarified `recipientDid` vs `issuerDid` distinction
4. **Loading state**: Added to verification checklist
5. **Race condition**: Added `isCancelled` ref handling in `useWallet`

---

*Plan updated: September 2026*
