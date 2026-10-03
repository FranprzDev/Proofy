import Link from "next/link";

const steps = [
  ["Agreement", "Client and provider agree on a versioned contract with verifiable criteria."],
  ["Verification", "An agent evaluates each delivery against the agreed scenarios, without running untrusted code."],
  ["Payment", "With a valid approval, the milestone payment is released automatically on Solana."],
];

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-10 px-6 py-20">
      <header className="flex flex-col gap-4">
        <h1 className="text-4xl font-semibold tracking-tight">Proofy</h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400">
          Milestone payments verified by agents. Landing placeholder: final content is pending.
        </p>
        <Link href="/marketplace" className="w-fit rounded-md bg-foreground px-4 py-2 text-background">
          Go to the marketplace
        </Link>
      </header>
      <ol className="grid gap-4 sm:grid-cols-3">
        {steps.map(([t, d]) => (
          <li key={t} className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
            <h2 className="font-medium">{t}</h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{d}</p>
          </li>
        ))}
      </ol>
    </main>
  );
}
