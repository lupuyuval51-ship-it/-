/**
 * The editable profile model shared by the onboarding wizard and the profile page:
 * defaults, conversion from/to the API, per-step definitions and zod-based validation
 * that yields field → issue maps (localized by `validation.ts`).
 */
import {
  DEFAULT_EQUIPMENT_BY_LOCATION,
  type ActivityLevel,
  type Allergen,
  type DietaryRestriction,
  type DietType,
  type Equipment,
  type ExperienceLevel,
  type Goal,
  type InjuryArea,
  type MuscleGroup,
  type OccupationActivity,
  type Sex,
  type StressLevel,
  type TrainingLocation,
} from '@shared/constants';
import { onboardingSchema, type OnboardingInput } from '@shared/schemas/profile';
import type { AbilityBenchmarks, ProfileDTO } from '@shared/types';
import type { ZodError, ZodTypeAny } from 'zod';
import { round1 } from './units';

export interface ProfileDraft {
  ageYears: number | null;
  sex: Sex | null;
  heightCm: number | null;
  weightKg: number | null;
  experienceLevel: ExperienceLevel | null;
  /** Benchmarks; 1RMs in kg (may hold unrounded values converted from lb while editing). */
  ability: AbilityBenchmarks;
  goal: Goal | null;
  trainingLocation: TrainingLocation | null;
  equipment: Equipment[];
  daysPerWeek: number | null;
  sessionMinutes: number | null;
  preferredDays: number[];
  weeklyWorkoutGoal: number | null;
  focusMuscleGroups: MuscleGroup[];
  avoidExerciseIds: string[];
  exerciseLikes: string;
  exerciseDislikes: string;
  limitations: string;
  injuries: InjuryArea[];
  injuryNotes: string;
  dietType: DietType | null;
  allergies: Allergen[];
  dietaryRestrictions: DietaryRestriction[];
  dislikedFoods: string;
  activityLevel: ActivityLevel | null;
  occupationActivity: OccupationActivity | null;
  sleepHours: number | null;
  stressLevel: StressLevel | null;
  mealsPerDay: number | null;
}

export type DraftField = keyof ProfileDraft;

/** localStorage key of the in-progress onboarding questionnaire (cleared after submit / account deletion). */
export const ONBOARDING_DRAFT_KEY = 'fitai.onboardingDraft';

export const EMPTY_ABILITY: AbilityBenchmarks = {
  pushUpsMax: null,
  pullUpsMax: null,
  plankSeconds: null,
  squat1rmKg: null,
  bench1rmKg: null,
  deadlift1rmKg: null,
};

export const DEFAULT_DRAFT: ProfileDraft = {
  ageYears: null,
  sex: null,
  heightCm: null,
  weightKg: null,
  experienceLevel: null,
  ability: EMPTY_ABILITY,
  goal: null,
  trainingLocation: null,
  equipment: [],
  daysPerWeek: 3,
  sessionMinutes: 45,
  preferredDays: [],
  weeklyWorkoutGoal: 3,
  focusMuscleGroups: [],
  avoidExerciseIds: [],
  exerciseLikes: '',
  exerciseDislikes: '',
  limitations: '',
  injuries: [],
  injuryNotes: '',
  dietType: null,
  allergies: [],
  dietaryRestrictions: [],
  dislikedFoods: '',
  activityLevel: null,
  occupationActivity: null,
  sleepHours: null,
  stressLevel: null,
  mealsPerDay: 3,
};

