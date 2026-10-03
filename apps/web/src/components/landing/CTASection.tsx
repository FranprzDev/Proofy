"use client";

import { useState } from "react";
import { RevealOnScroll } from "./RevealOnScroll";

export function CTASection() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubmitted(true);
    }
  };

  return (
    <section id="acceso-temprano" className="relative py-24 sm:py-32 px-6 overflow-hidden">
      {/* Background Decorative Rings & Neon Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-lime/15 via-lime/5 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-white/[0.04] rounded-full pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1100px] h-[1100px] border border-white/[0.02] rounded-full pointer-events-none" />

      <div className="mx-auto max-w-5xl relative z-10">
        <RevealOnScroll>
          <div className="relative rounded-3xl border border-lime/30 bg-gradient-to-b from-[#15151f]/90 via-[#0e0e15]/90 to-[#07070b]/95 p-8 sm:p-14 lg:p-16 text-center backdrop-blur-xl shadow-[0_0_60px_rgba(190,255,0,0.1)] overflow-hidden">
            {/* Top Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-lime/30 bg-lime/10 text-lime text-xs font-semibold uppercase tracking-wider mb-6">
              <span className="w-2 h-2 rounded-full bg-lime animate-ping" />
              Acceso Temprano Limitado
            </div>

            {/* Heading in Bebas Neue */}
            <h2 className="font-heading text-4xl sm:text-6xl md:text-7xl uppercase tracking-tight text-white mb-6 max-w-3xl mx-auto leading-none">
              El futuro del trabajo freelance es{" "}
              <span className="text-lime drop-shadow-[0_0_20px_rgba(190,255,0,0.4)]">
                verificable
              </span>
            </h2>

            {/* Subtitle */}
            <p className="text-muted text-base sm:text-lg max-w-2xl mx-auto mb-10 leading-relaxed font-body">
              Sumate a la lista de espera de Proofy. Protegé tu capital con contratos escrow en Solana y cobrá cada hito sin disputas interminables.
            </p>

            {/* Input Form */}
            {submitted ? (
              <div className="inline-flex items-center gap-3 px-6 py-4 rounded-2xl bg-lime/10 border border-lime/40 text-white font-medium animate-fadeIn">
                <svg
                  className="w-5 h-5 text-lime"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span>¡Genial! Te notificaremos tan pronto esté disponible el acceso prioritario.</span>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-lg mx-auto mb-10"
              >
                <div className="relative w-full">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Tu correo electrónico..."
                    className="w-full rounded-full border border-subtle bg-card/80 px-6 py-4 text-white placeholder-muted focus:border-lime focus:outline-none focus:ring-1 focus:ring-lime text-sm backdrop-blur-md transition-all duration-200"
                    id="waitlist-email-input"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full sm:w-auto flex-shrink-0 rounded-full bg-lime px-8 py-4 text-sm font-bold uppercase tracking-wider text-black transition-all duration-200 hover:bg-lime-hover hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(190,255,0,0.35)]"
                  id="waitlist-submit-button"
                >
                  Unirme a la lista
                </button>
              </form>
            )}

            {/* Feature Badges */}
            <div className="flex flex-wrap items-center justify-center gap-6 pt-6 border-t border-white/5 text-xs text-muted">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-lime" />
                Smart Contracts en Solana
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-lime" />
                Verificación con IA 24/7
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-lime" />
                Zero Trust Architecture
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-lime" />
                Open Source Protocol
              </div>
            </div>
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}
