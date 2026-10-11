/**
 * LEVEL UP game specification, schema version 1.
 *
 * A spec is plain JSON: it names layouts, entities, missions and challenges from closed vocabularies and the
 * shared runtime turns that into a world. There is NO executable content anywhere in a spec — the "program"
 * challenge is a tiny block language interpreted by our own sandboxed simulator, never by eval.
 *
 * Unknown keys are stripped by Zod, so anything a model invents outside this schema never reaches the runtime.
 */
import { z } from "zod";
import {
  CHALLENGE_TYPES,
  COLLECTIBLE_KINDS,
  CONTENT_LANGUAGES,
  DIFFICULTIES,
  ENVIRONMENTS,
  GAME_TYPES,
  GENERATION_MODES,
  LAYOUTS,
  MECHANICS,
  NPC_SHAPES,
  SIMULATION_KINDS,
  SPEC_LIMITS as L,
  SUBJECT_CATEGORIES,
  TIMES_OF_DAY,
} from "./constants";

export const SPEC_SCHEMA_VERSION = 1 as const;

// Bidirectional-override and other control characters are stripped in sanitize(); this guards what remains.
const CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F‎‏‪-‮⁦-⁩]/;

const text = (max: number, min = 1) =>
  z
    .string()
    .trim()
    .min(min)
    .max(max)
    .refine((s) => !CONTROL.test(s), "Control or bidirectional-override characters are not allowed.");

export const idSchema = z.string().regex(/^[A-Za-z0-9][A-Za-z0-9_-]{0,39}$/, "ids use letters, digits, '-' or '_' (max 40 chars)");
const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, "colors must be #rrggbb");
const gridInt = (max: number) => z.number().int().min(0).max(max);

// ───────────────────────────── program (robot) challenge ─────────────────────────────

export type Block =
  | { t: "move" }
  | { t: "left" }
  | { t: "right" }
  | { t: "repeat"; n: number; body: Block[] }
  | { t: "if"; body: Block[]; else: Block[] };

export const BLOCK_KINDS = ["move", "turnLeft", "turnRight", "repeat", "ifPathClear"] as const;
export type BlockKind = (typeof BLOCK_KINDS)[number];

const blockSchema: z.ZodType<Block> = z.lazy(() =>
  z.discriminatedUnion("t", [
    z.object({ t: z.literal("move") }),
    z.object({ t: z.literal("left") }),
    z.object({ t: z.literal("right") }),
    z.object({ t: z.literal("repeat"), n: z.number().int().min(2).max(9), body: z.array(blockSchema).min(1).max(8) }),
    z.object({ t: z.literal("if"), body: z.array(blockSchema).max(8), else: z.array(blockSchema).max(8).default([]) }),
  ]),
) as z.ZodType<Block>;
export { blockSchema };

const cell = z.object({ x: gridInt(L.gridMax - 1), y: gridInt(L.gridMax - 1) });

// ───────────────────────────── challenges ─────────────────────────────

const challengeBase = {
  id: idSchema,
  title: text(80),
  prompt: text(600),
  /** Short concept tag shown in the learning report ("for loops", "photosynthesis"). */
  concept: text(60),
  /** Which learning objective this challenge assesses. */
  objectiveId: idSchema.optional(),
  level: z.number().int().min(1).max(3).default(1),
  hint: text(260).optional(),
  /** Shown after the challenge is resolved: the "why" behind the answer. */
  explanation: text(600),
  /** Only used with the `timed_bonus` mechanic. */
  timeLimitSec: z.number().int().min(10).max(180).optional(),
  /** Adaptive variants (served by the server according to the player's performance). */
  easierId: idSchema.optional(),
  harderId: idSchema.optional(),
};

export const choiceChallenge = z.object({
  ...challengeBase,
  type: z.literal("choice"),
  options: z
    .array(z.object({ id: idSchema, text: text(220), feedback: text(320) }))
    .min(2)
    .max(L.optionsPerChoice),
  correctOptionId: idSchema,
});

export const numericChallenge = z.object({
  ...challengeBase,
  type: z.literal("numeric"),
  answer: z.number().finite(),
  tolerance: z.number().min(0).max(1_000_000).default(0),
  unit: text(12).optional(),
  /** Specific wrong answers with targeted explanations ("did you forget to carry the 1?"). */
  commonMistakes: z.array(z.object({ value: z.number().finite(), feedback: text(260) })).max(3).default([]),
});

export const sequenceChallenge = z.object({
  ...challengeBase,
  type: z.literal("sequence"),
  /** Items listed in the CORRECT order; the player sees them shuffled. */
  items: z.array(z.object({ id: idSchema, text: text(180) })).min(3).max(L.itemsPerSequence),
});

