/**
 * Food database access: DTO mapping, user-scoped lookups, bilingual search, healthier
 * alternatives and CRUD for the user's own foods. A food is visible to a user when it is
 * global (built-in or cached Open Food Facts product) or owned by that user — never
 * another user's food.
 */
import { FOOD_CATEGORIES, type Allergen, type AnimalSource, type FoodCategory, type FoodContains } from '@shared/constants';
import { foodConflicts, type DietPreferences, type Per100g } from '@shared/nutrition';
import type { FoodDTO, FoodSource, LocalizedText } from '@shared/types';
import type { customFoodSchema, updateCustomFoodSchema } from '@shared/schemas/nutrition';
import type { z } from 'zod';
import type { Sql } from '../../db/pool';
import { notFound, unprocessable } from '../../lib/errors';

export interface FoodRow {
  id: string;
  slug: string | null;
  owner_user_id: string | null;
  source: FoodSource;
  name: LocalizedText;
  brand: string | null;
  barcode: string | null;
  category: FoodCategory;
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  sugar_g: number | null;
  sodium_mg: number | null;
  serving_grams: number;
  serving_label: LocalizedText;
  allergens: Allergen[];
  animal_source: AnimalSource;
  contains: FoodContains[];
  search_text: string;
  created_at: Date;
  updated_at: Date;
}

/** Visibility rule for foods (`$n` is the user id parameter). */
export const visibleTo = (alias: string, param: string) => `(${alias}.owner_user_id IS NULL OR ${alias}.owner_user_id = ${param})`;

/** Maximum number of custom foods per user (keeps the table and search fast). */
export const MAX_USER_FOODS = 1000;

/** Categories that are mainly eaten for protein (used for protein swaps). */
export const PROTEIN_RICH_CATEGORIES: FoodCategory[] = ['meat', 'poultry', 'fish_seafood', 'eggs', 'plant_protein'];

export function per100gOf(row: Pick<FoodRow, 'kcal' | 'protein_g' | 'carbs_g' | 'fat_g' | 'fiber_g'>): Per100g {
  return {
    kcal: Number(row.kcal),
    protein: Number(row.protein_g),
    carbs: Number(row.carbs_g),
    fat: Number(row.fat_g),
    fiber: Number(row.fiber_g),
  };
}

export function toFoodDTO(row: FoodRow, userId: string, prefs: DietPreferences): FoodDTO {
  const flags = { allergens: row.allergens ?? [], animalSource: row.animal_source, contains: row.contains ?? [] };
  return {
    id: row.id,
    slug: row.slug,
    source: row.source,
    name: row.name,
    brand: row.brand,
    barcode: row.barcode,
    category: row.category,
    per100g: {
      kcal: Number(row.kcal),
      protein: Number(row.protein_g),
      carbs: Number(row.carbs_g),
      fat: Number(row.fat_g),
      fiber: Number(row.fiber_g),
      sugar: row.sugar_g != null ? Number(row.sugar_g) : null,
      sodiumMg: row.sodium_mg != null ? Number(row.sodium_mg) : null,
    },
    serving: { grams: Number(row.serving_grams), label: row.serving_label },
    allergens: flags.allergens,
    animalSource: flags.animalSource,
    contains: flags.contains,
    isOwn: row.owner_user_id === userId,
    conflicts: foodConflicts(flags, prefs),
  };
}

export async function getVisibleFood(sql: Sql, userId: string, foodId: string): Promise<FoodRow | null> {
  return sql.maybeOne<FoodRow>(`SELECT f.* FROM foods f WHERE f.id = $1 AND ${visibleTo('f', '$2')}`, [foodId, userId]);
}

export async function requireVisibleFood(sql: Sql, userId: string, foodId: string): Promise<FoodRow> {
  const row = await getVisibleFood(sql, userId, foodId);
  if (!row) throw notFound('food_not_found', 'Food not found');
  return row;
}

export async function getFoodsBySlugs(sql: Sql, slugs: string[]): Promise<Map<string, FoodRow>> {
  if (!slugs.length) return new Map();
  const rows = await sql.many<FoodRow>('SELECT f.* FROM foods f WHERE f.slug = ANY($1::text[]) AND f.owner_user_id IS NULL', [slugs]);
  return new Map(rows.map((r) => [r.slug!, r]));
}

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

