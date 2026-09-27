import { ccc } from "@ckb-ccc/core";
import {
  isDidCkb,
  resolveDidCkb,
  listDidCkbsByLock,
  type DidCkbRecord,
} from "@ckb-ccc/did-ckb";

export * from "./types";

/**
 * Look up whether a lock script owns any registered did:ckb on-chain
 */
export async function findDidByLock(
  client: ccc.Client,
  lock: ccc.ScriptLike
): Promise<string | null> {
  try {
    const records = await listDidCkbsByLock({ client, lock });
    if (records && records.length > 0 && records[0].did) {
      return records[0].did;
    }
    return null;
  } catch (err) {
    console.warn("Failed to lookup DID by lock:", err);
    return null;
  }
}

/**
 * Look up whether the connected signer owns a registered did:ckb on-chain
 */
export async function findIssuerDid(
  signer: ccc.Signer
): Promise<string | null> {
  try {
    const addressObj = await signer.getRecommendedAddressObj();
    return await findDidByLock(signer.client, addressObj.script);
  } catch (err) {
    console.warn("Failed to lookup issuer DID for signer:", err);
    return null;
  }
}

/**
 * Check if a string is a valid did:ckb: identifier
 */
export function isDidInput(value: string): boolean {
  return isDidCkb(value.trim());
}

/**
 * Resolve a recipient input (CKB address or DID) to a lock script
 */
export async function resolveRecipientInput(
  client: ccc.Client,
  input: string
): Promise<{
  targetAddress: string;
  targetLock: ccc.Script;
  did?: string;
  isDid: boolean;
  didRecord?: DidCkbRecord;
}> {
  const trimmed = input.trim();

  // Case 1: It's a DID
  if (isDidCkb(trimmed)) {
    const record = await resolveDidCkb({ client, did: trimmed });
    if (!record) {
      throw new Error(
        `DID "${trimmed}" does not exist on CKB or has been deactivated.`
      );
    }
    const lock = record.cell.cellOutput.lock;
    // Use ccc.Address.fromScript to convert lock script to address string
    // The { addressPrefix: prefix } object is a valid option type per the CCC SDK
    const addr = ccc.Address.fromScript(
      lock,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { addressPrefix: "ckt" } as any
    );
    const targetAddress = addr.toString();
    return {
      targetAddress,
      targetLock: lock,
      did: trimmed,
      isDid: true,
      didRecord: record,
    };
  }

  // Case 2: It's a CKB address
  if (trimmed.startsWith("ckt") || trimmed.startsWith("ckb")) {
    try {
      const addr = await ccc.Address.fromString(trimmed, client);
      return {
        targetAddress: trimmed,
        targetLock: addr.script,
        isDid: false,
      };
    } catch {
      if (client && typeof (client as any).addressToScript === "function") {
        const script = await (client as any).addressToScript(trimmed);
        if (script) {
          return {
            targetAddress: trimmed,
            targetLock: script,
            isDid: false,
          };
        }
      }
      throw new Error(`Invalid CKB address: "${trimmed}"`);
    }
  }

  throw new Error(
    "Invalid recipient format. Must be a CKB address (ckt/ckb) or did:ckb:..."
  );
}

/**
 * Format a recipient identifier for display
 */
export function formatRecipientIdentifier(id: string): {
  display: string;
  isDid: boolean;
  truncatedDid?: string;
} {
  if (id.startsWith("did:ckb:")) {
    return {
      display: id,
      isDid: true,
      truncatedDid: `${id.slice(0, 12)}...${id.slice(-6)}`,
    };
  }
  return {
    display: id,
    isDid: false,
  };
}
