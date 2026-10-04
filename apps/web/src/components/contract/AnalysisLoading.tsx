"use client";

import { useEffect, useState } from "react";
import { ContractIcon } from "./ContractIcon";

const PHASES = ["Extrayendo texto", "Detectando cláusulas", "Buscando ambigüedades", "Diseñando casos de prueba"];
const PHASE_MS = 9000;

/** Purely visual progress: the agent does not stream its real phase, so phases advance on a timer. */
export function AnalysisLoading() {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const started = Date.now();
    const id = window.setInterval(() => setElapsed(Date.now() - started), 1000);
    return () => window.clearInterval(id);
  }, []);

  const phase = Math.min(Math.floor(elapsed / PHASE_MS), PHASES.length - 1);
  const seconds = Math.floor(elapsed / 1000);
  const clock = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

  return (
    <div className="grid items-center gap-8 sm:grid-cols-[auto_1fr] sm:gap-10">
      <div className="cw-scan-doc mx-auto" aria-hidden="true">
        {[92, 70, 84, 56, 88, 64, 78, 48, 82, 60].map((w, i) => (
          <span key={i} className="cw-scan-line" style={{ width: `${w}%`, animationDelay: `${i * 0.18}s` }} />
        ))}
        <span className="cw-scan-beam" />
      </div>

      <div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-heading text-3xl tracking-wide uppercase sm:text-4xl">Analizando contrato</h2>
          <span className="flex items-center gap-1.5 font-mono text-xs text-white/45" aria-hidden="true">
            <ContractIcon name="clock" width={14} height={14} />
            {clock}
          </span>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-white/50">
          El agente lee el PDF completo. Puede tardar hasta 2 minutos; no cierres esta pestaña.
        </p>

        <p className="sr-only" aria-live="polite">
          Analizando contrato: {PHASES[phase]}.
        </p>

        <ol className="mt-6 grid gap-2.5">
          {PHASES.map((label, i) => {
            const state = i < phase ? "is-done" : i === phase ? "is-active" : "";
            return (
              <li key={label} className={`cw-phase ${state}`}>
                <span className="cw-phase-dot" aria-hidden="true">
                  {i < phase ? <ContractIcon name="check" width={12} height={12} strokeWidth={2.6} /> : null}
                </span>
                <span>{label}</span>
                {i === phase && <span className="cw-phase-dots" aria-hidden="true"><i /><i /><i /></span>}
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
