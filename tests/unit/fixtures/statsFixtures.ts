/**
 * Builders for the stats / gamification engine tests. Every builder produces a fully valid domain record with
 * explicit, deterministic values; tests override only what they assert on.
 * Dates are built at local noon so `toDateKey` gives the same YYYY-MM-DD in every timezone.
 */
import type {
  ActiveSession, CompletedSession, Exercise, ExerciseResult, MetricKey, MetricType, PlannedSession, Profile, Role, Settings, Skill,
  Workout, WorkoutExercise, WorkoutPhase, PhaseType,
} from "@/lib/types";
import { getFixtureExercise } from "./manifestExercises";

/** Local-noon Date for a calendar day (month is 1-based). */
export function day(y: number, m: number, d: number, hour = 12): Date {
  return new Date(y, m - 1, d, hour, 0, 0, 0);
}

export function iso(y: number, m: number, d: number, hour = 12): string {
  return day(y, m, d, hour).toISOString();
}

export function dateKey(y: number, m: number, d: number): string {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

let counter = 0;
export function nextId(prefix: string): string {
  counter += 1;
  return `${prefix}_${counter}`;
}

/* ------------------------------------------------------------------ */
/* Sessions & results                                                  */
/* ------------------------------------------------------------------ */

export interface SessionOverrides extends Partial<CompletedSession> {
  /** Convenience: completion date (local noon). */
  on?: Date;
}

export function makeSession(overrides: SessionOverrides = {}): CompletedSession {
  const { on, ...rest } = overrides;
  const completedAt = on ? on.toISOString() : (rest.completedAt ?? iso(2026, 9, 1));
  const startedAt = rest.startedAt ?? new Date(new Date(completedAt).getTime() - 90 * 60_000).toISOString();
  const id = rest.id ?? nextId("s");
  return {
    id,
    workoutId: "w_fixture",
    workoutTitle: { he: "אימון בדיקה", en: "Fixture workout" },
    source: "engine",
    role: "handler",
    startedAt,
    completedAt,
    plannedMinutes: 90,
    actualMinutes: 90,
    phasesCount: 8,
    exercisesCount: 10,
    exercisesCompleted: 10,
    throws: 60,
    catches: 30,
    roleMetrics: {},
    xpEarned: 0,
    newAchievementIds: [],
    newPersonalBestKeys: [],
    replacements: [],
    skillsTrained: ["backhand", "forehand"],
    updatedAt: completedAt,
    deletedAt: null,
    ...rest,
  };
}

export interface ResultOverrides extends Partial<ExerciseResult> {
  key?: MetricKey;
}

function metricTypeFor(key: MetricKey): MetricType {
  if (key.endsWith("_time_s")) return "time_s";
  if (key === "longest_throw_m") return "distance_m";
  if (key === "catch_streak" || key === "error_free_streak") return "streak";
  if (key === "throw_count" || key === "catch_count") return "count";
  if (key === "confidence_rating") return "rating";
  if (key.endsWith("_score")) return "score";
  return "ratio";
}

const SKILL_FOR_KEY: Partial<Record<MetricKey, Skill[]>> = {
  backhand_accuracy: ["backhand", "accuracy"],
  forehand_accuracy: ["forehand", "accuracy"],
  hammer_accuracy: ["hammer", "accuracy"],
  throw_accuracy: ["accuracy"],
  longest_throw_m: ["distance"],
  catch_streak: ["catching"],
  catch_pct: ["catching"],
  catch_moving_pct: ["catch_moving"],
  sprint_time_s: ["speed"],
  cod_time_s: ["change_of_direction"],
};

/** Ratio result: `successes` of `attempts`. Other metric types take value fields directly. */
export function makeResult(overrides: ResultOverrides = {}): ExerciseResult {
  const { key, ...rest } = overrides;
  const metricKey = key ?? rest.metricKey ?? "backhand_accuracy";
  const metricType = rest.metricType ?? metricTypeFor(metricKey);
  const recordedAt = rest.recordedAt ?? iso(2026, 9, 1);
  const base: ExerciseResult = {
    id: rest.id ?? nextId("r"),
    sessionId: rest.sessionId ?? "s_fixture",
    workoutId: rest.workoutId ?? "w_fixture",
    workoutExerciseId: rest.workoutExerciseId ?? nextId("we"),
    exerciseName: rest.exerciseName ?? { he: "תרגיל", en: "Drill" },
    phaseType: rest.phaseType ?? "throwing",
    metricKey,
    metricType,
    skills: rest.skills ?? SKILL_FOR_KEY[metricKey] ?? [],
    recordedAt,
    updatedAt: recordedAt,
    deletedAt: null,
  };
  const out = { ...base, ...rest, metricKey, metricType } as ExerciseResult;
  if (out.metricType === "ratio" && typeof out.attempts === "number" && out.attempts > 0 && typeof out.successes === "number" && out.accuracyPct === undefined) {
    out.accuracyPct = Math.round((out.successes / out.attempts) * 1000) / 10;
  }
  return out;
}

export function ratio(key: MetricKey, successes: number, attempts: number, extra: ResultOverrides = {}): ExerciseResult {
  return makeResult({ key, successes, attempts, ...extra });
}

export function makePlanned(overrides: Partial<PlannedSession> = {}): PlannedSession {
  const date = overrides.date ?? dateKey(2026, 9, 1);
  return {
    id: overrides.id ?? nextId("p"),
    planId: "plan_fixture",
    weekId: "week_fixture",
    weekIndex: 0,
    dayOfWeek: new Date(`${date}T12:00:00`).getDay(),
    date,
    time: "18:00",
    durationMinutes: 90,
    workoutId: "w_fixture",
    title: { he: "אימון מתוכנן", en: "Planned workout" },
    role: "handler",
    intensity: "medium",
    goals: ["backhand"],
    templateType: "technique",
    status: "planned",
    updatedAt: `${date}T12:00:00.000Z`,
    deletedAt: null,
    ...overrides,
  };
}

/* ------------------------------------------------------------------ */
/* Profile & settings                                                  */
/* ------------------------------------------------------------------ */

export function makeProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    id: "profile",
    name: "דנה",
    ageGroup: "adult",
    hand: "right",
    level: "intermediate",
    yearsPlaying: "1to3",
    playContext: "team",
    ultimateExperience: true,
    primaryRole: "handler",
    roleIntent: "current",
    goals: [
      { goal: "forehand", priority: 1 },
      { goal: "accuracy", priority: 2 },
    ],
    sessionsPerWeek: 3,
    trainingDays: [0, 2, 4],
    preferredTime: "18:00",
    durationMinutes: 90,
    reminders: true,
    includeFitness: true,
    participants: "solo",
    equipment: ["cones"],
    fieldSize: "medium",
    wind: "light",
    onboardingCompleted: true,
    roleHistory: [],
    createdAt: iso(2026, 8, 1),
    updatedAt: iso(2026, 8, 1),
    ...overrides,
  };
}

