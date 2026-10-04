"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { PHANTOM_DOWNLOAD_URL } from "@/lib/auth/phantom";
import { shortAddress } from "@/lib/solana/config";
import { useWallet, WalletStatus } from "./useWallet";

const BUTTON =
  "btn-glow rounded-full bg-lime px-5 py-2.5 text-sm font-semibold text-black transition-all duration-200 hover:bg-lime-hover disabled:cursor-wait disabled:opacity-70";

type Props = {
  /** Applied to an outer wrapper so callers can toggle its display (e.g. `hidden md:block`). */
  className?: string;
  id?: string;
  /** After a successful sign-in, navigate here; while signed in, also link to it (unless already there). */
  redirectTo?: string;
  redirectLabel?: string;
};

export function ConnectWallet({ className = "", id, redirectTo, redirectLabel = "Subir contrato (PDF)" }: Props) {
  const { status, wallet, error, hasPhantom, connect, disconnect } = useWallet();
  const router = useRouter();
  const pathname = usePathname();

  const onConnect = async () => {
    if ((await connect()) && redirectTo && pathname !== redirectTo) router.push(redirectTo);
  };

  if (status === WalletStatus.Connected && wallet) {
    return (
      <div className={className} id={id}>
        <div className="flex flex-wrap items-center gap-2">
          {redirectTo && pathname !== redirectTo && (
            <Link
              href={redirectTo}
              className="btn-glow rounded-full bg-lime px-4 py-2 text-sm font-semibold text-black transition-all duration-200 hover:bg-lime-hover"
            >
              {redirectLabel}
            </Link>
          )}
          <span className="rounded-full border border-lime/40 px-4 py-2 font-mono text-sm text-lime" title={wallet}>
            {shortAddress(wallet)}
          </span>
          <button
            type="button"
            onClick={() => void disconnect()}
            className="rounded-full border border-subtle px-4 py-2 text-sm text-muted transition-colors hover:text-white"
          >
            Desconectar
          </button>
        </div>
      </div>
    );
  }

  const busy = status === WalletStatus.Loading || status === WalletStatus.Connecting;

  return (
    <div className={className}>
      <div className="flex flex-col items-stretch gap-1">
        {hasPhantom || status === WalletStatus.Loading ? (
          <button type="button" id={id} className={BUTTON} disabled={busy} onClick={() => void onConnect()}>
            {status === WalletStatus.Connecting ? "Firmando…" : "Conectar Wallet"}
          </button>
        ) : (
          <a id={id} className={`${BUTTON} text-center`} href={PHANTOM_DOWNLOAD_URL} target="_blank" rel="noopener noreferrer">
            Instalar Phantom
          </a>
        )}
        {error && (
          <p role="alert" className="max-w-xs text-xs text-red-400">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
