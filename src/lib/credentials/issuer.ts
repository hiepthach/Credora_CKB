import { ccc, Address as CkbAddress, ClientPublicTestnet } from '@ckb-ccc/core';
import { createSpore, meltSpore, findSpore } from '@ckb-ccc/spore';
import { unpackToRawSporeData } from '@ckb-ccc/spore/advanced';
import type { CertificateDNA, CredentialSubject } from '@/types';
import { encodeCertificateDNA, generateCertificateId, serializeDNA } from './encoder';
import { certificateCache } from '@/lib/storage';
import { resolveRecipientInput } from '@/lib/did';

interface IssueCertificateParams {
  signer: unknown; // ccc.Signer in production
  clusterId: string;
  issuerName: string;
  issuerDescription?: string;
  subject: CredentialSubject;
  expirationDate?: string;
}

interface IssueCertificateResult {
  certificateId: string;
  transactionHash: string;
  sporeId?: string;
}

interface GetCertificateResult {
  certificate: CertificateDNA;
  certificateId: string;
  transactionHash?: string;
  clusterId?: string;
  sporeId?: string;
}

/**
 * Clear all certificate cache (for testing)
 */
export function clearCertificateCache(): void {
  certificateCache.clear();
}

/**
 * Get certificate cache
 */
export function getCertificateCache() {
  return certificateCache;
}

/**
 * Issue a new certificate as a Spore DOB
 */
