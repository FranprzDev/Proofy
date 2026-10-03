import { agent } from "@/lib/agent/client";
import { handle } from "@/lib/agent/route-helpers";
import type { CicdInput } from "@/lib/agent/types";

export async function POST(request: Request) {
  return handle(async () => agent.cicd((await request.json()) as CicdInput));
}
