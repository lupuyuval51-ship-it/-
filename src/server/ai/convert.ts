/**
 * Converts Claude's structured workout (ClaudeWorkoutOutput) into the shared `Workout` shape.
 * - Known catalog ids become full catalog drills (localized, with diagrams and metrics) via toWorkoutExercise.
 * - Unknown ids keep Claude's text; metric key / type and skills are inferred from the text.
 * - The request (not Claude) decides role, level, participants, field and duration so a solo athlete never
 *   receives a partner drill because the model said so.
 * - Durations off by ≤ 10 % are repaired proportionally; larger drift is left for validateWorkout to reject.
 */
import type {
  Equipment, Exercise, Localized, MetricKey, MetricType, PhaseType, Skill, Workout, WorkoutExercise, WorkoutPhase, WorkoutRequest,
} from "@/lib/types";
import { L, METRIC_KEYS, SKILLS } from "@/lib/types";
import { PHASE_GOALS, PHASE_NAMES, PHASE_ORDER, ROLE_FOCUS, phaseTemplatesFor } from "@/engine/phaseTemplates";
import { isEligible, repairWorkoutDurations, resolveEligible, toWorkoutExercise } from "@/engine/workoutEngine";
import type { ClaudeWorkoutOutput } from "./schemas";

export const DURATION_REPAIR_TOLERANCE = 0.1;
const MAX_TEXT = 600;
const MAX_LIST = 12;

export interface ConvertOptions {
  request: WorkoutRequest;
  catalog: Exercise[];
  now?: string;
  id?: string;
}

export interface ConvertResult {
  workout: Workout;
  /** Ids Claude used that are not in the catalog (kept as custom drills). */
  unknownIds: string[];
  /** Catalog ids dropped because the drill is not eligible for the athlete (kept as custom text instead). */
  ineligibleIds: string[];
  /** True when the proportional repair was applied. */
  repaired: boolean;
  /** Max relative drift before repair (0 = exact). */
  drift: number;
}

const METRIC_RULES: [RegExp, MetricKey][] = [
  [/streak|רצף/i, "catch_streak"],
  [/backhand|בקהנד/i, "backhand_accuracy"],
  [/forehand|פורהנד|flick|פליק/i, "forehand_accuracy"],
  [/hammer|האמר/i, "hammer_accuracy"],
  [/break/i, "break_throw_pct"],
  [/one[- ]hand|יד אחת/i, "one_hand_catch_pct"],
  [/catch|תפיס/i, "catch_pct"],
  [/sprint|ספרינט/i, "sprint_time_s"],
  [/5-10-5|change of direction|שינוי כיוון|שינויי כיוון|\bcod\b/i, "cod_time_s"],
  [/t-drill|t drill/i, "t_drill_time_s"],
  [/seconds|שניות|stopwatch|שעון|clock|\btime\b|זמן/i, "course_time_s"],
  [/meter|metre|מטר|distance|מרחק|huck|האק/i, "longest_throw_m"],
  [/mirror/i, "mirror_score"],
  [/reaction|תגובה/i, "reaction_score"],
  [/\bmark|מארק/i, "marking_score"],
  [/pivot|פיבוט/i, "pivot_score"],
  [/decision|החלט/i, "decision_score"],
  [/confidence|ביטחון|הרגשה|feel/i, "confidence_rating"],
];

const SKILL_RULES: [RegExp, Skill][] = [
  [/backhand|בקהנד/i, "backhand"],
  [/forehand|פורהנד|flick|פליק/i, "forehand"],
  [/hammer|האמר/i, "hammer"],
  [/huck|האק|deep throw|זריקות עומק|זריקת עומק/i, "deep_throws"],
  [/break/i, "break_throws"],
  [/pivot|פיבוט/i, "pivot"],
  [/fake|פייק|הטעי/i, "fakes"],
  [/one[- ]hand|יד אחת/i, "one_hand_catch"],
  [/catch(ing)? (on the )?(run|move)|תפיס(ה|ות) בריצה/i, "catch_moving"],
  [/pressure|לחץ/i, "catch_pressure"],
  [/catch|תפיס/i, "catching"],
  [/sprint|ספרינט/i, "speed"],
  [/accelerat|האצ/i, "acceleration"],
  [/agility|זריזות|ladder|סולם/i, "agility"],
  [/change of direction|שינוי כיוון|שינויי כיוון|5-10-5|\bcod\b/i, "change_of_direction"],
  [/endurance|סיבולת|interval|אינטרוול/i, "endurance"],
  [/mirror/i, "mirror"],
  [/\bmark|מארק/i, "marking"],
  [/defen[cs]e|הגנה|מגן/i, "defense"],
  [/reaction|תגובה/i, "reaction"],
  [/\bcuts?\b|cutting|קאט/i, "cutting"],
  [/give and go|give-and-go/i, "give_and_go"],
  [/decision|החלט/i, "decision_making"],
  [/accura|דיוק|target|מטרה|gate|שער/i, "accuracy"],
  [/wind|רוח/i, "wind"],
  [/stretch|מתיח|breath|נשימ/i, "cooldown"],
  [/mobility|מוביליטי|jog|ריצה קלה/i, "mobility"],
  [/warm|חימום/i, "warmup"],
];

