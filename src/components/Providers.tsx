"use client";
import { useEffect } from "react";
import { useAppStore } from "@/store/appStore";
import { dirOf } from "@/i18n";

/**
 * Client-side providers: store hydration, theme/locale side effects, service-worker registration.
 * UI-kit providers (toasts, dialogs) are composed here as well.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const hydrated = useAppStore((s) => s.hydrated);
  const theme = useAppStore((s) => s.settings.theme);
  const locale = useAppStore((s) => s.settings.locale);
  const textScale = useAppStore((s) => s.settings.textScale);

  useEffect(() => {
    void useAppStore.persist.rehydrate();
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const root = document.documentElement;
    const apply = () => {
      const dark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
      if (dark) root.setAttribute("data-theme", "dark");
      else root.removeAttribute("data-theme");
    };
    apply();
    try { localStorage.setItem("dc-theme", theme); } catch {}
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [theme, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    document.documentElement.lang = locale;
    document.documentElement.dir = dirOf(locale);
    try { localStorage.setItem("dc-locale", locale); } catch {}
  }, [locale, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    document.documentElement.style.setProperty("--text-scale", String(textScale));
    try { localStorage.setItem("dc-text-scale", String(textScale)); } catch {}
  }, [textScale, hydrated]);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);

  return <>{children}</>;
}
