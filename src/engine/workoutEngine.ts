/**
 * Local rule-based workout engine.
 * Pure TypeScript (runs in the browser and in Node): builds a Workout from a WorkoutRequest using the
 * exercise catalog, validates/repairs workouts from any source (engine, Claude, library, custom) and
 * replaces single drills during a session.
 *
 * Invariants (see docs/ARCHITECTURE.md):
 *   sum(phase.durationMinutes) === totalDurationMinutes and, per phase, sum(exercise.durationMinutes) === phase.durationMinutes.
 * The engine never schedules a drill the user cannot run (participants, equipment, level, age, field size).
 */
import type {
  AgeGroup, Equipment, Exercise, ExerciseCategory, FieldSize, Goal, Intensity, Level, Locale, Localized, MetricKey,
  Participants, PhaseType, Profile, ReplacementLog, Role, Skill, Wind, Workout, WorkoutExercise, WorkoutPhase, WorkoutRequest,
} from "@/lib/types";
import { DURATIONS, ROLE_LABELS } from "@/lib/types";
import { nowIso } from "@/lib/dates";
import { newId } from "@/lib/ids";
import { createRng, shortHash, type Rng } from "@/engine/random";
import {
  GOAL_LABELS, GOAL_SKILLS, MIXED_ROLE_FAMILIES, PHASE_ORDER, ROLE_FOCUS, SECONDARY_ROLE_SHARE, SKILL_LABELS,
  phaseTemplatesFor, type PhaseTemplate,
} from "@/engine/phaseTemplates";
import { parseWorkout } from "@/engine/workoutSchema";

/* ------------------------------------------------------------------ */
/* Catalog access                                                       */
/* ------------------------------------------------------------------ */

let catalogOverride: Exercise[] | null = null;
let loadedCatalog: Exercise[] | null = null;
let loadingCatalog: Promise<Exercise[]> | null = null;

/** Override the default catalog (tests, admin previews). Pass null to restore the lazily imported catalog. */
export function setDefaultCatalog(catalog: Exercise[] | null): void {
  catalogOverride = catalog;
}

/** True when `getDefaultCatalog()` can be called without an explicit catalog. */
export function isDefaultCatalogLoaded(): boolean {
  return catalogOverride !== null || loadedCatalog !== null;
}

/**
 * Lazily import the authored catalog (`@/content/exercises`) once per process and cache it.
 * The engine functions are synchronous, so callers that do not pass `catalog` in their options must
 * `await loadDefaultCatalog()` once (app start / route handler) before calling them. Tests inject fixtures instead.
 */
export async function loadDefaultCatalog(): Promise<Exercise[]> {
  if (catalogOverride) return catalogOverride;
  if (loadedCatalog) return loadedCatalog;
  if (!loadingCatalog) {
    // The catalog index (src/content/exercises/index.ts) is authored in parallel and resolved at build time, never at
    // engine import time. The two directive lines below only keep typecheck/lint green until it lands – delete them then.
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    loadingCatalog = import("@/content/exercises").then((mod: { EXERCISES?: unknown }) => {
      const list = mod.EXERCISES;
      if (!Array.isArray(list)) throw new Error("DiscCoach: @/content/exercises does not export an EXERCISES array");
      loadedCatalog = list as Exercise[];
      return loadedCatalog;
    });
  }
  return loadingCatalog;
}

/** The catalog used when a caller does not inject one. Throws with a clear message when nothing is loaded yet. */
export function getDefaultCatalog(): Exercise[] {
  const catalog = catalogOverride ?? loadedCatalog;
  if (!catalog) {
    throw new Error("DiscCoach: exercise catalog not loaded – pass `catalog` in the options or `await loadDefaultCatalog()` once before calling the engine.");
  }
  return catalog;
}

/* ------------------------------------------------------------------ */
/* Types                                                                */
/* ------------------------------------------------------------------ */

export interface EngineOptions {
  catalog?: Exercise[];
  /** ISO timestamp used for createdAt/updatedAt (defaults to now). */
  now?: string;
  /** Plan progressive-overload multiplier (1 = base). Scales reps, never minutes. */
  loadFactor?: number;
}

export interface EligibilityContext {
  participants: Participants;
  equipment: Equipment[];
  level: Level;
  ageGroup: AgeGroup;
  fieldSize?: FieldSize;
  wind?: Wind;
  includeFitness?: boolean;
  excludedSkills?: Skill[];
}

export interface ReplacementContext extends EligibilityContext {
  catalog?: Exercise[];
  recentIds?: string[];
  seed?: string;
  now?: string;
}

export interface ValidationContext {
  participants?: Participants;
  equipment?: Equipment[];
  level?: Level;
  ageGroup?: AgeGroup;
  expectedDuration?: number;
  catalog?: Exercise[];
}

export interface ValidationResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
  workout?: Workout;
}

export interface LoadOptions {
  participants?: Participants;
  ageGroup?: AgeGroup;
  level?: Level;
  energy?: number;
  loadFactor?: number;
  /** Instance id inside the workout (defaults to the exercise id). */
  instanceId?: string;
}

/* ------------------------------------------------------------------ */
/* Constants                                                            */
/* ------------------------------------------------------------------ */

const INTENSITY_RANK: Record<Intensity, number> = { low: 0, medium: 1, high: 2 };
const LEVEL_RANK: Record<Level, number> = { beginner: 0, intermediate: 1, advanced: 2 };
const SPRINT_SKILLS: Skill[] = ["speed", "acceleration", "endurance"];
const NON_FOCUS_SKILLS: Skill[] = ["warmup", "cooldown", "mobility", "strength"];

/** How many drills a phase should hold. */
const PHASE_COUNT: Record<PhaseType, { min: number; max: number }> = {
  checkin: { min: 1, max: 1 },
  warmup: { min: 3, max: 5 },
  throwing: { min: 2, max: 4 },
  movement: { min: 2, max: 4 },
  role: { min: 2, max: 4 },
  game: { min: 2, max: 3 },
  challenge: { min: 1, max: 2 },
  cooldown: { min: 2, max: 3 },
};

/** Categories that may fill a phase when no drill lists the phase explicitly (fallback tiers). */
const PHASE_FALLBACK_CATEGORIES: Record<PhaseType, ExerciseCategory[]> = {
  checkin: [],
  warmup: ["warmup"],
  throwing: ["throwing", "catching", "position"],
  movement: ["movement", "fitness", "position", "defense", "warmup"],
  role: ["position", "defense", "throwing", "catching", "movement"],
  game: ["game", "position", "throwing", "catching"],
  challenge: ["challenge", "game", "throwing", "movement"],
  cooldown: ["cooldown", "warmup"],
};

/** Dangerous instructions we refuse (Ultimate is non-contact). Common-mistake texts are not scanned. */
export const UNSAFE_KEYWORDS: { he: string[]; en: string[] } = {
  he: [
    "טאקל", "להכות את השותף", "להכות את היריב", "להכות את המגן", "להכות בשחקן", "מכות", "אגרוף", "לבעוט בשחקן", "לבעוט ביריב",
    "לדחוף את היריב", "לדחוף את השותף", "לדחוף את המגן", "להפיל את היריב", "להפיל את השותף", "להפיל את המגן", "לחנוק",
    "ראש בקיר", "לזרוק על הראש", "לזרוק לראש", "לכוון לראש",
  ],
  en: [
    "tackle", "tackling", "punch", "kick your", "kick the partner", "kick the opponent", "hit your partner", "hit the partner",
    "hit the opponent", "hit the defender", "shove", "trip the", "choke", "headbutt", "throw at the head", "aim at the head",
  ],
};