export const matchChallenge = z.object({
  ...challengeBase,
  type: z.literal("match"),
  pairs: z.array(z.object({ id: idSchema, left: text(90), right: text(140) })).min(3).max(L.pairsPerMatch),
});

export const programChallenge = z.object({
  ...challengeBase,
  type: z.literal("program"),
  grid: z.object({
    width: z.number().int().min(3).max(L.gridMax),
    height: z.number().int().min(3).max(L.gridMax),
    start: z.object({ x: gridInt(L.gridMax - 1), y: gridInt(L.gridMax - 1), dir: z.enum(["N", "E", "S", "W"]) }),
    goal: cell,
    walls: z.array(cell).max(24).default([]),
  }),
  allowed: z.array(z.enum(BLOCK_KINDS)).min(1).max(5),
  maxBlocks: z.number().int().min(1).max(L.programBlocksMax),
  /** A reference solution proves the puzzle is solvable. It is verified on validation and never sent to players. */
  solution: z.array(blockSchema).min(1).max(L.programBlocksMax),
});

const projectileConfig = z.object({
  kind: z.literal("projectile"),
  gravity: z.number().min(1).max(25).default(9.8),
  targetDistance: z.number().min(5).max(200),
  tolerance: z.number().min(0.5).max(15).default(2),
  maxSpeed: z.number().min(5).max(60).default(30),
});
const leverConfig = z.object({
  kind: z.literal("lever"),
  leftWeight: z.number().min(1).max(100),
  leftDistance: z.number().min(0.5).max(10),
  rightWeight: z.number().min(1).max(100),
  maxDistance: z.number().min(1).max(20).default(10),
  tolerance: z.number().min(0.05).max(2).default(0.25),
});

export const simulationChallenge = z.object({
  ...challengeBase,
  type: z.literal("simulation"),
  sim: z.discriminatedUnion("kind", [projectileConfig, leverConfig]),
});

export const challengeSchema = z.discriminatedUnion("type", [
  choiceChallenge,
  numericChallenge,
  sequenceChallenge,
  matchChallenge,
  programChallenge,
  simulationChallenge,
]);

// ───────────────────────────── world entities ─────────────────────────────

export const stationSchema = z
  .object({
    id: idSchema,
    kind: z.enum(["challenge", "lore"]),
    label: text(40),
    challengeId: idSchema.optional(),
    loreTitle: text(70).optional(),
    loreText: text(420).optional(),
  })
  .superRefine((s, ctx) => {
    if (s.kind === "challenge" && !s.challengeId) ctx.addIssue({ code: "custom", path: ["challengeId"], message: "challenge stations need a challengeId" });
    if (s.kind === "lore" && (!s.loreTitle || !s.loreText)) ctx.addIssue({ code: "custom", path: ["loreText"], message: "lore stations need loreTitle and loreText" });
  });

export const npcSchema = z.object({
  id: idSchema,
  name: text(40),
  role: text(60),
  look: z.object({ color: hex, shape: z.enum(NPC_SHAPES) }),
  lines: z.array(text(240)).min(1).max(L.linesPerNpc),
  hint: text(220).optional(),
  /** What the character says once a mission is done: the world answers the player's progress. The latest finished one wins. */
  reactions: z.array(z.object({ afterMissionId: idSchema, lines: z.array(text(240)).min(1).max(3) })).max(L.reactionsPerNpc).default([]),
});

/**
 * A boss: a multi-phase battle made of the area's own challenge stations. The phase stations open one after the
 * other; every phase solved wounds the boss, and the last one defeats it. There is no new grading or scoring path:
 * each phase is an ordinary challenge, so answers, hints and points stay server-validated.
 */
export const bossSchema = z.object({
  id: idSchema,
  areaId: idSchema,
  name: text(40),
  /** The epithet shown with the name ("Guardian of the Loop"). */
  title: text(70),
  /** Spoken when the player walks up to the boss. */
  intro: text(260),
  defeatLine: text(200),
  look: z.object({ color: hex, shape: z.enum(NPC_SHAPES) }),
  phaseStationIds: z.array(idSchema).min(L.bossPhasesMin).max(L.bossPhasesMax),
});

export const areaSchema = z.object({
  id: idSchema,
  name: text(60),
  description: text(260),
  layout: z.enum(LAYOUTS),
  size: z.enum(["small", "medium", "large"]).default("medium"),
  hazardLevel: z.enum(["none", "low", "high"]).default("none"),
  intro: text(260).optional(),
  stations: z.array(stationSchema).min(1).max(L.stationsPerArea),
  npcs: z.array(npcSchema).max(L.npcsPerArea).default([]),
  collectibles: z
    .object({ kind: z.enum(COLLECTIBLE_KINDS), count: z.number().int().min(0).max(L.collectiblesPerArea), label: text(40) })
    .default({ kind: "gem", count: 0, label: "Gems" }),
  /** Doorway to another area. Required for every area except the first to be reachable. */
  portal: z.object({ toAreaId: idSchema, label: text(50), requiresMissionIds: z.array(idSchema).max(4).default([]) }).optional(),
});

