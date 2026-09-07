"use client";
/** React hooks around the sync engine and connectivity. */
import { useEffect, useSyncExternalStore } from "react";
import { useAppStore, type SyncStatus } from "./appStore";
import { startSync } from "./sync";

export function useSyncStatus(): SyncStatus {
  return useAppStore((s) => s.syncStatus);
}

function subscribeOnline(cb: () => void): () => void {
  window.addEventListener("online", cb);
  window.addEventListener("offline", cb);
  return () => {
    window.removeEventListener("online", cb);
    window.removeEventListener("offline", cb);
  };
}

/** `navigator.onLine`, kept fresh; true during SSR. */
export function useOnline(): boolean {
  return useSyncExternalStore(subscribeOnline, () => navigator.onLine, () => true);
}

/**
 * Starts the background sync engine once for the app lifetime (idempotent – safe under StrictMode).
 * Mount it in the client root (e.g. Providers).
 */
export function useSyncEngine(): void {
  useEffect(() => {
    startSync();
  }, []);
}