const CHECKIN_QUESTIONS: Localized[] = [
  { he: "איך אתם מרגישים היום? (1–5)", en: "How do you feel today? (1–5)" },
  { he: "כמה אנרגיה יש לכם? (1–5)", en: "How much energy do you have? (1–5)" },
  { he: "יש כאב? אין / קל / חד. כאב חד – מדלגים היום על תרגילים שמעמיסים על האזור.", en: "Any pain? none / mild / sharp. Sharp pain – skip drills that load that area today." },
  { he: "המשטח יבש או רטוב?", en: "Is the surface dry or wet?" },
  { he: "מה מצב הרוח? בלי / קלה / בינונית / חזקה.", en: "How is the wind? none / light / medium / strong." },
  { he: "לבד, בזוג או בקבוצה?", en: "Alone, with a partner or in a group?" },
  { he: "כל הציוד זמין? אם משהו חסר – נחליף את התרגילים המתאימים.", en: "Is all the equipment available? If something is missing we'll swap the relevant drills." },
];

/* ------------------------------------------------------------------ */
/* Small helpers                                                        */
/* ------------------------------------------------------------------ */

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function unique<T>(items: T[]): T[] {
  return Array.from(new Set(items));
}

function sum(values: number[]): number {
  return values.reduce((a, b) => a + b, 0);
}

function primarySkill(ex: { skills: Skill[] }): Skill | undefined {
  return ex.skills[0];
}

function goalSkills(goal: Goal | undefined): Skill[] {
  return goal ? GOAL_SKILLS[goal] : [];
}

function availableEquipment(equipment: Equipment[]): Set<Equipment> {
  return new Set<Equipment>(["disc", ...equipment]);
}

function fieldCompatible(ex: Exercise, fieldSize: FieldSize | undefined): boolean {
  if (!fieldSize) return true;
  if (ex.fieldSizes.includes(fieldSize)) return true;
  if ((fieldSize === "park" || fieldSize === "large") && ex.fieldSizes.includes("medium")) return true;
  return false;
}

function windCompatible(ex: Exercise, wind: Wind | undefined): boolean {
  if (!wind || wind === "unknown") return true;
  if (wind === "medium" || wind === "strong") return ex.wind !== "calm_only";
  return ex.wind !== "wind_focus";
}

function isEnduranceOnly(ex: Exercise): boolean {
  return ex.category === "fitness" || primarySkill(ex) === "endurance";
}

/** Hard eligibility of a single drill (no solo substitution). */
export function isEligible(ex: Exercise, ctx: EligibilityContext): boolean {
  if (!ex.participants.includes(ctx.participants)) return false;
  const available = availableEquipment(ctx.equipment);
  if (!ex.equipment.every((e) => available.has(e))) return false;
  if (!ex.levels.includes(ctx.level)) return false;
  if (!ex.ageGroups.includes(ctx.ageGroup)) return false;
  if (!fieldCompatible(ex, ctx.fieldSize)) return false;
  if (!windCompatible(ex, ctx.wind)) return false;
  const primary = primarySkill(ex);
  if (primary && ctx.excludedSkills?.includes(primary)) return false;
  if (ctx.includeFitness === false && isEnduranceOnly(ex)) return false;
  return true;
}

/**
 * Resolve a drill for the given context: the drill itself when eligible, its solo alternative when the user
 * trains alone and the alternative is eligible, otherwise null.
 */
export function resolveEligible(ex: Exercise, ctx: EligibilityContext, byId: Map<string, Exercise>): Exercise | null {
  if (isEligible(ex, ctx)) return ex;
  if (ctx.participants === "solo" && ex.soloAlternativeId) {
    const alt = byId.get(ex.soloAlternativeId);
    if (alt && alt.id !== ex.id && isEligible(alt, ctx)) return alt;
  }
  return null;
}

function eligibilityFromRequest(req: WorkoutRequest): EligibilityContext {
  return {
    participants: req.participants,
    equipment: req.equipment,
    level: req.level,
    ageGroup: req.ageGroup,
    fieldSize: req.fieldSize,
    wind: req.wind,
    includeFitness: req.includeFitness,
    excludedSkills: req.excludedSkills,
  };
}

function roundReps(n: number): number {
  return Math.max(1, Math.round(n));
}

/* ------------------------------------------------------------------ */
/* toWorkoutExercise                                                    */
/* ------------------------------------------------------------------ */

/**
 * Copy a catalog drill into a workout slot with adapted load.
 * kids: sets ≤ 2, reps ×0.7, rest +15 s · seniors: rest +15 s · beginners: rest +10 s · advanced: +1 set when the
 * minutes allow it · energy ≤ 2: reps ×0.8 · loadFactor scales reps (never minutes).
 */
export function toWorkoutExercise(ex: Exercise, durationMinutes: number, opts: LoadOptions = {}): WorkoutExercise {
  let sets = Math.max(1, ex.sets);
  let reps = Math.max(1, ex.reps);
  let rest = Math.max(0, ex.restSeconds);
  const minutes = Math.max(1, Math.round(durationMinutes));

  if (opts.ageGroup === "kid") {
    sets = Math.min(sets, 2);
    reps = roundReps(reps * 0.7);
    rest += 15;
  } else if (opts.ageGroup === "senior") {
    rest += 15;
  }
  if (opts.level === "beginner") {
    rest += 10;
  } else if (opts.level === "advanced" && ex.category !== "warmup" && ex.category !== "cooldown") {
    const timePerSet = ex.durationMinutes / Math.max(1, ex.sets);
    if (minutes >= timePerSet * (sets + 1)) sets += 1;
  }
  if (opts.energy !== undefined && opts.energy <= 2) reps = roundReps(reps * 0.8);
  if (opts.loadFactor !== undefined && opts.loadFactor > 0 && opts.loadFactor !== 1) reps = roundReps(reps * clamp(opts.loadFactor, 0.6, 1.4));
  if (ex.restSeconds === 0) rest = 0; // continuous drills stay continuous

  const instructions = ex.instructions.map((i) => ({ ...i }));
  const safetyNotes = ex.safetyNotes.map((s) => ({ ...s }));

  return {
    id: opts.instanceId ?? ex.id,
    exerciseId: ex.id,
    name: { ...ex.name },
    durationMinutes: minutes,
    sets,
    reps,
    restSeconds: rest,
    ...(ex.workSeconds !== undefined ? { workSeconds: ex.workSeconds } : {}),
    instructions,
    cues: ex.cues.map((c) => ({ ...c })),
    commonMistakes: ex.commonMistakes.map((c) => ({ ...c })),
    successMetric: { ...ex.successMetric, label: { ...ex.successMetric.label } },
    easierAlternative: { ...ex.easierVersion },
    harderAlternative: { ...ex.harderVersion },
    soloAlternative: { ...ex.soloAlternative },
    safetyNotes,
    skills: [...ex.skills],
    equipment: [...ex.equipment],
    participants: [...ex.participants],
    ...(ex.diagram ? { diagram: { field: ex.diagram.field, items: ex.diagram.items.map((it) => ({ ...it })) } } : {}),
    ...(ex.throwsPerSet !== undefined ? { throwsPerSet: ex.throwsPerSet } : {}),
    ...(ex.catchesPerSet !== undefined ? { catchesPerSet: ex.catchesPerSet } : {}),
  };
}

/* ------------------------------------------------------------------ */
/* Pseudo exercises                                                     */
/* ------------------------------------------------------------------ */

export const CHECKIN_EXERCISE_ID = "checkin";

function checkinExercise(minutes: number): WorkoutExercise {
  return {
    id: CHECKIN_EXERCISE_ID,
    name: { he: "בדיקת מצב לפני אימון", en: "Pre-session check-in" },
    durationMinutes: minutes,
    sets: 1,
    reps: 1,
    restSeconds: 0,
    instructions: CHECKIN_QUESTIONS.map((q) => ({ ...q })),
    cues: [{ he: "עונים בכנות – התוכנית מתאימה את עצמה לתשובות.", en: "Answer honestly – the session adapts to your answers." }],
    commonMistakes: [{ he: "מדלגים על הבדיקה ומתחילים עייפים או כואבים.", en: "Skipping the check-in and starting tired or in pain." }],
    successMetric: { type: "rating", key: "confidence_rating", label: { he: "מוכנות לאימון (1–5)", en: "Readiness for the session (1–5)" }, target: 3 },
    easierAlternative: { he: "אין גרסה קלה – רק לענות בכנות.", en: "No easier version – just answer honestly." },
    harderAlternative: { he: "אין גרסה קשה – רק לענות בכנות.", en: "No harder version – just answer honestly." },
    soloAlternative: { he: "לבד: אותן שאלות, רק לעצמכם.", en: "Solo: same questions, just for yourself." },
    safetyNotes: [{ he: "כאב חד = לא מתאמנים על האזור הכואב היום.", en: "Sharp pain = don't train the painful area today." }],
    skills: [],
    equipment: [],
    participants: ["solo", "pair", "group"],
  };
}

