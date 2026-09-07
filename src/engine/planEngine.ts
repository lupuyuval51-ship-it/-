/**
 * Training-plan generator (4–8 weeks) built on top of the workout engine.
 * Pure TypeScript (browser + Node): schedules sessions on the profile's training days, rotates session templates,
 * applies progressive overload with deload weeks, assigns weekly themes / challenges and generates one engine
 * workout per session. Also contains the pure helpers for role changes, rescheduling, postponing and rest days.
 *
 * The total minutes of a session are ALWAYS profile.durationMinutes – overload only changes intensity, energy
 * and rep counts through the engine's loadFactor.
 */
import type {
  BaselineTest, Duration, Exercise, Goal, Intensity, Localized, MetricKey, PlannedSession, Profile, Role,
  SessionTemplateType, Skill, TrainingPlan, TrainingWeek, Workout, WorkoutRequest,
} from "@/lib/types";
import { ROLE_LABELS } from "@/lib/types";
import { addDaysKey, nowIso, parseDateKey } from "@/lib/dates";
import { newId } from "@/lib/ids";
import { shortHash } from "@/engine/random";
import { GOAL_SKILLS, ROLE_FOCUS, SKILL_TO_GOAL } from "@/engine/phaseTemplates";
import { generateWorkout, workoutRequestFromProfile } from "@/engine/workoutEngine";

/* ------------------------------------------------------------------ */
/* Types                                                                */
/* ------------------------------------------------------------------ */

export type PlanWeeksCount = 4 | 5 | 6 | 7 | 8;

export interface GeneratePlanInput {
  profile: Profile;
  weeksCount: PlanWeeksCount;
  /** YYYY-MM-DD – the first day of week 1. */
  startDate: string;
  baseline?: BaselineTest;
  stats?: { weakSkills: Skill[]; strongSkills: Skill[] };
  /** Deterministic output for the same seed. */
  seed?: string;
  catalog?: Exercise[];
  /** ISO timestamp for createdAt/updatedAt (defaults to now). */
  now?: string;
}

export interface GeneratedPlan {
  plan: TrainingPlan;
  weeks: TrainingWeek[];
  sessions: PlannedSession[];
  workouts: Workout[];
}

export interface AdaptPlanOptions {
  seed?: string;
  catalog?: Exercise[];
  now?: string;
  baseline?: BaselineTest;
  stats?: { weakSkills: Skill[]; strongSkills: Skill[] };
}

export interface AdaptedPlan extends GeneratedPlan {
  explanation: Localized;
  /** Workout ids that belonged to regenerated sessions and are no longer referenced. */
  removedWorkoutIds: string[];
}

/* ------------------------------------------------------------------ */
/* Constants                                                            */
/* ------------------------------------------------------------------ */

export const DELOAD_FACTOR = 0.85;
export const LOAD_STEP = 0.05;
export const MAX_LOAD_FACTOR = 1.3;

/** Weekly challenge ids authored in src/content/challenges.ts. */
export const WEEKLY_CHALLENGE_IDS = [
  "wk-sessions-3", "wk-accuracy-8of10", "wk-catch-streak-20", "wk-role-challenge", "wk-forehand-50",
  "wk-distance-pb", "wk-90min", "wk-cuts-10", "wk-mirror", "wk-5bh5fh",
] as const;
export type WeeklyChallengeId = (typeof WEEKLY_CHALLENGE_IDS)[number];

/** Session template rotation inside a week (4+ sessions add "mixed"; more than 4 cycle). */
export const TEMPLATE_ROTATION: SessionTemplateType[] = ["technique", "movement_role", "game_challenge", "mixed"];

const ROLE_CHALLENGE_METRIC: Record<Role, MetricKey> = {
  wing: "wing_challenge_score",
  runner: "runner_challenge_score",
  defender: "defender_challenge_score",
  handler: "handler_challenge_score",
  cutter: "cutter_challenge_score",
  hybrid: "hybrid_challenge_score",
  allround: "hybrid_challenge_score",
};

/** Goal used by "movement_role" sessions per role. */
const ROLE_MOVEMENT_GOAL: Record<Role, Goal> = {
  wing: "catch_running",
  runner: "speed",
  defender: "defense",
  handler: "pivot_footwork",
  cutter: "change_of_direction",
  hybrid: "change_of_direction",
  allround: "agility",
};

/** Default goal per role when the profile has none. */
const ROLE_DEFAULT_GOAL: Record<Role, Goal> = {
  wing: "catch_running",
  runner: "acceleration",
  defender: "defense",
  handler: "accuracy",
  cutter: "change_of_direction",
  hybrid: "accuracy",
  allround: "general",
};

