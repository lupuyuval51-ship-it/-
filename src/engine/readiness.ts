/**
 * Role readiness. Each role has a fixed list of measured components; a score is the weighted mean of
 * the components that actually have data (recency-weighted average of the last 5 measurements),
 * and is null when fewer than 2 components have data. Nothing is estimated for missing components.
 */
import type { AgeGroup, CompletedSession, ExerciseResult, Level, Localized, MetricKey, PersonalBest, Profile, Role } from "@/lib/types";
import { ROLE_LABELS } from "@/lib/types";
import { METRIC_LABELS } from "@/engine/stats";
import { resultValue } from "@/engine/personalBests";

export interface ReadinessComponent {
  key: MetricKey;
  label: Localized;
  /** Raw measured value (recency-weighted mean of the last 5 measurements). */
  value?: number;
  /** 0–100 after normalisation. */
  normalized?: number;
  weight: number;
  hasData: boolean;
  /** How many measurements contributed. */
  samples: number;
}

export interface RoleReadiness {
  score: number | null;
  components: ReadinessComponent[];
  explanation: Localized;
}

export type ReadinessMap = Record<Role | "overall", RoleReadiness>;

export interface ReadinessInput {
  results: ExerciseResult[];
  completedSessions: CompletedSession[];
  personalBests: PersonalBest[];
  profile?: Pick<Profile, "level" | "ageGroup">;
}

export const BASE_ROLES: Role[] = ["wing", "runner", "defender", "handler", "cutter"];
export const MIN_COMPONENTS_WITH_DATA = 2;
export const READINESS_SAMPLES = 5;

/** Component lists per role. The runner's speed and acceleration are both measured by the 20 m sprint. */
export const ROLE_COMPONENTS: Record<Exclude<Role, "hybrid" | "allround">, { key: MetricKey; weight: number }[]> = {
  wing: [
    { key: "catch_moving_pct", weight: 0.25 },
    { key: "deep_run_success_pct", weight: 0.2 },
    { key: "cod_time_s", weight: 0.2 },
    { key: "endurance_score", weight: 0.15 },
    { key: "swing_pass_pct", weight: 0.2 },
  ],
  runner: [
    { key: "sprint_time_s", weight: 0.3 },
    { key: "catch_moving_pct", weight: 0.25 },
    { key: "cod_time_s", weight: 0.25 },
    { key: "repeat_sprint_drop_pct", weight: 0.2 },
  ],
  defender: [
    { key: "mirror_score", weight: 0.25 },
    { key: "reaction_score", weight: 0.2 },
    { key: "lateral_shuffle_time_s", weight: 0.2 },
    { key: "recovery_sprint_time_s", weight: 0.15 },
    { key: "marking_score", weight: 0.2 },
  ],
  handler: [
    { key: "backhand_accuracy", weight: 0.25 },
    { key: "forehand_accuracy", weight: 0.25 },
    { key: "break_throw_pct", weight: 0.2 },
    { key: "pivot_score", weight: 0.15 },
    { key: "decision_score", weight: 0.15 },
  ],
  cutter: [
    { key: "cut_timing_score", weight: 0.25 },
    { key: "cod_time_s", weight: 0.2 },
    { key: "catch_moving_pct", weight: 0.2 },
    { key: "separation_score", weight: 0.2 },
    { key: "catch_release_pct", weight: 0.15 },
  ],
};

/** Time metrics: `best` seconds → 100, `worst` seconds → 0, linear in between (adult, intermediate). */
export const TIME_RANGES: Partial<Record<MetricKey, { best: number; worst: number }>> = {
  sprint_time_s: { best: 2.8, worst: 5.0 },
  cod_time_s: { best: 4.2, worst: 7.5 },
  lateral_shuffle_time_s: { best: 6.0, worst: 12.0 },
  recovery_sprint_time_s: { best: 3.0, worst: 6.0 },
  t_drill_time_s: { best: 8.5, worst: 14.0 },
  agility_time_s: { best: 10.0, worst: 20.0 },
  course_time_s: { best: 20.0, worst: 60.0 },
};

