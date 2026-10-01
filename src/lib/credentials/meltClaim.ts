/**
 * Vellum Claim Cell melt functionality
 *
 * This module provides Claim Cell destruction for the Vellum reputation system.
 * See: docs/Design_spec/09_Vellum_Integration_Design.md
 */

import { ccc } from '@ckb-ccc/core';
import { findClaimBySporeId } from './vellumClaim';

/**
 * Melt a Vellum Claim Cell by consuming its outpoint.
 * The Claim Cell is destroyed by creating a transaction that has it as input
 * but no corresponding output.
 *
 * @param signer - The holder's wallet signer (must be a live signer)
 * @param subjectDid - The DID of the claim subject
 * @param sporeId - The Spore ID referenced by the claim
 * @returns Transaction hash (empty string if no claim to melt)
 */
export async function meltVellumClaim(
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
