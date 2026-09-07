/**
 * Library workouts added by admins. They live in the `workouts` table under the reserved user id "library"
 * so the same sync table serves them; deletions are soft (deleted_at) like everything else.
 */
import { and, desc, eq, isNull } from "drizzle-orm";
import { getDb, schema } from "../db/client";
import { HttpError } from "../http";
import { workoutSchema } from "../validation/workoutSchema";
import { validateWorkout } from "@/engine/workoutEngine";
import { newId } from "@/lib/ids";
import type { Workout } from "@/lib/types";

export const LIBRARY_USER_ID = "library";

function parseWorkoutBody(data: unknown): Workout {
  const result = workoutSchema.safeParse(data);
  if (!result.success) {
    throw new HttpError(400, "validation", { issues: result.error.issues.slice(0, 20).map((i) => ({ path: i.path.map(String).join("."), message: i.message })) });
  }
  const validation = validateWorkout(result.data, { expectedDuration: result.data.totalDurationMinutes });
  if (!validation.ok) throw new HttpError(400, "validation", { issues: validation.errors.slice(0, 20).map((message) => ({ path: "workout", message })) });
  return validation.workout ?? result.data;
}

export async function listLibraryWorkouts(): Promise<Workout[]> {
  const db = await getDb();
  const t = schema.workouts;
  const rows = await db.select().from(t).where(and(eq(t.userId, LIBRARY_USER_ID), isNull(t.deletedAt))).orderBy(desc(t.updatedAt)).limit(500);
  return rows.map((r) => r.data as Workout);
}

export async function createLibraryWorkout(data: unknown): Promise<Workout> {
  const db = await getDb();
  const now = new Date();
  const input = data && typeof data === "object" ? (data as Record<string, unknown>) : {};
  const iso = now.toISOString();
  const workout = parseWorkoutBody({ ...input, id: typeof input.id === "string" && input.id ? input.id : newId("wk_lib"), source: "library", createdAt: input.createdAt ?? iso, updatedAt: iso, deletedAt: null });
  const t = schema.workouts;
  const existing = await db.select({ id: t.id }).from(t).where(and(eq(t.userId, LIBRARY_USER_ID), eq(t.id, workout.id))).limit(1);
  if (existing.length) throw new HttpError(409, "workout_exists");
  await db.insert(t).values({ id: workout.id, userId: LIBRARY_USER_ID, updatedAt: now, deletedAt: null, data: workout as unknown as object });
  return workout;
}

export async function updateLibraryWorkout(id: string, data: unknown): Promise<Workout> {
  const db = await getDb();
  const t = schema.workouts;
  const rows = await db.select().from(t).where(and(eq(t.userId, LIBRARY_USER_ID), eq(t.id, id), isNull(t.deletedAt))).limit(1);
  const row = rows[0];
  if (!row) throw new HttpError(404, "not_found");
  const previous = row.data as Workout;
  const now = new Date();
  const input = data && typeof data === "object" ? (data as Record<string, unknown>) : {};
  const workout = parseWorkoutBody({ ...previous, ...input, id, source: "library", createdAt: previous.createdAt, updatedAt: now.toISOString(), deletedAt: null });
  await db.update(t).set({ data: workout as unknown as object, updatedAt: now }).where(and(eq(t.userId, LIBRARY_USER_ID), eq(t.id, id)));
  return workout;
}

export async function deleteLibraryWorkout(id: string): Promise<void> {
  const db = await getDb();
  const t = schema.workouts;
  const now = new Date();
  const res = await db
    .update(t)
    .set({ deletedAt: now, updatedAt: now })
    .where(and(eq(t.userId, LIBRARY_USER_ID), eq(t.id, id), isNull(t.deletedAt)))
    .returning({ id: t.id });
  if (res.length === 0) throw new HttpError(404, "not_found");
}
