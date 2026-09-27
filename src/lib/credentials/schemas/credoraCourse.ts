import { ccc } from '@ckb-ccc/core';

export const CREDORA_COURSE_SCHEMA_MANIFEST = {
  name: 'credora.course.v1',
  version: '1.0.0',
  description: 'Credora course completion attestation',
  payload: {
    type: 'object',
    required: ['spore_id', 'course_id', 'issuer_did', 'issued_at', 'metadata'],
    properties: {
      spore_id: { type: 'string' },
      course_id: { type: 'string' },
      issuer_did: { type: 'string' },
      issued_at: { type: 'integer' },
      expires_at: { type: 'integer' },
      metadata: {
        type: 'object',
        required: ['course_name', 'completion_date'],
        properties: {
          course_name: { type: 'string' },
          completion_date: { type: 'string' },
          grade: { type: 'string' },
        },
      },
    },
  },
} as const;

/**
 * RFC 8785 JSON Canonicalization - Recursively canonicalize JSON value
 * Reference: https://datatracker.ietf.org/doc/html/rfc8785
 */
function canonicalizeValue(value: unknown): string {
  if (value === null) return 'null';
  if (value === true) return 'true';
  if (value === false) return 'false';

  if (typeof value === 'number') {
    // RFC 8785: Use JSON number representation (no unnecessary decimals)
    return String(value);
  }

  if (typeof value === 'string') {
    // RFC 8785: JSON string encoding
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return '[' + value.map(canonicalizeValue).join(',') + ']';
  }

  if (typeof value === 'object') {
    // RFC 8785: Sort keys lexicographically
    const keys = Object.keys(value as Record<string, unknown>).sort();
    const pairs = keys.map(
      (k) =>
        JSON.stringify(k) +
        ':' +
        canonicalizeValue((value as Record<string, unknown>)[k])
    );
    return '{' + pairs.join(',') + '}';
  }

  throw new Error(`Unsupported value type: ${typeof value}`);
}

/**
 * Compute canonical JSON string per RFC 8785
 */
export function canonicalizeJson(obj: unknown): string {
  return canonicalizeValue(obj);
}

/**
 * Compute schema hash: CKB_BLAKE2B_256(UTF8(JCS(manifest)))
 */
export function computeCanonicalSchemaHash(manifest: unknown): string {
  const canonical = canonicalizeJson(manifest);
  return ccc.hashCkb(new TextEncoder().encode(canonical));
}

export const CredoraCourseSchemaHash = computeCanonicalSchemaHash(
  CREDORA_COURSE_SCHEMA_MANIFEST
) as `0x${string}`;
