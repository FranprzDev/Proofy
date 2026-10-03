import "server-only";

import { HttpStatus } from "@/lib/http";
import type { CicdRequest, CicdState, DocumentInput, DocumentState } from "./types";

export class AgentError extends Error {
  constructor(
    readonly status: HttpStatus,
    message: string,
  ) {
    super(message);
  }
}

function config() {
  const url = process.env.AGENT_API_URL;
  const key = process.env.AGENT_API_KEY;
  if (!url || !key) throw new AgentError(HttpStatus.ServiceUnavailable, "Agent service not configured");
  return { url: url.replace(/\/$/, ""), key };
}

const AGENT_TIMEOUT_MS = 110_000;

async function post<TIn, TOut>(path: string, body: TIn, threadId?: string): Promise<TOut> {
  const { url, key } = config();
  const qs = threadId ? `?thread_id=${encodeURIComponent(threadId)}` : "";
  const res = await fetch(`${url}${path}${qs}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-API-Key": key },
    body: JSON.stringify(body),
    cache: "no-store",
    signal: AbortSignal.timeout(AGENT_TIMEOUT_MS),
  });
  if (!res.ok) {
    // The upstream body is not forwarded: it may contain private data.
    // Upstream auth/availability/routing problems are our fault, not the caller's: report them as 502.
    const upstream = [HttpStatus.Unauthorized, HttpStatus.Forbidden, HttpStatus.NotFound, HttpStatus.ServiceUnavailable];
    throw new AgentError(upstream.includes(res.status) || res.status >= 500 ? HttpStatus.BadGateway : res.status, "Agent service error");
  }
  try {
    return (await res.json()) as TOut;
  } catch {
    // An unparsable upstream body is a gateway failure, not a bad request from the caller.
    throw new AgentError(HttpStatus.BadGateway, "Agent service error");
  }
}

export const agent = {
  document: (input: DocumentInput, threadId?: string) =>
    post<DocumentInput, DocumentState>("/document/invoke", input, threadId),
  cicd: (input: CicdRequest, threadId?: string) =>
    post<CicdRequest, CicdState>("/cicd/invoke", input, threadId),
};
