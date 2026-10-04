import { describe, expect, it } from "vitest";
import { extractPdfText } from "@/lib/pdf/extract";
import { describeUploadError, precheckPdf, UploadErrorKind } from "@/lib/pdf/upload";
import { isPdf, MAX_PDF_BYTES, normalizeDocumentText } from "@/lib/pdf/validate";

/** Builds a tiny one-page PDF (with a correct xref table); `text` null yields a page with no text. */
function makePdf(text: string | null): Uint8Array {
  const stream = text === null ? "" : `BT /F1 12 Tf 72 720 Td (${text}) Tj ET`;
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];
  let out = "%PDF-1.4\n";
  const offsets: number[] = [];
  objects.forEach((body, i) => {
    offsets.push(out.length);
    out += `${i + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xref = out.length;
  out += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  out += offsets.map((o) => `${String(o).padStart(10, "0")} 00000 n \n`).join("");
  out += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return new TextEncoder().encode(out);
}

describe("isPdf", () => {
  it("checks the %PDF- magic bytes", () => {
    expect(isPdf(makePdf("x"))).toBe(true);
    expect(isPdf(new TextEncoder().encode("%PDF"))).toBe(false);
    expect(isPdf(new TextEncoder().encode("<html>%PDF-1.4"))).toBe(false);
    expect(isPdf(new Uint8Array())).toBe(false);
  });
});

describe("normalizeDocumentText", () => {
  it("collapses whitespace, trims and caps", () => {
    expect(normalizeDocumentText("  a \t b\r\n\n\n\n c  ")).toBe("a b\n\nc");
    expect(normalizeDocumentText(" \n\t ")).toBe("");
    expect(normalizeDocumentText("abcdef", 3)).toBe("abc");
  });
});

describe("extractPdfText", () => {
  it("extracts selectable text", async () => {
    expect(await extractPdfText(makePdf("Hola Proofy"))).toBe("Hola Proofy");
  });
  it("returns empty text for a page without text", async () => {
    expect(await extractPdfText(makePdf(null))).toBe("");
  });
});

describe("upload helpers", () => {
  it("prechecks type and size", () => {
    expect(precheckPdf({ name: "c.pdf", type: "application/pdf", size: 10 })).toBeNull();
    expect(precheckPdf({ name: "c.txt", type: "text/plain", size: 10 })).not.toBeNull();
    expect(precheckPdf({ name: "c.pdf", type: "", size: MAX_PDF_BYTES + 1 })).not.toBeNull();
  });
  it("maps HTTP errors", () => {
    expect(describeUploadError(401).kind).toBe(UploadErrorKind.Unauthorized);
    expect(describeUploadError(502).kind).toBe(UploadErrorKind.AgentUnavailable);
    expect(describeUploadError(503).kind).toBe(UploadErrorKind.AgentUnavailable);
    expect(describeUploadError(422, "El PDF no contiene texto seleccionable").message).toBe("El PDF no contiene texto seleccionable");
  });
});
