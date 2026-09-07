/**
 * Effective exercise catalog on the server.
 * Builtin exercises come from src/content/exercises (authored separately – loaded lazily and guarded so the
 * server keeps working when the module is missing or broken). Admin overrides live in `exercise_catalog`:
 *   source "builtin" rows mirror a builtin drill (seeded lazily) and may be disabled or edited,
 *   source "admin"   rows are additions.
 * The public /api/catalog/overrides endpoint exposes the merge result to the client (cached 5 minutes).
 */
import { eq } from "drizzle-orm";
import { getDb, schema } from "./db/client";
import { HttpError } from "./http";
import { canonicalJson } from "./util/hash";
import { exerciseSchema } from "./validation/exerciseSchema";
import { loadDefaultCatalog } from "@/engine/workoutEngine";
import type { Exercise } from "@/lib/types";
import type { AdminExerciseRow, CatalogOverridesResponse } from "@/lib/serverTypes";

const TTL_MS = 5 * 60_000;

let builtinCache: { at: number; list: Exercise[] } | null = null;
let overridesCache: { at: number; value: CatalogOverridesResponse } | null = null;

export function invalidateCatalogCache(): void {
  overridesCache = null;
  builtinCache = null;
}

/**
 * Builtin catalog from the content module (`EXERCISES` from src/content/exercises), loaded through the engine's
 * guarded lazy import so the server keeps working when the module is missing. Empty list on failure.
 */
export async function getBuiltinCatalog(): Promise<Exercise[]> {
  if (builtinCache && Date.now() - builtinCache.at < TTL_MS) return builtinCache.list;
  let list: Exercise[] = [];
  try {
    const loaded = await loadDefaultCatalog();
    if (Array.isArray(loaded)) list = loaded.filter((e) => e && typeof e.id === "string");
  } catch (err) {
    if (process.env.NODE_ENV !== "test") console.warn("[catalog] builtin exercises unavailable:", err instanceof Error ? err.message : err);
  }
  builtinCache = { at: Date.now(), list };
  return list;
}

/** Test / admin hook: override the builtin catalog without touching the content module. */
export function setBuiltinCatalogForTests(list: Exercise[] | null): void {
  builtinCache = list ? { at: Date.now(), list } : null;
  overridesCache = null;
}

type CatalogRow = typeof schema.exerciseCatalog.$inferSelect;

function parseRow(row: CatalogRow): Exercise | null {
  const parsed = exerciseSchema.safeParse(row.data);
  return parsed.success ? parsed.data : null;
}

async function loadRows(): Promise<CatalogRow[]> {
  try {
    const db = await getDb();
    return await db.select().from(schema.exerciseCatalog);
  } catch {
    return [];
  }
}

/** Inserts every builtin drill as a `builtin` row (no-op for rows that already exist). */
export async function seedBuiltinCatalog(): Promise<number> {
  const builtin = await getBuiltinCatalog();
  if (builtin.length === 0) return 0;
  const db = await getDb();
  const now = new Date();
  let inserted = 0;
  for (let i = 0; i < builtin.length; i += 50) {
    const chunk = builtin.slice(i, i + 50).map((e) => ({ id: e.id, data: e as unknown as object, source: "builtin" as const, enabled: true, updatedAt: now }));
    const res = await db.insert(schema.exerciseCatalog).values(chunk).onConflictDoNothing().returning({ id: schema.exerciseCatalog.id });
    inserted += res.length;
  }
  return inserted;
}

/** Admin-added / admin-edited enabled drills + disabled builtin ids. Cached 5 minutes. */
export async function getCatalogOverrides(): Promise<CatalogOverridesResponse> {
  if (overridesCache && Date.now() - overridesCache.at < TTL_MS) return overridesCache.value;
  const [builtin, rows] = await Promise.all([getBuiltinCatalog(), loadRows()]);
  const builtinById = new Map(builtin.map((e) => [e.id, e]));
  const enabled: Exercise[] = [];
  const disabledIds: string[] = [];
  let latest = 0;
  for (const row of rows) {
    latest = Math.max(latest, row.updatedAt.getTime());
    if (!row.enabled) {
      if (builtinById.has(row.id)) disabledIds.push(row.id);
      continue;
    }
    const exercise = parseRow(row);
    if (!exercise) continue;
    const original = builtinById.get(row.id);
    if (!original || canonicalJson(original) !== canonicalJson(exercise)) enabled.push(exercise);
  }
  const value: CatalogOverridesResponse = { ok: true, enabled, disabledIds, updatedAt: new Date(latest || Date.now()).toISOString() };
  overridesCache = { at: Date.now(), value };
  return value;
}

/** Builtin catalog with admin overrides applied (what the engine and the Claude prompts should use). */
export async function getEffectiveCatalog(): Promise<Exercise[]> {
  const [builtin, overrides] = await Promise.all([getBuiltinCatalog(), getCatalogOverrides()]);
  const disabled = new Set(overrides.disabledIds);
  const replaced = new Map(overrides.enabled.map((e) => [e.id, e]));
  const out: Exercise[] = [];
  for (const e of builtin) {
    if (disabled.has(e.id)) continue;
    out.push(replaced.get(e.id) ?? e);
    replaced.delete(e.id);
  }
  for (const e of replaced.values()) out.push(e);
  return out;
}

