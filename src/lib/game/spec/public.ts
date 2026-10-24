import type { GameSpec } from "./schema";

/**
 * What the browser receives: the whole world, story and mission structure, but NO challenge content.
 * Challenge prompts are delivered one at a time by the server when a station is opened, and answer keys,
 * hints and explanations are released only by the server as the player earns them.
 */
export type PublicSpec = Omit<GameSpec, "challenges"> & { challenges: GameSpec["challenges"] };

export function toPublicSpec(spec: GameSpec): PublicSpec {
  const copy = structuredClone(spec);
  return { ...copy, challenges: [] };
}
