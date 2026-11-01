/** Clinical nutrition math: Mifflin-St Jeor, safe floors, macros, trend suggestions. Pure. */
import type { ActivityLevel, AgeBucket, Goal, Sex } from './enums.js';
import { ageBucket } from './age.js';

export const ACTIVITY_MULTIPLIER: Record<ActivityLevel, number> = {
  sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9,
};
export const KCAL_FLOOR: Record<Sex, number> = { male: 1500, female: 1200, unspecified: 1350 };
export const CARB_FLOOR_G = 130;
export const PROTEIN_G_PER_KG: Record<Goal, number> = {
  muscle_gain: 1.8, strength: 1.8, fat_loss: 2.0, athletic_performance: 1.6, general_fitness: 1.4,
};

export function bmr(sex: Sex, weightKg: number, heightCm: number, age: number): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === 'male' ? base + 5 : sex === 'female' ? base - 161 : base - 78;
}

export function tdee(bmrKcal: number, activity: ActivityLevel): number {
  return bmrKcal * ACTIVITY_MULTIPLIER[activity];
}

export function bmi(weightKg: number, heightCm: number): number {
  const m = heightCm / 100;
  return weightKg / (m * m);
}

/** Protein reference weight: actual weight, or adjusted weight when BMI > 30. */
export function proteinReferenceWeightKg(weightKg: number, heightCm: number): number {
  if (bmi(weightKg, heightCm) <= 30) return weightKg;
  const ideal = 25 * (heightCm / 100) ** 2;
  return ideal + 0.25 * (weightKg - ideal);
}

export type NutritionNote =
  | 'minor_no_deficit' | 'floor_applied' | 'custom_clamped' | 'carb_floor_raised_kcal' | 'bmi_adjusted_protein' | 'deficit_capped_at_bmr';

export interface NutritionInput {
  sex: Sex; age: number; heightCm: number; weightKg: number;
  goal: Goal; activity: ActivityLevel;
  customKcal?: number | undefined;
  highVolumeAthlete?: boolean | undefined;
}

export interface NutritionTargets {
  bmr: number; tdee: number; kcal: number; proteinG: number; carbsG: number; fatG: number;
  bucket: AgeBucket; notes: NutritionNote[];
}

/** Applies every hard floor. Used for BOTH computed targets and custom user overrides. */
export function clampKcal(kcal: number, sex: Sex, bucket: AgeBucket, tdeeKcal: number, notes: NutritionNote[]): number {
  let out = kcal;
  if (bucket === 'minor') {
    const floor = Math.round(tdeeKcal);
    if (out < floor) { out = floor; notes.push('minor_no_deficit'); }
    return Math.round(out);
  }
  if (out < KCAL_FLOOR[sex]) { out = KCAL_FLOOR[sex]; notes.push('floor_applied'); }
  return Math.round(out);
}