export async function issueCertificate(
  params: IssueCertificateParams
): Promise<IssueCertificateResult> {
  const { signer, clusterId, issuerName, issuerDescription, subject, expirationDate } = params;

  // Generate certificate ID
  const certificateId = generateCertificateId();

  // Create certificate DNA
  const dna = encodeCertificateDNA({
    id: certificateId,
    issuer: {
      id: clusterId,
      name: issuerName,
      description: issuerDescription,
    },
    subject,
    expirationDate,
  });

  // Serialize DNA to JSON
  const dnaJson = serializeDNA(dna);

  // If a live CCC signer is connected, construct and send a real on-chain transaction
  if (
    signer &&
    typeof signer === 'object' &&
    'client' in signer &&
    typeof (signer as any).sendTransaction === 'function'
  ) {
    const liveSigner = signer as ccc.Signer;

    // Resolve recipient lock script — Fail-Fast if recipient address is invalid
    const recipientInput = subject.id || '';
    if (!recipientInput) {
      throw new Error('Recipient identifier (address or DID) is required');
    }

    let recipientLockScript: ccc.Script | null = null;
    let resolvedDid: string | undefined;

    try {
      const resolved = await resolveRecipientInput(liveSigner.client, recipientInput);
      recipientLockScript = resolved.targetLock;
      resolvedDid = resolved.did;

      // If recipient used a DID, store the original wallet address for compatibility
      if (resolvedDid && resolved.targetAddress !== recipientInput) {
        subject.walletAddress = resolved.targetAddress;
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      throw new Error(`Failed to resolve recipient "${recipientInput}": ${errMsg}`);
    }

    if (!recipientLockScript) {
      throw new Error(`Failed to resolve lock script for recipient "${recipientInput}"`);
    }

    try {
      const hasValidCluster = Boolean(
        clusterId &&
        clusterId.startsWith('0x') &&
        clusterId.length === 66
      );

      // Use CCC Spore SDK to create the certificate DOB cell
      const { tx, id: sporeId } = await createSpore({
        signer: liveSigner,
        data: {
          contentType: 'application/json',
          content: ccc.bytesFrom(new TextEncoder().encode(dnaJson)),
          clusterId: hasValidCluster ? (clusterId as `0x${string}`) : undefined,
        },
        to: recipientLockScript,
        clusterMode: hasValidCluster ? 'clusterCell' : undefined,
      });

      await tx.completeInputsByCapacity(liveSigner);
      await tx.completeFeeBy(liveSigner, 1000);
      const txHash = await liveSigner.sendTransaction(tx);

      // Save to cache for quick retrieval
      const primaryId = sporeId || certificateId;
      certificateCache.set(primaryId, { certificate: dna, txHash, sporeId });

      return {
        certificateId: sporeId || certificateId,
        transactionHash: txHash,
        sporeId,
      };
    } catch (err: any) {
      const msg = err?.message || String(err);
      if (msg.includes('capacity') || msg.includes('balance') || msg.includes('Inputs') || msg.includes('LiveCells')) {
        throw new Error(
          `Insufficient CKB capacity in wallet. You need at least ~150 CKB to mint an on-chain DOB credential cell. Please claim free testnet CKB from https://faucet.nervos.org.`
        );
      }
      if (msg.includes('Cluster') && (msg.includes('not found') || msg.includes('notFound'))) {
        throw new Error(
          `Cluster with ID "${clusterId}" was not found on-chain. Please ensure the Cluster creation transaction has confirmed on the CKB network.`
        );
      }
      throw err;
    }
  }

  throw new Error('Live signer is required to issue a certificate');
}

export function isCertificateJson(text: string): boolean {
  return (
    text.includes('@context') &&
    (text.includes('VerifiableCredential') ||
     text.includes('credentialSubject') ||
     text.includes('CourseCertificate'))
  );
}

/**
 * Robustly extract CertificateDNA from on-chain cell outputData
 * Supports both Spore Molecule SporeData format and plain JSON format.
 */
export function extractCertificateFromCell(outputData?: string | Uint8Array | unknown): CertificateDNA | null {
  if (!outputData || (outputData as any) === '0x' || (outputData as any).length < 10) return null;
  try {
    const rawBytes = ccc.bytesFrom(outputData as any);

    // 1. Try unpacking as SporeData (Molecule format)
    try {
      const sporeData = unpackToRawSporeData(rawBytes);
      if (sporeData?.content) {
        const contentText = new TextDecoder().decode(ccc.bytesFrom(sporeData.content));
        if (isCertificateJson(contentText)) {
          return JSON.parse(contentText) as CertificateDNA;
        }
      }
    } catch {}

    // 2. Try unpacking as direct UTF-8 JSON text (plain cell format)
    try {
      const text = new TextDecoder().decode(rawBytes);
      if (isCertificateJson(text)) {
        return JSON.parse(text) as CertificateDNA;
      }
    } catch {}
  } catch {}

  return null;
}

/**
 * Get certificate by ID or Transaction Hash
 */
export async function getCertificate(
  certificateId: string,
  client?: unknown
): Promise<GetCertificateResult | null> {
  // 1. Try local cache by ID
  const cached = certificateCache.get(certificateId);
  if (cached) {
    return {
      certificate: cached.certificate,
      certificateId,
      transactionHash: cached.txHash,
      clusterId: cached.certificate.issuer.id,
      sporeId: cached.sporeId,
    };
  }

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

  // 3. Query on-chain CKB Testnet if given a 66-character hex ID/hash
  if (
    typeof window !== 'undefined' &&
    certificateId.startsWith('0x') &&
    certificateId.length === 66
  ) {
    try {
      const ckbClient =
        (client as ccc.Client) ||
        (ClientPublicTestnet ? new ClientPublicTestnet() : new ccc.ClientPublicTestnet());

      // 3.1 Try querying as a Spore ID using findSpore (direct live Spore lookup)
      try {
        const found = await findSpore(ckbClient, certificateId as `0x${string}`);
        if (found?.cell) {
          const certDna = extractCertificateFromCell(found.cell.outputData);
          if (certDna) {
            const sporeId = certificateId;
            const certId = sporeId || certDna.id;
            const txHash = found.cell.outPoint.txHash;
            const clusterId =
              certDna.issuer?.id ||
              (found.sporeData?.clusterId ? ccc.hexFrom(found.sporeData.clusterId) : '');

            return {
              certificate: certDna,
              certificateId: certId,
              transactionHash: txHash,
              clusterId,
              sporeId,
            };
          }
        }
      } catch (err) {
        console.warn('findSpore check failed, trying getTransaction fallback:', err);
      }

      // 3.2 Try querying as a transaction hash using getTransaction
      if (typeof (ckbClient as any).getTransaction === 'function') {
        const tx = await (ckbClient as any).getTransaction(certificateId as `0x${string}`);
        if (tx?.transaction?.outputsData) {
          for (let i = 0; i < tx.transaction.outputsData.length; i++) {
            const hex = tx.transaction.outputsData[i];
            const certDna = extractCertificateFromCell(hex);
            if (certDna) {
              const sporeId = tx.transaction?.outputs?.[i]?.type?.args ? ccc.hexFrom(tx.transaction.outputs[i].type!.args) : undefined;
              if (sporeId) {
                try {
                  const liveSpore = await findSpore(ckbClient, sporeId as `0x${string}`);
                  if (!liveSpore?.cell) {
                    continue; // Spore cell has been melted
                  }
                } catch {
                  continue;
                }
              } else {
                continue; // Skip plain JSON cells - only Spore DOB certificates are supported
              }

              const certId = sporeId || certDna.id || certificateId;
              return {
                certificate: certDna,
                certificateId: certId,
                transactionHash: certificateId,
                clusterId: certDna.issuer?.id || '',
                sporeId,
              };
            }
          }
        }
      }
    } catch (e) {
      console.warn('Error fetching on-chain certificate:', e);
    }
  }

  return null;
}

/**
 * Get all certificates for a holder address
 */
export async function getHolderCertificates(
  holderAddress?: string,
  client?: unknown
): Promise<GetCertificateResult[]> {
  const results: GetCertificateResult[] = [];
  const seenIds = new Set<string>();

  // 1. Get from local cache
  for (const [certId, cached] of certificateCache.entries()) {
    const cert = cached.certificate;
    const certDnaId = cert?.id;
    const sporeId = cached.sporeId;
    const txHash = cached.txHash;

    if (
      seenIds.has(certId) ||
      (certDnaId && seenIds.has(certDnaId)) ||
      (sporeId && seenIds.has(sporeId)) ||
      (txHash && seenIds.has(txHash))
    ) {
      continue;
    }

    if (!holderAddress || cert.credentialSubject.id === holderAddress || !cert.credentialSubject.id) {
      results.push({
        certificate: cert,
        certificateId: sporeId || certId,
        transactionHash: cached.txHash,
        clusterId: cert.issuer.id,
        sporeId: cached.sporeId,
      });
      seenIds.add(certId);
      if (certDnaId) seenIds.add(certDnaId);
      if (sporeId) seenIds.add(sporeId);
      if (txHash) seenIds.add(txHash);
    }
  }

  // 2. Query live CKB blockchain cells if holderAddress is available
  if (holderAddress && typeof window !== 'undefined') {
    try {
      const ckbClient = (client as ccc.Client) || (ClientPublicTestnet ? new ClientPublicTestnet() : new ccc.ClientPublicTestnet());
      const AddressClass = CkbAddress;
      if (AddressClass?.fromString) {
        const addrObj = await AddressClass.fromString(holderAddress, ckbClient);

        // Search all live cells owned by the recipient lock script (findCellsByLock only returns LIVE cells)
        for await (const cell of ckbClient.findCellsByLock(addrObj.script, undefined, true)) {
          try {
            const certDna = extractCertificateFromCell(cell.outputData);
            if (!certDna) continue;

            const sporeId = cell.cellOutput.type?.args ? ccc.hexFrom(cell.cellOutput.type.args) : undefined;
            // Skip plain JSON cells (no sporeId) - only Spore DOB certificates are supported
            if (!sporeId) continue;
            const certId = sporeId || certDna.id || cell.outPoint.txHash;
            const certDnaId = certDna.id;
            const txHash = cell.outPoint.txHash;

            if (
              !seenIds.has(certId) &&
              (!txHash || !seenIds.has(txHash)) &&
              (!sporeId || !seenIds.has(sporeId)) &&
              (!certDnaId || !seenIds.has(certDnaId))
            ) {
              seenIds.add(certId);
              if (txHash) seenIds.add(txHash);
              if (sporeId) seenIds.add(sporeId);
              if (certDnaId) seenIds.add(certDnaId);

              const item: GetCertificateResult = {
                certificate: certDna,
                certificateId: certId,
                transactionHash: cell.outPoint.txHash,
                clusterId: certDna.issuer?.id || '',
                sporeId,
              };

              results.push(item);

              // Persist to cache (normalize to sporeId as primary key)
              const storageKey = sporeId || certId;
              if (!certificateCache.has(storageKey)) {
                certificateCache.set(storageKey, {
                  certificate: certDna,
                  txHash: cell.outPoint.txHash,
                  sporeId,
                });
              }
            }
          } catch {
            // Ignore cells that are not valid JSON certificates
          }
        }
      }
    } catch (e) {
      console.warn('Error querying on-chain certificate cells for holder:', e);
    }
  }

  return results;
}

/**
 * Get all certificates issued under a specific cluster ID
 */
export async function getClusterCertificates(clusterId: string): Promise<GetCertificateResult[]> {
  const results: GetCertificateResult[] = [];
  const seenIds = new Set<string>();

  for (const [certId, cached] of certificateCache.entries()) {
    const cert = cached.certificate;
    const certDnaId = cert?.id;
    const sporeId = cached.sporeId;
    const txHash = cached.txHash;

    if (
      seenIds.has(certId) ||
      (certDnaId && seenIds.has(certDnaId)) ||
      (sporeId && seenIds.has(sporeId)) ||
      (txHash && seenIds.has(txHash))
    ) {
      continue;
    }

    if (cert.issuer.id === clusterId) {
      results.push({
        certificate: cert,
        certificateId: sporeId || certId,
        transactionHash: cached.txHash,
        clusterId: cert.issuer.id,
        sporeId: cached.sporeId,
      });
      seenIds.add(certId);
      if (certDnaId) seenIds.add(certDnaId);
      if (sporeId) seenIds.add(sporeId);
      if (txHash) seenIds.add(txHash);
    }
  }

  return results;
}

/**
 * Get all certificates in system (or for an active wallet)
 */
export async function getAllCertificates(
  client?: unknown,
  address?: string
): Promise<GetCertificateResult[]> {
  const results: GetCertificateResult[] = [];
  const seenIds = new Set<string>();

  // Helper to add certificate with deduplication
  const addCertificate = (item: GetCertificateResult) => {
    // Skip if already seen by any ID
    if (
      seenIds.has(item.certificateId) ||
      (item.sporeId && seenIds.has(item.sporeId)) ||
      (item.transactionHash && seenIds.has(item.transactionHash)) ||
      (item.certificate?.id && seenIds.has(item.certificate.id))
    ) {
      return;
    }

    // Add to results
    results.push(item);
    seenIds.add(item.certificateId);
    if (item.sporeId) seenIds.add(item.sporeId);
    if (item.transactionHash) seenIds.add(item.transactionHash);
    if (item.certificate?.id) seenIds.add(item.certificate.id);
  };

  // 1. Get all certificates from local cache (both issued by user and received by user)
  for (const [certId, cached] of certificateCache.entries()) {
    const cid = cached.certificate.issuer?.id || '';
    addCertificate({
      certificate: cached.certificate,
      certificateId: cached.sporeId || certId,
      transactionHash: cached.txHash,
      clusterId: cid,
      sporeId: cached.sporeId,
    });
  }

  // 2. If address is provided, also scan on-chain cells for this address (as holder/recipient)
  if (address && typeof window !== 'undefined') {
    try {
      const holderCerts = await getHolderCertificates(address, client);
      for (const item of holderCerts) {
        addCertificate(item);
      }

      // 3. Scan on-chain transactions where address was the sender/issuer (input lock = address)
      const ckbClient = (client as ccc.Client) || (ClientPublicTestnet ? new ClientPublicTestnet() : new ccc.ClientPublicTestnet());
      const AddressClass = CkbAddress;
      if (AddressClass?.fromString) {
        const addrObj = await AddressClass.fromString(address, ckbClient);
        let txCount = 0;
        for await (const txRecord of ckbClient.findTransactionsByLock(addrObj.script, undefined, false, 'desc', 20)) {
          if (txCount++ > 20) break;
          try {
            if (!txRecord.isInput) continue;
            const txResponse = await ckbClient.getTransaction(txRecord.txHash);
            if (!txResponse?.transaction?.outputsData) continue;

            for (let i = 0; i < txResponse.transaction.outputsData.length; i++) {
              const hex = txResponse.transaction.outputsData[i];
              const certDna = extractCertificateFromCell(hex);
              if (certDna) {
                const sporeId = txResponse.transaction?.outputs?.[i]?.type?.args ? ccc.hexFrom(txResponse.transaction.outputs[i].type!.args) : undefined;

                // Verify that the spore cell is still alive on-chain (has not been melted)
                if (sporeId) {
                  try {
                    const liveSpore = await findSpore(ckbClient, sporeId as `0x${string}`);
                    if (!liveSpore?.cell) {
                      continue; // Spore cell has been melted, do NOT resurrect!
                    }
                  } catch {
                    continue;
                  }
                } else {
                  continue; // Skip plain JSON cells - only Spore DOB certificates are supported
                }

                const certId = sporeId || certDna.id || txRecord.txHash;

                const item: GetCertificateResult = {
                  certificate: certDna,
                  certificateId: certId,
                  transactionHash: txRecord.txHash,
                  clusterId: certDna.issuer?.id || '',
                  sporeId,
                };

                addCertificate(item);

                // Normalize storage key to sporeId as primary key
                const storageKey = sporeId || certId;
                if (!certificateCache.has(storageKey)) {
                  certificateCache.set(storageKey, {
                    certificate: certDna,
                    txHash: txRecord.txHash,
                    sporeId,
                  });
                }
              }
            }
          } catch {}
        }
      }
    } catch (e) {
      console.warn('Error syncing on-chain certificates:', e);
    }
  }

  return results;
}

/**
 * Helper to verify cell DNA against the expected certificate record.
 */
export function verifyCellDNA(cellOutputData: Uint8Array | unknown, certRecord: any): boolean {
  const expectedId = certRecord?.certificate?.id || certRecord?.sporeId || certRecord?.certificateId;
  if (expectedId) {
    const certDna = extractCertificateFromCell(cellOutputData);
    const matchesDna = certDna?.id && (
      certDna.id === certRecord?.certificate?.id ||
      certDna.id === certRecord?.sporeId ||
      certDna.id === certRecord?.certificateId
    );
    if (!matchesDna) {
      return false; // Skip this cell
    }
  }
  return true;
}

/**
 * Melt (destroy) a certificate cell to reclaim CKB capacity.
 * Only the certificate holder can melt their own certificate.
 *
 * @param signer - The holder's wallet signer (must be a live signer)
 * @param certificateId - The certificate ID or Spore ID to melt
 */
export async function meltCertificate(
  signer: unknown,
  certificateId: string
): Promise<{ transactionHash: string }> {
  // Fail-Fast: require live signer
  if (
    !signer ||
    typeof signer !== 'object' ||
    !('client' in signer) ||
    typeof (signer as any).sendTransaction !== 'function' ||
    (typeof (signer as any).getRecommendedAddressObj !== 'function' &&
     typeof (signer as any).getRecommendedAddress !== 'function')
  ) {
    throw new Error('Live signer is required to melt a certificate');
  }

  const liveSigner = signer as ccc.Signer;

  // Look up the certificate record from cache first
  let certRecord = await getCertificate(certificateId, liveSigner.client);

  // If not found by certificateId, search all local cache entries for a matching sporeId
  if (!certRecord) {
    for (const [key, item] of certificateCache.entries()) {
      if (item.sporeId === certificateId || key === certificateId) {
        certRecord = {
          certificate: item.certificate,
          certificateId: key,
          transactionHash: item.txHash,
          clusterId: item.certificate.issuer?.id,
          sporeId: item.sporeId,
        };
        break;
      }
    }
  }

  if (!certRecord) {
    throw new Error('Certificate not found in local storage. Please ensure the certificate was issued to your address.');
  }

  let holderLock: ccc.Script;
  if (typeof (liveSigner as any).getRecommendedAddressObj === 'function') {
    const addrObj = await liveSigner.getRecommendedAddressObj();
    holderLock = addrObj.script;
  } else {
    const addrStr = await liveSigner.getRecommendedAddress();
    holderLock = await (liveSigner.client as any).addressToScript(addrStr);
  }

  // 1. Resolve on-chain spore ID and verify cell ownership
  let targetSporeId: `0x${string}` | undefined = (certRecord.sporeId as `0x${string}`) || undefined;
  let cellLock: ccc.Script | undefined = undefined;
  let foundCell = false;

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

  // Try each candidate to find the actual Spore cell
  for (const candidateId of candidateIds) {
    try {
      const found = await findSpore(liveSigner.client, candidateId as `0x${string}`);
      if (found?.cell) {
        // CRITICAL: Verify DNA matches the target certificate
        if (!verifyCellDNA(found.cell.outputData, certRecord)) {
          // DNA mismatch or missing - this is NOT the target certificate, continue searching
          continue;
        }
        // DNA verified or no DNA to compare - accept this cell
        targetSporeId = candidateId as `0x${string}`;
        cellLock = found.cell.cellOutput.lock;
        foundCell = true;
        break;
      }
    } catch {}
  }

  // If not found yet, query transaction outputs to extract Spore type.args
  if (!foundCell && certRecord.transactionHash && certRecord.transactionHash.startsWith('0x') && certRecord.transactionHash.length === 66) {
    try {
      const txRes = await (liveSigner.client as any).getTransaction(certRecord.transactionHash as `0x${string}`);
      if (txRes?.transaction?.outputs) {
        for (const output of txRes.transaction.outputs) {
          if (output.type?.args && output.type.args.startsWith('0x') && output.type.args.length === 66) {
            const candidateId = output.type.args as `0x${string}`;
            try {
              const found = await findSpore(liveSigner.client, candidateId);
              if (found?.cell) {
                // Verify DNA matches the target certificate
                if (!verifyCellDNA(found.cell.outputData, certRecord)) {
                  continue;
                }
                targetSporeId = candidateId;
                cellLock = found.cell.cellOutput.lock;
                foundCell = true;
                break;
              }
            } catch {}
          }
        }
      }
    } catch {}
  }

  if (cellLock) {
    const isOwner =
      cellLock.codeHash === holderLock.codeHash &&
      cellLock.hashType === holderLock.hashType &&
      cellLock.args === holderLock.args;

    if (!isOwner) {
      throw new Error('Only the certificate holder can melt this certificate');
    }
  }

  if (!foundCell || !targetSporeId) {
    throw new Error(
      `The Spore cell for certificate "${certificateId.slice(0, 16)}..." could not be found on CKB. ` +
      `It may still be confirming in the mempool, or has already been melted.`
    );
  }

  const finalSporeId = targetSporeId;

  try {
    // Use CCC Spore to build the melt transaction
    const { tx } = await meltSpore({
      signer: liveSigner,
      id: finalSporeId,
    });

    if (tx && typeof tx.completeInputsByCapacity === 'function') {
      await tx.completeInputsByCapacity(liveSigner);
    }
    if (tx && typeof tx.completeFeeBy === 'function') {
      await tx.completeFeeBy(liveSigner, 1000);
    }
    const meltTxHash = await liveSigner.sendTransaction(tx);

    // Remove from cache - collect keys first, then delete (avoid modifying while iterating)
    const keysToDelete: string[] = [
      certificateId,
      certRecord?.certificateId,
      certRecord?.certificate?.id,
      targetSporeId,
      certRecord?.sporeId,
      certRecord?.transactionHash,
    ].filter((k): k is string => Boolean(k));

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

    // Delete all collected keys
    keysToDelete.forEach((key) => certificateCache.delete(key));

    return { transactionHash: meltTxHash };
  } catch (err: any) {
    const msg = err?.message || String(err);
    if (msg.includes('Spore') && (msg.includes('not found') || msg.includes('notFound'))) {
      throw new Error(
        `The Spore cell could not be found on CKB. It may have already been melted or transferred. Certificate: ${certificateId.slice(0, 16)}...`
      );
    }
    throw err;
  }
}
