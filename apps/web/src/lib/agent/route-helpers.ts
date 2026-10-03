import "server-only";

import { getSession, type Session } from "@/lib/auth/session";
import { HttpStatus, jsonError } from "@/lib/http";
import { AgentError } from "./client";

export const unauthorized = () => jsonError("Unauthorized", HttpStatus.Unauthorized);

export async function requireSession(): Promise<NonNullable<Session>> {
  const session = await getSession();
  if (!session) throw new AgentError(HttpStatus.Unauthorized, "Unauthorized");
  return session;
}

/** Reads the JSON body and requires an object; throws SyntaxError (mapped to 400 by `handle`) otherwise. */
export async function readJsonObject<T>(request: Request): Promise<T> {
  const body: unknown = await request.json();
  if (typeof body !== "object" || body === null || Array.isArray(body)) throw new SyntaxError("Body must be a JSON object");
  return body as T;
}

export async function handle<T>(run: () => Promise<T>): Promise<Response> {
  if (!(await getSession())) return unauthorized();
  try {
    return Response.json(await run());
  } catch (e) {
    if (e instanceof AgentError) return jsonError(e.message, e.status);
    // Malformed JSON body vs. agent service unreachable (fetch rejects with TypeError / timeout).
    if (e instanceof SyntaxError) return jsonError("Invalid request", HttpStatus.BadRequest);
    return jsonError("Agent service unavailable", HttpStatus.BadGateway);
  }
}
