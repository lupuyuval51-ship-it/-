/**
 * Pure food-search helpers: a unified "loggable" model over FOODS / DISHES / MEAL_TEMPLATES / custom foods / recents,
 * plus bilingual matching with Hebrew normalisation (final letters, niqqud, proclitics, plural endings).
 */
import { detectAllergensInText, dishAllergens, normalizeText, type Allergen, type Dish } from '@lupu-fit/shared';
import type { FoodContent, MealTemplate } from '@lupu-fit/shared';

export interface Macros { kcal: number; proteinG: number; carbsG: number; fatG: number }
export type LoggableKind = 'food' | 'dish' | 'template' | 'custom' | 'recent' | 'barcode';
export interface Loggable {
  key: string; kind: LoggableKind; id: string;
  foodId?: string; dishId?: string;
  nameHe: string; nameEn: string;
  /** Macros per 100 g of the edible amount. */
  per100: Macros;
  /** One serving (food serving / whole dish / whole template / last logged amount), grams. */
  servingG: number;
  servingNameHe?: string; servingNameEn?: string;
  allergens: Allergen[];
  uses?: number;
}

const r1 = (n: number): number => Math.round(n * 10) / 10;
export const roundMacros = (m: Macros): Macros => ({ kcal: Math.round(m.kcal), proteinG: r1(m.proteinG), carbsG: r1(m.carbsG), fatG: r1(m.fatG) });
/** Macros for `grams` of something described per 100 g. */
export function macrosFor(per100: Macros, grams: number): Macros {
  const f = grams / 100;
  return roundMacros({ kcal: per100.kcal * f, proteinG: per100.proteinG * f, carbsG: per100.carbsG * f, fatG: per100.fatG * f });
}
export const per100From = (m: Macros, grams: number): Macros => (grams > 0 ? { kcal: (m.kcal / grams) * 100, proteinG: (m.proteinG / grams) * 100, carbsG: (m.carbsG / grams) * 100, fatG: (m.fatG / grams) * 100 } : { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0 });

const allergensFromText = (...texts: string[]): Allergen[] => {
  const out = new Set<Allergen>();
  for (const t of texts) for (const a of detectAllergensInText(t)) out.add(a);
  return [...out];
};
const union = (a: readonly Allergen[], b: readonly Allergen[]): Allergen[] => [...new Set<Allergen>([...a, ...b])];

export function fromFood(f: FoodContent): Loggable {
  return {
    key: `food:${f.id}`, kind: 'food', id: f.id, foodId: f.id, nameHe: f.nameHe, nameEn: f.nameEn,
    per100: { kcal: f.kcal, proteinG: f.proteinG, carbsG: f.carbsG, fatG: f.fatG }, servingG: f.servingG,
    servingNameHe: f.servingNameHe, servingNameEn: f.servingNameEn,
    allergens: union(f.allergens, allergensFromText(f.nameHe, f.nameEn)),
  };
}
export const dishGrams = (d: Dish): number => d.ingredients.reduce((s, i) => s + i.grams, 0);
export function fromDish(d: Dish): Loggable {
  const g = Math.max(1, dishGrams(d));
  return {
    key: `dish:${d.id}`, kind: 'dish', id: d.id, dishId: d.id, nameHe: d.nameHe, nameEn: d.nameEn,
    per100: per100From({ kcal: d.kcal, proteinG: d.proteinG, carbsG: d.carbsG, fatG: d.fatG }, g), servingG: g,
    allergens: [...dishAllergens(d)],
  };
}
export function fromTemplate(m: MealTemplate, foodById: ReadonlyMap<string, FoodContent>): Loggable {
  const g = Math.max(1, m.items.reduce((s, i) => s + i.grams, 0));
  const tags = m.items.flatMap((i) => { const f = foodById.get(i.foodId); return f ? [...f.allergens, ...allergensFromText(f.nameHe, f.nameEn)] : []; });
  return {
    key: `tpl:${m.id}`, kind: 'template', id: m.id, nameHe: m.nameHe, nameEn: m.nameEn,
    per100: per100From({ kcal: m.kcal, proteinG: m.proteinG, carbsG: m.carbsG, fatG: m.fatG }, g), servingG: g,
    allergens: union(tags, allergensFromText(m.nameHe, m.nameEn)),
  };
}
export interface CustomFoodRow { id: string; name: string; kcal: number; proteinG: number; carbsG: number; fatG: number; servingG: number; barcode?: string | null }
export function fromCustom(c: CustomFoodRow): Loggable {
  return { key: `custom:${c.id}`, kind: 'custom', id: c.id, nameHe: c.name, nameEn: c.name, per100: { kcal: c.kcal, proteinG: c.proteinG, carbsG: c.carbsG, fatG: c.fatG }, servingG: c.servingG, allergens: allergensFromText(c.name) };
}

