/**
 * What the Android back button does on each screen of the offline app (pure, so it is unit-tested; the native wiring is in
 * `native.ts`). Hash routes: see `router.ts` / `App.tsx`.
 *
 * - `game`     inside a game: the game decides (close panel -> pause -> leave). If no game screen is there to decide (it is still
 *              loading, the game was deleted, the screen crashed), `dispatchGameBack` reports it and the library is opened.
 * - `history`  any other screen: one screen back.
 * - `library`  a screen with no history behind it (e.g. restored deep link): go to the library instead of doing nothing. Also the
 *              results of a finished run: the entry behind them is `#/play/<id>`, and opening that starts a NEW run of the game
 *              that was just finished (the store only resumes an unfinished run), so Back must not return there.
 * - `leave`    on the library (root screen): hand the app to the background, like every Android 12+ app. The system does
 *              the same for a root launcher activity and warns against finishing it:
 *              https://developer.android.com/about/versions/12/behavior-changes-all
 */
export type BackAction = "game" | "history" | "library" | "leave";

export function backAction(path: string, canGoBack: boolean): BackAction {
  if (path.startsWith("/play/")) return "game";
  if (path === "/" || path === "" || path === "/games") return "leave";
  if (/^\/games\/[^/]+\/results\/[^/]+$/.test(path)) return "library"; // not `/review` or `/practice`: those go back to the results
  return canGoBack ? "history" : "library";
}

/**
 * Tells the open game screen that Back was pressed (the event `levelup:back`, see `PlayClient`). The game cancels the event when
 * it handled the press; `false` means nobody was there to handle it, so the caller must leave the screen itself.
 */
export function dispatchGameBack(target: Pick<EventTarget, "dispatchEvent"> = window): boolean {
  return !target.dispatchEvent(new Event("levelup:back", { cancelable: true }));
}
