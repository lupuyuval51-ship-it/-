/**
 * Onboarding baseline test: the protocol (which drills to run, in order), a non-judgemental summary of the
 * measurements, and goal hints for the first plan. Wording never labels the player – it describes what was
 * measured and what the first weeks will focus on.
 */
import type { BaselineTest, ExerciseResult, Goal, Locale, Localized, MetricKey, Role, Skill } from "@/lib/types";
import { ROLE_LABELS } from "@/lib/types";
import { resultValue } from "@/engine/personalBests";

export type BaselineStepKind = "exercise" | "role_challenge" | "confidence";
export type ConfidenceKey = keyof NonNullable<BaselineTest["confidence"]>;

export interface BaselineStep {
  id: string;
  kind: BaselineStepKind;
  /** Catalog exercise id (exercise / role_challenge steps). */
  exerciseId?: string;
  /** Metric the step records. */
  metricKey?: MetricKey;
  /** Throw types rated in a confidence step (1–5 each). */
  confidenceKeys?: ConfidenceKey[];
  title: Localized;
  hint: Localized;
  /** Approximate minutes for the step. */
  minutes: number;
}

export const ROLE_CHALLENGE_EXERCISE: Record<Role, string> = {
  wing: "ch-role-wing",
  runner: "ch-role-runner",
  defender: "ch-role-defender",
  handler: "ch-role-handler",
  cutter: "ch-role-cutter",
  hybrid: "ch-role-hybrid",
  allround: "ch-role-hybrid",
};

export const ROLE_CHALLENGE_METRIC: Record<Role, MetricKey> = {
  wing: "wing_challenge_score",
  runner: "runner_challenge_score",
  defender: "defender_challenge_score",
  handler: "handler_challenge_score",
  cutter: "cutter_challenge_score",
  hybrid: "hybrid_challenge_score",
  allround: "hybrid_challenge_score",
};

export const CONFIDENCE_KEYS: ConfidenceKey[] = ["backhand", "forehand", "hammer", "deep", "short"];

const COMMON_STEPS: BaselineStep[] = [
  {
    id: "bh",
    kind: "exercise",
    exerciseId: "bh-short-gate",
    metricKey: "backhand_accuracy",
    title: { he: "Backhand דרך שער", en: "Backhand gate" },
    hint: { he: "10 זריקות Backhand דרך שער ברוחב 2 מ׳ ממרחק 10 מ׳. ספרו כמה עברו.", en: "10 backhands through a 2 m gate from 10 m. Count how many passed." },
    minutes: 4,
  },
  {
    id: "fh",
    kind: "exercise",
    exerciseId: "fh-short-gate",
    metricKey: "forehand_accuracy",
    title: { he: "Forehand דרך שער", en: "Forehand gate" },
    hint: { he: "10 זריקות Forehand דרך אותו שער. ספרו כמה עברו.", en: "10 forehands through the same gate. Count how many passed." },
    minutes: 4,
  },
  {
    id: "target",
    kind: "exercise",
    exerciseId: "th-target-points",
    metricKey: "throw_accuracy",
    title: { he: "זריקה לנקודות מטרה", en: "Target-point throws" },
    hint: { he: "10 זריקות למטרה במרחק בינוני, כל סוג זריקה שנוח לכם.", en: "10 throws at a mid-range target, any throw you're comfortable with." },
    minutes: 4,
  },
  {
    id: "distance",
    kind: "exercise",
    exerciseId: "th-distance-max",
    metricKey: "longest_throw_m",
    title: { he: "מדידת זריקה ארוכה", en: "Max-distance throw" },
    hint: { he: "3 זריקות מלאות אחרי חימום. רשמו את הארוכה ביותר במטרים.", en: "3 full throws after warming up. Log the longest in metres." },
    minutes: 4,
  },
  {
    id: "catch",
    kind: "exercise",
    exerciseId: "ct-catch-streak",
    metricKey: "catch_streak",
    title: { he: "רצף תפיסות", en: "Catch streak" },
    hint: { he: "תפיסות רצופות (לבד: זריקה עצמית או קיר). רשמו את הרצף הארוך ביותר.", en: "Consecutive catches (solo: self-toss or wall). Log the longest streak." },
    minutes: 4,
  },
  {
    id: "sprint",
    kind: "exercise",
    exerciseId: "mv-short-sprints",
    metricKey: "sprint_time_s",
    title: { he: "ספרינט 20 מ׳", en: "20 m sprint" },
    hint: { he: "2 ספרינטים של 20 מ׳ עם מנוחה מלאה. רשמו את הזמן הטוב יותר.", en: "Two 20 m sprints with full rest. Log the better time." },
    minutes: 4,
  },
  {
    id: "cod",
    kind: "exercise",
    exerciseId: "mv-cone-cod",
    metricKey: "cod_time_s",
    title: { he: "שינוי כיוון 5-10-5", en: "5-10-5 change of direction" },
    hint: { he: "מסלול 5-10-5 בין קונוסים. רשמו את הזמן.", en: "5-10-5 between cones. Log the time." },
    minutes: 4,
  },
];

