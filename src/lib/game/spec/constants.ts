/**
 * Closed vocabularies for the data-driven game format. The runtime only understands what is listed here;
 * anything else in a model's output is rejected or dropped during validation. No code is ever executed
 * from a specification.
 */

export const GAME_TYPES = ["exploration", "puzzle", "platformer", "simulation", "adventure"] as const;
export type GameType = (typeof GAME_TYPES)[number];

export const DIFFICULTIES = ["beginner", "intermediate", "advanced"] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export const SUBJECT_CATEGORIES = ["programming", "math", "science", "history", "language", "other"] as const;
export type SubjectCategory = (typeof SUBJECT_CATEGORIES)[number];

export const CONTENT_LANGUAGES = ["he", "en", "ar", "es", "fr", "de", "ru"] as const;
export type ContentLanguage = (typeof CONTENT_LANGUAGES)[number];
export const RTL_LANGUAGES: readonly string[] = ["he", "ar"];

export const GENERATION_MODES = ["FAST", "FULL", "EXTEND"] as const;
export type GenerationModeId = (typeof GENERATION_MODES)[number];

/** How a world is laid out. The layout decides geometry; the spec decides everything placed in it. */
export const LAYOUTS = ["plaza", "corridor", "rooms", "terraces", "lab"] as const;
export type Layout = (typeof LAYOUTS)[number];

export const ENVIRONMENTS = [
  "neon-city",
  "forest",
  "space-station",
  "desert-ruins",
  "ocean-floor",
  "laboratory",
  "castle",
  "sky-islands",
] as const;
export type Environment = (typeof ENVIRONMENTS)[number];

export const TIMES_OF_DAY = ["day", "dusk", "night"] as const;
export type TimeOfDay = (typeof TIMES_OF_DAY)[number];

export const NPC_SHAPES = ["robot", "human", "creature", "orb"] as const;
export type NpcShape = (typeof NPC_SHAPES)[number];

export const COLLECTIBLE_KINDS = ["gem", "data-core", "star", "leaf", "coin"] as const;
export type CollectibleKind = (typeof COLLECTIBLE_KINDS)[number];

/** Optional gameplay systems a spec can switch on. Each one has an implementation in the runtime. */
export const MECHANICS = [
  "collect",
  "dialogue",
  "jump",
  "hazards",
  "checkpoints",
  "moving_platforms",
  "gates",
  "portals",
  "timed_bonus",
  "adaptive_difficulty",
] as const;
export type Mechanic = (typeof MECHANICS)[number];

export const CHALLENGE_TYPES = ["choice", "numeric", "sequence", "match", "program", "simulation"] as const;
export type ChallengeType = (typeof CHALLENGE_TYPES)[number];

export const SIMULATION_KINDS = ["projectile", "lever"] as const;
export type SimulationKind = (typeof SIMULATION_KINDS)[number];

/** Hard caps that keep generated games small, fast and stable. */
export const SPEC_LIMITS = {
  areas: 4,
  missions: 8,
  challenges: 24,
  stationsPerArea: 8,
  npcsPerArea: 3,
  bosses: 3,
  bossPhasesMin: 2,
  bossPhasesMax: 5,
  reactionsPerNpc: 3,
  collectiblesPerArea: 12,
  objectivesPerMission: 4,
  learningObjectives: 6,
  linesPerNpc: 5,
  optionsPerChoice: 5,
  itemsPerSequence: 6,
  pairsPerMatch: 6,
  programBlocksMax: 14,
  gridMax: 7,
  maxBytes: 160_000,
} as const;
