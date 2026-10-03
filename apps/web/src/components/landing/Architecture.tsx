"use client";

import { useEffect, useRef, useState } from "react";
import { RevealOnScroll } from "./RevealOnScroll";

const codeLines = [
  { text: "Cliente + Proveedor → Next.js + Phantom", indent: 0, highlight: false },
  { text: "→ Acuerdo bilateral con IA", indent: 1, highlight: false },
  { text: "→ Frontier Agent (Python + LangGraph)", indent: 1, highlight: true },
  { text: "├─ Agente Documental", indent: 2, highlight: false },
  { text: "└─ Agente CI/CD → GitHub PRs", indent: 2, highlight: false },
  { text: "→ Pipeline aislado: ejecución y pruebas", indent: 1, highlight: false },
  { text: "→ Verificación → Atestación técnica", indent: 1, highlight: true },
  { text: "→ Programa Solana → Pago + Comisión ✓", indent: 1, highlight: true },
];

export function Architecture() {
  const [visibleLines, setVisibleLines] = useState(0);
  const sectionRef = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          let i = 0;
          const interval = setInterval(() => {
            i++;
            setVisibleLines(i);
            if (i >= codeLines.length) clearInterval(interval);
          }, 200);
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="relative py-28 px-6">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-surface/50 to-transparent" />

      <div className="relative mx-auto max-w-7xl">
        <RevealOnScroll>
          <div className="mb-16 max-w-2xl">
            <span className="mb-4 inline-block text-sm font-medium tracking-widest text-lime uppercase">
              Tecnología
            </span>
            <h2 className="font-heading text-5xl sm:text-6xl md:text-7xl">
              ARQUITECTURA
            </h2>
            <p className="mt-4 text-lg text-muted">
              Flujo técnico simplificado de la plataforma. El desarrollo, las
              pruebas y la distribución ocurren fuera de la cadena; Solana hace
              cumplir las condiciones de pago.
            </p>
          </div>
        </RevealOnScroll>

        <RevealOnScroll>
          <div
            ref={sectionRef}
            className="overflow-hidden rounded-2xl border border-subtle bg-card"
          >
            {/* Terminal header */}
            <div className="flex items-center gap-2 border-b border-subtle px-5 py-3">
              <div className="h-3 w-3 rounded-full bg-red-500/60" />
              <div className="h-3 w-3 rounded-full bg-yellow-500/60" />
              <div className="h-3 w-3 rounded-full bg-green-500/60" />
              <span className="ml-3 font-mono text-xs text-muted">
                proofy-architecture.sh
              </span>
            </div>

            {/* Code content */}
            <div className="p-6 sm:p-8">
              <pre className="font-mono text-sm leading-loose sm:text-base">
                {codeLines.map((line, i) => (
                  <div
                    key={i}
                    className={`transition-all duration-500 ${
                      i < visibleLines
                        ? "translate-x-0 opacity-100"
                        : "translate-x-4 opacity-0"
                    }`}
                    style={{ paddingLeft: `${line.indent * 1.5}rem` }}
                  >
                    <span className={line.highlight ? "text-lime" : "text-white/70"}>
                      {line.text}
                    </span>
                  </div>
                ))}
                {/* Typing cursor */}
                <span
                  className="ml-1 inline-block h-5 w-2 bg-lime"
                  style={{ animation: "typing-cursor 1s infinite" }}
                />
              </pre>
            </div>
          </div>
        </RevealOnScroll>

        {/* Tech badges */}
        <RevealOnScroll>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {[
              "Next.js",
              "TypeScript",
              "Python",
              "LangGraph",
              "Solana",
              "Phantom",
              "GitHub",
            ].map((tech) => (
              <span
                key={tech}
                className="rounded-full border border-subtle bg-card px-4 py-1.5 text-xs text-muted transition-colors hover:border-lime/30 hover:text-lime"
              >
                {tech}
              </span>
            ))}
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}
