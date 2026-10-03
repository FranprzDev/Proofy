import { issueNonce, sessionSecret } from "@/lib/auth/session";
import { HttpStatus, jsonError } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!sessionSecret()) return jsonError("Auth not configured", HttpStatus.ServiceUnavailable);
  return Response.json({ nonce: await issueNonce() }, { headers: { "Cache-Control": "no-store" } });
}
