import { RevealOnScroll } from "./RevealOnScroll";

const clientFeatures = [
  "Definí tu proyecto con criterios claros y medibles",
  "Financiá hitos de forma segura con escrow on-chain",
  "Verificación automática antes de liberar el pago",
  "Disputas resueltas por personas, no por bots",
  "Trazabilidad completa de entregas y pagos",
];

const devFeatures = [
  "Sabé que el pago está garantizado antes de empezar",
  "Pipeline CI/CD integrado que guía tu desarrollo",
  "Cobrá automáticamente al cumplir los criterios",
  "Sin aprobaciones manuales ni esperas innecesarias",
  "El agente te ayuda, no te juzga al final",
];

function CheckIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      className="mt-0.5 shrink-0 text-lime"
    >
      <circle cx="9" cy="9" r="8" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M6 9L8 11L12 7"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Audience() {
  return (
    <section id="para-quien" className="relative py-28 px-6">
      <div className="mx-auto max-w-7xl">
        {/* Section header */}
        <RevealOnScroll>
          <div className="mb-16 text-center">
            <span className="mb-4 inline-block text-sm font-medium tracking-widest text-lime uppercase">
              Audiencia
            </span>
            <h2 className="font-heading text-5xl sm:text-6xl md:text-7xl">
              PARA QUIÉN
            </h2>
          </div>
        </RevealOnScroll>

        {/* Two cards */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Client card */}
          <RevealOnScroll delay={1}>
            <div className="card-glow group relative overflow-hidden rounded-2xl border border-subtle bg-card p-8 transition-all duration-300 hover:border-lime/30 lg:p-10">
              {/* Background decoration */}
              <div className="pointer-events-none absolute -top-20 -right-20 h-40 w-40 rounded-full bg-lime/5 blur-[80px] transition-opacity duration-500 group-hover:opacity-100 opacity-0" />

              <div className="relative">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-lime/10">
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      className="text-lime"
                    >
                      <path
                        d="M20 21V19C20 17.9 19.1 17 18 17H6C4.9 17 4 17.9 4 19V21"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                      <circle
                        cx="12"
                        cy="10"
                        r="4"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      />
                    </svg>
                  </div>
                  <h3 className="font-heading text-3xl">PARA CLIENTES</h3>
                </div>

                <p className="mb-6 text-muted">
                  Contratá desarrollo con la tranquilidad de que el pago se
                  libera solo cuando se cumplen los criterios acordados.
                </p>

                <ul className="space-y-3">
                  {clientFeatures.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <CheckIcon />
                      <span className="text-sm text-white/80">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </RevealOnScroll>

          {/* Developer card */}
          <RevealOnScroll delay={2}>
            <div className="card-glow group relative overflow-hidden rounded-2xl border border-lime/20 bg-card p-8 transition-all duration-300 hover:border-lime/40 lg:p-10">
              {/* Background decoration */}
              <div className="pointer-events-none absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-lime/5 blur-[80px] transition-opacity duration-500 group-hover:opacity-100 opacity-0" />

              <div className="relative">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-lime/10">
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      className="text-lime"
                    >
                      <path
                        d="M8 6L2 12L8 18"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M16 6L22 12L16 18"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M14 4L10 20"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                  <h3 className="font-heading text-3xl">PARA DESARROLLADORES</h3>
                </div>

                <p className="mb-6 text-muted">
                  Freelancers y software factories: trabajá con la garantía de
                  que tu pago está asegurado antes de escribir la primera línea.
                </p>

                <ul className="space-y-3">
                  {devFeatures.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <CheckIcon />
                      <span className="text-sm text-white/80">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Highlighted badge */}
                <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-lime/10 px-4 py-2 text-sm text-lime">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path
                      d="M8 1L10.5 5.5L15 8L10.5 10.5L8 15L5.5 10.5L1 8L5.5 5.5L8 1Z"
                      fill="currentColor"
                    />
                  </svg>
                  Freelancers & Software Factories
                </div>
              </div>
            </div>
          </RevealOnScroll>
        </div>
      </div>
    </section>
  );
}
