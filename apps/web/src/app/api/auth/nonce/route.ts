import { issueNonce, sessionSecret } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!sessionSecret()) return Response.json({ error: "Auth not configured" }, { status: 503 });
  return Response.json({ nonce: await issueNonce() }, { headers: { "Cache-Control": "no-store" } });
}
