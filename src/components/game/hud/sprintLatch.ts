/**
 * The on-screen "Run" button.
 *
 * Holding it runs while it is held. That needs a thumb that is also needed for looking around, so a quick tap latches
 * running on until the stick is let go (or the button is tapped again). The latch is also what a screen reader or a
 * keyboard gets, since an assistive "click" has no press-and-hold. Pure state, unit-tested; TouchControls only feeds it
 * pointer events and mirrors the result into `InputState.sprintHeld`.
 */

/** A press shorter than this is a tap (latch), a longer one is a hold. */
export const SPRINT_TAP_MS = 280;

export interface SprintState {
  /** Running stays on after the finger is lifted. */
  latched: boolean;
  /** Time the finger went down, while it is down. */
  downAt: number | null;
}

export const SPRINT_IDLE: SprintState = { latched: false, downAt: null };

export const isSprinting = (s: SprintState): boolean => s.latched || s.downAt !== null;

export function sprintPress(s: SprintState, now: number): SprintState {
  return { ...s, downAt: now };
}

export function sprintRelease(s: SprintState, now: number): SprintState {
  if (s.downAt === null) return s;
  const tap = now - s.downAt < SPRINT_TAP_MS;
  return { latched: tap ? !s.latched : false, downAt: null };
}

/** The pointer was taken away (a system gesture, a lost capture): stop holding, keep an existing latch. */
export function sprintCancel(s: SprintState): SprintState {
  return s.downAt === null ? s : { ...s, downAt: null };
}

/** A click that was not a touch press (keyboard, TalkBack): toggles the latch. */
export function sprintToggle(s: SprintState): SprintState {
  return { latched: !s.latched, downAt: null };
}

/** The stick was let go: a latched run ends with the movement. */
export function sprintStickReleased(s: SprintState): SprintState {
  return s.latched ? { ...s, latched: false } : s;
}
