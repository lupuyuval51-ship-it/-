/** Zod schemas for Workout / WorkoutExercise (admin library + Claude conversions + replace-exercise input). */
import { z } from "zod";
import { DURATIONS, EQUIPMENT, FIELD_SIZES, INTENSITIES, LEVELS, METRIC_KEYS, PARTICIPANTS, PHASE_TYPES, ROLES, SKILLS } from "@/lib/types";
import type { Workout, WorkoutExercise, WorkoutPhase } from "@/lib/types";
import { diagramSchema, successMetricSchema } from "./exerciseSchema";
import { localizedListSchema, localizedSchema } from "./localized";

const instanceId = z.string().min(1).max(120);

export const workoutExerciseSchema: z.ZodType<WorkoutExercise> = z.object({
  id: instanceId,
  exerciseId: z.string().min(1).max(80).optional(),
  name: localizedSchema(120),
  durationMinutes: z.number().int().min(1).max(90),
  sets: z.number().int().min(1).max(30),
  reps: z.number().int().min(1).max(500),
  restSeconds: z.number().int().min(0).max(900),
  workSeconds: z.number().int().min(1).max(3600).optional(),
  instructions: localizedListSchema(600, 15),
  cues: localizedListSchema(300, 10),
  commonMistakes: localizedListSchema(300, 10),
  successMetric: successMetricSchema,
  easierAlternative: localizedSchema(500),
  harderAlternative: localizedSchema(500),
  soloAlternative: localizedSchema(500),
  safetyNotes: localizedListSchema(300, 8),
  skills: z.array(z.enum(SKILLS)).max(8),
  equipment: z.array(z.enum(EQUIPMENT)).max(8),
  participants: z.array(z.enum(PARTICIPANTS)).max(3),
  diagram: diagramSchema.optional(),
  throwsPerSet: z.number().int().min(0).max(500).optional(),
  catchesPerSet: z.number().int().min(0).max(500).optional(),
});

export const workoutPhaseSchema: z.ZodType<WorkoutPhase> = z.object({
  id: instanceId,
  type: z.enum(PHASE_TYPES),
  name: localizedSchema(80),
  durationMinutes: z.number().int().min(1).max(90),
  goal: localizedSchema(400),
  exercises: z.array(workoutExerciseSchema).max(30),
});

const isoDate = z.string().max(40).refine((v) => !Number.isNaN(Date.parse(v)), "invalid_datetime");

export const workoutSchema: z.ZodType<Workout> = z.object({
  id: z.string().min(1).max(120),
  source: z.enum(["library", "engine", "claude", "custom"]),
  title: localizedSchema(120),
  goal: localizedSchema(400),
  targetRole: z.enum(ROLES),
  secondaryRole: z.enum(ROLES).optional(),
  level: z.enum(LEVELS),
  totalDurationMinutes: z.union([z.literal(DURATIONS[0]), z.literal(DURATIONS[1]), z.literal(DURATIONS[2])]),
  intensity: z.enum(INTENSITIES),
  participants: z.enum(PARTICIPANTS),
  fieldSize: z.enum(FIELD_SIZES),
  requiredEquipment: z.array(z.enum(EQUIPMENT)).max(8),
  coachMessage: localizedSchema(600),
  tags: z.array(z.string().max(40)).max(20),
  phases: z.array(workoutPhaseSchema).min(1).max(12),
  expectedMetrics: z.array(z.enum(METRIC_KEYS)).max(20),
  includesFitness: z.boolean(),
  includesChallenge: z.boolean(),
  createdAt: isoDate,
  updatedAt: isoDate,
  deletedAt: isoDate.nullable().optional(),
});

/** Structural check of the duration invariant (the engine's validateWorkout is the authority). */
export function durationIssues(w: Workout): string[] {
  const issues: string[] = [];
  const phaseSum = w.phases.reduce((s, p) => s + p.durationMinutes, 0);
  if (phaseSum !== w.totalDurationMinutes) issues.push(`phases sum ${phaseSum} != total ${w.totalDurationMinutes}`);
  for (const p of w.phases) {
    const exSum = p.exercises.reduce((s, e) => s + e.durationMinutes, 0);
    if (p.exercises.length > 0 && exSum !== p.durationMinutes) issues.push(`phase ${p.type}: exercises sum ${exSum} != ${p.durationMinutes}`);
  }
  return issues;
}
