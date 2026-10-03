/**
 * Vellum Claim Cell melt functionality
 *
 * This module provides Claim Cell destruction for the Vellum reputation system.
 * See: docs/Design_spec/09_Vellum_Integration_Design.md
 */

import { ccc } from '@ckb-ccc/core';
import { meltSpore } from '@ckb-ccc/spore';
import { findClaimBySporeId, getVellumScriptConfig } from './vellumClaim';

export interface MeltVellumClaimOptions {
  /** Include Claim Type cellDeps for proper script execution */
  includeCellDeps?: boolean;
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
  const input = new ccc.CellInput(outPoint, BigInt(0));
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
 * Melt a Vellum Claim Cell with Claim Type cellDeps included.
 * This variant includes the Claim Type script cellDep for proper script execution.
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

  // Get Claim Type cellDeps
  const scripts = getVellumScriptConfig();
  const cellDeps: ccc.CellDep[] = [];
  if (scripts.claimType.cellDeps) {
    for (const cd of scripts.claimType.cellDeps) {
      cellDeps.push(ccc.CellDep.from(cd.cellDep));
    }
  }

  // Build a burn transaction: input Claim Cell, no output, with cellDeps
  const input = new ccc.CellInput(outPoint, BigInt(0));
  const tx = new ccc.Transaction(
    BigInt(0), // version
    cellDeps, // cellDeps with Claim Type
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

  // Get Claim Type cellDeps
  const scripts = getVellumScriptConfig();
  const cellDeps: ccc.CellDep[] = [];
  if (scripts.claimType.cellDeps) {
    for (const cd of scripts.claimType.cellDeps) {
      cellDeps.push(ccc.CellDep.from(cd.cellDep));
    }
  }

  // Melt Spore first to get base transaction
  const { tx: sporeTx } = await meltSpore({ signer, id: sporeId });

  // Add Claim Cell as input (no output = burn)
  const claimInput = new ccc.CellInput(found.outPoint, BigInt(0));

  // Combine: spore inputs + claim input, with Claim Type cellDeps
  const combinedInputs = [...(sporeTx.inputs || []), claimInput];

  // Create combined transaction
  const combinedTx = new ccc.Transaction(
    BigInt(0), // version
    cellDeps, // Claim Type cellDeps
    sporeTx.headerDeps || [], // headerDeps from spore melt
    combinedInputs, // both spore and claim inputs
    [], // no outputs = burn
    [], // outputsData
    [], // witnesses
  );

  return combinedTx;
}
