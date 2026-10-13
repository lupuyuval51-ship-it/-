import { navigate, usePath } from "../router";

// One object for the whole app, like the router of next/navigation: a new object per render would change every callback
// that lists the router as a dependency (the play screen's interaction handler, which the memoised canvas receives).
const router = {
  push: (to: string) => navigate(to === "/login" ? "/" : to),
  replace: (to: string) => navigate(to, true),
  back: () => window.history.back(),
  refresh: () => window.dispatchEvent(new HashChangeEvent("hashchange")),
  prefetch: () => undefined,
};
export function useRouter() {
  return router;
}
export const usePathname = (): string => usePath();
export const useSearchParams = () => new URLSearchParams(window.location.hash.split("?")[1] ?? "");
export function notFound(): never { throw new Error("not found"); }
export function redirect(to: string): never { navigate(to, true); throw new Error("redirect"); }
