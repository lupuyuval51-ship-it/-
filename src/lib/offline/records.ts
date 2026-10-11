/**
 * Shape checks for records that come from outside the running code: older app versions, a backup file, the cloud.
 *
 * Two levels, on purpose:
 *  - `normalize*` is lenient and used when reading the device's own storage. It fills in what older versions did not
 *    write (`bossesDefeated`, `updatedAt`, `revision`, ...) and returns null for a record that cannot be used, so one
 *    damaged record is skipped instead of crashing the library. Applied to an already-current record it changes nothing.
 *  - `check*` is strict and used for untrusted input (backup file, cloud rows): zod limits sizes and types, and every
 *    game spec goes through `validateGameSpec`, which also sanitises it. Pure: no DOM, no network, no storage.
 */
import { z } from "zod";
import { FEATURE_TIERS, type FeatureTier } from "../../config/plans";
import { generatorInfoSchema, type GameSpec } from "../game/spec/schema";
import { clampToFeatureTier } from "../game/spec/tier";
import { validateGameSpec } from "../game/spec/validate";
import type { ChallengeRecord, PlayState } from "../game/state/progress";
import { MASTERED_AFTER_BOX, type DeckCard } from "./deck";
import { getOfflineTier } from "./entitlement";
import type { StoredGame, StoredSession } from "./store";

const UNSAFE_KEYS = new Set(["__proto__", "constructor", "prototype"]);
const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const num = (v: unknown, fallback: number): number => (typeof v === "number" && Number.isFinite(v) ? v : fallback);
const strings = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);

function mapOf<T>(v: unknown, pick: (x: unknown) => T | undefined): Record<string, T> {
  const out: Record<string, T> = {};
  if (!isObj(v)) return out;
  for (const [k, x] of Object.entries(v)) {
    if (UNSAFE_KEYS.has(k)) continue;
    const picked = pick(x);
    if (picked !== undefined) out[k] = picked;
  }
  return out;
}

function normalizeRecord(x: unknown): ChallengeRecord | undefined {
  if (!isObj(x)) return undefined;
  return {
    stationId: typeof x.stationId === "string" ? x.stationId : "",
    attempts: num(x.attempts, 0), wrong: num(x.wrong, 0), hints: num(x.hints, 0),
    resolved: x.resolved === true, correct: x.correct === true, revealed: x.revealed === true,
    points: num(x.points, 0), timeMs: typeof x.timeMs === "number" && Number.isFinite(x.timeMs) ? x.timeMs : null,
  };
}

const point = (v: unknown, keys: readonly string[]): boolean => isObj(v) && keys.every((k) => typeof v[k] === "number" && Number.isFinite(v[k]));

/** A play state from any app version. Null only when it cannot be played at all (no area). */
export function normalizeState(raw: unknown): PlayState | null {
  if (!isObj(raw) || typeof raw.areaId !== "string") return null;
  const startedAt = num(raw.startedAt, 0);
  const pos = raw.position as { x: number; y: number; z: number; yaw: number };
  const cp = raw.checkpoint as { id: unknown; areaId: unknown; x: number; y: number; z: number };
  return {
    v: 1,
    areaId: raw.areaId,
    position: point(pos, ["x", "y", "z", "yaw"]) ? { x: pos.x, y: pos.y, z: pos.z, yaw: pos.yaw } : null,
    checkpoint: point(cp, ["x", "y", "z"]) && typeof cp.id === "string" && typeof cp.areaId === "string" ? { id: cp.id, areaId: cp.areaId, x: cp.x, y: cp.y, z: cp.z } : null,
    served: mapOf(raw.served, (x) => (typeof x === "string" ? x : undefined)),
    records: mapOf(raw.records, normalizeRecord),
    resolvedStations: mapOf(raw.resolvedStations, (x) => (x === "correct" || x === "revealed" ? x : undefined)),
    collected: strings(raw.collected),
    talked: strings(raw.talked),
    visited: strings(raw.visited),
    openedAt: mapOf(raw.openedAt, (x) => (typeof x === "number" && Number.isFinite(x) ? x : undefined)),
    recent: Array.isArray(raw.recent) ? raw.recent.filter((x): x is "good" | "bad" => x === "good" || x === "bad") : [],
    streak: num(raw.streak, 0),
    hintsUsed: num(raw.hintsUsed, 0),
    score: num(raw.score, 0),
    achievements: strings(raw.achievements),
    missionsDone: strings(raw.missionsDone),
    bossesDefeated: strings(raw.bossesDefeated), // saves from before boss battles do not have it
    finished: raw.finished === true,
    startedAt,
    updatedAt: num(raw.updatedAt, startedAt),
  };
}

const STATUSES = new Set(["ACTIVE", "COMPLETED", "ABANDONED"]);
const posInt = (v: unknown): number => (typeof v === "number" && Number.isInteger(v) && v > 0 ? v : 1);

