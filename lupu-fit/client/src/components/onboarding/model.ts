import {
  ACTIVITY_LEVELS, ALLERGENS, DIET_TYPES, DIETARY_RESTRICTIONS, DIFFICULTIES, EQUIPMENT, GOALS, INJURY_AREAS, LANGUAGES, LIMITS, PLACES, SEXES, THEMES, UNITS,
  ProfileInputSchema, computeNutrition,
  type ActivityLevel, type Allergen, type DietaryRestriction, type DietType, type Difficulty, type Equipment, type Goal, type InjuryArea, type Language, type NutritionTargets,
  type Place, type ProfileInput, type Sex, type Theme, type Units,
} from '@lupu-fit/shared';

export const STEP_IDS = ['about', 'experience', 'goal', 'training', 'preferences', 'nutrition', 'review'] as const;
export type StepId = (typeof STEP_IDS)[number];

/** Form state. Numbers are nullable while the user is typing; `toProfileInput` only succeeds on a valid draft. */
export interface DraftData {
  displayName: string; sex: Sex; age: number | null; heightCm: number | null; weightKg: number | null;
  experience: Difficulty; injuries: InjuryArea[]; goal: Goal;
  place: Place; equipment: Equipment[]; daysPerWeek: number; sessionMinutes: number;
  language: Language; theme: Theme; units: Units;
  activityLevel: ActivityLevel; diet: DietType; allergies: Allergen[]; restrictions: DietaryRestriction[]; customKcal: number | null;
}

/** Equipment chips (everything except the "none" sentinel); empty selection means bodyweight / no gear. */
export const GEAR_OPTIONS: Equipment[] = EQUIPMENT.filter((e) => e !== 'none');
export const DEFAULT_EQUIPMENT: Record<Place, Equipment[]> = {
  gym: [],
  home: ['dumbbell', 'resistance_band', 'pullup_bar'],
  park: ['pullup_bar', 'dip_station'],
};

export function defaultDraft(language: Language, theme: Theme = 'dark'): DraftData {
  return {
    displayName: '', sex: 'unspecified', age: 25, heightCm: 170, weightKg: 70,
    experience: 'beginner', injuries: [], goal: 'general_fitness',
    place: 'gym', equipment: [], daysPerWeek: 3, sessionMinutes: 45,
    language, theme, units: 'metric',
    activityLevel: 'light', diet: 'omnivore', allergies: [], restrictions: [], customKcal: null,
  };
}

export function draftFromProfile(p: ProfileInput): DraftData {
  return {
    displayName: p.displayName ?? '', sex: p.sex, age: p.age, heightCm: p.heightCm, weightKg: p.weightKg,
    experience: p.experience, injuries: [...p.injuries], goal: p.goal,
    place: p.place, equipment: [...p.equipment], daysPerWeek: p.daysPerWeek, sessionMinutes: p.sessionMinutes,
    language: p.language, theme: p.theme, units: p.units,
    activityLevel: p.activityLevel, diet: p.diet, allergies: [...p.allergies], restrictions: [...p.restrictions], customKcal: p.customKcal ?? null,
  };
}

const num = (v: unknown, fallback: number | null): number | null => (v === null ? null : typeof v === 'number' && Number.isFinite(v) ? v : fallback);
const oneOf = <T extends string>(list: readonly T[], v: unknown, fallback: T): T => (typeof v === 'string' && (list as readonly string[]).includes(v) ? (v as T) : fallback);
const many = <T extends string>(list: readonly T[], v: unknown): T[] => (Array.isArray(v) ? v.filter((x): x is T => typeof x === 'string' && (list as readonly string[]).includes(x)) : []);

