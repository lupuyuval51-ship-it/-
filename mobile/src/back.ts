/**
 * What the Android back button does on each screen of the offline app (pure, so it is unit-tested; the native wiring is in
 * `native.ts`). Hash routes: see `router.ts` / `App.tsx`.
 *
 * - `game`     inside a game: the game decides (close panel -> pause -> leave).
 * - `history`  any other screen: one screen back.
 * - `library`  a screen with no history behind it (e.g. restored deep link): go to the library instead of doing nothing.
 * - `leave`    on the library (root screen): hand the app to the background, like every Android 12+ app. The system does
 *              the same for a root launcher activity and warns against finishing it:
 *              https://developer.android.com/about/versions/12/behavior-changes-all
 */
export type BackAction = "game" | "history" | "library" | "leave";

export function backAction(path: string, canGoBack: boolean): BackAction {
  if (path.startsWith("/play/")) return "game";
  if (path === "/" || path === "" || path === "/games") return "leave";
  return canGoBack ? "history" : "library";
}