const PHASE_DEFAULT_SKILL: Record<PhaseType, Skill> = {
  checkin: "warmup",
  warmup: "warmup",
  throwing: "accuracy",
  movement: "agility",
  role: "accuracy",
  game: "decision_making",
  challenge: "accuracy",
  cooldown: "cooldown",
};

export function metricTypeFor(key: MetricKey): MetricType {
  if (key.endsWith("_time_s")) return "time_s";
  if (key === "longest_throw_m") return "distance_m";
  if (key === "catch_streak" || key === "error_free_streak") return "streak";
  if (key === "throw_count" || key === "catch_count") return "count";
  if (key === "confidence_rating") return "rating";
  if (key.endsWith("_score")) return "score";
  return "ratio";
}

/** Metric key inferred from a free-text success metric (throw_accuracy by default). */
export function inferMetricKey(text: string, phase: PhaseType): MetricKey {
  const t = text || "";
  for (const [re, key] of METRIC_RULES) if (re.test(t)) return key;
  if (phase === "warmup" || phase === "cooldown" || phase === "checkin") return "confidence_rating";
  return "throw_accuracy";
}

function inferAttempts(text: string): number | undefined {
  const m = /(\d{1,3})\s*(?:מתוך|of|out of|\/)\s*(\d{1,3})/i.exec(text || "");
  if (m) {
    const attempts = Number(m[2]);
    if (attempts >= 1 && attempts <= 200) return attempts;
  }
  return undefined;
}

export function inferSkills(texts: string[], phase: PhaseType, request: WorkoutRequest): Skill[] {
  const joined = texts.join(" \n ");
  const found: Skill[] = [];
  for (const [re, skill] of SKILL_RULES) {
    if (re.test(joined) && !found.includes(skill)) found.push(skill);
    if (found.length >= 4) break;
  }
  if (found.length === 0) {
    found.push(phase === "role" ? ROLE_FOCUS[request.role].skills[0] ?? "accuracy" : PHASE_DEFAULT_SKILL[phase]);
  }
  return found.filter((s): s is Skill => (SKILLS as readonly string[]).includes(s));
}

function clampInt(n: unknown, min: number, max: number, fallback: number): number {
  const v = typeof n === "number" && Number.isFinite(n) ? Math.round(n) : fallback;
  return Math.min(max, Math.max(min, v));
}

function text(s: unknown, max = MAX_TEXT): string {
  return typeof s === "string" ? s.trim().slice(0, max) : "";
}

function textList(list: unknown, max = MAX_LIST): Localized[] {
  if (!Array.isArray(list)) return [];
  return list
    .map((s) => text(s))
    .filter(Boolean)
    .slice(0, max)
    .map((s) => L(s));
}

function localizedOr(s: string, fallback: Localized): Localized {
  return s ? L(s) : { ...fallback };
}

type ClaudeExercise = ClaudeWorkoutOutput["phases"][number]["exercises"][number];