type ThemeKey = "accuracy" | "catching" | "role" | "forehand" | "distance" | "cuts" | "defense" | "bhfh" | "consistency" | "final";

interface WeekTheme {
  key: ThemeKey;
  challengeId: WeeklyChallengeId;
  theme: Localized;
  goal: Localized;
  skills: Skill[];
  metric: MetricKey;
  /** Primary goal for technique sessions in this week. */
  goalId: Goal;
}

const THEMES: Record<Exclude<ThemeKey, "role">, WeekTheme> = {
  accuracy: {
    key: "accuracy",
    challengeId: "wk-accuracy-8of10",
    theme: { he: "דיוק ויסודות", en: "Accuracy & fundamentals" },
    goal: { he: "לבנות שחרור יציב ולהגיע ל-8 מתוך 10 פגיעות במטרה.", en: "Build a stable release and reach 8-of-10 target hits." },
    skills: ["accuracy", "backhand", "forehand", "short_throws"],
    metric: "throw_accuracy",
    goalId: "accuracy",
  },
  catching: {
    key: "catching",
    challengeId: "wk-catch-streak-20",
    theme: { he: "ידיים בטוחות", en: "Safe hands" },
    goal: { he: "תפיסות בטוחות בעמידה ובריצה – 20 תפיסות רצופות בלי נפילה.", en: "Secure catches standing and on the move – 20 in a row without a drop." },
    skills: ["catching", "catch_moving", "one_hand_catch", "catch_pressure"],
    metric: "catch_streak",
    goalId: "catching",
  },
  forehand: {
    key: "forehand",
    challengeId: "wk-forehand-50",
    theme: { he: "שבוע Forehand", en: "Forehand week" },
    goal: { he: "שורש כף יד חד ושחרור מהיר – 50 זריקות Forehand נקיות בשבוע.", en: "A sharp wrist snap and quick release – 50 clean forehands this week." },
    skills: ["forehand", "release_speed", "accuracy", "break_throws"],
    metric: "forehand_accuracy",
    goalId: "forehand",
  },
  distance: {
    key: "distance",
    challengeId: "wk-distance-pb",
    theme: { he: "מרחק ומשחק עומק", en: "Distance & the deep game" },
    goal: { he: "זריקות ארוכות יציבות וריצות עומק מתוזמנות – ניסיון לשיא מרחק חדש.", en: "Stable long throws and well-timed deep runs – go for a new distance PB." },
    skills: ["distance", "deep_throws", "deep_runs", "timing"],
    metric: "longest_throw_m",
    goalId: "distance",
  },
  cuts: {
    key: "cuts",
    challengeId: "wk-cuts-10",
    theme: { he: "Cuts ושינויי כיוון", en: "Cuts & change of direction" },
    goal: { he: "יציאות חדות, האצה ושינויי כיוון מהירים – 10 Cuts נקיים ברצף.", en: "Sharp starts, acceleration and quick changes of direction – 10 clean cuts in a row." },
    skills: ["cutting", "change_of_direction", "acceleration", "separation"],
    metric: "cod_time_s",
    goalId: "change_of_direction",
  },
  defense: {
    key: "defense",
    challengeId: "wk-mirror",
    theme: { he: "הגנה ו-Mirror", en: "Defense & mirroring" },
    goal: { he: "עבודת רגליים הגנתית, Mirror ותגובה – להישאר צמודים בלי מגע.", en: "Defensive footwork, mirroring and reaction – stay tight without contact." },
    skills: ["defense", "mirror", "footwork", "reaction"],
    metric: "mirror_score",
    goalId: "defense",
  },
  bhfh: {
    key: "bhfh",
    challengeId: "wk-5bh5fh",
    theme: { he: "שתי הזריקות", en: "Both throws" },
    goal: { he: "Backhand ו-Forehand באותה רמה – 5 ו-5 ברצף למטרה.", en: "Backhand and forehand at the same level – 5 and 5 in a row at a target." },
    skills: ["backhand", "forehand", "accuracy", "pivot"],
    metric: "throw_accuracy",
    goalId: "backhand",
  },
  consistency: {
    key: "consistency",
    challengeId: "wk-sessions-3",
    theme: { he: "שבוע הורדת עומס", en: "Deload week" },
    goal: { he: "פחות עומס, יותר תחושה: שלושה אימונים רגועים עם טכניקה נקייה.", en: "Less load, more feel: three relaxed sessions with clean technique." },
    skills: ["accuracy", "catching", "footwork", "mobility"],
    metric: "confidence_rating",
    goalId: "general",
  },
  final: {
    key: "final",
    challengeId: "wk-90min",
    theme: { he: "שבוע סיום ומבחן חוזר", en: "Final week & retest" },
    goal: { he: "אימון מלא מההתחלה ועד הסוף ומדידה חוזרת של המדדים – לראות את ההתקדמות.", en: "One full session start to finish and a retest of your metrics – see the progress." },
    skills: ["decision_making", "catch_pressure", "endurance", "accuracy"],
    metric: "endurance_score",
    goalId: "game_prep",
  },
};

