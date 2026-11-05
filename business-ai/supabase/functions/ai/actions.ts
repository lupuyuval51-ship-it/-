/**
 * Implementations of every action of the `ai` Edge Function (AiRequestSchema in domain/ai-api.ts).
 *
 * Order inside each action: validate preconditions (cheap reads through RLS) → reserve usage →
 * call the model → validate output → persist (only where the contract says so).
 */
import type { AiProvider } from "../_shared/ai/provider.ts";
import { generateStructured } from "../_shared/ai/structured.ts";
import { AiCallError } from "../_shared/ai/errors.ts";
import { ZERO_USAGE } from "../_shared/ai/pricing.ts";
import type { AuthedUser, Db } from "../_shared/auth.ts";
import {
  businessIdeaAnswer,
  type BusinessInfo,
  countAiTasks,
  loadBusiness,
  loadBusinessContext,
  loadOnboarding,
  renderBusinessContext,
} from "../_shared/context.ts";
import type {
  AiRequest,
  AiResponseMap,
  Locale,
} from "../_shared/domain/ai-api.ts";
import type { TierLimits } from "../_shared/domain/entitlements.ts";
import {
  AiMarketingContentSchema,
  type MarketingAsset,
  type MarketingKind,
} from "../_shared/domain/marketing.ts";
import {
  AiFinanceProposalSchema,
  AiPlanSectionSchema,
  type AiRoadmap,
  AiRoadmapSchema,
  PLAN_GENERATION_GROUPS,
  type PlanSectionContent,
  type PlanSectionKey,
} from "../_shared/domain/plan.ts";
import {
  AppError,
  fromPostgrestError,
  logError,
  toAppError,
} from "../_shared/errors.ts";
import {
  addDaysIso,
  AiRoadmapSuggestionsSchema,
  type IdFactory,
  normalizeRoadmap,
  planGroupSchema,
  toFinanceProposal,
  toMarketingContent,
  toPlanSectionContent,
  toRoadmapSuggestions,
} from "../_shared/outputs.ts";
import { financeProposalPrompt } from "../_shared/prompts/finance.ts";
import { marketingPrompt } from "../_shared/prompts/marketing.ts";
import {
  planGroupPrompt,
  sectionRegenerationPrompt,
} from "../_shared/prompts/plan.ts";
import {
  roadmapPrompt,
  roadmapRecommendationPrompt,
} from "../_shared/prompts/roadmap.ts";
import { todayUtc, toJson, type WaitUntil } from "../_shared/runtime.ts";
import {
  finalizeUsage,
  reserveUsage,
  runMetered,
  runReserved,
  type UsageScope,
} from "../_shared/usage.ts";
import type { AiFeature } from "../_shared/domain/entitlements.ts";

/** Output budgets per call. Thinking tokens count towards max_tokens on always-thinking models. */
export const AI_BUDGETS = Object.freeze(
  {
    planGroup: { effort: "medium", maxTokens: 32_000 },
    financeProposal: { effort: "medium", maxTokens: 16_000 },
    sectionRegeneration: { effort: "medium", maxTokens: 16_000 },
    roadmap: { effort: "medium", maxTokens: 32_000 },
    roadmapRecommendation: { effort: "medium", maxTokens: 16_000 },
    marketing: { effort: "low", maxTokens: 16_000 },
  } as const,
);

export interface ActionContext {
  /** User-scoped (RLS) client. */
  db: Db;
  /** Service-role client: usage RPCs only. */
  svc: Db;
  user: AuthedUser;
  provider: AiProvider;
  limits: TierLimits;
  waitUntil: WaitUntil;
  now: () => Date;
  newId: IdFactory;
}

export type ActionResult<A extends AiRequest["action"]> = {
  status: number;
  body: AiResponseMap[A];
};

function usageScope(
  a: ActionContext,
  businessId: string,
  feature: AiFeature,
): UsageScope {
  return {
    svc: a.svc,
    userId: a.user.id,
    businessId,
    feature,
    model: a.provider.model,
    limits: a.limits,
  };
}

