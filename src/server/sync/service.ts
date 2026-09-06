/**
 * Sync engine (server side). Records are user-owned documents keyed (user_id, id); the newest
 * `updatedAt` wins, deletions are soft (deleted_at) and server rows are never removed by sync.
 * Derived tables (role_preferences, goals, equipment, workout_phases, workout_exercises,
 * progress_metrics) are recomputed here from the pushed documents.
 */
import { and, asc, eq, gt, gte, isNull, or, sql } from "drizzle-orm";
import { z } from "zod";
import type { Db } from "../db/client";
import { getDb, schema } from "../db/client";
import { canonicalJson } from "../util/hash";
import type { SyncRecord } from "@/lib/types";
import type { SyncPushResponse } from "@/lib/serverTypes";

export const MAX_PUSH_RECORDS = 500;
export const MAX_RECORD_BYTES = 512_000;
export const PULL_PAGE_LIMIT = 1000;

const isoString = z.string().min(10).max(40).refine((v) => !Number.isNaN(Date.parse(v)), { message: "invalid_datetime" });

export const syncRecordSchema = z.object({
  collection: z.enum(schema.COLLECTION_KEYS as [schema.CollectionKey, ...schema.CollectionKey[]]),
  id: z.string().min(1).max(200),
  updatedAt: isoString,
  deletedAt: isoString.nullable().optional(),
  data: z.unknown(),
});

export const pushRequestSchema = z.object({ records: z.array(z.unknown()).max(MAX_PUSH_RECORDS) });

type SingletonTable = typeof schema.profiles;
type BaseSyncedTable = typeof schema.workouts;

function recordKey(collection: string, id: string): string {
  return `${collection}:${id}`;
}

function toRecord(collection: string, row: { id?: string; updatedAt: Date; deletedAt: Date | null; data: unknown }, fixedId?: string): SyncRecord {
  return {
    collection: collection as SyncRecord["collection"],
    id: fixedId ?? row.id ?? "",
    updatedAt: row.updatedAt.toISOString(),
    deletedAt: row.deletedAt ? row.deletedAt.toISOString() : null,
    data: row.data,
  };
}

function asObject(data: unknown): Record<string, unknown> | null {
  return data && typeof data === "object" && !Array.isArray(data) ? (data as Record<string, unknown>) : null;
}

