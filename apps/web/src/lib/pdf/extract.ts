import "server-only";

import { extractText, getDocumentProxy } from "unpdf";
import { normalizeDocumentText } from "./validate";

/** Extracts the selectable text of a PDF (all pages merged), normalized and capped. Throws on unreadable PDFs. */
export async function extractPdfText(bytes: Uint8Array): Promise<string> {
  const pdf = await getDocumentProxy(bytes);
  try {
    const { text } = await extractText(pdf, { mergePages: true });
    return normalizeDocumentText(text);
  } finally {
    await pdf.loadingTask.destroy();
  }
}
