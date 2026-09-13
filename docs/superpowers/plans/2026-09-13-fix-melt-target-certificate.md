# Fix meltCertificate Target Resolution Bug

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ensure `meltCertificate` strictly targets and melts only the specified certificate, eliminating the bug where melting Certificate B accidentally melts Certificate A.

**Architecture:**
1. Remove indiscriminate `certificateCache` iteration in `meltCertificate` — only use THIS certificate's cached data.
2. Add DNA verification: confirm cell's DNA ID matches target certificate before melting.
3. Fix `getCertificate` lookup to search by `sporeId`, `certificate.id`, and `txHash`.
4. Fix deduplication in `getAllCertificates` and `getHolderCertificates` to use unique IDs.
5. Fix cache deletion to only remove THIS certificate's entries.

**Tech Stack:** TypeScript, CKB SDK (@ckb-ccc/core, @ckb-ccc/spore), Vitest

**Spec:** `docs/Design_spec/03_Certificate_Service.md`

## Global Constraints

- Never melt a cell without verifying its DNA ID matches the requested certificate.
- Fail explicitly with an informative error if a cell is not yet indexed or pending on-chain, rather than falling back to other cells.
- Maintain full compatibility with both 66-character hex Spore IDs (0x + 64 hex) and 34-character DNA IDs (0x + 32 hex from `generateCertificateId`).
- Never iterate over all cache entries to build candidate IDs — only use THIS certificate's cached data.

---

## File Structure

| File | Responsibility |
|------|---------------|
| `src/lib/credentials/issuer.ts` | Certificate issuer, getter, and melter — PRIMARY fix location |
| `tests/unit/credentials/issuer.test.ts` | Unit tests for issuer module — ADD failing tests here |

**Key Line References in `src/lib/credentials/issuer.ts`:**
- `getCertificate`: lines ~200-260
- `getAllCertificates` deduplication: lines ~460-500
- `meltCertificate` Priority 3 bug: lines ~652-673
- `meltCertificate` cache deletion bug: lines ~762-773

---

## Root Cause Summary

### Bug 1: Priority 3 Indiscriminate Cache Iteration (lines 652-660)

```typescript
// CURRENT BUGGY CODE:
for (const [key, item] of certificateCache.entries()) {
  if (item.sporeId && item.sporeId.startsWith('0x') && item.sporeId.length === 66) {
    if (!candidateIds.includes(item.sporeId)) candidateIds.push(item.sporeId);
  }
  if (item.txHash && item.txHash.startsWith('0x') && item.txHash.length === 66) {
    if (!candidateIds.includes(item.txHash)) candidateIds.push(item.txHash);
  }
}
```

This loops over ALL certificates in cache and adds every sporeId/txHash to `candidateIds`. If Certificate A was issued first, its sporeId is at `candidateIds[0]`. When `findSpore` fails to find Certificate B's (still pending), it falls back to Certificate A and melts the wrong one.

### Bug 2: No DNA Verification After findSpore

After finding a Spore cell, code never verifies the cell's DNA ID matches the target certificate. It should:
1. Extract DNA from cell outputData
2. Compare `certDna.id === certRecord.certificate.id`
3. If mismatch, continue to next candidate (or throw error)

### Bug 3: Cache Lookup Only Checks txHash

`getCertificate` only searches by `txHash` in cache, missing certificates keyed by `sporeId` or `certificate.id`.

### Bug 4: Deduplication Drops Certificates with Same txHash

`getAllCertificates` skips certificates if another entry with the same `txHash` already exists. This drops Certificate B when sharing a batch transaction.

### Bug 5: Cache Deletion Removes All Entries with Same txHash

Lines 762-773 delete every cache entry matching `txHash`, potentially removing unrelated certificates.

---

## Task 1: Write Failing Unit Tests Reproducing the Cross-Melt Issue

**Files:**
- Modify: `tests/unit/credentials/issuer.test.ts` (add tests inside `describe('meltCertificate', ...)`)

**Interfaces:**
- Consumes: `issueCertificate`, `meltCertificate`, `getCertificate`, `clearCertificateCache` from `src/lib/credentials/issuer`
- Produces: Failing tests reproducing the cross-melt bug

