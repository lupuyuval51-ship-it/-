/**
 * Validates the built-in content datasets. Run with `npm run validate:content`.
 * Optional: `--only=exercises|foods|meals` and `--file=<group>` to restrict output
 * (cross-reference checks still use the whole library).
 */
import {
  ALLERGENS,
  ANIMAL_SOURCES,
  DIFFICULTIES,
  EQUIPMENT,
  EXERCISE_CATEGORIES,
  FOOD_CATEGORIES,
  FOOD_CONTAINS,
  INJURY_AREAS,
  MEAL_TYPES,
  MOVEMENT_PATTERNS,
  MUSCLES,
  TRACKING_TYPES,
} from '../shared/constants';
import type { ExerciseSeed, FoodSeed, MealTemplateSeed } from '../shared/content';
import { EXERCISE_LIBRARY } from '../server/src/data/exercises/index';
import { FOOD_DATABASE } from '../server/src/data/foods/index';
import { MEAL_TEMPLATES } from '../server/src/data/meal-templates';

const args = new Map(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k ?? '', v ?? 'true'] as const;
  }),
);
const only = args.get('only');

const errors: string[] = [];
const warnings: string[] = [];
const HEBREW = /[֐-׿]/;
const SLUG = /^[a-z0-9]+(?:_[a-z0-9]+)*$/;
const difficultyRank = (d: string) => DIFFICULTIES.indexOf(d as (typeof DIFFICULTIES)[number]);

function checkLocalized(ctx: string, field: string, value: { en: string; he: string } | undefined, min = 2) {
  if (!value) return errors.push(`${ctx}: missing ${field}`);
  if (!value.en || value.en.trim().length < min) errors.push(`${ctx}: ${field}.en empty`);
  if (!value.he || !HEBREW.test(value.he)) errors.push(`${ctx}: ${field}.he must contain Hebrew text`);
}

function checkList(ctx: string, field: string, value: { en: string[]; he: string[] } | undefined, min: number, max: number) {
  if (!value) return errors.push(`${ctx}: missing ${field}`);
  const { en, he } = value;
  if (!Array.isArray(en) || !Array.isArray(he)) return errors.push(`${ctx}: ${field} must have en/he arrays`);
  if (en.length < min || en.length > max) errors.push(`${ctx}: ${field}.en has ${en.length} items (expected ${min}-${max})`);
  if (en.length !== he.length) errors.push(`${ctx}: ${field} en/he length mismatch (${en.length} vs ${he.length})`);
  en.forEach((s, i) => { if (!s || s.trim().length < 3) errors.push(`${ctx}: ${field}.en[${i}] empty`); });
  he.forEach((s, i) => { if (!s || !HEBREW.test(s)) errors.push(`${ctx}: ${field}.he[${i}] must contain Hebrew`); });
}

function inEnum<T extends readonly string[]>(ctx: string, field: string, list: T, value: string) {
  if (!list.includes(value)) errors.push(`${ctx}: ${field} "${value}" is not a valid value`);
}

