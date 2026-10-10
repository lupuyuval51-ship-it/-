import { useSyncExternalStore } from "react";
import type { GraphicsTier } from "@/config/plans";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n";
import { browserKV, OfflineStore } from "@/lib/offline/store";
import { offlineTransport } from "@/components/game/offlineTransport";

export interface Settings { locale: Locale; tier: GraphicsTier; sound: boolean; music: boolean }
const KEY = "levelup.mobile.settings";

/** Phones vary a lot: start at the middle tier unless the device reports plenty of memory and cores. */
function defaultTier(): GraphicsTier {
  const nav = navigator as Navigator & { deviceMemory?: number };
  return (nav.deviceMemory ?? 4) >= 6 && (navigator.hardwareConcurrency ?? 4) >= 8 ? "A" : "B";
}

function load(): Settings {
  // Hebrew/RTL is the product default; English is one tap away in Settings.
  const base: Settings = { locale: DEFAULT_LOCALE, tier: defaultTier(), sound: true, music: true };
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const v = JSON.parse(raw) as Partial<Settings>;
      return {
        locale: v.locale === "en" || v.locale === "he" ? v.locale : base.locale,
        tier: v.tier === "A" || v.tier === "B" || v.tier === "C" ? v.tier : base.tier,
        sound: typeof v.sound === "boolean" ? v.sound : true,
        music: typeof v.music === "boolean" ? v.music : true,
      };
    }
  } catch { /* defaults */ }
  return base;
}

let settings = load();
const listeners = new Set<() => void>();
export function setSettings(patch: Partial<Settings>): void {
  settings = { ...settings, ...patch };
  try { localStorage.setItem(KEY, JSON.stringify(settings)); } catch { /* optional */ }
  listeners.forEach((l) => l());
}
export const useSettings = (): Settings => useSyncExternalStore((cb) => { listeners.add(cb); return () => listeners.delete(cb); }, () => settings);

export const store = new OfflineStore(browserKV());
// Test hooks exist only in the `e2e` build (`vite build --mode e2e`), never in the store build.
export const transport = offlineTransport(store, () => settings.tier, { testHooks: import.meta.env.MODE === "e2e" });
