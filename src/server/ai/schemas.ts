/**
 * Zod schemas for /api/claude/* – request validation (strict, capped, unknown keys stripped)
 * and the structured-output shapes Claude must return.
 *
 * Output schemas deliberately avoid min/max/length constraints (not supported by structured outputs);
 * bounds are enforced after parsing in convert.ts / the routes.
 */
import { z } from "zod";
import {
  AGE_GROUPS, DURATIONS, EQUIPMENT, FIELD_SIZES, GOALS, HANDS, INTENSITIES, LEVELS, METRIC_KEYS, PARTICIPANTS, PHASE_TYPES, ROLES, ROLE_INTENTS, SKILLS, WINDS,
  YEARS_PLAYING,
} from "@/lib/types";
import type { CoachContext, WorkoutRequest } from "@/lib/types";
import { workoutExerciseSchema } from "../validation/workoutSchema";

/* ------------------------------------------------------------------ */
/* Shared pieces                                                       */
/* ------------------------------------------------------------------ */

const shortText = (max: number) => z.string().max(max);
const pctNumber = z.number().min(0).max(100);
const metricMap = z.record(z.enum(METRIC_KEYS), z.number().min(-100000).max(100000)).transform((m) => Object.fromEntries(Object.entries(m).slice(0, 20)));
const isoDate = z.string().max(40).refine((v) => !Number.isNaN(Date.parse(v)), "invalid_datetime");
const durationSchema = z.union([z.literal(DURATIONS[0]), z.literal(DURATIONS[1]), z.literal(DURATIONS[2])]);
const rating = z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]);

/* ------------------------------------------------------------------ */
/* CoachContext (client → server)                                      */
/* ------------------------------------------------------------------ */

export const coachContextSchema: z.ZodType<CoachContext, unknown> = z.object({
  locale: z.enum(["he", "en"]),
  profile: z
    .object({
      name: shortText(40).optional(),
      ageGroup: z.enum(AGE_GROUPS),
      hand: z.enum(HANDS),
      level: z.enum(LEVELS),
      yearsPlaying: z.enum(YEARS_PLAYING),
      primaryRole: z.enum(ROLES),
      secondaryRole: z.enum(ROLES).optional(),
      roleIntent: z.enum(ROLE_INTENTS),
      goals: z.array(z.enum(GOALS)).max(8),
      participants: z.enum(PARTICIPANTS),
      equipment: z.array(z.enum(EQUIPMENT)).max(8),
      fieldSize: z.enum(FIELD_SIZES),
      wind: z.enum(WINDS),
      durationMinutes: durationSchema,
      sessionsPerWeek: z.number().int().min(0).max(14),
      includeFitness: z.boolean(),
    })
    .optional(),
  roleHint: z.object({ primaryRole: z.enum(ROLES), secondaryRole: z.enum(ROLES).optional(), level: z.enum(LEVELS) }).optional(),
  stats: z
    .object({
      sessionsCompleted: z.number().int().min(0).max(100000),
      totalMinutes: z.number().min(0).max(10_000_000),
      totalThrows: z.number().min(0).max(100_000_000),
      totalCatches: z.number().min(0).max(100_000_000),
      streakDays: z.number().int().min(0).max(10000),
      level: z.number().int().min(0).max(99),
      backhandAccuracy: pctNumber.optional(),
      forehandAccuracy: pctNumber.optional(),
      hammerAccuracy: pctNumber.optional(),
      longestThrowM: z.number().min(0).max(200).optional(),
      catchStreak: z.number().min(0).max(10000).optional(),
      sprintTimeS: z.number().min(0).max(120).optional(),
      codTimeS: z.number().min(0).max(120).optional(),
      weakSkills: z.array(z.enum(SKILLS)).max(8),
      strongSkills: z.array(z.enum(SKILLS)).max(8),
      readiness: z.record(z.enum(ROLES), z.number().min(0).max(100)),
    })
    .optional(),
  recentSessions: z
    .array(
      z.object({
        date: shortText(20),
        title: shortText(80),
        minutes: z.number().min(0).max(600),
        role: z.enum(ROLES),
        accuracyPct: pctNumber.optional(),
        backhandAccuracy: pctNumber.optional(),
        forehandAccuracy: pctNumber.optional(),
        difficulty: z.number().min(1).max(5).optional(),
        feeling: z.number().min(1).max(5).optional(),
        note: shortText(160).optional(),
        keyMetrics: metricMap,
      }),
    )
    .max(5)
    .optional(),
  weeklyLoad: z.object({ sessionsThisWeek: z.number().int().min(0).max(30), minutesThisWeek: z.number().min(0).max(5000), plannedThisWeek: z.number().int().min(0).max(30) }).optional(),
  personalBests: metricMap.optional(),
  currentPlan: z.object({ weekIndex: z.number().int().min(0).max(52), weeksCount: z.number().int().min(1).max(52), weekTheme: shortText(80), role: z.enum(ROLES) }).optional(),
  checkin: z
    .object({ feeling: rating, energy: rating, pain: z.enum(["none", "mild", "sharp"]), surface: z.enum(["dry", "wet"]), wind: z.enum(WINDS) })
    .optional(),
}) as unknown as z.ZodType<CoachContext, unknown>;

