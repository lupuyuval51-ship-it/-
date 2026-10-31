import type { Npc } from "../spec/schema";

/**
 * What a character says now: once a mission the character reacts to is done, its lines change (the latest finished
 * reaction wins, so the world answers the player's progress). Without reactions the original lines are kept.
 */
export function withReaction<T extends Pick<Npc, "lines" | "reactions">>(npc: T, missionsDone: readonly string[]): T {
  const hit = [...(npc.reactions ?? [])].reverse().find((r) => missionsDone.includes(r.afterMissionId));
  return hit ? { ...npc, lines: hit.lines } : npc;
}