/** Preferred theme order per role (the "role" week is built dynamically). */
const ROLE_THEME_ORDER: Record<Role, ThemeKey[]> = {
  handler: ["accuracy", "role", "forehand", "bhfh", "catching", "distance", "cuts", "defense"],
  wing: ["catching", "role", "distance", "cuts", "accuracy", "forehand", "defense", "bhfh"],
  runner: ["cuts", "role", "catching", "accuracy", "distance", "forehand", "defense", "bhfh"],
  defender: ["defense", "role", "cuts", "catching", "accuracy", "forehand", "distance", "bhfh"],
  cutter: ["cuts", "role", "catching", "accuracy", "forehand", "distance", "defense", "bhfh"],
  hybrid: ["accuracy", "role", "cuts", "catching", "defense", "forehand", "distance", "bhfh"],
  allround: ["accuracy", "catching", "cuts", "role", "forehand", "defense", "distance", "bhfh"],
};

const WEAK_SKILL_THEME: Partial<Record<Skill, ThemeKey>> = {
  forehand: "forehand",
  backhand: "bhfh",
  accuracy: "accuracy",
  short_throws: "accuracy",
  release_speed: "forehand",
  catching: "catching",
  catch_moving: "catching",
  catch_pressure: "catching",
  one_hand_catch: "catching",
  change_of_direction: "cuts",
  cutting: "cuts",
  agility: "cuts",
  acceleration: "cuts",
  speed: "cuts",
  separation: "cuts",
  defense: "defense",
  mirror: "defense",
  marking: "defense",
  footwork: "defense",
  reaction: "defense",
  distance: "distance",
  deep_throws: "distance",
  deep_runs: "distance",
};

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */

function unique<T>(items: T[]): T[] {
  return Array.from(new Set(items));
}

function clampInt(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(n)));
}

function roleTheme(role: Role, weak: Skill[]): WeekTheme {
  const focus = ROLE_FOCUS[role];
  const skills = role === "allround" ? unique([...weak, ...focus.skills]).slice(0, 5) : focus.skills.slice(0, 4);
  return {
    key: "role",
    challengeId: "wk-role-challenge",
    theme: { he: `שבוע תפקיד: ${ROLE_LABELS[role].he}`, en: `Role week: ${ROLE_LABELS[role].en}` },
    goal: { he: focus.description.he, en: focus.description.en },
    skills,
    metric: ROLE_CHALLENGE_METRIC[role],
    goalId: ROLE_DEFAULT_GOAL[role],
  };
}

function themeByKey(key: ThemeKey, role: Role, weak: Skill[]): WeekTheme {
  return key === "role" ? roleTheme(role, weak) : THEMES[key];
}

/** Non-special weeks rotate through this order: weak-skill themes first, then the role's preferred order. */
function themeOrderFor(role: Role, weak: Skill[]): ThemeKey[] {
  const order: ThemeKey[] = [];
  for (const s of weak) {
    const key = WEAK_SKILL_THEME[s];
    if (key && !order.includes(key)) order.push(key);
  }
  for (const key of ROLE_THEME_ORDER[role]) if (!order.includes(key)) order.push(key);
  return order;
}

/** Load factor per week: 1.0 → +0.05 per training week, 0.85 on every 4th week and on the last week. */
export function loadFactors(weeksCount: number): number[] {
  const out: number[] = [];
  let load = 1;
  for (let i = 0; i < weeksCount; i++) {
    const deload = (i + 1) % 4 === 0 || i === weeksCount - 1;
    if (deload) {
      out.push(DELOAD_FACTOR);
      continue;
    }
    out.push(Math.round(Math.min(MAX_LOAD_FACTOR, load) * 100) / 100);
    load += LOAD_STEP;
  }
  return out;
}

export function isDeloadWeek(weekIndex: number, weeksCount: number): boolean {
  return (weekIndex + 1) % 4 === 0 || weekIndex === weeksCount - 1;
}