/** Lower-cases, strips Hebrew niqqud / Latin diacritics and punctuation, collapses spaces. */
export function normalizeSearch(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[֑-ׇ]/g, '')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[\-_'"׳״`´,.;:()[\]{}/\\|!?*+&#@~^=<>]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Text indexed for a food (same shape the content seeder writes). */
export function foodSearchText(...parts: (string | null | undefined)[]): string {
  return parts
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
    .replace(/[_-]+/g, ' ');
}

const escapeLike = (s: string) => s.replace(/[\\%_]/g, (c) => `\\${c}`);

export interface SearchOptions {
  q: string;
  category?: FoodCategory;
  compatibleOnly: boolean;
  limit: number;
}

interface ScoredRow {
  row: FoodRow & { sim: number };
  bucket: number;
}

/**
 * Relevance bucket (lower is better): 0 = a name starts with the whole query,
 * 1 = every term starts a word of a name, 2 = every term appears somewhere,
 * 3 = fuzzy (trigram) match only.
 */
export function relevanceBucket(row: Pick<FoodRow, 'name' | 'brand' | 'search_text'>, terms: string[]): number {
  const names = [normalizeSearch(row.name.en), normalizeSearch(row.name.he), normalizeSearch(row.brand ?? '')].filter(Boolean);
  const hay = normalizeSearch(`${row.search_text} ${row.brand ?? ''}`);
  const full = terms.join(' ');
  if (names.some((n) => n.startsWith(full))) return 0;
  if (terms.every((t) => names.some((n) => ` ${n}`.includes(` ${t}`)))) return 1;
  if (terms.every((t) => hay.includes(t))) return 2;
  return 3;
}

async function popularFoods(sql: Sql, userId: string, category: FoodCategory | undefined): Promise<FoodRow[]> {
  const frequent = await sql.many<FoodRow>(
    `SELECT f.* FROM (
        SELECT food_id, count(*) AS times, max(created_at) AS last_at
          FROM food_log_entries
         WHERE user_id = $1 AND food_id IS NOT NULL AND logged_on >= CURRENT_DATE - 90
         GROUP BY food_id
      ) c
      JOIN foods f ON f.id = c.food_id AND ${visibleTo('f', '$1')}
     WHERE ($2::text IS NULL OR f.category = $2)
     ORDER BY c.times DESC, c.last_at DESC
     LIMIT 50`,
    [userId, category ?? null],
  );
  const own = await sql.many<FoodRow>(
    `SELECT f.* FROM foods f WHERE f.owner_user_id = $1 AND ($2::text IS NULL OR f.category = $2) ORDER BY f.updated_at DESC LIMIT 50`,
    [userId, category ?? null],
  );
  const builtin = await sql.many<FoodRow>(
    `SELECT f.* FROM foods f WHERE f.source = 'builtin' AND f.owner_user_id IS NULL AND ($1::text IS NULL OR f.category = $1)
      ORDER BY char_length(f.name->>'en'), f.name->>'en'`,
    [category ?? null],
  );
  // Round-robin across categories so the default list shows variety rather than 20 cheeses.
  const byCategory = new Map<FoodCategory, FoodRow[]>();
  for (const r of builtin) byCategory.set(r.category, [...(byCategory.get(r.category) ?? []), r]);
  const ordered: FoodRow[] = [];
  const queues = FOOD_CATEGORIES.map((c) => byCategory.get(c) ?? []).filter((q) => q.length > 0);
  for (let i = 0; queues.some((q) => i < q.length); i++) for (const q of queues) if (q[i]) ordered.push(q[i]!);
  const seen = new Set<string>();
  return [...frequent, ...own, ...ordered].filter((r) => (seen.has(r.id) ? false : (seen.add(r.id), true)));
}

/** Ranked search over global foods and the user's own foods (never other users'). */
export async function searchFoods(sql: Sql, userId: string, prefs: DietPreferences, opts: SearchOptions): Promise<FoodDTO[]> {
  const q = normalizeSearch(opts.q);
  let rows: FoodRow[];
  if (!q) {
    rows = await popularFoods(sql, userId, opts.category);
  } else {
    const terms = q.split(' ').filter(Boolean).slice(0, 6);
    const candidates = await sql.many<FoodRow & { sim: number }>(
      `SELECT f.*, GREATEST(similarity(f.search_text, $2), word_similarity($2, f.search_text)) AS sim
         FROM foods f
        WHERE ${visibleTo('f', '$1')}
          AND ($3::text IS NULL OR f.category = $3)
          AND (
            NOT EXISTS (SELECT 1 FROM unnest($4::text[]) AS t(term) WHERE f.search_text NOT ILIKE '%' || t.term || '%')
            OR ($5::boolean AND word_similarity($2, f.search_text) >= 0.5)
          )
        ORDER BY sim DESC
        LIMIT 300`,
      [userId, q, opts.category ?? null, terms.map(escapeLike), q.length >= 4],
    );
    const scored: ScoredRow[] = candidates.map((row) => ({ row, bucket: relevanceBucket(row, terms) }));
    scored.sort(
      (a, b) =>
        a.bucket - b.bucket ||
        b.row.sim - a.row.sim ||
        a.row.name.en.length - b.row.name.en.length ||
        a.row.name.en.localeCompare(b.row.name.en),
    );
    rows = scored.map((s) => s.row);
  }
  const out: FoodDTO[] = [];
  for (const row of rows) {
    const dto = toFoodDTO(row, userId, prefs);
    if (opts.compatibleOnly && dto.conflicts.length > 0) continue;
    out.push(dto);
    if (out.length >= opts.limit) break;
  }
  return out;
}

const UNPREPARED = /\b(raw|dry|uncooked|dried)\b/;

/**
 * Best database match for a free-text food (photo analysis), or null when the match is weak.
 * `query` is the short search phrase; `context` (e.g. "grilled chicken breast") breaks ties
 * between variants, and unprepared forms (raw/dry) are only preferred when mentioned.
 */
export async function bestMatch(sql: Sql, userId: string, prefs: DietPreferences, query: string, context = ''): Promise<FoodDTO | null> {
  const q = normalizeSearch(query);
  if (!q) return null;
  const terms = q.split(' ').filter(Boolean).slice(0, 6);
  const contextText = normalizeSearch(`${context} ${query}`);
  const contextTerms = Array.from(new Set(contextText.split(' ').filter((w) => w.length >= 3)));
  const wantsUnprepared = UNPREPARED.test(contextText);
  const rows = await sql.many<FoodRow & { sim: number }>(
    `SELECT f.*, GREATEST(similarity(f.search_text, $2), word_similarity($2, f.search_text)) AS sim
       FROM foods f
      WHERE ${visibleTo('f', '$1')}
        AND (
          NOT EXISTS (SELECT 1 FROM unnest($3::text[]) AS t(term) WHERE f.search_text NOT ILIKE '%' || t.term || '%')
          OR word_similarity($2, f.search_text) >= 0.6
        )
      ORDER BY sim DESC
      LIMIT 100`,
    [userId, q, terms.map(escapeLike)],
  );
  const scored = rows
    .map((row) => {
      const name = normalizeSearch(row.name.en);
      const hits = contextTerms.filter((t) => name.includes(t)).length;
      const unpreparedPenalty = !wantsUnprepared && UNPREPARED.test(name) ? 1 : 0;
      return { row, bucket: relevanceBucket(row, terms), score: hits - unpreparedPenalty };
    })
    .filter((s) => s.bucket <= 2 || s.row.sim >= 0.6)
    .sort((a, b) => a.bucket - b.bucket || b.score - a.score || b.row.sim - a.row.sim || a.row.name.en.length - b.row.name.en.length);
  const best = scored[0];
  return best ? toFoodDTO(best.row, userId, prefs) : null;
}

// ---------------------------------------------------------------------------
// Alternatives
// ---------------------------------------------------------------------------

export function isProteinRich(food: Pick<FoodRow, 'category' | 'kcal' | 'protein_g'>): boolean {
  if (PROTEIN_RICH_CATEGORIES.includes(food.category)) return true;
  const kcal = Number(food.kcal);
  return kcal > 0 && (Number(food.protein_g) * 4) / kcal >= 0.35;
}

/**
 * Compatible foods (no conflicts with the user's allergies/diet/restrictions) from the same
 * category with the closest energy and protein per 100 g. Protein-rich foods also get
 * protein swaps from other protein-rich categories (e.g. chicken → tofu for vegetarians).
 */
export async function foodAlternatives(sql: Sql, userId: string, prefs: DietPreferences, food: FoodRow, limit = 6): Promise<FoodDTO[]> {
  const proteinSwap = isProteinRich(food);
  const categories = proteinSwap ? Array.from(new Set([food.category, ...PROTEIN_RICH_CATEGORIES])) : [food.category];
  const rows = await sql.many<FoodRow>(
    `SELECT f.* FROM foods f
      WHERE f.id <> $1
        AND (f.source = 'builtin' OR f.owner_user_id = $2)
        AND ${visibleTo('f', '$2')}
        AND f.category = ANY($3::text[])`,
    [food.id, userId, categories],
  );
  const k0 = Number(food.kcal);
  const p0 = Number(food.protein_g);
  return rows
    .map((row) => ({ row, dto: toFoodDTO(row, userId, prefs) }))
    .filter(({ row, dto }) => dto.conflicts.length === 0 && (row.category === food.category || isProteinRich(row)))
    .map(({ row, dto }) => {
      const dk = Math.abs(Number(row.kcal) - k0) / Math.max(100, k0);
      const dp = Math.abs(Number(row.protein_g) - p0) / Math.max(10, p0);
      return { dto, distance: dk + dp + (row.category === food.category ? 0 : 0.35) };
    })
    .sort((a, b) => a.distance - b.distance || a.dto.name.en.localeCompare(b.dto.name.en))
    .slice(0, limit)
    .map((x) => x.dto);
}

// ---------------------------------------------------------------------------
// The user's own foods
// ---------------------------------------------------------------------------

type CustomFoodInput = z.output<typeof customFoodSchema>;
type CustomFoodPatch = z.output<typeof updateCustomFoodSchema>;

export async function listOwnFoods(sql: Sql, userId: string): Promise<FoodRow[]> {
  return sql.many<FoodRow>('SELECT f.* FROM foods f WHERE f.owner_user_id = $1 ORDER BY f.updated_at DESC', [userId]);
}

export async function createUserFood(sql: Sql, userId: string, input: CustomFoodInput): Promise<FoodRow> {
  // Serialize per user so the quota check cannot be raced.
  await sql.exec('SELECT pg_advisory_xact_lock(hashtext($1))', [`foods:${userId}`]);
  const { count } = await sql.one<{ count: number }>('SELECT count(*)::int AS count FROM foods WHERE owner_user_id = $1', [userId]);
  if (count >= MAX_USER_FOODS) throw unprocessable('food_limit_reached', 'Too many custom foods');
  return sql.one<FoodRow>(
    `INSERT INTO foods (owner_user_id, source, name, brand, barcode, category, kcal, protein_g, carbs_g, fat_g, fiber_g, sugar_g,
        sodium_mg, serving_grams, serving_label, allergens, animal_source, contains, search_text)
     VALUES ($1, 'user', $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
     RETURNING *`,
    [
      userId,
      JSON.stringify({ en: input.name, he: input.name }),
      input.brand || null,
      input.barcode,
      input.category,
      input.per100g.kcal,
      input.per100g.protein,
      input.per100g.carbs,
      input.per100g.fat,
      input.per100g.fiber,
      input.per100g.sugar,
      input.per100g.sodiumMg,
      input.servingGrams,
      JSON.stringify({ en: input.servingLabel, he: input.servingLabel }),
      Array.from(new Set(input.allergens)),
      input.animalSource,
      Array.from(new Set(input.contains)),
      foodSearchText(input.name, input.brand),
    ],
  );
}

export async function updateUserFood(sql: Sql, userId: string, foodId: string, patch: CustomFoodPatch): Promise<FoodRow> {
  const row = await sql.maybeOne<FoodRow>('SELECT f.* FROM foods f WHERE f.id = $1 AND f.owner_user_id = $2 FOR UPDATE', [foodId, userId]);
  if (!row) throw notFound('food_not_found', 'Food not found');
  const name = patch.name ?? row.name.en;
  const brand = patch.brand !== undefined ? patch.brand || null : row.brand;
  const per = patch.per100g;
  const label = patch.servingLabel !== undefined ? { en: patch.servingLabel, he: patch.servingLabel } : row.serving_label;
  return sql.one<FoodRow>(
    `UPDATE foods SET name = $3, brand = $4, barcode = $5, category = $6, kcal = $7, protein_g = $8, carbs_g = $9, fat_g = $10,
        fiber_g = $11, sugar_g = $12, sodium_mg = $13, serving_grams = $14, serving_label = $15, allergens = $16,
        animal_source = $17, contains = $18, search_text = $19
      WHERE id = $1 AND owner_user_id = $2
      RETURNING *`,
    [
      foodId,
      userId,
      JSON.stringify({ en: name, he: name }),
      brand,
      patch.barcode !== undefined ? patch.barcode : row.barcode,
      patch.category ?? row.category,
      per ? per.kcal : row.kcal,
      per ? per.protein : row.protein_g,
      per ? per.carbs : row.carbs_g,
      per ? per.fat : row.fat_g,
      per ? per.fiber : row.fiber_g,
      per ? per.sugar : row.sugar_g,
      per ? per.sodiumMg : row.sodium_mg,
      patch.servingGrams ?? row.serving_grams,
      JSON.stringify(label),
      patch.allergens ? Array.from(new Set(patch.allergens)) : row.allergens,
      patch.animalSource ?? row.animal_source,
      patch.contains ? Array.from(new Set(patch.contains)) : row.contains,
      foodSearchText(name, brand),
    ],
  );
}

/** Deletes the user's own food. Log entries keep their nutrient snapshot (food_id → NULL). */
export async function deleteUserFood(sql: Sql, userId: string, foodId: string): Promise<void> {
  const n = await sql.exec('DELETE FROM foods WHERE id = $1 AND owner_user_id = $2', [foodId, userId]);
  if (n === 0) throw notFound('food_not_found', 'Food not found');
}
