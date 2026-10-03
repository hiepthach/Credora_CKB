/**
 * Vellum Claim Cell melt functionality
 *
 * This module provides Claim Cell destruction for the Vellum reputation system.
 * See: docs/Design_spec/09_Vellum_Integration_Design.md
 */

import { ccc } from '@ckb-ccc/core';
import { isDidCkb, resolveDidCkb } from '@ckb-ccc/did-ckb';
import { meltSpore } from '@ckb-ccc/spore';
import { findClaimBySporeId, getVellumScriptConfig } from './vellumClaim';

export interface MeltVellumClaimOptions {
  /** Include Claim Type cellDeps for proper script execution */
  includeCellDeps?: boolean;
}

/**
 * Collect all required CellDeps for validating a Vellum Claim Cell destruction:
 * 1. Claim Type script cellDep (from Vellum deployment)
 * 2. DID Lock script cellDep (from Vellum deployment)
 * 3. Subject DID identity cellDep (if subjectDid is a did:ckb identifier)
 */
export async function collectVellumClaimCellDeps(
  client: ccc.Client,
  subjectDid: string,
): Promise<ccc.CellDep[]> {
  const scripts = getVellumScriptConfig();
  const deps: ccc.CellDep[] = [];

  // 1. Claim Type script cellDep
  if (scripts.claimType.cellDeps) {
    for (const cd of scripts.claimType.cellDeps) {
      deps.push(ccc.CellDep.from(cd.cellDep));
    }
  }

  // 2. DID Lock script cellDep (code_hash: 0xe1562cc57b4bd91619ada2f7e74d63805ea7038a7b6de0b18a529d51aa883d2d)
  if (scripts.didLock.cellDeps) {
    for (const cd of scripts.didLock.cellDeps) {
      deps.push(ccc.CellDep.from(cd.cellDep));
    }
  }

  // 3. Subject DID identity cellDep (required by DID Lock script to verify controller)
  if (isDidCkb(subjectDid)) {
    try {
      const didRecord = await resolveDidCkb({ client, did: subjectDid });
      if (didRecord?.cell?.outPoint) {
        deps.push(
          ccc.CellDep.from({
            outPoint: didRecord.cell.outPoint,
            depType: 'code',
          }),
        );
      }
    } catch {
      // Continue without DID cellDep if resolution fails
    }
  }

  return deps;
}

/**
 * Deduplicate cellDeps by outpoint (txHash + index) and depType.
 */
export function dedupCellDeps(cellDeps: ccc.CellDep[]): ccc.CellDep[] {
  const seen = new Set<string>();
  const result: ccc.CellDep[] = [];

  for (const dep of cellDeps) {
    const key = `${dep.outPoint.txHash.toLowerCase()}:${dep.outPoint.index.toString()}:${dep.depType}`;
    if (!seen.has(key)) {
      seen.add(key);
      result.push(dep);
    }
  }

  return result;
}

/**
 * Melt a Vellum Claim Cell by consuming its outpoint.
 * The Claim Cell is destroyed by creating a transaction that has it as input
 * but no corresponding output.
 *
 * @param signer - The holder's wallet signer (must be a live signer)
 * @param subjectDid - The DID of the claim subject
 * @param sporeId - The Spore ID referenced by the claim
 * @param options - Optional configuration (e.g. include Claim Type cellDeps)
 * @returns Transaction hash (empty string if no claim to melt)
 */
export async function meltVellumClaim(
  signer: ccc.Signer,
  subjectDid: string,
  sporeId: string,
  options?: MeltVellumClaimOptions,
): Promise<{ transactionHash: string }> {
  if (options?.includeCellDeps) {
    return meltVellumClaimWithCellDeps(signer, subjectDid, sporeId);
  }
  // Find the Claim Cell
  const found = await findClaimBySporeId({
    client: signer.client,
    subjectDid,
    sporeId,
  });

  if (!found) {
    // No Claim Cell exists - nothing to melt
    return { transactionHash: '' };
  }

  const { outPoint } = found;

  // Build a burn transaction: input Claim Cell, no output
  const input = new ccc.CellInput(ccc.OutPoint.from(outPoint), BigInt(0));
  const tx = new ccc.Transaction(
    BigInt(0), // version
    [], // cellDeps
    [], // headerDeps
    [input], // inputs
    [], // outputs
    [], // outputsData
    [], // witnesses
  );

  // Complete the transaction
  await tx.completeInputsByCapacity(signer);
  await tx.completeFeeBy(signer, 1000);

  // Send the burn transaction
  const txHash = await signer.sendTransaction(tx);

  return { transactionHash: txHash };
}

