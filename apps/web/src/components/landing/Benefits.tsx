import { RevealOnScroll } from "./RevealOnScroll";

const benefits = [
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <path d="M16 4L6 10V22L16 28L26 22V10L16 4Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M16 14V20M13 17H19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    title: "Fondos Garantizados",
    description:
      "Tu pago está en escrow antes de empezar. Cumplís con los criterios → cobrás automáticamente.",
    tag: "Desarrollador",
  },
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <path d="M16 4L6 10V16C6 22.6 10.4 28.6 16 30C21.6 28.6 26 22.6 26 16V10L16 4Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M12 16L15 19L20 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: "Entregas Verificables",
    description:
      "El Frontier Agent verifica que el código cumple exactamente lo acordado. Sin sorpresas ni subjetividades.",
    tag: "Cliente",
  },
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <rect x="4" y="8" width="24" height="16" rx="3" stroke="currentColor" strokeWidth="1.5" />
        <path d="M4 14H28" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8 19H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M8 22H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    title: "Escrow Transparente",
    description:
      "Los fondos se custodian on-chain con reglas claras y verificables. Sin intermediarios opacos.",
    tag: "Ambos",
  },
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="10" stroke="currentColor" strokeWidth="1.5" />
        <path d="M16 10V16H22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: "Liquidación Instantánea",
    description:
      "Verificación → pago en la misma transacción. Sin esperar aprobaciones manuales ni botones de cobro.",
    tag: "Ambos",
  },
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <path d="M8 6H24C25.1 6 26 6.9 26 8V24C26 25.1 25.1 26 24 26H8C6.9 26 6 25.1 6 24V8C6 6.9 6.9 6 8 6Z" stroke="currentColor" strokeWidth="1.5" />
        <path d="M12 16L16 12L20 16L16 20L12 16Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <circle cx="16" cy="16" r="2" fill="currentColor" />
      </svg>
    ),
    title: "IA que Acompaña",
    description:
      "El Frontier Agent te ayuda durante el desarrollo, no solo evalúa al final. Comenta qué corregir sin modificar tu código.",
    tag: "Desarrollador",
  },
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <path d="M6 6H20L26 12V26H6V6Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M20 6V12H26" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M11 18H21M11 22H17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    title: "Criterios Claros desde el Día 0",
    description:
      "Ambas partes acuerdan escenarios y pruebas antes de escribir una línea de código. Sin ambigüedades.",
    tag: "Ambos",
  },
];

export function Benefits() {
  return (
    <section id="beneficios" className="relative py-28 px-6">
      {/* Background accent */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-lime/[0.02] to-transparent" />

      <div className="relative mx-auto max-w-7xl">
        {/* Section header */}
        <RevealOnScroll>
          <div className="mb-16 text-center">
            <span className="mb-4 inline-block text-sm font-medium tracking-widest text-lime uppercase">
              Ventajas
            </span>
            <h2 className="font-heading text-5xl sm:text-6xl md:text-7xl">
              ¿POR QUÉ PROOFY?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-muted">
              Diseñado para reducir dos riesgos: que el desarrollador entregue
              sin cobrar y que el cliente pague sin recibir lo acordado.
            </p>
          </div>
        </RevealOnScroll>

        {/* Benefits grid */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {benefits.map((benefit, i) => (
            <RevealOnScroll
              key={benefit.title}
              delay={((i % 3) + 1) as 1 | 2 | 3}
            >
              <div className="card-glow group flex h-full flex-col rounded-2xl border border-subtle bg-card p-7 transition-all duration-300 hover:border-lime/30 hover:bg-card-hover">
                {/* Icon */}
                <div className="feature-icon mb-5 text-lime transition-transform duration-300 group-hover:scale-110">
                  {benefit.icon}
                </div>

                {/* Content */}
                <h3 className="mb-2 text-lg font-semibold text-white">
                  {benefit.title}
                </h3>
                <p className="mb-4 flex-1 text-sm leading-relaxed text-muted">
                  {benefit.description}
                </p>

                {/* Tag */}
                <span className="inline-block w-fit rounded-full border border-lime/20 bg-lime/5 px-3 py-1 text-xs text-lime">
                  {benefit.tag}
                </span>
              </div>
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
