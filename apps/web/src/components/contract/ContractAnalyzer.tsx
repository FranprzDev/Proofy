"use client";

import { useState, type DragEvent, type ReactNode } from "react";
import type { DocumentState } from "@/lib/agent/types";
import { precheckPdf, uploadContractPdf, UploadError, UploadErrorKind } from "@/lib/pdf/upload";
import { ConnectWallet } from "@/components/wallet/ConnectWallet";
import { useWallet, WalletStatus } from "@/components/wallet/useWallet";

type Status = DocumentState["status"];

const STATUS_LABELS: Record<Status, string> = {
  pending: "Pendiente",
  needs_clarification: "Requiere aclaraciones",
  proposal: "Propuesta lista",
  llm_unavailable: "Modelo no disponible",
};

const CARD = "rounded-2xl border border-subtle bg-card p-6";

export function ContractAnalyzer() {
  const { status } = useWallet();

  if (status === WalletStatus.Loading) return <p className="text-muted">Cargando sesión…</p>;
  if (status !== WalletStatus.Connected) {
    return (
      <section className={`${CARD} flex flex-col items-start gap-4`}>
        <h2 className="text-xl font-semibold">Conectá tu wallet</h2>
        <p className="text-muted">Para analizar un contrato necesitás iniciar sesión con Phantom (solo firmás un mensaje, sin costo).</p>
        <ConnectWallet />
      </section>
    );
  }
  return <Uploader />;
}

function Uploader() {
  const { expire } = useWallet();
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DocumentState | null>(null);

  const pick = (f: File | undefined) => {
    if (!f) return;
    const problem = precheckPdf(f);
    setError(problem);
    setFile(problem ? null : f);
  };

  const onDrop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDragging(false);
    pick(e.dataTransfer.files[0]);
  };

  const analyze = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      setResult(await uploadContractPdf(file));
    } catch (e) {
      const err = e instanceof UploadError ? e : new UploadError(UploadErrorKind.Network, "Error inesperado.");
      if (err.kind === UploadErrorKind.Unauthorized) expire();
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <section className={`${CARD} flex flex-col gap-4`}>
        <label
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-12 text-center transition-colors ${
            dragging ? "border-lime bg-lime/5" : "border-subtle hover:border-lime/50"
          }`}
        >
          <input
            type="file"
            accept="application/pdf,.pdf"
            className="sr-only"
            disabled={loading}
            onChange={(e) => {
              pick(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          <span className="text-lg font-medium">{file ? file.name : "Arrastrá el PDF acá o hacé clic para elegirlo"}</span>
          <span className="text-sm text-muted">Solo PDF con texto seleccionable · máximo 10 MB</span>
        </label>
        <div className="flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={() => void analyze()}
            disabled={!file || loading}
            className="btn-glow rounded-full bg-lime px-6 py-2.5 text-sm font-semibold text-black transition-all duration-200 hover:bg-lime-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Analizando…" : "Analizar contrato"}
          </button>
          {loading && (
            <span className="flex items-center gap-2 text-sm text-muted" aria-live="polite">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-lime border-t-transparent" />
              El agente puede tardar hasta 2 minutos.
            </span>
          )}
        </div>
        {error && (
          <p role="alert" className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </p>
        )}
      </section>
      {result && <AnalysisResult result={result} />}
    </div>
  );
}

function Section({ title, count, children }: { title: string; count: number; children: ReactNode }) {
  return (
    <section className={`${CARD} space-y-4`}>
      <h2 className="flex items-center gap-3 text-xl font-semibold">
        {title}
        <span className="rounded-full bg-lime/10 px-2.5 py-0.5 text-xs font-medium text-lime">{count}</span>
      </h2>
      {count === 0 ? <p className="text-sm text-muted">Sin elementos.</p> : children}
    </section>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="list-disc space-y-2 pl-5 text-sm text-white/90 marker:text-lime">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

function AnalysisResult({ result }: { result: DocumentState }) {
  const clauses = result.clauses ?? [];
  const ambiguities = result.ambiguities ?? [];
  const testCases = result.test_cases ?? [];
  const outOfScope = result.out_of_scope ?? [];
  const pending = result.pending_items ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <span className="rounded-full border border-lime/40 px-4 py-1.5 font-medium text-lime">
          {STATUS_LABELS[result.status] ?? result.status}
        </span>
        <span className="font-mono text-muted">ID {result.contract_id}</span>
      </div>

      <Section title="Cláusulas" count={clauses.length}>
        <BulletList items={clauses} />
      </Section>

      <Section title="Ambigüedades" count={ambiguities.length}>
        <ul className="space-y-4">
          {ambiguities.map((a, i) => (
            <li key={i} className="space-y-1 border-l-2 border-lime/50 pl-4 text-sm">
              <p className="font-medium">{a.clause}</p>
              <p className="text-muted">{a.reason}</p>
              <p>
                <span className="text-lime">Pregunta sugerida:</span> {a.suggested_question}
              </p>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Casos de prueba" count={testCases.length}>
        <ul className="space-y-4">
          {testCases.map((t) => (
            <li key={t.id} className="space-y-2 rounded-xl border border-subtle p-4 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs text-lime">{t.id}</span>
                <span className="font-medium">{t.title}</span>
                <span className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-muted">
                  {t.kind} · {t.priority}
                </span>
              </div>
              <p className="text-muted">{t.objective}</p>
              {t.steps && t.steps.length > 0 && (
                <ol className="list-decimal space-y-1 pl-5 text-white/90">
                  {t.steps.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ol>
              )}
              {t.expected_results && t.expected_results.length > 0 && (
                <p className="text-white/80">
                  <span className="text-lime">Esperado:</span> {t.expected_results.join(" · ")}
                </p>
              )}
              <p className="text-xs text-muted">Cláusula: {t.clause}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Fuera de alcance" count={outOfScope.length}>
        <BulletList items={outOfScope} />
      </Section>

      <Section title="Pendientes" count={pending.length}>
        <BulletList items={pending} />
      </Section>
    </div>
  );
}
