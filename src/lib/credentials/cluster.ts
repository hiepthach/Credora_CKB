import { ccc, Address as CkbAddress, ClientPublicTestnet } from '@ckb-ccc/core';
import { createSporeCluster, findSporeClusters, findCluster } from '@ckb-ccc/spore';
import type { Cluster, ClusterConfig } from '@/types';
import { clusterCache } from '@/lib/storage';

interface CreateClusterResult {
  clusterId: string;
  transactionHash: string;
}

/**
 * Create a new cluster (Course Provider) on CKB
 * Uses Spore Cluster cells to store provider identity
 */
export async function createCluster(params: {
  signer: unknown; // ccc.Signer in production
  config: ClusterConfig;
  creatorAddress?: string;
}): Promise<CreateClusterResult> {
  const { config, signer } = params;

  // If a live CCC signer is connected, construct and send a real on-chain transaction
  if (
    signer &&
    typeof signer === 'object' &&
    'client' in signer &&
    typeof (signer as any).sendTransaction === 'function' &&
    typeof (signer as any).getRecommendedAddressObj === 'function'
  ) {
    const liveSigner = signer as ccc.Signer;
    const addrObj = await liveSigner.getRecommendedAddressObj();
    const creatorAddress = addrObj.toString();

    // Encode cluster metadata
    const clusterMetadata = {
      name: config.name,
      description: config.description,
      websiteUrl: config.websiteUrl || '',
      contactEmail: config.contactEmail || '',
      issuerDid: config.issuerDid || '',
    };

    try {
      // Use CCC Spore SDK to create the cluster cell
      const { tx, id: clusterId } = await createSporeCluster({
        signer: liveSigner,
        data: {
          name: config.name,
          description: JSON.stringify(clusterMetadata),
        },
        to: addrObj.script,
      });

      await tx.completeInputsByCapacity(liveSigner);
      await tx.completeFeeBy(liveSigner, 1000);
      const txHash = await liveSigner.sendTransaction(tx);

      const cluster: Cluster = {
        id: clusterId,
        clusterId,
        name: config.name,
        description: config.description,
        websiteUrl: config.websiteUrl,
        contactEmail: config.contactEmail,
        issuerDid: config.issuerDid,
        creatorAddress,
        createdAt: new Date().toISOString(),
      };

      clusterCache.set(clusterId, cluster);

      return {
        clusterId,
        transactionHash: txHash,
      };
    } catch (err: any) {
      const msg = err?.message || String(err);
      if (msg.includes('capacity') || msg.includes('balance') || msg.includes('Inputs') || msg.includes('LiveCells')) {
        throw new Error(
          `Insufficient CKB capacity in wallet. You need at least ~100 CKB to create an on-chain Cluster cell. Please claim free testnet CKB from https://faucet.nervos.org.`
        );
      }
      throw err;
    }
  }

  throw new Error('Live signer is required to create a cluster');
}

/**
 * Get cluster by ID
 */
export async function getCluster(clusterId: string, client?: unknown): Promise<Cluster | null> {
  const cached = clusterCache.get(clusterId);
  if (cached) return cached;

  // If not in cache and clusterId is a valid hex, query on-chain with findCluster
  if (
    typeof window !== 'undefined' &&
    clusterId.startsWith('0x') &&
    clusterId.length === 66
  ) {
    try {
      const ckbClient =
        (client as ccc.Client) ||
        (ClientPublicTestnet ? new ClientPublicTestnet() : new ccc.ClientPublicTestnet());
      const found = await findCluster(ckbClient, clusterId as `0x${string}`);
      if (found) {
        let meta: any = {
          name: found.clusterData.name,
          description: found.clusterData.description,
        };
        if (found.clusterData.description) {
          try {
            const parsed = JSON.parse(found.clusterData.description);
            if (typeof parsed === 'object' && parsed !== null) {
              meta = { ...meta, ...parsed };
            }
          } catch {}
        }
        const cluster: Cluster = {
          id: clusterId,
          clusterId,
          name: meta.name || found.clusterData.name || `Cluster ${clusterId.slice(0, 10)}...`,
          description: meta.description || found.clusterData.description || '',
          websiteUrl: meta.websiteUrl || '',
          contactEmail: meta.contactEmail || '',
          issuerDid: meta.issuerDid || undefined,
          creatorAddress: meta.creatorAddress || '',
          createdAt: meta.createdAt || new Date().toISOString(),
        };
        return cluster;
      }
    } catch (e) {
      console.warn('Error querying on-chain cluster:', e);
    }
  }

  return null;
}

