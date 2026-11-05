import { z } from 'zod';
import {
  ACTIVITY_LEVELS, ALLERGENS, DIETARY_RESTRICTIONS, DIET_TYPES, DIFFICULTIES, EQUIPMENT, GOALS,
  INJURY_AREAS, LANGUAGES, LIMITS, MEAL_SLOTS, PLACES, SEXES, SPORTS, THEMES, UNITS, WORKOUT_MODES,
} from './enums.js';

const intIn = (min: number, max: number) => z.number().int().min(min).max(max);
const numIn = (min: number, max: number) => z.number().min(min).max(max);

/** Login name: 3-24 chars, lowercase letters/digits/_ . -, starting with a letter or digit. Case-insensitive (lowercased). */
export const UsernameSchema = z.string().trim().toLowerCase().min(3).max(24).regex(/^[a-z0-9][a-z0-9_.-]*$/);
export const PasswordSchema = z.string().min(10).max(200);
/** A real calendar date: `2026-02-31` and `2026-13-45` have the right shape but are not dates (the database would refuse them). */
export const IsoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((s) => { const t = Date.parse(`${s}T00:00:00Z`); return Number.isFinite(t) && new Date(t).toISOString().slice(0, 10) === s; }, 'invalid_date');
/** A timestamp from a backup file: parseable and in a sane range (a crafted `+275760-09-13` year would otherwise reach the database). */
const BackupInstant = z.string().max(40).refine((s) => { const t = Date.parse(s); return Number.isFinite(t) && t >= Date.UTC(2000, 0, 1) && t < Date.UTC(2100, 0, 1); }, 'invalid_timestamp');

export const RegisterBodySchema = z.object({ username: UsernameSchema, password: PasswordSchema, /** false = this browser session only (shared device); default true, as for login */ remember: z.boolean().optional() });
export const LoginBodySchema = z.object({ username: UsernameSchema, password: z.string().min(1).max(200), /** false = this browser session only (shared device) */ remember: z.boolean().optional() });

export const ProfileInputSchema = z.object({
  displayName: z.string().trim().max(60).optional(),
  language: z.enum(LANGUAGES),
  theme: z.enum(THEMES).default('system'),
  units: z.enum(UNITS).default('metric'),
  sex: z.enum(SEXES),
  age: intIn(LIMITS.age.min, LIMITS.age.max),
  heightCm: numIn(LIMITS.heightCm.min, LIMITS.heightCm.max),
  weightKg: numIn(LIMITS.weightKg.min, LIMITS.weightKg.max),
  goal: z.enum(GOALS),
  experience: z.enum(DIFFICULTIES),
  place: z.enum(PLACES),
  equipment: z.array(z.enum(EQUIPMENT)).max(EQUIPMENT.length),
  injuries: z.array(z.enum(INJURY_AREAS)).max(INJURY_AREAS.length),
  daysPerWeek: intIn(LIMITS.daysPerWeek.min, LIMITS.daysPerWeek.max),
  sessionMinutes: intIn(LIMITS.sessionMinutes.min, LIMITS.sessionMinutes.max),
  activityLevel: z.enum(ACTIVITY_LEVELS),
  diet: z.enum(DIET_TYPES).default('omnivore'),
  allergies: z.array(z.enum(ALLERGENS)).max(ALLERGENS.length).default([]),
  restrictions: z.array(z.enum(DIETARY_RESTRICTIONS)).max(DIETARY_RESTRICTIONS.length).default([]),
  customKcal: intIn(800, 6000).optional(),
});
export type ProfileInput = z.infer<typeof ProfileInputSchema>;

export const SetInputSchema = z.object({
  reps: intIn(0, LIMITS.reps.max).optional(),
  weightKg: numIn(0, 1000).optional(),
  durationSec: intIn(0, 7200).optional(),
  rpe: numIn(LIMITS.rpe.min, LIMITS.rpe.max).refine((v) => Number.isInteger(v * 2), 'rpe_step').optional(),
}).refine((t) => t.reps !== undefined || t.durationSec !== undefined, 'reps_or_duration_required'); // as when logging a set: an empty `{}` is not a set

