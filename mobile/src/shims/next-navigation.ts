import { navigate, usePath } from "../router";

export function useRouter() {
  return {
    push: (to: string) => navigate(to === "/login" ? "/" : to),
    replace: (to: string) => navigate(to, true),
    back: () => window.history.back(),
    refresh: () => window.dispatchEvent(new HashChangeEvent("hashchange")),
    prefetch: () => undefined,
  };
}
export const usePathname = (): string => usePath();
export const useSearchParams = () => new URLSearchParams(window.location.hash.split("?")[1] ?? "");
export function notFound(): never { throw new Error("not found"); }
export function redirect(to: string): never { navigate(to, true); throw new Error("redirect"); }
