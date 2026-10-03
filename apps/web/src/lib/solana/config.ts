// Public cluster config (usable on client and server). Mainnet is intentionally unsupported.
import { address, type Address } from "@solana/kit";

const CLUSTERS = {
  devnet: { chain: "solana:devnet", rpc: "https://api.devnet.solana.com", ws: "wss://api.devnet.solana.com" },
  testnet: { chain: "solana:testnet", rpc: "https://api.testnet.solana.com", ws: "wss://api.testnet.solana.com" },
  localnet: { chain: "solana:localnet", rpc: "http://127.0.0.1:8899", ws: "ws://127.0.0.1:8900" },
} as const;

export type Cluster = keyof typeof CLUSTERS;

export function resolveCluster(raw: string | undefined): Cluster {
  return raw && raw in CLUSTERS ? (raw as Cluster) : "devnet";
}

export const cluster: Cluster = resolveCluster(process.env.NEXT_PUBLIC_SOLANA_CLUSTER);
export const chain = CLUSTERS[cluster].chain;
export const rpcUrl: string = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || CLUSTERS[cluster].rpc;
export const rpcSubscriptionsUrl: string = process.env.NEXT_PUBLIC_SOLANA_RPC_URL
  ? rpcUrl.replace(/^http/, "ws")
  : CLUSTERS[cluster].ws;

/** Escrow program id (NEXT_PUBLIC_ESCROW_PROGRAM_ID). Throws when missing or malformed. */
export function getEscrowProgramId(): Address {
  const raw = process.env.NEXT_PUBLIC_ESCROW_PROGRAM_ID;
  if (!raw) throw new Error("NEXT_PUBLIC_ESCROW_PROGRAM_ID is not set");
  return address(raw);
}

export function explorerTxUrl(signature: string): string {
  const suffix = cluster === "localnet" ? "?cluster=custom&customUrl=" + encodeURIComponent(rpcUrl) : `?cluster=${cluster}`;
  return `https://explorer.solana.com/tx/${signature}${suffix}`;
}

export function shortAddress(value: string): string {
  return value.length > 10 ? `${value.slice(0, 4)}…${value.slice(-4)}` : value;
}