/** Lower-is-better percentages: `best` → 100, `worst` → 0. */
const LOWER_PCT_RANGES: Partial<Record<MetricKey, { best: number; worst: number }>> = {
  repeat_sprint_drop_pct: { best: 0, worst: 25 },
};

const AGE_ALLOWANCE: Record<AgeGroup, number> = { kid: 1.25, teen: 1.1, adult: 1.0, senior: 1.15 };
const LEVEL_ALLOWANCE: Record<Level, number> = { beginner: 1.1, intermediate: 1.0, advanced: 0.95 };

function clamp100(n: number): number {
  return Math.min(100, Math.max(0, n));
}

export function timeAllowance(profile?: Pick<Profile, "level" | "ageGroup">): number {
  const age = profile?.ageGroup ? AGE_ALLOWANCE[profile.ageGroup] ?? 1 : 1;
  const level = profile?.level ? LEVEL_ALLOWANCE[profile.level] ?? 1 : 1;
  return age * level;
}

/** Normalise a raw measurement to 0–100 for the given key. */
export function normalizeMetric(key: MetricKey, value: number, profile?: Pick<Profile, "level" | "ageGroup">): number {
  const time = TIME_RANGES[key];
  if (time) {
    const f = timeAllowance(profile);
    const bestT = time.best * f;
    const worstT = time.worst * f;
    return Math.round(clamp100(((worstT - value) / (worstT - bestT)) * 100));
  }
  const lower = LOWER_PCT_RANGES[key];
  if (lower) return Math.round(clamp100(((lower.worst - value) / (lower.worst - lower.best)) * 100));
  // percentages and 0–100 scores are used as they are
  return Math.round(clamp100(value));
}

/** Recency-weighted mean of the last N measurements for a key (most recent weighs most). */
export function recentMeasurement(results: ExerciseResult[], key: MetricKey, samples = READINESS_SAMPLES): { value: number; samples: number } | undefined {
  const measured = results
    .filter((r) => !r.deletedAt && r.metricKey === key)
    .map((r) => ({ at: r.recordedAt, value: resultValue(r) }))
    .filter((m): m is { at: string; value: number } => m.value !== undefined)
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, samples);
  if (measured.length === 0) return undefined;
  let weightSum = 0;
  let acc = 0;
  measured.forEach((m, i) => {
    const w = measured.length - i;
    weightSum += w;
    acc += m.value * w;
  });
  return { value: Math.round((acc / weightSum) * 100) / 100, samples: measured.length };
}

function roleName(role: Role): Localized {
  return ROLE_LABELS[role];
}

function buildRole(role: Exclude<Role, "hybrid" | "allround">, results: ExerciseResult[], profile?: Pick<Profile, "level" | "ageGroup">): RoleReadiness {
  const components: ReadinessComponent[] = ROLE_COMPONENTS[role].map((c) => {
    const m = recentMeasurement(results, c.key);
    const comp: ReadinessComponent = { key: c.key, label: METRIC_LABELS[c.key], weight: c.weight, hasData: !!m, samples: m?.samples ?? 0 };
    if (m) {
      comp.value = m.value;
      comp.normalized = normalizeMetric(c.key, m.value, profile);
    }
    return comp;
  });
  const withData = components.filter((c) => c.hasData && c.normalized !== undefined);
  const n = components.length;
  const name = roleName(role);
  if (withData.length < MIN_COMPONENTS_WITH_DATA) {
    return {
      score: null,
      components,
      explanation: {
        he: `עדיין אין מספיק מדידות לתפקיד ${name.he}: נמדדו ${withData.length} מתוך ${n} מדדים, ונדרשים לפחות ${MIN_COMPONENTS_WITH_DATA}. תרגילי התפקיד ימלאו אותם.`,
        en: `Not enough measurements yet for ${name.en}: ${withData.length} of ${n} components measured, at least ${MIN_COMPONENTS_WITH_DATA} needed. Role drills fill them in.`,
      },
    };
  }
  const weightSum = withData.reduce((s, c) => s + c.weight, 0);
  const score = Math.round(withData.reduce((s, c) => s + c.normalized! * c.weight, 0) / weightSum);
  return {
    score,
    components,
    explanation: {
      he: `מבוסס על ${withData.length} מתוך ${n} מדדים שנמדדו בפועל (ממוצע משוקלל של עד ${READINESS_SAMPLES} המדידות האחרונות).`,
      en: `Based on ${withData.length} of ${n} measured components (weighted average of up to the last ${READINESS_SAMPLES} measurements).`,
    },
  };
}