/* ========================================================================================== */
/* plan.generate                                                                              */
/* ========================================================================================== */

export async function planGenerate(
  a: ActionContext,
  req: Extract<AiRequest, { action: "plan.generate" }>,
): Promise<ActionResult<"plan.generate">> {
  const business = await loadBusiness(a.db, req.businessId);
  const onboarding = await loadOnboarding(a.db, business.id);
  if (!businessIdeaAnswer(onboarding)) {
    throw new AppError(
      "precondition_failed",
      "Answer the business idea question before generating a plan.",
      {
        details: { missing: "business_idea" },
      },
    );
  }

  const plan = await a.db.rpc("ensure_business_plan", {
    p_business_id: business.id,
  });
  if (plan.error) {
    throw fromPostgrestError(plan.error, "rpc:ensure_business_plan");
  }
  const planId = plan.data.id;
  await guardConcurrentGeneration(a, planId);

  // One plan_generation reservation covers every model call of this plan.
  const reservationId = await reserveUsage(
    usageScope(a, business.id, "plan_generation"),
  );
  let versionId: string;
  try {
    const version = await a.db
      .from("plan_versions")
      .insert({
        plan_id: planId,
        origin: "ai_generated",
        model: a.provider.model.slice(0, 100),
      })
      .select("id")
      .single();
    if (version.error) {
      throw fromPostgrestError(version.error, "plan_versions.insert");
    }
    versionId = version.data.id;
  } catch (err) {
    await finalizeUsage(
      a.svc,
      reservationId,
      "error",
      { ...ZERO_USAGE },
      toAppError(err).code,
    );
    throw err;
  }

  const task = runPlanGeneration(a, {
    business,
    planId,
    versionId,
    reservationId,
    locale: req.locale,
  }).catch((err) => logError("plan.generate.background", err));
  const pending = a.waitUntil(task);
  if (pending) await pending;
  return {
    status: 202,
    body: { planVersionId: versionId, status: "generating" },
  };
}

/**
 * A 'generating' version older than this was interrupted (the worker was stopped by the runtime's
 * wall-clock limit); it is marked failed so the plan does not show as generating forever.
 */
export const STALE_GENERATION_MS = 10 * 60_000;

/** Rejects a second concurrent generation (double tap) and fails stale interrupted ones. */
async function guardConcurrentGeneration(
  a: ActionContext,
  planId: string,
): Promise<void> {
  const cutoff = new Date(a.now().getTime() - STALE_GENERATION_MS)
    .toISOString();
  const stale = await a.db
    .from("plan_versions")
    .update({ status: "failed", error_code: "ai_unavailable" })
    .eq("plan_id", planId)
    .eq("status", "generating")
    .lt("created_at", cutoff);
  if (stale.error) {
    throw fromPostgrestError(stale.error, "plan_versions.fail_stale");
  }
  const running = await a.db
    .from("plan_versions")
    .select("id", { count: "exact", head: true })
    .eq("plan_id", planId)
    .eq("status", "generating");
  if (running.error) {
    throw fromPostgrestError(running.error, "plan_versions.count_generating");
  }
  if ((running.count ?? 0) > 0) {
    throw new AppError(
      "conflict",
      "A plan is already being generated for this business.",
      {
        details: { state: "generating" },
      },
    );
  }
}

interface PlanJob {
  business: BusinessInfo;
  planId: string;
  versionId: string;
  reservationId: string;
  locale: Locale;
}

