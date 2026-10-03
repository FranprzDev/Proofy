import { agent } from "@/lib/agent/client";
import { handle, readJsonObject } from "@/lib/agent/route-helpers";
import type { CicdRequest } from "@/lib/agent/types";

export async function POST(request: Request) {
  return handle(async () => agent.cicd(await readJsonObject<CicdRequest>(request)));
}