/** Editable values from a stored profile (age is the age *today*). Missing answers fall back to defaults. */
export function draftFromProfile(p: ProfileDTO): ProfileDraft {
  const pick = <T>(value: T | null, fallback: T | null) => (value ?? fallback) as T | null;
  return {
    ageYears: p.currentAge,
    sex: p.sex,
    heightCm: p.heightCm,
    weightKg: p.weightKg,
    experienceLevel: p.experienceLevel,
    ability: { ...EMPTY_ABILITY, ...p.ability },
    goal: p.goal,
    trainingLocation: p.trainingLocation,
    equipment: [...p.equipment],
    daysPerWeek: pick(p.daysPerWeek, DEFAULT_DRAFT.daysPerWeek),
    sessionMinutes: pick(p.sessionMinutes, DEFAULT_DRAFT.sessionMinutes),
    preferredDays: [...p.preferredDays],
    weeklyWorkoutGoal: pick(p.weeklyWorkoutGoal, p.daysPerWeek ?? DEFAULT_DRAFT.weeklyWorkoutGoal),
    focusMuscleGroups: [...p.focusMuscleGroups],
    avoidExerciseIds: [...p.avoidExerciseIds],
    exerciseLikes: p.exerciseLikes,
    exerciseDislikes: p.exerciseDislikes,
    limitations: p.limitations,
    injuries: [...p.injuries],
    injuryNotes: p.injuryNotes,
    dietType: p.dietType,
    allergies: [...p.allergies],
    dietaryRestrictions: [...p.dietaryRestrictions],
    dislikedFoods: p.dislikedFoods,
    activityLevel: p.activityLevel,
    occupationActivity: p.occupationActivity,
    sleepHours: p.sleepHours,
    stressLevel: p.stressLevel,
    mealsPerDay: pick(p.mealsPerDay, DEFAULT_DRAFT.mealsPerDay),
  };
}

const roundOrNull = (n: number | null, fn: (x: number) => number) => (n == null ? null : fn(n));

/**
 * API payload for the given draft (or a subset of its fields): weights/heights rounded to
 * 0.1, 1RMs to whole kg. Validation runs on this payload so it matches what the server sees.
 */
export function toPayload<K extends DraftField>(draft: Pick<ProfileDraft, K>): Record<K, unknown> {
  const out: Record<string, unknown> = { ...draft };
  if ('heightCm' in draft) out.heightCm = roundOrNull(draft.heightCm as number | null, round1);
  if ('weightKg' in draft) out.weightKg = roundOrNull(draft.weightKg as number | null, round1);
  if ('ability' in draft) {
    const a = draft.ability as AbilityBenchmarks;
    out.ability = {
      ...a,
      squat1rmKg: roundOrNull(a.squat1rmKg, Math.round),
      bench1rmKg: roundOrNull(a.bench1rmKg, Math.round),
      deadlift1rmKg: roundOrNull(a.deadlift1rmKg, Math.round),
    };
  }
  return out as Record<K, unknown>;
}

/** Field (dot path) → zod issue, first issue per field. */
export interface FieldIssue {
  code: string;
  message: string;
  minimum?: number;
  maximum?: number;
  expected?: string;
  received?: string;
}
export type FieldIssues = Partial<Record<string, FieldIssue>>;

export function issuesFromZod(error: ZodError): FieldIssues {
  const out: FieldIssues = {};
  for (const issue of error.issues) {
    const path = issue.path.join('.');
    if (out[path]) continue;
    const extra = issue as unknown as { minimum?: number | bigint; maximum?: number | bigint; expected?: string; received?: string };
    out[path] = {
      code: issue.code,
      message: issue.message,
      minimum: extra.minimum != null ? Number(extra.minimum) : undefined,
      maximum: extra.maximum != null ? Number(extra.maximum) : undefined,
      expected: extra.expected,
      received: extra.received,
    };
  }
  return out;
}

/** Validates a payload with a schema; returns the parsed data or the field issues. */
export function validate<S extends ZodTypeAny>(schema: S, payload: unknown): { ok: true; data: S['_output'] } | { ok: false; issues: FieldIssues } {
  const result = schema.safeParse(payload);
  return result.success ? { ok: true, data: result.data } : { ok: false, issues: issuesFromZod(result.error) };
}

// ---------------------------------------------------------------- Onboarding steps