/** How a week's load factor shapes the engine inputs (minutes never change). */
export function loadToInputs(loadFactor: number): { intensity: Intensity; energy: WorkoutRequest["energy"] } {
  if (loadFactor < 1) return { intensity: "low", energy: 3 };
  if (loadFactor < 1.1) return { intensity: "medium", energy: 3 };
  if (loadFactor < 1.15) return { intensity: "medium", energy: 4 };
  return { intensity: "high", energy: 4 };
}

/**
 * Days of the week (0–6) for the sessions of one week. Uses the profile's training days; when fewer days than
 * sessions are given, extra days are spread evenly with at least one day between when possible.
 */
export function chooseTrainingDays(trainingDays: number[], sessionsPerWeek: number): number[] {
  const n = clampInt(sessionsPerWeek, 1, 7);
  const given = unique(trainingDays.filter((d) => Number.isInteger(d) && d >= 0 && d <= 6)).sort((a, b) => a - b);

  if (given.length >= n) {
    if (given.length === n) return given;
    const picked: number[] = [];
    for (let i = 0; i < n; i++) {
      const idx = Math.floor((i * given.length) / n);
      picked.push(given[idx]);
    }
    return unique(picked).sort((a, b) => a - b);
  }

  const chosen = given.slice();
  if (chosen.length === 0) chosen.push(n === 1 ? 2 : 0);
  const distance = (day: number, list: number[]): number => Math.min(...list.map((d) => Math.abs(d - day)));
  while (chosen.length < n) {
    const free = [0, 1, 2, 3, 4, 5, 6].filter((d) => !chosen.includes(d));
    if (free.length === 0) break;
    // Prefer days with at least one free day between them and any chosen day; then the largest gap.
    const spaced = free.filter((d) => distance(d, chosen) >= 2);
    const pool = spaced.length > 0 ? spaced : free;
    let best = pool[0];
    let bestGap = -1;
    for (const d of pool) {
      const gap = distance(d, chosen);
      if (gap > bestGap) {
        bestGap = gap;
        best = d;
      }
    }
    chosen.push(best);
  }
  return chosen.sort((a, b) => a - b);
}

/** Suggested recovery day: the first day after the last training day of the week, otherwise any free day. */
export function suggestRestDay(trainingDays: number[]): number {
  if (trainingDays.length === 0) return 6;
  const sorted = trainingDays.slice().sort((a, b) => a - b);
  const last = sorted[sorted.length - 1];
  for (let i = 1; i <= 7; i++) {
    const day = (last + i) % 7;
    if (!sorted.includes(day)) return day;
  }
  return last;
}

export function templateFor(sessionIndex: number, sessionsPerWeek: number): SessionTemplateType {
  const cycle = sessionsPerWeek >= 4 ? TEMPLATE_ROTATION : TEMPLATE_ROTATION.slice(0, 3);
  return cycle[sessionIndex % cycle.length];
}

/** Weak skills implied by a baseline test (relative gaps first, then absolute thresholds and confidence). */
export function baselineWeakSkills(baseline: Pick<BaselineTest, "results" | "confidence">): Skill[] {
  const r = baseline.results ?? {};
  const c = baseline.confidence ?? {};
  const weak: Skill[] = [];
  const add = (s: Skill) => {
    if (!weak.includes(s)) weak.push(s);
  };
  const bh = r.backhand_accuracy;
  const fh = r.forehand_accuracy;
  if (typeof bh === "number" && typeof fh === "number") {
    if (fh <= bh - 10) add("forehand");
    else if (bh <= fh - 10) add("backhand");
  }
  if (typeof fh === "number" && fh < 60) add("forehand");
  if (typeof bh === "number" && bh < 60) add("backhand");
  if (typeof r.hammer_accuracy === "number" && r.hammer_accuracy < 50) add("hammer");
  if (typeof r.throw_accuracy === "number" && r.throw_accuracy < 60) add("accuracy");
  if (typeof r.catch_streak === "number" && r.catch_streak < 10) add("catching");
  if (typeof r.catch_pct === "number" && r.catch_pct < 70) add("catching");
  if (typeof r.sprint_time_s === "number" && r.sprint_time_s > 4) add("speed");
  if (typeof r.cod_time_s === "number" && r.cod_time_s > 6) add("change_of_direction");
  if (typeof r.longest_throw_m === "number" && r.longest_throw_m < 25) add("distance");
  if (typeof c.forehand === "number" && c.forehand <= 2) add("forehand");
  if (typeof c.backhand === "number" && c.backhand <= 2) add("backhand");
  if (typeof c.hammer === "number" && c.hammer <= 2) add("hammer");
  if (typeof c.deep === "number" && c.deep <= 2) add("deep_throws");
  if (typeof c.short === "number" && c.short <= 2) add("short_throws");
  return weak;
}