/* ------------------------------------------------------------------ */
/* WorkoutRequest                                                      */
/* ------------------------------------------------------------------ */

export const workoutRequestSchema: z.ZodType<WorkoutRequest, unknown> = z.object({
  durationMinutes: durationSchema,
  role: z.enum(ROLES),
  secondaryRole: z.enum(ROLES).optional(),
  primaryGoal: z.enum(GOALS),
  secondaryGoal: z.enum(GOALS).optional(),
  intensity: z.enum(INTENSITIES),
  participants: z.enum(PARTICIPANTS),
  equipment: z.array(z.enum(EQUIPMENT)).max(8),
  fieldSize: z.enum(FIELD_SIZES),
  wind: z.enum(WINDS),
  includeFitness: z.boolean(),
  includeChallenge: z.boolean(),
  excludedSkills: z.array(z.enum(SKILLS)).max(12),
  energy: rating,
  level: z.enum(LEVELS),
  ageGroup: z.enum(AGE_GROUPS),
  hand: z.enum(HANDS),
  recentExerciseIds: z.array(z.string().max(80)).max(60).optional(),
  weakSkills: z.array(z.enum(SKILLS)).max(8).optional(),
  seed: z.string().max(80).optional(),
  templateType: z.enum(["technique", "movement_role", "game_challenge", "recovery", "mixed"]).optional(),
}) as unknown as z.ZodType<WorkoutRequest, unknown>;

/* ------------------------------------------------------------------ */
/* Sessions & results (bounded)                                        */
/* ------------------------------------------------------------------ */

const localizedIn = z.object({ he: shortText(120), en: shortText(120) });

const replacementSchema = z.object({
  at: isoDate,
  phaseId: shortText(120),
  fromExerciseId: shortText(80).optional(),
  fromName: localizedIn,
  toExerciseId: shortText(80).optional(),
  toName: localizedIn,
  reason: z.enum(["too_easy", "too_hard", "no_equipment", "alone", "pain", "other"]),
});

const checkinSchema = z.object({
  feeling: rating,
  energy: rating,
  pain: z.enum(["none", "mild", "sharp"]),
  painNote: shortText(160).optional(),
  surface: z.enum(["dry", "wet"]),
  wind: z.enum(WINDS),
  participants: z.enum(PARTICIPANTS),
  equipmentAvailable: z.boolean(),
  missingEquipment: z.array(z.enum(EQUIPMENT)).max(8).optional(),
  recordedAt: isoDate,
});

