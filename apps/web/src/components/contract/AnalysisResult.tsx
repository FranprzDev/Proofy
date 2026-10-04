"use client";

import { useId, useState, type ReactNode } from "react";
import type { DocumentState, TestCase } from "@/lib/agent/types";
import { ContractIcon, type ContractIconName } from "./ContractIcon";
import { AGENT_FAILURE_PREFIX, KIND_LABELS, PRIORITY_LABELS, STATUS_HINTS, STATUS_LABELS, type Status } from "./labels";

const STATUS_TONE: Record<Status, string> = {
  proposal: "border-lime/40 bg-lime/10 text-lime",
  needs_clarification: "border-amber-300/40 bg-amber-300/10 text-amber-200",
  pending: "border-white/15 bg-white/5 text-white/70",
  llm_unavailable: "border-red-400/40 bg-red-500/10 text-red-300",
};

const PRIORITY_TONE: Record<string, string> = {
  high: "border-red-400/30 text-red-300",
  medium: "border-amber-300/30 text-amber-200",
  low: "border-white/15 text-white/60",
};

function SectionTitle({ icon, title, count, tone = "text-lime" }: { icon: ContractIconName; title: string; count: number; tone?: string }) {
  return (
    <h3 className="flex items-center gap-3">
      <ContractIcon name={icon} className={tone} />
      <span className="text-lg font-semibold">{title}</span>
      <span className="rounded-full bg-white/[0.06] px-2.5 py-0.5 font-mono text-xs text-white/60">{count}</span>
    </h3>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: string }) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-black/30 px-4 py-3.5">
      <p className={`font-heading text-4xl leading-none ${value > 0 ? (tone ?? "text-white") : "text-white/25"}`}>{value}</p>
      <p className="mt-1.5 text-[11px] tracking-wider text-white/45 uppercase">{label}</p>
    </div>
  );
}

