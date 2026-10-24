/**
 * Where the focus goes back to when an in-game dialog closes (pure, so it is unit-tested in node; the DOM wiring is in
 * `useDialogFocus.ts`).
 *
 * The usual case is the element that had the focus when the dialog opened. The play screen's main way to open a dialog is the
 * floating "interact" button, though, and that button is taken off the screen in the same render that opens the dialog: when the
 * dialog's effect runs, the browser has already dropped the focus to <body>, so there is nothing to return to and a screen-reader
 * or keyboard user would restart from the top of the page after every question. For that case the control that was just
 * activated is remembered with its `data-testid`, and when the dialog closes its replacement (the prompt shows again if the player
 * is still next to the station or character) takes the focus.
 *
 * It also decides where Tab goes inside an open dialog (`dialogTabTarget`).
 */

import { trapTarget } from "@/lib/game/a11y/scene";

/** A click on a control, as seen by the document's capture-phase listener. */
export interface Activation<E> {
  el: E;
  /** The control's `data-testid`, which is how its replacement is found again. */
  id: string | null;
  /** When it happened (ms, any monotonic clock). */
  at: number;
}

/** A dialog that opens more than this long after a click was not opened by it. */
export const OPENER_WINDOW_MS = 1500;

/** The control that was activated just before the dialog opened and was removed from the page by it (null: it is still there, or it was not that one). */
export function removedOpener<E>(a: Activation<E> | null, now: number, connected: (e: E) => boolean): { id: string } | null {
  if (!a || a.id === null || now - a.at > OPENER_WINDOW_MS || connected(a.el)) return null;
  return { id: a.id };
}

/**
 * The element to focus when the dialog closes: the one that had the focus before, if it is still usable; otherwise the
 * replacement of the control that opened the dialog and went away; otherwise nothing (the focus is left where it is).
 */
export function focusReturnTarget<E>(previous: E | null, opener: { id: string } | null, usable: (e: E) => boolean, find: (id: string) => E | null): E | null {
  if (previous !== null && usable(previous)) return previous;
  const replacement = opener ? find(opener.id) : null;
  return replacement !== null && usable(replacement) ? replacement : null;
}

/** What the Tab trap needs to know about the focused element (the DOM answers it in `useDialogFocus.ts`). */
export interface TabContext<E> {
  /** Inside the dialog (the dialog box itself included). */
  inside(e: E): boolean;
  /** The dialog box itself. */
  isRoot(e: E): boolean;
  /** `a` comes before `b` in page order. */
  precedes(a: E, b: E): boolean;
}

/**
 * Where Tab (Shift+Tab: `back`) moves the focus inside a modal dialog, with the meaning of `trapTarget`: an index into `items`
 * (the dialog's tabbable controls in page order), -1 for the dialog box itself (it has no control), or null to let the browser
 * move it (it then stays inside). The focused element may be inside the dialog without being one of the listed controls: the
 * "Controls" `<summary>` of the pause menu, or a control that received the focus from a script. Treating it as "outside" sent Tab
 * back to the first control (the pause menu's sound switch instead of "Resume"); here the browser moves on from it and the trap
 * only wraps when no control is left on that side.
 */
export function dialogTabTarget<E>(back: boolean, active: E | null, items: readonly E[], at: TabContext<E>): number | null {
  const index = active === null ? -1 : items.indexOf(active);
  if (index < 0 && active !== null && items.length > 0 && at.inside(active) && !at.isRoot(active)) {
    const edge = back ? !at.precedes(items[0]!, active) : !at.precedes(active, items[items.length - 1]!);
    return edge ? (back ? items.length - 1 : 0) : null;
  }
  return trapTarget(back, index, items.length);
}