/**
 * One food entry, as logged AND as restored: the backup uses the very limits the write routes use, so every row the app stores can be
 * restored (a stricter backup schema once made a file with one 150-character name or 0.5 g entry unrestorable as a whole).
 */
export const FoodLogInputSchema = z.object({
  loggedDate: IsoDateSchema,
  slot: z.enum(MEAL_SLOTS),
  foodId: z.string().max(80).optional(), dishId: z.string().max(80).optional(),
  name: z.string().trim().min(1).max(160),
  grams: numIn(0.1, 5000),
  kcal: numIn(0, 5000),
  proteinG: numIn(0, 500),
  carbsG: numIn(0, 1000),
  fatG: numIn(0, 500),
  estimated: z.boolean().optional(),
});

/** Exercises in one workout session: what start and "add exercise" allow, and what a backup must therefore accept. */
export const MAX_SESSION_EXERCISES = LIMITS.maxExercisesPerWorkout + 10;
/** Food log entries per day (log, copy and saved-meal log all respect it; 409 `limit_reached`, scope `food_day`): far above a real day, small enough to stay cheap. */
export const FOOD_DAY_MAX_ENTRIES = 200;
/** Per-account caps on user-created collections (409 `limit_reached`, scope `saved_meals` / `coach_threads`, when full). */
export const ACCOUNT_LIMITS = { savedMeals: 500, coachThreads: 500 } as const;
/**
 * Plausible client days relative to the server's UTC date. A local date can be one day off UTC either way (UTC-12..UTC+14).
 * Workouts and check-ins happen today; plain logging (food, weight) may be back-filled up to `backfillDays`.
 */
export const DAY_WINDOW = { pastDaysToday: 1, futureDays: 1, backfillDays: 365 } as const;

/** Hard caps on a backup, far above any real history (10 years at 5 workouts a week is ~2,600 sessions and ~60,000 sets). */
export const BACKUP_LIMITS = { sessions: 10_000, exercises: 100_000, sets: 300_000 } as const;
/** Backup payload: every collection has a hard .max() so restore cannot be used for memory DoS. */
export const BackupPayloadSchema = z.object({
  version: z.literal(1),
  exportedAt: z.string().max(40),
  profile: ProfileInputSchema.nullable(),
  bodyWeight: z.array(z.object({ loggedDate: IsoDateSchema, weightKg: numIn(LIMITS.weightKg.min, LIMITS.weightKg.max), note: z.string().max(300).optional() })).max(20000),
  foodLog: z.array(FoodLogInputSchema).max(100000),
  sessions: z.array(z.object({
    id: z.string().max(80),
    /** the workout's own name; older exports have none (restore then uses a name in the profile language) */
    name: z.string().trim().min(1).max(160).optional(),
    startedAt: BackupInstant,
    finishedAt: BackupInstant.nullable(),
    exercises: z.array(z.object({
      exerciseId: z.string().max(80),
      sport: z.enum(SPORTS).nullable(),
      isFinisher: z.boolean(),
      sets: z.array(SetInputSchema).max(LIMITS.sets.max * 3),
    })).max(MAX_SESSION_EXERCISES),
  })).max(BACKUP_LIMITS.sessions),
}).strict().superRefine((b, ctx) => {
  let exercises = 0; let sets = 0;
  for (const s of b.sessions) { exercises += s.exercises.length; for (const e of s.exercises) sets += e.sets.length; }
  if (exercises > BACKUP_LIMITS.exercises) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['sessions'], message: 'too_many_exercises' });
  if (sets > BACKUP_LIMITS.sets) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['sessions'], message: 'too_many_sets' });
});
export type BackupPayload = z.infer<typeof BackupPayloadSchema>;

/* ------------------------------------------------------------------ API bodies (shared by server and client) */
import { MEAL_SLOTS as _SLOTS } from './enums.js';

