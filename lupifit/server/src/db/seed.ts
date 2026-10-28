/**
 * Idempotent content seeder: upserts the built-in exercise library, food database and
 * meal templates. A content hash in app_meta skips work when nothing changed.
 * User-created data is never touched.
 */
import crypto from 'node:crypto';
import { EXERCISE_LIBRARY } from '../data/exercises/index';
import { FOOD_DATABASE } from '../data/foods/index';
import { MEAL_TEMPLATES } from '../data/meal-templates';
import { db, type Sql } from './pool';

const CONTENT_KEY = 'content_seed_hash';

export function contentHash(): string {
  return crypto
    .createHash('sha256')
    .update(JSON.stringify([EXERCISE_LIBRARY, FOOD_DATABASE, MEAL_TEMPLATES]))
    .digest('hex');
}

const searchText = (...parts: (string | null | undefined)[]) =>
  parts
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
    .replace(/[_-]+/g, ' ');

async function seedExercises(tx: Sql) {
  for (const e of EXERCISE_LIBRARY) {
    await tx.exec(
      `INSERT INTO exercises (id, name, description, primary_muscles, secondary_muscles, equipment, category, movement_pattern,
         difficulty, tracking_type, unilateral, is_compound, instructions, mistakes, safety, contraindications,
         easier_alternatives, harder_alternatives, load_increment_kg, search_text)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name, description = EXCLUDED.description, primary_muscles = EXCLUDED.primary_muscles,
         secondary_muscles = EXCLUDED.secondary_muscles, equipment = EXCLUDED.equipment, category = EXCLUDED.category,
         movement_pattern = EXCLUDED.movement_pattern, difficulty = EXCLUDED.difficulty, tracking_type = EXCLUDED.tracking_type,
         unilateral = EXCLUDED.unilateral, is_compound = EXCLUDED.is_compound, instructions = EXCLUDED.instructions,
         mistakes = EXCLUDED.mistakes, safety = EXCLUDED.safety, contraindications = EXCLUDED.contraindications,
         easier_alternatives = EXCLUDED.easier_alternatives, harder_alternatives = EXCLUDED.harder_alternatives,
         load_increment_kg = EXCLUDED.load_increment_kg, search_text = EXCLUDED.search_text`,
      [
        e.id,
        JSON.stringify(e.name),
        JSON.stringify(e.description),
        e.primaryMuscles,
        e.secondaryMuscles,
        e.equipment,
        e.category,
        e.movementPattern,
        e.difficulty,
        e.trackingType,
        e.unilateral,
        e.isCompound,
        JSON.stringify(e.instructions),
        JSON.stringify(e.mistakes),
        JSON.stringify(e.safety),
        e.contraindications,
        e.easierAlternatives,
        e.harderAlternatives,
        e.loadIncrementKg,
        searchText(e.id, e.name.en, e.name.he, ...e.primaryMuscles),
      ],
    );
  }
}

async function seedFoods(tx: Sql) {
  for (const f of FOOD_DATABASE) {
    await tx.exec(
      `INSERT INTO foods (slug, owner_user_id, source, name, brand, barcode, category, kcal, protein_g, carbs_g, fat_g, fiber_g,
         sugar_g, sodium_mg, serving_grams, serving_label, allergens, animal_source, contains, search_text)
       VALUES ($1, NULL, 'builtin', $2, NULL, NULL, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
       ON CONFLICT (slug) DO UPDATE SET
         name = EXCLUDED.name, category = EXCLUDED.category, kcal = EXCLUDED.kcal, protein_g = EXCLUDED.protein_g,
         carbs_g = EXCLUDED.carbs_g, fat_g = EXCLUDED.fat_g, fiber_g = EXCLUDED.fiber_g, sugar_g = EXCLUDED.sugar_g,
         sodium_mg = EXCLUDED.sodium_mg, serving_grams = EXCLUDED.serving_grams, serving_label = EXCLUDED.serving_label,
         allergens = EXCLUDED.allergens, animal_source = EXCLUDED.animal_source, contains = EXCLUDED.contains,
         search_text = EXCLUDED.search_text`,
      [
        f.slug,
        JSON.stringify(f.name),
        f.category,
        f.per100g.kcal,
        f.per100g.protein,
        f.per100g.carbs,
        f.per100g.fat,
        f.per100g.fiber,
        f.per100g.sugar,
        f.per100g.sodiumMg,
        f.serving.grams,
        JSON.stringify(f.serving.label),
        f.allergens,
        f.animalSource,
        f.contains,
        searchText(f.name.en, f.name.he, f.slug),
      ],
    );
  }
}

async function seedMealTemplates(tx: Sql) {
  const slugs = MEAL_TEMPLATES.map((m) => m.slug);
  for (const m of MEAL_TEMPLATES) {
    await tx.exec(
      `INSERT INTO meal_templates (slug, name, description, meal_types, items, prep_minutes, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, now())
       ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description,
         meal_types = EXCLUDED.meal_types, items = EXCLUDED.items, prep_minutes = EXCLUDED.prep_minutes, updated_at = now()`,
      [m.slug, JSON.stringify(m.name), JSON.stringify(m.description), m.mealTypes, JSON.stringify(m.items), m.prepMinutes],
    );
  }
  // Templates removed from the dataset are dropped (they hold no user data).
  await tx.exec('DELETE FROM meal_templates WHERE NOT (slug = ANY($1::text[]))', [slugs]);
}

export interface SeedResult {
  skipped: boolean;
  exercises: number;
  foods: number;
  mealTemplates: number;
}

export async function seedContent(options: { force?: boolean } = {}): Promise<SeedResult> {
  const hash = contentHash();
  const counts = { exercises: EXERCISE_LIBRARY.length, foods: FOOD_DATABASE.length, mealTemplates: MEAL_TEMPLATES.length };
  return db.tx(async (tx) => {
    // Serialize concurrent seeders.
    await tx.exec('SELECT pg_advisory_xact_lock(74617202)');
    const current = await tx.maybeOne<{ value: string }>('SELECT value FROM app_meta WHERE key = $1', [CONTENT_KEY]);
    if (!options.force && current?.value === hash) return { skipped: true, ...counts };
    await seedExercises(tx);
    await seedFoods(tx);
    await seedMealTemplates(tx);
    await tx.exec(
      `INSERT INTO app_meta (key, value, updated_at) VALUES ($1, $2, now())
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
      [CONTENT_KEY, hash],
    );
    return { skipped: false, ...counts };
  });
}
