import { useSyncExternalStore } from "react";
import type { GraphicsTier } from "@/config/plans";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n";
import { applyTheme, isThemePref, type ThemePref } from "@/lib/theme";
import { browserKV, OfflineStore } from "@/lib/offline/store";
import { offlineTransport } from "@/components/game/offlineTransport";

export interface Settings { locale: Locale; tier: GraphicsTier; sound: boolean; music: boolean; vibration: boolean; theme: ThemePref }
const KEY = "levelup.mobile.settings";

/** Phones vary a lot: start at the middle tier unless the device reports plenty of memory and cores. */
function defaultTier(): GraphicsTier {
  const nav = navigator as Navigator & { deviceMemory?: number };
  return (nav.deviceMemory ?? 4) >= 6 && (navigator.hardwareConcurrency ?? 4) >= 8 ? "A" : "B";
}

function load(): Settings {
  // Hebrew/RTL is the product default; English is one tap away in Settings.
  const base: Settings = { locale: DEFAULT_LOCALE, tier: defaultTier(), sound: true, music: true, vibration: true, theme: "system" };
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const v = JSON.parse(raw) as Partial<Settings>;
      return {
        locale: v.locale === "en" || v.locale === "he" ? v.locale : base.locale,
        tier: v.tier === "A" || v.tier === "B" || v.tier === "C" ? v.tier : base.tier,
        sound: typeof v.sound === "boolean" ? v.sound : true,
        music: typeof v.music === "boolean" ? v.music : true,
        theme: isThemePref(v.theme) ? v.theme : "system",
        vibration: typeof v.vibration === "boolean" ? v.vibration : true,
      };
    }
  } catch { /* defaults */ }
  return base;
}

let settings = load();
applyTheme(settings.theme);
const listeners = new Set<() => void>();
export function setSettings(patch: Partial<Settings>): void {
  settings = { ...settings, ...patch };
  if (patch.theme) applyTheme(patch.theme);
  try { localStorage.setItem(KEY, JSON.stringify(settings)); } catch { /* optional */ }
  listeners.forEach((l) => l());
}
export const getSettings = (): Settings => settings;
export const useSettings = (): Settings => useSyncExternalStore((cb) => { listeners.add(cb); return () => listeners.delete(cb); }, () => settings);

export const store = new OfflineStore(browserKV());
// Start-up repair: a crash between two writes, or a damaged list, can leave a stored game out of the library. Relinks only; never deletes.
try { store.recover(); } catch { /* the library still opens; repairing is retried at the next start */ }
// Test hooks exist only in the `e2e` build (`vite build --mode e2e`), never in the store build.
export const transport = offlineTransport(store, () => settings.tier, { testHooks: import.meta.env.MODE === "e2e" });