export const ONBOARDING_STEPS = [
  { id: 'about', fields: ['ageYears', 'sex', 'heightCm', 'weightKg'] },
  { id: 'experience', fields: ['experienceLevel', 'ability'] },
  { id: 'goal', fields: ['goal'] },
  { id: 'training', fields: ['trainingLocation', 'equipment', 'daysPerWeek', 'sessionMinutes', 'preferredDays', 'weeklyWorkoutGoal'] },
  {
    id: 'preferences',
    fields: ['focusMuscleGroups', 'exerciseLikes', 'exerciseDislikes', 'avoidExerciseIds', 'injuries', 'injuryNotes', 'limitations'],
  },
  {
    id: 'nutrition',
    fields: ['dietType', 'allergies', 'dietaryRestrictions', 'dislikedFoods', 'mealsPerDay', 'activityLevel', 'occupationActivity', 'sleepHours', 'stressLevel'],
  },
  { id: 'review', fields: [] },
] as const satisfies readonly { id: string; fields: readonly DraftField[] }[];

export type OnboardingStepId = (typeof ONBOARDING_STEPS)[number]['id'];

const fieldMask = (fields: readonly DraftField[]) => Object.fromEntries(fields.map((f) => [f, true])) as Partial<Record<DraftField, true>>;

/** Validates the fields of one wizard step. Returns issues keyed by field path (empty = valid). */
export function validateStep(index: number, draft: ProfileDraft): FieldIssues {
  const step = ONBOARDING_STEPS[index];
  if (!step || step.fields.length === 0) return {};
  const fields = step.fields as readonly DraftField[];
  const schema = onboardingSchema.pick(fieldMask(fields) as Parameters<typeof onboardingSchema.pick>[0]);
  const result = validate(schema, toPayload(draft));
  return result.ok ? {} : result.issues;
}

/** The complete, validated onboarding payload, or the issues plus the first step that has one. */
export function validateOnboarding(draft: ProfileDraft): { ok: true; data: OnboardingInput } | { ok: false; issues: FieldIssues; step: number } {
  const result = validate(onboardingSchema, toPayload(draft));
  if (result.ok) return { ok: true, data: result.data };
  return { ok: false, issues: result.issues, step: stepOfField(Object.keys(result.issues)[0] ?? '') };
}

/** Index of the wizard step that owns a field path (e.g. `ability.squat1rmKg` → experience). */
export function stepOfField(path: string): number {
  const field = path.split('.')[0];
  const index = ONBOARDING_STEPS.findIndex((s) => (s.fields as readonly string[]).includes(field ?? ''));
  return index < 0 ? 0 : index;
}

/** First field (in the given display order) that has an issue. */
export function firstInvalidField(order: readonly string[], issues: FieldIssues): string | null {
  const paths = Object.keys(issues);
  for (const field of order) if (paths.some((p) => p === field || p.startsWith(`${field}.`))) return field;
  return paths[0]?.split('.')[0] ?? null;
}

/** Location choice pre-fills the typical equipment for that location. */
export function withLocation<T extends Pick<ProfileDraft, 'trainingLocation' | 'equipment'>>(values: T, location: TrainingLocation): T {
  if (values.trainingLocation === location) return values;
  return { ...values, trainingLocation: location, equipment: [...DEFAULT_EQUIPMENT_BY_LOCATION[location]] };
}

/** Days-per-week change; the weekly goal follows it until the user sets the goal explicitly. */
export function withDaysPerWeek<T extends Pick<ProfileDraft, 'daysPerWeek' | 'weeklyWorkoutGoal'>>(values: T, days: number | null, goalTouched: boolean): T {
  return { ...values, daysPerWeek: days, weeklyWorkoutGoal: goalTouched || days == null ? values.weeklyWorkoutGoal : Math.min(7, Math.max(1, days)) };
}

/** Only the fields whose value differs from the base (for PATCH requests). */
export function changedFields<T extends object>(values: T, base: T): Partial<T> {
  const out: Partial<T> = {};
  for (const key of Object.keys(values) as (keyof T)[]) {
    if (JSON.stringify(values[key]) !== JSON.stringify(base[key])) out[key] = values[key];
  }
  return out;
}