/** Used only when the catalog has nothing eligible for a phase – keeps the invariants and tells the user what to do. */
function fallbackExercise(type: PhaseType, minutes: number, participants: Participants, instanceId: string): WorkoutExercise {
  const texts: Record<PhaseType, { name: Localized; instruction: Localized; skill: Skill; key: MetricKey }> = {
    checkin: { name: { he: "בדיקת מצב", en: "Check-in" }, instruction: { he: "ענו על שאלות הבדיקה.", en: "Answer the check-in questions." }, skill: "warmup", key: "confidence_rating" },
    warmup: { name: { he: "חימום חופשי", en: "Free warm-up" }, instruction: { he: "ריצה קלה, סיבובי מפרקים ו-20 זריקות קלות.", en: "Easy jog, joint circles and 20 easy throws." }, skill: "warmup", key: "confidence_rating" },
    throwing: { name: { he: "זריקות חופשיות", en: "Free throwing" }, instruction: { he: "סבבים של 10 Backhand ו-10 Forehand למטרה קבועה, ספרו פגיעות.", en: "Rounds of 10 backhands and 10 forehands at a fixed target, count hits." }, skill: "accuracy", key: "throw_accuracy" },
    movement: { name: { he: "תנועה חופשית", en: "Free movement" }, instruction: { he: "20 מטר האצה, הליכה חזרה, 8 חזרות עם שינוי כיוון באמצע.", en: "20 m acceleration, walk back, 8 reps with a change of direction halfway." }, skill: "agility", key: "cod_time_s" },
    role: { name: { he: "עבודה חופשית לתפקיד", en: "Free role work" }, instruction: { he: "חזרו על התנועה המרכזית של התפקיד שלכם 10 פעמים בקצב משחק.", en: "Repeat your role's key movement 10 times at game tempo." }, skill: "decision_making", key: "decision_score" },
    game: { name: { he: "מצב משחק חופשי", en: "Free game situation" }, instruction: { he: "תפיסה, Pivot וזריקה תוך 3 שניות – 10 חזרות.", en: "Catch, pivot and throw within 3 seconds – 10 reps." }, skill: "decision_making", key: "decision_score" },
    challenge: { name: { he: "אתגר דיוק", en: "Accuracy challenge" }, instruction: { he: "10 זריקות למטרה – כמה פגעו?", en: "10 throws at a target – how many hit?" }, skill: "accuracy", key: "throw_accuracy" },
    cooldown: { name: { he: "שחרור חופשי", en: "Free cool-down" }, instruction: { he: "הליכה קלה ומתיחות עדינות.", en: "Easy walk and gentle stretches." }, skill: "cooldown", key: "confidence_rating" },
  };
  const t = texts[type];
  return {
    id: instanceId,
    name: t.name,
    durationMinutes: minutes,
    sets: 1,
    reps: 10,
    restSeconds: 0,
    instructions: [t.instruction],
    cues: [{ he: "טכניקה לפני מהירות.", en: "Technique before speed." }],
    commonMistakes: [],
    successMetric: { type: t.key === "confidence_rating" ? "rating" : t.key === "cod_time_s" ? "time_s" : t.key === "decision_score" ? "score" : "ratio", key: t.key, label: { he: "תוצאה", en: "Result" } },
    easierAlternative: { he: "הקטינו את המרחק.", en: "Shorten the distance." },
    harderAlternative: { he: "הגדילו את המרחק.", en: "Increase the distance." },
    soloAlternative: { he: "עובד לבד כפי שהוא.", en: "Works solo as written." },
    safetyNotes: [],
    skills: [t.skill],
    equipment: [],
    participants: [participants],
  };
}

/* ------------------------------------------------------------------ */
/* Duration fitting                                                     */
/* ------------------------------------------------------------------ */

interface DurationItem {
  min: number;
  max: number;
  preferred: number;
}

/**
 * Integer minutes for each item so the sum equals `target` exactly. Every item stays inside [min, max]
 * when possible; when the maxima are too small the last item is extended. Returns null when the minima
 * already exceed the target (caller drops an item).
 */
export function fitDurations(items: DurationItem[], target: number): number[] | null {
  if (items.length === 0) return target === 0 ? [] : null;
  const mins = items.map((i) => Math.max(1, Math.round(i.min)));
  const maxs = items.map((i, idx) => Math.max(mins[idx], Math.round(i.max)));
  if (sum(mins) > target) return null;
  const d = items.map((i, idx) => clamp(Math.round(i.preferred), mins[idx], maxs[idx]));
  let diff = target - sum(d);
  while (diff > 0) {
    let best = -1;
    let bestRoom = 0;
    for (let i = 0; i < d.length; i++) {
      const room = maxs[i] - d[i];
      if (room > bestRoom) {
        bestRoom = room;
        best = i;
      }
    }
    if (best < 0) break;
    d[best] += 1;
    diff -= 1;
  }
  while (diff < 0) {
    let best = -1;
    let bestSlack = 0;
    for (let i = 0; i < d.length; i++) {
      const slack = d[i] - mins[i];
      if (slack > bestSlack) {
        bestSlack = slack;
        best = i;
      }
    }
    if (best < 0) break;
    d[best] -= 1;
    diff += 1;
  }
  if (diff > 0) d[d.length - 1] += diff;
  if (diff < 0) return null;
  return d;
}

/* ------------------------------------------------------------------ */
/* Scoring                                                              */
/* ------------------------------------------------------------------ */

interface ScoreContext {
  req: WorkoutRequest;
  phase: PhaseType;
  picked: Exercise[];
  /** Slot index inside the phase (used to rotate role families for hybrid / all-round). */
  slot: number;
  /** When true this slot is reserved for the secondary role. */
  secondarySlot: boolean;
}

function skillOverlap(a: Skill[], b: Skill[]): number {
  return a.filter((s) => b.includes(s)).length;
}

function roleMatch(ex: Exercise, role: Role): boolean {
  return ex.roles.includes(role);
}

