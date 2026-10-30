/**
 * Android back button / back gesture in the app: close an open dialog first, otherwise go back in the
 * app, and leave the app (to the home screen) at its start page. Pure decision + DOM helper, so it is
 * testable without a phone.
 */

export type BackAction = 'close-dialog' | 'back' | 'home' | 'leave';

/** Start pages: back leaves the app from here (`/welcome` is the device-mode first run, before the questionnaire). */
export const ROOT_PATHS: readonly string[] = ['/', '/welcome', '/onboarding'];

export function backAction(state: { pathname: string; dialogOpen: boolean; canGoBack: boolean }): BackAction {
  if (state.dialogOpen) return 'close-dialog';
  if (ROOT_PATHS.includes(state.pathname)) return 'leave';
  // Opened straight on an inner page (e.g. from a reminder): back goes to the start page, not out of the app.
  return state.canGoBack ? 'back' : 'home';
}

/** The top-most open <dialog> (modals and sheets of components/ui/Overlay.tsx). */
export function topDialog(doc: Document = document): HTMLDialogElement | null {
  const open = doc.querySelectorAll<HTMLDialogElement>('dialog[open]');
  return open.length ? open[open.length - 1]! : null;
}

/** Closes a dialog the way Esc does: a `cancel` event its owner handles, or a plain close otherwise. */
export function closeDialog(dialog: HTMLDialogElement): void {
  const handledByOwner = !dialog.dispatchEvent(new Event('cancel', { cancelable: true }));
  if (!handledByOwner && typeof dialog.close === 'function') dialog.close();
}
