/**
 * Screens that handle the Android back button themselves (e.g. a multi-step form goes to its previous
 * step). The native back listener (platform/native) asks these first, after closing an open dialog; the
 * most recently registered one goes first. Nothing here touches Capacitor: in a browser nothing calls it.
 */
import { useEffect, useRef } from 'react';

/** Returns true when it handled the back press. */
export type BackHandler = () => boolean;

const handlers: BackHandler[] = [];

export function registerBackHandler(handler: BackHandler): () => void {
  handlers.push(handler);
  return () => {
    const i = handlers.lastIndexOf(handler);
    if (i >= 0) handlers.splice(i, 1);
  };
}

/** Called by the native back listener: true when a screen handled it. */
export function runBackHandlers(): boolean {
  for (let i = handlers.length - 1; i >= 0; i--) if (handlers[i]!()) return true;
  return false;
}

/** Registers `handler` (latest version each render) while the component is mounted. */
export function useBackHandler(handler: BackHandler): void {
  const latest = useRef(handler);
  useEffect(() => {
    latest.current = handler;
  });
  useEffect(() => registerBackHandler(() => latest.current()), []);
}
