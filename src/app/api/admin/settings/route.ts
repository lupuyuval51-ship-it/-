/** GET/PUT /api/admin/settings – runtime overrides (claude_model, rate limits, maintenance_notice). Admin only. */
import { z } from "zod";
import { requireAdmin } from "@/server/auth/session";
import { assertCsrf, jsonOk, parseJsonBody, withRoute } from "@/server/http";
import { effectiveModel, effectiveRateLimits, getRuntimeSettings, maintenanceNotice, setRuntimeSettings } from "@/server/settings";
import type { AdminSettings, AdminSettingsResponse } from "@/lib/serverTypes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const emptyToNull = (v: string | null | undefined) => (typeof v === "string" && v.trim() === "" ? null : v);

const patchSchema = z
  .object({
    claude_model: z.string().trim().max(80).nullable().optional(),
    ai_rate_limit_per_hour: z.number().int().min(1).max(100_000).nullable().optional(),
    ai_rate_limit_per_day: z.number().int().min(1).max(1_000_000).nullable().optional(),
    maintenance_notice: z.string().trim().max(300).nullable().optional(),
  })
  .strict();

async function response(settings: AdminSettings): Promise<AdminSettingsResponse> {
  const limits = await effectiveRateLimits();
  return { ok: true, settings, effective: { model: await effectiveModel(), perHour: limits.perHour, perDay: limits.perDay, maintenanceNotice: await maintenanceNotice() } };
}

export const GET = withRoute(async (req) => {
  await requireAdmin(req);
  return jsonOk(await response(await getRuntimeSettings()));
});

export const PUT = withRoute(async (req) => {
  assertCsrf(req);
  await requireAdmin(req);
  const patch = await parseJsonBody(req, patchSchema, 10_000);
  const normalized: Partial<AdminSettings> = {};
  if ("claude_model" in patch) normalized.claude_model = emptyToNull(patch.claude_model) ?? null;
  if ("ai_rate_limit_per_hour" in patch) normalized.ai_rate_limit_per_hour = patch.ai_rate_limit_per_hour ?? null;
  if ("ai_rate_limit_per_day" in patch) normalized.ai_rate_limit_per_day = patch.ai_rate_limit_per_day ?? null;
  if ("maintenance_notice" in patch) normalized.maintenance_notice = emptyToNull(patch.maintenance_notice) ?? null;
  return jsonOk(await response(await setRuntimeSettings(normalized)));
});
