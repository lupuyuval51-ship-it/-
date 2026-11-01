#!/usr/bin/env tsx
/**
 * npm run validate:content            → full strict validation (exact counts + cross-references)
 * npm run validate:content -- --slice exercises/chest   → validate one authored file (no count checks)
 */
import { pathToFileURL } from 'node:url';
import { join, resolve } from 'node:path';
import {
  ACHIEVEMENT_IDS, ALLERGENS, DIETARY_RESTRICTIONS, DIET_TYPES, DIFFICULTIES, EQUIPMENT, EXERCISE_CATEGORIES, INJURY_AREAS,
  MEAL_SLOTS, MOVEMENT_PATTERNS, MUSCLES, MUSCLE_TO_GROUP, FINISHER_VARIANTS, SPORTS, PLACES, WORKOUT_MODES,
} from '../shared/src/enums.ts';
import { isHighImpact } from '../shared/src/age.ts';
import { BODYWEIGHT_APPARATUS, estimateMinutes, type ExerciseDef } from '../shared/src/training.ts';
import { FOOD_CATEGORIES, WORKOUT_STYLES, type DishRaw, type ExerciseContent, type FinisherContent, type FoodContent, type MealTemplateRaw, type ReadyWorkoutContent, type WorkoutFocus } from '../shared/src/content/types.ts';
import { detectAllergensInText } from '../shared/src/menu.ts';
import { FOCUS_MUSCLES } from '../shared/src/content/focus.ts';
import { buildDish, buildMealTemplate, foodMap, sumMacros } from '../shared/src/content/build.ts';
import { EXERCISES_ALL, FOODS_ALL, DISHES_RAW_ALL, FINISHERS_ALL } from '../shared/src/content/sources.ts';
import { MEAL_TEMPLATES_RAW } from '../shared/src/content/data/mealTemplates.ts';
import { READY_WORKOUTS_GENERATED } from '../shared/src/content/data/readyWorkouts.generated.ts';

void ACHIEVEMENT_IDS;
const ROOT = resolve(import.meta.dirname, '..');
const errors: string[] = [];
const warnings: string[] = [];
const err = (m: string): void => { errors.push(m); };
const warn = (m: string): void => { warnings.push(m); };

const EXPECT = { exercises: 244, readyMin: 250, finishers: 39, foods: 198, mealTemplates: 36, dishes: 500, videoA: [50, 62] as const };
const HE = /[א-ת]/;
const LATIN = /^[\x20-\x7E–—°×’]+$/;
const SNAKE = /^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/;
const isIn = <T extends string>(arr: readonly T[], v: unknown): v is T => typeof v === 'string' && (arr as readonly string[]).includes(v);

