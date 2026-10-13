/** Compact constructors for demo/template content. Output is raw JSON that still goes through full validation. */
import type { Block } from "../spec/schema";

export type Lang = "en" | "he";
export type Tr = (en: string, he: string) => string;
export const translator = (lang: Lang): Tr => (en, he) => (lang === "he" ? he : en);

type Raw = Record<string, unknown>;
const LETTERS = "abcdef";

interface Common {
  id: string;
  title: string;
  prompt: string;
  concept: string;
  level: 1 | 2 | 3;
  objectiveId?: string;
  hint?: string;
  explanation: string;
  timeLimitSec?: number;
  easierId?: string;
  harderId?: string;
}

export const choice = (c: Common & { options: [string, string][]; correct: number }): Raw => ({
  type: "choice", ...strip(c, ["options", "correct"]),
  options: c.options.map(([text, feedback], i) => ({ id: LETTERS[i]!, text, feedback })),
  correctOptionId: LETTERS[c.correct]!,
});

/** The slot the right answer takes in the 1st, 2nd, 3rd … choice question of a pack (cycled; capped by the number of options). `offset` starts a pack part-way round the cycle. */
const ANSWER_SLOTS = [1, 3, 0, 2, 2, 0, 3, 1];

/**
 * Hand-written packs tend to list the right answer first, which a test-wise player learns to pick without knowing the
 * subject. This moves it to a spread-out slot, in order and the same for every language, keeping the wrong options in
 * their written order. Only choice questions change; their option ids follow the new positions.
 */
export function spreadAnswers(challenges: Raw[], offset = 0): Raw[] {
  let nth = offset, pair = offset;
  return challenges.map((c) => {
    if (c.type !== "choice") return c;
    const options = c.options as { id: string; text: string; feedback: string }[];
    // numbers and fractions read best in the order they were written
    if (options.every((o) => /^[-−\d.,/\s]+$/.test(o.text))) return c;
    const right = options.find((o) => o.id === c.correctOptionId)!;
    // a two-option warm-up alternates between the two slots; longer questions follow the cycle
    const slot = options.length < 3 ? pair++ % 2 : Math.min(ANSWER_SLOTS[nth++ % ANSWER_SLOTS.length]!, options.length - 1);
    const placed = options.filter((o) => o !== right);
    placed.splice(slot, 0, right);
    return { ...c, options: placed.map((o, i) => ({ ...o, id: LETTERS[i]! })), correctOptionId: LETTERS[slot]! };
  });
}

/** A two-option warm-up of a choice question: the right option and the one wrong option (by its index) that is easiest to rule out. */
export const easierChoice = (base: Raw, over: { id: string; title: string; wrong: number }): Raw => {
  const options = base.options as { id: string; text: string; feedback: string }[];
  const right = options.find((o) => o.id === base.correctOptionId)!;
  const kept = options.filter((o, i) => o === right || i === over.wrong);
  const { easierId: _e, harderId: _h, ...rest } = base;
  return { ...rest, id: over.id, title: over.title, level: 1, options: kept.map((o, i) => ({ ...o, id: LETTERS[i]! })), correctOptionId: LETTERS[kept.indexOf(right)]! };
};

/** A three-pair warm-up of a match question: its first three pairs. */
export const easierMatch = (base: Raw, over: { id: string; title: string }): Raw => {
  const { easierId: _e, harderId: _h, ...rest } = base;
  return { ...rest, id: over.id, title: over.title, level: 1, pairs: (base.pairs as Raw[]).slice(0, 3).map((p, i) => ({ ...p, id: `p${i + 1}` })) };
};

export const numeric = (c: Common & { answer: number; tolerance?: number; unit?: string; mistakes?: [number, string][] }): Raw => ({
  type: "numeric", ...strip(c, ["answer", "tolerance", "unit", "mistakes"]),
  answer: c.answer, tolerance: c.tolerance ?? 0, ...(c.unit ? { unit: c.unit } : {}),
  commonMistakes: (c.mistakes ?? []).map(([value, feedback]) => ({ value, feedback })),
});

export const sequence = (c: Common & { items: string[] }): Raw => ({
  type: "sequence", ...strip(c, ["items"]), items: c.items.map((text, i) => ({ id: `i${i + 1}`, text })),
});

export const match = (c: Common & { pairs: [string, string][] }): Raw => ({
  type: "match", ...strip(c, ["pairs"]), pairs: c.pairs.map(([left, right], i) => ({ id: `p${i + 1}`, left, right })),
});

export const program = (c: Common & { width: number; height: number; start: { x: number; y: number; dir: "N" | "E" | "S" | "W" }; goal: { x: number; y: number }; walls?: { x: number; y: number }[]; allowed: string[]; maxBlocks: number; solution: Block[] }): Raw => ({
  type: "program", ...strip(c, ["width", "height", "start", "goal", "walls", "allowed", "maxBlocks", "solution"]),
  grid: { width: c.width, height: c.height, start: c.start, goal: c.goal, walls: c.walls ?? [] }, allowed: c.allowed, maxBlocks: c.maxBlocks, solution: c.solution,
});

export const projectile = (c: Common & { gravity?: number; targetDistance: number; tolerance?: number; maxSpeed?: number }): Raw => ({
  type: "simulation", ...strip(c, ["gravity", "targetDistance", "tolerance", "maxSpeed"]),
  sim: { kind: "projectile", gravity: c.gravity ?? 9.8, targetDistance: c.targetDistance, tolerance: c.tolerance ?? 2, maxSpeed: c.maxSpeed ?? 30 },
});

export const lever = (c: Common & { leftWeight: number; leftDistance: number; rightWeight: number; maxDistance?: number; tolerance?: number }): Raw => ({
  type: "simulation", ...strip(c, ["leftWeight", "leftDistance", "rightWeight", "maxDistance", "tolerance"]),
  sim: { kind: "lever", leftWeight: c.leftWeight, leftDistance: c.leftDistance, rightWeight: c.rightWeight, maxDistance: c.maxDistance ?? 10, tolerance: c.tolerance ?? 0.25 },
});

function strip(obj: Raw | Common, keys: string[]): Raw {
  const copy: Raw = { ...(obj as Raw) };
  for (const k of keys) delete copy[k];
  return copy;
}

export const npc = (id: string, name: string, role: string, color: string, shape: "robot" | "human" | "creature" | "orb", lines: string[], hint?: string): Raw => ({
  id, name, role, look: { color, shape }, lines, ...(hint ? { hint } : {}),
});

export const challengeStation = (id: string, label: string, challengeId: string): Raw => ({ id, kind: "challenge", label, challengeId });
export const loreStation = (id: string, label: string, loreTitle: string, loreText: string): Raw => ({ id, kind: "lore", label, loreTitle, loreText });
