"use client";

import { useState } from "react";
import { RevealOnScroll } from "./RevealOnScroll";

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: "¿Necesito una wallet para usar Proofy?",
    answer:
      "Sí, podés conectar wallets populares de Solana como Phantom, Solflare o Backpack. Proofy interactúa únicamente con smart contracts en Solana para el depósito y liberación de fondos en escrow; nunca te pedirá tu frase de recuperación ni claves privadas.",
  },
  {
    question: "¿Qué pasa si surge una disputa o desacuerdo?",
    answer:
      "Proofy establece criterios de aceptación medibles desde el inicio para minimizar ambigüedades. En caso de discrepancias sobre requisitos subjetivos, la plataforma cuenta con un mecanismo de mediación y resolución de disputas con soporte humano antes de cualquier liquidación.",
  },
  {
    question: "¿Qué lenguajes y tecnologías soporta el pipeline?",
    answer:
      "El agente y los runners de verificación soportan actualmente TypeScript, JavaScript, Python, Rust, Go y stacks web modernos con testing en CI/CD (Jest, Vitest, PyTest, Playwright). Estamos sumando compatibilidad con más frameworks continuamente.",
  },
  {
    question: "¿El Frontier Agent puede modificar o alterar mi repositorio?",
    answer:
      "No. El agente solo tiene permisos de lectura y feedback (Code Review y status checks en tus Pull Requests de GitHub/GitLab). Señala exactamente qué criterios faltan o fallaron; el control total del código permanece siempre en manos del desarrollador.",
  },
  {
    question: "¿Cuánto cuesta usar la plataforma?",
    answer:
      "Cobramos una tarifa transparente y reducida porcentual únicamente sobre los hitos liberados con éxito. No hay costos ocultos, membresías mensuales ni penalidades por crear proyectos.",
  },
  {
    question: "¿Puedo empezar si no tengo experiencia previa en Web3?",
    answer:
      "¡Totalmente! Diseñamos un flujo de onboarding intuitivo guiado paso a paso. Podés probar la plataforma en Devnet de Solana sin arriesgar fondos reales hasta sentirte completamente cómodo.",
  },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section id="faq" className="relative py-28 px-6 overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-lime/5 rounded-full blur-3xl pointer-events-none" />

      <div className="mx-auto max-w-4xl relative z-10">
        <RevealOnScroll>
          <div className="text-center mb-16">
            <span className="inline-block px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-lime border border-lime/25 rounded-full bg-lime/5 mb-4">
              Preguntas Frecuentes
            </span>
            <h2 className="font-heading text-4xl sm:text-6xl uppercase tracking-tight text-white mb-4">
              Todo lo que necesitás saber
            </h2>
            <p className="text-muted text-base sm:text-lg max-w-xl mx-auto">
              Respuestas claras sobre cómo funciona la verificación con IA, los smart contracts de Solana y la protección de fondos.
            </p>
          </div>
        </RevealOnScroll>

        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <RevealOnScroll key={index} delay={index * 60}>
                <div
                  className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                    isOpen
                      ? "border-lime/40 bg-card/90 shadow-[0_0_25px_rgba(190,255,0,0.08)]"
                      : "border-subtle bg-card/40 hover:border-white/20 hover:bg-card/70"
                  }`}
                >
                  <button
                    onClick={() => toggle(index)}
                    className="w-full text-left p-6 sm:p-7 flex items-center justify-between gap-4 cursor-pointer focus:outline-none"
                    aria-expanded={isOpen}
                    id={`faq-item-${index}`}
                  >
                    <span className="font-medium text-base sm:text-lg text-white pr-2">
                      {faq.question}
                    </span>
                    <span
                      className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border transition-all duration-300 ${
                        isOpen
                          ? "bg-lime text-black border-lime rotate-45"
                          : "border-white/10 text-muted hover:text-white"
                      }`}
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 14 14"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M7 1V13M1 7H13"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </svg>
                    </span>
                  </button>

                  <div
                    className={`transition-all duration-300 ease-in-out px-6 sm:px-7 ${
                      isOpen ? "max-h-60 pb-6 opacity-100" : "max-h-0 pb-0 opacity-0"
                    } overflow-hidden`}
                  >
                    <p className="text-muted text-sm sm:text-base leading-relaxed border-t border-white/5 pt-4">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </RevealOnScroll>
            );
          })}
        </div>

        {/* Contact direct note */}
        <RevealOnScroll delay={300}>
          <div className="mt-12 text-center text-sm text-muted">
            ¿Tenés alguna otra pregunta?{" "}
            <a
              href="mailto:contact@proofy.work"
              className="text-lime hover:underline font-medium"
            >
              Escribinos directamente
            </a>
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}
