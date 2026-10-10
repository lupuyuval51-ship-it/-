import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { Haptics, ImpactStyle, NotificationType } from "@capacitor/haptics";
import type { Feedback } from "@/components/game/PlayClient";
import { getSettings } from "./app-state";

/**
 * Android back button: inside a game it is handled by the game (close panel → pause → leave);
 * elsewhere it goes back one screen, and from the library it closes the app.
 */
export function installBackButton(): void {
  if (!Capacitor.isNativePlatform()) return;
  void App.addListener("backButton", () => {
    const path = (window.location.hash.replace(/^#/, "") || "/").split("?")[0]!;
    if (path.startsWith("/play/")) window.dispatchEvent(new Event("levelup:back"));
    else if (path === "/" || path === "/games") void App.exitApp();
    else window.history.back();
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
