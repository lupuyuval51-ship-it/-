/**
 * Daily menu: picks one dish per meal slot from the dish catalog so the day lands near the user's calorie and
 * macro targets. Pure and deterministic: the same date, targets and preferences always give the same menu,
 * and "another dish" is a counter per slot, so the client only has to remember small numbers.
 */
import type { MealType } from './constants';
import { DISHES, dishById, type Dish, type DishCategory } from './dishes';
import { dishFilter, NO_PREFERENCES, type DishPreferences } from './dishes/safety';

export interface MenuTargets {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export interface MenuSlot {
  mealType: MealType;
  /** Share of the day's calories this slot aims at. */
  share: number;
}

export interface MenuItem {
  slot: number;
  mealType: MealType;
  dishId: string;
  /** Servings of the listed portion: 0.5 … 1.75, in steps of 0.25. */
  scale: number;
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export interface MenuTotals {
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export interface DailyMenu {
  items: MenuItem[];
  totals: MenuTotals;
  /** Slots that had no dish to offer for these preferences (the user can still log food normally). */
  emptySlots: number[];
}

export interface MenuInput {
  /** Any stable string for the day (the ISO date); changes the menu from day to day. */
  seed: string;
  targets: MenuTargets;
  /** 3 to 6; the menu has 3, 4 or 5 slots. */
  mealsPerDay?: number | null;
  preferences?: DishPreferences;
  /** Per slot index: how many times the user asked for "another dish". */
  swaps?: Readonly<Record<number, number>>;
}

/** A snack is small: pre/post-workout dishes include whole meals, which must not show up as a snack. */
export const SNACK_MAX_KCAL = 350;

export const SCALE_STEP = 0.25;
export const SCALE_MIN = 0.5;
export const SCALE_MAX = 1.75;

const SLOT_CATEGORIES: Record<MealType, readonly DishCategory[]> = {
  breakfast: ['breakfast'],
  lunch: ['lunch'],
  dinner: ['dinner'],
  snack: ['snack', 'pre', 'post'],
};

export function menuSlots(mealsPerDay: number | null | undefined): MenuSlot[] {
  const n = mealsPerDay == null ? 4 : Math.round(mealsPerDay);
  if (n <= 3) {
    return [
      { mealType: 'breakfast', share: 0.27 },
      { mealType: 'lunch', share: 0.38 },
      { mealType: 'dinner', share: 0.35 },
    ];
  }
  if (n === 4) {
    return [
      { mealType: 'breakfast', share: 0.24 },
      { mealType: 'lunch', share: 0.34 },
      { mealType: 'dinner', share: 0.3 },
      { mealType: 'snack', share: 0.12 },
    ];
  }
  return [
    { mealType: 'breakfast', share: 0.22 },
    { mealType: 'snack', share: 0.09 },
    { mealType: 'lunch', share: 0.3 },
    { mealType: 'snack', share: 0.09 },
    { mealType: 'dinner', share: 0.3 },
  ];
}

/** FNV-1a, folded to [0, 1): a stable "random" number for a string. */
function unitHash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 100000) / 100000;
}

const clampScale = (x: number) => Math.min(SCALE_MAX, Math.max(SCALE_MIN, x));
const roundScale = (x: number) => clampScale(Math.round(x / SCALE_STEP) * SCALE_STEP);
const round = (x: number) => Math.round(x);

function item(slot: number, mealType: MealType, dish: Dish, scale: number): MenuItem {
  return {
    slot,
    mealType,
    dishId: dish.id,
    scale,
    kcal: round(dish.kcal * scale),
    proteinG: round(dish.proteinG * scale),
    carbsG: round(dish.carbsG * scale),
    fatG: round(dish.fatG * scale),
  };
}

export function menuTotals(items: readonly Pick<MenuItem, 'kcal' | 'proteinG' | 'carbsG' | 'fatG'>[]): MenuTotals {
  return items.reduce<MenuTotals>(
    (t, i) => ({ kcal: t.kcal + i.kcal, proteinG: t.proteinG + i.proteinG, carbsG: t.carbsG + i.carbsG, fatG: t.fatG + i.fatG }),
    { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0 },
  );
}

/**
 * How badly a dish at `scale` misses the slot: the calorie miss plus how far the dish's macro mix
 * (share of calories from protein / carbs / fat) is from the day's target mix, in both directions.
 */
function fitCost(dish: Dish, scale: number, slotKcal: number, mix: { p: number; c: number; f: number }): number {
  const kcal = dish.kcal * scale;
  const calorieMiss = Math.abs(kcal - slotKcal) / Math.max(slotKcal, 1);
  const k = Math.max(dish.kcal, 1);
  const mixMiss = (Math.abs((dish.proteinG * 4) / k - mix.p) + Math.abs((dish.carbsG * 4) / k - mix.c) + Math.abs((dish.fatG * 9) / k - mix.f)) / 2;
  // A dish that needs a stretched portion to fit is a worse pick than one that fits as listed.
  const stretch = Math.abs(scale - 1) * 0.15;
  return calorieMiss + mixMiss * 0.9 + stretch;
}

const RANK_POOL = 12;

export function buildDailyMenu(input: MenuInput): DailyMenu {
  const slots = menuSlots(input.mealsPerDay);
  const allowed = dishFilter(input.preferences ?? NO_PREFERENCES);
  const { targets } = input;
  const kcalOfMacros = Math.max(targets.proteinG * 4 + targets.carbsG * 4 + targets.fatG * 9, 1);
  const mix = { p: (targets.proteinG * 4) / kcalOfMacros, c: (targets.carbsG * 4) / kcalOfMacros, f: (targets.fatG * 9) / kcalOfMacros };
  const used = new Set<string>();
  const picked: { slot: number; mealType: MealType; dish: Dish; scale: number }[] = [];
  const emptySlots: number[] = [];

  slots.forEach((slot, index) => {
    const categories = SLOT_CATEGORIES[slot.mealType];
    const slotKcal = targets.calories * slot.share;
    const ranked = DISHES.filter((d) => categories.includes(d.category) && !used.has(d.id) && (slot.mealType !== 'snack' || d.kcal <= SNACK_MAX_KCAL) && allowed(d))
      .map((dish) => {
        const scale = roundScale(slotKcal / Math.max(dish.kcal, 1));
        // The seeded jitter varies the menu from day to day without ever beating a clearly better fit.
        const cost = fitCost(dish, scale, slotKcal, mix) + unitHash(`${input.seed}|${index}|${dish.id}`) * 0.35;
        return { dish, scale, cost };
      })
      .sort((a, b) => a.cost - b.cost || a.dish.id.localeCompare(b.dish.id));
    if (!ranked.length) {
      emptySlots.push(index);
      return;
    }
    const pool = Math.min(ranked.length, RANK_POOL);
    const swaps = Math.max(0, Math.floor(input.swaps?.[index] ?? 0));
    const choice = ranked[swaps % pool];
    if (!choice) return;
    used.add(choice.dish.id);
    picked.push({ slot: index, mealType: slot.mealType, dish: choice.dish, scale: choice.scale });
  });

  // Close the day's remaining calorie gap by nudging portion sizes one step at a time.
  for (let guard = 0; guard < 8; guard++) {
    const total = picked.reduce((n, p) => n + p.dish.kcal * p.scale, 0);
    const gap = targets.calories - total;
    let best: { index: number; scale: number; gap: number } | null = null;
    picked.forEach((p, index) => {
      for (const delta of [SCALE_STEP, -SCALE_STEP]) {
        const next = p.scale + delta;
        if (next < SCALE_MIN || next > SCALE_MAX) continue;
        const newGap = Math.abs(gap - delta * p.dish.kcal);
        if (newGap < Math.abs(gap) - 1 && (!best || newGap < best.gap)) best = { index, scale: next, gap: newGap };
      }
    });
    if (!best) break;
    const chosen: { index: number; scale: number } = best;
    const target = picked[chosen.index];
    if (target) target.scale = chosen.scale;
  }

  const items = picked.map((p) => item(p.slot, p.mealType, p.dish, p.scale));
  return { items, totals: menuTotals(items), emptySlots };
}

/** The menu with one slot's dish replaced by a specific dish (used when a dish is chosen from the catalog). */
export function withDish(menu: DailyMenu, slot: number, dish: Dish, scale = 1): DailyMenu {
  const items = menu.items.map((i) => (i.slot === slot ? item(slot, i.mealType, dish, scale) : i));
  return { ...menu, items, totals: menuTotals(items) };
}

// ---------------------------------------------------------------- Shopping list

/** Leading counts and measure words that are not part of the ingredient's name ("2 eggs", "glass of milk"). */
const LEAD_EN = /^(?:\d+(?:[.,]\d+)?\s*|half\s+(?:a\s+)?|a\s+little\s+|a\s+|an\s+|little\s+|small\s+|medium\s+|large\s+|pinch\s+of\s+|glass\s+of\s+(?:\d%\s+)?|spoon\s+of\s+|slices?\s+of\s+|slice\s+of\s+|cup\s+)+/i;
const LEAD_HE = /^(?:\d+(?:[.,]\d+)?\s*|חצי\s+|קצת\s+|כוס\s+|כף\s+|פרוסת\s+|פרוסות\s+|קורט\s+|מעט\s+)+/;

const TRAILING_COUNT_EN = /\s+(?:slices?|balls?|sticks?|cookies?)$/i;

export function ingredientNames(dish: Dish, lang: 'he' | 'en'): string[] {
  return dish.ingredients[lang]
    .split(/[,،]/)
    .map((raw) => raw.trim().replace(lang === 'en' ? LEAD_EN : LEAD_HE, '').replace(lang === 'en' ? TRAILING_COUNT_EN : /$^/, '').trim())
    .filter((s) => s.length > 1);
}

export interface ShoppingEntry {
  name: string;
  /** In how many of the menu's dishes it appears. */
  dishes: number;
}

/** Ingredient names across the menu's dishes (names only; amounts are not in the dish data), most used first. */
export function shoppingList(items: readonly Pick<MenuItem, 'dishId'>[], lang: 'he' | 'en'): ShoppingEntry[] {
  const counts = new Map<string, ShoppingEntry>();
  for (const it of items) {
    const dish = dishById(it.dishId);
    if (!dish) continue;
    const seen = new Set<string>();
    for (const name of ingredientNames(dish, lang)) {
      const key = name.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      const entry = counts.get(key);
      if (entry) entry.dishes += 1;
      else counts.set(key, { name, dishes: 1 });
    }
  }
  return Array.from(counts.values()).sort((a, b) => b.dishes - a.dishes || a.name.localeCompare(b.name, lang));
}
