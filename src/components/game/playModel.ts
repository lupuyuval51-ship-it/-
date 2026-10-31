import type { DictKey } from "@/lib/i18n";
import { ApiFailure } from "./transport";

/** What the system Back button (the `levelup:back` event) does on the play screen. Pure, so it is unit-tested. */
export type PlayBack = "pause" | "leave" | "close" | "stay";

/**
 * - not ready (still loading, or the start failed) or no WebGL: the screen shows no pause menu (the render returns before it), so a
 *   Back that only opened one would do nothing visible: leave at once.
 * - playing: pause. Pause menu or finished screen: leave. A question being graded: stay (the answer is on its way). Any other
 *   panel: close it.
 */
export function playBackAction(s: { ready: boolean; webgl: boolean; overlay: "none" | "challenge" | "dialogue" | "boss" | "lore" | "pause" | "done"; busy: boolean }): PlayBack {
  if (!s.ready || !s.webgl) return "leave";
  if (s.overlay === "none") return "pause";
  if (s.overlay === "pause" || s.overlay === "done") return "leave";
  if (s.overlay === "challenge" && s.busy) return "stay";
  return "close";
}

/**
 * The text of the play screen's "could not start" card. A phone with no room left (or with saving blocked) says so instead of the
 * generic text, because starting a run writes it to the device. `saveErrorKey` only exists in the Android app. An expired sign-in
 * (the website; the device never answers 401) says so, because the card's Retry alone would only fail again.
 */
export function bootErrorKey(e: unknown, saveErrorKey?: (e: unknown) => DictKey | null): DictKey {
  if (e instanceof ApiFailure && e.status === 429) return "common.error.rateLimited";
  if (e instanceof ApiFailure && e.status === 401) return "common.error.unauthorized";
  return saveErrorKey?.(e) ?? "hud.loading.error";
}
