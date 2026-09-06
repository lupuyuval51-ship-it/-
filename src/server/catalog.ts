/**
 * Effective exercise catalog on the server.
 * Builtin exercises come from src/content/exercises (authored separately – loaded lazily and guarded so the
 * server keeps working when the module is missing or broken). Admin overrides live in `exercise_catalog`:
 *   source "builtin" rows mirror a builtin drill (seeded lazily) and may be disabled or edited,
 *   source "admin"   rows are additions.
 * The public /api/catalog/overrides endpoint exposes the merge result to the client (cached 5 minutes).
 */
import { getDb, schema } from "./db/client";
import { canonicalJson } from "./util/hash";
import { exerciseSchema } from "./validation/exerciseSchema";
import type { Exercise } from "@/lib/types";
import type { AdminExerciseRow, CatalogOverridesResponse } from "@/lib/serverTypes";

const TTL_MS = 5 * 60_000;

let builtinCache: { at: number; list: Exercise[] } | null = null;
let overridesCache: { at: number; value: CatalogOverridesResponse } | null = null;

export function invalidateCatalogCache(): void {
  overridesCache = null;
  builtinCache = null;
}

/** Builtin catalog from the content module. Empty list when the module cannot be loaded. */
export async function getBuiltinCatalog(): Promise<Exercise[]> {
  if (builtinCache && Date.now() - builtinCache.at < TTL_MS) return builtinCache.list;
  let list: Exercise[] = [];
  try {
    const mod = (await import("@/content/exercises")) as { EXERCISES?: unknown };
    if (Array.isArray(mod.EXERCISES)) list = (mod.EXERCISES as Exercise[]).filter((e) => e && typeof e.id === "string");
  } catch (err) {
    if (process.env.NODE_ENV !== "test") console.warn("[catalog] builtin exercises unavailable:", err instanceof Error ? err.message : err);
  }
  builtinCache = { at: Date.now(), list };
  return list;
}

/** Test / admin hook: override the builtin catalog without touching the content module. */
export function setBuiltinCatalogForTests(list: Exercise[] | null): void {
  builtinCache = list ? { at: Date.now(), list } : null;
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
