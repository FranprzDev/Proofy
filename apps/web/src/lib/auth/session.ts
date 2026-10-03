import "server-only";

import { cookies } from "next/headers";
import { signToken, verifyToken } from "./token";

export type Session = { wallet: string } | null;

const SESSION_COOKIE = "proofy_session";
const NONCE_COOKIE = "proofy_nonce";
export const SESSION_TTL_S = 8 * 60 * 60;
export const NONCE_TTL_S = 5 * 60;

/** Fail closed: without a strong SESSION_SECRET nothing can be signed or verified. */
export function sessionSecret(): string | null {
  const s = process.env.SESSION_SECRET;
  return s && s.length >= 32 ? s : null;
}

const cookieBase = () => ({
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
});

const isFresh = (exp: unknown): exp is number => typeof exp === "number" && exp > Date.now() / 1000;

export async function getSession(): Promise<Session> {
  const secret = sessionSecret();
  if (!secret) return null;
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const p = await verifyToken(token, secret);
  if (typeof p !== "object" || p === null) return null;
  const { wallet, exp } = p as { wallet?: unknown; exp?: unknown };
  return typeof wallet === "string" && isFresh(exp) ? { wallet } : null;
}

export async function createSession(wallet: string): Promise<void> {
  const secret = sessionSecret();
  if (!secret) throw new Error("SESSION_SECRET is not configured");
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_S;
  (await cookies()).set(SESSION_COOKIE, await signToken({ wallet, exp }, secret), { ...cookieBase(), maxAge: SESSION_TTL_S });
}

export async function destroySession(): Promise<void> {
  (await cookies()).set(SESSION_COOKIE, "", { ...cookieBase(), maxAge: 0 });
}

/** Issues a random nonce bound to the browser through a signed, short-lived HttpOnly cookie. */
export async function issueNonce(): Promise<string> {
  const secret = sessionSecret();
  if (!secret) throw new Error("SESSION_SECRET is not configured");
  const nonce = Buffer.from(crypto.getRandomValues(new Uint8Array(16))).toString("hex");
  const exp = Math.floor(Date.now() / 1000) + NONCE_TTL_S;
  (await cookies()).set(NONCE_COOKIE, await signToken({ nonce, exp }, secret), { ...cookieBase(), maxAge: NONCE_TTL_S });
  return nonce;
}

/** Reads and clears the nonce cookie (single use from the browser's perspective). */
export async function consumeNonce(): Promise<string | null> {
  const secret = sessionSecret();
  const jar = await cookies();
  const token = jar.get(NONCE_COOKIE)?.value;
  jar.set(NONCE_COOKIE, "", { ...cookieBase(), maxAge: 0 });
  if (!secret || !token) return null;
  const p = await verifyToken(token, secret);
  if (typeof p !== "object" || p === null) return null;
  const { nonce, exp } = p as { nonce?: unknown; exp?: unknown };
  return typeof nonce === "string" && isFresh(exp) ? nonce : null;
}
