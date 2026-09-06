# Bug Report & Architectural Issue: Cache Pollution & Cross-Wallet Ownership Leaks

> **Date**: 2026-08-31  
> **Status**: Confirmed Bug & Architectural Defect  
> **Severity**: High / Critical (Data Integrity & Access Isolation)  
> **Target Audience**: Claude Code / Development Team  

---

## 1. Executive Summary

A critical issue currently exists where:
1. **Clusters and Certificates from other wallet addresses are displayed** in the current user's UI (`/clusters` and `/certificates`).
2. **Verifying a 3rd-party certificate on `/verify` pollutes the user's dashboard**: After verifying any arbitrary certificate ID on-chain, that foreign certificate and its parent cluster are automatically added to the current user's `/clusters` and `/certificates` (falsely categorized under **"Issued by You"**).

The root cause is a combination of **misusing `localStorage` as a global pseudo-database**, **un-namespaced multi-account caching**, **side-effect mutations during pure read/verify operations**, and **permissive wildcard filters (`!c.creatorAddress`)**.

---

## 2. Issues & Root Cause Analysis

### Issue 1: Side-Effect Pollution during Verification (`/verify`)

#### Symptom:
When a user visits `/verify` and verifies any certificate on-chain:
- The certificate immediately appears in `/certificates` under **"Issued by You"** and **"All"**.
- The certificate's issuing cluster appears in `/clusters` as an active cluster belonging to the user.
- The issued DOB count of that cluster increments on the user's clusters list.

#### Root Cause:
1. **`getCertificate()` mutates cache on read:**
   In `src/lib/credentials/issuer.ts` (lines 251 & 286):
   ```typescript
   // Inside getCertificate(certificateId)
   certificateCache.set(certId, { certificate: certDna, txHash, sporeId });
   ```
   *Every read / verify query permanently writes the third-party certificate to global `localStorage` (`certificateCache`).*

2. **`getCluster()` mutates cluster cache with empty creator address:**
   In `src/lib/credentials/cluster.ts` (lines 120-130):
   ```typescript
   // Inside getCluster(clusterId) called by verifier.ts
   const cluster: Cluster = {
     id: clusterId,
     clusterId,
     name: meta.name || ...,
     creatorAddress: meta.creatorAddress || '', // Empty because Spore Cluster description usually doesn't embed creator address
     ...
   };
   clusterCache.set(clusterId, cluster); // Written to localStorage!
   ```
   *`verifyCertificate` calls `getCluster(issuerId)` to check issuer validity, which writes the foreign cluster to `clusterCache` with `creatorAddress: "" `.*

---

### Issue 2: Cross-Wallet Data Leak on `/clusters`

#### Symptom:
When switching between different wallet accounts in the browser, clusters created by previous accounts (or fetched during verification) remain visible on the current account's `/clusters` page.

#### Root Cause:
1. **Unconditional merge of all cached clusters without creator address validation:**
   In `src/app/clusters/page.tsx` (lines 28-44):
   ```typescript
   queryFn: async () => {
     const onChainClusters = await getProviderClusters(address || undefined, client);
     const cachedClusters = getClustersFromCache();

     const allClusters = [...onChainClusters];
     for (const cached of cachedClusters) {
       if (!allClusters.find((c) => c.clusterId === cached.clusterId)) {
         allClusters.push(cached); // ⚠️ BUG: Pushes ALL cached clusters without checking cached.creatorAddress === address
       }
     }
     return allClusters;
   }
   ```

2. **Permissive fallback filter in `getProviderClusters()`:**
   In `src/lib/credentials/cluster.ts` (lines 167-171 & lines 230-235):
   ```typescript
   const matchesAddress = !address || !c.creatorAddress ||
     c.creatorAddress.toLowerCase() === address.toLowerCase();
   ```
   *Any cluster where `creatorAddress` is missing, undefined, or empty (e.g. cached during verify) evaluates `!c.creatorAddress` to `true`, matching ALL connected wallets.*

---

### Issue 3: False "Issued by You" Attribution on `/certificates`

#### Symptom:
Certificates that the user neither created nor received appear under the **"Issued by You"** tab in `/certificates`.

#### Root Cause:
1. **`getAllCertificates()` loads all un-namespaced records from `localStorage`:**
   In `src/lib/credentials/issuer.ts` (lines 489-499):
   ```typescript
   // 1. Get all certificates from local cache
   for (const [certId, cached] of certificateCache.entries()) {
     addCertificate({ ... }); // ⚠️ Dumps every certificate ever cached in this browser
   }
   ```

