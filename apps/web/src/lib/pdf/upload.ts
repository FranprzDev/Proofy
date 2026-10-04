// Browser-side upload of a contract PDF to /api/agent/document/pdf. Error mapping is pure.
import type { DocumentState } from "@/lib/agent/types";
import { HttpStatus } from "@/lib/http";
import { MAX_PDF_BYTES } from "./validate";

export const PDF_UPLOAD_ENDPOINT = "/api/agent/document/pdf";

export enum UploadErrorKind {
  Unauthorized = "unauthorized",
  AgentUnavailable = "agent_unavailable",
  Invalid = "invalid",
  Network = "network",
}

export class UploadError extends Error {
  constructor(
    readonly kind: UploadErrorKind,
    message: string,
  ) {
    super(message);
  }
}

/** Maps an HTTP failure from the PDF route to a user-facing (Spanish) error. */
export function describeUploadError(status: number, serverMessage?: string): UploadError {
  if (status === HttpStatus.Unauthorized) return new UploadError(UploadErrorKind.Unauthorized, "Tu sesión expiró. Volvé a conectar la wallet.");
  if (status === HttpStatus.BadGateway || status === HttpStatus.ServiceUnavailable || status === 504) {
    return new UploadError(UploadErrorKind.AgentUnavailable, "El agente no está disponible en este momento. Probá de nuevo en unos minutos.");
  }
  if (status === HttpStatus.PayloadTooLarge) return new UploadError(UploadErrorKind.Invalid, "El PDF supera el máximo de 10 MB.");
  return new UploadError(UploadErrorKind.Invalid, serverMessage || "No se pudo procesar el PDF.");
}

/** Client-side precheck (the server re-validates everything). Returns an error message or null. */
export function precheckPdf(file: { name: string; type: string; size: number }): string | null {
  const looksPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  if (!looksPdf) return "Elegí un archivo PDF.";
  if (file.size === 0) return "El archivo está vacío.";
  if (file.size > MAX_PDF_BYTES) return "El PDF supera el máximo de 10 MB.";
  return null;
}

export async function uploadContractPdf(file: File, signal?: AbortSignal): Promise<DocumentState> {
  const form = new FormData();
  form.append("file", file);
  let res: Response;
  try {
    res = await fetch(PDF_UPLOAD_ENDPOINT, { method: "POST", body: form, signal });
  } catch {
    throw new UploadError(UploadErrorKind.Network, "Error de red al subir el PDF.");
  }
  const body: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const message = typeof body === "object" && body !== null && "error" in body && typeof body.error === "string" ? body.error : undefined;
    throw describeUploadError(res.status, message);
  }
  if (typeof body !== "object" || body === null) throw describeUploadError(HttpStatus.BadGateway);
  return body as DocumentState;
}