export interface LogRow { foodId?: string | null; dishId?: string | null; name: string; grams: number; kcal: number; proteinG: number; carbsG: number; fatG: number; loggedDate?: string }
/** Recent + frequent items derived from logged entries (most used first, then most recent). */
export function deriveRecents(rows: readonly LogRow[], foodById: ReadonlyMap<string, FoodContent>, dishById: ReadonlyMap<string, Dish>, limit = 12): Loggable[] {
  const groups = new Map<string, { last: LogRow; n: number; order: number }>();
  rows.forEach((r, order) => {
    const k = r.foodId ? `f:${r.foodId}` : r.dishId ? `d:${r.dishId}` : `n:${normalizeText(r.name)}`;
    const g = groups.get(k);
    if (g) { g.n += 1; g.last = r; g.order = order; } else groups.set(k, { last: r, n: 1, order });
  });
  return [...groups.entries()]
    .sort((a, b) => b[1].n - a[1].n || b[1].order - a[1].order)
    .slice(0, limit)
    .map(([k, g]): Loggable => {
      const r = g.last;
      const tagged = r.foodId ? foodById.get(r.foodId)?.allergens : r.dishId ? (dishById.get(r.dishId) ? [...dishAllergens(dishById.get(r.dishId)!)] : undefined) : undefined;
      return {
        key: `recent:${k}`, kind: 'recent', id: k, ...(r.foodId ? { foodId: r.foodId } : {}), ...(r.dishId ? { dishId: r.dishId } : {}),
        nameHe: r.name, nameEn: r.name, per100: per100From(r, r.grams), servingG: r.grams,
        allergens: union(tagged ?? [], allergensFromText(r.name)), uses: g.n,
      };
    });
}

/* -------------------------------------------------------------- matching */

const PROCLITICS = new Set(['ו', 'ב', 'ל', 'מ', 'כ', 'ה', 'ש']);
/** Plural / feminine endings, normalised (final letters folded): ים→ימ, ות. */
const HE_ENDINGS = ['ימ', 'ות', 'ה', 'ת', 'י'];

export function foldText(s: string): string { return normalizeText(s).replace(/\s+/g, ' ').trim(); }
export function tokensOf(s: string): string[] { return foldText(s).split(/[^a-zא-ת0-9]+/).filter(Boolean); }

/** Candidate stems of a query token: itself, without one proclitic, without a plural/feminine ending, English plural. */
export function queryVariants(tok: string): string[] {
  const out = new Set<string>([tok]);
  if (/[א-ת]/.test(tok)) {
    const bases = [tok];
    if (tok.length >= 4 && PROCLITICS.has(tok[0]!)) { bases.push(tok.slice(1)); if (tok.length >= 5 && PROCLITICS.has(tok[1]!) && PROCLITICS.has(tok[0]!)) bases.push(tok.slice(2)); }
    for (const b of bases) {
      out.add(b);
      for (const e of HE_ENDINGS) if (b.length - e.length >= 2 && b.endsWith(e)) out.add(b.slice(0, -e.length));
    }
  } else {
    if (tok.endsWith('ies') && tok.length > 4) out.add(`${tok.slice(0, -3)}y`);
    else if (tok.endsWith('es') && tok.length > 3) out.add(tok.slice(0, -2));
    if (tok.endsWith('s') && tok.length > 3) out.add(tok.slice(0, -1));
  }
  return [...out].filter((v) => v.length >= 1);
}

/** 0 = no match; higher is better. Every query token must match some word of the haystack. */
export function matchScore(query: string, haystacks: readonly string[]): number {
  const qt = tokensOf(query);
  if (qt.length === 0) return 0;
  const hay = haystacks.map(foldText);
  const hayTokens = hay.flatMap(tokensOf);
  let total = 0;
  for (const q of qt) {
    let best = 0;
    for (const v of queryVariants(q)) {
      const w = v === q ? 1 : 0.85;
      for (const h of hayTokens) {
        if (h === v) best = Math.max(best, 3 * w);
        else if (h.startsWith(v) && v.length >= 2) best = Math.max(best, 2 * w);
        else if (v.length >= 3 && h.includes(v)) best = Math.max(best, 1 * w);
      }
    }
    if (best === 0) return 0;
    total += best;
  }
  if (hay.some((h) => h === foldText(query))) total += 3;
  else if (hay.some((h) => h.startsWith(foldText(query)))) total += 1;
  return total;
}

const KIND_RANK: Record<LoggableKind, number> = { recent: 0, custom: 1, food: 2, dish: 3, template: 4, barcode: 5 };

export function searchLoggables(items: readonly Loggable[], query: string, limit = 40): Loggable[] {
  if (foldText(query) === '') return [];
  return items
    .map((it) => ({ it, s: matchScore(query, [it.nameHe, it.nameEn]) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s || KIND_RANK[a.it.kind] - KIND_RANK[b.it.kind] || a.it.nameEn.length - b.it.nameEn.length)
    .slice(0, limit)
    .map((x) => x.it);
}

/** Allergens of the item that the user is allergic to (structured tags ∪ keyword detection on the names). */
export function allergenHits(item: Pick<Loggable, 'allergens' | 'nameHe' | 'nameEn'>, userAllergies: readonly Allergen[]): Allergen[] {
  if (userAllergies.length === 0) return [];
  const present = new Set<Allergen>([...item.allergens, ...allergensFromText(item.nameHe, item.nameEn)]);
  return userAllergies.filter((a) => present.has(a));
}
export const allergenHitsInText = (text: string, userAllergies: readonly Allergen[]): Allergen[] => {
  const present = detectAllergensInText(text);
  return userAllergies.filter((a) => present.has(a));
};

export function servingPresets(item: Pick<Loggable, 'kind' | 'servingG'>): number[] {
  const s = Math.max(1, Math.round(item.servingG));
  const set = new Set<number>([Math.max(1, Math.round(s / 2)), s, Math.round(s * 1.5), s * 2]);
  if (item.kind === 'food') set.add(100);
  return [...set].sort((a, b) => a - b);
}