function profileGoals(profile: Profile): Goal[] {
  return profile.goals
    .slice()
    .sort((a, b) => a.priority - b.priority)
    .map((g) => g.goal);
}

function weekStartKey(startDate: string, weekIndex: number): string {
  return addDaysKey(startDate, weekIndex * 7);
}

function sessionDateInWeek(weekStart: string, dayOfWeek: number): string {
  const startDow = parseDateKey(weekStart).getDay();
  const offset = (dayOfWeek - startDow + 7) % 7;
  return addDaysKey(weekStart, offset);
}

function dayOfWeekOf(dateKey: string): number {
  return parseDateKey(dateKey).getDay();
}

interface SessionGoalInputs {
  primaryGoal: Goal;
  secondaryGoal?: Goal;
  goals: Skill[];
}

function sessionGoals(params: { weekIndex: number; template: SessionTemplateType; theme: WeekTheme; role: Role; weak: Skill[]; profileGoalList: Goal[] }): SessionGoalInputs {
  const { weekIndex, template, theme, role, weak, profileGoalList } = params;
  const weakGoal = weak[0] ? SKILL_TO_GOAL[weak[0]] : undefined;
  const profileGoal = profileGoalList[0] ?? ROLE_DEFAULT_GOAL[role];
  const profileSecondary = profileGoalList.find((g) => g !== profileGoal);

  let primary: Goal;
  if (weekIndex <= 1 && weakGoal) primary = weakGoal;
  else if (template === "technique") primary = theme.goalId !== "general" ? theme.goalId : profileGoal;
  else if (template === "movement_role") primary = ROLE_MOVEMENT_GOAL[role];
  else if (template === "game_challenge") primary = "game_prep";
  else primary = profileGoal;

  const secondaryCandidates: (Goal | undefined)[] = [
    template === "technique" ? profileGoal : theme.goalId !== "general" ? theme.goalId : undefined,
    profileSecondary,
    weakGoal,
    ROLE_DEFAULT_GOAL[role],
  ];
  const secondary = secondaryCandidates.find((g): g is Goal => !!g && g !== primary);

  const goals = unique([
    ...GOAL_SKILLS[primary].slice(0, 2),
    ...theme.skills.slice(0, 2),
    ...(template === "movement_role" ? ROLE_FOCUS[role].skills.slice(0, 2) : []),
    ...(weak[0] ? [weak[0]] : []),
  ]).slice(0, 5);

  return { primaryGoal: primary, ...(secondary ? { secondaryGoal: secondary } : {}), goals };
}

function planTitle(profile: Profile, weeksCount: number): Localized {
  const role = ROLE_LABELS[profile.primaryRole];
  return { he: `תוכנית ${weeksCount} שבועות – ${role.he}`, en: `${weeksCount}-week ${role.en} plan` };
}

function planSummary(profile: Profile, weeksCount: number, weak: Skill[]): Localized {
  const role = ROLE_LABELS[profile.primaryRole];
  const n = profile.sessionsPerWeek;
  const d = profile.durationMinutes;
  const focus = ROLE_FOCUS[profile.primaryRole].description;
  const weakHe = weak.length ? " נתחיל מהמיומנויות שסומנו כחלשות יותר." : "";
  const weakEn = weak.length ? " We start with the skills flagged as weaker." : "";
  return {
    he: `${weeksCount} שבועות, ${n} אימונים בשבוע של ${d} דקות, עם עלייה הדרגתית בעומס ושבוע הורדת עומס כל שבוע רביעי. ${focus.he}${weakHe}`,
    en: `${weeksCount} weeks, ${n} sessions a week of ${d} minutes, with progressive overload and a deload every fourth week. ${role.en} focus: ${focus.en}${weakEn}`,
  };
}

/* ------------------------------------------------------------------ */
/* generatePlan                                                         */
/* ------------------------------------------------------------------ */

interface BuildSessionParams {
  profile: Profile;
  planId: string;
  weekId: string;
  weekIndex: number;
  sessionIndex: number;
  date: string;
  template: SessionTemplateType;
  theme: WeekTheme;
  loadFactor: number;
  weak: Skill[];
  profileGoalList: Goal[];
  recentExerciseIds: string[];
  seed: string;
  catalog?: Exercise[];
  now: string;
  role: Role;
  secondaryRole?: Role;
}

