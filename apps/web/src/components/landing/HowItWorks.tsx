import { RevealOnScroll } from "./RevealOnScroll";

const steps = [
  {
    number: "01",
    title: "Acuerdo Bilateral",
    description:
      "Cliente y proveedor definen alcance, criterios y casos de prueba con ayuda de IA. Ambos aceptan las reglas antes de empezar.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <path
          d="M14 3L3 9V19L14 25L25 19V9L14 3Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path
          d="M3 9L14 15M14 15L25 9M14 15V25"
          stroke="currentColor"
          strokeWidth="1.5"
        />
      </svg>
    ),
  },
  {
    number: "02",
    title: "Desarrollo con Pipeline",
    description:
      "El desarrollador trabaja con un pipeline CI/CD integrado que verifica calidad en cada PR. Sin sorpresas al final.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <rect
          x="3"
          y="5"
          width="22"
          height="18"
          rx="3"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path d="M3 10H25" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="7" cy="7.5" r="1" fill="currentColor" />
        <circle cx="10" cy="7.5" r="1" fill="currentColor" />
        <circle cx="13" cy="7.5" r="1" fill="currentColor" />
        <path
          d="M9 16L12 19L19 14"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    number: "03",
    title: "Verificación del Frontier Agent",
    description:
      "El agente de IA evalúa el código contra los criterios acordados y emite una atestación técnica verificable.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <path
          d="M14 3L4 8V14C4 19.5 8.2 24.3 14 25.5C19.8 24.3 24 19.5 24 14V8L14 3Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path
          d="M10 14L13 17L18 11"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    number: "04",
    title: "Pago Automático en Solana",
    description:
      "Con la verificación válida, el escrow libera automáticamente el pago y la comisión. Sin botón de cobro.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <circle cx="14" cy="14" r="11" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M14 7V14L18 18"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M20 8L24 4M8 20L4 24"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
];

export function HowItWorks() {
  return (
    <section id="como-funciona" className="relative py-28 px-6">
      <div className="mx-auto max-w-7xl">
        {/* Section header */}
        <RevealOnScroll>
          <div className="mb-16 max-w-2xl">
            <span className="mb-4 inline-block text-sm font-medium tracking-widest text-lime uppercase">
              Proceso
            </span>
            <h2 className="font-heading text-5xl sm:text-6xl md:text-7xl">
              CÓMO FUNCIONA
            </h2>
            <p className="mt-4 text-lg text-muted">
              Cuatro pasos para conectar lo contratado, lo construido, lo
              verificado y lo pagado.
            </p>
          </div>
        </RevealOnScroll>

        {/* Steps grid */}
        <div className="process-grid grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => (
            <RevealOnScroll key={step.number} delay={(i + 1) as 1 | 2 | 3 | 4}>
              <div className="card-glow group relative flex h-full flex-col rounded-2xl border border-subtle bg-card p-6 transition-all duration-300 hover:border-lime/30 hover:bg-card-hover">
                {/* Number */}
                <span className="font-heading text-5xl text-lime/20 transition-colors group-hover:text-lime/40">
                  {step.number}
                </span>

                {/* Icon */}
                <div className="feature-icon mt-4 mb-4 text-lime">{step.icon}</div>

                {/* Content */}
                <h3 className="mb-2 text-lg font-semibold text-white">
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted">
                  {step.description}
                </p>

                {/* Hover indicator */}
                <div className="mt-auto pt-6">
                  <div className="h-0.5 w-8 rounded-full bg-lime/20 transition-all duration-300 group-hover:w-full group-hover:bg-lime/40" />
                </div>
              </div>
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