- [x] **Step 1: Add failing tests for multi-certificate melt scenarios**

Add these tests inside the existing `describe('meltCertificate', ...)` block (after line 572):

```typescript
// Test 1: melts only the target certificate when multiple certificates exist in cache
it('should melt only the target certificate when multiple certificates exist in cache', async () => {
  // 1. Issue Certificate A
  const issuedA = await issueCertificate({
    signer: createMockSigner(),
    clusterId: testClusterId,
    issuerName: testIssuerName,
    subject: { id: validRecipientAddress, type: 'CourseCertificate', courseName: 'Course A', completionDate: '2024-01-01' },
  });

  // 2. Issue Certificate B
  const issuedB = await issueCertificate({
    signer: createMockSigner(),
    clusterId: testClusterId,
    issuerName: testIssuerName,
    subject: { id: validRecipientAddress, type: 'CourseCertificate', courseName: 'Course B', completionDate: '2024-02-01' },
  });

  expect(issuedA.certificateId).not.toEqual(issuedB.certificateId);

  const mockClient = {
    getCell: vi.fn().mockResolvedValue({
      output: {
        lock: { args: validRecipientAddress, codeHash: '0xabcd', hashType: 'type' },
      },
      outPoint: { txHash: issuedB.transactionHash, index: '0x0' },
    }),
  };

  const mockHolderSigner = {
    client: mockClient,
    sendTransaction: vi.fn().mockResolvedValue('0x' + 'c'.repeat(64)),
    signTransaction: vi.fn().mockReturnValue({}),
    getRecommendedAddressObj: vi.fn().mockResolvedValue({
      toString: () => validRecipientAddress,
      script: { args: validRecipientAddress, codeHash: '0xabcd', hashType: 'type' },
    }),
  };

  // Mock findSpore to return cell matching the queried ID
  vi.mocked(findSpore).mockImplementation(async (_client, id) => {
    const idStr = String(id);
    if (idStr === issuedA.sporeId || idStr === issuedA.certificateId) {
      return {
        cell: {
          cellOutput: {
            lock: { args: validRecipientAddress, codeHash: '0xabcd', hashType: 'type' },
          },
          outputData: new TextEncoder().encode(JSON.stringify({
            '@context': ['https://www.w3.org/2018/credentials/v1'],
            id: issuedA.certificateId,
            type: ['VerifiableCredential', 'CourseCertificate'],
            issuer: { id: testClusterId },
            credentialSubject: { type: 'CourseCertificate' },
          })),
        },
      } as any;
    }
    if (idStr === issuedB.sporeId || idStr === issuedB.certificateId) {
      return {
        cell: {
          cellOutput: {
            lock: { args: validRecipientAddress, codeHash: '0xabcd', hashType: 'type' },
          },
          outputData: new TextEncoder().encode(JSON.stringify({
            '@context': ['https://www.w3.org/2018/credentials/v1'],
            id: issuedB.certificateId,
            type: ['VerifiableCredential', 'CourseCertificate'],
            issuer: { id: testClusterId },
            credentialSubject: { type: 'CourseCertificate' },
          })),
        },
      } as any;
    }
    return undefined;
  });

  const mockTx = {
    completeInputsByCapacity: vi.fn().mockResolvedValue(undefined),
    completeFeeBy: vi.fn().mockResolvedValue(undefined),
  };
  vi.mocked(meltSpore).mockResolvedValue({ tx: mockTx as any });

  // Action: Melt Certificate B
  const { meltCertificate: meltCert } = await import('../../../src/lib/credentials/issuer');
  const result = await meltCert(mockHolderSigner, issuedB.certificateId);

  expect(result.transactionHash).toBeDefined();

  // Assert: meltSpore must be called with Certificate B's sporeId, NOT Certificate A
  expect(vi.mocked(meltSpore)).toHaveBeenCalledWith(
    expect.objectContaining({
      id: issuedB.sporeId,
    })
  );
  expect(vi.mocked(meltSpore)).not.toHaveBeenCalledWith(
    expect.objectContaining({
      id: issuedA.sporeId,
    })
  );

  // Certificate A must still exist in cache
  const certAAfter = await getCertificate(issuedA.certificateId);
  expect(certAAfter).not.toBeNull();

  // Certificate B must be removed from cache
  const certBAfter = await getCertificate(issuedB.certificateId);
  expect(certBAfter).toBeNull();
});

// Test 2: does not melt Certificate A if Certificate B cell is pending/not found on-chain
it('should fail and not melt Certificate A if Certificate B cell is not found on-chain', async () => {
  // 1. Issue Certificate A (confirmed)
  const issuedA = await issueCertificate({
    signer: createMockSigner(),
    clusterId: testClusterId,
    issuerName: testIssuerName,
    subject: { id: validRecipientAddress, type: 'CourseCertificate', courseName: 'Course A', completionDate: '2024-01-01' },
  });

  // 2. Issue Certificate B (simulating pending / unindexed)
  const issuedB = await issueCertificate({
    signer: createMockSigner(),
    clusterId: testClusterId,
    issuerName: testIssuerName,
    subject: { id: validRecipientAddress, type: 'CourseCertificate', courseName: 'Course B', completionDate: '2024-02-01' },
  });

  const mockHolderSigner = {
    client: { getCell: vi.fn().mockResolvedValue(null) },
    sendTransaction: vi.fn().mockResolvedValue('0x' + 'c'.repeat(64)),
    signTransaction: vi.fn().mockReturnValue({}),
    getRecommendedAddressObj: vi.fn().mockResolvedValue({
      toString: () => validRecipientAddress,
      script: { args: validRecipientAddress, codeHash: '0xabcd', hashType: 'type' },
    }),
  };

  // Mock findSpore: A exists, B does NOT exist yet (pending)
  vi.mocked(findSpore).mockImplementation(async (_client, id) => {
    const idStr = String(id);
    if (idStr === issuedA.sporeId || idStr === issuedA.certificateId) {
      return {
        cell: {
          cellOutput: {
            lock: { args: validRecipientAddress, codeHash: '0xabcd', hashType: 'type' },
          },
        },
      } as any;
    }
    return undefined;
  });

  // Melting Certificate B must reject with error and NOT melt Certificate A
  const { meltCertificate: meltCert } = await import('../../../src/lib/credentials/issuer');
  await expect(
    meltCert(mockHolderSigner, issuedB.certificateId)
  ).rejects.toThrow(/could not be found on CKB/);

  // Verify meltSpore was NEVER called
  expect(vi.mocked(meltSpore)).not.toHaveBeenCalled();

  // Certificate A must still exist in cache
  const certA = await getCertificate(issuedA.certificateId);
  expect(certA).not.toBeNull();
});

// Test 3: DNA verification - must not melt wrong certificate even if sporeId exists
it('should verify DNA content matches before melting', async () => {
  // Issue Certificate B (the target)
  const issuedB = await issueCertificate({
    signer: createMockSigner(),
    clusterId: testClusterId,
    issuerName: testIssuerName,
    subject: { id: validRecipientAddress, type: 'CourseCertificate', courseName: 'Course B', completionDate: '2024-02-01' },
  });

  const mockHolderSigner = {
    client: { getCell: vi.fn().mockResolvedValue(null) },
    sendTransaction: vi.fn().mockResolvedValue('0x' + 'c'.repeat(64)),
    signTransaction: vi.fn().mockReturnValue({}),
    getRecommendedAddressObj: vi.fn().mockResolvedValue({
      toString: () => validRecipientAddress,
      script: { args: validRecipientAddress, codeHash: '0xabcd', hashType: 'type' },
    }),
  };

  // Mock findSpore returns a cell but with WRONG DNA (simulating collision)
  vi.mocked(findSpore).mockImplementation(async (_client, id) => {
    const idStr = String(id);
    // When querying Certificate B's sporeId, return a cell with Certificate A's DNA
    if (idStr === issuedB.sporeId) {
      return {
        cell: {
          cellOutput: {
            lock: { args: validRecipientAddress, codeHash: '0xabcd', hashType: 'type' },
          },
          outputData: new TextEncoder().encode(JSON.stringify({
            '@context': ['https://www.w3.org/2018/credentials/v1'],
            id: '0x' + 'aa'.repeat(16), // WRONG DNA ID!
            type: ['VerifiableCredential', 'CourseCertificate'],
            issuer: { id: testClusterId },
            credentialSubject: { type: 'CourseCertificate' },
          })),
        },
      } as any;
    }
    return undefined;
  });

  // Should reject because DNA does not match
  const { meltCertificate: meltCert } = await import('../../../src/lib/credentials/issuer');
  await expect(
    meltCert(mockHolderSigner, issuedB.certificateId)
  ).rejects.toThrow(/could not be found on CKB|DNA mismatch/);

  // meltSpore must NEVER be called
  expect(vi.mocked(meltSpore)).not.toHaveBeenCalled();
});
```