function buildSession(p: BuildSessionParams): { session: PlannedSession; workout: Workout } {
  const load = loadToInputs(p.loadFactor);
  const goals = sessionGoals({ weekIndex: p.weekIndex, template: p.template, theme: p.theme, role: p.role, weak: p.weak, profileGoalList: p.profileGoalList });
  const req = workoutRequestFromProfile(p.profile, {
    role: p.role,
    ...(p.secondaryRole && p.secondaryRole !== p.role ? { secondaryRole: p.secondaryRole } : {}),
    primaryGoal: goals.primaryGoal,
    ...(goals.secondaryGoal ? { secondaryGoal: goals.secondaryGoal } : {}),
    intensity: load.intensity,
    energy: load.energy,
    includeChallenge: true,
    templateType: p.template,
    weakSkills: p.weak,
    recentExerciseIds: p.recentExerciseIds,
    seed: `${p.seed}|w${p.weekIndex}|s${p.sessionIndex}|${p.role}`,
  });
  if (!req.secondaryRole || req.secondaryRole === p.role) delete req.secondaryRole;
  const workout = generateWorkout(req, { ...(p.catalog ? { catalog: p.catalog } : {}), now: p.now, loadFactor: p.loadFactor });
  const session: PlannedSession = {
    id: `${p.weekId}_s${p.sessionIndex + 1}`,
    planId: p.planId,
    weekId: p.weekId,
    weekIndex: p.weekIndex,
    dayOfWeek: dayOfWeekOf(p.date),
    date: p.date,
    time: p.profile.preferredTime || "18:00",
    durationMinutes: p.profile.durationMinutes,
    workoutId: workout.id,
    title: { ...workout.title },
    role: p.role,
    intensity: workout.intensity,
    goals: goals.goals,
    templateType: p.template,
    status: "planned",
    updatedAt: p.now,
  };
  return { session, workout };
}

function collectWorkoutExerciseIds(w: Workout): string[] {
  return w.phases.flatMap((ph) => ph.exercises.map((e) => e.exerciseId).filter((id): id is string => !!id));
}

/** Combined weak skills: stats first (measured over time), then baseline hints. */
export function combinedWeakSkills(input: { baseline?: BaselineTest; stats?: { weakSkills: Skill[] } }): Skill[] {
  return unique([...(input.stats?.weakSkills ?? []), ...(input.baseline ? baselineWeakSkills(input.baseline) : [])]).slice(0, 6);
}

export function generatePlan(input: GeneratePlanInput): GeneratedPlan {
  const { profile } = input;
  const weeksCount = clampInt(input.weeksCount, 4, 8) as PlanWeeksCount;
  const seed = input.seed ?? newId("plan");
  const now = input.now ?? nowIso();
  const planId = `plan_${shortHash(`${seed}|${profile.id}|${input.startDate}|${weeksCount}`)}`;
  const role = profile.primaryRole;
  const secondaryRole = profile.secondaryRole && profile.secondaryRole !== role ? profile.secondaryRole : undefined;
  const weak = combinedWeakSkills(input);
  const profileGoalList = profileGoals(profile);
  const sessionsPerWeek = clampInt(profile.sessionsPerWeek, 1, 7);
  const days = chooseTrainingDays(profile.trainingDays, sessionsPerWeek);
  const restDay = suggestRestDay(days);
  const factors = loadFactors(weeksCount);
  const themeOrder = themeOrderFor(role, weak);

  const weeks: TrainingWeek[] = [];
  const sessions: PlannedSession[] = [];
  const workouts: Workout[] = [];
  let recent: string[] = [];
  let rotationIndex = 0;

  for (let i = 0; i < weeksCount; i++) {
    const weekId = `${planId}_w${i + 1}`;
    const weekStart = weekStartKey(input.startDate, i);
    const loadFactor = factors[i];
    const isLast = i === weeksCount - 1;
    const deload = isDeloadWeek(i, weeksCount);
    let theme: WeekTheme;
    if (isLast) theme = THEMES.final;
    else if (deload) theme = THEMES.consistency;
    else theme = themeByKey(themeOrder[rotationIndex++ % themeOrder.length], role, weak);

    const weekSessions: PlannedSession[] = [];
    for (let j = 0; j < sessionsPerWeek; j++) {
      const dayOfWeek = days[j % days.length];
      const date = sessionDateInWeek(weekStart, dayOfWeek);
      const template = templateFor(j, sessionsPerWeek);
      const built = buildSession({
        profile, planId, weekId, weekIndex: i, sessionIndex: j, date, template, theme, loadFactor, weak, profileGoalList,
        recentExerciseIds: recent, seed, catalog: input.catalog, now, role, secondaryRole,
      });
      weekSessions.push(built.session);
      workouts.push(built.workout);
      recent = unique([...collectWorkoutExerciseIds(built.workout), ...recent]).slice(0, 24);
    }
    weekSessions.sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
    sessions.push(...weekSessions);

    const focusSkills = unique([...theme.skills, ...(weak[0] ? [weak[0]] : [])]).slice(0, 5);
    weeks.push({
      id: weekId,
      planId,
      index: i,
      startDate: weekStart,
      goal: { ...theme.goal },
      theme: { ...theme.theme },
      focusSkills,
      improvementMetric: theme.metric,
      challengeId: theme.challengeId,
      restDay,
      sessionIds: weekSessions.map((s) => s.id),
      totalMinutes: weekSessions.length * profile.durationMinutes,
      loadFactor,
      updatedAt: now,
    });
  }

  const plan: TrainingPlan = {
    id: planId,
    title: planTitle(profile, weeksCount),
    summary: planSummary(profile, weeksCount, weak),
    role,
    ...(secondaryRole ? { secondaryRole } : {}),
    level: profile.level,
    weeksCount,
    sessionsPerWeek,
    durationMinutes: profile.durationMinutes as Duration,
    startDate: input.startDate,
    status: "active",
    weekIds: weeks.map((w) => w.id),
    adaptationNotes: [],
    source: "engine",
    createdAt: now,
    updatedAt: now,
  };

  return { plan, weeks, sessions, workouts };
}

