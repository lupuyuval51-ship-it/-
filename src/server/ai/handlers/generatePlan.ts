/** /api/claude/generate-plan – Claude proposes per-week themes; the client's plan engine builds the sessions. */
import type { z } from "zod";
import type { Skill } from "@/lib/types";
import { SKILLS } from "@/lib/types";
import type { GeneratePlanResponse, PlanWeekTheme } from "@/lib/serverTypes";
import { cacheKey, getCached, setCached } from "../cache";
import { claudeMaxTokens } from "../claude";
import { renderContext } from "../context";
import { planFallback } from "../fallbacks";
import { callClaudeStructured } from "../index";
import type { AiHandler, AiMeta, AiOutcome } from "../pipeline";
import { languageLine } from "../prompts";
import { claudePlanOutputSchema, generatePlanRequestSchema } from "../schemas";
import { SYSTEM_PROMPT, TASK_PROMPTS } from "../systemPrompt";
import { contextEssentials } from "./generateWorkout";

type Input = z.infer<typeof generatePlanRequestSchema>;

function planKey(input: Input): string {
  return cacheKey("generate-plan", { weeksCount: input.weeksCount, baselineSummary: input.baselineSummary?.trim() ?? "", context: contextEssentials(input.context), sessionsPerWeek: input.context.profile?.sessionsPerWeek });
}

/** Normalizes Claude's themes to exactly `weeksCount` entries indexed 0..n-1, or null when incomplete. */
export function normalizeWeekThemes(raw: { index: number; theme: string; goal: string; focusSkills: string[] }[], weeksCount: number): PlanWeekTheme[] | null {
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const sorted = raw.filter((t) => Number.isFinite(t.index)).slice().sort((a, b) => a.index - b.index);
  const minIndex = sorted[0]?.index ?? 0;
  const offset = minIndex === 1 ? 1 : 0;
  const out: PlanWeekTheme[] = [];
  for (let i = 0; i < weeksCount; i++) {
    const t = sorted.find((x) => Math.round(x.index) - offset === i) ?? sorted[i];
    if (!t) return null;
    const theme = t.theme.trim().slice(0, 80);
    const goal = t.goal.trim().slice(0, 200);
    if (!theme) return null;
    const focusSkills = [...new Set(t.focusSkills.filter((s): s is Skill => (SKILLS as readonly string[]).includes(s)))].slice(0, 4);
    out.push({ index: i, theme, goal: goal || theme, focusSkills });
  }
  return out;
}

async function quick(input: Input): Promise<AiOutcome<GeneratePlanResponse> | null> {
  const cached = await getCached<GeneratePlanResponse>(planKey(input));
  if (!cached?.weekThemes?.length) return null;
  return { body: { ...cached, source: "cache" }, status: "cached", cacheHit: true };
}

async function run(input: Input, meta: AiMeta): Promise<AiOutcome<GeneratePlanResponse>> {
  const fallback = (errorCode: string, extra: Partial<AiOutcome<GeneratePlanResponse>> = {}): AiOutcome<GeneratePlanResponse> => ({ body: { ok: true, ...planFallback(meta.locale) }, status: "fallback", errorCode, ...extra });
  if (!meta.claudeAvailable) return fallback(meta.maintenance ? "maintenance" : "no_key");

  const userTurn = [
    TASK_PROMPTS.generatePlan,
    languageLine(meta.locale),
    `weeks_count: ${input.weeksCount} (return exactly this many weekThemes, index 0..${input.weeksCount - 1})`,
    input.baselineSummary?.trim() ? `baseline_summary: ${input.baselineSummary.trim()}` : "baseline_summary: none",
    `allowed focusSkills: ${SKILLS.join(", ")}`,
  ].join("\n");
  const result = await callClaudeStructured(claudePlanOutputSchema, {
    system: SYSTEM_PROMPT,
    context: renderContext(input.context),
    messages: [{ role: "user", content: userTurn }],
    maxTokens: Math.min(3000, claudeMaxTokens()),
  });
  if (!result.ok) {
    return fallback(result.code, { model: result.model, inputTokens: result.usage?.inputTokens, outputTokens: result.usage?.outputTokens, jsonValid: result.code === "invalid_json" ? false : null });
  }
  const usage = { model: result.model, inputTokens: result.usage.inputTokens, outputTokens: result.usage.outputTokens };
  const weekThemes = normalizeWeekThemes(result.value.weekThemes, input.weeksCount);
  if (!weekThemes) return fallback("incomplete_plan", { ...usage, jsonValid: true });
  const body: GeneratePlanResponse = { ok: true, source: "claude", weekThemes, coachMessage: result.value.coachMessage.trim().slice(0, 400) };
  await setCached(planKey(input), "generate-plan", body);
  return { body, status: "ok", ...usage, jsonValid: true };
}

export const generatePlanHandler: AiHandler<Input, GeneratePlanResponse> = { action: "generate-plan", schema: generatePlanRequestSchema, maxBytes: 60_000, quick, run };
