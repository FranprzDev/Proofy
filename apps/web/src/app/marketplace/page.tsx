export const metadata = { title: "Marketplace — Proofy" };

export default function Marketplace() {
  // TODO: el alcance del catálogo (proyectos, proveedores o ambos) sigue pendiente.
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-6 py-20">
      <h1 className="text-3xl font-semibold tracking-tight">Marketplace</h1>
      <p className="text-zinc-600 dark:text-zinc-400">
        Placeholder. Catálogo, publicación, búsqueda y contratación aún no están definidos.
      </p>
    </main>
  );
}
