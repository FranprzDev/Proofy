// Public cluster config (usable on client and server). Mainnet is intentionally unsupported.
import { address, type Address } from "@solana/kit";

export enum SolanaCluster {
  Devnet = "devnet",
  Testnet = "testnet",
  Localnet = "localnet",
}
export type Cluster = SolanaCluster;

const CLUSTERS: Record<SolanaCluster, { chain: string; rpc: string; ws: string }> = {
  [SolanaCluster.Devnet]: { chain: "solana:devnet", rpc: "https://api.devnet.solana.com", ws: "wss://api.devnet.solana.com" },
  [SolanaCluster.Testnet]: { chain: "solana:testnet", rpc: "https://api.testnet.solana.com", ws: "wss://api.testnet.solana.com" },
  [SolanaCluster.Localnet]: { chain: "solana:localnet", rpc: "http://127.0.0.1:8899", ws: "ws://127.0.0.1:8900" },
};

/** Unknown values (including mainnet names) fall back to devnet. */
export function resolveCluster(raw: string | undefined): SolanaCluster {
  return Object.values(SolanaCluster).find((c) => c === raw) ?? SolanaCluster.Devnet;
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
  const suffix = cluster === SolanaCluster.Localnet ? "?cluster=custom&customUrl=" + encodeURIComponent(rpcUrl) : `?cluster=${cluster}`;
  return `https://explorer.solana.com/tx/${signature}${suffix}`;
}

export function shortAddress(value: string): string {
  return value.length > 10 ? `${value.slice(0, 4)}…${value.slice(-4)}` : value;
}
