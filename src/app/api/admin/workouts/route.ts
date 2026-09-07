/** /api/admin/workouts – library additions (workouts table, user_id "library"). GET list · POST create · PUT update · DELETE ?id= (soft). Admin only. */
import { z } from "zod";
import { createLibraryWorkout, deleteLibraryWorkout, listLibraryWorkouts, updateLibraryWorkout } from "@/server/admin/workouts";
import { requireAdmin } from "@/server/auth/session";
import { HttpError, assertCsrf, jsonOk, parseJsonBody, readJsonBody, searchParam, withRoute } from "@/server/http";
import type { AdminWorkoutsResponse } from "@/lib/serverTypes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const putSchema = z.object({ id: z.string().min(1).max(120), workout: z.record(z.string(), z.unknown()) });

export const GET = withRoute(async (req) => {
  await requireAdmin(req);
  const body: AdminWorkoutsResponse = { ok: true, workouts: await listLibraryWorkouts() };
  return jsonOk(body);
});

export const POST = withRoute(async (req) => {
  assertCsrf(req);
  await requireAdmin(req);
  const workout = await createLibraryWorkout(await readJsonBody(req, 500_000));
  return jsonOk({ ok: true, workout }, { status: 201 });
});

export const PUT = withRoute(async (req) => {
  assertCsrf(req);
  await requireAdmin(req);
  const input = await parseJsonBody(req, putSchema, 500_000);
  const workout = await updateLibraryWorkout(input.id, input.workout);
  return jsonOk({ ok: true, workout });
});

export const DELETE = withRoute(async (req) => {
  assertCsrf(req);
  await requireAdmin(req);
  const id = searchParam(req, "id");
  if (!id) throw new HttpError(400, "validation", { issues: [{ path: "id", message: "required" }] });
  await deleteLibraryWorkout(id);
  return jsonOk({ ok: true });
});
