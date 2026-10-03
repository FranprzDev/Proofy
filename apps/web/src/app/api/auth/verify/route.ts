import { isAddress } from "@solana/kit";
import { cluster } from "@/lib/solana/config";
import { consumeNonce, createSession, sessionSecret } from "@/lib/auth/session";
import { verifySiws } from "@/lib/auth/verify";

export const dynamic = "force-dynamic";

const reject = () => Response.json({ error: "Invalid sign-in" }, { status: 401 });

export async function POST(request: Request) {
  if (!sessionSecret()) return Response.json({ error: "Auth not configured" }, { status: 503 });
  const body: unknown = await request.json().catch(() => null);
  if (typeof body !== "object" || body === null) return reject();
  const { address, message, signature } = body as Record<string, unknown>;
  if (typeof address !== "string" || typeof message !== "string" || typeof signature !== "string") return reject();
  if (!isAddress(address) || message.length > 1024) return reject();

  const nonce = await consumeNonce();
  const domain = process.env.SIWS_DOMAIN || request.headers.get("host");
  if (!nonce || !domain) return reject();

  const ok = await verifySiws({ address, message, signature }, { domain, chainId: cluster, nonce });
  if (!ok) return reject();
  await createSession(address);
  return Response.json({ wallet: address });
}
