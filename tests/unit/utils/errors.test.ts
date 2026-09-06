import { describe, it, expect } from 'vitest';
import { formatCkbError } from '@/utils/errors';

describe('formatCkbError', () => {
  it('maps user rejection to friendly message', () => {
    const error = new Error('User rejected the transaction request');
    const result = formatCkbError(error);
    expect(result.title).toBe('Transaction Cancelled');
    expect(result.message).toContain('declined in your wallet');
  });

  it('maps capacity / faucet errors to faucet action', () => {
    const error = new Error('CapacityNotEnough: required 15000000000 Shannons');
    const result = formatCkbError(error);
    expect(result.title).toBe('Insufficient CKB Balance');
    expect(result.action?.url).toBe('https://faucet.nervos.org');
  });

  it('maps invalid DID errors', () => {
    const error = new Error('DID "did:ckb:123" does not exist on CKB');
    const result = formatCkbError(error);
    expect(result.title).toBe('DID Resolution Failed');
    expect(result.action?.url).toBe('https://vellum-lyart.vercel.app');
  });

  it('maps network and connection errors', () => {
    const error = new Error('Failed to fetch from CKB node RPC: timeout');
    const result = formatCkbError(error);
    expect(result.title).toBe('CKB Node Connection Error');
  });

  it('handles unknown error types safely', () => {
    const result = formatCkbError(null);
    expect(result.title).toBe('Unexpected Error');
    expect(result.message).toBe('An unexpected error occurred.');
  });

  it('handles string errors and fallback generic errors', () => {
    const result = formatCkbError('Something completely arbitrary');
    expect(result.title).toBe('Operation Failed');
    expect(result.message).toBe('Something completely arbitrary');
  });
});

