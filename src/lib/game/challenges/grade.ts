/**
 * Pure, server-authoritative grading for every challenge type, plus the redacted "public" view sent to the
 * browser (no answer keys, no per-option feedback, no hints/explanations until the server releases them).
 */
import { z } from "zod";
import type { ContentLanguage } from "../spec/constants";
import { answerBlockSchema, idSchema, type Block, type Challenge, type ProgramChallenge } from "../spec/schema";
import { runProgram, type RunResult } from "./program";
import { ANGLE_RANGE, leverBalanceDistance, projectileRange, projectileSolution } from "./simulations";
import { msg } from "./messages";
import { hashSeed, mulberry32 } from "../util/prng";

// ───────────────────────────── answers ─────────────────────────────

export const answerSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("choice"), optionId: idSchema }),
  z.object({ type: z.literal("numeric"), value: z.number().finite() }),
  z.object({ type: z.literal("sequence"), order: z.array(idSchema).max(8) }),
  z.object({ type: z.literal("match"), pairs: z.array(z.object({ leftId: idSchema, rightId: idSchema })).max(8) }),
  z.object({ type: z.literal("program"), program: z.array(answerBlockSchema).max(14) }),
  z.object({ type: z.literal("simulation"), params: z.record(z.string().max(20), z.number().finite()).refine((o) => Object.keys(o).length <= 4) }),
]);
export type Answer = z.infer<typeof answerSchema>;

export interface GradeResult {
  correct: boolean;
  /** Immediate feedback shown to the player (explains mistakes). */
  feedback: string;
  /** Extra structured data for the UI (e.g. which sequence slots were right, the robot's trail). */
  detail?: Record<string, unknown>;
}

const round = (n: number, d = 1) => Math.round(n * 10 ** d) / 10 ** d;

// ───────────────────────────── opaque ids ─────────────────────────────

/**
 * The browser never sees the ids written in the game: choices, sequence items and both sides of a match carry opaque,
 * per-session ids derived from the session seed. Otherwise the ids themselves would give the answer away (a match is
 * "right id = left id", demo sequences are numbered in the right order). `seed` must be unknown to the player on the
 * server (see `answerSeed` in src/server/games/answer-seed.ts); in the offline app the device is the trust boundary.
 */
type IdKind = "o" | "i" | "l" | "r";

interface IdMap {
  toPublic: Map<string, string>;
  toRaw: Map<string, string>;
}

function idMap(ch: Challenge, seed: string, kind: IdKind): IdMap {
  const raw =
    ch.type === "choice" ? ch.options.map((o) => o.id) : ch.type === "sequence" ? ch.items.map((i) => i.id) : ch.type === "match" ? ch.pairs.map((p) => p.id) : [];
  const toPublic = new Map<string, string>();
  const toRaw = new Map<string, string>();
  for (const id of raw) {
    let salt = 0;
    let pub = `${kind}${hashSeed(`${seed}|${ch.id}|${kind}|${id}`).toString(36)}`;
    while (toRaw.has(pub)) pub = `${kind}${hashSeed(`${seed}|${ch.id}|${kind}|${id}|${++salt}`).toString(36)}`;
    toPublic.set(id, pub);
    toRaw.set(pub, id);
  }
  return { toPublic, toRaw };
}

/** The answer as the game file knows it, or null when it names an id this player was never shown. */
function toRawAnswer(ch: Challenge, answer: Answer, seed: string): Answer | null {
  switch (answer.type) {
    case "choice": {
      const id = idMap(ch, seed, "o").toRaw.get(answer.optionId);
      return id === undefined ? null : { type: "choice", optionId: id };
    }
    case "sequence": {
      const m = idMap(ch, seed, "i").toRaw;
      const order = answer.order.map((id) => m.get(id));
      return order.some((id) => id === undefined) ? null : { type: "sequence", order: order as string[] };
    }
    case "match": {
      const l = idMap(ch, seed, "l").toRaw;
      const r = idMap(ch, seed, "r").toRaw;
      const pairs = answer.pairs.map((p) => ({ leftId: l.get(p.leftId), rightId: r.get(p.rightId) }));
      return pairs.some((p) => p.leftId === undefined || p.rightId === undefined) ? null : { type: "match", pairs: pairs as { leftId: string; rightId: string }[] };
    }
    default:
      return answer;
  }
}