export const PrescriptionSchema = z.object({
  sets: intIn(LIMITS.sets.min, LIMITS.sets.max),
  repsMin: intIn(0, LIMITS.reps.max), repsMax: intIn(0, LIMITS.reps.max),
  rpe: numIn(LIMITS.rpe.min, LIMITS.rpe.max),
  restSec: intIn(LIMITS.restSec.min, LIMITS.restSec.max),
  loadKg: numIn(0, 1000).nullable(),
  durationSec: intIn(0, 7200).nullable(),
});

export const SessionStartSchema = z.object({
  name: z.string().trim().min(1).max(160),
  source: z.enum(['ready', 'plan', 'custom']),
  sourceId: z.string().max(120).optional(),
  sport: z.enum(SPORTS).nullable().optional(),
  localDate: IsoDateSchema,
  readiness: z.enum(['normal', 'easier', 'rest']).optional(),
  exercises: z.array(z.object({
    exerciseId: z.string().min(1).max(80),
    isFinisher: z.boolean().default(false),
    sport: z.enum(SPORTS).nullable().optional(),
    planned: PrescriptionSchema,
  })).min(1).max(MAX_SESSION_EXERCISES),
});

export const SetBodySchema = z.object({
  sessionExerciseId: z.string().min(1).max(80),
  reps: intIn(0, LIMITS.reps.max).optional(),
  weightKg: numIn(0, 1000).optional(),
  durationSec: intIn(0, 7200).optional(),
  rpe: numIn(LIMITS.rpe.min, LIMITS.rpe.max).refine((v) => Number.isInteger(v * 2), 'rpe_step').optional(),
}).refine((b) => b.reps !== undefined || b.durationSec !== undefined, { message: 'reps_or_duration_required' });

export const SessionExerciseAddSchema = z.object({
  exerciseId: z.string().min(1).max(80), planned: PrescriptionSchema, isFinisher: z.boolean().default(false), sport: z.enum(SPORTS).nullable().optional(),
});
export const SessionExerciseReplaceSchema = z.object({ exerciseId: z.string().min(1).max(80) });
export const SessionOrderSchema = z.object({ ids: z.array(z.string().min(1).max(80)).min(1).max(40) });

export const WeightBodySchema = z.object({ loggedDate: IsoDateSchema, weightKg: numIn(LIMITS.weightKg.min, LIMITS.weightKg.max), note: z.string().trim().max(300).optional() });
export const ReadinessBodySchema = z.object({
  localDate: IsoDateSchema,
  sleep: intIn(1, 5), energy: intIn(1, 5), soreness: intIn(1, 5), pain: z.boolean(),
});

export const GeneratePlanBodySchema = z.object({
  seed: z.number().int().min(0).max(2 ** 31).default(1),
  daysPerWeek: intIn(LIMITS.daysPerWeek.min, LIMITS.daysPerWeek.max).optional(),
  sessionMinutes: intIn(LIMITS.sessionMinutes.min, LIMITS.sessionMinutes.max).optional(),
  mode: z.enum(WORKOUT_MODES).optional(),
  avoidIds: z.array(z.string().max(80)).max(60).default([]),
});
/** The notes a generated plan carries (same union as `GenerationNote` in training.ts), with bounded fields. */
const NoteId = z.string().min(1).max(80);
export const GenerationNoteSchema = z.discriminatedUnion('code', [
  z.object({ code: z.literal('recovery_day_added') }),
  z.object({ code: z.literal('exercise_swapped'), from: NoteId, to: NoteId }),
  z.object({ code: z.literal('exercise_dropped'), from: NoteId }),
  z.object({ code: z.literal('time_trimmed'), removed: intIn(0, 100) }),
  z.object({ code: z.literal('minor_no_deficit') }),
  z.object({ code: z.literal('slot_unfilled'), day: z.string().min(1).max(40) }),
]);
/** A stored plan: same shape as a GeneratedPlan, every prescription valid. Saving and editing use the same schema (exercise ids are checked by the server). */
export const PlanSchema = z.object({
  days: z.array(z.object({
    day: z.string().min(1).max(40),
    exercises: z.array(z.object({ exerciseId: z.string().min(1).max(80), prescription: PrescriptionSchema })).max(LIMITS.maxExercisesPerWorkout),
    estimatedMinutes: z.number().int().min(0).max(600),
  })).min(1).max(LIMITS.maxDaysPerPlan),
  notes: z.array(GenerationNoteSchema).max(100).default([]),
});
export const SavePlanBodySchema = z.object({ name: z.string().trim().min(1).max(120), plan: PlanSchema, activate: z.boolean().default(false) });
export const PlanPatchSchema = z.object({ name: z.string().trim().min(1).max(120).optional(), archived: z.boolean().optional() });

