/**
 * Daily / weekly challenges. Picking is deterministic per day (or week) and role; progress is derived
 * only from completed sessions and their logged results.
 */
import type { ChallengeDefinition, CompletedSession, ExerciseResult, MetricKey, Profile, Role, UserChallenge } from "@/lib/types";
import { CHALLENGES } from "@/content/challenges";
import { toDateKey, weekKey } from "@/lib/dates";
import { RATIO_MIN_ATTEMPTS, THROW_ACCURACY_KEYS, isBetter, metricDirection, resultValue, weightedRatio } from "@/engine/personalBests";
import { roleChallengeKey } from "@/engine/achievements";

export type ActiveChallenge = UserChallenge & { def: ChallengeDefinition };

export type ChallengeProfile = Pick<Profile, "primaryRole" | "secondaryRole"> | null | undefined;

export const WEEKLY_CHALLENGE_COUNT = 3;
/** Always part of the weekly set when defined. */
export const WEEKLY_ANCHOR_ID = "wk-sessions-3";

/** Skills whose logged attempts count as throws for `throws` challenges. */
const THROW_SKILLS = new Set(["backhand", "forehand", "hammer", "deep_throws", "short_throws", "accuracy", "distance", "release_speed", "break_throws"]);

function live<T extends { deletedAt?: string | null }>(items: T[]): T[] {
  return items.filter((i) => !i.deletedAt);
}

