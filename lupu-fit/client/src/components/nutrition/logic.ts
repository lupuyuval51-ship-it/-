/** Pure nutrition-screen logic (dates, totals, adherence, menu seeds, shopping lists). No React. */
import { dishGrams } from '../../lib/foodSearch.ts';
import { localIso } from '../home/dates.ts';
import { buildDailyMenu, buildShoppingList, swapDish, type DailyMenu, type Dish, type MealSlot, type MenuItem, type MenuOptions, type ShoppingLine } from '@lupu-fit/shared';

export interface Totals { kcal: number; proteinG: number; carbsG: number; fatG: number }
export interface FoodEntry { id: string; loggedDate: string; slot: MealSlot; foodId: string | null; dishId: string | null; name: string; grams: number; kcal: number; proteinG: number; carbsG: number; fatG: number; estimated: boolean }

export const SLOTS: readonly MealSlot[] = ['breakfast', 'lunch', 'dinner', 'snack'];
export const groupBySlot = (es: readonly FoodEntry[]): Record<MealSlot, FoodEntry[]> => {
  const out: Record<MealSlot, FoodEntry[]> = { breakfast: [], lunch: [], dinner: [], snack: [] };
  for (const e of es) out[e.slot].push(e);
  return out;
};

/* ---- dates (local calendar, never UTC-shifted) */
export const todayIso = (): string => localIso();
export const isIsoDate = (s: string | null | undefined): s is string => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s);
export function addDaysIso(iso: string, n: number): string {
  const [y, m, d] = iso.split('-').map(Number) as [number, number, number];
  return localIso(new Date(y, m - 1, d + n, 12));
}

/** Bar tone for a target: calories flag overshoot; protein/carbs/fat never flag "over". */
export function barTone(value: number, target: number, flagOver: boolean): 'ok' | 'over' | undefined {
  if (target <= 0) return undefined;
  if (flagOver && value > target * 1.1) return 'over';
  return value >= target * 0.9 ? 'ok' : undefined;
}

export interface RangeDay { date: string; kcal: number; proteinG: number; carbsG: number; fatG: number; meals: number }
export interface Adherence { daysLogged: number; avgKcal: number | null; avgProteinG: number | null }
/** Averages are over LOGGED days only; null when nothing was logged (no invented numbers). */
export function adherenceOf(days: readonly RangeDay[]): Adherence {
  const logged = days.filter((d) => d.kcal > 0);
  if (logged.length === 0) return { daysLogged: 0, avgKcal: null, avgProteinG: null };
  return { daysLogged: logged.length, avgKcal: logged.reduce((s, d) => s + d.kcal, 0) / logged.length, avgProteinG: logged.reduce((s, d) => s + d.proteinG, 0) / logged.length };
}

/* ---- menu */
export function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
/** Same date + same user choice (`shuffle` counter) always gives the same seed. */
export const menuSeed = (date: string, shuffle: number): number => hashSeed(`lupu-menu|${date}|${shuffle}`);

export interface MenuChoice { mealCount: 3 | 4 | 5; shuffle: number; swaps: number[] }
export const DEFAULT_CHOICE: MenuChoice = { mealCount: 4, shuffle: 0, swaps: [] };

export function menuFor(dishes: readonly Dish[], kcal: number, date: string, choice: MenuChoice, base: Omit<MenuOptions, 'mealCount' | 'seed'>): DailyMenu {
  const o: MenuOptions = { ...base, mealCount: choice.mealCount, seed: menuSeed(date, choice.shuffle) };
  let menu = buildDailyMenu(dishes, { kcal }, o);
  for (const i of choice.swaps) menu = swapDish(dishes, menu, i, { kcal }, o);
  return menu;
}

/** Payload for POST /api/food-log: grams = total ingredient grams × portion; macros are the engine's scaled values. */
export function dishLogPayload(item: MenuItem, dish: Dish, date: string, name: string) {
  return {
    loggedDate: date, slot: item.slot, dishId: dish.id, name,
    grams: Math.max(0.1, Math.round(dishGrams(dish) * item.portion * 10) / 10),
    kcal: item.kcal, proteinG: item.proteinG, carbsG: item.carbsG, fatG: item.fatG, estimated: false,
  };
}

export function spanDates(start: string, days: number): string[] { return Array.from({ length: days }, (_, i) => addDaysIso(start, i)); }

/** Shopping list over several menus (each date has its own seed/choice); grams rounded to shop-friendly numbers. */
export function shoppingFor(dates: readonly string[], dishes: readonly Dish[], dishById: ReadonlyMap<string, Dish>, kcal: number, choiceOf: (date: string) => MenuChoice, base: Omit<MenuOptions, 'mealCount' | 'seed'>): ShoppingLine[] {
  const menus = dates.map((d) => menuFor(dishes, kcal, d, choiceOf(d), base));
  return buildShoppingList(menus, dishById).map((l) => ({ ...l, grams: roundGrams(l.grams) }));
}
export function roundGrams(g: number): number {
  if (g <= 0) return 0;
  const step = g < 100 ? 5 : g < 1000 ? 10 : 50;
  return Math.max(step, Math.round(g / step) * step);
}
export const shoppingText = (lines: readonly ShoppingLine[], lang: 'he' | 'en', unit: string): string =>
  lines.map((l) => `- ${lang === 'he' ? l.nameHe : l.nameEn}: ${l.grams} ${unit}`).join('\n');

/* ---- shopping list grouping (derived from the food category of each line; unknown items fall into "other") */
export type ShopGroup = 'produce' | 'protein' | 'grains' | 'other';
export const SHOP_GROUPS: readonly ShopGroup[] = ['produce', 'protein', 'grains', 'other'];
export function shopGroupOf(category: string | undefined): ShopGroup {
  switch (category) {
    case 'vegetables': case 'fruits': return 'produce';
    case 'meat_poultry': case 'fish_seafood': case 'eggs_dairy': case 'legumes': case 'plant_protein': return 'protein';
    case 'grains_bread': return 'grains';
    default: return 'other';
  }
}
export function groupShopping<T extends { key: string }>(lines: readonly T[], categoryOf: (key: string) => string | undefined): { group: ShopGroup; lines: T[] }[] {
  const by: Record<ShopGroup, T[]> = { produce: [], protein: [], grains: [], other: [] };
  for (const l of lines) by[shopGroupOf(categoryOf(l.key))].push(l);
  return SHOP_GROUPS.filter((g) => by[g].length > 0).map((g) => ({ group: g, lines: by[g] }));
}

/**
 * Menu items that the day's real food log already holds (same dish in the same meal slot), so leaving and coming back never
 * offers to log the same day twice. Each log entry covers at most one menu item.
 */
export function loggedFromDay(items: readonly MenuItem[], entries: readonly Pick<FoodEntry, 'dishId' | 'slot'>[]): Set<number> {
  const left = [...entries];
  const out = new Set<number>();
  items.forEach((it, i) => {
    const k = left.findIndex((e) => e.dishId === it.dishId && e.slot === it.slot);
    if (k >= 0) { out.add(i); left.splice(k, 1); }
  });
  return out;
}
