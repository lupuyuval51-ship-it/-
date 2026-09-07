/** Zod schema for a catalog `Exercise` (admin API + overrides). Mirrors src/lib/types.ts. */
import { z } from "zod";
import {
  AGE_GROUPS, EQUIPMENT, EXERCISE_CATEGORIES, FIELD_SIZES, INTENSITIES, LEVELS, METRIC_KEYS, OFFENSE_DEFENSE, PARTICIPANTS, PHASE_TYPES, ROLES, SKILLS,
  WIND_SUITABILITY,
} from "@/lib/types";
import type { Exercise } from "@/lib/types";
import { localizedListSchema, localizedSchema } from "./localized";

export const idSchema = z.string().min(2).max(80).regex(/^[a-z0-9][a-z0-9_-]*$/, "id must be lowercase letters, digits, - or _");

const pointItem = z.object({
  type: z.enum(["cone", "player", "partner", "defender", "target", "disc", "gate", "marker"]),
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
  label: z.string().max(20).optional(),
});
const lineItem = z.object({
  type: z.enum(["run", "throw", "shuffle"]),
  from: z.tuple([z.number().min(0).max(100), z.number().min(0).max(100)]),
  to: z.tuple([z.number().min(0).max(100), z.number().min(0).max(100)]),
  curve: z.boolean().optional(),
  dashed: z.boolean().optional(),
  label: z.string().max(20).optional(),
});

export const diagramSchema = z.object({
  field: z.enum(["lane", "square", "half", "strip"]),
  items: z.array(z.union([pointItem, lineItem])).max(40),
});

export const successMetricSchema = z.object({
  type: z.enum(["ratio", "time_s", "distance_m", "count", "streak", "rating", "score"]),
  key: z.enum(METRIC_KEYS),
  label: localizedSchema(120),
  target: z.number().min(0).max(100000).optional(),
  attempts: z.number().int().min(1).max(1000).optional(),
});

export const exerciseSchema: z.ZodType<Exercise> = z
  .object({
    id: idSchema,
    name: localizedSchema(80),
    category: z.enum(EXERCISE_CATEGORIES),
    skills: z.array(z.enum(SKILLS)).min(1).max(8),
    roles: z.array(z.enum(ROLES)).max(7),
    levels: z.array(z.enum(LEVELS)).min(1).max(3),
    phases: z.array(z.enum(PHASE_TYPES)).min(1).max(8),
    goal: localizedSchema(400),
    participants: z.array(z.enum(PARTICIPANTS)).min(1).max(3),
    equipment: z.array(z.enum(EQUIPMENT)).max(8),
    optionalEquipment: z.array(z.enum(EQUIPMENT)).max(8).optional(),
    fieldSizes: z.array(z.enum(FIELD_SIZES)).min(1).max(7),
    intensity: z.enum(INTENSITIES),
    offenseDefense: z.enum(OFFENSE_DEFENSE),
    wind: z.enum(WIND_SUITABILITY),
    ageGroups: z.array(z.enum(AGE_GROUPS)).min(1).max(4),
    durationMinutes: z.number().int().min(1).max(60),
    minDurationMinutes: z.number().int().min(1).max(60),
    maxDurationMinutes: z.number().int().min(1).max(90),
    sets: z.number().int().min(1).max(20),
    reps: z.number().int().min(1).max(200),
    restSeconds: z.number().int().min(0).max(600),
    workSeconds: z.number().int().min(1).max(3600).optional(),
    setup: localizedSchema(800),
    instructions: localizedListSchema(600, 12).min(1),
    cues: localizedListSchema(300, 10),
    commonMistakes: localizedListSchema(300, 10),
    successMetric: successMetricSchema,
    easierVersion: localizedSchema(400),
    harderVersion: localizedSchema(400),
    soloAlternative: localizedSchema(500),
    soloAlternativeId: idSchema.optional(),
    partnerAlternative: localizedSchema(500),
    safetyNotes: localizedListSchema(300, 8),
    diagram: diagramSchema,
    throwsPerSet: z.number().int().min(0).max(500).optional(),
    catchesPerSet: z.number().int().min(0).max(500).optional(),
  })
  .refine((e) => e.minDurationMinutes <= e.durationMinutes && e.durationMinutes <= e.maxDurationMinutes, { message: "duration bounds", path: ["durationMinutes"] });
