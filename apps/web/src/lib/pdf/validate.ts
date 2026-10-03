// Pure PDF upload checks, shared by the route and the browser.
export const MAX_PDF_BYTES = 10 * 1024 * 1024;
/** Upper bound on the text forwarded to the agent. */
export const MAX_DOCUMENT_CHARS = 200_000;

const PDF_MAGIC = [0x25, 0x50, 0x44, 0x46, 0x2d]; // "%PDF-"

/** True when the bytes start with the `%PDF-` header (the MIME type alone is client-controlled). */
export function isPdf(bytes: Uint8Array): boolean {
  return bytes.length >= PDF_MAGIC.length && PDF_MAGIC.every((b, i) => bytes[i] === b);
}

/** Normalizes extracted text and caps it; returns "" when nothing selectable remains (e.g. scanned PDFs). */
export function normalizeDocumentText(raw: string, maxChars = MAX_DOCUMENT_CHARS): string {
  const text = raw
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t\f\v]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return text.slice(0, maxChars);
}