function validateExercises(list: ExerciseSeed[]) {
  const ids = new Set<string>();
  for (const e of list) {
    const ctx = `exercise ${e.id}`;
    if (!SLUG.test(e.id)) errors.push(`${ctx}: id must be snake_case`);
    if (ids.has(e.id)) errors.push(`${ctx}: duplicate id`);
    ids.add(e.id);
  }
  for (const e of list) {
    const ctx = `exercise ${e.id}`;
    checkLocalized(ctx, 'name', e.name);
    checkLocalized(ctx, 'description', e.description, 20);
    checkList(ctx, 'instructions', e.instructions, 4, 8);
    checkList(ctx, 'mistakes', e.mistakes, 3, 6);
    checkList(ctx, 'safety', e.safety, 2, 5);
    if (!e.primaryMuscles?.length) errors.push(`${ctx}: needs at least one primary muscle`);
    e.primaryMuscles?.forEach((m) => inEnum(ctx, 'primaryMuscles', MUSCLES, m));
    e.secondaryMuscles?.forEach((m) => inEnum(ctx, 'secondaryMuscles', MUSCLES, m));
    e.secondaryMuscles?.forEach((m) => { if (e.primaryMuscles.includes(m)) errors.push(`${ctx}: ${m} listed as both primary and secondary`); });
    e.equipment?.forEach((q) => inEnum(ctx, 'equipment', EQUIPMENT, q));
    if (new Set(e.equipment).size !== e.equipment.length) errors.push(`${ctx}: duplicate equipment`);
    inEnum(ctx, 'category', EXERCISE_CATEGORIES, e.category);
    inEnum(ctx, 'movementPattern', MOVEMENT_PATTERNS, e.movementPattern);
    inEnum(ctx, 'difficulty', DIFFICULTIES, e.difficulty);
    inEnum(ctx, 'trackingType', TRACKING_TYPES, e.trackingType);
    e.contraindications?.forEach((c) => inEnum(ctx, 'contraindications', INJURY_AREAS, c));
    if (e.trackingType === 'weight_reps') {
      if (!e.equipment.length) errors.push(`${ctx}: weight_reps exercises must require equipment`);
      if (e.loadIncrementKg == null || e.loadIncrementKg <= 0 || e.loadIncrementKg > 10) errors.push(`${ctx}: weight_reps exercises need loadIncrementKg in (0,10]`);
    }
    if (e.category === 'machine' && !e.equipment.some((q) => q.endsWith('_machine'))) errors.push(`${ctx}: machine category requires a *_machine equipment`);
    if (e.category === 'cable' && !e.equipment.includes('cable_machine')) errors.push(`${ctx}: cable category requires cable_machine`);
    if (e.category === 'band' && !e.equipment.includes('resistance_bands')) errors.push(`${ctx}: band category requires resistance_bands`);
    const loadEquipment = e.equipment.filter((q) => ['barbell', 'dumbbells', 'kettlebell', 'ez_bar'].includes(q) || q.endsWith('_machine'));
    if ((e.category === 'bodyweight' || e.category === 'calisthenics') && loadEquipment.length) {
      warnings.push(`${ctx}: ${e.category} category but requires ${loadEquipment.join(',')}`);
    }
    for (const [field, alts, cmp] of [
      ['easierAlternatives', e.easierAlternatives, (a: number, b: number) => a <= b],
      ['harderAlternatives', e.harderAlternatives, (a: number, b: number) => a >= b],
    ] as const) {
      for (const alt of alts ?? []) {
        if (alt === e.id) errors.push(`${ctx}: ${field} references itself`);
        const other = list.find((x) => x.id === alt);
        if (!other) { errors.push(`${ctx}: ${field} references unknown id "${alt}"`); continue; }
        if (!cmp(difficultyRank(other.difficulty), difficultyRank(e.difficulty))) {
          errors.push(`${ctx}: ${field} "${alt}" has difficulty ${other.difficulty} vs ${e.difficulty}`);
        }
      }
    }
    if (!e.easierAlternatives?.length && !e.harderAlternatives?.length && e.category !== 'mobility') {
      warnings.push(`${ctx}: has no alternatives`);
    }
  }
  return ids;
}

