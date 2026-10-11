/**
 * Short vibrations for game events on a phone.
 *
 * The Android app vibrates through its own host (`onFeedback`, with the native Haptics plugin and its own setting). On
 * the website, phones that support the Vibration API (Android browsers; iOS Safari does not) get the same patterns from
 * here, with a switch in the pause menu. Nothing here is required: when vibration is unavailable every call is a no-op.
 */

export type Feedback = "correct" | "wrong" | "collect" | "mission" | "gate" | "streak" | "victory" | "area" | "checkpoint";

/** Milliseconds on / off / on ... for each event (the same patterns the Android app uses when it falls back to the web API). */
export function vibrationPattern(kind: Feedback): number | number[] {
  switch (kind) {
    case "wrong": return [25, 50, 25];
    case "victory": return [30, 50, 30, 50, 80];
    case "streak": return [15, 40, 25];
    case "collect":
    case "gate":
    case "checkpoint": return 15;
    default: return 30;
  }
}

type VibrateNavigator = { vibrate?: (pattern: number | number[]) => boolean; userActivation?: { hasBeenActive: boolean } };

/** Whether this browser can vibrate at all. */
export function canVibrate(nav: VibrateNavigator | undefined = typeof navigator === "undefined" ? undefined : (navigator as unknown as VibrateNavigator)): boolean {
  return typeof nav?.vibrate === "function";
}

/** Vibrate for an event. Browsers refuse before the first tap, so that case is skipped quietly instead of logging a warning. */
export function webHaptic(kind: Feedback, nav: VibrateNavigator | undefined = typeof navigator === "undefined" ? undefined : (navigator as unknown as VibrateNavigator)): boolean {
  if (!nav || typeof nav.vibrate !== "function") return false;
  if (nav.userActivation && !nav.userActivation.hasBeenActive) return false;
  try {
    return nav.vibrate(vibrationPattern(kind));
  } catch {
    return false;
  }
}