/** Merge untrusted stored data over a base so an old/corrupted draft can never crash the wizard. */
export function sanitizeDraft(raw: Record<string, unknown>, base: DraftData): DraftData {
  return {
    displayName: typeof raw['displayName'] === 'string' ? raw['displayName'].slice(0, 60) : base.displayName,
    sex: oneOf(SEXES, raw['sex'], base.sex), age: num(raw['age'], base.age), heightCm: num(raw['heightCm'], base.heightCm), weightKg: num(raw['weightKg'], base.weightKg),
    experience: oneOf(DIFFICULTIES, raw['experience'], base.experience), injuries: many(INJURY_AREAS, raw['injuries']), goal: oneOf(GOALS, raw['goal'], base.goal),
    place: oneOf(PLACES, raw['place'], base.place), equipment: many(GEAR_OPTIONS, raw['equipment']),
    daysPerWeek: num(raw['daysPerWeek'], base.daysPerWeek) ?? base.daysPerWeek, sessionMinutes: num(raw['sessionMinutes'], base.sessionMinutes) ?? base.sessionMinutes,
    language: oneOf(LANGUAGES, raw['language'], base.language), theme: oneOf(THEMES, raw['theme'], base.theme), units: oneOf(UNITS, raw['units'], base.units),
    activityLevel: oneOf(ACTIVITY_LEVELS, raw['activityLevel'], base.activityLevel), diet: oneOf(DIET_TYPES, raw['diet'], base.diet),
    allergies: many(ALLERGENS, raw['allergies']), restrictions: many(DIETARY_RESTRICTIONS, raw['restrictions']), customKcal: num(raw['customKcal'], base.customKcal),
  };
}

export type FieldErrors = Partial<Record<'age' | 'heightCm' | 'weightKg' | 'daysPerWeek' | 'sessionMinutes' | 'customKcal', string>>;
/** Error values are i18n keys. */
export function stepErrors(d: DraftData, step: StepId): FieldErrors {
  const e: FieldErrors = {};
  const out = (v: number | null, min: number, max: number) => v === null || v < min || v > max;
  if (step === 'about') {
    if (d.age === null) e.age = 'onboarding.err.ageRequired';
    else if (d.age < LIMITS.age.min) e.age = 'onboarding.err.ageTooLow';
    else if (d.age > LIMITS.age.max) e.age = 'onboarding.err.ageTooHigh';
    if (out(d.heightCm, LIMITS.heightCm.min, LIMITS.heightCm.max)) e.heightCm = 'onboarding.err.height';
    if (out(d.weightKg, LIMITS.weightKg.min, LIMITS.weightKg.max)) e.weightKg = 'onboarding.err.weight';
  }
  if (step === 'training') {
    if (out(d.daysPerWeek, LIMITS.daysPerWeek.min, LIMITS.daysPerWeek.max)) e.daysPerWeek = 'onboarding.err.days';
    if (out(d.sessionMinutes, LIMITS.sessionMinutes.min, LIMITS.sessionMinutes.max)) e.sessionMinutes = 'onboarding.err.minutes';
  }
  if (step === 'nutrition' && d.customKcal !== null && (d.customKcal < 800 || d.customKcal > 6000 || !Number.isInteger(d.customKcal))) e.customKcal = 'onboarding.err.kcal';
  return e;
}
export const hasErrors = (e: FieldErrors): boolean => Object.keys(e).length > 0;

export function toProfileInput(d: DraftData): ProfileInput {
  const name = d.displayName.trim();
  return ProfileInputSchema.parse({
    ...(name ? { displayName: name } : {}),
    language: d.language, theme: d.theme, units: d.units, sex: d.sex, age: d.age, heightCm: d.heightCm, weightKg: d.weightKg,
    goal: d.goal, experience: d.experience, place: d.place, equipment: d.place === 'gym' ? [] : d.equipment, injuries: d.injuries,
    daysPerWeek: d.daysPerWeek, sessionMinutes: d.sessionMinutes, activityLevel: d.activityLevel, diet: d.diet, allergies: d.allergies, restrictions: d.restrictions,
    ...(d.customKcal !== null ? { customKcal: d.customKcal } : {}),
  });
}

/** Live nutrition for the review step; null while age/height/weight are not valid. */
export function reviewNutrition(d: DraftData): NutritionTargets | null {
  if (hasErrors(stepErrors(d, 'about'))) return null;
  const customOk = d.customKcal !== null && !hasErrors(stepErrors(d, 'nutrition'));
  return computeNutrition({ sex: d.sex, age: d.age as number, heightCm: d.heightCm as number, weightKg: d.weightKg as number, goal: d.goal, activity: d.activityLevel, ...(customOk ? { customKcal: d.customKcal as number } : {}) });
}