function validateFoods(list: FoodSeed[]) {
  const slugs = new Set<string>();
  for (const f of list) {
    const ctx = `food ${f.slug}`;
    if (!SLUG.test(f.slug)) errors.push(`${ctx}: slug must be snake_case`);
    if (slugs.has(f.slug)) errors.push(`${ctx}: duplicate slug`);
    slugs.add(f.slug);
    checkLocalized(ctx, 'name', f.name);
    checkLocalized(ctx, 'serving.label', f.serving?.label, 1);
    inEnum(ctx, 'category', FOOD_CATEGORIES, f.category);
    inEnum(ctx, 'animalSource', ANIMAL_SOURCES, f.animalSource);
    f.allergens.forEach((a) => inEnum(ctx, 'allergens', ALLERGENS, a));
    f.contains.forEach((c) => inEnum(ctx, 'contains', FOOD_CONTAINS, c));
    const n = f.per100g;
    for (const [k, v] of Object.entries(n)) {
      if (typeof v !== 'number' || !Number.isFinite(v) || v < 0) errors.push(`${ctx}: per100g.${k} must be a non-negative number`);
    }
    // carbs are TOTAL carbohydrate (fiber included), so fiber must not be added again.
    if (n.protein + n.carbs + n.fat > 101) errors.push(`${ctx}: macros exceed 100 g per 100 g`);
    if (n.fiber > n.carbs + 0.5) errors.push(`${ctx}: fiber (${n.fiber}) exceeds total carbs (${n.carbs})`);
    if (n.sugar > n.carbs + 0.5) errors.push(`${ctx}: sugar (${n.sugar}) exceeds carbs (${n.carbs})`);
    if (n.kcal > 900) errors.push(`${ctx}: kcal ${n.kcal} > 900 per 100 g is impossible`);
    // Atwater consistency (fiber counted at ~2 kcal/g; alcohol supplies the remainder for drinks).
    const atwater = 4 * n.protein + 4 * Math.max(0, n.carbs - n.fiber) + 2 * n.fiber + 9 * n.fat;
    const hasAlcohol = f.contains.includes('alcohol');
    if (!hasAlcohol && n.kcal > 20) {
      const ratio = atwater / n.kcal;
      if (ratio < 0.85 || ratio > 1.15) errors.push(`${ctx}: kcal ${n.kcal} inconsistent with macros (Atwater ≈ ${atwater.toFixed(0)})`);
    } else if (!hasAlcohol && Math.abs(atwater - n.kcal) > 8) {
      errors.push(`${ctx}: kcal ${n.kcal} inconsistent with macros (Atwater ≈ ${atwater.toFixed(0)})`);
    }
    if (!f.serving || f.serving.grams <= 0 || f.serving.grams > 1000) errors.push(`${ctx}: serving.grams must be in (0,1000]`);
    // Allergen / animal-source coherence.
    if (f.allergens.includes('dairy') && f.animalSource === 'none') errors.push(`${ctx}: dairy allergen but animalSource none`);
    if (f.allergens.includes('egg') && f.animalSource === 'none') errors.push(`${ctx}: egg allergen but animalSource none`);
    if ((f.allergens.includes('fish') || f.allergens.includes('shellfish')) && !['fish', 'meat'].includes(f.animalSource)) {
      errors.push(`${ctx}: fish/shellfish allergen requires animalSource fish or meat`);
    }
    if (f.allergens.includes('shellfish') && !f.contains.includes('shellfish')) errors.push(`${ctx}: shellfish allergen must also be flagged in contains`);
    if (f.allergens.includes('gluten') !== f.contains.includes('gluten')) errors.push(`${ctx}: gluten allergen and contains.gluten must match`);
  }
  return slugs;
}

function validateMeals(list: MealTemplateSeed[], foodSlugs: Set<string>) {
  const slugs = new Set<string>();
  for (const m of list) {
    const ctx = `meal ${m.slug}`;
    if (!SLUG.test(m.slug)) errors.push(`${ctx}: slug must be snake_case`);
    if (slugs.has(m.slug)) errors.push(`${ctx}: duplicate slug`);
    slugs.add(m.slug);
    checkLocalized(ctx, 'name', m.name);
    checkLocalized(ctx, 'description', m.description, 10);
    if (!m.mealTypes.length) errors.push(`${ctx}: needs at least one meal type`);
    m.mealTypes.forEach((t) => inEnum(ctx, 'mealTypes', MEAL_TYPES, t));
    if (m.items.length < 2) errors.push(`${ctx}: needs at least two items`);
    for (const it of m.items) {
      if (!foodSlugs.has(it.foodSlug)) errors.push(`${ctx}: unknown food "${it.foodSlug}"`);
      if (!(it.grams > 0 && it.grams <= 600)) errors.push(`${ctx}: item ${it.foodSlug} grams ${it.grams} out of range`);
    }
  }
}

let exerciseIds = new Set<string>();
let foodSlugs = new Set<string>();
if (!only || only === 'exercises') exerciseIds = validateExercises(EXERCISE_LIBRARY);
if (!only || only === 'foods' || only === 'meals') foodSlugs = validateFoods(FOOD_DATABASE);
if (!only || only === 'meals') validateMeals(MEAL_TEMPLATES, foodSlugs);

const filter = args.get('file');
const show = (list: string[]) => (filter ? list.filter((l) => l.includes(filter)) : list);
for (const w of show(warnings)) console.warn(`warn: ${w}`);
for (const e of show(errors)) console.error(`error: ${e}`);
console.log(
  `content: ${EXERCISE_LIBRARY.length} exercises, ${FOOD_DATABASE.length} foods, ${MEAL_TEMPLATES.length} meal templates — ` +
    `${errors.length} error(s), ${warnings.length} warning(s)`,
);
if (exerciseIds.size === 0 && (!only || only === 'exercises')) console.warn('warn: exercise library is empty');
process.exit(errors.length ? 1 : 0);
