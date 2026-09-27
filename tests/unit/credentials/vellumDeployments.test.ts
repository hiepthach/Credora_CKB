import { describe, it, expect } from 'vitest';
import {
  VELLUM_CLAIM_TYPE_DEPLOYMENT,
  VELLUM_DID_LOCK_DEPLOYMENT,
  getVellumScriptConfig,
} from '@/lib/credentials/vellumClaim';

describe('Vellum Testnet Deployments', () => {
  it('has official Testnet Claim Type deployment locators', () => {
    expect(VELLUM_CLAIM_TYPE_DEPLOYMENT.codeHash).toBe(
      '0xfb2757e524b3f83161d8b85b8b3e00186e2019ff04f5dfe833c5a72731e13157'
    );
    expect(VELLUM_CLAIM_TYPE_DEPLOYMENT.hashType).toBe('type');
    expect(VELLUM_CLAIM_TYPE_DEPLOYMENT.cellDep.outPoint.txHash).toBe(
      '0xaf693346282063a5d51f79d180fc807cdba1b8ac9d7af30085ff0aa190e2686c'
    );
    expect(VELLUM_CLAIM_TYPE_DEPLOYMENT.cellDep.outPoint.index).toBe(0);
  });

  it('has official Testnet DID Lock deployment locators', () => {
    expect(VELLUM_DID_LOCK_DEPLOYMENT.codeHash).toBe(
      '0xe1562cc57b4bd91619ada2f7e74d63805ea7038a7b6de0b18a529d51aa883d2d'
    );
    expect(VELLUM_DID_LOCK_DEPLOYMENT.hashType).toBe('type');
    expect(VELLUM_DID_LOCK_DEPLOYMENT.cellDep.outPoint.txHash).toBe(
      '0xaf693346282063a5d51f79d180fc807cdba1b8ac9d7af30085ff0aa190e2686c'
    );
    expect(VELLUM_DID_LOCK_DEPLOYMENT.cellDep.outPoint.index).toBe(1);
  });

  it('generates valid ClaimScriptConfigLike compatible with @usevellum/sdk', () => {
    const config = getVellumScriptConfig();
    expect(config.claimType.codeHash).toBe(
      VELLUM_CLAIM_TYPE_DEPLOYMENT.codeHash
    );
    expect(config.didLock?.codeHash).toBe(VELLUM_DID_LOCK_DEPLOYMENT.codeHash);
  });
});
