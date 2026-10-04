import type { DocumentState } from "@/lib/agent/types";

export type Status = DocumentState["status"];

export const STATUS_LABELS: Record<Status, string> = {
  pending: "Pendiente",
  needs_clarification: "Requiere aclaraciones",
  proposal: "Propuesta lista",
  llm_unavailable: "Modelo no disponible",
};

export const STATUS_HINTS: Record<Status, string> = {
  pending: "El análisis quedó incompleto. Revisá los pendientes o volvé a intentar.",
  needs_clarification: "Respondé las preguntas marcadas para cerrar los criterios de aceptación.",
  proposal: "Los criterios están listos para que cliente y proveedor los acepten.",
  llm_unavailable: "El modelo de IA no respondió. Volvé a intentar en unos minutos.",
};

export const KIND_LABELS: Record<string, string> = { ui: "UI", api: "API" };
export const PRIORITY_LABELS: Record<string, string> = { high: "Prioridad alta", medium: "Prioridad media", low: "Prioridad baja" };

// The agent reports provider failures as a raw English pending item: never show that text to the user.
export const AGENT_FAILURE_PREFIX = "The document agent failed";

export function failureMessage(items: string[]): string | null {
  const failure = items.find((i) => i.startsWith(AGENT_FAILURE_PREFIX));
  if (!failure) return null;
  return /RateLimit|RESOURCE_EXHAUSTED|429/.test(failure)
    ? "El modelo de IA alcanzó su límite de uso. Esperá un minuto y volvé a intentar."
    : "El agente no pudo completar el análisis. Volvé a intentar en unos minutos.";
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`;
}
