import type { ReactNode } from "react";
import { ContractIcon, type ContractIconName } from "./ContractIcon";

export enum Step {
  Upload = 0,
  Analysis = 1,
  Agreement = 2,
}

const STEPS: { label: string; short: string; icon: ContractIconName }[] = [
  { label: "Subir contrato", short: "Subir", icon: "upload" },
  { label: "Análisis del agente", short: "Análisis", icon: "spark" },
  { label: "Acuerdo de criterios", short: "Acuerdo", icon: "pen" },
];

function Stepper({ current, done }: { current: Step; done: boolean }) {
  return (
    <ol className="cw-stepper" aria-label="Progreso del análisis">
      {STEPS.map((step, index) => {
        const complete = index < current || (done && index === current);
        const active = index === current && !done;
        const state = complete ? "is-done" : active ? "is-active" : "";
        return (
          <li key={step.label} className={`cw-step ${state}`} aria-current={active ? "step" : undefined}>
            <span className="cw-step-dot" aria-hidden="true">
              {complete ? <ContractIcon name="check" width={14} height={14} strokeWidth={2.4} /> : index + 1}
            </span>
            <span className="min-w-0">
              <span className="block text-[10px] tracking-[0.18em] text-white/35 uppercase">Paso 0{index + 1}</span>
              <span className="block truncate text-xs font-medium sm:text-sm">
                <span className="sm:hidden">{step.short}</span>
                <span className="hidden sm:inline">{step.label}</span>
              </span>
            </span>
            {complete && <span className="sr-only">(completado)</span>}
          </li>
        );
      })}
    </ol>
  );
}

/** The "Proofy Engine" card that frames every state of the contract workspace. */
export function EnginePanel({
  step,
  done = false,
  badge,
  children,
}: {
  step: Step;
  done?: boolean;
  badge?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="cw-panel" aria-label="Proofy Engine">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3.5 sm:px-6">
        <span className="flex items-center gap-2 text-sm font-medium">
          <ContractIcon name="spark" className="text-lime" />
          Proofy Engine
        </span>
        {badge ?? (
          <span className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] tracking-widest text-white/50 uppercase">
            Agente de especificación
          </span>
        )}
      </div>
      <div className="border-b border-white/10 px-4 py-4 sm:px-6">
        <Stepper current={step} done={done} />
      </div>
      <div className="p-4 sm:p-8">{children}</div>
    </section>
  );
}

export function Alert({
  title,
  children,
  action,
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div role="alert" className="flex flex-col gap-4 rounded-2xl border border-red-400/30 bg-red-500/[0.07] p-4 sm:flex-row sm:items-center sm:p-5">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-red-400/30 bg-red-500/10 text-red-300">
        <ContractIcon name="alert" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-medium text-red-200">{title}</p>
        <p className="mt-1 text-sm leading-relaxed text-red-200/70">{children}</p>
      </div>
      {action}
    </div>
  );
}