export function scoreExercise(ex: Exercise, ctx: ScoreContext): number {
  const { req, phase } = ctx;
  let score = 10;
  const primary = primarySkill(ex);

  // Goals.
  const g1 = goalSkills(req.primaryGoal);
  const g2 = goalSkills(req.secondaryGoal);
  if (primary && g1.includes(primary)) score += 8;
  else if (skillOverlap(ex.skills, g1) > 0) score += 5;
  if (primary && g2.includes(primary)) score += 4;
  else if (skillOverlap(ex.skills, g2) > 0) score += 2;

  // Weak skills (stats) – bonus, bigger for all-round players.
  const weak = req.weakSkills ?? [];
  const weakHits = skillOverlap(ex.skills, weak);
  score += Math.min(2, weakHits) * (req.role === "allround" ? 5 : 3);

  // Role.
  const focus = ROLE_FOCUS[req.role].skills;
  const focusHits = Math.min(3, skillOverlap(ex.skills, focus));
  if (phase === "role") {
    if (ctx.secondarySlot && req.secondaryRole) {
      if (roleMatch(ex, req.secondaryRole)) score += 12;
      score += Math.min(3, skillOverlap(ex.skills, ROLE_FOCUS[req.secondaryRole].skills)) * 2;
    } else if (req.role === "hybrid" || req.role === "allround") {
      const family = MIXED_ROLE_FAMILIES[ctx.slot % MIXED_ROLE_FAMILIES.length];
      if (roleMatch(ex, family)) score += 6;
      if (roleMatch(ex, req.role)) score += 4;
      score += focusHits * 2;
    } else {
      if (roleMatch(ex, req.role)) score += 8;
      else if (ex.roles.length === 0) score += 1;
      score += focusHits * 2;
    }
  } else {
    if (roleMatch(ex, req.role) || ex.roles.length === 0) score += 2;
    score += focusHits;
  }

  // Recent drills are penalised, never forbidden.
  if (req.recentExerciseIds?.includes(ex.id)) score -= 6;

  // Intensity / energy.
  const rank = INTENSITY_RANK[ex.intensity];
  if (req.intensity === "low" && rank === 2) score -= 6;
  if (req.intensity === "high" && rank === 2 && (phase === "movement" || phase === "game" || phase === "role")) score += 2;
  if (req.energy <= 2 && rank === 2) score -= 8;
  if (req.energy >= 5 && rank === 2 && (phase === "movement" || phase === "role")) score += 1;

  // Wind preference.
  if (req.wind === "medium" || req.wind === "strong") {
    if (ex.wind === "wind_focus") score += 4;
    else if (ex.wind === "wind_ok") score += 2;
  }

  // Excluded skills anywhere in the list: mild penalty (primary skill is a hard filter).
  if (req.excludedSkills.length && skillOverlap(ex.skills.slice(1), req.excludedSkills) > 0) score -= 2;

  // Session template.
  switch (req.templateType) {
    case "technique":
      if (phase === "throwing" && ex.skills.includes("accuracy")) score += 2;
      if ((phase === "role" || phase === "movement") && rank < 2) score += 2;
      if (phase === "movement" && (ex.skills.includes("footwork") || ex.skills.includes("agility"))) score += 2;
      break;
    case "movement_role":
      if ((phase === "movement" || phase === "role") && rank === 2 && req.energy > 2) score += 2;
      if (phase === "throwing" && (ex.skills.includes("catch_moving") || ex.skills.includes("release_speed"))) score += 2;
      break;
    case "game_challenge":
      if (phase === "game" && (ex.skills.includes("decision_making") || ex.skills.includes("catch_pressure"))) score += 2;
      if (phase === "challenge" && ex.roles.length > 0) score += 2;
      break;
    case "recovery":
      if (rank === 0) score += 3;
      if (rank === 2) score -= 4;
      break;
    default:
      break;
  }

  // Variety inside the phase.
  for (const p of ctx.picked) {
    if (primary && primarySkill(p) === primary) score -= 3;
    if (p.category === ex.category && phase !== "warmup" && phase !== "cooldown") score -= 1;
  }

  // Fitness drills are welcome when requested, only mildly otherwise.
  if (req.includeFitness && ex.category === "fitness" && phase === "movement") score += 2;

  return score;
}

/** Pick one drill from the top group with the seeded PRNG (higher score → higher weight). */
function pickFromTop(rng: Rng, scored: { ex: Exercise; score: number }[]): Exercise {
  const sorted = scored.slice().sort((a, b) => b.score - a.score || a.ex.id.localeCompare(b.ex.id));
  const best = sorted[0].score;
  const groupSize = Math.max(3, Math.ceil(sorted.length * 0.3));
  const group = sorted.slice(0, groupSize).filter((s) => s.score >= best - 6);
  const floor = group[group.length - 1].score;
  return rng.weightedPick(group, (s) => 1 + (s.score - floor)).ex;
}

/* ------------------------------------------------------------------ */
/* Phase building                                                       */
/* ------------------------------------------------------------------ */

function candidatePool(type: PhaseType, catalog: Exercise[], byId: Map<string, Exercise>, elig: EligibilityContext, used: Set<string>, minNeeded: number): Exercise[] {
  const resolve = (list: Exercise[]): Exercise[] => {
    const out: Exercise[] = [];
    const seen = new Set<string>();
    for (const ex of list) {
      const r = resolveEligible(ex, elig, byId);
      if (!r || used.has(r.id) || seen.has(r.id)) continue;
      seen.add(r.id);
      out.push(r);
    }
    return out;
  };
  const tier1 = resolve(catalog.filter((ex) => ex.phases.includes(type)));
  if (tier1.length >= minNeeded) return tier1;
  const cats = PHASE_FALLBACK_CATEGORIES[type];
  const tier2 = resolve(catalog.filter((ex) => ex.phases.includes(type) || cats.includes(ex.category)));
  return tier2.length > tier1.length ? tier2 : tier1;
}

function softFilter(pool: Exercise[], predicate: (ex: Exercise) => boolean, minNeeded: number): Exercise[] {
  const filtered = pool.filter(predicate);
  return filtered.length >= minNeeded ? filtered : pool;
}

function warmupRank(ex: Exercise): number {
  if (ex.skills.includes("mobility")) return 0;
  if (ex.skills.includes("footwork") || ex.skills.includes("agility")) return 1;
  if (ex.skills.includes("acceleration") || ex.skills.includes("speed")) return 2;
  if (ex.skills.includes("catching") || ex.skills.includes("backhand") || ex.skills.includes("forehand") || ex.skills.includes("distance")) return 3;
  return 1;
}

function cooldownRank(ex: Exercise): number {
  if (ex.id.includes("reflection") || ex.successMetric.type === "rating" && ex.skills.length === 1 && ex.id.includes("reflect")) return 2;
  if (ex.skills.includes("mobility")) return 1;
  return 0;
}

interface BuildPhaseParams {
  template: PhaseTemplate;
  index: number;
  req: WorkoutRequest;
  catalog: Exercise[];
  byId: Map<string, Exercise>;
  used: Set<string>;
  rng: Rng;
  loadFactor?: number;
}

function buildPhase(p: BuildPhaseParams): WorkoutPhase {
  const { template, req, rng } = p;
  const phaseId = `${template.type}`;
  const minutes = template.minutes;
  const base: WorkoutPhase = { id: phaseId, type: template.type, name: { ...template.name }, durationMinutes: minutes, goal: { ...template.goal }, exercises: [] };

  if (template.type === "checkin") {
    return { ...base, exercises: [checkinExercise(minutes)] };
  }

  const elig = eligibilityFromRequest(req);
  const counts = PHASE_COUNT[template.type];
  let pool = candidatePool(template.type, p.catalog, p.byId, elig, p.used, counts.min);

  // Soft constraints: keep them only while enough drills remain.
  if (req.energy <= 2) pool = softFilter(pool, (ex) => ex.intensity !== "high", counts.min);
  if (req.intensity === "low" && (template.type === "movement" || template.type === "game")) pool = softFilter(pool, (ex) => ex.intensity !== "high", counts.min);
  if (req.templateType === "recovery") pool = softFilter(pool, (ex) => ex.intensity !== "high", counts.min);

  if (pool.length === 0) {
    return { ...base, exercises: [fallbackExercise(template.type, minutes, req.participants, `${phaseId}_1_free`)] };
  }

  const avg = sum(pool.map((ex) => ex.durationMinutes)) / pool.length;
  let k = clamp(Math.round(minutes / Math.max(1, avg)), counts.min, counts.max);
  k = Math.min(k, pool.length);
  const wantsSecondary = template.type === "role" && !!req.secondaryRole && req.secondaryRole !== req.role;
  if (wantsSecondary && k < 2 && pool.length >= 2) k = 2;

  // Pick k drills.
  let picked: Exercise[] = [];
  const secondaryIds = new Set<string>();
  const remaining = pool.slice();
  let lastSecondarySlot = false;
  for (let slot = 0; slot < k && remaining.length > 0; slot++) {
    const secondarySlot = wantsSecondary && slot === k - 1;
    const scored = remaining.map((ex) => ({ ex, score: scoreExercise(ex, { req, phase: template.type, picked, slot, secondarySlot }) }));
    const chosen = pickFromTop(rng, scored);
    picked.push(chosen);
    if (secondarySlot) secondaryIds.add(chosen.id);
    lastSecondarySlot = secondarySlot;
    remaining.splice(remaining.indexOf(chosen), 1);
  }

  const itemsFor = (list: Exercise[]): DurationItem[] =>
    list.map((ex) => ({
      min: ex.minDurationMinutes,
      max: ex.maxDurationMinutes,
      preferred: secondaryIds.has(ex.id) ? Math.round(minutes * SECONDARY_ROLE_SHARE) : ex.durationMinutes,
    }));

  // Fit minutes. When the minima do not fit, first try to swap the last pick for a shorter candidate (keeps the
  // 2–4 drills per phase target), then drop drills from the end.
  let durations: number[] | null = fitDurations(itemsFor(picked), minutes);
  if (!durations && picked.length >= 2 && remaining.length > 0) {
    const head = picked.slice(0, -1);
    const slot = picked.length - 1;
    const candidates = remaining
      .map((ex) => ({ ex, score: scoreExercise(ex, { req, phase: template.type, picked: head, slot, secondarySlot: lastSecondarySlot }) }))
      .sort((a, b) => b.score - a.score || a.ex.id.localeCompare(b.ex.id));
    for (const { ex } of candidates) {
      if (lastSecondarySlot) secondaryIds.add(ex.id);
      const trial = [...head, ex];
      const fitted = fitDurations(itemsFor(trial), minutes);
      if (fitted) {
        picked = trial;
        durations = fitted;
        break;
      }
      if (lastSecondarySlot) secondaryIds.delete(ex.id);
    }
  }
  while (!durations && picked.length > 0) {
    picked.pop();
    durations = picked.length > 0 ? fitDurations(itemsFor(picked), minutes) : null;
  }
  if (!durations || picked.length === 0) {
    picked = [pool[0]];
    durations = [minutes];
  }

  // Order: warm-up from mobility to throws; cool-down ends with reflection; other phases keep the pick order.
  const fitted: number[] = durations;
  let order = picked.map((ex, i) => ({ ex, minutes: fitted[i] }));
  if (template.type === "warmup") order = order.slice().sort((a, b) => warmupRank(a.ex) - warmupRank(b.ex));
  if (template.type === "cooldown") order = order.slice().sort((a, b) => cooldownRank(a.ex) - cooldownRank(b.ex));

  for (const { ex } of order) p.used.add(ex.id);
  const exercises = order.map(({ ex, minutes: m }, i) =>
    toWorkoutExercise(ex, m, {
      participants: req.participants,
      ageGroup: req.ageGroup,
      level: req.level,
      energy: req.energy,
      loadFactor: p.loadFactor,
      instanceId: `${phaseId}_${i + 1}_${ex.id}`,
    }),
  );
  return { ...base, exercises };
}