const CONFIDENCE_STEP: BaselineStep = {
  id: "confidence",
  kind: "confidence",
  confidenceKeys: CONFIDENCE_KEYS,
  title: { he: "כמה בטוח מרגיש לכם כל סוג זריקה?", en: "How confident does each throw feel?" },
  hint: { he: "דרגו 1–5: Backhand, Forehand, Hammer, זריקות עומק וזריקות קצרות. אין תשובה נכונה.", en: "Rate 1–5: backhand, forehand, hammer, deep throws and short throws. There is no right answer." },
  minutes: 1,
};

function roleStep(role: Role): BaselineStep {
  const label = ROLE_LABELS[role];
  return {
    id: "role",
    kind: "role_challenge",
    exerciseId: ROLE_CHALLENGE_EXERCISE[role],
    metricKey: ROLE_CHALLENGE_METRIC[role],
    title: { he: `אתגר ${label.he}`, en: `${label.en} challenge` },
    hint: { he: "גרסה קצרה של אתגר התפקיד. הציון הוא נקודת הפתיחה שלכם, לא ציון סופי.", en: "A short version of the role challenge. The score is your starting point, not a verdict." },
    minutes: 6,
  };
}

/** Protocol definition: common steps, the per-role challenge and the confidence ratings. */
export const BASELINE_PROTOCOL = {
  commonSteps: COMMON_STEPS,
  roleChallengeExerciseIds: ROLE_CHALLENGE_EXERCISE,
  roleChallengeMetrics: ROLE_CHALLENGE_METRIC,
  confidenceStep: CONFIDENCE_STEP,
  /** Every exercise id the protocol can reference. */
  exerciseIds: [...COMMON_STEPS.map((s) => s.exerciseId!), ...new Set(Object.values(ROLE_CHALLENGE_EXERCISE))],
  totalMinutes: (role: Role) => baselineSteps(role).reduce((sum, s) => sum + s.minutes, 0),
} as const;

/** Ordered steps for a role: common drills → role challenge → confidence ratings. */
export function baselineSteps(role: Role): BaselineStep[] {
  return [...COMMON_STEPS, roleStep(role), CONFIDENCE_STEP];
}

/* ------------------------------------------------------------------ */
/* Summary                                                             */
/* ------------------------------------------------------------------ */

export type BaselineResults = Partial<Record<MetricKey, number>>;

/** Accept either the stored map or raw ExerciseResults (best value per key). */
export function baselineResultMap(results: BaselineResults | ExerciseResult[]): BaselineResults {
  if (!Array.isArray(results)) return results;
  const out: BaselineResults = {};
  for (const r of results) {
    if (r.deletedAt) continue;
    const v = resultValue(r);
    if (v === undefined) continue;
    const lower = r.metricType === "time_s";
    const cur = out[r.metricKey];
    if (cur === undefined || (lower ? v < cur : v > cur)) out[r.metricKey] = v;
  }
  return out;
}

const THROW_NAMES: Record<ConfidenceKey, Localized> = {
  backhand: { he: "Backhand", en: "backhand" },
  forehand: { he: "Forehand", en: "forehand" },
  hammer: { he: "Hammer", en: "hammer" },
  deep: { he: "זריקות עומק", en: "deep throws" },
  short: { he: "זריקות קצרות", en: "short throws" },
};

function fmt(n: number, digits = 0): string {
  return (Math.round(n * 10 ** digits) / 10 ** digits).toString();
}

function num(v: unknown): number | undefined {
  return typeof v === "number" && Number.isFinite(v) ? v : undefined;
}

export interface BaselineSummary extends Localized {
  /** The summary in the requested locale. */
  text: string;
  /** Sentence list (same order in both languages), useful for bullet rendering. */
  lines: Localized[];
}