function dateOrNull(v: unknown): Date | null {
  if (typeof v !== "string") return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

function intOrNull(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? Math.round(v) : null;
}

/* ------------------------------------------------------------------ */
/* Derived tables                                                      */
/* ------------------------------------------------------------------ */

async function refreshProfileDerived(db: Db, userId: string, data: unknown, updatedAt: Date): Promise<void> {
  const p = asObject(data);
  if (!p) return;
  const primaryRole = typeof p.primaryRole === "string" ? p.primaryRole : "allround";
  const secondaryRole = typeof p.secondaryRole === "string" ? p.secondaryRole : null;
  const intent = typeof p.roleIntent === "string" ? p.roleIntent : null;
  await db
    .insert(schema.rolePreferences)
    .values({ userId, primaryRole, secondaryRole, intent, updatedAt })
    .onConflictDoUpdate({ target: schema.rolePreferences.userId, set: { primaryRole, secondaryRole, intent, updatedAt } });

  await db.delete(schema.goals).where(eq(schema.goals.userId, userId));
  const goals = Array.isArray(p.goals) ? (p.goals as unknown[]).slice(0, 30) : [];
  const goalRows = goals
    .map((g, i) => {
      const o = asObject(g);
      const goal = o && typeof o.goal === "string" ? o.goal : typeof g === "string" ? g : null;
      if (!goal) return null;
      const priority = o && typeof o.priority === "number" ? Math.round(o.priority) : i + 1;
      return { id: `${userId}:${goal}`, userId, goal: goal.slice(0, 60), priority, updatedAt };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);
  if (goalRows.length) await db.insert(schema.goals).values(goalRows).onConflictDoNothing();

  await db.delete(schema.equipment).where(eq(schema.equipment.userId, userId));
  const items = Array.isArray(p.equipment) ? (p.equipment as unknown[]).filter((e): e is string => typeof e === "string").slice(0, 30) : [];
  if (items.length) {
    await db
      .insert(schema.equipment)
      .values(items.map((item) => ({ id: `${userId}:${item}`, userId, item: item.slice(0, 40), updatedAt })))
      .onConflictDoNothing();
  }
}

async function refreshWorkoutDerived(db: Db, userId: string, workoutId: string, data: unknown, deleted: boolean): Promise<void> {
  await db.delete(schema.workoutExercises).where(and(eq(schema.workoutExercises.userId, userId), eq(schema.workoutExercises.workoutId, workoutId)));
  await db.delete(schema.workoutPhases).where(and(eq(schema.workoutPhases.userId, userId), eq(schema.workoutPhases.workoutId, workoutId)));
  const w = asObject(data);
  if (deleted || !w || !Array.isArray(w.phases)) return;
  const phaseRows: (typeof schema.workoutPhases.$inferInsert)[] = [];
  const exerciseRows: (typeof schema.workoutExercises.$inferInsert)[] = [];
  (w.phases as unknown[]).slice(0, 20).forEach((raw, pi) => {
    const phase = asObject(raw);
    const phaseId = phase?.id;
    if (!phase || typeof phaseId !== "string") return;
    phaseRows.push({ id: phaseId, workoutId, userId, type: String(phase.type ?? "").slice(0, 30), durationMinutes: intOrNull(phase.durationMinutes) ?? 0, position: pi });
    const exercises = Array.isArray(phase.exercises) ? (phase.exercises as unknown[]).slice(0, 40) : [];
    exercises.forEach((rawEx, ei) => {
      const ex = asObject(rawEx);
      const exId = ex?.id;
      if (!ex || typeof exId !== "string") return;
      exerciseRows.push({
        id: exId,
        workoutId,
        phaseId,
        userId,
        exerciseId: typeof ex.exerciseId === "string" ? ex.exerciseId : null,
        durationMinutes: intOrNull(ex.durationMinutes) ?? 0,
        position: ei,
      });
    });
  });
  if (phaseRows.length) await db.insert(schema.workoutPhases).values(phaseRows).onConflictDoNothing();
  if (exerciseRows.length) await db.insert(schema.workoutExercises).values(exerciseRows).onConflictDoNothing();
}

/** Recomputes the server-side rollup from every non-deleted completed session. */
export async function refreshProgressMetrics(db: Db, userId: string): Promise<void> {
  const t = schema.completedSessions;
  const rows = await db
    .select({
      sessions: sql<number>`count(*)`,
      minutes: sql<number>`coalesce(sum(coalesce(${t.minutes}, 0)), 0)`,
      throws: sql<number>`coalesce(sum(coalesce((${t.data}->>'throws')::int, 0)), 0)`,
      catches: sql<number>`coalesce(sum(coalesce((${t.data}->>'catches')::int, 0)), 0)`,
      lastSessionAt: sql<Date | string | null>`max(${t.completedAt})`,
    })
    .from(t)
    .where(and(eq(t.userId, userId), isNull(t.deletedAt)));
  const agg = rows[0];
  const now = new Date();
  const values = {
    userId,
    sessions: Number(agg?.sessions ?? 0),
    minutes: Number(agg?.minutes ?? 0),
    throws: Number(agg?.throws ?? 0),
    catches: Number(agg?.catches ?? 0),
    lastSessionAt: agg?.lastSessionAt ? new Date(agg.lastSessionAt) : null,
    updatedAt: now,
  };
  await db
    .insert(schema.progressMetrics)
    .values(values)
    .onConflictDoUpdate({ target: schema.progressMetrics.userId, set: { ...values } });
}

/* ------------------------------------------------------------------ */
/* Push                                                                */
/* ------------------------------------------------------------------ */

type PushOutcome = { status: "accepted" } | { status: "conflict"; server: SyncRecord } | { status: "rejected"; reason: string };

async function pushOne(db: Db, userId: string, rec: SyncRecord): Promise<PushOutcome> {
  const entry = schema.COLLECTION_TABLES[rec.collection as schema.CollectionKey];
  if (!entry) return { status: "rejected", reason: "unknown_collection" };
  const updatedAt = new Date(rec.updatedAt);
  const deletedAt = rec.deletedAt ? new Date(rec.deletedAt) : null;
  if (Number.isNaN(updatedAt.getTime())) return { status: "rejected", reason: "invalid_updated_at" };
  if (canonicalJson(rec.data ?? null).length > MAX_RECORD_BYTES) return { status: "rejected", reason: "record_too_large" };

  if (entry.kind === "singleton") {
    if (rec.id !== entry.fixedId) return { status: "rejected", reason: "singleton_id" };
    const table = entry.table as SingletonTable;
    const existing = await db.select().from(table).where(eq(table.userId, userId)).limit(1);
    const stored = existing[0];
    if (stored && stored.updatedAt.getTime() > updatedAt.getTime()) return { status: "conflict", server: toRecord(rec.collection, stored, entry.fixedId) };
    await db
      .insert(table)
      .values({ userId, data: rec.data ?? null, updatedAt, deletedAt })
      .onConflictDoUpdate({ target: table.userId, set: { data: rec.data ?? null, updatedAt, deletedAt } });
    if (rec.collection === "profile") await refreshProfileDerived(db, userId, rec.data, updatedAt);
    return { status: "accepted" };
  }

  const obj = asObject(rec.data);
  if (!obj) return { status: "rejected", reason: "data_not_object" };
  const base = entry.table as BaseSyncedTable;
  const existing = await db.select({ updatedAt: base.updatedAt, deletedAt: base.deletedAt, data: base.data, id: base.id }).from(base).where(and(eq(base.userId, userId), eq(base.id, rec.id))).limit(1);
  const stored = existing[0];
  if (stored && stored.updatedAt.getTime() > updatedAt.getTime()) return { status: "conflict", server: toRecord(rec.collection, stored) };

  if (rec.collection === "completedSessions") {
    const t = schema.completedSessions;
    const extra = { completedAt: dateOrNull(obj.completedAt), minutes: intOrNull(obj.actualMinutes), role: typeof obj.role === "string" ? obj.role.slice(0, 30) : null };
    await db
      .insert(t)
      .values({ id: rec.id, userId, updatedAt, deletedAt, data: obj, ...extra })
      .onConflictDoUpdate({ target: [t.userId, t.id], set: { updatedAt, deletedAt, data: obj, ...extra } });
  } else if (rec.collection === "exerciseResults") {
    const t = schema.exerciseResults;
    const extra = { sessionId: typeof obj.sessionId === "string" ? obj.sessionId : null, metricKey: typeof obj.metricKey === "string" ? obj.metricKey.slice(0, 60) : null, recordedAt: dateOrNull(obj.recordedAt) };
    await db
      .insert(t)
      .values({ id: rec.id, userId, updatedAt, deletedAt, data: obj, ...extra })
      .onConflictDoUpdate({ target: [t.userId, t.id], set: { updatedAt, deletedAt, data: obj, ...extra } });
  } else {
    await db
      .insert(base)
      .values({ id: rec.id, userId, updatedAt, deletedAt, data: obj })
      .onConflictDoUpdate({ target: [base.userId, base.id], set: { updatedAt, deletedAt, data: obj } });
  }
  if (rec.collection === "workouts") await refreshWorkoutDerived(db, userId, rec.id, obj, !!deletedAt);
  return { status: "accepted" };
}

export async function pushRecords(userId: string, rawRecords: unknown[]): Promise<SyncPushResponse> {
  const db = await getDb();
  const accepted: string[] = [];
  const conflicts: SyncRecord[] = [];
  const rejected: { key: string; reason: string }[] = [];
  let touchedSessions = false;
  for (const raw of rawRecords.slice(0, MAX_PUSH_RECORDS)) {
    const parsed = syncRecordSchema.safeParse(raw);
    if (!parsed.success) {
      const r = asObject(raw);
      rejected.push({ key: recordKey(String(r?.collection ?? "?"), String(r?.id ?? "?")), reason: "malformed" });
      continue;
    }
    const rec = parsed.data as SyncRecord;
    const key = recordKey(rec.collection, rec.id);
    try {
      const outcome = await pushOne(db, userId, rec);
      if (outcome.status === "accepted") {
        accepted.push(key);
        if (rec.collection === "completedSessions") touchedSessions = true;
      } else if (outcome.status === "conflict") conflicts.push(outcome.server);
      else rejected.push({ key, reason: outcome.reason });
    } catch (err) {
      rejected.push({ key, reason: `store_failed:${err instanceof Error ? err.message.slice(0, 80) : "unknown"}` });
    }
  }
  if (touchedSessions) {
    try {
      await refreshProgressMetrics(db, userId);
    } catch {
      /* rollup is best effort */
    }
  }
  return { ok: true, accepted, conflicts, rejected, serverTime: new Date().toISOString() };
}

/* ------------------------------------------------------------------ */
/* Pull                                                                */
/* ------------------------------------------------------------------ */

interface PullCursor {
  t: string;
  c: string;
  i: string;
}

export function encodeCursor(c: PullCursor): string {
  return Buffer.from(JSON.stringify(c), "utf8").toString("base64url");
}

export function decodeCursor(raw: string | null): PullCursor | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(Buffer.from(raw, "base64url").toString("utf8")) as Partial<PullCursor>;
    if (typeof parsed.t !== "string" || typeof parsed.c !== "string" || typeof parsed.i !== "string") return null;
    if (Number.isNaN(Date.parse(parsed.t))) return null;
    return { t: parsed.t, c: parsed.c, i: parsed.i };
  } catch {
    return null;
  }
}

