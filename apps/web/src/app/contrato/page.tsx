import type { Metadata } from "next";
import { ContractAnalyzer } from "@/components/contract/ContractAnalyzer";
import { Navbar } from "@/components/landing/Navbar";

export const metadata: Metadata = { title: "Analizar contrato — Proofy" };

export default function ContractPage() {
  return (
    <div className="landing-page min-h-screen bg-black text-white selection:bg-lime/30 selection:text-white">
      <Navbar />
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 pt-32 pb-20">
        <header className="space-y-3">
          <p className="text-sm font-medium uppercase tracking-widest text-lime">Agente de especificación</p>
          <h1 className="font-heading text-5xl uppercase tracking-wide sm:text-6xl">Analizá tu contrato</h1>
          <p className="max-w-2xl text-muted">
            Subí el PDF del contrato. El agente extrae las cláusulas, detecta ambigüedades y propone los casos de prueba
            que van a verificar cada hito.
          </p>
        </header>
        <ContractAnalyzer />
      </main>
    </div>
  );
}