export function makeSettings(overrides: Partial<Settings> = {}): Settings {
  return {
    locale: "he",
    theme: "system",
    textScale: 1,
    sound: true,
    vibration: true,
    voiceCount: false,
    keepAwake: true,
    highContrastSession: true,
    aiDataSharing: { profile: true, results: true, history: true, notes: true },
    reminders: { plannedSession: true, postponedSession: true, weeklySummary: true, weeklyChallenge: true, comebackAfterBreak: true, leadMinutes: 60 },
    updatedAt: iso(2026, 8, 1),
    ...overrides,
  };
}

/* ------------------------------------------------------------------ */
/* Workout / active session                                            */
/* ------------------------------------------------------------------ */

/** WorkoutExercise built from a fixture catalog exercise (throws/catches per set come from the fixture). */
export function workoutExerciseFrom(exerciseId: string, durationMinutes: number, overrides: Partial<WorkoutExercise> = {}): WorkoutExercise {
  const ex: Exercise | undefined = getFixtureExercise(exerciseId);
  if (!ex) throw new Error(`fixture exercise not found: ${exerciseId}`);
  return {
    id: `we_${exerciseId}`,
    exerciseId: ex.id,
    name: ex.name,
    durationMinutes,
    sets: ex.sets,
    reps: ex.reps,
    restSeconds: ex.restSeconds,
    instructions: ex.instructions,
    cues: ex.cues,
    commonMistakes: ex.commonMistakes,
    successMetric: ex.successMetric,
    easierAlternative: ex.easierVersion,
    harderAlternative: ex.harderVersion,
    soloAlternative: ex.soloAlternative,
    safetyNotes: ex.safetyNotes,
    skills: ex.skills,
    equipment: ex.equipment,
    participants: ex.participants,
    diagram: ex.diagram,
    throwsPerSet: ex.throwsPerSet,
    catchesPerSet: ex.catchesPerSet,
    ...overrides,
  };
}

