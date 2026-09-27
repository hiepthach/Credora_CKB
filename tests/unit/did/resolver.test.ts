import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  isDidInput,
  formatRecipientIdentifier,
  findDidByLock,
  findIssuerDid,
} from "@/lib/did";
import { listDidCkbsByLock } from "@ckb-ccc/did-ckb";

// Mock @ckb-ccc/did-ckb listDidCkbsByLock while keeping actual isDidCkb
vi.mock("@ckb-ccc/did-ckb", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@ckb-ccc/did-ckb")>();
  return {
    ...actual,
    listDidCkbsByLock: vi.fn(),
  };
});

describe("isDidInput", () => {
  it("returns true for valid did:ckb:", () => {
    // Valid did:ckb: format - exactly 32 base32 lowercase characters after prefix
    // Example: 20 bytes encoded as 32 base32 chars (per WIP-01 spec)
    expect(isDidInput("did:ckb:abcdefghijklmnopqrstuvwxyz234567")).toBe(true);
  });

  it("returns false for CKB addresses", () => {
    expect(isDidInput("ckt1qzda0cr08m85hc8j9np9u2xnjvs2tsq8q5h5xcmr")).toBe(false);
    expect(isDidInput("ckb1qzda0cr08m85hc8j9np9u2xnjvs2tsq8q5h5xcmr")).toBe(false);
  });

  it("returns false for invalid formats", () => {
    expect(isDidInput("")).toBe(false);
    expect(isDidInput("did:eth:0x123")).toBe(false);
    expect(isDidInput("not-a-did")).toBe(false);
    expect(isDidInput("did:ckb:ABCDEFGHIJKLMNOPQRSTUVWXYZ123456")).toBe(false); // uppercase invalid
    expect(isDidInput("did:ckb:short")).toBe(false); // too short
  });
});

describe("formatRecipientIdentifier", () => {
  it("formats DID with truncation", () => {
    const result = formatRecipientIdentifier("did:ckb:abcdefghijklmnopqrstuvwxyz234567");
    expect(result.isDid).toBe(true);
    expect(result.truncatedDid).toBe("did:ckb:abcd...234567");
  });

  it("returns isDid:false for addresses", () => {
    const result = formatRecipientIdentifier("ckt1qzda0cr08m85hc8j9np9u2xnjvs2tsq8q5h5xcmr");
    expect(result.isDid).toBe(false);
    expect(result.display).toBe("ckt1qzda0cr08m85hc8j9np9u2xnjvs2tsq8q5h5xcmr");
  });
});

describe("findDidByLock", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the DID string when listDidCkbsByLock finds records", async () => {
    const mockClient = {} as any;
    const mockLock = { codeHash: "0x123", hashType: "type", args: "0x" } as any;

    vi.mocked(listDidCkbsByLock).mockResolvedValueOnce([
      { did: "did:ckb:qqfounddid1234567890abcdef00000000" } as any,
    ]);

    const did = await findDidByLock(mockClient, mockLock);
    expect(did).toBe("did:ckb:qqfounddid1234567890abcdef00000000");
    expect(listDidCkbsByLock).toHaveBeenCalledWith({
      client: mockClient,
      lock: mockLock,
    });
  });

  it("returns null when listDidCkbsByLock returns an empty array", async () => {
    const mockClient = {} as any;
    const mockLock = { codeHash: "0x123", hashType: "type", args: "0x" } as any;

    vi.mocked(listDidCkbsByLock).mockResolvedValueOnce([]);

    const did = await findDidByLock(mockClient, mockLock);
    expect(did).toBeNull();
  });

  it("handles errors gracefully and returns null", async () => {
    const mockClient = {} as any;
    const mockLock = { codeHash: "0x123", hashType: "type", args: "0x" } as any;

    vi.mocked(listDidCkbsByLock).mockRejectedValueOnce(new Error("RPC network error"));

    const did = await findDidByLock(mockClient, mockLock);
    expect(did).toBeNull();
  });
});

describe("findIssuerDid", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("extracts lock from signer and returns detected DID", async () => {
    const mockLock = { codeHash: "0xabc", hashType: "type", args: "0x999" };
    const mockSigner = {
      client: {} as any,
      getRecommendedAddressObj: vi.fn().mockResolvedValue({
        script: mockLock,
      }),
    } as any;

    vi.mocked(listDidCkbsByLock).mockResolvedValueOnce([
      { did: "did:ckb:qqissuerfromsigner0000000000000" } as any,
    ]);

    const did = await findIssuerDid(mockSigner);
    expect(did).toBe("did:ckb:qqissuerfromsigner0000000000000");
    expect(mockSigner.getRecommendedAddressObj).toHaveBeenCalledTimes(1);
    expect(listDidCkbsByLock).toHaveBeenCalledWith({
      client: mockSigner.client,
      lock: mockLock,
    });
  });

  it("returns null when signer throws an error", async () => {
    const mockSigner = {
      client: {} as any,
      getRecommendedAddressObj: vi.fn().mockRejectedValue(new Error("Signer not ready")),
    } as any;

    const did = await findIssuerDid(mockSigner);
    expect(did).toBeNull();
  });
});