function compareRecords(a: SyncRecord, b: SyncRecord): number {
  if (a.updatedAt !== b.updatedAt) return a.updatedAt < b.updatedAt ? -1 : 1;
  if (a.collection !== b.collection) return a.collection < b.collection ? -1 : 1;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

export async function pullRecords(userId: string, since: string | null, cursorRaw: string | null, limit = PULL_PAGE_LIMIT): Promise<{ records: SyncRecord[]; nextCursor: string | null; serverTime: string }> {
  const db = await getDb();
  const serverTime = new Date().toISOString();
  const cursor = decodeCursor(cursorRaw);
  const sinceDate = since && !Number.isNaN(Date.parse(since)) ? new Date(since) : new Date(0);
  const pageLimit = Math.max(1, Math.min(PULL_PAGE_LIMIT, limit));
  const all: SyncRecord[] = [];

  for (const [name, entry] of Object.entries(schema.COLLECTION_TABLES)) {
    if (entry.kind === "singleton") {
      const table = entry.table as SingletonTable;
      const rows = await db.select().from(table).where(eq(table.userId, userId)).limit(1);
      const row = rows[0];
      if (!row) continue;
      const rec = toRecord(name, row, entry.fixedId);
      if (cursor ? compareRecords(rec, { collection: cursor.c as SyncRecord["collection"], id: cursor.i, updatedAt: cursor.t, data: null }) > 0 : row.updatedAt.getTime() > sinceDate.getTime()) all.push(rec);
      continue;
    }
    const table = entry.table as BaseSyncedTable;
    let where;
    if (cursor) {
      const t = new Date(cursor.t);
      if (name > cursor.c) where = and(eq(table.userId, userId), gte(table.updatedAt, t));
      else if (name === cursor.c) where = and(eq(table.userId, userId), or(gt(table.updatedAt, t), and(eq(table.updatedAt, t), gt(table.id, cursor.i))));
      else where = and(eq(table.userId, userId), gt(table.updatedAt, t));
    } else {
      where = and(eq(table.userId, userId), gt(table.updatedAt, sinceDate));
    }
    const rows = await db.select().from(table).where(where).orderBy(asc(table.updatedAt), asc(table.id)).limit(pageLimit + 1);
    for (const row of rows) all.push(toRecord(name, row));
  }

  all.sort(compareRecords);
  const page = all.slice(0, pageLimit);
  const last = page[page.length - 1];
  const nextCursor = all.length > pageLimit && last ? encodeCursor({ t: last.updatedAt, c: last.collection, i: last.id }) : null;
  return { records: page, nextCursor, serverTime };
}
