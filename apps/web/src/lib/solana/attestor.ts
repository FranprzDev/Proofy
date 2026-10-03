import "server-only";

import { createClient, createKeyPairSignerFromBytes, getBase58Encoder, type KeyPairSigner } from "@solana/kit";
import { solanaRpc } from "@solana/kit-plugin-rpc";
import { signer } from "@solana/kit-plugin-signer";
import { rpcSubscriptionsUrl, rpcUrl } from "./config";

/** Parses ATTESTOR_SECRET_KEY: a JSON array of 64 bytes or a base58 string. Server-only. */
export function parseSecretKey(raw: string): Uint8Array {
  const text = raw.trim();
  const bytes = text.startsWith("[")
    ? Uint8Array.from(JSON.parse(text) as number[])
    : Uint8Array.from(getBase58Encoder().encode(text));
  if (bytes.length !== 64) throw new Error("ATTESTOR_SECRET_KEY must decode to 64 bytes");
  return bytes;
}

export async function loadAttestor(): Promise<KeyPairSigner | null> {
  const raw = process.env.ATTESTOR_SECRET_KEY;
  if (!raw) return null;
  try {
    return await createKeyPairSignerFromBytes(parseSecretKey(raw));
  } catch {
    return null;
  }
}

/** Kit client whose payer and identity are the attestor. Legacy-compatible v0 transactions. */
export function attestorClient(attestor: KeyPairSigner) {
  return createClient()
    .use(signer(attestor))
    .use(solanaRpc({ rpcUrl, rpcSubscriptionsUrl, transactionConfig: { version: 0 } }));
}