function averageOfRoles(base: Record<string, RoleReadiness>, weighted: boolean): { score: number | null; used: Role[] } {
  let acc = 0;
  let weightSum = 0;
  const used: Role[] = [];
  for (const role of BASE_ROLES) {
    const r = base[role];
    if (r.score === null) continue;
    const w = weighted ? r.components.filter((c) => c.hasData).length : 1;
    acc += r.score * w;
    weightSum += w;
    used.push(role);
  }
  if (used.length === 0) return { score: null, used };
  return { score: Math.round(acc / weightSum), used };
}

function unionComponents(base: Record<string, RoleReadiness>): ReadinessComponent[] {
  const seen = new Map<MetricKey, ReadinessComponent>();
  for (const role of BASE_ROLES) {
    for (const c of base[role].components) {
      if (!seen.has(c.key)) seen.set(c.key, { ...c, weight: 1 });
    }
  }
  const list = Array.from(seen.values());
  const w = list.length > 0 ? Math.round((1 / list.length) * 1000) / 1000 : 0;
  return list.map((c) => ({ ...c, weight: w }));
}

function compositeExplanation(used: Role[], he: string, en: string): Localized {
  if (used.length === 0) {
    return {
      he: "עדיין אין ציון לאף תפקיד – השלימו תרגילי תפקיד ורשמו תוצאות כדי לקבל ציון.",
      en: "No role has a score yet – complete role drills and log results to get one.",
    };
  }
  return {
    he: `${he} ${used.map((r) => ROLE_LABELS[r].he).join(", ")}.`,
    en: `${en} ${used.map((r) => ROLE_LABELS[r].en).join(", ")}.`,
  };
}

export function computeReadiness(input: ReadinessInput): ReadinessMap {
  const results = input.results.filter((r) => !r.deletedAt);
  const base: Record<string, RoleReadiness> = {};
  for (const role of BASE_ROLES) base[role] = buildRole(role as Exclude<Role, "hybrid" | "allround">, results, input.profile);

  const hybrid = averageOfRoles(base, false);
  const hybridReadiness: RoleReadiness = {
    score: hybrid.score,
    components: unionComponents(base),
    explanation: compositeExplanation(hybrid.used, "ממוצע ציוני התפקידים שיש להם נתונים:", "Average of the roles that have data:"),
  };
  const overall = averageOfRoles(base, true);
  const overallReadiness: RoleReadiness = {
    score: overall.score,
    components: unionComponents(base),
    explanation: compositeExplanation(overall.used, "ממוצע משוקלל לפי כמות המדידות של התפקידים:", "Weighted by the number of measurements per role:"),
  };

  return {
    wing: base.wing,
    runner: base.runner,
    defender: base.defender,
    handler: base.handler,
    cutter: base.cutter,
    hybrid: hybridReadiness,
    allround: { ...hybridReadiness },
    overall: overallReadiness,
  };
}

/** Compact map of numeric scores only (for the coach context). */
export function readinessScores(map: ReadinessMap): Partial<Record<Role, number>> {
  const out: Partial<Record<Role, number>> = {};
  for (const role of Object.keys(map) as (Role | "overall")[]) {
    if (role === "overall") continue;
    const score = map[role].score;
    if (score !== null) out[role] = score;
  }
  return out;
}
