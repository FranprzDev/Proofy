import { getSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  return Response.json({ wallet: session?.wallet ?? null }, { headers: { "Cache-Control": "no-store" } });
}