function checkHebrew(where: string, s: unknown, opts: { allowEmpty?: boolean } = {}): void {
  if (typeof s !== 'string' || (!opts.allowEmpty && s.trim() === '')) return err(`${where}: Hebrew text missing`);
  if (!HE.test(s)) err(`${where}: no Hebrew letters in "${s}"`);
  if (/[א-ת]"[א-ת]/.test(s)) err(`${where}: ASCII " instead of gershayim ״ in "${s}"`);
  if (/[א-ת]'(?!\w)/.test(s)) err(`${where}: ASCII ' instead of geresh ׳ in "${s}"`);
  if (/(?:^|\s)\S+\/[יה](?:\s|$|[.,])/.test(s) || /[א-ת]\/ת\b/.test(s)) err(`${where}: gendered slash form in "${s}"`);
  if (/\bkg\b|\bcm\b|\bkcal\b/i.test(s)) err(`${where}: Latin unit in Hebrew text "${s}"`);
  if (s !== s.trim() || /\s{2,}/.test(s)) err(`${where}: stray whitespace`);
}
function checkEnglish(where: string, s: unknown): void {
  if (typeof s !== 'string' || s.trim() === '') return err(`${where}: English text missing`);
  if (HE.test(s)) err(`${where}: Hebrew letters in English text "${s}"`);
  if (!LATIN.test(s)) err(`${where}: unexpected characters in "${s}"`);
  if (s !== s.trim() || /\s{2,}/.test(s)) err(`${where}: stray whitespace`);
}
function strArr(where: string, a: unknown, min: number, max: number, lang: 'he' | 'en'): void {
  if (!Array.isArray(a) || a.length < min || a.length > max) return err(`${where}: needs ${min}-${max} items`);
  a.forEach((s, i) => (lang === 'he' ? checkHebrew(`${where}[${i}]`, s) : checkEnglish(`${where}[${i}]`, s)));
  if (new Set(a).size !== a.length) err(`${where}: duplicate items`);
}
const dupes = (ids: string[], what: string) => {
  const seen = new Set<string>();
  for (const id of ids) { if (seen.has(id)) err(`${what}: duplicate id ${id}`); seen.add(id); }
};

/* ============================================================ exercises */

const LOAD_IMPLEMENTS = ['barbell', 'dumbbell', 'kettlebell', 'machine', 'cable', 'ez_bar', 'landmine', 'sled', 'medicine_ball'] as const;
const DIFF_RANK = { beginner: 0, intermediate: 1, advanced: 2 } as const;

function validateExercises(list: readonly ExerciseContent[], all: ReadonlyMap<string, ExerciseContent>, sliceMode: boolean): void {
  dupes(list.map((e) => e.id), 'exercise');
  for (const e of list) {
    const w = `exercise ${e.id}`;
    if (!SNAKE.test(e.id)) err(`${w}: id must be snake_case`);
    checkHebrew(`${w}.nameHe`, e.nameHe); checkEnglish(`${w}.nameEn`, e.nameEn);
    if (!isIn(EXERCISE_CATEGORIES, e.category)) err(`${w}: bad category`);
    if (!isIn(DIFFICULTIES, e.difficulty)) err(`${w}: bad difficulty`);
    if (!isIn(MOVEMENT_PATTERNS, e.pattern)) err(`${w}: bad pattern`);
    if (!Array.isArray(e.primary) || e.primary.length < 1 || e.primary.length > 3 || !e.primary.every((m) => isIn(MUSCLES, m))) err(`${w}: primary needs 1-3 valid muscles`);
    if (!Array.isArray(e.secondary) || !e.secondary.every((m) => isIn(MUSCLES, m))) err(`${w}: bad secondary`);
    else if (e.secondary.some((m) => e.primary.includes(m))) err(`${w}: muscle in both primary and secondary`);
    if (!Array.isArray(e.equipment) || e.equipment.length < 1 || !e.equipment.every((q) => isIn(EQUIPMENT, q))) err(`${w}: bad equipment`);
    else if (e.equipment.includes('none') && e.equipment.length > 1) err(`${w}: 'none' cannot be combined with other equipment`);
    if (!Array.isArray(e.contraindications) || !e.contraindications.every((c) => isIn(INJURY_AREAS, c))) err(`${w}: bad contraindications`);
    if (typeof e.externallyLoaded !== 'boolean' || typeof e.unilateral !== 'boolean') err(`${w}: externallyLoaded/unilateral must be boolean`);
    if (e.externallyLoaded && !e.equipment.some((q) => (LOAD_IMPLEMENTS as readonly string[]).includes(q))) err(`${w}: externallyLoaded but no load implement in equipment`);
    if (!e.externallyLoaded && e.category === 'weight_reps') err(`${w}: weight_reps must be externallyLoaded`);
    if (e.category === 'weight_reps' && !e.externallyLoaded) err(`${w}: weight_reps requires externallyLoaded`);
    if (e.equipment.includes('none') && e.externallyLoaded) err(`${w}: bodyweight exercise cannot be externallyLoaded`);
    strArr(`${w}.stepsHe`, e.stepsHe, 3, 6, 'he'); strArr(`${w}.stepsEn`, e.stepsEn, 3, 6, 'en');
    strArr(`${w}.cuesHe`, e.cuesHe, 2, 4, 'he'); strArr(`${w}.cuesEn`, e.cuesEn, 2, 4, 'en');
    strArr(`${w}.mistakesHe`, e.mistakesHe, 2, 4, 'he'); strArr(`${w}.mistakesEn`, e.mistakesEn, 2, 4, 'en');
    if (e.stepsHe?.length !== e.stepsEn?.length) err(`${w}: stepsHe/stepsEn length mismatch`);
    if (e.cuesHe?.length !== e.cuesEn?.length) err(`${w}: cuesHe/cuesEn length mismatch`);
    if (e.mistakesHe?.length !== e.mistakesEn?.length) err(`${w}: mistakesHe/mistakesEn length mismatch`);
    checkHebrew(`${w}.safetyHe`, e.safetyHe); checkEnglish(`${w}.safetyEn`, e.safetyEn);
    if (!['A', 'B', 'C', 'D'].includes(e.videoPriority)) err(`${w}: bad videoPriority`);
    // alternatives
    for (const [field, arr] of [['easierAlternatives', e.easierAlternatives], ['harderAlternatives', e.harderAlternatives]] as const) {
      if (!Array.isArray(arr)) { err(`${w}.${field}: must be array`); continue; }
      if (arr.length > 4) err(`${w}.${field}: max 4`);
      for (const id of arr) {
        if (id === e.id) err(`${w}.${field}: self reference`);
        const t = all.get(id);
        if (!t) { if (!sliceMode) err(`${w}.${field}: unknown exercise ${id}`); else if (!list.some((x) => x.id === id)) warn(`${w}.${field}: ${id} not in this slice (checked in full run)`); continue; }
        if (field === 'easierAlternatives' && DIFF_RANK[t.difficulty] > DIFF_RANK[e.difficulty]) err(`${w}: easier alternative ${id} is harder`);
        if (field === 'harderAlternatives' && DIFF_RANK[t.difficulty] < DIFF_RANK[e.difficulty]) err(`${w}: harder alternative ${id} is easier`);
      }
    }
    if (e.difficulty !== 'beginner' && e.easierAlternatives.length === 0) err(`${w}: non-beginner exercise needs an easier alternative`);
    // domain rules
    if (e.category === 'plyometric' && !e.contraindications.some((c) => c === 'knee' || c === 'ankle')) err(`${w}: plyometric must list knee or ankle contraindication`);
    if (e.pattern === 'jump' && e.category !== 'plyometric') err(`${w}: jump pattern must be plyometric`);
    if (e.pattern === 'vertical_push' && !e.contraindications.includes('shoulder')) err(`${w}: vertical push must list shoulder contraindication`);
    if (e.pattern === 'hinge' && e.externallyLoaded && !e.contraindications.includes('lower_back')) err(`${w}: loaded hinge must list lower_back contraindication`);
    if (e.pattern === 'horizontal_push' && e.externallyLoaded && !e.contraindications.includes('shoulder')) err(`${w}: loaded horizontal push must list shoulder contraindication`);
    if (isHighImpact(e) && e.category !== 'plyometric' && e.category !== 'cardio') warn(`${w}: high-impact id/pattern but category ${e.category}`);
  }
}

function swapCoverage(list: readonly ExerciseContent[]): void {
  const byId = new Map(list.map((e) => [e.id, e]));
  let pairs = 0; let ok = 0;
  const missing: string[] = [];
  for (const e of list) for (const inj of e.contraindications) {
    pairs++;
    const seen = new Set([e.id]); const q = [...e.easierAlternatives]; let found = false;
    while (q.length && !found) {
      const id = q.shift()!; if (seen.has(id)) continue; seen.add(id);
      const c = byId.get(id); if (!c) continue;
      if (!c.contraindications.includes(inj) && c.primary.some((m) => e.primary.includes(m))) found = true; else q.push(...c.easierAlternatives);
    }
    if (found) ok++; else missing.push(`${e.id}/${inj}`);
  }
  const pct = pairs ? (ok / pairs) * 100 : 100;
  console.log(`swap coverage: ${ok}/${pairs} (exercise,injury) pairs have a safe easier alternative = ${pct.toFixed(1)}%`);
  if (pct < 75) err(`swap coverage ${pct.toFixed(1)}% < 75%. Examples missing: ${missing.slice(0, 12).join(', ')}`);
}

/* ================================================================= foods */

function validateFoods(list: readonly FoodContent[]): void {
  dupes(list.map((f) => f.id), 'food');
  for (const f of list) {
    const w = `food ${f.id}`;
    if (!SNAKE.test(f.id)) err(`${w}: id must be snake_case`);
    checkHebrew(`${w}.nameHe`, f.nameHe); checkEnglish(`${w}.nameEn`, f.nameEn);
    checkHebrew(`${w}.servingNameHe`, f.servingNameHe); checkEnglish(`${w}.servingNameEn`, f.servingNameEn);
    if (!isIn(FOOD_CATEGORIES, f.category)) err(`${w}: bad category`);
    for (const k of ['kcal', 'proteinG', 'carbsG', 'fatG', 'fiberG'] as const) if (typeof f[k] !== 'number' || !(f[k] >= 0)) err(`${w}.${k}: must be a number >= 0`);
    if (f.proteinG + f.carbsG + f.fatG > 100.5) err(`${w}: macros exceed 100 g per 100 g`);
    if (f.fiberG > f.carbsG + 0.01) err(`${w}: fiber exceeds carbs`);
    const atwater = 4 * f.proteinG + 4 * (f.carbsG - f.fiberG) + 2 * f.fiberG + 9 * f.fatG;
    const tol = Math.max(18, 0.12 * Math.max(f.kcal, atwater));
    if (Math.abs(f.kcal - atwater) > tol) err(`${w}: kcal ${f.kcal} inconsistent with macros (Atwater ≈ ${atwater.toFixed(0)}, tolerance ±${tol.toFixed(0)})`);
    if (!(f.kcal <= 900)) err(`${w}: kcal per 100 g > 900`);
    if (!(f.servingG > 0 && f.servingG <= 1000)) err(`${w}: servingG out of range`);
    if (!f.allergens.every((a) => isIn(ALLERGENS, a))) err(`${w}: bad allergens`);
    if (!f.diets.every((d) => isIn(DIET_TYPES, d))) err(`${w}: bad diets`);
    if (!f.restrictionTags.every((d) => isIn(DIETARY_RESTRICTIONS, d))) err(`${w}: bad restrictionTags`);
    if (!['meat', 'dairy', 'pareve'].includes(f.kosherClass)) err(`${w}: bad kosherClass`);
    if (f.diets.includes('vegan') && !(f.diets.includes('vegetarian') && f.diets.includes('pescatarian'))) err(`${w}: vegan implies vegetarian and pescatarian`);
    if (f.diets.includes('vegetarian') && !f.diets.includes('pescatarian')) err(`${w}: vegetarian implies pescatarian`);
    if (f.diets.includes('vegan') && (f.allergens.includes('dairy') || f.allergens.includes('egg') || f.allergens.includes('fish') || f.allergens.includes('shellfish'))) err(`${w}: vegan food has animal allergen`);
    if (f.category === 'meat_poultry' && (f.diets.includes('pescatarian') || f.diets.includes('vegetarian'))) err(`${w}: meat cannot be vegetarian/pescatarian`);
    if (f.category === 'meat_poultry' && f.kosherClass !== 'meat' && f.diets.includes('kosher')) err(`${w}: kosher meat must have kosherClass meat`);
    if (f.allergens.includes('dairy') && f.kosherClass === 'pareve') err(`${w}: dairy food cannot be pareve`);
    if (f.allergens.includes('dairy') && f.restrictionTags.includes('lactose_free')) warn(`${w}: dairy allergen but lactose_free tag (ok only for lactose-free dairy)`);
    if (f.category === 'fish_seafood' && f.diets.includes('vegetarian')) err(`${w}: seafood cannot be vegetarian`);
    if (f.category === 'fish_seafood' && f.allergens.includes('shellfish') && f.diets.includes('kosher')) err(`${w}: shellfish is not kosher`);
  }
}

/* ================================================================ dishes */

const SLOT_KCAL: Record<string, [number, number]> = { breakfast: [200, 800], lunch: [300, 950], dinner: [300, 950], snack: [60, 420] };

function validateDishes(raws: readonly DishRaw[], foods: ReadonlyMap<string, FoodContent>): void {
  dupes(raws.map((d) => d.id), 'dish');
  const names = new Set<string>(); const sigs = new Set<string>();
  for (const r of raws) {
    const w = `dish ${r.id}`;
    if (!SNAKE.test(r.id)) err(`${w}: id must be snake_case`);
    checkHebrew(`${w}.nameHe`, r.nameHe); checkEnglish(`${w}.nameEn`, r.nameEn);
    if (names.has(r.nameEn.toLowerCase())) err(`${w}: duplicate English name`); names.add(r.nameEn.toLowerCase());
    if (!Array.isArray(r.slots) || r.slots.length < 1 || !r.slots.every((s) => isIn(MEAL_SLOTS, s))) err(`${w}: bad slots`);
    if (!Array.isArray(r.ingredients) || r.ingredients.length < 2 || r.ingredients.length > 9) { err(`${w}: needs 2-9 ingredients`); continue; }
    if (!(r.prepMinutes >= 0 && r.prepMinutes <= 90)) err(`${w}: prepMinutes 0-90`);
    const ids = r.ingredients.map((i) => i.foodId);
    if (new Set(ids).size !== ids.length) err(`${w}: repeated ingredient`);
    const sig = [...ids].sort().join('|'); if (sigs.has(sig)) err(`${w}: identical ingredient set to another dish`); sigs.add(sig);
    let unknown = false;
    for (const i of r.ingredients) {
      if (!foods.has(i.foodId)) { err(`${w}: unknown food ${i.foodId}`); unknown = true; }
      if (!(i.grams >= 2 && i.grams <= 600)) err(`${w}: ${i.foodId} grams ${i.grams} out of 2-600`);
    }
    if (unknown) continue;
    const d = buildDish(r, foods);
    const m = sumMacros(r.ingredients, foods);
    for (const s of r.slots) {
      const [lo, hi] = SLOT_KCAL[s] ?? [0, 0];
      if (d.kcal < lo || d.kcal > hi) err(`${w}: ${d.kcal} kcal outside ${s} range ${lo}-${hi}`);
    }
    if (r.slots.includes('snack') && d.kcal > 700) err(`${w}: snack dish too large`);
    if (m.proteinG * 4 + m.carbsG * 4 + m.fatG * 9 < 0.6 * m.kcal) err(`${w}: macros do not account for energy`);
    // A name that implies an allergen the ingredients do not contain means the name lies about the dish.
    for (const a of new Set([...detectAllergensInText(r.nameEn), ...detectAllergensInText(r.nameHe)])) {
      if (!d.allergens.includes(a)) err(`${w}: name implies ${a} but no ingredient carries that allergen`);
    }
  }
}

function validateMealTemplates(list: readonly MealTemplateRaw[], foods: ReadonlyMap<string, FoodContent>): void {
  dupes(list.map((m) => m.id), 'meal template');
  for (const m of list) {
    const w = `meal template ${m.id}`;
    if (!SNAKE.test(m.id)) err(`${w}: id must be snake_case`);
    checkHebrew(`${w}.nameHe`, m.nameHe); checkEnglish(`${w}.nameEn`, m.nameEn);
    if (!isIn(MEAL_SLOTS, m.slot)) err(`${w}: bad slot`);
    if (!m.items || m.items.length < 2 || m.items.length > 8) { err(`${w}: needs 2-8 items`); continue; }
    if (m.items.some((i) => !foods.has(i.foodId))) { err(`${w}: unknown food`); continue; }
    const t = buildMealTemplate(m, foods);
    const [lo, hi] = SLOT_KCAL[m.slot] ?? [0, 0];
    if (t.kcal < lo || t.kcal > hi) err(`${w}: ${t.kcal} kcal outside ${m.slot} range ${lo}-${hi}`);
  }
}

/* ============================================================== finishers */

function validateFinishers(list: readonly FinisherContent[], ex: ReadonlyMap<string, ExerciseContent>, strict: boolean): void {
  dupes(list.map((f) => f.id), 'finisher');
  const combos = new Set<string>();
  for (const f of list) {
    const w = `finisher ${f.id}`;
    if (!SNAKE.test(f.id)) err(`${w}: id must be snake_case`);
    if (!isIn(SPORTS, f.sport)) err(`${w}: bad sport`);
    if (!isIn(FINISHER_VARIANTS, f.variant)) err(`${w}: bad variant`);
    const key = `${f.sport}:${f.variant}`; if (combos.has(key)) err(`${w}: duplicate ${key}`); combos.add(key);
    checkHebrew(`${w}.nameHe`, f.nameHe); checkEnglish(`${w}.nameEn`, f.nameEn);
    checkHebrew(`${w}.descriptionHe`, f.descriptionHe); checkEnglish(`${w}.descriptionEn`, f.descriptionEn);
    if (!Number.isInteger(f.rounds) || f.rounds < 2 || f.rounds > 6) err(`${w}: rounds 2-6`);
    if (!f.items || f.items.length < 3 || f.items.length > 6) { err(`${w}: needs 3-6 items`); continue; }
    let sec = 0;
    for (const it of f.items) {
      const e = ex.get(it.exerciseId);
      if (!e) { if (strict) err(`${w}: unknown exercise ${it.exerciseId}`); continue; }
      if (!(it.workSec >= 15 && it.workSec <= 90) || !(it.restSec >= 0 && it.restSec <= 60)) err(`${w}: ${it.exerciseId} work 15-90 / rest 0-60 s`);
      sec += it.workSec + it.restSec;
      if (f.variant === 'bodyweight' && !e.equipment.every((q) => q === 'none')) err(`${w}: bodyweight variant uses gear (${it.exerciseId})`);
      if (f.variant === 'gentle') {
        if (!e.equipment.every((q) => q === 'none')) err(`${w}: gentle uses gear (${it.exerciseId})`);
        if (isHighImpact(e)) err(`${w}: gentle uses high-impact (${it.exerciseId})`);
        if (e.difficulty !== 'beginner') err(`${w}: gentle uses non-beginner (${it.exerciseId})`);
        if (e.contraindications.some((c) => c === 'knee' || c === 'ankle' || c === 'hip')) err(`${w}: gentle uses lower-body joint-contraindicated (${it.exerciseId})`);
      }
    }
    const total = sec * f.rounds;
    if (total < 540 || total > 660) err(`${w}: total ${total}s not ≈10 min (540-660 s)`);
  }
}

/* ======================================================== ready workouts */

const HOME_FORBIDDEN = ['machine', 'cable', 'sled', 'squat_rack', 'landmine'];
const PARK_ALLOWED = ['pullup_bar', 'dip_station', 'rings', 'parallettes', 'resistance_band', 'jump_rope', 'box', 'medicine_ball', 'trx', 'kettlebell', 'foam_roller'];

function validateReadyWorkouts(list: readonly ReadyWorkoutContent[], ex: ReadonlyMap<string, ExerciseContent>): void {
  dupes(list.map((w) => w.id), 'ready workout');
  for (const w of list) {
    const n = `workout ${w.id}`;
    checkHebrew(`${n}.nameHe`, w.nameHe); checkEnglish(`${n}.nameEn`, w.nameEn);
    if (!isIn(PLACES, w.place) || !isIn(WORKOUT_MODES, w.mode) || !isIn(DIFFICULTIES, w.level) || !isIn(WORKOUT_STYLES, w.style) || !(w.focus in FOCUS_MUSCLES)) { err(`${n}: bad enum`); continue; }
    if (w.exerciseIds.length < 4 || w.exerciseIds.length > 9) err(`${n}: ${w.exerciseIds.length} exercises (need 4-9)`);
    if (new Set(w.exerciseIds).size !== w.exerciseIds.length) err(`${n}: repeated exercise`);
    if (w.nominalMinutes < 20 || w.nominalMinutes > 75) err(`${n}: ${w.nominalMinutes} min (need 20-75)`);
    const items = w.exerciseIds.map((id) => ex.get(id));
    if (items.some((i) => !i)) { err(`${n}: unknown exercise id`); continue; }
    const exs = items as ExerciseContent[];
    const need = new Set(exs.flatMap((e) => e.equipment.filter((q) => q !== 'none')));
    if ([...need].sort().join() !== [...w.equipment].sort().join()) err(`${n}: equipment field ${[...w.equipment]} != derived ${[...need]}`);
    if (w.mode === 'bodyweight' && [...need].some((q) => !(BODYWEIGHT_APPARATUS as readonly string[]).includes(q))) err(`${n}: bodyweight workout needs gear`);
    if (w.mode === 'weights' && !exs.some((e) => e.equipment.some((q) => q !== 'none' && !(BODYWEIGHT_APPARATUS as readonly string[]).includes(q)))) err(`${n}: weights workout uses no gear`);
    if (w.place === 'home' && [...need].some((q) => HOME_FORBIDDEN.includes(q))) err(`${n}: home workout uses gym-only equipment`);
    if (w.place === 'park' && [...need].some((q) => !PARK_ALLOWED.includes(q))) err(`${n}: park workout uses non-portable equipment`);
    const maxRank = Math.max(...exs.map((e) => DIFF_RANK[e.difficulty]));
    if (maxRank > DIFF_RANK[w.level]) err(`${n}: level ${w.level} but contains harder exercise`);
    if (w.focus !== 'full_body') {
      const fm = FOCUS_MUSCLES[w.focus] as readonly string[];
      const hit = exs.filter((e) => e.primary.some((m) => fm.includes(m))).length;
      if (hit / exs.length < 0.6) err(`${n}: only ${hit}/${exs.length} exercises target focus ${w.focus}`);
    } else {
      const groups = new Set(exs.flatMap((e) => e.primary.map((m) => MUSCLE_TO_GROUP[m])));
      if (groups.size < 4) err(`${n}: full_body needs ≥4 muscle groups, has ${groups.size}`);
    }
    for (const g of w.groups) for (const i of g) if (!(i >= 0 && i < w.exerciseIds.length)) err(`${n}: group index ${i} out of range`);
    // time estimate sanity vs generic prescription
    const est = estimateMinutes(exs.map((e) => ({ sets: 3, repsMax: 10, durationSec: e.category === 'duration' || e.category === 'isometric' ? 30 : null, restSec: 75 })));
    if (Math.abs(est - w.nominalMinutes) > 25) warn(`${n}: nominalMinutes ${w.nominalMinutes} vs generic estimate ${est}`);
  }
  // overlap (Jaccard) within the same focus
  const byFocus = new Map<string, ReadyWorkoutContent[]>();
  for (const w of list) byFocus.set(w.focus, [...(byFocus.get(w.focus) ?? []), w]);
  for (const [focus, ws] of byFocus) {
    for (let i = 0; i < ws.length; i++) for (let j = i + 1; j < ws.length; j++) {
      const a = new Set(ws[i]!.exerciseIds); const b = new Set(ws[j]!.exerciseIds);
      const inter = [...a].filter((x) => b.has(x)).length;
      const jac = inter / (a.size + b.size - inter);
      if (jac >= 0.7) err(`workouts ${ws[i]!.id} and ${ws[j]!.id} (focus ${focus}) overlap ${(jac * 100).toFixed(0)}% (need < 70%)`);
    }
  }
  const names = new Set<string>();
  for (const w of list) { const k = w.nameEn.toLowerCase(); if (names.has(k)) err(`workout ${w.id}: duplicate English name`); names.add(k); }
}

/* ================================================================== main */

async function main(): Promise<void> {
  const sliceIdx = process.argv.indexOf('--slice');
  const slice = sliceIdx > -1 ? process.argv[sliceIdx + 1] : undefined;
  const exAll = new Map<string, ExerciseContent>(EXERCISES_ALL.map((e) => [e.id, e]));
  const foods = foodMap(FOODS_ALL);

  if (slice) {
    const file = join(ROOT, 'shared/src/content/data', `${slice}.ts`);
    const mod = (await import(pathToFileURL(file).href)) as Record<string, unknown>;
    const arr = Object.values(mod).find(Array.isArray) as unknown[] | undefined;
    if (!arr) { console.error(`no array export in ${file}`); process.exit(2); }
    const kind = slice.split('/')[0];
    console.log(`slice ${slice}: ${arr.length} items`);
    if (kind === 'exercises') { validateExercises(arr as ExerciseContent[], exAll, true); swapCoverage(arr as ExerciseContent[]); }
    else if (kind === 'foods') validateFoods(arr as FoodContent[]);
    else if (kind === 'dishes') validateDishes(arr as DishRaw[], foods);
    else if (kind === 'finishers') validateFinishers(arr as FinisherContent[], exAll, true);
    else if (kind === 'mealTemplates') validateMealTemplates(arr as MealTemplateRaw[], foods);
    else { console.error('unknown slice kind'); process.exit(2); }
  } else {
    const c = { exercises: EXERCISES_ALL.length, foods: FOODS_ALL.length, dishes: DISHES_RAW_ALL.length, finishers: FINISHERS_ALL.length, templates: MEAL_TEMPLATES_RAW.length, ready: READY_WORKOUTS_GENERATED.length };
    console.log('counts', c);
    if (c.exercises !== EXPECT.exercises) err(`exercises: ${c.exercises} != ${EXPECT.exercises}`);
    if (c.foods !== EXPECT.foods) err(`foods: ${c.foods} != ${EXPECT.foods}`);
    if (c.dishes !== EXPECT.dishes) err(`dishes: ${c.dishes} != ${EXPECT.dishes}`);
    if (c.finishers !== EXPECT.finishers) err(`finishers: ${c.finishers} != ${EXPECT.finishers}`);
    if (c.templates !== EXPECT.mealTemplates) err(`meal templates: ${c.templates} != ${EXPECT.mealTemplates}`);
    if (c.ready < EXPECT.readyMin) err(`ready workouts: ${c.ready} < ${EXPECT.readyMin}`);
    validateExercises(EXERCISES_ALL, exAll, false); swapCoverage(EXERCISES_ALL);
    const a = EXERCISES_ALL.filter((e) => e.videoPriority === 'A').length;
    if (a < EXPECT.videoA[0] || a > EXPECT.videoA[1]) err(`video priority A count ${a} not in ${EXPECT.videoA[0]}-${EXPECT.videoA[1]}`);
    validateFoods(FOODS_ALL); validateDishes(DISHES_RAW_ALL, foods); validateMealTemplates(MEAL_TEMPLATES_RAW, foods);
    validateFinishers(FINISHERS_ALL, exAll, true);
    for (const s of SPORTS) for (const v of FINISHER_VARIANTS) if (!FINISHERS_ALL.some((f) => f.sport === s && f.variant === v)) err(`finisher missing: ${s}/${v}`);
    validateReadyWorkouts(READY_WORKOUTS_GENERATED, exAll);
    // per-slot/per-diet dish coverage so every user can get a daily menu
    const built = DISHES_RAW_ALL.every((d) => d.ingredients.every((i) => foods.has(i.foodId))) ? DISHES_RAW_ALL.map((d) => buildDish(d, foods)) : [];
    for (const slot of MEAL_SLOTS) for (const diet of DIET_TYPES) {
      const n = built.filter((d) => d.slots.includes(slot) && (diet === 'omnivore' || d.diets.includes(diet))).length;
      if (built.length && n < 8) err(`dish coverage: only ${n} ${slot} dishes for diet ${diet} (need ≥8)`);
    }
    // per-allergen coverage
    for (const a2 of ALLERGENS) for (const slot of ['breakfast', 'lunch', 'dinner'] as const) {
      const n = built.filter((d) => d.slots.includes(slot) && !d.allergens.includes(a2)).length;
      if (built.length && n < 15) err(`dish coverage: only ${n} ${slot} dishes free of ${a2}`);
    }
  }

  for (const w of warnings.slice(0, 40)) console.warn(`warn: ${w}`);
  if (warnings.length > 40) console.warn(`warn: … ${warnings.length - 40} more`);
  if (errors.length) {
    for (const e of errors.slice(0, 150)) console.error(`ERROR: ${e}`);
    if (errors.length > 150) console.error(`… ${errors.length - 150} more errors`);
    console.error(`validate-content: ${errors.length} error(s)`);
    process.exit(1);
  }
  console.log('validate-content: 0 errors');
}
void main();
