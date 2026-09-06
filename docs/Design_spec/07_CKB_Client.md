# CKB Client Configuration — Unit Design

## 1. Overview

| Item | Details |
|------|---------|
| **Module** | CKB Client Configuration |
| **Files** | `src/lib/ckb/config.ts`, `src/lib/ckb/client.ts`, `src/lib/ckb/index.ts` |
| **Purpose** | Configure CCC SDK and @ckb-ccc/spore for different networks |
| **Dependencies** | `@ckb-ccc/core`, `@ckb-ccc/spore` |

---

## 2. Purpose

The CKB Client Configuration module provides centralized setup for connecting to CKB networks (testnet, mainnet) and exports the `@ckb-ccc/spore` utilities for creating and managing Spore and Cluster cells.

---

## 3. Public API

### 3.1 Files

```typescript
// config.ts - Network and explorer configurations
export function getNetwork(): Network;
export function getNetworkConfig(): NetworkConfig;
export function getExplorerUrl(): string;
export function getTransactionUrl(txHash: string): string;
export function getCellUrl(typeHash: string): string;
export function getAddressUrl(address: string): string;

// client.ts - Client creation
export function createClient(): ccc.Client;
export function getDefaultClient(): ccc.Client;

// index.ts - Re-export all CKB and Spore utilities
export * from './config';
export * from './client';
export {
  createSporeCluster,
  createSpore,
  meltSpore,
  transferSpore,
  transferSporeCluster,
  findSpore,
  findCluster,
  findSpores,
  findSporeClusters,
  findSporesBySigner,
  findSporeClustersBySigner,
} from '@ckb-ccc/spore';
```

### 3.2 Types

```typescript
type Network = 'testnet' | 'mainnet';

interface NetworkConfig {
  ckbNodeUrl: string;
  ckbIndexerUrl: string;
  explorerUrl: string;
}
```

---

## 4. Network Configurations

### 4.1 Network Matrix

| Network | Node URL | Indexer URL | Explorer |
|---------|----------|------------|----------|
| **Testnet** | https://testnet.ckb.dev | https://testnet.ckb.dev | https://testnet.explorer.nervos.org |
| **Mainnet** | https://mainnet.ckb.com | https://mainnet.ckb.com | https://explorer.nervos.org |

---

## 5. Spore & CCC Integration

`@ckb-ccc/spore` natively integrates with `@ckb-ccc/core` clients and signers without requiring Lumos RPC or external fetch polyfills.

```typescript
export function getNetwork(): Network {
  return (process.env.NEXT_PUBLIC_NETWORK || 'testnet') as Network;
}

export function getNetworkConfig(): NetworkConfig {
  const network = getNetwork();
  return NETWORK_CONFIGS[network];
}

export function getExplorerUrl(): string {
  return getNetworkConfig().explorerUrl;
}
```

---

## 6. Client Creation

### 6.1 Client Factory

```typescript
import { ccc } from '@ckb-ccc/core';
import { getNetwork } from './config';

let clientInstance: ccc.Client | null = null;

export function createClient(): ccc.Client {
  const network = getNetwork();

  switch (network) {
    case 'testnet':
      return new ccc.ClientPublicTestnet();
    case 'mainnet':
      return new ccc.ClientPublicMainnet();
  }
}

export function getDefaultClient(): ccc.Client {
  if (!clientInstance) {
    clientInstance = createClient();
  }
  return clientInstance;
}
```

---

## 7. Related Documents

| Document | Path |
|----------|------|
| Implementation Architecture | `Design_spec/Implementation_Architecture.md` |
| Cluster Service | `Design_spec/01_Cluster_Service.md` |
| Certificate Service | `Design_spec/03_Certificate_Service.md` |

---

## 8. References

| Resource | Link |
|----------|------|
| CCC SDK | https://docs.ckbccc.com |
| CCC Spore SDK | https://github.com/ckb-ecofund/ccc |
| OffCKB | https://github.com/nervosnetwork/offckb |

---

*Version: 2.0*
*Last Updated: 2026-08-29*
