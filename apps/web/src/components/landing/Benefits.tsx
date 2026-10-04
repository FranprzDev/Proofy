import { RevealOnScroll } from "./RevealOnScroll";
import { SectionHeading } from "./SectionHeading";

const benefits = [
  {
    title: "Fondos en escrow desde el inicio",
    description:
      "El pago queda depositado antes de que empieces. Si la entrega cumple los criterios, se libera.",
    tag: "Desarrollador",
  },
  {
    title: "Entregas verificables",
    description:
      "El agente contrasta la entrega con los criterios acordados y deja registro de qué se cumplió y qué no.",
    tag: "Cliente",
  },
  {
    title: "Reglas a la vista",
    description:
      "Los fondos se custodian on-chain y las condiciones de liberación son las mismas para las dos partes.",
    tag: "Ambos",
  },
  {
    title: "Pago sin trámites",
    description:
      "Cuando la verificación es válida, el escrow libera el pago. No hay aprobaciones manuales de por medio.",
    tag: "Ambos",
  },
  {
    title: "Feedback durante el desarrollo",
    description:
      "El agente comenta en cada pull request qué falta para cumplir los criterios. No toca tu código.",
    tag: "Desarrollador",
  },
  {
    title: "Criterios claros desde el día cero",
    description:
      "Escenarios y pruebas se acuerdan antes de escribir la primera línea, así no se discute después qué era lo pedido.",
    tag: "Ambos",
  },
];

export function Benefits() {
  return (
    <section id="beneficios" className="relative px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl">
        <RevealOnScroll>
          <SectionHeading index="02" label="Ventajas" title="¿POR QUÉ PROOFY?">
            Diseñado para reducir dos riesgos: que el desarrollador entregue sin cobrar y que el
            cliente pague sin recibir lo acordado.
          </SectionHeading>
        </RevealOnScroll>

        <RevealOnScroll>
          <ul className="border-b border-white/10">
            {benefits.map((benefit) => (
              <li
                key={benefit.title}
                className="grid gap-2 border-t border-white/10 py-7 md:grid-cols-12 md:gap-8"
              >
                <h3 className="text-lg font-medium text-white md:col-span-4">{benefit.title}</h3>
                <p className="text-sm leading-relaxed text-white/60 md:col-span-6 md:text-base">
                  {benefit.description}
                </p>
                <span className="font-mono text-[11px] tracking-wider text-white/40 uppercase md:col-span-2 md:pt-1 md:text-right">
                  {benefit.tag}
                </span>
              </li>
            ))}
          </ul>
        </RevealOnScroll>
      </div>
    </section>
  );
}
