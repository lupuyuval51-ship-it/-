import type { ClientState } from "@/lib/game/state/progress";

/**
 * Does `next` show everything `current` shows? An autosave only stores where the player stands, and nothing on the play screen
 * reads that from the client state (the runtime keeps the live position), so its answer is not worth a render of the whole play
 * screen and scene every few seconds of walking. Any other difference, in progress, score or area, is applied as before; so is
 * an answer that differs for an unknown reason (a state a lost reply left behind), because the stored state is authoritative.
 */
export function sameProgress(current: ClientState | null, next: ClientState): boolean {
  if (!current) return false;
  const { position: _a, ...a } = current;
  const { position: _b, ...b } = next;
  return JSON.stringify(a) === JSON.stringify(b);
}