export const FoodLogBodySchema = FoodLogInputSchema.extend({ slot: z.enum(_SLOTS), estimated: z.boolean().default(false) });
/** Copying a day onto itself would double it on every call. */
export const FoodCopyBodySchema = z.object({ fromDate: IsoDateSchema, toDate: IsoDateSchema }).refine((b) => b.fromDate !== b.toDate, { message: 'same_day', path: ['toDate'] });
export const CustomFoodBodySchema = z.object({
  name: z.string().trim().min(1).max(120),
  kcal: numIn(0, 900), proteinG: numIn(0, 100), carbsG: numIn(0, 100), fatG: numIn(0, 100), servingG: numIn(1, 1000).default(100),
  barcode: z.string().regex(/^\d{8,14}$/).optional(),
});
export const SavedMealBodySchema = z.object({
  name: z.string().trim().min(1).max(120), slot: z.enum(_SLOTS),
  items: z.array(z.object({ foodId: z.string().max(80).optional(), name: z.string().trim().min(1).max(160), grams: numIn(0.1, 5000), kcal: numIn(0, 5000), proteinG: numIn(0, 500), carbsG: numIn(0, 1000), fatG: numIn(0, 500) })).min(1).max(40),
});
export const SavedMealLogBodySchema = z.object({ loggedDate: IsoDateSchema, slot: z.enum(_SLOTS).optional() });
/** Meal photo: a JPEG (base64 always starts with "/9j/") downscaled to <= 1280 px, which is well under 1 MB; this cap leaves headroom. */
export const PHOTO_MAX_BASE64_CHARS = 4_000_000;
export const PhotoEstimateBodySchema = z.object({ jpegBase64: z.string().min(100).max(PHOTO_MAX_BASE64_CHARS).regex(/^\/9j\/[A-Za-z0-9+/]+={0,2}$/, 'not_jpeg'), lang: z.enum(LANGUAGES).default('he') });

export const CoachThreadBodySchema = z.object({ title: z.string().trim().min(1).max(120).optional() });
/** A user-chosen UI language: BCP-47-ish code (or x-<slug> for free text) + a display name restricted to letters/marks/digits/space so it is safe to embed in a prompt. */
export const UiLanguageSchema = z.object({
  code: z.string().regex(/^(?:[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8}){0,3}|x-[a-z0-9-]{1,40})$/),
  name: z.string().trim().min(1).max(60).regex(/^[\p{L}\p{M}\p{N} .'()\-]+$/u),
});
export type UiLanguage = z.infer<typeof UiLanguageSchema>;
export const TRANSLATE_MAX_KEYS = 150;
export const TranslateBodySchema = z.object({
  target: UiLanguageSchema,
  keys: z.record(z.string().min(1).max(120), z.string().max(600)).refine((o) => { const n = Object.keys(o).length; return n >= 1 && n <= TRANSLATE_MAX_KEYS; }, 'keys_count'),
});
export type TranslateBody = z.infer<typeof TranslateBodySchema>;
export const CoachMessageBodySchema = z.object({ text: z.string().trim().min(1).max(2000), lang: z.enum(LANGUAGES).default('he'), uiLanguage: UiLanguageSchema.optional() });

export const AccountDeleteBodySchema = z.object({ confirm: z.literal('DELETE') });
