import type { Metadata } from "next";
import { ContractAnalyzer } from "@/components/contract/ContractAnalyzer";
import { Navbar } from "@/components/landing/Navbar";

export const metadata: Metadata = { title: "Analizar contrato — Proofy" };

export default function ContractPage() {
  return (
    <div className="landing-page min-h-screen bg-black text-white selection:bg-lime/30 selection:text-white">
      <Navbar />
      <div className="cw-page relative overflow-hidden">
        <div className="hero-grid" aria-hidden="true" />
        <div className="hero-halo" aria-hidden="true" />
        <main className="relative mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 pt-32 pb-24 sm:px-6 sm:pt-40">
          <header className="hero-copy max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-lime/20 bg-lime/5 px-3.5 py-2 text-[11px] tracking-wider text-lime">
              <span className="status-dot" />
              <span>AGENTE DE ESPECIFICACIÓN</span>
              <span className="hidden text-white/40 sm:inline">CONTRATO → CRITERIOS</span>
            </div>
            <h1 className="cw-title font-heading">
              Analizá tu <span className="text-lime">contrato</span>
              <span className="text-white">.</span>
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/55 sm:text-lg">
              Subí el PDF y el agente extrae las cláusulas, marca lo ambiguo y propone los casos de prueba que van a verificar
              cada hito antes de liberar el pago.
            </p>
          </header>
          <div className="hero-visual">
            <ContractAnalyzer />
          </div>
        </main>
      </div>
    </div>
  );
}
