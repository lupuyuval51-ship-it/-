/** /api/claude/analyze-session – never cached; rule-based text when Claude is unavailable. */
import type { z } from "zod";
import type { CompletedSession, ExerciseResult } from "@/lib/types";
import type { AnalyzeSessionResponse } from "@/lib/serverTypes";
import { claudeMaxTokens } from "../claude";
import { renderContext } from "../context";
import { analyzeSessionFallback } from "../fallbacks";
import { callClaudeStructured } from "../index";
import type { AiHandler, AiMeta, AiOutcome } from "../pipeline";
import { languageLine, renderCompletedSession, renderResults } from "../prompts";
import { analyzeSessionRequestSchema, claudeAnalysisOutputSchema } from "../schemas";
import { SYSTEM_PROMPT, TASK_PROMPTS } from "../systemPrompt";

type Input = z.infer<typeof analyzeSessionRequestSchema>;

const MAX_SUMMARY = 700;
const MAX_FOCUS_ITEMS = 4;
const MAX_FOCUS_CHARS = 160;

async function run(input: Input, meta: AiMeta): Promise<AiOutcome<AnalyzeSessionResponse>> {
  const session = input.session as unknown as CompletedSession;
  const results = input.results as unknown as ExerciseResult[];
  const previous = input.previous as unknown as CompletedSession | undefined;
  const fallback = (errorCode: string, extra: Partial<AiOutcome<AnalyzeSessionResponse>> = {}): AiOutcome<AnalyzeSessionResponse> => ({
    body: { ok: true, ...analyzeSessionFallback(session, results, previous, meta.locale) },
    status: "fallback",
    errorCode,
    ...extra,
  });
  if (!meta.claudeAvailable) return fallback(meta.maintenance ? "maintenance" : "no_key");

  const userTurn = [
    TASK_PROMPTS.analyzeSession,
    languageLine(meta.locale),
    renderCompletedSession(session, "session"),
    previous ? renderCompletedSession(previous, "previous_session") : "previous_session: none",
    renderResults(results),
  ].join("\n");
  const result = await callClaudeStructured(claudeAnalysisOutputSchema, {
    system: SYSTEM_PROMPT,
    context: renderContext(input.context),
    messages: [{ role: "user", content: userTurn }],
    maxTokens: Math.min(1500, claudeMaxTokens()),
  });
  if (!result.ok) {
    return fallback(result.code, { model: result.model, inputTokens: result.usage?.inputTokens, outputTokens: result.usage?.outputTokens, jsonValid: result.code === "invalid_json" ? false : null });
  }
  const summary = result.value.summary.trim().slice(0, MAX_SUMMARY);
  const nextFocus = result.value.nextFocus.map((f) => f.trim().slice(0, MAX_FOCUS_CHARS)).filter(Boolean).slice(0, MAX_FOCUS_ITEMS);
  if (!summary) return fallback("empty", { model: result.model, inputTokens: result.usage.inputTokens, outputTokens: result.usage.outputTokens, jsonValid: true });
  return { body: { ok: true, summary, nextFocus, source: "claude" }, status: "ok", model: result.model, inputTokens: result.usage.inputTokens, outputTokens: result.usage.outputTokens, jsonValid: true };
}

export const analyzeSessionHandler: AiHandler<Input, AnalyzeSessionResponse> = { action: "analyze-session", schema: analyzeSessionRequestSchema, maxBytes: 300_000, run };
