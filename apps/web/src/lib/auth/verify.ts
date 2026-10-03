import "server-only";

import { address, getBase58Encoder, getPublicKeyFromAddress, signatureBytes, verifySignature } from "@solana/kit";
import { checkSiwsFields, parseSiwsMessage } from "./siws";

/** Decodes a 64-byte signature given as base58 or base64 (candidates that are not 64 bytes are dropped). */
export function decodeSignatures(value: string): Uint8Array[] {
  const out: Uint8Array[] = [];
  if (/^[1-9A-HJ-NP-Za-km-z]{80,90}$/.test(value)) {
    const b = new Uint8Array(getBase58Encoder().encode(value));
    if (b.length === 64) out.push(b);
  }
  if (/^[A-Za-z0-9+/_-]{86}(==)?$/.test(value)) {
    const b = new Uint8Array(Buffer.from(value, "base64"));
    if (b.length === 64) out.push(b);
  }
  return out;
}

export type VerifyInput = { address: string; message: string; signature: string };

/** Verifies a SIWS message: structure, fields (domain/nonce/chain/expiry) and the ed25519 signature. */
export async function verifySiws(
  input: VerifyInput,
  expected: { domain: string; chainId: string; nonce: string },
): Promise<boolean> {
  const fields = parseSiwsMessage(input.message);
  if (!fields) return false;
  if (checkSiwsFields(fields, { ...expected, address: input.address, now: Date.now() }) !== null) return false;
  try {
    const key = await getPublicKeyFromAddress(address(input.address));
    const data = new TextEncoder().encode(input.message);
    for (const sig of decodeSignatures(input.signature)) {
      if (await verifySignature(key, signatureBytes(sig), data)) return true;
    }
    return false;
  } catch {
    return false;
  }
}