/** Background part of plan.generate. Never throws (failures are recorded on the version). */
export async function runPlanGeneration(
  a: ActionContext,
  job: PlanJob,
): Promise<void> {
  try {
    await runReserved(a.svc, job.reservationId, async (meter) => {
      const ctx = await loadBusinessContext(a.db, job.business.id, {
        finance: true,
        goals: true,
      });
      const contextText = renderBusinessContext(ctx);
      const controller = new AbortController();
      let firstError: unknown = null;

      const groupCalls = PLAN_GENERATION_GROUPS.map((keys) =>
        meter
          .track(() =>
            generateStructured(a.provider, {
              ...planGroupPrompt(job.locale, keys, contextText),
              schema: planGroupSchema(keys),
              ...AI_BUDGETS.planGroup,
              signal: controller.signal,
            })
          )
          .catch((err: unknown) => {
            if (firstError === null) firstError = err;
            controller.abort(); // stop the other groups: the version fails anyway
            throw err;
          })
      );
      // The finance proposal is optional: a failure leaves finance_proposal null.
      const financeCall = meter
        .track(() =>
          generateStructured(a.provider, {
            ...financeProposalPrompt(
              job.locale,
              contextText,
              job.business.currency,
            ),
            schema: AiFinanceProposalSchema,
            ...AI_BUDGETS.financeProposal,
            signal: controller.signal,
          })
        )
        .then((r) => toFinanceProposal(r.data, a.newId))
        .catch((err: unknown) => {
          if (!controller.signal.aborted) {
            logError("plan.generate.finance_proposal", err);
          }
          return null;
        });

      const settled = await Promise.allSettled(groupCalls);
      const proposal = await financeCall;
      // Report the root cause, not the cancellation of a sibling call.
      if (settled.some((s) => s.status === "rejected")) throw firstError;

      const rows: {
        plan_version_id: string;
        section_key: PlanSectionKey;
        content: PlanSectionContent;
        origin: "ai";
      }[] = [];
      settled.forEach((s, gi) => {
        if (s.status !== "fulfilled") return;
        const keys = PLAN_GENERATION_GROUPS[gi] ?? [];
        const sections = s.value.data.sections as Record<
          string,
          Parameters<typeof toPlanSectionContent>[0]
        >;
        for (const key of keys) {
          const section = sections[key];
          if (!section) {
            throw new AiCallError("ai_invalid_output", undefined, {
              details: { op: `plan:missing:${key}` },
            });
          }
          rows.push({
            plan_version_id: job.versionId,
            section_key: key,
            content: toPlanSectionContent(section),
            origin: "ai",
          });
        }
      });

      const ins = await a.db
        .from("plan_sections")
        .upsert(rows.map((r) => ({ ...r, content: toJson(r.content) })), {
          onConflict: "plan_version_id,section_key",
        });
      if (ins.error) {
        throw fromPostgrestError(ins.error, "plan_sections.upsert");
      }

      const ready = await a.db
        .from("plan_versions")
        .update({
          status: "ready",
          finance_proposal: proposal ? toJson(proposal) : null,
        })
        .eq("id", job.versionId);
      if (ready.error) {
        throw fromPostgrestError(ready.error, "plan_versions.ready");
      }

      const cur = await a.db.from("business_plans").update({
        current_version_id: job.versionId,
      }).eq("id", job.planId);
      if (cur.error) {
        throw fromPostgrestError(
          cur.error,
          "business_plans.current_version_id",
        );
      }
    });
  } catch (err) {
    const code = toAppError(err).code;
    logError("plan.generate", err);
    const failed = await a.db.from("plan_versions").update({
      status: "failed",
      error_code: code,
    }).eq(
      "id",
      job.versionId,
    );
    if (failed.error) {
      logError(
        "plan.generate.mark_failed",
        fromPostgrestError(failed.error, "plan_versions.failed"),
      );
    }
    return;
  }

  if (job.business.stage === "idea") {
    const stage = await a.db.from("businesses").update({ stage: "planning" })
      .eq("id", job.business.id).eq(
        "stage",
        "idea",
      );
    if (stage.error) {
      logError(
        "plan.generate.stage",
        fromPostgrestError(stage.error, "businesses.stage"),
      );
    }
  }

  // First roadmap after the first plan. Failures here never affect the plan.
  try {
    if ((await countAiTasks(a.db, job.business.id)) === 0) {
      await generateRoadmap(a, job.business, job.locale, "create");
    }
  } catch (err) {
    logError("plan.generate.roadmap", err);
  }
}

