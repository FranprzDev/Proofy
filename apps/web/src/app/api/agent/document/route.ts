import { agent } from "@/lib/agent/client";
import { handle, readJsonObject } from "@/lib/agent/route-helpers";
import type { DocumentInput } from "@/lib/agent/types";

export async function POST(request: Request) {
  return handle(async () => agent.document(await readJsonObject<DocumentInput>(request)));
}
