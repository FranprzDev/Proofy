import "server-only";

import type { CicdInput, CicdState, DocumentInput, DocumentState } from "./types";

export class AgentError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

function config() {
  const url = process.env.AGENT_API_URL;
  const key = process.env.AGENT_API_KEY;
  if (!url || !key) throw new AgentError(503, "Agent service not configured");
  return { url: url.replace(/\/$/, ""), key };
}

async function post<TIn, TOut>(path: string, body: TIn, threadId?: string): Promise<TOut> {
  const { url, key } = config();
  const qs = threadId ? `?thread_id=${encodeURIComponent(threadId)}` : "";
  const res = await fetch(`${url}${path}${qs}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-API-Key": key },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) {
    // The upstream body is not forwarded: it may contain private data.
    throw new AgentError(res.status === 401 || res.status === 503 ? 502 : res.status, "Agent service error");
  }
  return (await res.json()) as TOut;
}

export const agent = {
  document: (input: DocumentInput, threadId?: string) =>
    post<DocumentInput, DocumentState>("/document/invoke", input, threadId),
  cicd: (input: CicdInput, threadId?: string) =>
    post<CicdInput, CicdState>("/cicd/invoke", input, threadId),
};