/** An answer written with the game file's ids, rewritten with the opaque ids the player was shown (for bots and tests). */
export function toPublicAnswer(ch: Challenge, answer: Answer, seed: string): Answer {
  if (answer.type === "choice" && ch.type === "choice") return { type: "choice", optionId: idMap(ch, seed, "o").toPublic.get(answer.optionId) ?? answer.optionId };
  if (answer.type === "sequence" && ch.type === "sequence") {
    const m = idMap(ch, seed, "i").toPublic;
    return { type: "sequence", order: answer.order.map((id) => m.get(id) ?? id) };
  }
  if (answer.type === "match" && ch.type === "match") {
    const l = idMap(ch, seed, "l").toPublic;
    const r = idMap(ch, seed, "r").toPublic;
    return { type: "match", pairs: answer.pairs.map((p) => ({ leftId: l.get(p.leftId) ?? p.leftId, rightId: r.get(p.rightId) ?? p.rightId })) };
  }
  return answer;
}

/** Detail returned to the player, re-keyed with the ids the player saw. */
function publicDetail(ch: Challenge, detail: GradeResult["detail"], seed: string): GradeResult["detail"] {
  if (!detail) return detail;
  if (ch.type === "choice" && typeof detail.chosen === "string") return { ...detail, chosen: idMap(ch, seed, "o").toPublic.get(detail.chosen) };
  if (ch.type === "match" && detail.right && typeof detail.right === "object") {
    const l = idMap(ch, seed, "l").toPublic;
    return { ...detail, right: Object.fromEntries(Object.entries(detail.right as Record<string, boolean>).map(([id, ok]) => [l.get(id) ?? id, ok])) };
  }
  return detail;
}

/**
 * Grades an answer. With a `seed` the answer must use the opaque ids of the public view (raw ids are refused) and the
 * detail comes back in opaque ids too; without one it is the game file's own ids (analysis tools, unit tests).
 */
export function gradeAnswer(ch: Challenge, answer: Answer, lang: ContentLanguage, seed?: string): GradeResult {
  if (answer.type !== ch.type) return { correct: false, feedback: msg(lang, "invalidAnswer") };
  if (seed === undefined) return gradeRaw(ch, answer, lang);
  const raw = toRawAnswer(ch, answer, seed);
  if (!raw) return { correct: false, feedback: msg(lang, "invalidAnswer") };
  const graded = gradeRaw(ch, raw, lang);
  return { ...graded, detail: publicDetail(ch, graded.detail, seed) };
}