/** Admin listing: builtin (with row state) merged with admin additions. */
export async function listCatalogForAdmin(): Promise<AdminExerciseRow[]> {
  const [builtin, rows] = await Promise.all([getBuiltinCatalog(), loadRows()]);
  const byId = new Map(rows.map((r) => [r.id, r]));
  const out: AdminExerciseRow[] = [];
  for (const original of builtin) {
    const row = byId.get(original.id);
    const stored = row ? parseRow(row) : null;
    const exercise = stored ?? original;
    out.push({
      exercise,
      source: "builtin",
      enabled: row ? row.enabled : true,
      modified: Boolean(stored) && canonicalJson(stored) !== canonicalJson(original),
      updatedAt: row ? row.updatedAt.toISOString() : null,
    });
    byId.delete(original.id);
  }
  for (const row of byId.values()) {
    const exercise = parseRow(row);
    if (!exercise) continue;
    out.push({ exercise, source: row.source === "builtin" ? "builtin" : "admin", enabled: row.enabled, modified: false, updatedAt: row.updatedAt.toISOString() });
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Admin mutations                                                     */
/* ------------------------------------------------------------------ */

/** Validates an exercise payload (400 "validation" with issue paths on failure). */
export function parseExercise(data: unknown): Exercise {
  const result = exerciseSchema.safeParse(data);
  if (!result.success) {
    throw new HttpError(400, "validation", { issues: result.error.issues.slice(0, 20).map((i) => ({ path: i.path.map(String).join("."), message: i.message })) });
  }
  return result.data;
}

/** Adds a new admin-authored drill. 409 when the id already exists (builtin or stored). */
export async function createCatalogExercise(data: unknown): Promise<AdminExerciseRow> {
  const exercise = parseExercise(data);
  const builtin = await getBuiltinCatalog();
  if (builtin.some((e) => e.id === exercise.id)) throw new HttpError(409, "exercise_exists");
  const db = await getDb();
  const existing = await db.select({ id: schema.exerciseCatalog.id }).from(schema.exerciseCatalog).where(eq(schema.exerciseCatalog.id, exercise.id)).limit(1);
  if (existing.length) throw new HttpError(409, "exercise_exists");
  const now = new Date();
  await db.insert(schema.exerciseCatalog).values({ id: exercise.id, data: exercise as unknown as object, source: "admin", enabled: true, updatedAt: now });
  overridesCache = null;
  return { exercise, source: "admin", enabled: true, modified: false, updatedAt: now.toISOString() };
}

/**
 * Updates a drill (builtin drills get an override row) and/or toggles `enabled`.
 * At least one of `exercise` / `enabled` must be given.
 */
export async function updateCatalogExercise(id: string, patch: { exercise?: unknown; enabled?: boolean }): Promise<AdminExerciseRow> {
  const builtin = await getBuiltinCatalog();
  const original = builtin.find((e) => e.id === id);
  const db = await getDb();
  const rows = await db.select().from(schema.exerciseCatalog).where(eq(schema.exerciseCatalog.id, id)).limit(1);
  const row = rows[0];
  if (!original && !row) throw new HttpError(404, "not_found");
  const exercise = patch.exercise !== undefined ? parseExercise(patch.exercise) : (row ? parseRow(row) : null) ?? original;
  if (!exercise) throw new HttpError(400, "validation");
  if (exercise.id !== id) throw new HttpError(400, "validation", { issues: [{ path: "id", message: "id cannot change" }] });
  const enabled = patch.enabled ?? row?.enabled ?? true;
  const source: "builtin" | "admin" = original ? "builtin" : row?.source ?? "admin";
  const now = new Date();
  await db
    .insert(schema.exerciseCatalog)
    .values({ id, data: exercise as unknown as object, source, enabled, updatedAt: now })
    .onConflictDoUpdate({ target: schema.exerciseCatalog.id, set: { data: exercise as unknown as object, source, enabled, updatedAt: now } });
  overridesCache = null;
  return { exercise, source, enabled, modified: Boolean(original) && canonicalJson(exercise) !== canonicalJson(original), updatedAt: now.toISOString() };
}

/**
 * Deletes an admin drill; a builtin drill cannot be deleted so it is disabled instead (and its override dropped).
 * Returns what happened so the UI can phrase it.
 */
export async function deleteCatalogExercise(id: string): Promise<{ deleted: boolean; disabled: boolean }> {
  const builtin = await getBuiltinCatalog();
  const original = builtin.find((e) => e.id === id);
  const db = await getDb();
  if (original) {
    const now = new Date();
    await db
      .insert(schema.exerciseCatalog)
      .values({ id, data: original as unknown as object, source: "builtin", enabled: false, updatedAt: now })
      .onConflictDoUpdate({ target: schema.exerciseCatalog.id, set: { data: original as unknown as object, enabled: false, updatedAt: now } });
    overridesCache = null;
    return { deleted: false, disabled: true };
  }
  const res = await db.delete(schema.exerciseCatalog).where(eq(schema.exerciseCatalog.id, id)).returning({ id: schema.exerciseCatalog.id });
  if (res.length === 0) throw new HttpError(404, "not_found");
  overridesCache = null;
  return { deleted: true, disabled: false };
}
