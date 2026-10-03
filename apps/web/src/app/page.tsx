import Link from "next/link";

const pasos = [
  ["Acuerdo", "Cliente y proveedor acuerdan un contrato con criterios verificables, versionado."],
  ["Verificación", "Un agente evalúa cada entrega contra los escenarios acordados, sin ejecutar código no confiable."],
  ["Pago", "Con aprobación válida, el pago por hito se libera automáticamente en Solana."],
];

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-10 px-6 py-20">
      <header className="flex flex-col gap-4">
        <h1 className="text-4xl font-semibold tracking-tight">Proofy</h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400">
          Pagos por hito verificados por agentes. Placeholder de landing: el contenido final está
          pendiente.
        </p>
        <Link href="/marketplace" className="w-fit rounded-md bg-foreground px-4 py-2 text-background">
          Ir al marketplace
        </Link>
      </header>
      <ol className="grid gap-4 sm:grid-cols-3">
        {pasos.map(([t, d]) => (
          <li key={t} className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
            <h2 className="font-medium">{t}</h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{d}</p>
          </li>
        ))}
      </ol>
    </main>
  );
}
