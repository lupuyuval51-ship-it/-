import { useSyncExternalStore } from "react";

/** Hash routing (works from file:// and inside the Android WebView). Paths mirror the website's. */
const read = () => (window.location.hash.replace(/^#/, "") || "/").split("?")[0]!;
const subscribe = (cb: () => void) => {
  window.addEventListener("hashchange", cb);
  return () => window.removeEventListener("hashchange", cb);
};
export const usePath = (): string => useSyncExternalStore(subscribe, read, () => "/");
export function navigate(to: string, replace = false): void {
  const target = `#${to}`;
  if (replace) window.location.replace(target);
  else window.location.hash = to;
}

/**
 * Drops the query part of the current hash (`#/?welcome=1` → `#/`) without adding a history entry or re-rendering, so a
 * one-shot flag such as "show the welcome again" is not replayed when the Android back button returns to this entry.
 */
export function stripQuery(): void {
  const hash = window.location.hash;
  const q = hash.indexOf("?");
  if (q === -1) return;
  try { window.history.replaceState(window.history.state, "", hash.slice(0, q) || "#/"); } catch { /* optional */ }
}