/** Non-judgemental summary of the baseline measurements. Only measured values are mentioned. */
export function summarizeBaseline(results: BaselineResults | ExerciseResult[], confidence: BaselineTest["confidence"], role: Role, locale: Locale = "he"): BaselineSummary {
  const r = baselineResultMap(results);
  const lines: Localized[] = [];
  const bh = num(r.backhand_accuracy);
  const fh = num(r.forehand_accuracy);

  if (bh !== undefined && fh !== undefined) {
    if (bh >= fh + 10) {
      lines.push({
        he: `ה-Backhand שלך כרגע יציב יותר מה-Forehand (${fmt(bh)}% לעומת ${fmt(fh)}%). בשבועות הראשונים נחזק את ה-Forehand בזריקות קצרות, בלי לוותר על ה-Backhand.`,
        en: `Your backhand is currently steadier than your forehand (${fmt(bh)}% vs ${fmt(fh)}%). In the first weeks we'll strengthen the forehand with short throws while keeping the backhand sharp.`,
      });
    } else if (fh >= bh + 10) {
      lines.push({
        he: `ה-Forehand שלך כרגע יציב יותר מה-Backhand (${fmt(fh)}% לעומת ${fmt(bh)}%). נתחיל מחיזוק ה-Backhand בזריקות קצרות, וה-Forehand ימשיך להתחדד.`,
        en: `Your forehand is currently steadier than your backhand (${fmt(fh)}% vs ${fmt(bh)}%). We'll start by strengthening the backhand with short throws while the forehand keeps sharpening.`,
      });
    } else {
      lines.push({
        he: `ה-Backhand וה-Forehand שלך ברמה דומה כרגע (${fmt(bh)}% ו-${fmt(fh)}%). נעבוד על שניהם במקביל ונעלה מרחק בהדרגה.`,
        en: `Your backhand and forehand are at a similar level right now (${fmt(bh)}% and ${fmt(fh)}%). We'll work on both together and add distance gradually.`,
      });
    }
  } else if (bh !== undefined) {
    lines.push({ he: `Backhand דרך השער: ${fmt(bh)}%. זו נקודת הפתיחה שלך למעקב.`, en: `Backhand through the gate: ${fmt(bh)}%. That's your starting point to track.` });
  } else if (fh !== undefined) {
    lines.push({ he: `Forehand דרך השער: ${fmt(fh)}%. זו נקודת הפתיחה שלך למעקב.`, en: `Forehand through the gate: ${fmt(fh)}%. That's your starting point to track.` });
  }

  const acc = num(r.throw_accuracy);
  if (acc !== undefined) lines.push({ he: `דיוק למטרה: ${fmt(acc)}%.`, en: `Target accuracy: ${fmt(acc)}%.` });

  const dist = num(r.longest_throw_m);
  if (dist !== undefined) lines.push({ he: `הזריקה הארוכה ביותר שלך: ${fmt(dist)} מ׳. מכאן מודדים התקדמות.`, en: `Your longest throw: ${fmt(dist)} m. Progress is measured from here.` });

  const streak = num(r.catch_streak);
  if (streak !== undefined) lines.push({ he: `רצף תפיסות: ${fmt(streak)}.`, en: `Catch streak: ${fmt(streak)}.` });

  const sprint = num(r.sprint_time_s);
  const cod = num(r.cod_time_s);
  if (sprint !== undefined && cod !== undefined) {
    lines.push({ he: `ספרינט 20 מ׳: ${fmt(sprint, 2)} שנ׳, שינוי כיוון 5-10-5: ${fmt(cod, 2)} שנ׳.`, en: `20 m sprint: ${fmt(sprint, 2)} s, 5-10-5 change of direction: ${fmt(cod, 2)} s.` });
  } else if (sprint !== undefined) {
    lines.push({ he: `ספרינט 20 מ׳: ${fmt(sprint, 2)} שנ׳.`, en: `20 m sprint: ${fmt(sprint, 2)} s.` });
  } else if (cod !== undefined) {
    lines.push({ he: `שינוי כיוון 5-10-5: ${fmt(cod, 2)} שנ׳.`, en: `5-10-5 change of direction: ${fmt(cod, 2)} s.` });
  }

  const roleScore = num(r[ROLE_CHALLENGE_METRIC[role]]);
  if (roleScore !== undefined) {
    const label = ROLE_LABELS[role];
    lines.push({ he: `ציון אתגר ${label.he}: ${fmt(roleScore)}. נחזור אליו בסוף כל שבוע ונראה את השינוי.`, en: `${label.en} challenge score: ${fmt(roleScore)}. We'll revisit it at the end of each week to see the change.` });
  }

  const rated = CONFIDENCE_KEYS.map((k) => ({ k, v: num(confidence?.[k]) })).filter((x): x is { k: ConfidenceKey; v: number } => x.v !== undefined);
  if (rated.length > 0) {
    const lowest = rated.reduce((a, b) => (b.v < a.v ? b : a));
    const highest = rated.reduce((a, b) => (b.v > a.v ? b : a));
    if (lowest.v <= 2) {
      lines.push({ he: `ציינת ביטחון נמוך יותר ב-${THROW_NAMES[lowest.k].he} – נכניס אותו בהדרגה, בעומס נמוך, עד שירגיש טבעי.`, en: `You rated your ${THROW_NAMES[lowest.k].en} lower on confidence – we'll bring it in gradually, at low load, until it feels natural.` });
    } else if (highest.v >= 4 && highest.k !== lowest.k) {
      lines.push({ he: `אתם מרגישים הכי בטוחים ב-${THROW_NAMES[highest.k].he} – נשתמש בו כבסיס לתרגילי המשחק.`, en: `You feel most confident with your ${THROW_NAMES[highest.k].en} – we'll use it as the base for game drills.` });
    }
  }

  if (lines.length === 0) {
    lines.push({ he: "עדיין אין מדידות מהמבחן. נתחיל לאסוף אותן באימון הראשון – כל תוצאה שתרשמו תעדכן את התמונה.", en: "No baseline measurements yet. We'll start collecting them in the first workout – every result you log updates the picture." });
  }

  const he = lines.map((l) => l.he).join(" ");
  const en = lines.map((l) => l.en).join(" ");
  return { he, en, text: locale === "en" ? en : he, lines };
}