function gradeRaw(ch: Challenge, answer: Answer, lang: ContentLanguage): GradeResult {

  switch (ch.type) {
    case "choice": {
      const a = answer as Extract<Answer, { type: "choice" }>;
      const option = ch.options.find((o) => o.id === a.optionId);
      if (!option) return { correct: false, feedback: msg(lang, "invalidAnswer") };
      const correct = a.optionId === ch.correctOptionId;
      return { correct, feedback: option.feedback, detail: { chosen: a.optionId } };
    }
    case "numeric": {
      const a = answer as Extract<Answer, { type: "numeric" }>;
      if (Math.abs(a.value - ch.answer) <= ch.tolerance + 1e-9) return { correct: true, feedback: msg(lang, "numericRight") };
      const mistake = ch.commonMistakes.find((m) => Math.abs(m.value - a.value) <= ch.tolerance + 1e-9);
      return { correct: false, feedback: mistake?.feedback ?? msg(lang, "notQuite") };
    }
    case "sequence": {
      const a = answer as Extract<Answer, { type: "sequence" }>;
      const expected = ch.items.map((i) => i.id);
      const valid = a.order.length === expected.length && new Set(a.order).size === expected.length && a.order.every((id) => expected.includes(id));
      if (!valid) return { correct: false, feedback: msg(lang, "invalidAnswer") };
      const inPlace = a.order.map((id, i) => id === expected[i]);
      const n = inPlace.filter(Boolean).length;
      const correct = n === expected.length;
      return { correct, feedback: correct ? msg(lang, "seqRight") : msg(lang, "seqPartial", { n, total: expected.length }), detail: { inPlace } };
    }
    case "match": {
      const a = answer as Extract<Answer, { type: "match" }>;
      const ids = ch.pairs.map((p) => p.id);
      const valid = a.pairs.length === ids.length && new Set(a.pairs.map((p) => p.leftId)).size === ids.length && a.pairs.every((p) => ids.includes(p.leftId) && ids.includes(p.rightId));
      if (!valid) return { correct: false, feedback: msg(lang, "invalidAnswer") };
      const right = Object.fromEntries(a.pairs.map((p) => [p.leftId, p.leftId === p.rightId]));
      const n = Object.values(right).filter(Boolean).length;
      const correct = n === ids.length;
      return { correct, feedback: correct ? msg(lang, "matchRight") : msg(lang, "matchPartial", { n, total: ids.length }), detail: { right } };
    }
    case "program": {
      const a = answer as Extract<Answer, { type: "program" }>;
      const run = runProgram(ch, a.program as Block[]);
      return { correct: run.success, feedback: programFeedback(ch, run, lang), detail: { trail: run.trail, final: run.final, blocksUsed: run.blocksUsed } };
    }
    case "simulation": {
      const a = answer as Extract<Answer, { type: "simulation" }>;
      if (ch.sim.kind === "projectile") {
        const sim = ch.sim;
        const angle = a.params.angle;
        const speed = a.params.speed;
        if (angle === undefined || speed === undefined || angle < ANGLE_RANGE.min || angle > ANGLE_RANGE.max || speed <= 0 || speed > sim.maxSpeed) {
          return { correct: false, feedback: msg(lang, "invalidAnswer") };
        }
        const range = projectileRange(speed, angle, sim.gravity);
        const diff = range - sim.targetDistance;
        // the same margin as a numeric answer: a slider exactly on the edge is inside (0.25000000000000022 is 0.25)
        const correct = Math.abs(diff) <= sim.tolerance + 1e-9;
        const feedback = correct
          ? msg(lang, "simProjHit", { r: round(range) })
          : diff > 0
            ? msg(lang, "simProjLong", { d: round(diff), r: round(range) })
            : msg(lang, "simProjShort", { d: round(-diff), r: round(range) });
        return { correct, feedback, detail: { range } };
      }
      const sim = ch.sim;
      const d = a.params.distance;
      if (d === undefined || d <= 0 || d > sim.maxDistance) return { correct: false, feedback: msg(lang, "invalidAnswer") };
      const balance = leverBalanceDistance(sim);
      const correct = Math.abs(d - balance) <= sim.tolerance + 1e-9;
      const torque = sim.leftWeight * sim.leftDistance - sim.rightWeight * d;
      return {
        correct,
        feedback: correct ? msg(lang, "simLevBalanced") : torque > 0 ? msg(lang, "simLevHeavyLeft") : msg(lang, "simLevHeavyRight"),
        detail: { torque },
      };
    }
  }
}

function programFeedback(ch: ProgramChallenge, run: RunResult, lang: ContentLanguage): string {
  switch (run.reason) {
    case "goal":
      return msg(lang, "progGoal", { n: run.blocksUsed });
    case "too_many_blocks":
      return msg(lang, "progTooMany", { n: run.blocksUsed, max: ch.maxBlocks });
    case "disallowed_block":
      return msg(lang, "progDisallowed");
    case "too_deep":
      return msg(lang, "progDeep");
    case "step_limit":
      return msg(lang, "progStepLimit");
    default:
      return msg(lang, "progMissed", { x: run.final.x + 1, y: run.final.y + 1, gx: ch.grid.goal.x + 1, gy: ch.grid.goal.y + 1 });
  }
}

// ───────────────────────────── revealing solutions ─────────────────────────────

