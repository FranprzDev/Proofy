import "server-only";

import { getSession } from "@/lib/auth/session";
import { AgentError } from "./client";

export async function handle<T>(run: () => Promise<T>): Promise<Response> {
  // TODO(auth): require a session once SIWS exists. Until then this route is for development only.
  await getSession();
  try {
    return Response.json(await run());
  } catch (e) {
    if (e instanceof AgentError) return Response.json({ error: e.message }, { status: e.status });
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
}
