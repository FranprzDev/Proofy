import type { ReactNode } from "react";

/** Shared section header: a mono index on a thin rule, a Bebas heading and an optional intro. */
export function SectionHeading({
  index,
  label,
  title,
  children,
}: {
  index: string;
  label: string;
  title: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className="mb-14 border-t border-white/10 pt-5 sm:mb-16">
      <p className="font-mono text-xs tracking-wide text-white/45">
        <span className="text-lime">{index}</span> — {label}
      </p>
      <h2 className="mt-8 font-heading text-5xl leading-none sm:text-6xl md:text-7xl">{title}</h2>
      {children ? <p className="mt-5 max-w-xl text-base leading-relaxed text-white/60 sm:text-lg">{children}</p> : null}
    </header>
  );
}
