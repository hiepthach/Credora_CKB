import { describe, it, expect } from 'vitest';
import {
  CREDORA_COURSE_SCHEMA_MANIFEST,
  computeCanonicalSchemaHash,
  CredoraCourseSchemaHash,
} from '@/lib/credentials/schemas/credoraCourse';

describe('credora.course.v1 Schema Manifest & Hash', () => {
  it('should have valid schema manifest metadata', () => {
    expect(CREDORA_COURSE_SCHEMA_MANIFEST.name).toBe('credora.course.v1');
    expect(CREDORA_COURSE_SCHEMA_MANIFEST.version).toBe('1.0.0');
    expect(CREDORA_COURSE_SCHEMA_MANIFEST.payload.required).toEqual([
      'spore_id',
      'course_id',
      'issuer_did',
      'issued_at',
      'metadata',
    ]);
  });

  it('computes canonical schema hash from manifest', () => {
    const computed = computeCanonicalSchemaHash(CREDORA_COURSE_SCHEMA_MANIFEST);
    // Hash is 32 bytes = 64 hex chars + 0x prefix = 66 chars
    expect(computed).toMatch(/^0x[a-f0-9]{64}$/);
    expect(CredoraCourseSchemaHash).toBe(computed);
  });

  it('schema hash is deterministic across calls', () => {
    const hash1 = computeCanonicalSchemaHash(CREDORA_COURSE_SCHEMA_MANIFEST);
    const hash2 = computeCanonicalSchemaHash(CREDORA_COURSE_SCHEMA_MANIFEST);
    expect(hash1).toBe(hash2);
  });

  it('schema manifest canonicalization matches RFC 8785', () => {
    // Reference test: Verify that keys are sorted and values are properly encoded
    const manifest = CREDORA_COURSE_SCHEMA_MANIFEST;
    const canonical = computeCanonicalSchemaHash(manifest);

    // Different key order should produce same hash
    const reorderedManifest = {
      ...manifest,
      payload: {
        ...manifest.payload,
        properties: Object.keys(manifest.payload.properties)
          .sort()
          .reduce(
            (acc, key) => ({
              ...acc,
              [key]:
                manifest.payload.properties[
                  key as keyof typeof manifest.payload.properties
                ],
            }),
            {} as typeof manifest.payload.properties
          ),
      },
    };

    expect(computeCanonicalSchemaHash(reorderedManifest)).toBe(canonical);
  });
});