/**
 * Melt a Vellum Claim Cell with Claim Type, DID Lock, and DID Identity cellDeps included.
 *
 * @param signer - The holder's wallet signer (must be a live signer)
 * @param subjectDid - The DID of the claim subject
 * @param sporeId - The Spore ID referenced by the claim
 * @returns Transaction hash (empty string if no claim to melt)
 */
export async function meltVellumClaimWithCellDeps(
  signer: ccc.Signer,
  subjectDid: string,
  sporeId: string,
): Promise<{ transactionHash: string }> {
  // Find the Claim Cell
  const found = await findClaimBySporeId({
    client: signer.client,
    subjectDid,
    sporeId,
  });

  if (!found) {
    // No Claim Cell exists - nothing to melt
    return { transactionHash: '' };
  }

  const { outPoint } = found;

  const vellumDeps = await collectVellumClaimCellDeps(signer.client, subjectDid);
  const cellDeps = dedupCellDeps(vellumDeps);

  // Build a burn transaction: input Claim Cell, no output, with cellDeps
  const input = new ccc.CellInput(ccc.OutPoint.from(outPoint), BigInt(0));
  const tx = new ccc.Transaction(
    BigInt(0), // version
    cellDeps, // cellDeps with Claim Type, DID Lock, and DID cell
    [], // headerDeps
    [input], // inputs
    [], // outputs
    [], // outputsData
    [], // witnesses
  );

  // Complete the transaction
  await tx.completeInputsByCapacity(signer);
  await tx.completeFeeBy(signer, 1000);

  // Send the burn transaction
  const txHash = await signer.sendTransaction(tx);

  return { transactionHash: txHash };
}

/**
 * Build an atomic melt transaction that destroys both Spore DOB and Claim Cell.
 * Returns null if no Claim Cell exists (caller should use regular meltSpore).
 *
 * This combines the Spore melt inputs with the Claim Cell input into a single
 * transaction for atomic destruction of both cells.
 *
 * @param signer - The holder's wallet signer
 * @param sporeId - The Spore ID to melt
 * @param subjectDid - The DID of the claim subject (used to find the Claim Cell)
 * @returns Combined transaction or null if no Claim Cell exists
 */
export async function buildAtomicMeltTransaction(
  signer: ccc.Signer,
  sporeId: `0x${string}`,
  subjectDid: string,
): Promise<ccc.Transaction | null> {
  // Find claim cell
  let found;
  try {
    found = await findClaimBySporeId({
      client: signer.client,
      subjectDid,
      sporeId,
    });
  } catch {
    // Failed to find claim cell - return null for regular melt
    return null;
  }

  if (!found) {
    // No claim cell exists - return null for regular melt
    return null;
  }

  // Collect Vellum cellDeps (Claim Type, DID Lock, and DID Identity cell)
  const vellumDeps = await collectVellumClaimCellDeps(signer.client, subjectDid);

  // Melt Spore first to get base transaction
  const { tx: sporeTx } = await meltSpore({ signer, id: sporeId });

  // Add Claim Cell as input (no output = burn)
  const claimInput = new ccc.CellInput(ccc.OutPoint.from(found.outPoint), BigInt(0));

  // Combine: spore inputs + claim input
  const combinedInputs = [...(sporeTx.inputs || []), claimInput];

  // Merge and deduplicate cellDeps
  const combinedCellDeps = dedupCellDeps([
    ...(sporeTx.cellDeps || []),
    ...vellumDeps,
  ]);

  // Create combined transaction preserving sporeTx cellDeps, headerDeps, witnesses (cobuild)
  const combinedTx = new ccc.Transaction(
    sporeTx.version ?? BigInt(0), // version
    combinedCellDeps, // combined cellDeps
    sporeTx.headerDeps || [], // headerDeps from spore melt
    combinedInputs, // both spore and claim inputs
    sporeTx.outputs || [], // outputs from spore melt (if any)
    sporeTx.outputsData || [], // outputsData from spore melt (if any)
    sporeTx.witnesses || [], // preserve witnesses (cobuild)
  );

  return combinedTx;
}
