/**
 * Vellum Claim Cell integration for Credora
 *
 * This module provides Claim Cell creation for the Vellum reputation system.
 * See: docs/Design_spec/09_Vellum_Integration_Design.md
 */

import { ccc } from '@ckb-ccc/core';
import { didToArgs } from '@ckb-ccc/did-ckb';
import { ClaimData, writeClaim, readClaims, type Claim } from '@usevellum/sdk';
import * as dagCbor from '@ipld/dag-cbor';

import {
  CREDORA_COURSE_SCHEMA_MANIFEST,
  CredoraCourseSchemaHash,
  computeCanonicalSchemaHash,
} from './schemas/credoraCourse';

export {
  CREDORA_COURSE_SCHEMA_MANIFEST,
  CredoraCourseSchemaHash,
  computeCanonicalSchemaHash,
};

export const VELLUM_DEPLOYMENT_TX_HASH =
  '0xaf693346282063a5d51f79d180fc807cdba1b8ac9d7af30085ff0aa190e2686c' as `0x${string}`;

export const VELLUM_CLAIM_TYPE_DEPLOYMENT = {
  codeHash:
    '0xfb2757e524b3f83161d8b85b8b3e00186e2019ff04f5dfe833c5a72731e13157' as `0x${string}`,
  hashType: 'type' as ccc.HashType,
  cellDep: {
    outPoint: {
      txHash: VELLUM_DEPLOYMENT_TX_HASH,
      index: 0,
    },
    depType: 'code' as ccc.DepType,
  },
};

export const VELLUM_DID_LOCK_DEPLOYMENT = {
  codeHash:
    '0xe1562cc57b4bd91619ada2f7e74d63805ea7038a7b6de0b18a529d51aa883d2d' as `0x${string}`,
  hashType: 'type' as ccc.HashType,
  cellDep: {
    outPoint: {
      txHash: VELLUM_DEPLOYMENT_TX_HASH,
      index: 1,
    },
    depType: 'code' as ccc.DepType,
  },
};

export const VELLUM_CLAIM_TYPE_CODE_HASH = VELLUM_CLAIM_TYPE_DEPLOYMENT.codeHash;

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

export interface CredoraCourseMetadata {
  course_name: string;
  completion_date: string;
  grade?: string;
}

export interface CredoraCoursePayload {
  spore_id: string;
  course_id: string;
  issuer_did: string;
  issued_at: number;
  expires_at?: number;
  metadata: CredoraCourseMetadata;
}

/**
 * Validate that a payload is a valid CredoraCoursePayload
 */
export function isValidCredoraCoursePayload(
  payload: unknown,
): payload is CredoraCoursePayload {
  if (!payload || typeof payload !== 'object') {
    return false;
  }

  const p = payload as Record<string, unknown>;

  // Required string fields
  if (typeof p.spore_id !== 'string' || p.spore_id.length === 0) {
    return false;
  }
  if (typeof p.course_id !== 'string' || p.course_id.length === 0) {
    return false;
  }
  if (typeof p.issuer_did !== 'string' || p.issuer_did.length === 0) {
    return false;
  }

  // issued_at must be a number
  if (typeof p.issued_at !== 'number') {
    return false;
  }

  // expires_at is optional but must be a number if present
  if (p.expires_at !== undefined && typeof p.expires_at !== 'number') {
    return false;
  }

  // metadata is required and must be an object
  if (!p.metadata || typeof p.metadata !== 'object' || p.metadata === null) {
    return false;
  }

  const meta = p.metadata as Record<string, unknown>;

  // Required metadata fields
  if (
    typeof meta.course_name !== 'string' ||
    meta.course_name.length === 0
  ) {
    return false;
  }
  if (
    typeof meta.completion_date !== 'string' ||
    meta.completion_date.length === 0
  ) {
    return false;
  }

  // grade is optional but must be a string if present
  if (meta.grade !== undefined && typeof meta.grade !== 'string') {
    return false;
  }

  return true;
}

