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
 */

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