/** Released only after repeated failure so a learner is never permanently stuck. */
export function revealSolution(ch: Challenge, seed?: string): Record<string, unknown> {
  if (seed !== undefined) {
    // The same solution, written in the opaque ids this player was shown.
    switch (ch.type) {
      case "choice":
        return { optionId: idMap(ch, seed, "o").toPublic.get(ch.correctOptionId) };
      case "sequence": {
        const m = idMap(ch, seed, "i").toPublic;
        return { order: ch.items.map((i) => m.get(i.id)) };
      }
      case "match": {
        const l = idMap(ch, seed, "l").toPublic;
        const r = idMap(ch, seed, "r").toPublic;
        return { pairs: ch.pairs.map((p) => ({ leftId: l.get(p.id), rightId: r.get(p.id) })) };
      }
      default:
        break;
    }
  }
  switch (ch.type) {
    case "choice":
      return { optionId: ch.correctOptionId };
    case "numeric":
      return { value: ch.answer, unit: ch.unit };
    case "sequence":
      return { order: ch.items.map((i) => i.id) };
    case "match":
      return { pairs: ch.pairs.map((p) => ({ leftId: p.id, rightId: p.id })) };
    case "program":
      return { program: ch.solution };
    case "simulation":
      return ch.sim.kind === "projectile" ? { params: projectileSolution(ch.sim) } : { params: { distance: round(leverBalanceDistance(ch.sim), 2) } };
  }
}

// ───────────────────────────── public (redacted) view ─────────────────────────────

export type PublicChallenge = {
  id: string;
  title: string;
  prompt: string;
  concept: string;
  level: number;
  timeLimitSec?: number;
  hasHint: boolean;
} & (
  | { type: "choice"; options: { id: string; text: string }[] }
  | { type: "numeric"; unit?: string }
  | { type: "sequence"; items: { id: string; text: string }[] }
  | { type: "match"; lefts: { id: string; text: string }[]; rights: { id: string; text: string }[] }
  | { type: "program"; grid: ProgramChallenge["grid"]; allowed: ProgramChallenge["allowed"]; maxBlocks: number }
  | { type: "simulation"; sim: Extract<Challenge, { type: "simulation" }>["sim"] }
);

export function seededShuffle<T>(items: readonly T[], seed: string, mustDiffer = false): T[] {
  const rng = mulberry32(hashSeed(seed));
  const out = [...items];
  for (let attempt = 0; attempt < 6; attempt++) {
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [out[i], out[j]] = [out[j]!, out[i]!];
    }
    if (!mustDiffer || out.some((v, i) => v !== items[i])) break;
  }
  return out;
}

export function toPublicChallenge(ch: Challenge, seed: string): PublicChallenge {
  const base = { id: ch.id, title: ch.title, prompt: ch.prompt, concept: ch.concept, level: ch.level, timeLimitSec: ch.timeLimitSec, hasHint: Boolean(ch.hint) };
  switch (ch.type) {
    case "choice": {
      const ids = idMap(ch, seed, "o").toPublic;
      return { ...base, type: "choice", options: seededShuffle(ch.options, `${seed}:${ch.id}`).map((o) => ({ id: ids.get(o.id)!, text: o.text })) };
    }
    case "numeric":
      return { ...base, type: "numeric", unit: ch.unit };
    case "sequence": {
      const ids = idMap(ch, seed, "i").toPublic;
      return { ...base, type: "sequence", items: seededShuffle(ch.items, `${seed}:${ch.id}`, true).map((i) => ({ id: ids.get(i.id)!, text: i.text })) };
    }
    case "match": {
      const l = idMap(ch, seed, "l").toPublic;
      const r = idMap(ch, seed, "r").toPublic;
      return {
        ...base,
        type: "match",
        lefts: ch.pairs.map((p) => ({ id: l.get(p.id)!, text: p.left })),
        rights: seededShuffle(ch.pairs, `${seed}:${ch.id}`, true).map((p) => ({ id: r.get(p.id)!, text: p.right })),
      };
    }
    case "program":
      return { ...base, type: "program", grid: ch.grid, allowed: ch.allowed, maxBlocks: ch.maxBlocks };
    case "simulation":
      return { ...base, type: "simulation", sim: ch.sim };
  }
}