/* ------------------------------------------------------------------ */
/* Role change                                                          */
/* ------------------------------------------------------------------ */

const FUTURE_STATUSES: PlannedSession["status"][] = ["planned", "postponed"];

export function isFutureSession(s: PlannedSession): boolean {
  return FUTURE_STATUSES.includes(s.status) && !s.restDay && !s.deletedAt;
}

/**
 * Regenerate the workouts of future sessions (planned / postponed) for the profile's new role.
 * Completed, started, cancelled and replaced sessions – and their workouts – are kept untouched.
 */
export function adaptPlanForRoleChange(current: GeneratedPlan, profile: Profile, opts: AdaptPlanOptions = {}): AdaptedPlan {
  const now = opts.now ?? nowIso();
  const role = profile.primaryRole;
  const secondaryRole = profile.secondaryRole && profile.secondaryRole !== role ? profile.secondaryRole : undefined;
  const previousRole = current.plan.role;
  const seed = opts.seed ?? `${current.plan.id}|role:${role}|${now}`;
  const weak = combinedWeakSkills(opts);
  const profileGoalList = profileGoals(profile);
  const weeksCount = current.plan.weeksCount;
  const themeOrder = themeOrderFor(role, weak);

  const workoutsById = new Map(current.workouts.map((w) => [w.id, w]));
  const keptWorkouts: Workout[] = [];
  const newWorkouts: Workout[] = [];
  const removedWorkoutIds: string[] = [];
  const sessions: PlannedSession[] = [];
  let changed = 0;
  let recent: string[] = [];
  let rotationIndex = 0;

  const weekById = new Map(current.weeks.map((w) => [w.id, w]));
  const themeByWeek = new Map<string, WeekTheme>();
  for (const week of current.weeks.slice().sort((a, b) => a.index - b.index)) {
    const isLast = week.index === weeksCount - 1;
    const deload = isDeloadWeek(week.index, weeksCount);
    const hasFuture = current.sessions.some((s) => s.weekId === week.id && isFutureSession(s));
    if (!hasFuture) continue;
    if (isLast) themeByWeek.set(week.id, THEMES.final);
    else if (deload) themeByWeek.set(week.id, THEMES.consistency);
    else themeByWeek.set(week.id, themeByKey(themeOrder[rotationIndex++ % themeOrder.length], role, weak));
  }

  const ordered = current.sessions.slice().sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
  for (const s of ordered) {
    const week = weekById.get(s.weekId);
    if (!isFutureSession(s) || !week) {
      sessions.push(s);
      const w = workoutsById.get(s.workoutId);
      if (w && !keptWorkouts.includes(w)) keptWorkouts.push(w);
      continue;
    }
    const theme = themeByWeek.get(s.weekId) ?? roleTheme(role, weak);
    const sessionIndex = Math.max(0, week.sessionIds.indexOf(s.id));
    const built = buildSession({
      profile, planId: current.plan.id, weekId: s.weekId, weekIndex: s.weekIndex, sessionIndex, date: s.date, template: s.templateType,
      theme, loadFactor: week.loadFactor, weak, profileGoalList, recentExerciseIds: recent, seed, catalog: opts.catalog, now, role, secondaryRole,
    });
    const next: PlannedSession = {
      ...s,
      workoutId: built.workout.id,
      title: { ...built.workout.title },
      role,
      intensity: built.workout.intensity,
      goals: built.session.goals,
      updatedAt: now,
    };
    sessions.push(next);
    newWorkouts.push(built.workout);
    if (s.workoutId !== built.workout.id) removedWorkoutIds.push(s.workoutId);
    recent = unique([...collectWorkoutExerciseIds(built.workout), ...recent]).slice(0, 24);
    changed += 1;
  }

  const weeks = current.weeks.map((week) => {
    const theme = themeByWeek.get(week.id);
    if (!theme) return week;
    return {
      ...week,
      goal: { ...theme.goal },
      theme: { ...theme.theme },
      focusSkills: unique([...theme.skills, ...(weak[0] ? [weak[0]] : [])]).slice(0, 5),
      improvementMetric: theme.metric,
      challengeId: theme.challengeId,
      updatedAt: now,
    };
  });

  const from = ROLE_LABELS[previousRole];
  const to = ROLE_LABELS[role];
  const explanation: Localized =
    previousRole === role
      ? {
          he: `התפקיד נשאר ${to.he}; ${changed} אימונים עתידיים נבנו מחדש לפי הפרופיל העדכני. אימונים שכבר בוצעו נשמרו כמו שהם.`,
          en: `The role stays ${to.en}; ${changed} upcoming sessions were rebuilt from the updated profile. Completed sessions were kept as they were.`,
        }
      : {
          he: `עברתם מתפקיד ${from.he} לתפקיד ${to.he}. ${changed} אימונים עתידיים נבנו מחדש עם דגש על ${ROLE_FOCUS[role].description.he} אימונים שכבר בוצעו נשמרו כמו שהם, והתאריכים לא השתנו.`,
          en: `You moved from ${from.en} to ${to.en}. ${changed} upcoming sessions were rebuilt around ${ROLE_FOCUS[role].description.en} Completed sessions were kept as they were and no dates changed.`,
        };

  const plan: TrainingPlan = {
    ...current.plan,
    role,
    ...(secondaryRole ? { secondaryRole } : {}),
    title: planTitle(profile, weeksCount),
    adaptationNotes: [...current.plan.adaptationNotes, { at: now, note: explanation }],
    updatedAt: now,
  };
  if (!secondaryRole) delete plan.secondaryRole;

  const keptIds = new Set(sessions.map((s) => s.workoutId));
  const workouts = [...keptWorkouts.filter((w) => keptIds.has(w.id)), ...newWorkouts];
  return { plan, weeks, sessions, workouts, explanation, removedWorkoutIds: removedWorkoutIds.filter((id) => !keptIds.has(id)) };
}