export interface VellumClaimResult {
  claimCellOutput: ccc.CellOutput;
  claimCellData: Uint8Array;
  claimId: string;
}

/**
 * Configuration for creating a Vellum Claim Cell
 */
export interface CreateVellumClaimConfig {
  client?: ccc.Client;
  /** The Spore ID of the certificate this claim references */
  sporeId: string;
  /** Course identifier */
  courseId: string;
  /** The DID of the certificate holder (subject / student of the claim) */
  subjectDid?: string;
  /** DID of the issuer (Credora platform/teacher). Defaults to DEFAULT_CREDORA_ISSUER_DID */
  issuerDid?: string;
  /** Optional recipient lock script for the Claim Cell subject */
  recipientLock?: ccc.Script;
  /** Optional capacity in CKB */
  capacity?: number;
  /** Name of the issuer */
  issuerName: string;
  /** Unix timestamp when certificate was issued */
  issuedAt: number;
  /** Optional expiration timestamp */
  expiresAt?: number;
  /** Optional grade */
  grade?: string;
}

/**
 * Build a CredoraCoursePayload for a certificate
 */
export function buildCredoraCoursePayload(
  config: CreateVellumClaimConfig,
): CredoraCoursePayload {
  const issuerDid = config.issuerDid || '';
  const payload: CredoraCoursePayload = {
    spore_id: config.sporeId,
    course_id: config.courseId,
    issuer_did: issuerDid,
    issued_at: config.issuedAt,
    metadata: {
      course_name: config.issuerName,
      completion_date: new Date(config.issuedAt * 1000)
        .toISOString()
        .split('T')[0],
    },
  };

  if (config.expiresAt !== undefined) {
    payload.expires_at = config.expiresAt;
  }
  if (config.grade !== undefined && config.grade !== '') {
    payload.metadata.grade = config.grade;
  }

  return payload;
}

/**
 * Recursively strip undefined properties from an object (required for DAG-CBOR encoding)
 */
function stripUndefined<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(stripUndefined) as unknown as T;
  }
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      result[key] = stripUndefined(value);
    }
  }
  return result as T;
}

/**
 * Encode a CredoraCoursePayload into DAG-CBOR bytes with JSON fallback
 */
export function encodeCredoraCoursePayload(
  payload: CredoraCoursePayload,
): Uint8Array {
  try {
    const cleaned = stripUndefined(payload);
    const encoded = dagCbor.encode(cleaned);
    return new Uint8Array(encoded);
  } catch {
    return new TextEncoder().encode(JSON.stringify(payload));
  }
}

/**
 * Helper to safely extract 20-byte issuer ID from DID
 */
function resolveIssuerId(issuerDid: string): `0x${string}` {
  try {
    return didToArgs(issuerDid);
  } catch {
    const hash = ccc.hashCkb(new TextEncoder().encode(issuerDid));
    return ('0x' + hash.slice(2, 42)) as `0x${string}`;
  }
}

/**
 * Create a Vellum Claim Cell output and data for inclusion as a dual-output
 */
