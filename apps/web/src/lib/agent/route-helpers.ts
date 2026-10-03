import "server-only";

import { getSession, type Session } from "@/lib/auth/session";
import { AgentError } from "./client";

export const unauthorized = () => Response.json({ error: "Unauthorized" }, { status: 401 });

export async function requireSession(): Promise<NonNullable<Session>> {
  const session = await getSession();
  if (!session) throw new AgentError(401, "Unauthorized");
  return session;
}

export async function handle<T>(run: () => Promise<T>): Promise<Response> {
  if (!(await getSession())) return unauthorized();
  try {
    return Response.json(await run());
  } catch (e) {
    if (e instanceof AgentError) return Response.json({ error: e.message }, { status: e.status });
    // Malformed JSON body vs. agent service unreachable (fetch rejects with TypeError).
    if (e instanceof SyntaxError) return Response.json({ error: "Invalid request" }, { status: 400 });
    return Response.json({ error: "Agent service unavailable" }, { status: 502 });
  }
}
