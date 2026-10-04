import { RevealOnScroll } from "./RevealOnScroll";
import { SectionHeading } from "./SectionHeading";

const steps = [
  {
    number: "01",
    title: "Acuerdo bilateral",
    description:
      "Cliente y proveedor definen alcance, criterios y casos de prueba con ayuda de IA. Ambos aceptan las reglas antes de empezar.",
  },
  {
    number: "02",
    title: "Desarrollo con pipeline",
    description:
      "Cada pull request pasa por el pipeline del proyecto y recibe feedback del agente. Los problemas aparecen en el camino, no al final.",
  },
  {
    number: "03",
    title: "Verificación del Frontier Agent",
    description:
      "El agente evalúa el código contra los criterios acordados y emite una atestación técnica verificable.",
  },
  {
    number: "04",
    title: "Pago automático en Solana",
    description:
      "Con la verificación válida, el escrow libera el pago y la comisión. Nadie tiene que apretar un botón de cobro.",
  },
];

export function HowItWorks() {
  return (
    <section id="como-funciona" className="relative px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl">
        <RevealOnScroll>
          <SectionHeading index="01" label="Proceso" title="CÓMO FUNCIONA">
            Cuatro pasos para conectar lo contratado, lo construido, lo verificado y lo pagado.
          </SectionHeading>
        </RevealOnScroll>

        <RevealOnScroll>
          <ol className="landing-steps">
            {steps.map((step) => (
              <li key={step.number} className="landing-step">
                <span className="landing-step-node" aria-hidden="true" />
                <span className="font-mono text-xs text-lime">{step.number}</span>
                <h3 className="mt-3 text-lg font-medium text-white">{step.title}</h3>
                <p className="mt-2 max-w-sm text-sm leading-relaxed text-white/60">{step.description}</p>
              </li>
            ))}
          </ol>
        </RevealOnScroll>
      </div>
    </section>
  );
}