/* ------------------------------------------------------------------ */
/* Workout texts                                                        */
/* ------------------------------------------------------------------ */

const TEMPLATE_TITLES: Record<NonNullable<WorkoutRequest["templateType"]> | "default", Localized> = {
  technique: { he: "אימון טכניקה", en: "Technique session" },
  movement_role: { he: "אימון תנועה ותפקיד", en: "Movement & role session" },
  game_challenge: { he: "אימון משחק ואתגר", en: "Game & challenge session" },
  recovery: { he: "אימון התאוששות", en: "Recovery session" },
  mixed: { he: "אימון משולב", en: "Mixed session" },
  default: { he: "אימון", en: "Session" },
};

function buildTitle(req: WorkoutRequest): Localized {
  const t = TEMPLATE_TITLES[req.templateType ?? "default"];
  const role = ROLE_LABELS[req.role];
  const goal = GOAL_LABELS[req.primaryGoal];
  return { he: `${t.he} ${role.he} · ${goal.he}`, en: `${role.en} ${t.en.toLowerCase()} · ${goal.en}` };
}

function buildGoal(req: WorkoutRequest): Localized {
  const role = ROLE_LABELS[req.role];
  const g1 = GOAL_LABELS[req.primaryGoal];
  const g2 = req.secondaryGoal && req.secondaryGoal !== req.primaryGoal ? GOAL_LABELS[req.secondaryGoal] : undefined;
  return {
    he: `שיפור ${g1.he}${g2 ? ` ו-${g2.he}` : ""} עם דגש על תפקיד ${role.he}.`,
    en: `Improve ${g1.en.toLowerCase()}${g2 ? ` and ${g2.en.toLowerCase()}` : ""} with a ${role.en.toLowerCase()} focus.`,
  };
}

function buildCoachMessage(req: WorkoutRequest): Localized {
  const parts: Localized[] = [];
  if (req.energy <= 2) {
    parts.push({ he: "האנרגיה נמוכה היום, אז עובדים חכם: טכניקה נקייה, פחות חזרות, ובלי להתעקש על עוצמה.", en: "Energy is low today, so we work smart: clean technique, fewer reps, no forcing intensity." });
  } else if (req.energy >= 5 || req.intensity === "high") {
    parts.push({ he: "יש אנרגיה – זה יום טוב לדחוף בקצב ובשינויי הכיוון. שמרו על טכניקה גם כשעייפים.", en: "You've got energy – a good day to push the tempo and the changes of direction. Keep the technique when tired." });
  } else if (req.templateType === "recovery") {
    parts.push({ he: "אימון התאוששות: קצב נמוך, הרבה תחושה, ואפס לחץ על תוצאות.", en: "Recovery session: low tempo, lots of feel, zero pressure on results." });
  } else {
    parts.push({ he: "תרגיל אחרי תרגיל, ספרו הצלחות ולא רק חזרות – ככה רואים התקדמות.", en: "Drill by drill, count successes and not just reps – that's how progress shows." });
  }
  if (req.wind === "medium" || req.wind === "strong") {
    parts.push({ he: "יש רוח – הזדמנות לתרגל זוויות שחרור ודיסק נמוך.", en: "It's windy – a chance to practise release angles and a low disc." });
  }
  if (req.participants === "solo") {
    parts.push({ he: "מתאמנים לבד היום, וכל התרגילים מותאמים לכך.", en: "Training solo today, and every drill is set up for that." });
  }
  return { he: parts.map((p) => p.he).join(" "), en: parts.map((p) => p.en).join(" ") };
}

function collectEquipment(phases: WorkoutPhase[]): Equipment[] {
  return unique(phases.flatMap((p) => p.exercises.flatMap((e) => e.equipment))).filter((e) => e !== "disc");
}

function collectMetrics(phases: WorkoutPhase[]): MetricKey[] {
  return unique(phases.flatMap((p) => p.exercises.filter((e) => e.id !== CHECKIN_EXERCISE_ID).map((e) => e.successMetric.key)));
}

/* ------------------------------------------------------------------ */
/* generateWorkout                                                      */
/* ------------------------------------------------------------------ */

/** Deterministic given `req.seed`: same request + seed → same workout (ids included). */
export function generateWorkout(req: WorkoutRequest, opts: EngineOptions = {}): Workout {
  const catalog = opts.catalog ?? getDefaultCatalog();
  const byId = new Map(catalog.map((e) => [e.id, e]));
  const seed = req.seed ?? newId("seed");
  const rng = createRng(`${seed}|${req.durationMinutes}|${req.role}|${req.participants}`);
  const now = opts.now ?? nowIso();
  const templates = phaseTemplatesFor(req.durationMinutes, req.includeChallenge);
  const used = new Set<string>();

  const phases = templates.map((template, index) => buildPhase({ template, index, req, catalog, byId, used, rng, loadFactor: opts.loadFactor }));

  const intensity: Intensity = req.energy <= 2 && req.intensity === "high" ? "medium" : req.intensity;
  const tags = unique([
    "engine",
    req.role,
    req.participants,
    req.fieldSize,
    ...(req.templateType ? [req.templateType] : []),
    ...(req.wind === "medium" || req.wind === "strong" ? ["wind"] : []),
    ...(req.includeFitness ? ["fitness"] : []),
    ...(req.primaryGoal !== "general" ? [req.primaryGoal] : []),
  ]);

  return {
    id: `wk_${shortHash(`${seed}|${req.durationMinutes}|${req.role}|${req.participants}|${req.primaryGoal}`)}`,
    source: "engine",
    title: buildTitle(req),
    goal: buildGoal(req),
    targetRole: req.role,
    ...(req.secondaryRole && req.secondaryRole !== req.role ? { secondaryRole: req.secondaryRole } : {}),
    level: req.level,
    totalDurationMinutes: req.durationMinutes,
    intensity,
    participants: req.participants,
    fieldSize: req.fieldSize,
    requiredEquipment: collectEquipment(phases),
    coachMessage: buildCoachMessage(req),
    tags,
    phases,
    expectedMetrics: collectMetrics(phases),
    includesFitness: req.includeFitness,
    includesChallenge: req.includeChallenge,
    createdAt: now,
    updatedAt: now,
  };
}