/* ========================================================================================== */
/* plan.regenerateSection                                                                     */
/* ========================================================================================== */

export async function planRegenerateSection(
  a: ActionContext,
  req: Extract<AiRequest, { action: "plan.regenerateSection" }>,
): Promise<ActionResult<"plan.regenerateSection">> {
  const ctx = await loadBusinessContext(a.db, req.businessId, {
    plan: true,
    finance: true,
  });
  if (!ctx.plan) {
    throw new AppError(
      "precondition_failed",
      "Generate a business plan first.",
      { details: { missing: "plan" } },
    );
  }
  const content = await runMetered(
    usageScope(a, ctx.business.id, "section_regeneration"),
    async (meter) => {
      const contextText = renderBusinessContext(ctx, {
        focusSection: req.sectionKey,
        excludeFocusFromPlan: true,
      });
      const res = await meter.track(() =>
        generateStructured(a.provider, {
          ...sectionRegenerationPrompt(
            req.locale,
            req.sectionKey,
            contextText,
            req.instruction,
          ),
          schema: AiPlanSectionSchema,
          ...AI_BUDGETS.sectionRegeneration,
        })
      );
      return toPlanSectionContent(res.data);
    },
  );
  return { status: 200, body: { sectionKey: req.sectionKey, content } };
}

/* ========================================================================================== */
/* roadmap.generate                                                                           */
/* ========================================================================================== */

export async function roadmapGenerate(
  a: ActionContext,
  req: Extract<AiRequest, { action: "roadmap.generate" }>,
): Promise<ActionResult<"roadmap.generate">> {
  const business = await loadBusiness(a.db, req.businessId);
  const counts = await generateRoadmap(a, business, req.locale, req.mode);
  return { status: 200, body: counts };
}

export async function generateRoadmap(
  a: ActionContext,
  business: BusinessInfo,
  locale: Locale,
  mode: "create" | "replace_ai_items",
): Promise<{ phases: number; milestones: number; tasks: number }> {
  if (mode === "create" && (await countAiTasks(a.db, business.id)) > 0) {
    throw new AppError(
      "conflict",
      "An AI roadmap already exists. Use replace mode to regenerate it.",
    );
  }
  const ctx = await loadBusinessContext(a.db, business.id, {
    plan: true,
    finance: true,
    roadmap: true,
    goals: true,
  });
  if (!ctx.plan) {
    throw new AppError(
      "precondition_failed",
      "Generate a business plan first.",
      { details: { missing: "plan" } },
    );
  }

  return await runMetered(
    usageScope(a, business.id, "roadmap_generation"),
    async (meter) => {
      const startsOn = todayUtc(a.now());
      const res = await meter.track(() =>
        generateStructured(a.provider, {
          ...roadmapPrompt(locale, renderBusinessContext(ctx), startsOn),
          schema: AiRoadmapSchema,
          ...AI_BUDGETS.roadmap,
        })
      );
      const roadmap = normalizeRoadmap(res.data);
      return await persistRoadmap(a.db, business.id, roadmap, startsOn, mode);
    },
  );
}

function nonBlank(s: string, max: number): string {
  const t = s.trim();
  return t.length <= max ? t : t.slice(0, max).trimEnd();
}

/** Would adding edge task → dependsOn create a cycle in `graph` (task → its prerequisites)? */
function createsCycle(
  graph: Map<string, Set<string>>,
  task: string,
  dependsOn: string,
): boolean {
  const stack = [dependsOn];
  const seen = new Set<string>();
  while (stack.length > 0) {
    const cur = stack.pop() as string;
    if (cur === task) return true;
    if (seen.has(cur)) continue;
    seen.add(cur);
    for (const next of graph.get(cur) ?? []) stack.push(next);
  }
  return false;
}

