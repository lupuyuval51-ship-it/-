/** /api/claude/weekly-review – personal, never cached; rule-based review when Claude is unavailable. */
import type { z } from "zod";
import type { CompletedSession } from "@/lib/types";
import type { WeeklyReviewResponse } from "@/lib/serverTypes";
import { claudeMaxTokens } from "../claude";
import { renderContext } from "../context";
import { weeklyReviewFallback } from "../fallbacks";
import { callClaudeStructured } from "../index";
import type { AiHandler, AiMeta, AiOutcome } from "../pipeline";
import { languageLine, renderCompletedSession } from "../prompts";
import { claudeReviewOutputSchema, weeklyReviewRequestSchema } from "../schemas";
import { SYSTEM_PROMPT, TASK_PROMPTS } from "../systemPrompt";

type Input = z.infer<typeof weeklyReviewRequestSchema>;

async function run(input: Input, meta: AiMeta): Promise<AiOutcome<WeeklyReviewResponse>> {
  const sessions = input.weekSessions as unknown as CompletedSession[];
  const fallback = (errorCode: string, extra: Partial<AiOutcome<WeeklyReviewResponse>> = {}): AiOutcome<WeeklyReviewResponse> => ({
    body: { ok: true, ...weeklyReviewFallback(sessions, input.context, meta.locale) },
    status: "fallback",
    errorCode,
    ...extra,
  });
  if (!meta.claudeAvailable) return fallback(meta.maintenance ? "maintenance" : "no_key");

  const userTurn = [
    TASK_PROMPTS.weeklyReview,
    languageLine(meta.locale),
    `week_sessions: ${sessions.length}`,
    ...sessions.map((s, i) => renderCompletedSession(s, `session_${i + 1}`)),
  ].join("\n");
  const result = await callClaudeStructured(claudeReviewOutputSchema, {
    system: SYSTEM_PROMPT,
    context: renderContext(input.context),
    messages: [{ role: "user", content: userTurn }],
    maxTokens: Math.min(1500, claudeMaxTokens()),
  });
  if (!result.ok) {
    return fallback(result.code, { model: result.model, inputTokens: result.usage?.inputTokens, outputTokens: result.usage?.outputTokens, jsonValid: result.code === "invalid_json" ? false : null });
  }
  const review = result.value.review.trim().slice(0, 900);
  const adjustments = result.value.adjustments.map((a) => ({ kind: a.kind, note: a.note.trim().slice(0, 200) })).filter((a) => a.note).slice(0, 4);
  if (!review) return fallback("empty", { model: result.model, inputTokens: result.usage.inputTokens, outputTokens: result.usage.outputTokens, jsonValid: true });
  return { body: { ok: true, review, adjustments, source: "claude" }, status: "ok", model: result.model, inputTokens: result.usage.inputTokens, outputTokens: result.usage.outputTokens, jsonValid: true };
}

export const weeklyReviewHandler: AiHandler<Input, WeeklyReviewResponse> = { action: "weekly-review", schema: weeklyReviewRequestSchema, maxBytes: 200_000, run };