export function computeNutrition(i: NutritionInput): NutritionTargets {
  const bucket = ageBucket(i.age);
  const notes: NutritionNote[] = [];
  const b = bmr(i.sex, i.weightKg, i.heightCm, i.age);
  const t = tdee(b, i.activity);

  let target = t;
  switch (i.goal) {
    case 'fat_loss': {
      if (bucket === 'minor') { target = t; notes.push('minor_no_deficit'); break; }
      const deficit = Math.min(500, t * 0.2);
      target = t - deficit;
      if (target < b) { target = b; notes.push('deficit_capped_at_bmr'); }
      break;
    }
    case 'muscle_gain': target = t + Math.min(350, Math.max(200, t * 0.1)); break;
    case 'strength': target = t + Math.min(250, t * 0.05); break;
    case 'athletic_performance': target = t + (i.highVolumeAthlete ? Math.min(150, t * 0.05) : 0); break;
    case 'general_fitness': target = t; break;
  }

  let kcal: number;
  if (i.customKcal !== undefined) {
    const before = Math.round(i.customKcal);
    kcal = clampKcal(before, i.sex, bucket, t, notes);
    if (kcal !== before) notes.push('custom_clamped');
  } else {
    kcal = clampKcal(target, i.sex, bucket, t, notes);
  }

  const refW = proteinReferenceWeightKg(i.weightKg, i.heightCm);
  if (refW !== i.weightKg) notes.push('bmi_adjusted_protein');
  let proteinG = Math.round(PROTEIN_G_PER_KG[i.goal] * refW);
  let fatG = Math.round((kcal * 0.275) / 9);
  let carbsG = Math.round((kcal - proteinG * 4 - fatG * 9) / 4);

  if (carbsG < CARB_FLOOR_G) {
    // 1) fat to its 25% floor, 2) protein down to 1.2 g/kg, 3) raise kcal (never lowers it, so floors stay valid).
    fatG = Math.round((kcal * 0.25) / 9);
    carbsG = Math.round((kcal - proteinG * 4 - fatG * 9) / 4);
    if (carbsG < CARB_FLOOR_G) {
      proteinG = Math.max(Math.round(1.2 * refW), Math.min(proteinG, Math.round((kcal - fatG * 9 - CARB_FLOOR_G * 4) / 4)));
      carbsG = Math.round((kcal - proteinG * 4 - fatG * 9) / 4);
    }
    if (carbsG < CARB_FLOOR_G) {
      carbsG = CARB_FLOOR_G;
      kcal = Math.round(proteinG * 4 + fatG * 9 + carbsG * 4);
      notes.push('carb_floor_raised_kcal');
    }
  }
  return { bmr: Math.round(b), tdee: Math.round(t), kcal, proteinG, carbsG, fatG, bucket, notes };
}

/* ----------------------------------------------------- weight-trend nudge */

export interface WeightPoint { date: string; weightKg: number }
export interface TrendSuggestion { deltaKcal: -150 | 150; reason: 'loss_too_slow' | 'loss_too_fast' | 'gain_too_slow' | 'gain_too_fast' }

/** Exponentially smoothed series (alpha 0.3), input sorted ascending by date internally. */
export function smoothWeights(points: readonly WeightPoint[], alpha = 0.3): WeightPoint[] {
  const sorted = [...points].sort((a, b) => a.date.localeCompare(b.date));
  const out: WeightPoint[] = [];
  let ema: number | null = null;
  for (const p of sorted) {
    ema = ema === null ? p.weightKg : alpha * p.weightKg + (1 - alpha) * ema;
    out.push({ date: p.date, weightKg: Math.round(ema * 100) / 100 });
  }
  return out;
}

const DAY_MS = 86_400_000;

/**
 * Suggest-only ±150 kcal adjustment. Returns null when data is insufficient (<3 entries or <14 days)
 * or when applying it would breach a floor or create a deficit for a minor.
 */
export function suggestTrendAdjustment(
  points: readonly WeightPoint[], goal: Goal, currentKcal: number, sex: Sex, age: number,
): TrendSuggestion | null {
  if (points.length < 3) return null;
  const s = smoothWeights(points);
  const first = s[0]; const last = s[s.length - 1];
  if (!first || !last) return null;
  const days = (Date.parse(last.date) - Date.parse(first.date)) / DAY_MS;
  if (!(days >= 14)) return null;
  const pctPerWeek = ((last.weightKg - first.weightKg) / first.weightKg) * 100 / (days / 7);
  const bucket = ageBucket(age);
  const canCut = (bucket !== 'minor') && currentKcal - 150 >= KCAL_FLOOR[sex];

  if (goal === 'fat_loss') {
    if (pctPerWeek > -0.25) return canCut ? { deltaKcal: -150, reason: 'loss_too_slow' } : null;
    if (pctPerWeek < -1.0) return { deltaKcal: 150, reason: 'loss_too_fast' };
  } else if (goal === 'muscle_gain') {
    if (pctPerWeek < 0.1) return { deltaKcal: 150, reason: 'gain_too_slow' };
    if (pctPerWeek > 0.5) return canCut ? { deltaKcal: -150, reason: 'gain_too_fast' } : null;
  }
  return null;
}