/** Build a WorkoutRequest from the profile (UI "quick start" and the plan engine). */
export function workoutRequestFromProfile(profile: Profile, overrides: Partial<WorkoutRequest> = {}): WorkoutRequest {
  const goals = profile.goals.slice().sort((a, b) => a.priority - b.priority);
  return {
    durationMinutes: profile.durationMinutes,
    role: profile.primaryRole,
    ...(profile.secondaryRole ? { secondaryRole: profile.secondaryRole } : {}),
    primaryGoal: goals[0]?.goal ?? "general",
    ...(goals[1] ? { secondaryGoal: goals[1].goal } : {}),
    intensity: "medium",
    participants: profile.participants,
    equipment: profile.equipment,
    fieldSize: profile.fieldSize,
    wind: profile.wind,
    includeFitness: profile.includeFitness,
    includeChallenge: true,
    excludedSkills: [],
    energy: 3,
    level: profile.level,
    ageGroup: profile.ageGroup,
    hand: profile.hand,
    ...overrides,
  };
}

/* ------------------------------------------------------------------ */
/* Validation                                                           */
/* ------------------------------------------------------------------ */

function textsOf(l: Localized | undefined): string[] {
  return l ? [l.he, l.en] : [];
}

function findUnsafe(texts: string[]): string | null {
  for (const raw of texts) {
    const text = raw.toLowerCase();
    for (const kw of UNSAFE_KEYWORDS.he) if (text.includes(kw)) return kw;
    for (const kw of UNSAFE_KEYWORDS.en) if (text.includes(kw)) return kw;
  }
  return null;
}

/** Structural (Zod) + invariant validation. `ok` is false when any error is present; warnings never block. */
export function validateWorkout(input: unknown, ctx: ValidationContext = {}): ValidationResult {
  const parsed = parseWorkout(input);
  if (!parsed.workout) return { ok: false, errors: parsed.errors, warnings: [] };
  const w = parsed.workout;
  const errors: string[] = [];
  const warnings: string[] = [];

  // Durations.
  const phaseSum = sum(w.phases.map((p) => p.durationMinutes));
  if (phaseSum !== w.totalDurationMinutes) errors.push(`phases sum to ${phaseSum} min but totalDurationMinutes is ${w.totalDurationMinutes}`);
  for (const phase of w.phases) {
    if (phase.durationMinutes < 1) errors.push(`phase "${phase.id}" has ${phase.durationMinutes} minutes`);
    if (phase.exercises.length === 0) errors.push(`phase "${phase.id}" has no exercises`);
    const exSum = sum(phase.exercises.map((e) => e.durationMinutes));
    if (exSum !== phase.durationMinutes) errors.push(`phase "${phase.id}" exercises sum to ${exSum} min but the phase is ${phase.durationMinutes} min`);
  }
  if (ctx.expectedDuration !== undefined && w.totalDurationMinutes !== ctx.expectedDuration) {
    errors.push(`totalDurationMinutes is ${w.totalDurationMinutes}, expected ${ctx.expectedDuration}`);
  }
  if (!(DURATIONS as readonly number[]).includes(w.totalDurationMinutes)) warnings.push(`totalDurationMinutes ${w.totalDurationMinutes} is not one of ${DURATIONS.join("/")}`);

  // Required phases and order.
  const types = w.phases.map((p) => p.type);
  for (const required of ["warmup", "cooldown", "role"] as PhaseType[]) {
    if (!types.includes(required)) errors.push(`missing "${required}" phase`);
  }
  if (w.includesChallenge && !types.includes("challenge")) errors.push('missing "challenge" phase although includesChallenge is true');
  const orderIdx = types.map((t) => PHASE_ORDER.indexOf(t));
  for (let i = 1; i < orderIdx.length; i++) {
    if (orderIdx[i] < orderIdx[i - 1]) {
      warnings.push("phases are not in the canonical order (checkin → warmup → throwing → movement → role → game → challenge → cooldown)");
      break;
    }
  }

  // Duplicates.
  const instanceIds = new Set<string>();
  const exerciseIds = new Set<string>();
  const phaseIds = new Set<string>();
  for (const phase of w.phases) {
    if (phaseIds.has(phase.id)) errors.push(`duplicate phase id "${phase.id}"`);
    phaseIds.add(phase.id);
    for (const ex of phase.exercises) {
      if (instanceIds.has(ex.id)) errors.push(`duplicate exercise instance id "${ex.id}"`);
      instanceIds.add(ex.id);
      if (ex.exerciseId) {
        if (exerciseIds.has(ex.exerciseId)) errors.push(`exercise "${ex.exerciseId}" appears twice`);
        exerciseIds.add(ex.exerciseId);
      }
    }
  }

  // Equipment.
  if (ctx.equipment) {
    const available = availableEquipment(ctx.equipment);
    for (const e of w.requiredEquipment) if (!available.has(e)) errors.push(`required equipment "${e}" is not available`);
    for (const phase of w.phases) {
      for (const ex of phase.exercises) {
        for (const e of ex.equipment) if (!available.has(e)) errors.push(`exercise "${ex.id}" needs "${e}" which is not available`);
      }
    }
  }

  // Participants.
  const participants = ctx.participants ?? w.participants;
  if (ctx.participants && ctx.participants !== w.participants) warnings.push(`workout is for "${w.participants}" but the context is "${ctx.participants}"`);
  for (const phase of w.phases) {
    for (const ex of phase.exercises) {
      if (ex.participants.length > 0 && !ex.participants.includes(participants)) errors.push(`exercise "${ex.id}" cannot be run as "${participants}"`);
    }
  }

  // Level / age (warnings – the drill texts carry easier/harder versions).
  const catalogMap = ctx.catalog ? new Map(ctx.catalog.map((e) => [e.id, e])) : null;
  if (ctx.level && w.level !== ctx.level) warnings.push(`workout level is "${w.level}" but the context level is "${ctx.level}"`);
  if (catalogMap) {
    for (const phase of w.phases) {
      for (const ex of phase.exercises) {
        const cat = ex.exerciseId ? catalogMap.get(ex.exerciseId) : undefined;
        if (!cat) continue;
        if (ctx.level && !cat.levels.includes(ctx.level)) warnings.push(`exercise "${cat.id}" is not written for level "${ctx.level}"`);
        if (ctx.ageGroup && !cat.ageGroups.includes(ctx.ageGroup)) warnings.push(`exercise "${cat.id}" is not written for age group "${ctx.ageGroup}"`);
      }
    }
  }

  // Safety.
  const texts: string[] = [...textsOf(w.title), ...textsOf(w.goal), ...textsOf(w.coachMessage)];
  for (const phase of w.phases) {
    texts.push(...textsOf(phase.name), ...textsOf(phase.goal));
    for (const ex of phase.exercises) {
      texts.push(...textsOf(ex.name), ...ex.instructions.flatMap(textsOf), ...ex.cues.flatMap(textsOf), ...textsOf(ex.easierAlternative), ...textsOf(ex.harderAlternative), ...textsOf(ex.soloAlternative), ...ex.safetyNotes.flatMap(textsOf));
    }
  }
  const unsafe = findUnsafe(texts);
  if (unsafe) errors.push(`unsafe instruction detected ("${unsafe}") – Ultimate is a non-contact sport`);

  return { ok: errors.length === 0, errors, warnings, workout: w };
}

/* ------------------------------------------------------------------ */
/* Repair                                                               */
/* ------------------------------------------------------------------ */

