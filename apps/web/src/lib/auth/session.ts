import "server-only";

import { cookies } from "next/headers";
import { AuthMethod, SessionCookie, TokenUse } from "./enums";
import { signToken, verifyToken } from "./token";

export type Session = { wallet: string } | null;

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
  const token = (await cookies()).get(SessionCookie.Session)?.value;
  if (!token) return null;
  const p = await verifyToken(token, secret);
  if (typeof p !== "object" || p === null) return null;
  const { wallet, exp, use, method } = p as Record<string, unknown>;
  if (use !== TokenUse.Session || method !== AuthMethod.SiwsPhantom) return null;
  return typeof wallet === "string" && isFresh(exp) ? { wallet } : null;
}

export async function createSession(wallet: string): Promise<void> {
  const secret = sessionSecret();
  if (!secret) throw new Error("SESSION_SECRET is not configured");
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_S;
  (await cookies()).set(SessionCookie.Session, await signToken({ wallet, exp, use: TokenUse.Session, method: AuthMethod.SiwsPhantom }, secret), { ...cookieBase(), maxAge: SESSION_TTL_S });
}

export async function destroySession(): Promise<void> {
  (await cookies()).set(SessionCookie.Session, "", { ...cookieBase(), maxAge: 0 });
}

/** Issues a random nonce bound to the browser through a signed, short-lived HttpOnly cookie. */
export async function issueNonce(): Promise<string> {
  const secret = sessionSecret();
  if (!secret) throw new Error("SESSION_SECRET is not configured");
  const nonce = Buffer.from(crypto.getRandomValues(new Uint8Array(16))).toString("hex");
  const exp = Math.floor(Date.now() / 1000) + NONCE_TTL_S;
  (await cookies()).set(SessionCookie.Nonce, await signToken({ nonce, exp, use: TokenUse.Nonce }, secret), { ...cookieBase(), maxAge: NONCE_TTL_S });
  return nonce;
}

/** Reads and clears the nonce cookie (single use from the browser's perspective). */
export async function consumeNonce(): Promise<string | null> {
  const secret = sessionSecret();
  const jar = await cookies();
  const token = jar.get(SessionCookie.Nonce)?.value;
  jar.set(SessionCookie.Nonce, "", { ...cookieBase(), maxAge: 0 });
  if (!secret || !token) return null;
  const p = await verifyToken(token, secret);
  if (typeof p !== "object" || p === null) return null;
  const { nonce, exp, use } = p as Record<string, unknown>;
  if (use !== TokenUse.Nonce) return null;
  return typeof nonce === "string" && isFresh(exp) ? nonce : null;
}