export const completedSessionSchema = z.object({
  id: shortText(120),
  workoutId: shortText(120),
  workoutTitle: localizedIn,
  source: z.enum(["library", "engine", "claude", "custom"]),
  plannedSessionId: shortText(120).optional(),
  planId: shortText(120).optional(),
  role: z.enum(ROLES),
  secondaryRole: z.enum(ROLES).optional(),
  startedAt: isoDate,
  completedAt: isoDate,
  plannedMinutes: z.number().min(0).max(600),
  actualMinutes: z.number().min(0).max(600),
  phasesCount: z.number().int().min(0).max(20),
  exercisesCount: z.number().int().min(0).max(200),
  exercisesCompleted: z.number().int().min(0).max(200),
  throws: z.number().min(0).max(100000),
  catches: z.number().min(0).max(100000),
  accuracyPct: pctNumber.optional(),
  backhandAccuracy: pctNumber.optional(),
  forehandAccuracy: pctNumber.optional(),
  hammerAccuracy: pctNumber.optional(),
  roleMetrics: metricMap,
  difficulty: rating.optional(),
  feeling: rating.optional(),
  note: shortText(160).optional(),
  xpEarned: z.number().min(0).max(100000),
  newAchievementIds: z.array(shortText(80)).max(20),
  newPersonalBestKeys: z.array(z.enum(METRIC_KEYS)).max(20),
  checkin: checkinSchema.optional(),
  replacements: z.array(replacementSchema).max(20),
  skillsTrained: z.array(z.enum(SKILLS)).max(20),
  aiSummary: shortText(700).optional(),
  updatedAt: isoDate,
  deletedAt: isoDate.nullable().optional(),
});

export const exerciseResultSchema = z.object({
  id: shortText(120),
  sessionId: shortText(120),
  workoutId: shortText(120),
  workoutExerciseId: shortText(120),
  exerciseId: shortText(80).optional(),
  exerciseName: localizedIn,
  phaseType: z.enum(PHASE_TYPES),
  metricKey: z.enum(METRIC_KEYS),
  metricType: z.enum(["ratio", "time_s", "distance_m", "count", "streak", "rating", "score"]),
  successes: z.number().min(0).max(100000).optional(),
  attempts: z.number().min(0).max(100000).optional(),
  accuracyPct: pctNumber.optional(),
  timeSeconds: z.number().min(0).max(100000).optional(),
  distanceMeters: z.number().min(0).max(1000).optional(),
  count: z.number().min(0).max(100000).optional(),
  streak: z.number().min(0).max(100000).optional(),
  rating: z.number().min(0).max(5).optional(),
  score: z.number().min(0).max(100).optional(),
  errors: z.number().min(0).max(100000).optional(),
  difficulty: rating.optional(),
  note: shortText(160).optional(),
  windy: z.boolean().optional(),
  tired: z.boolean().optional(),
  throws: z.number().min(0).max(100000).optional(),
  catches: z.number().min(0).max(100000).optional(),
  skills: z.array(z.enum(SKILLS)).max(8),
  role: z.enum(ROLES).optional(),
  recordedAt: isoDate,
  updatedAt: isoDate,
  deletedAt: isoDate.nullable().optional(),
});

/* ------------------------------------------------------------------ */
/* Route requests                                                      */
/* ------------------------------------------------------------------ */

export const chatRequestSchema = z.object({
  message: z.string().trim().min(1).max(1500),
  summary: z.string().max(1200).optional(),
  recent: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(1500) })).max(8).optional(),
  context: coachContextSchema,
});

export const generateWorkoutRequestSchema = z.object({ request: workoutRequestSchema, context: coachContextSchema });

export const analyzeSessionRequestSchema = z.object({
  session: completedSessionSchema,
  results: z.array(exerciseResultSchema).max(60),
  previous: completedSessionSchema.optional(),
  context: coachContextSchema,
});

export const generatePlanRequestSchema = z.object({
  weeksCount: z.number().int().min(1).max(16),
  context: coachContextSchema,
  baselineSummary: z.string().max(600).optional(),
});