/** Largest-remainder scaling to integers with a minimum of 1 per item. Idempotent when the sum already matches. */
function scaleToTotal(values: number[], total: number): number[] {
  const n = values.length;
  if (n === 0) return [];
  const current = sum(values);
  if (current === total && values.every((v) => Number.isInteger(v) && v >= 1)) return values.slice();
  const safeTotal = Math.max(n, Math.round(total));
  const raw = current > 0 ? values.map((v) => (Math.max(0, v) / current) * safeTotal) : values.map(() => safeTotal / n);
  const out = raw.map((r) => Math.max(1, Math.floor(r)));
  let diff = safeTotal - sum(out);
  const order = raw.map((r, i) => ({ i, frac: r - Math.floor(r) })).sort((a, b) => b.frac - a.frac || a.i - b.i);
  let guard = 0;
  while (diff > 0 && guard++ < 10_000) {
    for (const { i } of order) {
      if (diff <= 0) break;
      out[i] += 1;
      diff -= 1;
    }
  }
  guard = 0;
  while (diff < 0 && guard++ < 10_000) {
    let reduced = false;
    for (const { i } of order.slice().reverse()) {
      if (diff >= 0) break;
      if (out[i] > 1) {
        out[i] -= 1;
        diff += 1;
        reduced = true;
      }
    }
    if (!reduced) break;
  }
  return out;
}

/** Proportionally rescale phase and exercise minutes to integers so the sums match. Idempotent. */
export function repairWorkoutDurations(w: Workout): Workout {
  const total = Math.max(w.phases.length, Math.round(w.totalDurationMinutes));
  const phaseMinutes = scaleToTotal(w.phases.map((p) => p.durationMinutes), total);
  const phases = w.phases.map((phase, i) => {
    const minutes = phaseMinutes[i];
    if (phase.exercises.length === 0) return { ...phase, durationMinutes: minutes };
    const exMinutes = scaleToTotal(phase.exercises.map((e) => e.durationMinutes), minutes);
    return { ...phase, durationMinutes: minutes, exercises: phase.exercises.map((e, j) => (e.durationMinutes === exMinutes[j] ? e : { ...e, durationMinutes: exMinutes[j] })) };
  });
  return { ...w, totalDurationMinutes: total, phases };
}

/* ------------------------------------------------------------------ */
/* Replacement                                                          */
/* ------------------------------------------------------------------ */

const PAIN_SAFETY_NOTE: Localized = {
  he: "דיווחתם על כאב: עובדים בעצימות נמוכה בלבד, ועוצרים מיד אם הכאב מתגבר. כאב חד = מסיימים את האימון.",
  en: "You reported pain: low intensity only, and stop immediately if it gets worse. Sharp pain = end the session.",
};

function catalogUsedIds(w: Workout): Set<string> {
  return new Set(w.phases.flatMap((p) => p.exercises.map((e) => e.exerciseId).filter((id): id is string => !!id)));
}

function replacementPool(phaseType: PhaseType, reason: ReplacementLog["reason"], catalog: Exercise[], byId: Map<string, Exercise>, elig: EligibilityContext, exclude: Set<string>): Exercise[] {
  const resolveAll = (list: Exercise[]): Exercise[] => {
    const out: Exercise[] = [];
    const seen = new Set<string>();
    for (const ex of list) {
      const r = resolveEligible(ex, elig, byId);
      if (!r || exclude.has(r.id) || seen.has(r.id)) continue;
      seen.add(r.id);
      out.push(r);
    }
    return out;
  };
  const calm = (ex: Exercise): boolean => ex.intensity !== "high" && ex.category !== "fitness" && !SPRINT_SKILLS.includes(primarySkill(ex) ?? "warmup");
  const samePhase = catalog.filter((ex) => ex.phases.includes(phaseType));
  let pool = resolveAll(reason === "pain" ? samePhase.filter(calm) : samePhase);
  if (pool.length === 0) {
    const cats = PHASE_FALLBACK_CATEGORIES[phaseType];
    const related = catalog.filter((ex) => cats.includes(ex.category));
    pool = resolveAll(reason === "pain" ? related.filter(calm) : related);
  }
  if (pool.length === 0 && reason === "pain") pool = resolveAll(catalog.filter((ex) => ex.intensity === "low" && calm(ex) && ex.category !== "warmup" && ex.category !== "cooldown"));
  return pool;
}

function scoreReplacement(ex: Exercise, current: { skills: Skill[]; intensity: Intensity; durationMinutes: number }, reason: ReplacementLog["reason"], ctx: ReplacementContext): number {
  let score = 0;
  const primary = primarySkill(ex);
  const currentPrimary = current.skills[0];
  if (primary && primary === currentPrimary) score += 8;
  score += Math.min(3, skillOverlap(ex.skills, current.skills)) * 3;
  if (current.durationMinutes >= ex.minDurationMinutes && current.durationMinutes <= ex.maxDurationMinutes) score += 5;
  else score -= Math.min(6, Math.abs(current.durationMinutes - ex.durationMinutes));
  if (ctx.recentIds?.includes(ex.id)) score -= 4;
  const rank = INTENSITY_RANK[ex.intensity];
  const currentRank = INTENSITY_RANK[current.intensity];
  const nextLevel = (Object.keys(LEVEL_RANK) as Level[]).find((l) => LEVEL_RANK[l] === LEVEL_RANK[ctx.level] + 1);
  const prevLevel = (Object.keys(LEVEL_RANK) as Level[]).find((l) => LEVEL_RANK[l] === LEVEL_RANK[ctx.level] - 1);
  switch (reason) {
    case "too_easy":
      score += rank > currentRank ? 5 : rank === currentRank ? 1 : -4;
      if (nextLevel && ex.levels.includes(nextLevel)) score += 3;
      if (ex.levels.length === 1 && ex.levels[0] === "beginner") score -= 3;
      break;
    case "too_hard":
      score += rank < currentRank ? 5 : rank === currentRank ? 1 : -4;
      if (prevLevel && ex.levels.includes(prevLevel)) score += 3;
      if (ex.levels.includes("beginner")) score += 1;
      break;
    case "pain":
      score += rank === 0 ? 6 : 0;
      if (ex.category === "throwing" || ex.category === "catching") score += 2;
      break;
    case "no_equipment":
      if (ex.equipment.length === 0) score += 3;
      break;
    default:
      break;
  }
  return score;
}

/**
 * Replace one drill inside a workout with a different eligible drill of the same phase and the SAME minutes.
 * Returns the untouched workout with null replacement/log when nothing suitable exists.
 */
