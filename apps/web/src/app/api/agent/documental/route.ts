import { agent } from "@/lib/agent/client";
import { handle } from "@/lib/agent/route-helpers";
import type { DocumentalInput } from "@/lib/agent/types";

export async function POST(request: Request) {
  return handle(async () => agent.documental((await request.json()) as DocumentalInput));
}
