import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { Haptics, ImpactStyle, NotificationType } from "@capacitor/haptics";
import type { Feedback } from "@/components/game/PlayClient";
import { getSettings } from "./app-state";
import { backAction } from "./back";
import { navigate } from "./router";

/**
 * Android back button: inside a game it is handled by the game (close panel → pause → leave);
 * elsewhere it goes back one screen, and from the library the app moves to the background (Android 12+ behaviour for a
 * root launcher activity; see `back.ts`). Capacitor's App plugin registers this through AndroidX's back dispatcher, so it
 * keeps working with predictive back, which is on by default for apps targeting Android 16 (API 36).
 */
export function installBackButton(): void {
  if (!Capacitor.isNativePlatform()) return;
  void App.addListener("backButton", ({ canGoBack }) => {
    const path = (window.location.hash.replace(/^#/, "") || "/").split("?")[0]!;
    switch (backAction(path, canGoBack)) {
      case "game": window.dispatchEvent(new Event("levelup:back")); break;
      case "history": window.history.back(); break;
      case "library": navigate("/", true); break;
      case "leave": void App.minimizeApp(); break;
    }
  });
}

/** Short vibrations for game events (can be switched off in Settings). */
export function haptic(kind: Feedback): void {
  if (!getSettings().vibration) return;
  if (Capacitor.isNativePlatform()) {
    if (kind === "correct" || kind === "mission" || kind === "victory") void Haptics.notification({ type: NotificationType.Success });
    else if (kind === "wrong") void Haptics.notification({ type: NotificationType.Error });
    else void Haptics.impact({ style: ImpactStyle.Light });
    return;
  }
  navigator.vibrate?.(kind === "wrong" ? [25, 50, 25] : kind === "victory" ? [30, 50, 30, 50, 80] : kind === "streak" ? [15, 40, 25] : kind === "collect" || kind === "gate" ? 15 : 30);
}