2. **Cascade effect from polluted `userClusters` in `checkIsIssuer()`:**
   In `src/app/certificates/page.tsx` (lines 78-96):
   - `userClusters` is populated with foreign clusters (due to Issue 1 & Issue 2).
   - `userClusterIds` contains the foreign cluster IDs.
   - `checkIsIssuer(c)` checks:
     ```typescript
     for (const ucid of Array.from(userClusterIds)) {
       if (isAddressMatch(ucid, issuerId) || isAddressMatch(ucid, clusterId)) {
         return true; // ⚠️ Returns true because foreign cluster ID is present in userClusterIds!
       }
     }
     ```
   - Result: The foreign certificate is classified as `issuedCerts` ("Issued by You").

3. **Loose prefix matching in `isAddressMatch()`:**
   In `src/app/certificates/page.tsx` (line 68):
   ```typescript
   if (a1.length >= 10 && a2.length >= 10 && (a1.startsWith(a2) || a2.startsWith(a1))) return true;
   ```
   *`startsWith` can falsely match CKB testnet addresses that share long Bech32m prefix parts.*

---

## 3. The Chain Reaction Diagram

```
[User on /verify] ───> verifyCertificate(certId)
                             │
                             ├─► getCertificate() ───► certificateCache.set() [LocalStorage]
                             │
                             └─► getCluster() ───────► clusterCache.set(creatorAddress: "") [LocalStorage]
                                                             │
[User navigates to /clusters] ───────────────────────────────┘
  │
  ├─► getProviderClusters() + getClustersFromCache()
  │     └─► Matches empty creatorAddress (`!c.creatorAddress === true`)
  │     └─► Foreign cluster is displayed as User's Cluster!
  │
[User navigates to /certificates]
  │
  ├─► userClusters now includes Foreign Cluster ID
  ├─► getAllCertificates() loads Foreign Certificate from LocalStorage
  └─► checkIsIssuer(cert) matches cert.clusterId with userClusterIds
        └─► Certificate is classified as "Issued by You"!
```

---

## 4. Recommended Remediation Plan for Claude

### Step 1: Remove Mutation Side-Effects from Read Operations
- **File**: `src/lib/credentials/issuer.ts`
  - Remove `certificateCache.set()` from `getCertificate()`. Reading / querying a certificate on-chain must be a **pure read operation**.
- **File**: `src/lib/credentials/cluster.ts`
  - Remove `clusterCache.set()` from `getCluster()`.

### Step 2: Strict Address Matching & Remove Wildcard Fallbacks
- **File**: `src/lib/credentials/cluster.ts`
  - In `getProviderClusters()`, only match clusters where `c.creatorAddress` strictly equals `address.toLowerCase()`. Never fallback on `!c.creatorAddress` when `address` is provided.
- **File**: `src/app/clusters/page.tsx`
  - Remove unconditional merging of `getClustersFromCache()`. If using cache, only include items where `cached.creatorAddress?.toLowerCase() === address.toLowerCase()`.
- **File**: `src/app/certificates/page.tsx`
  - In `isAddressMatch()`, compare strict full equality (`a1 === a2`) rather than prefix checks (`startsWith`).

### Step 3: Shift from `localStorage` as Source-of-Truth to TanStack React Query In-Memory Cache
- In a professional Web3 dApp, **Blockchain state (CKB RPC / Indexer) is the single source of truth for ownership**.
- Client-side caching should rely on **TanStack Query (React Query)**:
  - Cache keys: `['clusters', address]` and `['certificates', address]`.
  - In-memory cache is automatically scoped to the active session and active wallet address.
  - When the user disconnects or switches wallets, React Query handles cache invalidation cleanly without cross-wallet contamination.
- `LocalCache` (`localStorage`) should only be used (if at all) for pending transaction hashes or offline draft templates, never for ownership state.

### Step 4: Clear Corrupted LocalStorage Cache
- Provide a migration / cleanup helper or clear the corrupted `ckb_credential_clusters` and `ckb_credential_certificates` keys in `localStorage` so previous test data does not linger.

---

## 5. Verification Checklist

- [ ] Verify an external certificate ID via `/verify` -> Check `/certificates` and `/clusters` -> Ensure NO foreign items appear.
- [ ] Connect Wallet A, create a cluster -> Switch to Wallet B -> Ensure Wallet A's cluster is NOT visible in Wallet B's `/clusters`.
- [ ] Issue a certificate from Wallet A to Wallet B -> Connect Wallet B -> Ensure certificate appears in "Received", but NOT in "Issued by You".
- [ ] Run all unit tests (`npm run test`) and ensure all pass.

