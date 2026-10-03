import Link from "next/link";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="landing-aurora relative border-t border-subtle bg-black pt-16 pb-12 px-6">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-14">
          {/* Col 1: Brand & Slogan */}
          <div className="md:col-span-2 space-y-4">
            <Link href="/" className="inline-flex items-center gap-3">
              <Image
                src="/Icono-Proofy.svg"
                alt="Proofy"
                width={64}
                height={64}
                className="invert"
              />
              <span className="font-logo text-3xl sm:text-4xl font-bold tracking-tight text-white">
                Proofy
              </span>
            </Link>

            <p className="font-heading text-xl text-white/90 tracking-wide uppercase max-w-md">
              Entregas verificadas. Pagos automáticos.
            </p>

            <p className="text-muted text-sm max-w-sm leading-relaxed">
              La plataforma descentralizada sobre Solana que conecta especificación de requerimientos, auditoría por agentes de IA y liquidación instantánea por hitos.
            </p>

            {/* Solana Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-subtle bg-[#12121a] text-xs text-muted">
              <span>Construido sobre</span>
              <span className="text-[#14F195] font-semibold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#14F195]" />
                Solana
              </span>
            </div>
          </div>

          {/* Col 2: Navigation */}
          <div>
            <h4 className="font-heading text-lg tracking-wider uppercase text-white mb-4">
              Navegación
            </h4>
            <ul className="space-y-2.5 text-sm text-muted">
              <li>
                <a href="#como-funciona" className="hover:text-white transition-colors">
                  Cómo funciona
                </a>
              </li>
              <li>
                <a href="#beneficios" className="hover:text-white transition-colors">
                  Beneficios
                </a>
              </li>
              <li>
                <a href="#para-quien" className="hover:text-white transition-colors">
                  Para quién
                </a>
              </li>
              <li>
                <a href="#arquitectura" className="hover:text-white transition-colors">
                  Arquitectura
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-white transition-colors">
                  Preguntas frecuentes
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3: Ecosystem & Resources */}
          <div>
            <h4 className="font-heading text-lg tracking-wider uppercase text-white mb-4">
              Ecosistema
            </h4>
            <ul className="space-y-2.5 text-sm text-muted">
              <li>
                <Link href="/marketplace" className="hover:text-lime transition-colors">
                  Marketplace Demo
                </Link>
              </li>
              <li>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white transition-colors flex items-center gap-1.5"
                >
                  GitHub
                  <svg className="w-3.5 h-3.5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </li>
              <li>
                <a
                  href="https://solana.com"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white transition-colors"
                >
                  Solana Devnet Explorer
                </a>
              </li>
              <li>
                <span className="inline-block px-2 py-0.5 rounded text-[11px] bg-lime/10 text-lime font-mono">
                  Solana Hackathon 2026
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-subtle flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted">
          <p>© {new Date().getFullYear()} Proofy Protocol. Todos los derechos reservados.</p>
          <div className="flex items-center gap-6">
            <span className="hover:text-white cursor-pointer transition-colors">Términos de Servicio</span>
            <span className="hover:text-white cursor-pointer transition-colors">Política de Privacidad</span>
            <span className="hover:text-white cursor-pointer transition-colors">Documentación</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
