/**
 * Vellum Claim Cell integration for Credora
 *
 * This module provides Claim Cell creation for the Vellum reputation system.
 * See: docs/Design_spec/09_Vellum_Integration_Design.md
 */

import { ccc } from '@ckb-ccc/core';
import * as dagCbor from '@ipld/dag-cbor';

// Schema hash for credora.course.v1
// TODO: Compute from actual schema manifest using BLAKE2b-256
// For now, using a placeholder that will be replaced with the actual hash
export const CredoraCourseSchemaHash =
  '0x7c5ed5e9a1b8c3d2f6e4a1b8c3d2f6e4a1b8c3d2f6e4a1b8c3d2f6e4a1b8c3d2';

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
  /** The DID of the certificate holder (subject of the claim) */
  subjectDid?: string;
  /** DID used as issuer/subject identifier in payload (alias for subjectDid) */
  issuerDid?: string;
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
  const did = config.issuerDid || config.subjectDid || '';
  return {
    spore_id: config.sporeId,
    course_id: config.courseId,
    issuer_did: did,
    issued_at: config.issuedAt,
    expires_at: config.expiresAt,
    metadata: {
      course_name: config.issuerName,
      completion_date: new Date(config.issuedAt * 1000)
        .toISOString()
        .split('T')[0],
      grade: config.grade,
    },
  };
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
 * Create a Vellum Claim Cell output and data for inclusion as a dual-output
 */
export async function createVellumClaimCell(
  config: CreateVellumClaimConfig,
): Promise<VellumClaimResult> {
  const payload = buildCredoraCoursePayload(config);

  if (!isValidCredoraCoursePayload(payload)) {
    throw new Error('Invalid CredoraCoursePayload');
  }

  const encodedPayload = encodeCredoraCoursePayload(payload);

  const emptyCodeHash = ('0x' + '00'.repeat(32)) as `0x${string}`;
  const claimCellOutput: ccc.CellOutput = {
    capacity: BigInt(350_00000000), // 350 CKB estimate
    lock: {
      codeHash: emptyCodeHash,
      hashType: 'type',
      args: '0x',
    } as unknown as ccc.Script,
    type: {
      codeHash: emptyCodeHash,
      hashType: 'type',
      args: '0x',
    } as unknown as ccc.Script,
  } as unknown as ccc.CellOutput;

  return {
    claimCellOutput,
    claimCellData: encodedPayload,
    claimId: `claim_${config.sporeId.slice(0, 16)}`,
  };
}

/**
 * Estimate the size of a CredoraCoursePayload in bytes
 */
export function estimatePayloadSize(
  payload: CredoraCoursePayload,
): number {
  return new TextEncoder().encode(JSON.stringify(payload)).length;
}