function AcceptancePill({ who, accepted }: { who: string; accepted: boolean | undefined }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs ${
        accepted ? "border-lime/40 text-lime" : "border-white/10 text-white/50"
      }`}
    >
      {accepted ? <ContractIcon name="check" width={12} height={12} strokeWidth={2.6} /> : <span className="h-1.5 w-1.5 rounded-full bg-white/30" />}
      {who} · {accepted ? "aceptó" : "pendiente"}
    </span>
  );
}

function TestCaseCard({ test }: { test: TestCase }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const steps = test.steps ?? [];
  const expected = test.expected_results ?? [];

  return (
    <li className={`cw-case ${open ? "is-open" : ""}`}>
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls={open ? panelId : undefined} className="flex w-full items-start gap-3 p-4 text-left sm:p-5">
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs text-lime">{test.id}</span>
            <span className="rounded-full border border-white/15 px-2 py-0.5 text-[10px] tracking-wider text-white/70 uppercase">{KIND_LABELS[test.kind ?? ""] ?? test.kind}</span>
            <span className={`rounded-full border px-2 py-0.5 text-[10px] tracking-wider uppercase ${PRIORITY_TONE[test.priority ?? ""] ?? "border-white/15 text-white/60"}`}>
              {PRIORITY_LABELS[test.priority ?? ""] ?? test.priority}
            </span>
          </span>
          <span className="mt-2 block font-medium">{test.title}</span>
          <span className="mt-1 block text-sm leading-relaxed text-white/50">{test.objective}</span>
        </span>
        <span className="cw-case-chevron mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/10 text-white/60">
          <ContractIcon name="chevron" width={16} height={16} />
        </span>
        <span className="sr-only">{open ? "Ocultar detalle" : "Ver detalle"}</span>
      </button>
      {open && (
        <div id={panelId} className="cw-case-body">
          <div className="grid gap-5 border-t border-white/[0.07] px-4 pt-4 pb-5 text-sm sm:grid-cols-2 sm:px-5">
            {steps.length > 0 && (
              <div>
                <p className="mb-2 text-[11px] tracking-wider text-white/40 uppercase">Pasos</p>
                <ol className="grid gap-2">
                  {steps.map((s, i) => (
                    <li key={i} className="flex gap-2.5 text-white/85">
                      <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-white/[0.06] font-mono text-[10px] text-white/60">{i + 1}</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
            {expected.length > 0 && (
              <div>
                <p className="mb-2 text-[11px] tracking-wider text-white/40 uppercase">Resultado esperado</p>
                <ul className="grid gap-2">
                  {expected.map((r, i) => (
                    <li key={i} className="flex gap-2.5 text-white/85">
                      <ContractIcon name="check" width={16} height={16} className="mt-0.5 shrink-0 text-lime" />
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <p className="flex items-start gap-2 rounded-xl bg-white/[0.03] px-3 py-2.5 text-xs text-white/50 sm:col-span-2">
              <ContractIcon name="link" width={14} height={14} className="mt-px shrink-0" />
              <span>
                <span className="text-white/70">Cláusula vinculada:</span> {test.clause}
              </span>
            </p>
          </div>
        </div>
      )}
    </li>
  );
}

function MutedList({ icon, title, items }: { icon: ContractIconName; title: string; items: string[] }) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.015] p-4 sm:p-5">
      <SectionTitle icon={icon} title={title} count={items.length} tone="text-white/50" />
      <ul className="mt-3 grid gap-2 text-sm text-white/55">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2.5">
            <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-white/30" aria-hidden="true" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Block({ children }: { children: ReactNode }) {
  return <section className="grid min-w-0 grid-cols-1 gap-4">{children}</section>;
}

export function AnalysisResult({ result, fileName, onReset }: { result: DocumentState; fileName?: string; onReset: () => void }) {
  const clauses = result.clauses ?? [];
  const ambiguities = result.ambiguities ?? [];
  const testCases = result.test_cases ?? [];
  const outOfScope = result.out_of_scope ?? [];
  // Suggested questions already appear under each ambiguity: list only the remaining items.
  const asked = new Set(ambiguities.map((a) => a.suggested_question));
  const pending = (result.pending_items ?? []).filter((i) => !asked.has(i) && !i.startsWith(AGENT_FAILURE_PREFIX));
  const status = result.status;

  return (
    <div className="grid min-w-0 grid-cols-1 gap-10">
      <header className="grid min-w-0 grid-cols-1 gap-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${STATUS_TONE[status] ?? STATUS_TONE.pending}`}>
              <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
              {STATUS_LABELS[status] ?? status}
            </span>
            <h2 className="mt-3 font-heading text-4xl leading-none tracking-wide uppercase sm:text-5xl">Resultado del análisis</h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/50">{STATUS_HINTS[status]}</p>
          </div>
          <button
            type="button"
            onClick={onReset}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-white/20 px-5 py-2.5 text-sm transition-colors hover:border-lime/50 hover:bg-white/5"
          >
            <ContractIcon name="refresh" width={16} height={16} />
            Analizar otro contrato
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Cláusulas" value={clauses.length} />
          <Stat label="Ambigüedades" value={ambiguities.length} tone="text-amber-200" />
          <Stat label="Casos de prueba" value={testCases.length} tone="text-lime" />
          <Stat label="Fuera de alcance" value={outOfScope.length} />
        </div>

        <div className="flex flex-col gap-3 border-t border-white/[0.07] pt-4 text-xs text-white/40 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 tracking-wider uppercase">Aceptación</span>
            <AcceptancePill who="Cliente" accepted={result.accepted_by_client} />
            <AcceptancePill who="Proveedor" accepted={result.accepted_by_provider} />
          </div>
          <span className="min-w-0 truncate font-mono" title={result.contract_id}>
            {fileName ? `${fileName} · ` : ""}ID {result.contract_id}
          </span>
        </div>
      </header>

      {ambiguities.length > 0 && (
        <Block>
          <SectionTitle icon="question" title="Requiere tu respuesta" count={ambiguities.length} tone="text-amber-200" />
          <ul className="grid gap-3">
            {ambiguities.map((a, i) => (
              <li key={i} className="cw-ambiguity">
                <p className="text-[11px] tracking-wider text-amber-200/70 uppercase">Pregunta sugerida</p>
                <p className="mt-1.5 text-base leading-snug font-medium text-white sm:text-lg">{a.suggested_question}</p>
                <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                  <p className="text-white/55">
                    <span className="block text-[11px] tracking-wider text-white/35 uppercase">Cláusula</span>
                    <span className="mt-1 block">“{a.clause}”</span>
                  </p>
                  <p className="text-white/55">
                    <span className="block text-[11px] tracking-wider text-white/35 uppercase">Por qué es ambigua</span>
                    <span className="mt-1 block">{a.reason}</span>
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </Block>
      )}

      {testCases.length === 0 && ambiguities.length === 0 && (
        <div className="rounded-2xl border border-dashed border-white/10 px-6 py-10 text-center">
          <ContractIcon name="flask" width={28} height={28} className="mx-auto text-white/40" />
          <p className="mt-3 font-medium">El agente no propuso casos de prueba para este contrato</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-white/45">
            Puede que el PDF no describa entregables verificables. Probá con otra versión del contrato o con más detalle en los hitos.
          </p>
        </div>
      )}

      {clauses.length > 0 && (
        <Block>
          <SectionTitle icon="file" title="Cláusulas detectadas" count={clauses.length} />
          <ol className="grid gap-2">
            {clauses.map((c, i) => (
              <li key={i} className="flex gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-sm leading-relaxed text-white/85">
                <span className="mt-px shrink-0 rounded-md bg-lime/10 px-1.5 py-0.5 font-mono text-[11px] text-lime">C{i + 1}</span>
                <span>{c}</span>
              </li>
            ))}
          </ol>
        </Block>
      )}

      {testCases.length > 0 && (
        <Block>
          <SectionTitle icon="flask" title="Casos de prueba" count={testCases.length} />
          <ul className="grid gap-3">
            {testCases.map((t) => (
              <TestCaseCard key={t.id} test={t} />
            ))}
          </ul>
        </Block>
      )}

      {(outOfScope.length > 0 || pending.length > 0) && (
        <div className="grid gap-3 md:grid-cols-2">
          {outOfScope.length > 0 && <MutedList icon="minus" title="Fuera de alcance" items={outOfScope} />}
          {pending.length > 0 && <MutedList icon="clock" title="Pendientes" items={pending} />}
        </div>
      )}
    </div>
  );
}