export function replaceExercise(
  workout: Workout,
  phaseId: string,
  exerciseInstanceId: string,
  reason: ReplacementLog["reason"],
  ctx: ReplacementContext,
): { workout: Workout; replacement: WorkoutExercise | null; log: ReplacementLog | null } {
  const phase = workout.phases.find((p) => p.id === phaseId);
  const instance = phase?.exercises.find((e) => e.id === exerciseInstanceId);
  if (!phase || !instance) return { workout, replacement: null, log: null };

  const catalog = ctx.catalog ?? getDefaultCatalog();
  const byId = new Map(catalog.map((e) => [e.id, e]));
  const current = instance.exerciseId ? byId.get(instance.exerciseId) : undefined;
  const now = ctx.now ?? nowIso();

  const elig: EligibilityContext = {
    participants: reason === "alone" ? "solo" : ctx.participants,
    equipment: reason === "no_equipment" ? ctx.equipment.filter((e) => !instance.equipment.includes(e)) : ctx.equipment,
    level: ctx.level,
    ageGroup: ctx.ageGroup,
    fieldSize: ctx.fieldSize,
    wind: ctx.wind,
    includeFitness: ctx.includeFitness,
    excludedSkills: ctx.excludedSkills,
  };
  const exclude = catalogUsedIds(workout);
  const pool = replacementPool(phase.type, reason, catalog, byId, elig, exclude);
  if (pool.length === 0) return { workout, replacement: null, log: null };

  const currentInfo = { skills: instance.skills, intensity: current?.intensity ?? "medium", durationMinutes: instance.durationMinutes };
  const scored = pool.map((ex) => ({ ex, score: scoreReplacement(ex, currentInfo, reason, ctx) }));
  const rng = createRng(ctx.seed ?? `${workout.id}|${phaseId}|${exerciseInstanceId}|${reason}`);
  const chosen = pickFromTop(rng, scored);

  const replacement = toWorkoutExercise(chosen, instance.durationMinutes, {
    participants: elig.participants,
    ageGroup: ctx.ageGroup,
    level: ctx.level,
    instanceId: `${phaseId}_${chosen.id}_${shortHash(`${exerciseInstanceId}|${reason}`)}`,
  });

  if (reason === "too_easy" && INTENSITY_RANK[chosen.intensity] <= INTENSITY_RANK[currentInfo.intensity]) {
    replacement.sets = Math.min(6, replacement.sets + 1);
    replacement.reps = roundReps(replacement.reps * 1.2);
    replacement.instructions = [...replacement.instructions, { he: `גרסה קשה יותר: ${chosen.harderVersion.he}`, en: `Harder version: ${chosen.harderVersion.en}` }];
  }
  if (reason === "too_hard") {
    replacement.sets = Math.max(1, replacement.sets - 1);
    replacement.reps = roundReps(replacement.reps * 0.8);
    replacement.instructions = [...replacement.instructions, { he: `גרסה קלה יותר: ${chosen.easierVersion.he}`, en: `Easier version: ${chosen.easierVersion.en}` }];
  }
  if (reason === "pain") {
    replacement.restSeconds += 15;
    replacement.safetyNotes = [{ ...PAIN_SAFETY_NOTE }, ...replacement.safetyNotes];
  }

  const phases = workout.phases.map((p) => (p.id !== phaseId ? p : { ...p, exercises: p.exercises.map((e) => (e.id === exerciseInstanceId ? replacement : e)) }));
  const next: Workout = {
    ...workout,
    phases,
    requiredEquipment: collectEquipment(phases),
    expectedMetrics: collectMetrics(phases),
    updatedAt: now,
  };
  const log: ReplacementLog = {
    at: now,
    phaseId,
    ...(instance.exerciseId ? { fromExerciseId: instance.exerciseId } : {}),
    fromName: { ...instance.name },
    toExerciseId: chosen.id,
    toName: { ...chosen.name },
    reason,
  };
  return { workout: next, replacement, log };
}

/* ------------------------------------------------------------------ */
/* Alternatives                                                         */
/* ------------------------------------------------------------------ */

export interface AlternativesContext extends EligibilityContext {
  catalog?: Exercise[];
  /** Exercise ids to leave out (e.g. everything already in the workout). */
  excludeIds?: string[];
}

function isCatalogExercise(ex: WorkoutExercise | Exercise): ex is Exercise {
  return "category" in ex && "phases" in ex && "levels" in ex;
}

/** Similar eligible drills for "show me alternatives": same primary skill first, then shared skills / category / phase. */
export function findAlternatives(ex: WorkoutExercise | Exercise, ctx: AlternativesContext, count = 3): Exercise[] {
  const catalog = ctx.catalog ?? getDefaultCatalog();
  const byId = new Map(catalog.map((e) => [e.id, e]));
  const source: Exercise | undefined = isCatalogExercise(ex) ? ex : ex.exerciseId ? byId.get(ex.exerciseId) : undefined;
  const skills = source?.skills ?? ex.skills;
  const selfId = source?.id ?? (isCatalogExercise(ex) ? ex.id : ex.exerciseId);
  const exclude = new Set([...(ctx.excludeIds ?? []), ...(selfId ? [selfId] : [])]);
  const duration = isCatalogExercise(ex) ? ex.durationMinutes : ex.durationMinutes;

  const scored: { ex: Exercise; score: number }[] = [];
  const seen = new Set<string>();
  for (const candidate of catalog) {
    const resolved = resolveEligible(candidate, ctx, byId);
    if (!resolved || exclude.has(resolved.id) || seen.has(resolved.id)) continue;
    seen.add(resolved.id);
    let score = 0;
    if (skills[0] && primarySkill(resolved) === skills[0]) score += 8;
    score += Math.min(3, skillOverlap(resolved.skills, skills)) * 3;
    if (source) {
      if (resolved.category === source.category) score += 3;
      if (resolved.phases.some((p) => source.phases.includes(p))) score += 2;
      if (resolved.intensity === source.intensity) score += 1;
    }
    if (duration >= resolved.minDurationMinutes && duration <= resolved.maxDurationMinutes) score += 1;
    if (score > 0) scored.push({ ex: resolved, score });
  }
  return scored
    .sort((a, b) => b.score - a.score || a.ex.id.localeCompare(b.ex.id))
    .slice(0, Math.max(0, count))
    .map((s) => s.ex);
}

/* ------------------------------------------------------------------ */
/* Totals & descriptions                                                */
/* ------------------------------------------------------------------ */

export function workoutTotals(w: Workout): { minutes: number; exercises: number; phases: number; estimatedThrows: number; estimatedCatches: number; equipment: Equipment[] } {
  let exercises = 0;
  let throws = 0;
  let catches = 0;
  for (const phase of w.phases) {
    for (const ex of phase.exercises) {
      if (ex.id === CHECKIN_EXERCISE_ID) continue;
      exercises += 1;
      throws += (ex.throwsPerSet ?? 0) * Math.max(1, ex.sets);
      catches += (ex.catchesPerSet ?? 0) * Math.max(1, ex.sets);
    }
  }
  return {
    minutes: w.totalDurationMinutes,
    exercises,
    phases: w.phases.length,
    estimatedThrows: Math.round(throws),
    estimatedCatches: Math.round(catches),
    equipment: collectEquipment(w.phases),
  };
}

/** Skills ranked by the minutes spent on them (primary skill counts fully, the second skill half). */
export function workoutFocusSkills(w: Workout, limit = 3): Skill[] {
  const minutes = new Map<Skill, number>();
  for (const phase of w.phases) {
    if (phase.type === "checkin" || phase.type === "warmup" || phase.type === "cooldown") continue;
    for (const ex of phase.exercises) {
      const [first, second] = ex.skills;
      if (first && !NON_FOCUS_SKILLS.includes(first)) minutes.set(first, (minutes.get(first) ?? 0) + ex.durationMinutes);
      if (second && !NON_FOCUS_SKILLS.includes(second)) minutes.set(second, (minutes.get(second) ?? 0) + ex.durationMinutes / 2);
    }
  }
  return Array.from(minutes.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([skill]) => skill);
}

const HEBREW_RE = /^[֐-׿]/;

function hebrewPrefix(prefix: string, word: string): string {
  return HEBREW_RE.test(word) ? `${prefix}${word}` : `${prefix}-${word}`;
}

/** Short sentence for the home screen: "היום מתמקדים ב…" / "Today's focus: …". */
export function describeWorkoutFocus(w: Workout, locale: Locale): string {
  const skills = workoutFocusSkills(w, 3);
  if (skills.length === 0) {
    const role = ROLE_LABELS[w.targetRole];
    return locale === "he" ? `היום מתמקדים בעבודת ${role.he}.` : `Today's focus: ${role.en.toLowerCase()} work.`;
  }
  if (locale === "he") {
    const labels = skills.map((s) => SKILL_LABELS[s].he);
    if (labels.length === 1) return `היום מתמקדים ${hebrewPrefix("ב", labels[0])}.`;
    const head = labels.slice(0, -1);
    const last = labels[labels.length - 1];
    return `היום מתמקדים ${hebrewPrefix("ב", head[0])}${head.slice(1).map((l) => `, ${l}`).join("")} ${hebrewPrefix("ו", last)}.`;
  }
  const labels = skills.map((s) => SKILL_LABELS[s].en.toLowerCase());
  if (labels.length === 1) return `Today's focus: ${labels[0]}.`;
  return `Today's focus: ${labels.slice(0, -1).join(", ")} and ${labels[labels.length - 1]}.`;
}
