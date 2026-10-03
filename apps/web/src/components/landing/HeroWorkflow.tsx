"use client";

import { useState } from "react";
import { LandingIcon, type LandingIconName } from "./LandingIcon";

const stages: { label: string; icon: LandingIconName; title: string; detail: string; status: string }[] = [
  { label: "Acuerdo", icon: "code", title: "Todo empieza con reglas claras.", detail: "Alcance, criterios y fondos acordados antes de escribir código.", status: "Fondos en escrow" },
  { label: "Verificación", icon: "shield", title: "Tu código habla por vos.", detail: "El agente evalúa la entrega contra los criterios del proyecto.", status: "Criterios verificados" },
  { label: "Pago", icon: "bolt", title: "Entregaste. Verificaste. Cobraste.", detail: "La atestación habilita la liberación del pago en Solana.", status: "Pago liberado" },
];

export function HeroWorkflow() {
  const [active, setActive] = useState(1);
  const stage = stages[active];

  return (
    <div className="workflow-scene">
      <div className="workflow-orbit orbit-one" aria-hidden="true"><span /></div>
      <div className="workflow-orbit orbit-two" aria-hidden="true"><span /></div>
      <div className="workflow-label" aria-hidden="true"><span className="status-dot" /> CÓDIGO → CONFIANZA</div>
      <div className="workflow-float workflow-float-code" aria-hidden="true"><LandingIcon name="code" width={24} height={24} /><span>git push<br /><b>hito/01</b></span></div>
      <div className="workflow-float workflow-float-solana" aria-hidden="true"><LandingIcon name="solana" width={24} height={24} /><span>Powered by<br /><b>Solana</b></span></div>

      <div className="workflow-panel">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <span className="flex items-center gap-2 text-sm font-medium"><LandingIcon name="spark" className="text-lime" /> Proofy Engine</span>
          <span className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] tracking-widest text-white/50 uppercase">Demo interactiva</span>
        </div>
        <div className="px-5 pt-6 sm:px-7">
          <div className="flex items-center justify-between text-[10px] tracking-[0.18em] text-white/45 uppercase"><span>Proyecto / 001</span><span>Hito 01 de 03</span></div>
          <div className="mt-2 flex items-center justify-between"><h2 className="text-lg font-medium">Desarrollo de una API</h2><span className="text-xs text-lime">USDC</span></div>
          <div className="verification-core" aria-hidden="true"><div className="core-ring" /><div className="core-icon" key={active}><LandingIcon name={stage.icon} width={46} height={46} /></div><span className="core-cross cross-left">+</span><span className="core-cross cross-right">+</span></div>
          <div className="min-h-28 text-center" aria-live="polite" aria-atomic="true">
            <h3 className="text-base font-semibold">{stage.title}</h3>
            <p className="mx-auto mt-2 max-w-72 text-xs leading-relaxed text-white/50">{stage.detail}</p>
          </div>
          <div className="mb-6 flex items-center justify-between rounded-xl border border-lime/15 bg-lime/5 p-3 text-xs"><span className="flex items-center gap-2 text-lime"><LandingIcon name="check" width={16} height={16} />{stage.status}</span><span className="font-mono text-white/50">0{active + 1} / 03</span></div>
        </div>
        <div className="grid grid-cols-3 border-t border-white/10" aria-label="Explorar pasos de la demo">
          {stages.map((item, index) => <button type="button" key={item.label} onClick={() => setActive(index)} aria-pressed={active === index} className={`workflow-tab ${active === index ? "is-active" : ""}`}><LandingIcon name={item.icon} width={17} height={17} /><span>{item.label}</span></button>)}
        </div>
      </div>
      <p className="mt-5 text-center font-mono text-[10px] tracking-wider text-white/35">EXPLORÁ EL FLUJO · ELEGÍ UN PASO</p>
    </div>
  );
}
