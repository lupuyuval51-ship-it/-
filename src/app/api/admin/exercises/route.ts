/**
 * /api/admin/exercises – builtin catalog (seeded lazily into exercise_catalog on first list) merged with admin rows.
 * GET → { ok, exercises: AdminExerciseRow[] } · POST Exercise → create · PUT { id, exercise?, enabled? } → update/toggle
 * DELETE ?id= → admin drill removed, builtin drill disabled. Admin only.
 */
import { z } from "zod";
import { createCatalogExercise, deleteCatalogExercise, listCatalogForAdmin, seedBuiltinCatalog, updateCatalogExercise } from "@/server/catalog";
import { requireAdmin } from "@/server/auth/session";
import { HttpError, assertCsrf, jsonOk, parseJsonBody, readJsonBody, searchParam, withRoute } from "@/server/http";
import { idSchema } from "@/server/validation/exerciseSchema";
import type { AdminExercisesResponse } from "@/lib/serverTypes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const putSchema = z.object({ id: idSchema, exercise: z.unknown().optional(), enabled: z.boolean().optional() }).refine((v) => v.exercise !== undefined || v.enabled !== undefined, { message: "nothing_to_update" });

export const GET = withRoute(async (req) => {
  await requireAdmin(req);
  try {
    await seedBuiltinCatalog();
  } catch {
    /* seeding is best effort – the listing still merges builtin + rows */
  }
  const body: AdminExercisesResponse = { ok: true, exercises: await listCatalogForAdmin() };
  return jsonOk(body);
});

export const POST = withRoute(async (req) => {
  assertCsrf(req);
  await requireAdmin(req);
  const row = await createCatalogExercise(await readJsonBody(req, 200_000));
  return jsonOk({ ok: true, exercise: row }, { status: 201 });
});

export const PUT = withRoute(async (req) => {
  assertCsrf(req);
  await requireAdmin(req);
  const input = await parseJsonBody(req, putSchema, 200_000);
  const row = await updateCatalogExercise(input.id, { exercise: input.exercise, enabled: input.enabled });
  return jsonOk({ ok: true, exercise: row });
});

export const DELETE = withRoute(async (req) => {
  assertCsrf(req);
  await requireAdmin(req);
  const id = searchParam(req, "id");
  if (!id || !idSchema.safeParse(id).success) throw new HttpError(400, "validation", { issues: [{ path: "id", message: "required" }] });
  const result = await deleteCatalogExercise(id);
  return jsonOk({ ok: true, ...result });
});