/* ------------------------------------------------------------------ */
/* Session helpers (pure)                                               */
/* ------------------------------------------------------------------ */

/** Move a session to a new date/time. A postponed session becomes planned again. */
export function rescheduleSession(session: PlannedSession, newDate: string, newTime?: string, now: string = nowIso()): PlannedSession {
  return {
    ...session,
    date: newDate,
    dayOfWeek: dayOfWeekOf(newDate),
    time: newTime ?? session.time,
    status: session.status === "postponed" ? "planned" : session.status,
    updatedAt: now,
  };
}

/**
 * Postpone a session to the next free day (no other active session of the plan on that date), searching the rest
 * of its week and the following one. Returns a new object with status "postponed" and the new date.
 */
export function postponeSession(session: PlannedSession, others: PlannedSession[] = [], now: string = nowIso()): PlannedSession {
  const taken = new Set(
    others
      .filter((s) => s.id !== session.id && !s.deletedAt && s.status !== "cancelled" && s.status !== "replaced" && !s.restDay)
      .map((s) => s.date),
  );
  let target = addDaysKey(session.date, 1);
  for (let d = 1; d <= 14; d++) {
    const candidate = addDaysKey(session.date, d);
    if (!taken.has(candidate)) {
      target = candidate;
      break;
    }
  }
  return { ...session, date: target, dayOfWeek: dayOfWeekOf(target), status: "postponed", updatedAt: now };
}

/**
 * Mark a date as a rest day: every upcoming session on that date is flagged `restDay` and cancelled (no session).
 * Other sessions are returned unchanged (same references).
 */
export function markRestDay(sessions: PlannedSession[], date: string, now: string = nowIso()): PlannedSession[] {
  return sessions.map((s) => (s.date === date && isFutureSession(s) ? { ...s, restDay: true, status: "cancelled" as const, updatedAt: now } : s));
}
