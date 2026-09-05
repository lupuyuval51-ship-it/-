/**
 * Personal bests + shared metric semantics (direction, value extraction, weighted ratios).
 * Other engines import the helpers from here so that every module reads a result the same way.
 */
import type { ExerciseResult, MetricKey, MetricType, PersonalBest } from "@/lib/types";

export type PbDirection = "higher" | "lower";

export interface PbRule {
  direction: PbDirection;
  metricType: MetricType;
  /** Ratio bests only count when at least this many attempts were made. */
  minAttempts?: number;
}

export const RATIO_MIN_ATTEMPTS = 10;

/** Keys that count as "throw accuracy" when the overall accuracy is computed. */
export const THROW_ACCURACY_KEYS: MetricKey[] = [
  "throw_accuracy", "backhand_accuracy", "forehand_accuracy", "hammer_accuracy", "deep_throw_accuracy", "short_throw_accuracy",
];

/** Keys that count as "catching" when totals are computed. */
export const CATCH_RATIO_KEYS: MetricKey[] = ["catch_pct", "catch_moving_pct", "catch_pressure_pct", "one_hand_catch_pct", "catch_release_pct"];

export const PB_KEYS: Partial<Record<MetricKey, PbRule>> = {
  longest_throw_m: { direction: "higher", metricType: "distance_m" },
  throw_accuracy: { direction: "higher", metricType: "ratio", minAttempts: RATIO_MIN_ATTEMPTS },
  backhand_accuracy: { direction: "higher", metricType: "ratio", minAttempts: RATIO_MIN_ATTEMPTS },
  forehand_accuracy: { direction: "higher", metricType: "ratio", minAttempts: RATIO_MIN_ATTEMPTS },
  hammer_accuracy: { direction: "higher", metricType: "ratio", minAttempts: RATIO_MIN_ATTEMPTS },
  catch_streak: { direction: "higher", metricType: "streak" },
  /** Most throws in a single session. */
  throw_count: { direction: "higher", metricType: "count" },
  sprint_time_s: { direction: "lower", metricType: "time_s" },
  cod_time_s: { direction: "lower", metricType: "time_s" },
  t_drill_time_s: { direction: "lower", metricType: "time_s" },
  course_time_s: { direction: "lower", metricType: "time_s" },
  wing_challenge_score: { direction: "higher", metricType: "score" },
  runner_challenge_score: { direction: "higher", metricType: "score" },
  defender_challenge_score: { direction: "higher", metricType: "score" },
  handler_challenge_score: { direction: "higher", metricType: "score" },
  cutter_challenge_score: { direction: "higher", metricType: "score" },
  hybrid_challenge_score: { direction: "higher", metricType: "score" },
};

export const PB_KEY_LIST = Object.keys(PB_KEYS) as MetricKey[];

/** Direction for any metric key (used by comparisons and readiness). */
export function metricDirection(key: MetricKey, metricType?: MetricType): PbDirection {
  const rule = PB_KEYS[key];
  if (rule) return rule.direction;
  if (metricType === "time_s") return "lower";
  if (key.endsWith("_time_s") || key === "repeat_sprint_drop_pct") return "lower";
  return "higher";
}

/** Percent of a ratio result, computed from successes/attempts when the stored value is missing. */
export function resultPct(r: Pick<ExerciseResult, "successes" | "attempts" | "accuracyPct">): number | undefined {
  if (typeof r.attempts === "number" && r.attempts > 0 && typeof r.successes === "number") {
    return Math.round((Math.min(r.successes, r.attempts) / r.attempts) * 1000) / 10;
  }
  if (typeof r.accuracyPct === "number" && Number.isFinite(r.accuracyPct)) return r.accuracyPct;
  return undefined;
}

/** The single measured value of a result according to its metric type. */
export function resultValue(r: ExerciseResult): number | undefined {
  switch (r.metricType) {
    case "ratio":
      return resultPct(r);
    case "time_s":
      return isNum(r.timeSeconds) ? r.timeSeconds : undefined;
    case "distance_m":
      return isNum(r.distanceMeters) ? r.distanceMeters : undefined;
    case "count":
      return isNum(r.count) ? r.count : isNum(r.throws) ? r.throws : undefined;
    case "streak":
      return isNum(r.streak) ? r.streak : undefined;
    case "rating":
      return isNum(r.rating) ? r.rating : undefined;
    case "score":
      return isNum(r.score) ? r.score : undefined;
    default:
      return undefined;
  }
}

