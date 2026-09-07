/**
 * Test fixtures: every manifest entry expanded into a minimal but valid Exercise.
 * Engines accept the catalog as a parameter, so unit tests inject these instead of the authored catalog
 * (src/content/exercises/*), which is written separately and may not exist while engine tests run.
 */
import type { Exercise, ExerciseCategory, MetricKey, MetricType, Role, SuccessMetric } from "@/lib/types";
import { EXERCISE_MANIFEST, type ManifestEntry } from "@/content/manifest";

const DURATION_BY_CATEGORY: Record<ExerciseCategory, number> = {
  warmup: 3,
  throwing: 8,
  catching: 6,
  movement: 6,
  defense: 8,
  position: 8,
  game: 8,
  challenge: 5,
  cooldown: 3,
  fitness: 6,
};

const METRIC_TYPE_BY_KEY_SUFFIX: { test: (k: MetricKey) => boolean; type: MetricType }[] = [
  { test: (k) => k.endsWith("_time_s"), type: "time_s" },
  { test: (k) => k === "longest_throw_m", type: "distance_m" },
  { test: (k) => k === "catch_streak" || k === "error_free_streak", type: "streak" },
  { test: (k) => k === "throw_count" || k === "catch_count", type: "count" },
  { test: (k) => k === "confidence_rating", type: "rating" },
  { test: (k) => k.endsWith("_score"), type: "score" },
];

function metricTypeFor(key: MetricKey): MetricType {
  for (const rule of METRIC_TYPE_BY_KEY_SUFFIX) if (rule.test(key)) return rule.type;
  return "ratio";
}

/** Id-specific metric keys (drills whose metric cannot be derived from the skill list alone). */
const KEY_BY_ID: Record<string, MetricKey> = {
  "ch-8-of-10": "throw_accuracy",
  "ch-20-catch-streak": "catch_streak",
  "ct-catch-streak": "catch_streak",
  "ch-5-bh-5-fh": "throw_accuracy",
  "ch-distance-pb": "longest_throw_m",
  "th-distance-max": "longest_throw_m",
  "ch-course-time": "course_time_s",
  "ch-pressure-three": "throw_accuracy",
  "th-target-points": "throw_accuracy",
  "th-alternating-bh-fh": "throw_accuracy",
  "th-quick-release": "quick_release_pct",
  "th-break-throws": "break_throw_pct",
  "th-fake-throw": "fake_score",
  "th-stall-count-throws": "quick_release_pct",
  "mv-short-sprints": "sprint_time_s",
  "mv-acceleration-starts": "sprint_time_s",
  "mv-repeat-sprints": "repeat_sprint_drop_pct",
  "mv-cone-cod": "cod_time_s",
  "mv-t-drill": "t_drill_time_s",
  "mv-side-shuffle": "lateral_shuffle_time_s",
  "mv-forward-backpedal": "agility_time_s",
  "mv-reaction-signal": "reaction_score",
  "mv-stop-and-go": "cod_time_s",
  "mv-pivot-footwork": "pivot_score",
  "mv-ladder-agility": "agility_time_s",
  "mv-endurance-intervals": "endurance_score",
  "gm-catch-release-circuit": "catch_release_pct",
  "gm-throw-after-sprint": "throw_accuracy",
  "gm-error-free-sequence": "error_free_streak",
  "gm-fatigue-accuracy": "throw_accuracy",
  "gm-decision-sim": "decision_score",
  "gm-mini-game": "decision_score",
  "gm-stall-pressure": "quick_release_pct",
  "gm-endzone-drill": "catch_pressure_pct",
  "wg-sideline-runs": "endurance_score",
  "wg-deep-run-timing": "deep_run_success_pct",
  "wg-swing-pass": "swing_pass_pct",
  "wg-catch-and-continue": "catch_release_pct",
  "wg-angle-creation": "separation_score",
  "rn-explosive-cuts": "cod_time_s",
  "rn-deep-sprint-catch": "catch_moving_pct",
  "rn-tempo-change": "separation_score",
  "rn-catch-and-release": "catch_release_pct",
  "rn-read-the-thrower": "cut_timing_score",
  "df-mirror-drill": "mirror_score",
  "df-lateral-defense": "lateral_shuffle_time_s",
  "df-mark-drill": "marking_score",
  "df-recovery-sprint": "recovery_sprint_time_s",
  "df-deny-deep": "marking_score",
  "df-fake-reaction": "reaction_score",
  "hd-give-and-go": "quick_release_pct",
  "hd-pivot-fake-throw": "pivot_score",
  "hd-break-side": "break_throw_pct",
  "hd-two-target-decision": "decision_score",
  "hd-quick-swing": "swing_pass_pct",
  "cu-in-deep-cut": "cut_timing_score",
  "cu-separation": "separation_score",
  "cu-clear-out": "decision_score",
  "cu-cut-timing": "cut_timing_score",
};

const ROLE_CHALLENGE_KEY: Record<Role, MetricKey> = {
  wing: "wing_challenge_score",
  runner: "runner_challenge_score",
  defender: "defender_challenge_score",
  handler: "handler_challenge_score",
  cutter: "cutter_challenge_score",
  hybrid: "hybrid_challenge_score",
  allround: "hybrid_challenge_score",
};