export const weeklyReviewRequestSchema = z.object({
  weekSessions: z.array(completedSessionSchema).max(7),
  context: coachContextSchema,
});

export const replaceExerciseRequestSchema = z.object({
  exercise: workoutExerciseSchema,
  reason: z.string().trim().min(1).max(200),
  context: coachContextSchema,
  candidates: z.array(z.object({ id: z.string().min(1).max(80), name: z.string().max(120), skills: z.array(z.enum(SKILLS)).max(8) })).max(8),
});

/* ------------------------------------------------------------------ */
/* Claude structured outputs                                           */
/* ------------------------------------------------------------------ */

export const claudeChatOutputSchema = z.object({
  reply: z.string(),
  summaryUpdate: z.string(),
  suggestedActions: z.array(z.enum(["generate_workout", "replace_exercise", "add_to_plan", "none"])),
  followUpQuestion: z.string().nullable(),
});

export const claudeWorkoutExerciseSchema = z.object({
  exerciseId: z.string(),
  exerciseName: z.string(),
  durationMinutes: z.number(),
  sets: z.number(),
  repetitions: z.number(),
  restSeconds: z.number(),
  instructions: z.array(z.string()),
  coachingCues: z.array(z.string()),
  commonMistakes: z.array(z.string()),
  successMetric: z.string(),
  easierAlternative: z.string(),
  harderAlternative: z.string(),
  soloAlternative: z.string(),
  safetyNotes: z.array(z.string()),
});

export const claudeWorkoutPhaseSchema = z.object({
  phaseName: z.string(),
  phaseType: z.enum(PHASE_TYPES),
  durationMinutes: z.number(),
  goal: z.string(),
  exercises: z.array(claudeWorkoutExerciseSchema),
});

export const claudeWorkoutOutputSchema = z.object({
  workoutTitle: z.string(),
  workoutGoal: z.string(),
  targetRole: z.enum(ROLES),
  secondaryRole: z.enum(ROLES).nullable(),
  level: z.enum(LEVELS),
  totalDurationMinutes: z.number(),
  intensity: z.enum(INTENSITIES),
  participants: z.enum(PARTICIPANTS),
  fieldSize: z.enum(FIELD_SIZES),
  requiredEquipment: z.array(z.enum(EQUIPMENT)),
  coachMessage: z.string(),
  phases: z.array(claudeWorkoutPhaseSchema),
  endChallenge: z.object({ name: z.string(), description: z.string(), successMetric: z.string(), durationMinutes: z.number() }).nullable(),
  cooldown: z.object({ durationMinutes: z.number(), steps: z.array(z.string()) }),
  expectedMetrics: z.array(z.enum(METRIC_KEYS)),
});
export type ClaudeWorkoutOutput = z.infer<typeof claudeWorkoutOutputSchema>;

export const claudeAnalysisOutputSchema = z.object({
  summary: z.string(),
  nextFocus: z.array(z.string()),
});

export const claudePlanOutputSchema = z.object({
  weekThemes: z.array(z.object({ index: z.number(), theme: z.string(), goal: z.string(), focusSkills: z.array(z.enum(SKILLS)) })),
  coachMessage: z.string(),
});

export const claudeReviewOutputSchema = z.object({
  review: z.string(),
  adjustments: z.array(z.object({ kind: z.enum(["intensity", "rest", "focus", "volume"]), note: z.string() })),
});

export const claudeReplaceOutputSchema = z.object({
  choiceId: z.string(),
  rationale: z.string(),
  custom: z
    .object({
      name: z.string(),
      instructions: z.array(z.string()),
      cues: z.array(z.string()),
      commonMistakes: z.array(z.string()),
      successMetric: z.string(),
      easierAlternative: z.string(),
      harderAlternative: z.string(),
      soloAlternative: z.string(),
      safetyNotes: z.array(z.string()),
      sets: z.number(),
      reps: z.number(),
      restSeconds: z.number(),
    })
    .nullable(),
});
