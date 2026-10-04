"use client";

import { useRef, useState } from "react";
import type { DocumentState } from "@/lib/agent/types";
import { precheckPdf, uploadContractPdf, UploadError, UploadErrorKind } from "@/lib/pdf/upload";
import { useWallet, WalletStatus } from "@/components/wallet/useWallet";
import { AnalysisLoading } from "./AnalysisLoading";
import { AnalysisResult } from "./AnalysisResult";
import { ConnectPrompt } from "./ConnectPrompt";
import { ContractIcon } from "./ContractIcon";
import { Dropzone, FileChip } from "./Dropzone";
import { Alert, EnginePanel, Step } from "./EnginePanel";
import { failureMessage } from "./labels";

export function ContractAnalyzer() {
  const { status } = useWallet();

  if (status === WalletStatus.Loading) {
    return (
      <EnginePanel step={Step.Upload}>
        <div className="grid min-h-64 place-items-center" aria-live="polite">
          <span className="flex items-center gap-3 text-sm text-white/50">
            <span className="cw-spinner" aria-hidden="true" />
            Cargando sesión…
          </span>
        </div>
      </EnginePanel>
    );
  }
  if (status !== WalletStatus.Connected) {
    return (
      <EnginePanel step={Step.Upload}>
        <ConnectPrompt />
      </EnginePanel>
    );
  }
  return <Workspace />;
}

const RETRY_BUTTON =
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-lime px-5 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-lime-hover";

function Workspace() {
  const { expire } = useWallet();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DocumentState | null>(null);
  const resultHeading = useRef<HTMLDivElement>(null);

  const analyze = async (target: File) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const doc = await uploadContractPdf(target);
      const failure = failureMessage(doc.pending_items ?? []);
      if (failure) setError(failure);
      else setResult(doc);
    } catch (e) {
      const err = e instanceof UploadError ? e : new UploadError(UploadErrorKind.Network, "Error inesperado.");
      if (err.kind === UploadErrorKind.Unauthorized) expire();
      setError(err.message);
    } finally {
      setLoading(false);
    }
    requestAnimationFrame(() => resultHeading.current?.focus());
  };

  // A valid PDF starts the analysis right away.
  const pick = (f: File | undefined) => {
    if (!f || loading) return;
    const problem = precheckPdf(f);
    setResult(null);
    setError(problem);
    setFile(problem ? null : f);
    if (!problem) void analyze(f);
  };

  const reset = () => {
    setFile(null);
    setError(null);
    setResult(null);
  };

  if (loading && file) {
    return (
      <EnginePanel step={Step.Analysis} badge={<LiveBadge />}>
        <div className="grid gap-8">
          <FileChip
            file={file}
            status={
              <span className="flex items-center gap-1.5 text-lime/80">
                <span className="cw-spinner cw-spinner-sm" aria-hidden="true" />
                Analizando
              </span>
            }
          />
          <AnalysisLoading />
        </div>
      </EnginePanel>
    );
  }

  if (result) {
    return (
      <EnginePanel step={Step.Agreement} done={result.status === "proposal"}>
        <div ref={resultHeading} tabIndex={-1} className="outline-none">
          <AnalysisResult result={result} fileName={file?.name} onReset={reset} />
        </div>
      </EnginePanel>
    );
  }

  const failed = Boolean(error && file);

  return (
    <EnginePanel step={failed ? Step.Analysis : Step.Upload}>
      <div ref={resultHeading} tabIndex={-1} className="grid gap-5 outline-none">
        {failed && file ? (
          <>
            <FileChip
              file={file}
              status={<span className="text-red-300/80">Análisis interrumpido</span>}
              action={
                <button type="button" onClick={reset} aria-label={`Quitar ${file.name}`} className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-white/50 transition-colors hover:bg-white/10 hover:text-white">
                  <ContractIcon name="close" width={16} height={16} />
                </button>
              }
            />
            <Alert
              title="No pudimos completar el análisis"
              action={
                <button type="button" onClick={() => void analyze(file)} className={RETRY_BUTTON}>
                  <ContractIcon name="refresh" width={16} height={16} />
                  Reintentar
                </button>
              }
            >
              {error}
            </Alert>
            <Dropzone onPick={pick} compact />
          </>
        ) : (
          <>
            <Dropzone onPick={pick} />
            {error && <Alert title="Revisá el archivo">{error}</Alert>}
            <ul className="grid gap-3 text-xs text-white/45 sm:grid-cols-3">
              {[
                ["01", "Extraemos el texto y las cláusulas del PDF."],
                ["02", "Marcamos lo ambiguo con una pregunta concreta."],
                ["03", "Proponemos casos de prueba verificables por hito."],
              ].map(([n, text]) => (
                <li key={n} className="flex gap-3 rounded-xl border border-white/[0.06] px-3.5 py-3">
                  <span className="font-mono text-lime/70">{n}</span>
                  <span className="leading-relaxed">{text}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </EnginePanel>
  );
}

function LiveBadge() {
  return (
    <span className="flex items-center gap-2 rounded-full border border-lime/25 bg-lime/5 px-2.5 py-1 text-[10px] tracking-widest text-lime uppercase">
      <span className="status-dot" aria-hidden="true" />
      En curso
    </span>
  );
}