/** A stored play session from any app version, or null when it is unusable. */
export function normalizeSession(raw: unknown): StoredSession | null {
  if (!isObj(raw) || typeof raw.id !== "string" || typeof raw.gameId !== "string" || typeof raw.status !== "string" || !STATUSES.has(raw.status)) return null;
  const state = normalizeState(raw.state);
  if (!state) return null;
  const startedAt = num(raw.startedAt, state.startedAt);
  return {
    id: raw.id, gameId: raw.gameId, revision: posInt(raw.revision), status: raw.status as StoredSession["status"], state, startedAt,
    finishedAt: typeof raw.finishedAt === "number" && Number.isFinite(raw.finishedAt) ? raw.finishedAt : null,
    updatedAt: num(raw.updatedAt, startedAt),
  };
}

/**
 * A stored game from any app version, or null when it cannot be opened (the structure the app reads without checking is
 * missing). This is a light structural check, not `validateGameSpec`: the spec was validated when it was stored.
 */
export function normalizeGame(raw: unknown): StoredGame | null {
  if (!isObj(raw) || typeof raw.id !== "string" || !isObj(raw.spec)) return null;
  const spec = raw.spec;
  if (!isObj(spec.meta) || !isObj(spec.theme) || !isObj(spec.learning)) return null;
  if (!Array.isArray(spec.areas) || spec.areas.length === 0 || !spec.areas.every(isObj)) return null;
  if (!Array.isArray(spec.missions) || !Array.isArray(spec.challenges)) return null;
  if (!Array.isArray(spec.bosses)) spec.bosses = []; // games from before boss battles
  if (!Array.isArray(spec.mechanics)) spec.mechanics = [];
  const createdAt = num(raw.createdAt, 0);
  return {
    id: raw.id,
    title: typeof raw.title === "string" ? raw.title : typeof spec.meta.title === "string" ? spec.meta.title : "",
    createdAt, updatedAt: num(raw.updatedAt, createdAt), revision: posInt(raw.revision), spec: spec as unknown as GameSpec,
  };
}

// ───────────────────────────── strict checks for untrusted input ─────────────────────────────

const id = z.string().regex(/^[A-Za-z0-9_-]{1,64}$/);
const ms = z.number().finite().nonnegative();
const rec = <T extends z.ZodType>(v: T) => z.record(z.string().max(200), v);

const challengeRecordSchema = z.object({
  stationId: z.string().max(200), attempts: z.number().int().nonnegative(), wrong: z.number().int().nonnegative(), hints: z.number().int().nonnegative(),
  resolved: z.boolean(), correct: z.boolean(), revealed: z.boolean(), points: z.number().finite(), timeMs: z.number().finite().nullable(),
});

const playStateSchema = z.object({
  v: z.literal(1),
  areaId: z.string().max(200),
  position: z.object({ x: z.number().finite(), y: z.number().finite(), z: z.number().finite(), yaw: z.number().finite() }).nullable(),
  checkpoint: z.object({ id: z.string().max(200), areaId: z.string().max(200), x: z.number().finite(), y: z.number().finite(), z: z.number().finite() }).nullable(),
  served: rec(z.string().max(200)),
  records: rec(challengeRecordSchema),
  resolvedStations: rec(z.enum(["correct", "revealed"])),
  collected: z.array(z.string().max(200)).max(5000),
  talked: z.array(z.string().max(200)).max(5000),
  visited: z.array(z.string().max(200)).max(5000),
  openedAt: rec(z.number().finite()),
  recent: z.array(z.enum(["good", "bad"])).max(200),
  streak: z.number().int().nonnegative(),
  hintsUsed: z.number().int().nonnegative(),
  score: z.number().finite(),
  achievements: z.array(z.string().max(200)).max(500),
  missionsDone: z.array(z.string().max(200)).max(500),
  // Boss bonuses already paid out. If this were dropped, the next recompute would pay them a second time.
  bossesDefeated: z.array(z.string().max(200)).max(500),
  finished: z.boolean(),
  startedAt: ms,
  updatedAt: ms,
});

const gameSchema = z.object({
  id, title: z.string().max(300), createdAt: ms, updatedAt: ms.optional(), revision: z.number().int().positive().max(1_000_000),
  spec: z.unknown(), // re-validated with validateGameSpec, never trusted as-is
});

const sessionSchema = z.object({
  id, gameId: id, revision: z.number().int().positive().max(1_000_000), status: z.enum(["ACTIVE", "COMPLETED", "ABANDONED"]),
  state: playStateSchema, startedAt: ms, finishedAt: ms.nullable(), updatedAt: ms.optional(),
});

// (the cloud table accepts: key 1-160 characters, challenge id 1-64, box 1-5; a card outside that would be refused there every round)
const cardSchema = z.object({
  key: z.string().min(1).max(160), gameId: id, challengeId: z.string().min(1).max(64), box: z.number().int().min(1).max(MASTERED_AFTER_BOX), due: ms, added: ms,
  reviews: z.number().int().nonnegative(), updatedAt: ms.optional(), mastered: z.boolean(),
});

/** The cloud table accepts titles of 1-200 characters; a game with another title would be refused there on every round. */
export const cloudTitle = (title: string, spec: { meta: { title: string } }): string => (title.trim() ? title : spec.meta.title || "Game").slice(0, 200);

