// Phantom (injected provider) + SIWS sign-in. Client-only at call time; the helpers below are pure.
import { cluster } from "@/lib/solana/config";
import { buildSiwsMessage, SIWS_STATEMENT } from "./siws";

export const PHANTOM_DOWNLOAD_URL = "https://phantom.app/download";
/** Kept below SIWS_TTL_MS so the server accepts the validity window. */
const SIGN_IN_TTL_MS = 4 * 60 * 1000;
/** EIP-1193 style code Phantom uses when the user rejects a request. */
const USER_REJECTED_CODE = 4001;

type PhantomPublicKey = { toBase58(): string };

export interface PhantomProvider {
  isPhantom?: boolean;
  publicKey: PhantomPublicKey | null;
  connect(options?: { onlyIfTrusted?: boolean }): Promise<{ publicKey: PhantomPublicKey }>;
  disconnect(): Promise<void>;
  signMessage(message: Uint8Array, display?: "utf8" | "hex"): Promise<{ signature: Uint8Array }>;
}

type PhantomWindow = Window & { phantom?: { solana?: PhantomProvider }; solana?: PhantomProvider };

export enum WalletErrorCode {
  NotInstalled = "not_installed",
  Rejected = "rejected",
  AuthUnavailable = "auth_unavailable",
  VerifyFailed = "verify_failed",
  Network = "network",
}

export const WALLET_ERROR_MESSAGES: Record<WalletErrorCode, string> = {
  [WalletErrorCode.NotInstalled]: "Phantom no está instalado.",
  [WalletErrorCode.Rejected]: "Rechazaste la solicitud en Phantom.",
  [WalletErrorCode.AuthUnavailable]: "El inicio de sesión no está disponible en este momento.",
  [WalletErrorCode.VerifyFailed]: "No pudimos verificar la firma. Probá de nuevo.",
  [WalletErrorCode.Network]: "Error de red al conectar la wallet.",
};

export class WalletError extends Error {
  constructor(readonly code: WalletErrorCode) {
    super(WALLET_ERROR_MESSAGES[code]);
  }
}

export function getPhantomProvider(): PhantomProvider | null {
  if (typeof window === "undefined") return null;
  const w = window as PhantomWindow;
  if (w.phantom?.solana?.isPhantom) return w.phantom.solana;
  return w.solana?.isPhantom ? w.solana : null;
}

export function isUserRejection(e: unknown): boolean {
  return typeof e === "object" && e !== null && "code" in e && e.code === USER_REJECTED_CODE;
}

export type SignInParams = { address: string; nonce: string; host: string; origin: string; now: number };

export function buildSignInMessage(p: SignInParams): string {
  return buildSiwsMessage({
    domain: p.host,
    address: p.address,
    statement: SIWS_STATEMENT,
    uri: p.origin,
    chainId: cluster,
    nonce: p.nonce,
    issuedAt: new Date(p.now).toISOString(),
    expirationTime: new Date(p.now + SIGN_IN_TTL_MS).toISOString(),
  });
}

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

async function fetchJson<T>(input: string, init?: RequestInit): Promise<{ status: number; body: T | null }> {
  let res: Response;
  try {
    res = await fetch(input, { cache: "no-store", ...init });
  } catch {
    throw new WalletError(WalletErrorCode.Network);
  }
  return { status: res.status, body: res.ok ? ((await res.json().catch(() => null)) as T | null) : null };
}

export async function fetchSessionWallet(): Promise<string | null> {
  const { body } = await fetchJson<{ wallet: string | null }>("/api/auth/session");
  return body?.wallet ?? null;
}

/** connect → nonce → SIWS message → signMessage → verify. Returns the signed-in wallet address. */
export async function signInWithPhantom(): Promise<string> {
  const provider = getPhantomProvider();
  if (!provider) throw new WalletError(WalletErrorCode.NotInstalled);
  try {
    const { publicKey } = await provider.connect();
    const address = publicKey.toBase58();

    const nonceRes = await fetchJson<{ nonce: string }>("/api/auth/nonce");
    if (!nonceRes.body?.nonce) throw new WalletError(WalletErrorCode.AuthUnavailable);

    const message = buildSignInMessage({
      address,
      nonce: nonceRes.body.nonce,
      host: window.location.host,
      origin: window.location.origin,
      now: Date.now(),
    });
    const { signature } = await provider.signMessage(new TextEncoder().encode(message), "utf8");

    const verifyRes = await fetchJson<{ wallet: string }>("/api/auth/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address, message, signature: bytesToBase64(signature) }),
    });
    if (verifyRes.status === 503) throw new WalletError(WalletErrorCode.AuthUnavailable);
    if (!verifyRes.body?.wallet) throw new WalletError(WalletErrorCode.VerifyFailed);
    return verifyRes.body.wallet;
  } catch (e) {
    if (e instanceof WalletError) throw e;
    if (isUserRejection(e)) throw new WalletError(WalletErrorCode.Rejected);
    throw new WalletError(WalletErrorCode.VerifyFailed);
  }
}

export async function signOut(): Promise<void> {
  await fetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
  await getPhantomProvider()?.disconnect().catch(() => undefined);
}
