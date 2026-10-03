import { HeroWorkflow } from "./HeroWorkflow";
import { LandingIcon, type LandingIconName } from "./LandingIcon";
import { ShaderCanvas } from "./gpu/ShaderCanvas";
import { HERO_FIELD_SHADER } from "./gpu/heroField.wgsl";

const features: { icon: LandingIconName; title: string; detail: string }[] = [
  { icon: "wallet", title: "Fondos protegidos", detail: "Escrow on-chain" },
  { icon: "shield", title: "Calidad verificable", detail: "Evaluación con IA" },
  { icon: "bolt", title: "Pagos automáticos", detail: "Construido en Solana" },
];

export function Hero() {
  return (
    <section className="landing-hero relative overflow-hidden px-6 pt-36 pb-0 sm:pt-40">
      <ShaderCanvas shader={HERO_FIELD_SHADER} interactive className="absolute inset-0 h-full w-full" />
      <div className="hero-grid" aria-hidden="true" />
      <div className="hero-halo" aria-hidden="true" />
      <div className="relative mx-auto grid max-w-7xl items-center gap-12 pb-16 lg:grid-cols-[1.15fr_1fr] lg:gap-10 lg:pb-24">
        <div className="hero-copy relative z-10">
          <div className="mb-7 inline-flex items-center gap-3 rounded-full border border-lime/20 bg-lime/5 px-3.5 py-2 text-[11px] tracking-wider text-lime"><span className="status-dot" /><span>EL TRABAJO EVOLUCIONA.</span><span className="text-white/40">EL PAGO TAMBIÉN.</span></div>
          <h1 className="hero-title font-heading">ENTREGÁ CÓDIGO.<br /><span className="hero-outline">GENERÁ CONFIANZA.</span><br /><span className="text-lime">COBRÁ SIN VUELTAS<span className="text-white">.</span></span></h1>
          <p className="mt-7 max-w-lg text-base leading-relaxed text-white/55 sm:text-lg">Vos construís. La IA verifica. Solana paga.<br className="hidden sm:block" /> Conectamos cada entrega con su recompensa, con reglas claras desde el primer día.</p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <a href="#acceso-temprano" className="btn-glow hero-primary group inline-flex items-center justify-center gap-4 rounded-full bg-lime px-7 py-4 text-sm font-semibold text-black" id="hero-cta-start">Quiero ser parte<LandingIcon name="arrow" className="transition-transform group-hover:translate-x-1" /></a>
            <a href="#como-funciona" className="inline-flex items-center justify-center gap-3 rounded-full border border-white/20 px-6 py-4 text-sm transition-colors hover:border-lime/50 hover:bg-white/5" id="hero-cta-learn"><span className="flex h-5 w-5 items-center justify-center rounded-full border border-white/40 text-[9px]" aria-hidden="true">▶</span>Así funciona Proofy</a>
          </div>
          <div className="mt-7 flex items-center gap-2 text-xs text-white/40"><LandingIcon name="shield" width={15} height={15} />Menos incertidumbre. Más foco en construir.</div>
        </div>
        <div className="hero-visual min-w-0"><HeroWorkflow /></div>
      </div>
      <div className="relative mx-auto max-w-7xl border-t border-white/10">
        <div className="grid gap-6 py-7 sm:grid-cols-3 sm:gap-8">
          {features.map((feature) => <div key={feature.title} className="flex items-center gap-4 sm:justify-center"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-lime/15 bg-lime/5 text-lime"><LandingIcon name={feature.icon} /></div><div><p className="text-sm font-medium text-white/85">{feature.title}</p><p className="mt-1 text-xs text-white/40">{feature.detail}</p></div></div>)}
        </div>
      </div>
    </section>
  );
}
