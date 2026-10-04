import Link from "next/link";
import Image from "next/image";

const navigation = [
  { href: "#como-funciona", label: "Cómo funciona" },
  { href: "#beneficios", label: "Beneficios" },
  { href: "#para-quien", label: "Para quién" },
  { href: "#arquitectura", label: "Arquitectura" },
  { href: "#faq", label: "Preguntas frecuentes" },
];

export function Footer() {
  return (
    <footer className="landing-footer relative z-10 px-6 pt-16 pb-12">
      <div className="mx-auto max-w-7xl border-t border-white/10 pt-12">
        <div className="mb-14 grid grid-cols-1 gap-12 md:grid-cols-4">
          <div className="space-y-4 md:col-span-2">
            <Link href="/" className="inline-flex items-center gap-3">
              <Image src="/Icono-Proofy.svg" alt="Proofy" width={64} height={64} className="invert" />
              <span className="font-logo text-3xl font-bold tracking-tight text-white sm:text-4xl">Proofy</span>
            </Link>
            <p className="font-heading text-xl tracking-wide text-white/90">ENTREGAS VERIFICADAS. PAGOS AUTOMÁTICOS.</p>
            <p className="max-w-sm text-sm leading-relaxed text-white/55">
              Proofy guarda el pago de cada hito en un escrow en Solana y lo libera cuando la entrega cumple lo acordado.
            </p>
          </div>

          <div>
            <h4 className="mb-4 font-mono text-xs tracking-wide text-white/40">Navegación</h4>
            <ul className="space-y-2.5 text-sm text-white/60">
              {navigation.map((item) => (
                <li key={item.href}>
                  <a href={item.href} className="transition-colors hover:text-white">
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-mono text-xs tracking-wide text-white/40">Proyecto</h4>
            <ul className="space-y-2.5 text-sm text-white/60">
              <li>
                <Link href="/marketplace" className="transition-colors hover:text-lime">
                  Marketplace demo
                </Link>
              </li>
              <li>
                <a href="https://github.com/FranprzDev/Proofy" target="_blank" rel="noreferrer" className="transition-colors hover:text-white">
                  GitHub ↗
                </a>
              </li>
              <li>
                <a href="https://explorer.solana.com/?cluster=devnet" target="_blank" rel="noreferrer" className="transition-colors hover:text-white">
                  Solana Explorer (Devnet) ↗
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-white/10 pt-8 font-mono text-xs text-white/40 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Proofy</p>
          <p>Construido sobre Solana · Colosseum Hackathon — Superteam Argentina</p>
        </div>
      </div>
    </footer>
  );
}
