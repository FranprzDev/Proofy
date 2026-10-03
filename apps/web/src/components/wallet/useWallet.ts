"use client";

import { useEffect, useSyncExternalStore } from "react";
import { fetchSessionWallet, getPhantomProvider, signInWithPhantom, signOut, WalletError, WalletErrorCode, WALLET_ERROR_MESSAGES } from "@/lib/auth/phantom";

export enum WalletStatus {
  Loading = "loading",
  Disconnected = "disconnected",
  Connecting = "connecting",
  Connected = "connected",
}

export type WalletState = {
  status: WalletStatus;
  wallet: string | null;
  error: string | null;
  hasPhantom: boolean;
};

// Module-level store so every component (navbar, pages) shares one session state.
const SERVER_STATE: WalletState = { status: WalletStatus.Loading, wallet: null, error: null, hasPhantom: false };
let state: WalletState = SERVER_STATE;
let restoring: Promise<void> | null = null;
const listeners = new Set<() => void>();

function setState(patch: Partial<WalletState>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function restore(): Promise<void> {
  restoring ??= fetchSessionWallet()
    .then((wallet) => setState({ wallet, status: wallet ? WalletStatus.Connected : WalletStatus.Disconnected }))
    .catch(() => setState({ status: WalletStatus.Disconnected }))
    .finally(() => setState({ hasPhantom: getPhantomProvider() !== null }));
  return restoring;
}

/** Resolves true once the SIWS session is established. */
async function connect(): Promise<boolean> {
  setState({ status: WalletStatus.Connecting, error: null });
  try {
    const wallet = await signInWithPhantom();
    setState({ status: WalletStatus.Connected, wallet });
    return true;
  } catch (e) {
    const code = e instanceof WalletError ? e.code : WalletErrorCode.VerifyFailed;
    setState({ status: WalletStatus.Disconnected, wallet: null, error: WALLET_ERROR_MESSAGES[code] });
    return false;
  }
}

async function disconnect() {
  await signOut();
  setState({ status: WalletStatus.Disconnected, wallet: null, error: null });
}

/** Marks the session as gone (e.g. after a 401) so the UI asks to reconnect. */
function expire() {
  setState({ status: WalletStatus.Disconnected, wallet: null, error: "Tu sesión expiró. Volvé a conectar la wallet." });
}

export function useWallet() {
  const snapshot = useSyncExternalStore(subscribe, () => state, () => SERVER_STATE);
  useEffect(() => {
    void restore();
  }, []);
  return { ...snapshot, connect, disconnect, expire };
}
