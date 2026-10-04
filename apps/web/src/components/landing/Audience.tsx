import { RevealOnScroll } from "./RevealOnScroll";
import { SectionHeading } from "./SectionHeading";

const groups = [
  {
    title: "PARA CLIENTES",
    intro:
      "Contratá desarrollo sabiendo que el pago se libera solo cuando se cumplen los criterios acordados.",
    items: [
      "Definí tu proyecto con criterios claros y medibles",
      "Financiá cada hito en un escrow on-chain",
      "La entrega se verifica antes de liberar el pago",
      "Si hay un desacuerdo, lo revisa una persona",
      "Cada entrega y cada pago quedan registrados",
    ],
  },
  {
    title: "PARA DESARROLLADORES",
    intro:
      "Freelancers y software factories: los fondos están depositados antes de que escribas la primera línea.",
    items: [
      "El pago está en escrow antes de empezar",
      "Feedback del agente en cada pull request",
      "Cobrás cuando la entrega cumple los criterios",
      "Sin esperar que alguien apruebe a mano",
      "El agente te acompaña durante el desarrollo, no solo al final",
    ],
  },
];

export function Audience() {
  return (
    <section id="para-quien" className="relative px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl">
        <RevealOnScroll>
          <SectionHeading index="03" label="Audiencia" title="PARA QUIÉN" />
        </RevealOnScroll>

        <RevealOnScroll>
          <div className="grid divide-y divide-white/10 border-y border-white/10 lg:grid-cols-2 lg:divide-x lg:divide-y-0">
            {groups.map((group, i) => (
              <div key={group.title} className={`py-10 ${i === 0 ? "lg:pr-12" : "lg:pl-12"}`}>
                <h3 className="font-heading text-3xl sm:text-4xl">{group.title}</h3>
                <p className="mt-4 max-w-md text-white/60">{group.intro}</p>
                <ul className="mt-8 space-y-3">
                  {group.items.map((item) => (
                    <li key={item} className="flex gap-4 text-sm text-white/80 sm:text-base">
                      <span className="font-mono text-lime/70" aria-hidden="true">—</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}