export function metricKeyFor(e: ManifestEntry): MetricKey {
  if (e.id.startsWith("ch-role-")) {
    const role = e.id.slice("ch-role-".length) as Role;
    return ROLE_CHALLENGE_KEY[role] ?? "hybrid_challenge_score";
  }
  const byId = KEY_BY_ID[e.id];
  if (byId) return byId;
  if (e.category === "warmup" || e.category === "cooldown") return "confidence_rating";
  const s = new Set(e.skills);
  if (e.category === "throwing") {
    if (s.has("hammer")) return "hammer_accuracy";
    if (s.has("distance")) return "longest_throw_m";
    if (s.has("forehand") && !s.has("backhand")) return "forehand_accuracy";
    if (s.has("backhand") && !s.has("forehand")) return "backhand_accuracy";
    return "throw_accuracy";
  }
  if (e.category === "catching") {
    if (s.has("catch_moving")) return "catch_moving_pct";
    if (s.has("catch_pressure")) return "catch_pressure_pct";
    if (s.has("one_hand_catch")) return "one_hand_catch_pct";
    return "catch_pct";
  }
  if (e.category === "movement" || e.category === "fitness") {
    if (s.has("speed") || s.has("acceleration")) return "sprint_time_s";
    if (s.has("change_of_direction")) return "cod_time_s";
    if (s.has("endurance")) return "endurance_score";
    if (s.has("mirror")) return "mirror_score";
    if (s.has("reaction")) return "reaction_score";
    if (s.has("pivot")) return "pivot_score";
    return "agility_time_s";
  }
  if (e.category === "defense") {
    if (s.has("mirror")) return "mirror_score";
    if (s.has("marking")) return "marking_score";
    if (s.has("reaction")) return "reaction_score";
    return "marking_score";
  }
  if (s.has("backhand") || s.has("forehand") || s.has("accuracy")) return "throw_accuracy";
  if (s.has("catch_moving")) return "catch_moving_pct";
  if (s.has("decision_making")) return "decision_score";
  return "throw_accuracy";
}

function successMetricFor(e: ManifestEntry): SuccessMetric {
  const key = metricKeyFor(e);
  const type = metricTypeFor(key);
  const metric: SuccessMetric = { type, key, label: { he: `מדד: ${e.he}`, en: `Metric: ${e.en}` } };
  if (type === "ratio") {
    metric.attempts = 10;
    metric.target = 70;
  } else if (type === "rating") {
    metric.target = 4;
  } else if (type === "streak") {
    metric.target = 20;
  } else if (type === "count") {
    metric.target = 40;
  }
  return metric;
}

function isThrowing(e: ManifestEntry): boolean {
  return e.category === "throwing" || e.category === "game" || e.skills.some((s) => s === "backhand" || s === "forehand" || s === "hammer");
}

function isCatching(e: ManifestEntry): boolean {
  return e.category === "catching" || e.skills.some((s) => s === "catching" || s === "catch_moving" || s === "catch_pressure" || s === "one_hand_catch");
}

/** Expand a manifest entry into a minimal but valid Exercise (generic but non-empty text). */
export function manifestToExercise(e: ManifestEntry): Exercise {
  const duration = DURATION_BY_CATEGORY[e.category];
  const throwing = isThrowing(e);
  const catching = isCatching(e);
  return {
    id: e.id,
    name: { he: e.he, en: e.en },
    category: e.category,
    skills: e.skills,
    roles: e.roles,
    levels: e.levels,
    phases: e.phases,
    goal: { he: `תרגול ${e.he}.`, en: `Practice ${e.en}.` },
    participants: e.participants,
    equipment: e.equipment,
    fieldSizes: ["small", "medium", "large", "indoor", "park", "beach", "yard"],
    intensity: e.intensity,
    offenseDefense: e.category === "defense" ? "defense" : "offense",
    wind: "any",
    ageGroups: ["kid", "teen", "adult", "senior"],
    durationMinutes: duration,
    minDurationMinutes: Math.max(1, duration - 2),
    maxDurationMinutes: duration + 6,
    sets: 3,
    reps: 10,
    restSeconds: 45,
    setup: { he: `הכנה ל${e.he}: סמנו את האזור והתחילו בקצב נוח.`, en: `Setup for ${e.en}: mark the area and start at an easy pace.` },
    instructions: [
      { he: `בצעו ${e.he} לפי ההנחיות.`, en: `Perform ${e.en} as described.` },
      { he: "רשמו את התוצאה בסיום.", en: "Log the result when done." },
    ],
    cues: [{ he: "תנועה נשלטת ונשימה רגועה.", en: "Controlled movement, relaxed breathing." }],
    commonMistakes: [{ he: "מהירות על חשבון טכניקה.", en: "Speed at the expense of technique." }],
    successMetric: successMetricFor(e),
    easierVersion: { he: "הקטינו את המרחק או את הקצב.", en: "Reduce the distance or the pace." },
    harderVersion: { he: "הגדילו את המרחק או קצרו את המנוחה.", en: "Increase the distance or shorten the rest." },
    soloAlternative: { he: "ניתן לבצע לבד עם כמה דיסקים.", en: "Can be done alone with a few discs." },
    partnerAlternative: { he: "השותף מחזיר את הדיסק וסופר.", en: "The partner returns the disc and counts." },
    safetyNotes: [{ he: "ודאו שהשטח פנוי.", en: "Make sure the area is clear." }],
    diagram: { field: "lane", items: [{ type: "player", x: 20, y: 50 }, { type: "cone", x: 80, y: 50 }] },
    throwsPerSet: throwing ? 10 : 0,
    catchesPerSet: catching ? 10 : 0,
  };
}

export const MANIFEST_EXERCISES: Exercise[] = EXERCISE_MANIFEST.map(manifestToExercise);

export const MANIFEST_EXERCISE_MAP: Record<string, Exercise> = Object.fromEntries(MANIFEST_EXERCISES.map((e) => [e.id, e]));

export function getFixtureExercise(id: string): Exercise | undefined {
  return MANIFEST_EXERCISE_MAP[id];
}