- [x] **Step 2: Run tests to verify they fail with current buggy code**

Run: `npx vitest run tests/unit/credentials/issuer.test.ts --reporter=verbose 2>&1 | grep -E "(FAIL|PASS|should melt only|should fail and not|should verify DNA)"`

Expected: All 3 new tests FAIL (current code has the bugs).

---

## Task 2: Fix Certificate Lookup and Target Resolution in `src/lib/credentials/issuer.ts`

**Files:**
- Modify: `src/lib/credentials/issuer.ts`

**Interfaces:**
- Consumes: `certificateCache`, `extractCertificateFromCell`, `findSpore`, `meltSpore`
- Produces: Safe `meltCertificate` function that only targets the exact Spore cell of the requested certificate

### Step 2A: Fix `getCertificate` Cache Lookup (lines ~219-230)

Replace the txHash-only search with multi-key search:

- [x] **Step 1: Update `getCertificate` to search by sporeId and certificate.id**

Replace lines 219-230:

```typescript
  // 2. Search local cache by various identifiers
  for (const [id, item] of certificateCache.entries()) {
    if (
      id === certificateId ||
      item.sporeId === certificateId ||
      item.certificate?.id === certificateId ||
      item.txHash === certificateId
    ) {
      return {
        certificate: item.certificate,
        certificateId: item.sporeId || id,
        transactionHash: item.txHash,
        clusterId: item.certificate.issuer?.id,
        sporeId: item.sporeId,
      };
    }
  }
```

