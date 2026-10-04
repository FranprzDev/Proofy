import { ConnectWallet } from "@/components/wallet/ConnectWallet";
import { ContractIcon, type ContractIconName } from "./ContractIcon";

const REASONS: { icon: ContractIconName; title: string; detail: string }[] = [
  { icon: "pen", title: "Firmás un mensaje", detail: "Phantom te pide firmar un texto para probar que la wallet es tuya." },
  { icon: "coin", title: "Sin costo", detail: "No se paga gas ni comisiones para iniciar sesión." },
  { icon: "lock", title: "Sin transacción", detail: "No se mueve ningún fondo ni se aprueba nada on-chain." },
];

export function ConnectPrompt() {
  return (
    <div className="grid items-center gap-8 lg:grid-cols-[1fr_1.1fr] lg:gap-12">
      <div>
        <div className="cw-lock-badge" aria-hidden="true">
          <ContractIcon name="lock" width={30} height={30} />
        </div>
        <h2 className="mt-6 font-heading text-4xl tracking-wide uppercase sm:text-5xl">
          Conectá tu <span className="text-lime">wallet</span>
        </h2>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-white/55 sm:text-base">
          El análisis queda asociado a tu wallet, así cliente y proveedor pueden aceptar los mismos criterios más adelante.
        </p>
        <ConnectWallet className="mt-7 inline-block" />
        <p className="mt-3 text-xs text-white/35">Necesitás la extensión de Phantom en este navegador.</p>
      </div>
      <ul className="grid gap-3">
        {REASONS.map((reason) => (
          <li key={reason.title} className="flex items-start gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-lime/20 bg-lime/5 text-lime">
              <ContractIcon name={reason.icon} />
            </span>
            <span>
              <span className="block text-sm font-medium text-white/90">{reason.title}</span>
              <span className="mt-1 block text-xs leading-relaxed text-white/45 sm:text-sm">{reason.detail}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
