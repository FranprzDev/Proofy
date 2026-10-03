import { agent, AgentError } from "@/lib/agent/client";
import { handle } from "@/lib/agent/route-helpers";
import { HttpStatus } from "@/lib/http";
import { extractPdfText } from "@/lib/pdf/extract";
import { isPdf, MAX_PDF_BYTES } from "@/lib/pdf/validate";

export const runtime = "nodejs";
// The agent call alone may take up to 110 s.
export const maxDuration = 120;

// Multipart framing overhead allowed on top of the file itself.
const FORM_OVERHEAD_BYTES = 64 * 1024;
const MAX_CONTRACT_ID_LENGTH = 128;

const fail = (status: HttpStatus, message: string): never => {
  throw new AgentError(status, message);
};

async function readForm(request: Request): Promise<FormData> {
  const length = Number(request.headers.get("content-length"));
  if (length > MAX_PDF_BYTES + FORM_OVERHEAD_BYTES) fail(HttpStatus.PayloadTooLarge, "El PDF supera el máximo de 10 MB");
  try {
    return await request.formData();
  } catch {
    return fail(HttpStatus.BadRequest, "Se esperaba multipart/form-data con el campo 'file'");
  }
}

async function extractOrFail(bytes: Uint8Array): Promise<string> {
  try {
    return await extractPdfText(bytes);
  } catch {
    return fail(HttpStatus.UnprocessableEntity, "No se pudo leer el PDF");
  }
}

export async function POST(request: Request) {
  return handle(async () => {
    const form = await readForm(request);
    const file = form.get("file");
    if (!(file instanceof File)) return fail(HttpStatus.BadRequest, "Falta el archivo 'file'");
    if (file.size > MAX_PDF_BYTES) fail(HttpStatus.PayloadTooLarge, "El PDF supera el máximo de 10 MB");

    const bytes = new Uint8Array(await file.arrayBuffer());
    if (!isPdf(bytes)) fail(HttpStatus.BadRequest, "El archivo no es un PDF válido");

    const rawId = form.get("contract_id");
    const contractId = typeof rawId === "string" && rawId.trim() ? rawId.trim() : crypto.randomUUID();
    if (contractId.length > MAX_CONTRACT_ID_LENGTH) fail(HttpStatus.BadRequest, "contract_id demasiado largo");

    const text = await extractOrFail(bytes);
    if (!text) fail(HttpStatus.UnprocessableEntity, "El PDF no contiene texto seleccionable");

    return agent.document({ contract_id: contractId, document: text, contract_version: "draft" });
  });
}