export const objectiveSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("solve"), text: text(200), challengeIds: z.array(idSchema).min(1).max(6) }),
  z.object({ type: z.literal("collect"), text: text(200), count: z.number().int().min(1).max(L.collectiblesPerArea) }),
  z.object({ type: z.literal("talk"), text: text(200), npcId: idSchema }),
  z.object({ type: z.literal("visit"), text: text(200), stationIds: z.array(idSchema).min(1).max(4) }),
  z.object({ type: z.literal("defeat"), text: text(200), bossId: idSchema }),
]);

export const missionSchema = z.object({
  id: idSchema,
  title: text(80),
  story: text(320),
  areaId: idSchema,
  requires: z.array(idSchema).max(4).default([]),
  objectives: z.array(objectiveSchema).min(1).max(L.objectivesPerMission),
  /** A side mission: it pays its bonus but the game can be finished without it. */
  optional: z.boolean().default(false),
});

// ───────────────────────────── the spec ─────────────────────────────

export const generatorInfoSchema = z.object({
  /** `engine` = built by the rule-based study engine from the learner's own material (not AI, not a template). */
  kind: z.enum(["ai", "demo", "engine"]),
  provider: z.string().max(40),
  model: z.string().max(80),
  templateId: z.string().max(40).optional(),
  mode: z.enum(GENERATION_MODES),
  generatedAt: z.string().max(40),
});
export type GeneratorInfo = z.infer<typeof generatorInfoSchema>;

export const gameSpecSchema = z.object({
  schemaVersion: z.literal(SPEC_SCHEMA_VERSION).default(SPEC_SCHEMA_VERSION),
  meta: z.object({
    title: text(80),
    tagline: text(160),
    subject: text(120),
    subjectCategory: z.enum(SUBJECT_CATEGORIES).default("other"),
    gameType: z.enum(GAME_TYPES),
    difficulty: z.enum(DIFFICULTIES),
    language: z.enum(CONTENT_LANGUAGES),
    estimatedMinutes: z.number().int().min(2).max(120),
    /** Assigned by the server after validation; anything a model puts here is overwritten. */
    generator: generatorInfoSchema.optional(),
  }),
  learning: z.object({
    goal: text(320),
    objectives: z.array(z.object({ id: idSchema, text: text(220) })).min(1).max(L.learningObjectives),
    conclusion: text(700),
  }),
  theme: z.object({
    environment: z.enum(ENVIRONMENTS),
    timeOfDay: z.enum(TIMES_OF_DAY).default("day"),
    palette: z.object({ primary: hex, accent: hex }).optional(),
  }),
  mechanics: z.array(z.enum(MECHANICS)).max(MECHANICS.length).default([]),
  areas: z.array(areaSchema).min(1).max(L.areas),
  missions: z.array(missionSchema).min(1).max(L.missions),
  challenges: z.array(challengeSchema).min(1).max(L.challenges),
  bosses: z.array(bossSchema).max(L.bosses).default([]),
});

export type GameSpec = z.infer<typeof gameSpecSchema>;
export type Area = z.infer<typeof areaSchema>;
export type Boss = z.infer<typeof bossSchema>;
export type Station = z.infer<typeof stationSchema>;
export type Npc = z.infer<typeof npcSchema>;
export type Mission = z.infer<typeof missionSchema>;
export type Objective = z.infer<typeof objectiveSchema>;
export type Challenge = z.infer<typeof challengeSchema>;
export type ChoiceChallenge = z.infer<typeof choiceChallenge>;
export type NumericChallenge = z.infer<typeof numericChallenge>;
export type SequenceChallenge = z.infer<typeof sequenceChallenge>;
export type MatchChallenge = z.infer<typeof matchChallenge>;
export type ProgramChallenge = z.infer<typeof programChallenge>;
export type SimulationChallenge = z.infer<typeof simulationChallenge>;
export type ChallengeTypeName = (typeof CHALLENGE_TYPES)[number];
export type SimKind = (typeof SIMULATION_KINDS)[number];

/** What the model returns for the "Extend Existing Game" mode: additions only, merged deterministically. */
export const extensionSchema = z.object({
  mechanics: z.array(z.enum(MECHANICS)).max(MECHANICS.length).default([]),
  objectives: z.array(z.object({ id: idSchema, text: text(220) })).max(3).default([]),
  conclusion: text(700).optional(),
  areas: z.array(areaSchema).max(2).default([]),
  missions: z.array(missionSchema).max(4).default([]),
  challenges: z.array(challengeSchema).max(10).default([]),
});
export type GameExtension = z.infer<typeof extensionSchema>;