export function makePhase(type: PhaseType, exercises: WorkoutExercise[]): WorkoutPhase {
  return {
    id: `ph_${type}`,
    type,
    name: { he: type, en: type },
    durationMinutes: exercises.reduce((sum, e) => sum + e.durationMinutes, 0),
    goal: { he: `שלב ${type}`, en: `${type} phase` },
    exercises,
  };
}

export function makeWorkout(phases: WorkoutPhase[], overrides: Partial<Workout> = {}): Workout {
  const total = phases.reduce((sum, p) => sum + p.durationMinutes, 0);
  return {
    id: "w_fixture",
    source: "engine",
    title: { he: "אימון בדיקה", en: "Fixture workout" },
    goal: { he: "בדיקה", en: "Test" },
    targetRole: "handler",
    level: "intermediate",
    totalDurationMinutes: total,
    intensity: "medium",
    participants: "solo",
    fieldSize: "medium",
    requiredEquipment: ["cones"],
    coachMessage: { he: "בהצלחה", en: "Good luck" },
    tags: [],
    phases,
    expectedMetrics: ["backhand_accuracy", "forehand_accuracy"],
    includesFitness: false,
    includesChallenge: false,
    createdAt: iso(2026, 8, 1),
    updatedAt: iso(2026, 8, 1),
    deletedAt: null,
    ...overrides,
  };
}

export interface ActiveSessionOptions {
  id?: string;
  workout: Workout;
  startedAt: string;
  elapsedSeconds: number;
  results?: ExerciseResult[];
  completedExerciseIds?: string[];
  skippedExerciseIds?: string[];
  plannedSessionId?: string;
  role?: Role;
}

export function makeActiveSession(opts: ActiveSessionOptions): ActiveSession {
  const id = opts.id ?? nextId("as");
  const results = (opts.results ?? []).map((r) => ({ ...r, sessionId: id, workoutId: opts.workout.id }));
  const session: ActiveSession = {
    id,
    workoutId: opts.workout.id,
    workout: opts.role ? { ...opts.workout, targetRole: opts.role } : opts.workout,
    startedAt: opts.startedAt,
    phaseIndex: opts.workout.phases.length - 1,
    exerciseIndex: 0,
    setIndex: 0,
    mode: "finished",
    timer: { totalSeconds: 0, remainingSeconds: 0, running: false, lastTickAt: null },
    elapsedSeconds: opts.elapsedSeconds,
    results,
    replacements: [],
    skippedExerciseIds: opts.skippedExerciseIds ?? [],
    completedExerciseIds: opts.completedExerciseIds ?? [],
    updatedAt: opts.startedAt,
  };
  if (opts.plannedSessionId) session.plannedSessionId = opts.plannedSessionId;
  return session;
}