function customExercise(ex: ClaudeExercise, phase: PhaseType, request: WorkoutRequest, instanceId: string, minutes: number): WorkoutExercise {
  const name = text(ex.exerciseName, 120) || PHASE_NAMES[phase].he;
  const metricText = text(ex.successMetric, 200);
  const key = inferMetricKey(`${metricText} ${name}`, phase);
  const type = metricTypeFor(key);
  const instructions = textList(ex.instructions, 15);
  const attempts = type === "ratio" ? inferAttempts(metricText) ?? 10 : undefined;
  return {
    id: instanceId,
    name: L(name),
    durationMinutes: minutes,
    sets: clampInt(ex.sets, 1, 30, 1),
    reps: clampInt(ex.repetitions, 1, 500, 10),
    restSeconds: clampInt(ex.restSeconds, 0, 900, 30),
    instructions: instructions.length ? instructions : [L(name)],
    cues: textList(ex.coachingCues, 10),
    commonMistakes: textList(ex.commonMistakes, 10),
    successMetric: { type, key, label: L(metricText || name), ...(attempts ? { attempts } : {}) },
    easierAlternative: localizedOr(text(ex.easierAlternative, 500), { he: "פחות חזרות ומרחק קצר יותר.", en: "Fewer reps and a shorter distance." }),
    harderAlternative: localizedOr(text(ex.harderAlternative, 500), { he: "יותר חזרות או מרחק גדול יותר.", en: "More reps or a longer distance." }),
    soloAlternative: localizedOr(text(ex.soloAlternative, 500), { he: "אותו תרגיל מול קיר או מטרה.", en: "The same drill against a wall or a target." }),
    safetyNotes: textList(ex.safetyNotes, 8),
    skills: inferSkills([name, metricText, ...instructions.map((i) => i.he)], phase, request),
    equipment: [],
    participants: [request.participants],
  };
}

function checkinExercise(minutes: number, instanceId: string): WorkoutExercise {
  return {
    id: instanceId,
    name: PHASE_NAMES.checkin,
    durationMinutes: minutes,
    sets: 1,
    reps: 1,
    restSeconds: 0,
    instructions: [
      { he: "דרגו הרגשה ואנרגיה (1–5) וסמנו כאב אם יש.", en: "Rate feeling and energy (1–5) and flag any pain." },
      { he: "בדקו את המשטח, הרוח והציוד שזמין היום.", en: "Check the surface, the wind and the gear you have today." },
      { he: "החליטו: לבד, בזוג או בקבוצה – האימון יותאם.", en: "Decide: solo, pair or group – the session adapts." },
    ],
    cues: [],
    commonMistakes: [],
    successMetric: { type: "rating", key: "confidence_rating", label: { he: "מוכנות לאימון (1–5)", en: "Readiness for the session (1–5)" } },
    easierAlternative: { he: "אם האנרגיה נמוכה – הורידו עצימות.", en: "Low energy – lower the intensity." },
    harderAlternative: { he: "מרגישים מצוין – אפשר להוסיף את האתגר.", en: "Feeling great – add the challenge." },
    soloAlternative: { he: "מתבצע לבד בכל מקרה.", en: "Done alone in any case." },
    safetyNotes: [{ he: "כאב חד, סחרחורת או קוצר נשימה – לא מתחילים.", en: "Sharp pain, dizziness or breathing trouble – do not start." }],
    skills: ["warmup"],
    equipment: [],
    participants: [],
  };
}

function relativeDrift(workout: Workout): number {
  let drift = 0;
  const phaseSum = workout.phases.reduce((s, p) => s + p.durationMinutes, 0);
  if (workout.totalDurationMinutes > 0) drift = Math.max(drift, Math.abs(phaseSum - workout.totalDurationMinutes) / workout.totalDurationMinutes);
  for (const p of workout.phases) {
    if (p.exercises.length === 0 || p.durationMinutes <= 0) continue;
    const exSum = p.exercises.reduce((s, e) => s + e.durationMinutes, 0);
    drift = Math.max(drift, Math.abs(exSum - p.durationMinutes) / p.durationMinutes);
  }
  return drift;
}