### Step 2B: Fix `meltCertificate` Priority 3 and Add DNA Verification (lines ~634-696)

This is the core fix. Replace the buggy Priority 3 loop and add DNA verification.

- [x] **Step 1: Replace Priority 3 to use only THIS certificate's cached data**

Replace lines 639-673:

```typescript
  // Try multiple candidate IDs to find the actual Spore cell
  const candidateIds: string[] = [];

  // Priority 1: Use sporeId from THIS certificate's record if available
  if (targetSporeId && targetSporeId.startsWith('0x') && targetSporeId.length === 66) {
    candidateIds.push(targetSporeId);
  }

  // Priority 2: Try certificateId directly if it looks like a Spore ID
  if (certificateId.startsWith('0x') && certificateId.length === 66) {
    candidateIds.push(certificateId);
  }

  // Priority 3: Only check THIS certificate's cached data for additional IDs
  // NEVER iterate over all certificates - that causes cross-melt bugs!
  if (certRecord) {
    // Add THIS certificate's transaction hash as fallback
    if (
      certRecord.transactionHash &&
      certRecord.transactionHash.startsWith('0x') &&
      certRecord.transactionHash.length === 66 &&
      !candidateIds.includes(certRecord.transactionHash)
    ) {
      candidateIds.push(certRecord.transactionHash);
    }
  }
```

- [x] **Step 2: Add DNA verification after finding a Spore cell**

After line 669 (inside the `if (found?.cell)` block), add DNA verification BEFORE setting `targetSporeId`:

```typescript
  // Try each candidate to find the actual Spore cell
  for (const candidateId of candidateIds) {
    try {
      const found = await findSpore(liveSigner.client, candidateId as `0x${string}`);
      if (found?.cell) {
        // CRITICAL: Verify DNA matches the target certificate
        const certDna = extractCertificateFromCell(found.cell.outputData);
        if (certDna?.id && certRecord?.certificate?.id) {
          if (certDna.id !== certRecord.certificate.id) {
            // DNA mismatch - this is NOT the target certificate, continue searching
            continue;
          }
        }
        // DNA verified or no DNA to compare - accept this cell
        targetSporeId = candidateId as `0x${string}`;
        cellLock = found.cell.cellOutput.lock;
        foundCell = true;
        break;
      }
    } catch {}
  }
```