export interface RejectedGame { id: string; title: string; reason: string }

const tierSchema = z.enum(["A", "B", "C"]);
const rank = (t: FeatureTier) => FEATURE_TIERS.indexOf(t);

/**
 * Validate a spec from outside (backup, cloud) and give back the sanitised copy.
 * `validateGameSpec` strips `meta.generator` and `meta.featureTier` (a model must not set them). A game of this device keeps its
 * honest label, so both are restored from the input when well-formed: the generator unless it claims "ai" (this app has no AI,
 * so that is shown as a demo), the tier only up to what this device is entitled to (anything above it is clamped down).
 */
export function revalidateSpec(input: unknown, deviceTier: FeatureTier = getOfflineTier()): { ok: true; spec: GameSpec } | { ok: false; reason: string } {
  const res = validateGameSpec(input);
  if (!res.ok) return { ok: false, reason: res.errors[0] ?? "invalid game" };
  const meta = isObj(input) && isObj(input.meta) ? input.meta : {};
  const declared = generatorInfoSchema.safeParse(meta.generator);
  if (declared.success && declared.data.kind !== "ai") res.spec.meta.generator = declared.data;
  const tier = tierSchema.safeParse(meta.featureTier);
  if (tier.success && rank(tier.data) <= rank(deviceTier)) {
    res.spec.meta.featureTier = tier.data;
  } else if (tier.success || deviceTier !== "A") {
    const clamped = clampToFeatureTier(res.spec, deviceTier);
    if (!clamped.ok) return { ok: false, reason: clamped.errors[0] ?? "not part of your plan" };
    return { ok: true, spec: clamped.spec };
  }
  return { ok: true, spec: res.spec };
}

/** Validate a game record: schema, then the spec through `revalidateSpec`. */
export function checkGameRecord(input: unknown, deviceTier?: FeatureTier): { ok: true; game: StoredGame } | { ok: false; rejected: RejectedGame } {
  const meta = isObj(input) ? input : {};
  const label = { id: typeof meta.id === "string" ? meta.id.slice(0, 64) : "?", title: typeof meta.title === "string" ? meta.title.slice(0, 80) : "?" };
  const parsed = gameSchema.safeParse(input);
  if (!parsed.success) return { ok: false, rejected: { ...label, reason: "damaged record" } };
  const res = revalidateSpec(parsed.data.spec, deviceTier);
  if (!res.ok) return { ok: false, rejected: { ...label, reason: res.reason } };
  const g = parsed.data;
  return { ok: true, game: { id: g.id, title: cloudTitle(g.title, res.spec), createdAt: g.createdAt, updatedAt: g.updatedAt ?? g.createdAt, revision: g.revision, spec: res.spec } };
}

/**
 * Fields that earlier app versions did not write, filled in with their empty value. Only a field that is absent is filled:
 * a field that is present with the wrong type is damage or tampering and must still fail the strict check.
 */
function upgradeState(raw: unknown): unknown {
  if (!isObj(raw)) return raw;
  const s: Record<string, unknown> = { ...raw };
  const startedAt = typeof s.startedAt === "number" ? s.startedAt : 0;
  const defaults: Record<string, unknown> = {
    v: 1, position: null, checkpoint: null, served: {}, records: {}, resolvedStations: {}, collected: [], talked: [], visited: [], openedAt: {}, recent: [],
    streak: 0, hintsUsed: 0, achievements: [], missionsDone: [], bossesDefeated: [], finished: false, startedAt, updatedAt: startedAt,
  };
  for (const [k, v] of Object.entries(defaults)) if (s[k] === undefined) s[k] = v;
  return s;
}

/** Validate a session record from outside. Fields older versions did not write are filled in first. */
export function checkSessionRecord(input: unknown): StoredSession | null {
  if (!isObj(input)) return null;
  const parsed = sessionSchema.safeParse({ ...input, state: upgradeState(input.state) });
  if (!parsed.success) return null;
  const d = parsed.data;
  return { ...d, state: d.state as PlayState, updatedAt: d.updatedAt ?? d.startedAt };
}

/** A review card from the device's own storage, or null when it has no game/challenge. Numbers that would poison the rest (NaN, wrong box) are repaired. */
export function normalizeCard(raw: unknown, key: string): DeckCard | null {
  if (!isObj(raw) || typeof raw.gameId !== "string" || typeof raw.challengeId !== "string") return null;
  const added = Math.max(0, num(raw.added, 0));
  const box = Math.trunc(num(raw.box, 1));
  return {
    key, gameId: raw.gameId, challengeId: raw.challengeId,
    box: Math.min(MASTERED_AFTER_BOX, Math.max(1, box)), due: Math.max(0, num(raw.due, added)), added,
    reviews: Math.max(0, Math.trunc(num(raw.reviews, 0))), updatedAt: num(raw.updatedAt, added), mastered: raw.mastered === true,
  };
}

export function checkCardRecord(input: unknown): DeckCard | null {
  const parsed = cardSchema.safeParse(input);
  return parsed.success ? { ...parsed.data, updatedAt: parsed.data.updatedAt ?? parsed.data.added } : null;
}