/**
 * Builds the roadmap rows (dates: target/due = startsOn + offset; unknown, self, duplicate and
 * cycle-creating dependency refs are dropped) and writes phases, milestones, tasks and
 * dependencies in ONE transaction via the `persist_ai_roadmap` RPC. Either the whole roadmap is
 * saved or nothing is; in 'create' mode the "AI roadmap already exists" check runs inside the same
 * transaction (serialised per business), and 'replace_ai_items' removes open AI items first.
 */
export function buildRoadmapPayload(
  roadmap: AiRoadmap,
  startsOn: string,
): RoadmapPayload {
  const milestones: RoadmapPayload["milestones"] = [];
  roadmap.phases.forEach((p, pi) => {
    p.milestones.forEach((m, mi) => {
      const title = nonBlank(m.title, 200);
      if (!title) return;
      milestones.push({
        key: `${pi}:${mi}`,
        phase: p.phase,
        title,
        target_date: addDaysIso(startsOn, m.offset_days),
        sort_order: milestones.length,
      });
    });
  });
  const milestoneKeys = new Set(milestones.map((m) => m.key));

  const tasks: RoadmapPayload["tasks"] = [];
  const depsByRef = new Map<string, string[]>();
  roadmap.phases.forEach((p, pi) => {
    for (const t of p.tasks) {
      const title = nonBlank(t.title, 200);
      if (!title) continue;
      const ref = t.ref.trim();
      const isFirstRef = ref !== "" && !depsByRef.has(ref);
      if (isFirstRef) depsByRef.set(ref, t.depends_on.map((d) => d.trim()));
      const milestoneKey = t.milestone_index === null
        ? null
        : `${pi}:${t.milestone_index}`;
      tasks.push({
        ref: isFirstRef ? ref : null,
        phase: p.phase,
        milestone_key: milestoneKey && milestoneKeys.has(milestoneKey)
          ? milestoneKey
          : null,
        title,
        description: nonBlank(t.description, 2000),
        priority: t.priority,
        due_date: addDaysIso(startsOn, t.offset_days),
        sort_order: tasks.length,
      });
    }
  });
  if (tasks.length === 0) {
    throw new AiCallError("ai_invalid_output", undefined, {
      details: { op: "roadmap:no_tasks" },
    });
  }

  const graph = new Map<string, Set<string>>();
  const dependencies: RoadmapPayload["dependencies"] = [];
  for (const [ref, dependsOn] of depsByRef) {
    for (const dep of dependsOn) {
      if (!depsByRef.has(dep) || dep === ref) continue;
      const edges = graph.get(ref) ?? new Set<string>();
      if (edges.has(dep) || createsCycle(graph, ref, dep)) continue;
      edges.add(dep);
      graph.set(ref, edges);
      dependencies.push({ ref, depends_on: dep });
    }
  }

  return {
    starts_on: startsOn,
    phases: roadmap.phases.map((p) => ({
      phase: p.phase,
      objective: nonBlank(p.objective, 1000),
    })),
    milestones,
    tasks,
    dependencies,
  };
}

export interface RoadmapPayload {
  starts_on: string;
  phases: { phase: string; objective: string }[];
  milestones: {
    key: string;
    phase: string;
    title: string;
    target_date: string;
    sort_order: number;
  }[];
  tasks: {
    ref: string | null;
    phase: string;
    milestone_key: string | null;
    title: string;
    description: string;
    priority: string;
    due_date: string;
    sort_order: number;
  }[];
  dependencies: { ref: string; depends_on: string }[];
}

export async function persistRoadmap(
  db: Db,
  businessId: string,
  roadmap: AiRoadmap,
  startsOn: string,
  mode: "create" | "replace_ai_items" = "create",
): Promise<{ phases: number; milestones: number; tasks: number }> {
  const payload = buildRoadmapPayload(roadmap, startsOn);
  const res = await db.rpc("persist_ai_roadmap", {
    p_business_id: businessId,
    p_mode: mode,
    p_payload: toJson(payload),
  });
  if (res.error) throw fromPostgrestError(res.error, "rpc:persist_ai_roadmap");
  return {
    phases: payload.phases.length,
    milestones: payload.milestones.length,
    tasks: payload.tasks.length,
  };
}

