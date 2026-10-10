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