/** Builds a Workout from Claude's output. Never throws on odd content – validateWorkout decides afterwards. */
export function convertClaudeWorkout(output: ClaudeWorkoutOutput, opts: ConvertOptions): ConvertResult {
  const { request } = opts;
  const now = opts.now ?? new Date().toISOString();
  const byId = new Map(opts.catalog.map((e) => [e.id, e]));
  const eligibility = {
    participants: request.participants,
    equipment: request.equipment,
    level: request.level,
    ageGroup: request.ageGroup,
    fieldSize: request.fieldSize,
    wind: request.wind,
    includeFitness: request.includeFitness,
    excludedSkills: request.excludedSkills,
  };
  const unknownIds: string[] = [];
  const ineligibleIds: string[] = [];
  const usedCatalogIds = new Set<string>();
  const templates = phaseTemplatesFor(request.durationMinutes, request.includeChallenge);
  const templateByType = new Map(templates.map((t) => [t.type, t]));

  const rawPhases = Array.isArray(output.phases) ? output.phases.slice(0, 12) : [];
  const phases: WorkoutPhase[] = [];
  const seenTypes = new Set<PhaseType>();

  rawPhases.forEach((raw, pi) => {
    const type = raw.phaseType;
    if (!PHASE_ORDER.includes(type) || seenTypes.has(type)) return;
    if (type === "challenge" && !request.includeChallenge) return;
    seenTypes.add(type);
    const template = templateByType.get(type);
    const phaseId = `ph_${type}`;
    const minutes = clampInt(raw.durationMinutes, 1, 90, template?.minutes ?? 5);
    const exercises: WorkoutExercise[] = [];
    (Array.isArray(raw.exercises) ? raw.exercises.slice(0, 8) : []).forEach((ex, ei) => {
      const instanceId = `ex_${type}_${pi}_${ei}`;
      const exMinutes = clampInt(ex.durationMinutes, 1, 90, Math.max(1, Math.round(minutes / Math.max(1, raw.exercises.length))));
      const id = text(ex.exerciseId, 80);
      const catalogItem = id ? byId.get(id) : undefined;
      if (catalogItem && !usedCatalogIds.has(catalogItem.id)) {
        const resolved = isEligible(catalogItem, eligibility) ? catalogItem : resolveEligible(catalogItem, eligibility, byId);
        if (resolved && !usedCatalogIds.has(resolved.id)) {
          usedCatalogIds.add(resolved.id);
          exercises.push(
            toWorkoutExercise(resolved, exMinutes, { participants: request.participants, ageGroup: request.ageGroup, level: request.level, energy: request.energy, instanceId }),
          );
          return;
        }
        ineligibleIds.push(catalogItem.id);
      } else if (id && !catalogItem) {
        unknownIds.push(id);
      }
      exercises.push(customExercise(ex, type, request, instanceId, exMinutes));
    });
    if (exercises.length === 0 && type === "checkin") exercises.push(checkinExercise(minutes, `ex_${type}_${pi}_0`));
    if (exercises.length === 0 && type === "cooldown" && Array.isArray(output.cooldown?.steps) && output.cooldown.steps.length) {
      exercises.push(
        customExercise(
          { exerciseId: "", exerciseName: PHASE_NAMES.cooldown.he, durationMinutes: minutes, sets: 1, repetitions: 1, restSeconds: 0, instructions: output.cooldown.steps, coachingCues: [], commonMistakes: [], successMetric: "", easierAlternative: "", harderAlternative: "", soloAlternative: "", safetyNotes: [] },
          "cooldown",
          request,
          `ex_${type}_${pi}_0`,
          minutes,
        ),
      );
    }
    phases.push({
      id: phaseId,
      type,
      name: text(raw.phaseName, 80) ? L(text(raw.phaseName, 80)) : { ...PHASE_NAMES[type] },
      durationMinutes: minutes,
      goal: text(raw.goal, 400) ? L(text(raw.goal, 400)) : { ...PHASE_GOALS[type] },
      exercises,
    });
  });

  // Synthesize phases the template expects but the model skipped (check-in, end challenge, cool-down).
  for (const template of templates) {
    if (seenTypes.has(template.type)) continue;
    const phaseId = `ph_${template.type}`;
    if (template.type === "checkin") {
      phases.push({ id: phaseId, type: "checkin", name: { ...PHASE_NAMES.checkin }, durationMinutes: template.minutes, goal: { ...PHASE_GOALS.checkin }, exercises: [checkinExercise(template.minutes, "ex_checkin_0")] });
      seenTypes.add("checkin");
    } else if (template.type === "challenge" && output.endChallenge) {
      const c = output.endChallenge;
      const minutes = clampInt(c.durationMinutes, 1, 30, template.minutes);
      phases.push({
        id: phaseId,
        type: "challenge",
        name: text(c.name, 80) ? L(text(c.name, 80)) : { ...PHASE_NAMES.challenge },
        durationMinutes: minutes,
        goal: text(c.description, 400) ? L(text(c.description, 400)) : { ...PHASE_GOALS.challenge },
        exercises: [
          customExercise(
            { exerciseId: "", exerciseName: c.name, durationMinutes: minutes, sets: 1, repetitions: 10, restSeconds: 30, instructions: [c.description], coachingCues: [], commonMistakes: [], successMetric: c.successMetric, easierAlternative: "", harderAlternative: "", soloAlternative: "", safetyNotes: [] },
            "challenge",
            request,
            "ex_challenge_0",
            minutes,
          ),
        ],
      });
      seenTypes.add("challenge");
    } else if (template.type === "cooldown" && output.cooldown) {
      const minutes = clampInt(output.cooldown.durationMinutes, 1, 20, template.minutes);
      phases.push({
        id: phaseId,
        type: "cooldown",
        name: { ...PHASE_NAMES.cooldown },
        durationMinutes: minutes,
        goal: { ...PHASE_GOALS.cooldown },
        exercises: [
          customExercise(
            { exerciseId: "", exerciseName: PHASE_NAMES.cooldown.he, durationMinutes: minutes, sets: 1, repetitions: 1, restSeconds: 0, instructions: output.cooldown.steps ?? [], coachingCues: [], commonMistakes: [], successMetric: "", easierAlternative: "", harderAlternative: "", soloAlternative: "", safetyNotes: [] },
            "cooldown",
            request,
            "ex_cooldown_0",
            minutes,
          ),
        ],
      });
      seenTypes.add("cooldown");
    }
  }
  phases.sort((a, b) => PHASE_ORDER.indexOf(a.type) - PHASE_ORDER.indexOf(b.type));

  const equipment = new Set<Equipment>();
  const metrics = new Set<MetricKey>();
  for (const p of phases) {
    for (const e of p.exercises) {
      for (const eq of e.equipment) equipment.add(eq);
      metrics.add(e.successMetric.key);
    }
  }
  for (const m of Array.isArray(output.expectedMetrics) ? output.expectedMetrics : []) if ((METRIC_KEYS as readonly string[]).includes(m)) metrics.add(m);

  const title = text(output.workoutTitle, 120);
  const goal = text(output.workoutGoal, 400);
  const coachMessage = text(output.coachMessage, 600);
  const secondaryRole = request.secondaryRole && request.secondaryRole !== request.role ? request.secondaryRole : undefined;

  let workout: Workout = {
    id: opts.id ?? `wk_claude_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`,
    source: "claude",
    title: title ? L(title) : { he: "אימון אישי מהמאמן", en: "Personal coach workout" },
    goal: goal ? L(goal) : { he: "אימון מותאם אישית לפי הפרופיל והמטרות שלך.", en: "A session tailored to your profile and goals." },
    targetRole: request.role,
    ...(secondaryRole ? { secondaryRole } : {}),
    level: request.level,
    totalDurationMinutes: request.durationMinutes,
    intensity: request.energy <= 2 && request.intensity === "high" ? "medium" : request.intensity,
    participants: request.participants,
    fieldSize: request.fieldSize,
    requiredEquipment: [...equipment],
    coachMessage: coachMessage ? L(coachMessage) : { he: "עבדו בהדרגה, ספרו הצלחות, ותעצרו אם משהו כואב.", en: "Build up gradually, count your successes and stop if anything hurts." },
    tags: [
      "claude",
      request.role,
      request.participants,
      request.fieldSize,
      ...(request.templateType ? [request.templateType] : []),
      ...(request.wind === "medium" || request.wind === "strong" ? ["wind"] : []),
      ...(request.includeFitness ? ["fitness"] : []),
      ...(request.primaryGoal !== "general" ? [request.primaryGoal] : []),
    ],
    phases,
    expectedMetrics: [...metrics].slice(0, 20),
    includesFitness: request.includeFitness,
    includesChallenge: request.includeChallenge,
    createdAt: now,
    updatedAt: now,
  };

  const drift = relativeDrift(workout);
  let repaired = false;
  if (drift > 0 && drift <= DURATION_REPAIR_TOLERANCE) {
    workout = repairWorkoutDurations(workout);
    repaired = true;
  }
  return { workout, unknownIds, ineligibleIds, repaired, drift };
}
