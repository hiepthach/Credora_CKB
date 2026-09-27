/**
 * Vellum Claim Cell integration for Credora
 *
 * This module provides Claim Cell creation for the Vellum reputation system.
 * See: docs/Design_spec/09_Vellum_Integration_Design.md
 */

import type { ccc } from '@ckb-ccc/core';

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
  /** The Spore ID of the certificate this claim references */
  sporeId: string;
  /** Course identifier */
  courseId: string;
  /** The DID of the certificate holder (subject of the claim) */
  subjectDid: string;
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
  return {
    spore_id: config.sporeId,
    course_id: config.courseId,
    issuer_did: config.subjectDid,
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
 * Estimate the size of a CredoraCoursePayload in bytes
 */
export function estimatePayloadSize(
  payload: CredoraCoursePayload,
): number {
  return new TextEncoder().encode(JSON.stringify(payload)).length;
}
