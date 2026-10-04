"use client";

import { useState } from "react";
import { RevealOnScroll } from "./RevealOnScroll";
import { SectionHeading } from "./SectionHeading";

export function CTASection() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) setSubmitted(true);
  };

  return (
    <section id="acceso-temprano" className="relative px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl">
        <RevealOnScroll>
          <SectionHeading
            index="06"
            label="Acceso temprano"
            title={<>El futuro del trabajo freelance es <span className="text-lime">verificable</span></>}
          >
            Dejanos tu correo y te avisamos cuando abramos el acceso a los primeros proyectos.
          </SectionHeading>

          {submitted ? (
            <p role="status" className="max-w-lg border-l-2 border-lime py-1 pl-4 text-white/85">
              Listo. Te notificaremos cuando el acceso esté disponible.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="flex max-w-lg flex-col gap-3 sm:flex-row">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Tu correo electrónico"
                aria-label="Tu correo electrónico"
                autoComplete="email"
                className="w-full rounded-full border border-white/15 bg-black/50 px-6 py-4 text-sm text-white backdrop-blur-md transition-colors placeholder:text-white/40 focus:border-lime focus:outline-none"
                id="waitlist-email-input"
              />
              <button
                type="submit"
                className="shrink-0 rounded-full bg-lime px-7 py-4 text-sm font-semibold text-black transition-colors hover:bg-lime-hover"
                id="waitlist-submit-button"
              >
                Unirme a la lista
              </button>
            </form>
          )}

          <p className="mt-10 font-mono text-xs text-white/40">
            Escrow en Solana · Verificación sobre criterios acordados
          </p>
        </RevealOnScroll>
      </div>
    </section>
  );
}
