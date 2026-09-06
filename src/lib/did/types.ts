import type { ccc } from "@ckb-ccc/core";
import type { DidCkbRecord } from "@ckb-ccc/did-ckb";

export interface RecipientResolveResult {
  /** Resolved CKB address for the recipient */
  targetAddress: string;
  /** Lock script for the Spore cell target */
  targetLock: ccc.Script;
  /** The DID string if input was a DID, undefined otherwise */
  did?: string;
  /** Whether the input was a DID */
  isDid: boolean;
  /** Raw DID record if resolved from on-chain (for display purposes) */
  didRecord?: DidCkbRecord;
}
