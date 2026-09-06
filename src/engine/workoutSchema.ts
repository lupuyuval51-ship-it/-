/**
 * Zod schema for the shared `Workout` shape (src/lib/types.ts).
 * Used by validateWorkout() for engine output, Claude output and custom/imported workouts.
 * Structural only – the invariants (sums, phases, safety…) live in workoutEngine.validateWorkout.
 */
import { z } from "zod";
import {
  EQUIPMENT, FIELD_SIZES, INTENSITIES, LEVELS, METRIC_KEYS, PARTICIPANTS, PHASE_TYPES, ROLES, SKILLS,
  type Workout, type WorkoutExercise, type WorkoutPhase,
} from "@/lib/types";

export const LocalizedSchema = z.object({ he: z.string(), en: z.string() });

const METRIC_TYPES = ["ratio", "time_s", "distance_m", "count", "streak", "rating", "score"] as const;
const WORKOUT_SOURCES = ["library", "engine", "claude", "custom"] as const;

export const SuccessMetricSchema = z.object({
  type: z.enum(METRIC_TYPES),
  key: z.enum(METRIC_KEYS),
  label: LocalizedSchema,
  target: z.number().optional(),
  attempts: z.number().optional(),
});

const DiagramPointItem = z.object({
  type: z.enum(["cone", "player", "partner", "defender", "target", "disc", "gate", "marker"]),
  x: z.number(),
  y: z.number(),
  label: z.string().optional(),
});

const DiagramPathItem = z.object({
  type: z.enum(["run", "throw", "shuffle"]),
  from: z.tuple([z.number(), z.number()]),
  to: z.tuple([z.number(), z.number()]),
  curve: z.boolean().optional(),
  dashed: z.boolean().optional(),
  label: z.string().optional(),
});

export const DiagramSpecSchema = z.object({
  field: z.enum(["lane", "square", "half", "strip"]),
  items: z.array(z.union([DiagramPointItem, DiagramPathItem])),
});

export const WorkoutExerciseSchema = z.object({
  id: z.string().min(1),
  exerciseId: z.string().min(1).optional(),
  name: LocalizedSchema,
  durationMinutes: z.number().int().min(1),
  sets: z.number().int().min(1),
  reps: z.number().int().min(1),
  restSeconds: z.number().int().min(0),
  workSeconds: z.number().int().min(0).optional(),
  instructions: z.array(LocalizedSchema),
  cues: z.array(LocalizedSchema),
  commonMistakes: z.array(LocalizedSchema),
  successMetric: SuccessMetricSchema,
  easierAlternative: LocalizedSchema,
  harderAlternative: LocalizedSchema,
  soloAlternative: LocalizedSchema,
  safetyNotes: z.array(LocalizedSchema),
  skills: z.array(z.enum(SKILLS)),
  equipment: z.array(z.enum(EQUIPMENT)),
  participants: z.array(z.enum(PARTICIPANTS)),
  diagram: DiagramSpecSchema.optional(),
  throwsPerSet: z.number().min(0).optional(),
  catchesPerSet: z.number().min(0).optional(),
});

export const WorkoutPhaseSchema = z.object({
  id: z.string().min(1),
  type: z.enum(PHASE_TYPES),
  name: LocalizedSchema,
  durationMinutes: z.number().int().min(0),
  goal: LocalizedSchema,
  exercises: z.array(WorkoutExerciseSchema),
});

export const WorkoutSchema = z.object({
  id: z.string().min(1),
  source: z.enum(WORKOUT_SOURCES),
  title: LocalizedSchema,
  goal: LocalizedSchema,
  targetRole: z.enum(ROLES),
  secondaryRole: z.enum(ROLES).optional(),
  level: z.enum(LEVELS),
  totalDurationMinutes: z.number().int().min(1),
  intensity: z.enum(INTENSITIES),
  participants: z.enum(PARTICIPANTS),
  fieldSize: z.enum(FIELD_SIZES),
  requiredEquipment: z.array(z.enum(EQUIPMENT)),
  coachMessage: LocalizedSchema,
  tags: z.array(z.string()),
  phases: z.array(WorkoutPhaseSchema).min(1),
  expectedMetrics: z.array(z.enum(METRIC_KEYS)),
  includesFitness: z.boolean(),
  includesChallenge: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  deletedAt: z.string().nullable().optional(),
});

export type WorkoutSchemaOutput = z.infer<typeof WorkoutSchema>;

/** Compile-time guarantee that the schema output is assignable to the domain contract. */
const _exerciseCheck: WorkoutExercise = null as unknown as z.infer<typeof WorkoutExerciseSchema>;
const _phaseCheck: WorkoutPhase = null as unknown as z.infer<typeof WorkoutPhaseSchema>;
const _workoutCheck: Workout = null as unknown as WorkoutSchemaOutput;
void _exerciseCheck;
void _phaseCheck;
void _workoutCheck;

/** Parse unknown input into a Workout; returns Zod issues as readable strings on failure. */
export function parseWorkout(input: unknown): { workout?: Workout; errors: string[] } {
  const result = WorkoutSchema.safeParse(input);
  if (result.success) return { workout: result.data as Workout, errors: [] };
  const errors = result.error.issues.map((issue) => `${issue.path.map(String).join(".") || "(root)"}: ${issue.message}`);
  return { errors };
}
