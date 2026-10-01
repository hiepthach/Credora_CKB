import type { Cluster, Template, CertificateDNA } from '@/types';

export interface CertificateStorageItem {
  certificate: CertificateDNA;
  txHash: string;
  sporeId?: string;
  /** DID used for Vellum Claim Cell (stored separately from credentialSubject.id which may be a wallet address) */
  subjectDid?: string;
}

/**
 * Generic LocalCache class with in-memory Map and optional localStorage persistence.
 * Safe for both browser and SSR / Node.js (test) environments.
 */
export class LocalCache<T> {
  private memory = new Map<string, T>();
  private initialized = false;

  constructor(
    private readonly storageKey: string,
    private readonly serializationMode: 'array' | 'entries' = 'array'
  ) {}

  private syncFromStorage(): void {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (this.serializationMode === 'entries' && Array.isArray(parsed)) {
          // Format: [ [key, value], [key, value] ]
          for (const [key, value] of parsed) {
            if (key && value) {
              this.memory.set(key, value);
            }
          }
        } else if (Array.isArray(parsed)) {
          // Format: [ value, value ] where item has an id or clusterId
          for (const item of parsed) {
            const key = (item as any)?.clusterId || (item as any)?.id;
            if (key) {
              this.memory.set(key, item);
            }
          }
        }
      }
    } catch (e) {
      console.error(`Failed to load cache for key "${this.storageKey}":`, e);
    }
  }

  private syncToStorage(): void {
    if (typeof window === 'undefined') return;
    try {
      if (this.serializationMode === 'entries') {
        const arr = Array.from(this.memory.entries());
        localStorage.setItem(this.storageKey, JSON.stringify(arr));
      } else {
        const arr = Array.from(this.memory.values());
        localStorage.setItem(this.storageKey, JSON.stringify(arr));
      }
    } catch (e) {
      console.error(`Failed to save cache for key "${this.storageKey}":`, e);
    }
  }

  private ensureSync(): void {
    if (!this.initialized) {
      this.syncFromStorage();
      this.initialized = true;
    }
  }

  get(key: string): T | undefined {
    this.ensureSync();
    return this.memory.get(key);
  }

  set(key: string, value: T): void {
    this.ensureSync();
    this.memory.set(key, value);
    this.syncToStorage();
  }

  has(key: string): boolean {
    this.ensureSync();
    return this.memory.has(key);
  }

  delete(key: string): boolean {
    this.ensureSync();
    const deleted = this.memory.delete(key);
    if (deleted) {
      this.syncToStorage();
    }
    return deleted;
  }

  clear(): void {
    this.memory.clear();
    this.initialized = false;
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(this.storageKey);
      } catch {}
    }
  }

  values(): T[] {
    this.ensureSync();
    return Array.from(this.memory.values());
  }

  entries(): [string, T][] {
    this.ensureSync();
    return Array.from(this.memory.entries());
  }

  keys(): string[] {
    this.ensureSync();
    return Array.from(this.memory.keys());
  }

  get size(): number {
    this.ensureSync();
    return this.memory.size;
  }
}

// Single source of truth cache instances
export const clusterCache = new LocalCache<Cluster>('ckb_credential_clusters', 'array');
export const certificateCache = new LocalCache<CertificateStorageItem>('ckb_credential_certificates', 'entries');
export const templateCache = new LocalCache<Template>('ckb_credential_templates', 'array');
