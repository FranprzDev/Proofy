import "server-only";

import { getSession } from "@/lib/auth/session";
import { AgentError } from "./client";

export async function handle<T>(run: () => Promise<T>): Promise<Response> {
  // TODO(auth): exigir sesión cuando exista SIWS. Mientras tanto la ruta es solo para desarrollo.
  await getSession();
  try {
    return Response.json(await run());
  } catch (e) {
    if (e instanceof AgentError) return Response.json({ error: e.message }, { status: e.status });
    return Response.json({ error: "Solicitud inválida" }, { status: 400 });
  }
}
