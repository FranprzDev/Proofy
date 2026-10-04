"use client";

import { useState } from "react";
import { RevealOnScroll } from "./RevealOnScroll";
import { SectionHeading } from "./SectionHeading";

const faqs = [
  {
    question: "¿Necesito una wallet para usar Proofy?",
    answer:
      "Sí. Hoy Proofy funciona con Phantom. La wallet se usa para depositar los fondos en el escrow y para recibir los pagos; Proofy nunca te va a pedir tu frase de recuperación ni tus claves privadas.",
  },
  {
    question: "¿Qué pasa si surge una disputa o desacuerdo?",
    answer:
      "Los criterios de aceptación se acuerdan antes de empezar, justamente para dejar poco margen de interpretación. Si igual hay un desacuerdo sobre algo subjetivo, el caso lo revisa una persona antes de liberar el pago.",
  },
  {
    question: "¿Qué lenguajes y tecnologías soporta?",
    answer:
      "El agente no impone un stack: corre los tests y el pipeline de CI que el proyecto ya tiene, y evalúa los resultados contra los criterios acordados. Cuanto mejor cubierto esté el proyecto con tests automatizados, más precisa es la verificación.",
  },
  {
    question: "¿El Frontier Agent puede modificar mi repositorio?",
    answer:
      "No. El agente tiene acceso de solo lectura: comenta en tus pull requests de GitHub y reporta status checks. Señala qué criterios faltan o fallaron, pero los cambios en el código los hacés vos.",
  },
  {
    question: "¿Cuánto cuesta usar la plataforma?",
    answer:
      "Una comisión porcentual que se cobra solo sobre los hitos liberados. Si un hito no se paga, no hay comisión.",
  },
  {
    question: "¿Puedo empezar si no tengo experiencia en Web3?",
    answer:
      "Sí. Necesitás una wallet Phantom; el resto del flujo (acordar criterios, entregar y cobrar) está pensado para que no tengas que saber cómo funciona Solana por dentro.",
  },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="relative px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl">
        <RevealOnScroll>
          <SectionHeading index="05" label="Preguntas frecuentes" title="Todo lo que necesitás saber">
            Cómo funciona la verificación, qué hace el escrow en Solana y quién controla tu código.
          </SectionHeading>
        </RevealOnScroll>

        <RevealOnScroll>
          <div className="max-w-4xl border-b border-white/10">
            {faqs.map((faq, index) => {
              const isOpen = openIndex === index;
              const panelId = `faq-panel-${index}`;
              return (
                <div key={faq.question} className="border-t border-white/10">
                  <h3>
                    <button
                      type="button"
                      onClick={() => setOpenIndex(isOpen ? null : index)}
                      className="flex w-full cursor-pointer items-baseline justify-between gap-6 py-6 text-left"
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      id={`faq-item-${index}`}
                    >
                      <span className={`text-base font-medium transition-colors sm:text-lg ${isOpen ? "text-white" : "text-white/80 hover:text-white"}`}>
                        {faq.question}
                      </span>
                      <span className="w-4 shrink-0 text-center font-mono text-lg text-lime" aria-hidden="true">
                        {isOpen ? "–" : "+"}
                      </span>
                    </button>
                  </h3>
                  <div
                    id={panelId}
                    role="region"
                    aria-labelledby={`faq-item-${index}`}
                    inert={!isOpen}
                    className={`faq-content ${isOpen ? "open" : ""}`}
                  >
                    <div className="faq-inner">
                      <p className="max-w-2xl pb-6 text-sm leading-relaxed text-white/60 sm:text-base">{faq.answer}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="mt-10 text-sm text-white/50">
            ¿Otra pregunta?{" "}
            <a href="mailto:contact@proofy.work" className="text-lime underline-offset-4 hover:underline">
              Escribinos
            </a>
            .
          </p>
        </RevealOnScroll>
      </div>
    </section>
  );
}
