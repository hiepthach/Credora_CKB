import { vi } from 'vitest';
import '@testing-library/jest-dom';

// Mock crypto.getRandomValues for tests
if (typeof globalThis.crypto === 'undefined') {
  (globalThis as unknown as { crypto: Crypto }).crypto = {
    getRandomValues: (array: Uint8Array): Uint8Array => {
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
      return array;
    },
  } as Crypto;
}

// Mock File class for jsdom
class MockFile extends Blob {
  name: string;
  lastModified: number;
  private _content: string;

  constructor(parts: (string | Blob)[], fileName: string, options?: { type?: string }) {
    const content = parts.map(p => typeof p === 'string' ? p : '').join('');
    super([content], { type: options?.type || '' });
    this._content = content;
    this.name = fileName;
    this.lastModified = Date.now();
  }

  async text(): Promise<string> {
    return this._content;
  }

  async arrayBuffer(): Promise<ArrayBuffer> {
    return new TextEncoder().encode(this._content).buffer;
  }
}

// Make MockFile available globally
(globalThis as unknown as { File: typeof MockFile }).File = MockFile;

// Mock crypto.randomUUID
if (!('randomUUID' in globalThis.crypto)) {
  (globalThis.crypto as unknown as { randomUUID: () => string }).randomUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  };
}

// Mock fetch
if (typeof globalThis.fetch === 'undefined') {
  globalThis.fetch = async () => {
    throw new Error('fetch not implemented');
  };
}

// Mock @ckb-ccc/spore
let sporeCallCount = 0;

vi.mock('@ckb-ccc/spore', () => ({
  createSporeCluster: vi.fn().mockResolvedValue({
    tx: {
      completeInputsByCapacity: vi.fn().mockResolvedValue(undefined),
      completeFeeBy: vi.fn().mockResolvedValue(undefined),
    },
    id: '0x' + '1'.repeat(64),
  }),
  createSpore: vi.fn().mockImplementation(() => {
    sporeCallCount++;
    const uniqueId = '0x' + Array.from({ length: 64 }, (_, i) => {
      if (i < 62) return '2';
      return (sporeCallCount % 16).toString(16);
    }).join('');
    return Promise.resolve({
      tx: {
        completeInputsByCapacity: vi.fn().mockResolvedValue(undefined),
        completeFeeBy: vi.fn().mockResolvedValue(undefined),
      },
      id: uniqueId,
    });
  }),
  meltSpore: vi.fn().mockResolvedValue({
    tx: {
      completeInputsByCapacity: vi.fn().mockResolvedValue(undefined),
      completeFeeBy: vi.fn().mockResolvedValue(undefined),
    },
  }),
  transferSpore: vi.fn().mockResolvedValue({
    tx: {
      completeInputsByCapacity: vi.fn().mockResolvedValue(undefined),
      completeFeeBy: vi.fn().mockResolvedValue(undefined),
    },
  }),
  transferSporeCluster: vi.fn().mockResolvedValue({
    tx: {
      completeInputsByCapacity: vi.fn().mockResolvedValue(undefined),
      completeFeeBy: vi.fn().mockResolvedValue(undefined),
    },
  }),
  findCluster: vi.fn(),
  findSpore: vi.fn(),
  findSpores: vi.fn(),
  findSporeClusters: vi.fn(),
  findSporesBySigner: vi.fn(),
  findSporeClustersBySigner: vi.fn(),
}));

// Mock @ckb-ccc/spore/advanced
vi.mock('@ckb-ccc/spore/advanced', () => ({
  unpackToRawSporeData: vi.fn().mockImplementation((data: any) => {
    return {
      contentType: 'application/json',
      content: data,
    };
  }),
  packRawSporeData: vi.fn().mockImplementation((data: any) => {
    const contentLen = data?.content ? (data.content.length ?? 0) : 0;
    const hasCluster = Boolean(data?.clusterId);
    const overhead = hasCluster ? 76 : 40;
    return new Uint8Array(overhead + contentLen);
  }),
}));

// Mock @ckb-ccc/core
vi.mock('@ckb-ccc/core', () => ({
  ccc: {
    bytesFrom: (val: any) => val,
    hexFrom: (val: any) => String(val),
  },
  ClientPublicTestnet: vi.fn().mockImplementation(() => ({
    getTransaction: vi.fn().mockResolvedValue({ transaction: { outputsData: [] } }),
    findCellsByLock: vi.fn().mockReturnValue({
      [Symbol.asyncIterator]: () => ({
        next: vi.fn().mockResolvedValue({ done: true, value: undefined }),
      }),
    }),
    findTransactionsByLock: vi.fn().mockReturnValue({
      [Symbol.asyncIterator]: () => ({
        next: vi.fn().mockResolvedValue({ done: true, value: undefined }),
      }),
    }),
  })),
  ClientPublicMainnet: vi.fn().mockImplementation(() => ({})),
  ClientPublicRpc: vi.fn().mockImplementation(() => ({})),
  Address: {
    fromString: vi.fn().mockResolvedValue({
      script: {
        args: '0x',
        codeHash: '0x',
        hashType: 'type',
      },
    }),
  },
}));

