"use client";

import { useEffect, useRef, useState } from "react";
import { RevealOnScroll } from "./RevealOnScroll";
import { SectionHeading } from "./SectionHeading";

const codeLines = [
  { text: "Cliente + Proveedor → Next.js + Phantom", indent: 0, highlight: false },
  { text: "→ Acuerdo bilateral con IA", indent: 1, highlight: false },
  { text: "→ Frontier Agent (Python + LangGraph)", indent: 1, highlight: true },
  { text: "├─ Agente Documental", indent: 2, highlight: false },
  { text: "└─ Agente CI/CD → GitHub PRs", indent: 2, highlight: false },
  { text: "→ Pipeline aislado: ejecución y pruebas", indent: 1, highlight: false },
  { text: "→ Verificación → Atestación técnica", indent: 1, highlight: true },
  { text: "→ Programa Solana → Pago + Comisión", indent: 1, highlight: true },
];

const stack = ["Next.js", "TypeScript", "Python", "LangGraph", "Solana", "Phantom", "GitHub"];

export function Architecture() {
  const [visibleLines, setVisibleLines] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const el = panelRef.current;
    if (!el) return;
    let interval: ReturnType<typeof setInterval> | undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          let i = 0;
          interval = setInterval(() => {
            i++;
            setVisibleLines(i);
            if (i >= codeLines.length) clearInterval(interval);
          }, 180);
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
      clearInterval(interval);
    };
  }, []);

  return (
    <section id="arquitectura" className="relative px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl">
        <RevealOnScroll>
          <SectionHeading index="04" label="Tecnología" title="ARQUITECTURA">
            Flujo técnico simplificado. El desarrollo, las pruebas y la distribución ocurren fuera de la
            cadena; Solana hace cumplir las condiciones de pago.
          </SectionHeading>
        </RevealOnScroll>

        <RevealOnScroll>
          <div ref={panelRef} className="border border-white/10 bg-black/40 backdrop-blur-md">
            <div className="border-b border-white/10 px-5 py-3 font-mono text-xs text-white/40">
              arquitectura.txt
            </div>
            <pre className="overflow-x-auto p-6 font-mono text-sm leading-loose sm:p-8 sm:text-base">
              {codeLines.map((line, i) => (
                <div
                  key={line.text}
                  className={`transition-all duration-500 ${
                    i < visibleLines ? "translate-x-0 opacity-100" : "translate-x-4 opacity-0"
                  }`}
                  style={{ paddingLeft: `${line.indent * 1.5}rem` }}
                >
                  <span className={line.highlight ? "text-lime" : "text-white/70"}>{line.text}</span>
                </div>
              ))}
            </pre>
          </div>
          <p className="mt-6 font-mono text-xs leading-relaxed text-white/45">
            <span className="text-white/30">Stack: </span>
            {stack.join(" · ")}
          </p>
        </RevealOnScroll>
      </div>
    </section>
  );
}
