import "server-only";

import { createClient, createKeyPairSignerFromBytes, getBase58Encoder, type KeyPairSigner } from "@solana/kit";
import { solanaRpc } from "@solana/kit-plugin-rpc";
import { signer } from "@solana/kit-plugin-signer";
import { cluster, rpcSubscriptionsUrl, rpcUrl, SolanaCluster } from "./config";

const DEVNET_GENESIS_HASH = "EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG";

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

type AttestorClient = ReturnType<typeof attestorClient>;

/**
 * The attestor key is devnet-only. Refuses non-devnet/localnet clusters and, on devnet, verifies the RPC really
 * serves the devnet genesis (a NEXT_PUBLIC_SOLANA_RPC_URL override must not point the key at mainnet).
 */
export async function assertDevnetOnly(client: AttestorClient): Promise<void> {
  if (cluster === SolanaCluster.Localnet) return;
  if (cluster !== SolanaCluster.Devnet) throw new Error("Attestor is devnet-only");
  const genesis = await client.rpc.getGenesisHash().send();
  if (genesis !== DEVNET_GENESIS_HASH) throw new Error("RPC is not devnet");
}