/** Small deterministic string hash (FNV-1a, 32-bit). */
export function hashString(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

export function userChallengeId(definitionId: string, periodKey: string): string {
  return `${definitionId}:${periodKey}`;
}

export function challengeTarget(def: ChallengeDefinition): number {
  const m = def.metric;
  switch (m.kind) {
    case "metric":
    case "throws":
    case "catch_streak":
    case "sessions":
      return m.target;
    default:
      return 1;
  }
}

export function isChallengeForRole(def: ChallengeDefinition, profile: ChallengeProfile): boolean {
  if (!def.roles || def.roles.length === 0) return true;
  if (!profile) return true;
  return def.roles.includes(profile.primaryRole) || (!!profile.secondaryRole && def.roles.includes(profile.secondaryRole));
}

function eligible(defs: ChallengeDefinition[], period: "daily" | "weekly", profile: ChallengeProfile): ChallengeDefinition[] {
  const all = defs.filter((d) => d.period === period);
  const forRole = all.filter((d) => isChallengeForRole(d, profile));
  return (forRole.length > 0 ? forRole : all).slice().sort((a, b) => a.id.localeCompare(b.id));
}

function roleKey(profile: ChallengeProfile): string {
  return profile ? `${profile.primaryRole}/${profile.secondaryRole ?? ""}` : "none";
}

function previousDayKey(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const prev = new Date(y, (m ?? 1) - 1, (d ?? 1) - 1);
  return toDateKey(prev);
}

/**
 * Deterministic daily pick for a date and role. The pick differs from the previous day's pick whenever
 * more than one challenge is eligible, so the same challenge never repeats two days in a row.
 */
export function pickDailyChallenge(defs: ChallengeDefinition[], profile: ChallengeProfile, dateKey: string, seed = ""): ChallengeDefinition {
  const list = eligible(defs, "daily", profile);
  if (list.length === 0) throw new Error("pickDailyChallenge: no daily challenge definitions");
  const idx = (key: string) => hashString(`${key}|${roleKey(profile)}|${seed}`) % list.length;
  let today = idx(dateKey);
  if (list.length > 1 && today === idx(previousDayKey(dateKey))) today = (today + 1) % list.length;
  return list[today];
}

/** Deterministic weekly set: the anchor challenge plus role-relevant picks, up to `count`. */
export function pickWeeklyChallenges(defs: ChallengeDefinition[], profile: ChallengeProfile, periodKey: string, seed = "", count = WEEKLY_CHALLENGE_COUNT): ChallengeDefinition[] {
  const list = eligible(defs, "weekly", profile);
  if (list.length === 0) return [];
  const out: ChallengeDefinition[] = [];
  const anchor = list.find((d) => d.id === WEEKLY_ANCHOR_ID);
  if (anchor) out.push(anchor);
  const rest = list.filter((d) => d !== anchor);
  // Stable shuffle by hash, then take the first ones.
  const ranked = rest
    .map((d) => ({ d, h: hashString(`${periodKey}|${roleKey(profile)}|${seed}|${d.id}`) }))
    .sort((a, b) => a.h - b.h || a.d.id.localeCompare(b.d.id))
    .map((x) => x.d);
  for (const d of ranked) {
    if (out.length >= count) break;
    out.push(d);
  }
  return out;
}

function newRecord(def: ChallengeDefinition, periodKey: string, now: string): UserChallenge {
  return {
    id: userChallengeId(def.id, periodKey),
    definitionId: def.id,
    period: def.period,
    periodKey,
    progress: 0,
    target: challengeTarget(def),
    completed: false,
    updatedAt: now,
    deletedAt: null,
  };
}

export interface ActiveChallenges {
  daily: ActiveChallenge;
  weekly: ActiveChallenge[];
  /** Records created by this call (not yet persisted) – upsert them into the store. */
  created: UserChallenge[];
}

/**
 * Today's daily challenge and this week's weekly challenges, creating the missing UserChallenge records.
 * Existing records for the current period are always honoured (even when the pick would differ now).
 */
export function activeChallenges(defs: ChallengeDefinition[], userChallenges: UserChallenge[], profile: ChallengeProfile, now: Date, seed = ""): ActiveChallenges {
  const nowIso = now.toISOString();
  const dayKey = toDateKey(now);
  const wKey = weekKey(now);
  const byId = new Map(defs.map((d) => [d.id, d]));
  const existing = live(userChallenges);
  const created: UserChallenge[] = [];

  let daily: ActiveChallenge | undefined;
  for (const uc of existing) {
    if (uc.period !== "daily" || uc.periodKey !== dayKey) continue;
    const def = byId.get(uc.definitionId);
    if (!def) continue;
    if (!daily || (uc.completed && !daily.completed)) daily = { ...uc, def };
  }
  if (!daily) {
    const def = pickDailyChallenge(defs, profile, dayKey, seed);
    const record = newRecord(def, dayKey, nowIso);
    created.push(record);
    daily = { ...record, def };
  }

  const weekly: ActiveChallenge[] = [];
  const seen = new Set<string>();
  for (const uc of existing) {
    if (uc.period !== "weekly" || uc.periodKey !== wKey) continue;
    const def = byId.get(uc.definitionId);
    if (!def || seen.has(def.id)) continue;
    seen.add(def.id);
    weekly.push({ ...uc, def });
  }
  if (weekly.length < WEEKLY_CHALLENGE_COUNT) {
    for (const def of pickWeeklyChallenges(defs, profile, wKey, seed)) {
      if (weekly.length >= WEEKLY_CHALLENGE_COUNT) break;
      if (seen.has(def.id)) continue;
      seen.add(def.id);
      const record = newRecord(def, wKey, nowIso);
      created.push(record);
      weekly.push({ ...record, def });
    }
  }
  weekly.sort((a, b) => a.definitionId.localeCompare(b.definitionId));
  return { daily, weekly, created };
}

/* ------------------------------------------------------------------ */
/* Progress                                                            */
/* ------------------------------------------------------------------ */

function sessionDate(s: CompletedSession): string {
  const d = new Date(s.completedAt || s.startedAt);
  return Number.isNaN(d.getTime()) ? "1970-01-01" : toDateKey(d);
}

function inPeriod(uc: UserChallenge, session: CompletedSession): boolean {
  const date = sessionDate(session);
  if (uc.period === "daily") return uc.periodKey === date;
  return uc.periodKey === weekKey(new Date(`${date}T12:00:00`));
}

function throwsOf(r: ExerciseResult): number {
  if (typeof r.throws === "number" && r.throws > 0) return r.throws;
  if (r.metricKey === "throw_count" && typeof r.count === "number") return Math.max(0, r.count);
  const throwing = THROW_ACCURACY_KEYS.includes(r.metricKey) || (r.skills ?? []).some((s) => THROW_SKILLS.has(s));
  if (throwing && typeof r.attempts === "number" && r.attempts > 0) return r.attempts;
  return 0;
}

/** Best value of a metric key in this session (ratio keys are aggregated Σ/Σ and need enough attempts). */
function sessionMetricValue(key: MetricKey, session: CompletedSession, results: ExerciseResult[]): number | undefined {
  const keys = key === "throw_accuracy" ? THROW_ACCURACY_KEYS : [key];
  const matching = results.filter((r) => keys.includes(r.metricKey));
  const direction = metricDirection(key);
  let best: number | undefined;
  const ratios = matching.filter((r) => r.metricType === "ratio");
  if (ratios.length > 0) {
    // Any single drill result with enough attempts counts (e.g. 8 of 10 in one drill).
    for (const r of ratios) {
      if (typeof r.attempts !== "number" || r.attempts < RATIO_MIN_ATTEMPTS) continue;
      const v = resultValue(r);
      if (v !== undefined && (best === undefined || isBetter(v, best, direction))) best = v;
    }
    const w = weightedRatio(ratios);
    if (w.pct !== undefined && w.attempts >= RATIO_MIN_ATTEMPTS && (best === undefined || isBetter(w.pct, best, direction))) best = w.pct;
  }
  for (const r of matching) {
    if (r.metricType === "ratio") continue;
    const v = resultValue(r);
    if (v !== undefined && (best === undefined || isBetter(v, best, direction))) best = v;
  }
  if (best === undefined) {
    const stored = session.roleMetrics?.[key];
    if (typeof stored === "number" && Number.isFinite(stored)) best = stored;
  }
  return best;
}

export interface ChallengeContribution {
  /** How the value combines with the stored progress. */
  mode: "add" | "max" | "min" | "flag";
  value: number;
}

/** What one completed session contributes towards a challenge definition. */
export function sessionChallengeContribution(def: ChallengeDefinition, session: CompletedSession, results: ExerciseResult[]): ChallengeContribution {
  const m = def.metric;
  const rs = live(results).filter((r) => r.sessionId === session.id);
  switch (m.kind) {
    case "metric": {
      const v = sessionMetricValue(m.key, session, rs);
      return { mode: m.comparison === "lte" ? "min" : "max", value: v ?? 0 };
    }
    case "throws": {
      if (!m.skill) return { mode: "add", value: Math.max(0, session.throws || 0) };
      const skill = m.skill;
      return { mode: "add", value: rs.filter((r) => (r.skills ?? []).includes(skill)).reduce((sum, r) => sum + throwsOf(r), 0) };
    }
    case "catch_streak": {
      let best = 0;
      for (const r of rs) {
        if (r.metricKey !== "catch_streak") continue;
        const v = resultValue(r);
        if (v !== undefined) best = Math.max(best, v);
      }
      return { mode: "max", value: best };
    }
    case "sessions": {
      const ok = (session.actualMinutes || 0) >= (m.minMinutes ?? 0);
      return { mode: "add", value: ok ? 1 : 0 };
    }
    case "exercise":
      return { mode: "flag", value: rs.some((r) => r.exerciseId === m.exerciseId) ? 1 : 0 };
    case "personal_best":
      return { mode: "flag", value: (session.newPersonalBestKeys ?? []).includes(m.key) ? 1 : 0 };
    case "role_challenge": {
      const any = m.role === "allround" || m.role === "hybrid";
      const done = rs.some((r) => {
        if (any) return r.metricKey.endsWith("_challenge_score") ? resultValue(r) !== undefined : !!r.exerciseId && r.exerciseId.startsWith("ch-role-");
        return (r.metricKey === roleChallengeKey(m.role) && resultValue(r) !== undefined) || r.exerciseId === `ch-role-${m.role}`;
      });
      return { mode: "flag", value: done ? 1 : 0 };
    }
    default:
      return { mode: "flag", value: 0 };
  }
}

function combine(prev: number, c: ChallengeContribution): number {
  switch (c.mode) {
    case "add":
      return prev + c.value;
    case "max":
      return Math.max(prev, c.value);
    case "min":
      if (c.value <= 0) return prev;
      return prev <= 0 ? c.value : Math.min(prev, c.value);
    case "flag":
      return Math.max(prev, c.value > 0 ? 1 : 0);
    default:
      return prev;
  }
}

function isDone(def: ChallengeDefinition, progress: number, target: number): boolean {
  const m = def.metric;
  if (m.kind === "metric" && m.comparison === "lte") return progress > 0 && progress <= target;
  return progress >= target;
}

export interface ChallengeApplyResult {
  /** Records whose progress changed (already stamped; upsert them). */
  updated: UserChallenge[];
  /** Subset of `updated` that became completed by this session. */
  completedNow: UserChallenge[];
}

/** Apply one completed session to the active challenge records. Sessions outside a record's period are ignored. */
export function applySessionToChallenges(
  active: UserChallenge[],
  defs: ChallengeDefinition[],
  session: CompletedSession,
  results: ExerciseResult[],
  now: string = session.completedAt,
): ChallengeApplyResult {
  const byId = new Map(defs.map((d) => [d.id, d]));
  const updated: UserChallenge[] = [];
  const completedNow: UserChallenge[] = [];
  for (const uc of live(active)) {
    if (uc.completed) continue;
    const def = byId.get(uc.definitionId);
    if (!def || !inPeriod(uc, session)) continue;
    const c = sessionChallengeContribution(def, session, results);
    const target = uc.target > 0 ? uc.target : challengeTarget(def);
    const progress = combine(uc.progress || 0, c);
    if (progress === (uc.progress || 0)) continue;
    const done = isDone(def, progress, target);
    const next: UserChallenge = { ...uc, progress, target, completed: done, updatedAt: now };
    if (done) {
      next.completedAt = now;
      completedNow.push(next);
    }
    updated.push(next);
  }
  return { updated, completedNow };
}

export { CHALLENGES as DEFAULT_CHALLENGES };