function isNum(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n);
}

export function isBetter(candidate: number, current: number, direction: PbDirection): boolean {
  return direction === "higher" ? candidate > current : candidate < current;
}

/** Weighted accuracy: Σ successes / Σ attempts (never a mean of percentages). */
export function weightedRatio(results: Iterable<Pick<ExerciseResult, "successes" | "attempts" | "accuracyPct">>): { pct?: number; attempts: number; successes: number } {
  let attempts = 0;
  let successes = 0;
  for (const r of results) {
    if (isNum(r.attempts) && r.attempts > 0) {
      attempts += r.attempts;
      if (isNum(r.successes)) successes += Math.min(r.successes, r.attempts);
      else if (isNum(r.accuracyPct)) successes += (r.accuracyPct / 100) * r.attempts;
    }
  }
  if (attempts <= 0) return { attempts: 0, successes: 0 };
  return { pct: Math.round((successes / attempts) * 1000) / 10, attempts, successes: Math.round(successes * 100) / 100 };
}

function live<T extends { deletedAt?: string | null }>(items: T[]): T[] {
  return items.filter((i) => !i.deletedAt);
}

/**
 * Best value per PB key inside one session. Ratios are aggregated Σ/Σ across the session's results
 * for that key and only count with enough attempts; other types take the best single measurement.
 */
export function sessionBestValues(results: ExerciseResult[], session?: { throws: number }): Partial<Record<MetricKey, number>> {
  const byKey = new Map<MetricKey, ExerciseResult[]>();
  for (const r of live(results)) {
    if (!PB_KEYS[r.metricKey]) continue;
    const list = byKey.get(r.metricKey) ?? [];
    list.push(r);
    byKey.set(r.metricKey, list);
  }
  const out: Partial<Record<MetricKey, number>> = {};
  for (const [key, list] of byKey) {
    const rule = PB_KEYS[key]!;
    if (rule.metricType === "ratio") {
      const w = weightedRatio(list);
      if (w.pct !== undefined && w.attempts >= (rule.minAttempts ?? RATIO_MIN_ATTEMPTS)) out[key] = w.pct;
      continue;
    }
    let best: number | undefined;
    for (const r of list) {
      const v = resultValue(r);
      if (v === undefined) continue;
      if (best === undefined || isBetter(v, best, rule.direction)) best = v;
    }
    if (best !== undefined) out[key] = best;
  }
  if (session && isNum(session.throws) && session.throws > 0) {
    const current = out.throw_count;
    if (current === undefined || session.throws > current) out.throw_count = session.throws;
  }
  return out;
}

export interface PersonalBestUpdate {
  all: PersonalBest[];
  updated: PersonalBest[];
  newKeys: MetricKey[];
}

export function updatePersonalBests(
  existing: PersonalBest[],
  results: ExerciseResult[],
  session: { id: string; actualMinutes: number; throws: number },
  now: string,
): PersonalBestUpdate {
  const map = new Map<MetricKey, PersonalBest>();
  for (const pb of live(existing)) map.set(pb.key, pb);
  const bests = sessionBestValues(results, session);
  const updated: PersonalBest[] = [];
  const newKeys: MetricKey[] = [];

  for (const key of Object.keys(bests) as MetricKey[]) {
    const rule = PB_KEYS[key];
    const value = bests[key];
    if (!rule || value === undefined) continue;
    const current = map.get(key);
    if (current && !isBetter(value, current.value, rule.direction)) continue;
    const record: PersonalBest = {
      id: key,
      key,
      value,
      metricType: rule.metricType,
      sessionId: session.id,
      achievedAt: now,
      previousValue: current?.value,
      updatedAt: now,
      deletedAt: null,
    };
    map.set(key, record);
    updated.push(record);
    newKeys.push(key);
  }

  return { all: Array.from(map.values()), updated, newKeys };
}
