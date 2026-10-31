/**
 * How long a game takes an average learner. The number comes from the game itself, never from the generator's claim
 * (templates and AI models guessed 18-22 minutes for games that play in 8-10; see docs/balance.md).
 * Coefficients were fitted against the bot-playthrough simulation (`src/lib/game/sim-balance`), which walks the real
 * world models and plays through the real reducer; a unit test keeps the two within 25%.
 */
import type { Challenge, GameSpec } from "./schema";

/** Rough human timings (seconds) for reading and answering one challenge once. */
export function thinkSeconds(ch: Challenge): number {
  const read = ch.prompt.length / 15; // ~15 characters per second of reading
  switch (ch.type) {
    case "choice": return 4 + read + ch.options.length * 2.5;
    case "numeric": return 14 + read;
    case "sequence": return 6 + read + ch.items.length * 5;
    case "match": return 6 + read + ch.pairs.length * 6;
    case "program": return 25 + read + ch.maxBlocks * 4;
    case "simulation": return 35 + read;
  }
}

/** Walking to the station, feedback, the explanation and the occasional retry, per placed challenge. */
const SECONDS_PER_CHALLENGE = 37;
/** Talking to a guide or reading a notes station, including the walk there. */
const SECONDS_PER_NPC_OR_LORE = 17;
const SECONDS_FIXED = 0;

export function estimateSeconds(spec: Pick<GameSpec, "areas" | "challenges">): number {
  const byId = new Map(spec.challenges.map((c) => [c.id, c]));
  let seconds = SECONDS_FIXED;
  for (const area of spec.areas) {
    for (const s of area.stations) {
      if (s.kind === "lore") seconds += SECONDS_PER_NPC_OR_LORE;
      else {
        const ch = s.challengeId ? byId.get(s.challengeId) : undefined;
        if (ch) seconds += thinkSeconds(ch) + SECONDS_PER_CHALLENGE;
      }
    }
    seconds += area.npcs.length * SECONDS_PER_NPC_OR_LORE;
  }
  return seconds;
}

/** Whole minutes, inside what the schema accepts (2..120). */
export function estimateMinutes(spec: Pick<GameSpec, "areas" | "challenges">): number {
  return Math.max(2, Math.min(120, Math.round(estimateSeconds(spec) / 60)));
}