/**
 * Get all clusters owned by an address
 */
export async function getProviderClusters(
  address?: string,
  client?: unknown
): Promise<Cluster[]> {
  if (!address || !address.trim()) {
    return [];
  }

  // 1. Purge any invalid/polluted entries from cache (e.g. certificate DNA stored by mistake)
  const keysToDelete: string[] = [];
  for (const [id, cluster] of clusterCache.entries()) {
    if (
      cluster.description &&
      (cluster.description.includes('@context') ||
        cluster.description.includes('VerifiableCredential') ||
        cluster.description.includes('CourseCertificate'))
    ) {
      keysToDelete.push(id);
    }
  }
  keysToDelete.forEach((id) => clusterCache.delete(id));

  // 2. Get cached clusters, strictly filtering by matching creatorAddress
  const results: Cluster[] = clusterCache.values().filter((c) => {
    const isValidCluster = !c.description ||
      (!c.description.includes('@context') && !c.description.includes('VerifiableCredential'));

    const matchesAddress =
      Boolean(c.creatorAddress && c.creatorAddress.toLowerCase() === address.toLowerCase());

    return isValidCluster && matchesAddress;
  });

  const seenIds = new Set(results.map((c) => c.clusterId));

  if (address && typeof window !== 'undefined') {
    try {
      const ckbClient =
        (client as ccc.Client) ||
        (ClientPublicTestnet ? new ClientPublicTestnet() : new ccc.ClientPublicTestnet());
      const AddressClass = CkbAddress;
      if (AddressClass?.fromString) {
        const addrObj = await AddressClass.fromString(address, ckbClient);

        // 2. Query real Spore Clusters via CCC Spore SDK (filters strictly by Spore Cluster script)
        for await (const { cluster, clusterData } of findSporeClusters({
          client: ckbClient,
          lock: addrObj.script,
        })) {
          if (!cluster.cellOutput.type?.args) continue;
          const clusterId = ccc.hexFrom(cluster.cellOutput.type.args);

          if (!seenIds.has(clusterId)) {
            seenIds.add(clusterId);
            let meta: any = {
              name: clusterData.name,
              description: clusterData.description,
            };

            if (clusterData.description) {
              try {
                const parsed = JSON.parse(clusterData.description);
                if (typeof parsed === 'object' && parsed !== null) {
                  meta = { ...meta, ...parsed };
                }
              } catch {}
            }

            const clusterObj: Cluster = {
              id: clusterId,
              clusterId,
              name: meta.name || clusterData.name || `Cluster ${clusterId.slice(0, 10)}...`,
              description: meta.description || clusterData.description || '',
              websiteUrl: meta.websiteUrl || '',
              contactEmail: meta.contactEmail || '',
              issuerDid: meta.issuerDid || undefined,
              creatorAddress: address,
              createdAt: meta.createdAt || new Date().toISOString(),
            };

            results.push(clusterObj);
          }
        }
      }
    } catch (e) {
      console.warn('Error querying on-chain spore clusters:', e);
    }
  }

  if (!address) return results;
  return results.filter((c) => {
    return (
      c.creatorAddress &&
      c.creatorAddress.toLowerCase() === address.toLowerCase()
    );
  });
}

export function saveClusterToCache(cluster: Cluster): void {
  clusterCache.set(cluster.clusterId, cluster);
}

export function clearClusterCache(): void {
  clusterCache.clear();
}

export function getClustersFromCache(): Cluster[] {
  return clusterCache.values();
}