/* ------------------------------------------------------------------ */
/* Goal hints                                                          */
/* ------------------------------------------------------------------ */

export interface BaselineGoalHints {
  primaryGoal: Goal;
  secondaryGoal?: Goal;
  weakSkills: Skill[];
}

const SKILL_TO_GOAL: Partial<Record<Skill, Goal>> = {
  backhand: "backhand",
  forehand: "forehand",
  hammer: "hammer",
  accuracy: "accuracy",
  distance: "distance",
  deep_throws: "deep_throws",
  short_throws: "short_throws",
  catching: "catching",
  catch_moving: "catch_running",
  speed: "speed",
  acceleration: "acceleration",
  change_of_direction: "change_of_direction",
  agility: "agility",
  endurance: "endurance",
  defense: "defense",
  marking: "marking",
  decision_making: "decision_making",
  field_vision: "field_vision",
};

const ROLE_DEFAULT_GOALS: Record<Role, Goal[]> = {
  handler: ["accuracy", "forehand", "backhand"],
  wing: ["catch_running", "deep_throws", "endurance"],
  runner: ["speed", "acceleration", "catch_running"],
  defender: ["defense", "agility", "marking"],
  cutter: ["change_of_direction", "catch_running", "acceleration"],
  hybrid: ["accuracy", "change_of_direction", "catching"],
  allround: ["general", "accuracy", "catching"],
};

/** Weak skills and goal suggestions from a baseline. Only measured values produce hints. */
export function baselineToGoalHints(baseline: Pick<BaselineTest, "results" | "confidence" | "role">): BaselineGoalHints {
  const r = baseline.results ?? {};
  const weak: Skill[] = [];
  const add = (s: Skill) => {
    if (!weak.includes(s)) weak.push(s);
  };
  const bh = num(r.backhand_accuracy);
  const fh = num(r.forehand_accuracy);
  const hm = num(r.hammer_accuracy);

  // Relative gaps first (the most actionable signal), then absolute thresholds.
  if (bh !== undefined && fh !== undefined) {
    if (fh <= bh - 15) add("forehand");
    else if (bh <= fh - 15) add("backhand");
  }
  if (fh !== undefined && fh < 60) add("forehand");
  if (bh !== undefined && bh < 60) add("backhand");
  if (hm !== undefined && hm < 50) add("hammer");
  const acc = num(r.throw_accuracy);
  if (acc !== undefined && acc < 60) add("accuracy");
  const streak = num(r.catch_streak);
  if (streak !== undefined && streak < 10) add("catching");
  const sprint = num(r.sprint_time_s);
  if (sprint !== undefined && sprint > 4.0) add("speed");
  const cod = num(r.cod_time_s);
  if (cod !== undefined && cod > 6.0) add("change_of_direction");
  const dist = num(r.longest_throw_m);
  if (dist !== undefined && dist < 25) add("distance");

  const c = baseline.confidence ?? {};
  if (num(c.forehand) !== undefined && c.forehand! <= 2) add("forehand");
  if (num(c.backhand) !== undefined && c.backhand! <= 2) add("backhand");
  if (num(c.hammer) !== undefined && c.hammer! <= 2) add("hammer");
  if (num(c.deep) !== undefined && c.deep! <= 2) add("deep_throws");
  if (num(c.short) !== undefined && c.short! <= 2) add("short_throws");

  const goals: Goal[] = [];
  for (const s of weak) {
    const g = SKILL_TO_GOAL[s];
    if (g && !goals.includes(g)) goals.push(g);
  }
  for (const g of ROLE_DEFAULT_GOALS[baseline.role] ?? ROLE_DEFAULT_GOALS.allround) {
    if (!goals.includes(g)) goals.push(g);
  }
  const hints: BaselineGoalHints = { primaryGoal: goals[0] ?? "general", weakSkills: weak.slice(0, 4) };
  if (goals[1]) hints.secondaryGoal = goals[1];
  return hints;
}