- [x] **Step 3: Improve error message when cell not found**

Replace lines 727-732:

```typescript
  if (!foundCell || !targetSporeId) {
    throw new Error(
      `The Spore cell for certificate "${certificateId.slice(0, 16)}..." could not be found on CKB. ` +
      `It may still be confirming in the mempool, or has already been melted.`
    );
  }
```

### Step 2C: Fix Cache Deletion to Only Remove THIS Certificate (lines ~762-773)

- [x] **Step 1: Fix cache deletion to only delete THIS certificate's entries**

Replace lines 762-773:

```typescript
    // Also search for any entries matching this specific certificate
    for (const [key, item] of certificateCache.entries()) {
      // Only delete entries that belong to THIS certificate
      const belongsToThisCert =
        key === certificateId ||
        key === targetSporeId ||
        item.sporeId === targetSporeId ||
        (certRecord?.certificate?.id && item.certificate?.id === certRecord.certificate.id) ||
        // Only delete by txHash if sporeId also matches (avoids deleting unrelated certs with same txHash)
        (certRecord?.transactionHash && item.txHash === certRecord.transactionHash && item.sporeId === targetSporeId);

      if (belongsToThisCert) {
        if (!keysToDelete.includes(key)) {
          keysToDelete.push(key);
        }
      }
    }
```

### Step 2D: Fix Deduplication in `getAllCertificates` (lines ~476-479)

- [x] **Step 1: Remove pure txHash deduplication that drops certificates**

Replace lines 476-479:

```typescript
    // Deduplicate by unique identifiers only - NOT by txHash alone
    // (multiple certificates can share a txHash in batch issuance)
```

And update the `addCertificate` helper (around line 481-489) to remove txHash-based skipping. The existing `seenIds` deduplication by `certificateId`, `sporeId`, and `certificate.id` is sufficient.

### Step 2E: Run Tests to Verify Fixes

- [x] **Step 1: Run tests to verify all tests pass**

Run: `npx vitest run tests/unit/credentials/issuer.test.ts --reporter=verbose`

Expected: All tests PASS, including the 3 new multi-certificate tests.

---

## Task 3: Regression Testing

**Files:**
- Test: `tests/unit/credentials/issuer.test.ts`
- Test: `tests/integration/certificate-lifecycle.test.ts` (if exists)

- [x] **Step 1: Run full test suite**

Run: `npx vitest run`

Expected: All test files pass.

- [x] **Step 2: Commit changes**

```bash
git add src/lib/credentials/issuer.ts tests/unit/credentials/issuer.test.ts docs/superpowers/plans/2026-09-13-fix-melt-target-certificate.md
git commit -m "fix(credentials): ensure meltCertificate targets only the specified certificate

- Remove indiscriminate cache iteration in meltCertificate Priority 3
- Add DNA verification before melting to prevent cross-certificate melts
- Fix getCertificate to search by sporeId and certificate.id
- Fix cache deletion to only remove entries for THIS certificate
- Add unit tests for multi-certificate melt scenarios

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

## Summary of Changes

| Location | Bug | Fix |
|----------|-----|-----|
| `issuer.ts:219-230` | Only searched by txHash | Search by `id`, `sporeId`, `certificate.id`, `txHash` |
| `issuer.ts:639-673` | Iterated ALL certificates | Only use THIS certificate's cached data |
| `issuer.ts:666-670` | No DNA verification | Verify `certDna.id === certRecord.certificate.id` |
| `issuer.ts:727-732` | Vague error message | Clear message about pending/melted state |
| `issuer.ts:762-773` | Deleted ALL items with same txHash | Only delete items belonging to THIS certificate |
| `issuer.ts:476-479` | Deduplication dropped certs | Remove pure txHash deduplication |
| `issuer.test.ts` | No multi-cert tests | Add 3 tests for cross-melt scenarios |

---

**Plan complete and saved to `docs/superpowers/plans/2026-09-13-fix-melt-target-certificate.md`.**

Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
