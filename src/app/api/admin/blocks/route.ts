/** /api/admin/blocks – coach abuse blocks. GET list · POST { subject, reason?, hours } · DELETE ?subject=. Admin only. */
import { z } from "zod";
import { listBlocks, removeBlock, upsertBlock } from "@/server/ai/rateLimit";
import { requireAdmin } from "@/server/auth/session";
import { HttpError, assertCsrf, jsonOk, parseJsonBody, searchParam, withRoute } from "@/server/http";
import type { AdminBlocksResponse } from "@/lib/serverTypes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const subjectSchema = z.string().trim().min(3).max(120).regex(/^(user|guest|ip):[^\s]+$/, "subject must be user:<id>, guest:<id> or ip:<address>");
const createSchema = z.object({ subject: subjectSchema, reason: z.string().trim().max(200).optional(), hours: z.number().min(1).max(24 * 365).default(24) });

export const GET = withRoute(async (req) => {
  await requireAdmin(req);
  const body: AdminBlocksResponse = { ok: true, blocks: await listBlocks() };
  return jsonOk(body);
});

export const POST = withRoute(async (req) => {
  assertCsrf(req);
  await requireAdmin(req);
  const input = await parseJsonBody(req, createSchema, 10_000);
  await upsertBlock(input.subject, input.reason ?? null, input.hours);
  const body: AdminBlocksResponse = { ok: true, blocks: await listBlocks() };
  return jsonOk(body, { status: 201 });
});

export const DELETE = withRoute(async (req) => {
  assertCsrf(req);
  await requireAdmin(req);
  const subject = searchParam(req, "subject");
  const parsed = subjectSchema.safeParse(subject);
  if (!parsed.success) throw new HttpError(400, "validation", { issues: [{ path: "subject", message: "invalid" }] });
  await removeBlock(parsed.data);
  const body: AdminBlocksResponse = { ok: true, blocks: await listBlocks() };
  return jsonOk(body);
});