export async function createVellumClaimCell(
  config: CreateVellumClaimConfig,
): Promise<VellumClaimResult> {
  const issuerDid = config.issuerDid || '';
  const payload = buildCredoraCoursePayload({
    ...config,
    issuerDid,
  });

  if (!isValidCredoraCoursePayload(payload)) {
    throw new Error('Invalid CredoraCoursePayload');
  }

  // Encode with @usevellum/sdk ClaimData (Molecule V1 wrapping DAG-CBOR payload)
  let claimCellData: Uint8Array;
  try {
    const issuerId = resolveIssuerId(issuerDid);
    const nonce = ccc.hexFrom(crypto.getRandomValues(new Uint8Array(32)));
    const claimData = ClaimData.fromV1({
      issuerId,
      nonce,
      issuedAt: BigInt(payload.issued_at),
      expiresAt: payload.expires_at ? BigInt(payload.expires_at) : undefined,
      payload,
    });
    claimCellData = ccc.bytesFrom(claimData.toBytes());
  } catch {
    claimCellData = encodeCredoraCoursePayload(payload);
  }

  // Lock script: recipient lock for the subject
  const lock: ccc.Script = config.recipientLock ?? ({
    codeHash: '0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8',
    hashType: 'type',
    args: '0x',
  } as unknown as ccc.Script);

  // Type script: Claim Type with CredoraCourseSchemaHash in args
  let didCkbCodeHash = '0x' + '00'.repeat(32);
  let didCkbHashType: ccc.HashType = 'type';
  if (config.client && typeof config.client.getKnownScript === 'function') {
    try {
      const known = await config.client.getKnownScript(ccc.KnownScript.DidCkb);
      didCkbCodeHash = known.codeHash;
      didCkbHashType = known.hashType;
    } catch {}
  }

  const didCodeHashHex = (didCkbCodeHash.startsWith('0x') ? didCkbCodeHash.slice(2) : didCkbCodeHash).padStart(64, '0');
  const hashTypeHex = didCkbHashType === 'data' ? '00' : '01';
  const schemaHashHex = CredoraCourseSchemaHash.startsWith('0x') ? CredoraCourseSchemaHash.slice(2) : CredoraCourseSchemaHash;
  const claimTypeArgs = `0x${didCodeHashHex}${hashTypeHex}${schemaHashHex}` as `0x${string}`;

  const claimType: ccc.Script = {
    codeHash: VELLUM_CLAIM_TYPE_CODE_HASH,
    hashType: 'type',
    args: claimTypeArgs,
  } as unknown as ccc.Script;

  const capacityBigInt = config.capacity !== undefined
    ? BigInt(Math.floor(config.capacity * 100_000_000))
    : BigInt(350_00000000); // 350 CKB standard estimate

  const claimCellOutput: ccc.CellOutput = {
    capacity: capacityBigInt,
    lock,
    type: claimType,
  } as unknown as ccc.CellOutput;

  return {
    claimCellOutput,
    claimCellData,
    claimId: `claim_${config.sporeId.slice(0, 16)}`,
  };
}

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
    issuerDid: params.issuerDid,
    issuerName: params.issuerName,
    issuedAt: params.issuedAt,
    expiresAt: params.expiresAt,
    grade: params.grade,
  });

  if (!isValidCredoraCoursePayload(payload)) {
    throw new Error('Invalid CredoraCoursePayload');
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
      payload: stripUndefined(payload),
      issuedAt: params.issuedAt,
      expiresAt: params.expiresAt,
    },
    tx: params.tx,
  });

  return { claimId: result.claimId, tx: result.tx };
}

/**
 * Estimate the size of a CredoraCoursePayload in bytes
 */
export function estimatePayloadSize(
  payload: CredoraCoursePayload,
): number {
  return new TextEncoder().encode(JSON.stringify(payload)).length;
}

/**
 * Find a Claim Cell by its referenced Spore ID
 */
export async function findClaimBySporeId(params: {
  client: ccc.Client;
  subjectDid: string;
  sporeId: string;
  scripts?: ReturnType<typeof getVellumScriptConfig>;
}): Promise<{ claim: Claim; outPoint: ccc.OutPoint } | null> {
  const scripts = params.scripts || getVellumScriptConfig();

  const result = await readClaims({
    client: params.client,
    scripts,
    filter: {
      subject: { did: params.subjectDid },
      schemaHash: CredoraCourseSchemaHash,
    },
  });

  for (const claim of result.claims) {
    // Check if this claim references the target Spore ID
    const payload = claim.payload as Record<string, unknown>;
    if (payload?.spore_id === params.sporeId) {
      return {
        claim,
        outPoint: claim.cell.outPoint,
      };
    }
  }

  return null;
}
