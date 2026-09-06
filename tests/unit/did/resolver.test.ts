import { describe, it, expect, vi } from "vitest";
import { isDidInput, formatRecipientIdentifier } from "@/lib/did";

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
    // "did:ckb:abcdefghijklmnopqrstuvwxyz234567"
    // slice(0,12) = "did:ckb:abcd" (12 chars total: d-i-d-:-c-k-b-:-a-b-c-d)
    // slice(-6) = "234567"
    expect(result.truncatedDid).toBe("did:ckb:abcd...234567");
  });

  it("returns isDid:false for addresses", () => {
    const result = formatRecipientIdentifier("ckt1qzda0cr08m85hc8j9np9u2xnjvs2tsq8q5h5xcmr");
    expect(result.isDid).toBe(false);
    expect(result.display).toBe("ckt1qzda0cr08m85hc8j9np9u2xnjvs2tsq8q5h5xcmr");
  });
});
