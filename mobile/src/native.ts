import { App } from "@capacitor/app";
import { Capacitor, registerPlugin } from "@capacitor/core";
import { Haptics, ImpactStyle, NotificationType } from "@capacitor/haptics";
import type { Feedback } from "@/components/game/PlayClient";
import { getSettings } from "./app-state";
import { backAction } from "./back";
import { isShareableText } from "./export";
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

interface LevelUpFiles {
  share(options: { name: string; mime: string; text: string }): Promise<void>;
}

/**
 * Android's WebView has no Web Share API and drops `<a download href="blob:…">`, so the page's "save backup file" would do
 * nothing in the app. Here, a click on such a link hands the text to the native share sheet instead (`FilesPlugin.java`:
 * "save to Drive / Files", e-mail, …). Only text/JSON blobs made with `URL.createObjectURL` are remembered, and they are
 * forgotten when the page revokes them. The page itself needs no change, and nothing is sent anywhere by the app.
 */
function installFileDownloads(): void {
  const files = registerPlugin<LevelUpFiles>("LevelUpFiles");
  const blobs = new Map<string, Blob>();
  const create = URL.createObjectURL.bind(URL);
  const revoke = URL.revokeObjectURL.bind(URL);
  URL.createObjectURL = (source: Blob | MediaSource) => {
    const url = create(source);
    if (source instanceof Blob && isShareableText(source.type, source.size)) blobs.set(url, source);
    return url;
  };
  URL.revokeObjectURL = (url: string) => {
    blobs.delete(url);
    revoke(url);
  };
  document.addEventListener("click", (event) => {
    const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[download]") : null;
    const blob = link ? blobs.get(link.href) : undefined;
    if (!link || !blob) return;
    event.preventDefault();
    void blob.text().then((text) => files.share({ name: link.download, mime: blob.type, text })).catch(() => { /* the user can tap again */ });
  }, true);
}

/** Hooks that only make sense inside the Android app; a no-op in a browser (tests, `npm run mobile:dev`). */
export function installNativeShell(): void {
  if (!Capacitor.isNativePlatform()) return;
  installBackButton();
  installFileDownloads();
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