/* ========================================================================================== */
/* roadmap.recommend                                                                          */
/* ========================================================================================== */

export async function roadmapRecommend(
  a: ActionContext,
  req: Extract<AiRequest, { action: "roadmap.recommend" }>,
): Promise<ActionResult<"roadmap.recommend">> {
  const now = a.now();
  const ctx = await loadBusinessContext(a.db, req.businessId, {
    plan: true,
    finance: true,
    roadmap: true,
    goals: true,
    actuals: true,
    now,
  });
  const suggestions = await runMetered(
    usageScope(a, ctx.business.id, "roadmap_recommendation"),
    async (meter) => {
      const res = await meter.track(() =>
        generateStructured(a.provider, {
          ...roadmapRecommendationPrompt(
            req.locale,
            renderBusinessContext(ctx),
            todayUtc(now),
            req.instruction,
          ),
          schema: AiRoadmapSuggestionsSchema,
          ...AI_BUDGETS.roadmapRecommendation,
        })
      );
      const list = toRoadmapSuggestions(res.data, a.newId);
      if (list.length === 0) {
        throw new AiCallError("ai_invalid_output", undefined, {
          details: { op: "roadmap:suggestions" },
        });
      }
      return list;
    },
  );
  return { status: 200, body: { suggestions } };
}

/* ========================================================================================== */
/* marketing.generate                                                                         */
/* ========================================================================================== */

export async function marketingGenerate(
  a: ActionContext,
  req: Extract<AiRequest, { action: "marketing.generate" }>,
): Promise<ActionResult<"marketing.generate">> {
  const ctx = await loadBusinessContext(a.db, req.businessId, { plan: true });
  const asset = await runMetered(
    usageScope(a, ctx.business.id, "marketing_generation"),
    async (meter) => {
      const res = await meter.track(() =>
        generateStructured(a.provider, {
          ...marketingPrompt(
            req.locale,
            req.kind,
            renderBusinessContext(ctx),
            req.instruction,
          ),
          schema: AiMarketingContentSchema,
          ...AI_BUDGETS.marketing,
        })
      );
      const { title, content } = toMarketingContent(
        res.data,
        req.kind,
        req.locale,
      );
      const ins = await a.db
        .from("marketing_assets")
        .insert({
          business_id: ctx.business.id,
          kind: req.kind,
          title,
          content: toJson(content),
          origin: "ai",
        })
        .select(
          "id,business_id,kind,title,content,origin,created_at,updated_at",
        )
        .single();
      if (ins.error) {
        throw fromPostgrestError(
          ins.error,
          "marketing_assets.insert",
        );
      }
      const row = ins.data;
      const out: MarketingAsset = {
        id: row.id,
        business_id: row.business_id,
        kind: row.kind as MarketingKind,
        title: row.title,
        content,
        origin: "ai",
        created_at: row.created_at,
        updated_at: row.updated_at,
      };
      return out;
    },
  );
  return { status: 201, body: { asset } };
}

/* ========================================================================================== */
/* finance.propose                                                                            */
/* ========================================================================================== */

export async function financePropose(
  a: ActionContext,
  req: Extract<AiRequest, { action: "finance.propose" }>,
): Promise<ActionResult<"finance.propose">> {
  const ctx = await loadBusinessContext(a.db, req.businessId, {
    plan: true,
    finance: true,
  });
  const proposal = await runMetered(
    usageScope(a, ctx.business.id, "finance_proposal"),
    async (meter) => {
      const res = await meter.track(() =>
        generateStructured(a.provider, {
          ...financeProposalPrompt(
            req.locale,
            renderBusinessContext(ctx),
            ctx.business.currency,
          ),
          schema: AiFinanceProposalSchema,
          ...AI_BUDGETS.financeProposal,
        })
      );
      return toFinanceProposal(res.data, a.newId);
    },
  );
  return { status: 200, body: { proposal } };
}
