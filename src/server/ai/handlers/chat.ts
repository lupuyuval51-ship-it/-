/** /api/claude/chat – templates first, then cache (basic questions only), then Claude with a rolling summary. */
import type Anthropic from "@anthropic-ai/sdk";
import type { z } from "zod";
import type { ChatAction, CoachContext, Locale, WorkoutRequest } from "@/lib/types";
import type { ChatResponse } from "@/lib/serverTypes";
import { cacheKey, getCached, setCached } from "../cache";
import { claudeMaxTokens } from "../claude";
import { renderContext } from "../context";
import { callClaudeStructured, wrapUserMessage } from "../index";
import type { AiHandler, AiMeta, AiOutcome } from "../pipeline";
import { rateLimitedError, unavailableError } from "../pipeline";
import { languageLine } from "../prompts";
import { chatRequestSchema, claudeChatOutputSchema } from "../schemas";
import { SYSTEM_PROMPT, TASK_PROMPTS } from "../systemPrompt";
import { detectLocale, isTemplateEligible, matchTemplate, normalizeMessage } from "../templates";

type ChatInput = z.infer<typeof chatRequestSchema>;

const MAX_REPLY_CHARS = 4000;
const MAX_SUMMARY_CHARS = 400;

const LABELS = {
  generate_workout: { he: "בנו לי אימון", en: "Build me a workout" },
  replace_exercise: { he: "הציעו תרגיל חלופי", en: "Suggest an alternative drill" },
  add_to_plan: { he: "הוסיפו לתוכנית שלי", en: "Add to my plan" },
  ask_more: { he: "ספרו לי עוד", en: "Tell me more" },
};

function requestFromContext(ctx: CoachContext): Partial<WorkoutRequest> | undefined {
  if (ctx.profile) {
    const p = ctx.profile;
    return {
      role: p.primaryRole,
      ...(p.secondaryRole ? { secondaryRole: p.secondaryRole } : {}),
      durationMinutes: p.durationMinutes,
      participants: p.participants,
      equipment: p.equipment,
      fieldSize: p.fieldSize,
      wind: p.wind,
      level: p.level,
      ageGroup: p.ageGroup,
      hand: p.hand,
      includeFitness: p.includeFitness,
      ...(p.goals[0] ? { primaryGoal: p.goals[0] } : {}),
    };
  }
  if (ctx.roleHint) return { role: ctx.roleHint.primaryRole, level: ctx.roleHint.level, ...(ctx.roleHint.secondaryRole ? { secondaryRole: ctx.roleHint.secondaryRole } : {}) };
  return undefined;
}

/** Heuristic action list: mentions of workouts / drills / plans plus an always-present follow-up. */
export function deriveChatActions(message: string, reply: string, suggested: string[], followUp: string | null | undefined, locale: Locale, ctx: CoachContext): ChatAction[] {
  const text = `${message}\n${reply}`;
  const actions: ChatAction[] = [];
  if (suggested.includes("generate_workout") || /אימון|workout|session\b|train(?:ing)?\b/i.test(text)) {
    const request = requestFromContext(ctx);
    actions.push({ type: "generate_workout", label: LABELS.generate_workout, ...(request ? { request } : {}) });
  }
  if (suggested.includes("replace_exercise") || /תרגיל|drill|exercise|להחליף|חלופ|replace|swap|alternative/i.test(text)) {
    actions.push({ type: "replace_exercise", label: LABELS.replace_exercise });
  }
  if (suggested.includes("add_to_plan") || /תוכנית|\bplan\b|שבוע|weekly|\bweek\b/i.test(text)) {
    // workoutId "" = let the client attach the current / last generated workout.
    actions.push({ type: "add_to_plan", label: LABELS.add_to_plan, workoutId: "" });
  }
  const prompt = (followUp ?? "").trim().slice(0, 200) || (locale === "he" ? "אפשר להרחיב על זה?" : "Can you expand on that?");
  actions.push({ type: "ask_more", label: LABELS.ask_more, prompt });
  return actions;
}

function historyMessages(recent: ChatInput["recent"]): Anthropic.MessageParam[] {
  const out: Anthropic.MessageParam[] = [];
  for (const m of recent ?? []) {
    const content = m.content.trim().slice(0, 1500);
    if (!content) continue;
    if (out.length === 0 && m.role !== "user") continue;
    const last = out[out.length - 1];
    if (last && last.role === m.role && typeof last.content === "string") last.content = `${last.content}\n${content}`;
    else out.push({ role: m.role, content });
  }
  if (out.length && out[out.length - 1].role === "user") out[out.length - 1].content = `${out[out.length - 1].content as string}\n(המשך)`;
  return out;
}

function chatCacheKey(message: string, locale: Locale): string {
  return cacheKey("chat", { message: normalizeMessage(message), locale });
}

async function quick(input: ChatInput, meta: AiMeta): Promise<AiOutcome<ChatResponse> | null> {
  const match = matchTemplate(input.message, meta.locale);
  if (match) {
    const actions = deriveChatActions(input.message, match.reply, match.template.actions ?? [], null, match.locale, input.context);
    return { body: { ok: true, reply: match.reply, source: "template", actions }, status: "template" };
  }
  if (isTemplateEligible(input.message)) {
    const cached = await getCached<ChatResponse>(chatCacheKey(input.message, detectLocale(input.message, meta.locale)));
    if (cached?.reply) return { body: { ...cached, source: "cache" }, status: "cached", cacheHit: true };
  }
  return null;
}

async function run(input: ChatInput, meta: AiMeta): Promise<AiOutcome<ChatResponse>> {
  if (!meta.claudeAvailable) return { status: "error", errorCode: meta.maintenance ? "maintenance" : "no_key", error: unavailableError(meta) };
  const replyLocale = detectLocale(input.message, meta.locale);
  const messages: Anthropic.MessageParam[] = [
    ...historyMessages(input.recent),
    { role: "user", content: `${wrapUserMessage(input.message)}\n\n${TASK_PROMPTS.chat}\n${languageLine(replyLocale)}` },
  ];
  const contextBlock = [renderContext(input.context), input.summary?.trim() ? `סיכום השיחה עד כה (conversation summary): ${input.summary.trim().slice(0, 1200)}` : ""].filter(Boolean).join("\n\n");
  const result = await callClaudeStructured(claudeChatOutputSchema, { system: SYSTEM_PROMPT, context: contextBlock, messages, maxTokens: claudeMaxTokens("chat") });
  if (!result.ok) {
    const error = result.code === "rate_limited" ? rateLimitedError(meta.locale, 60) : unavailableError(meta);
    return { status: "error", errorCode: result.code, model: result.model, inputTokens: result.usage?.inputTokens, outputTokens: result.usage?.outputTokens, jsonValid: result.code === "invalid_json" ? false : null, error };
  }
  const reply = result.value.reply.trim().slice(0, MAX_REPLY_CHARS);
  if (!reply) return { status: "error", errorCode: "empty", model: result.model, error: unavailableError(meta) };
  const summaryUpdate = result.value.summaryUpdate.trim().slice(0, MAX_SUMMARY_CHARS) || undefined;
  const actions = deriveChatActions(input.message, reply, result.value.suggestedActions, result.value.followUpQuestion, replyLocale, input.context);
  const body: ChatResponse = { ok: true, reply, source: "claude", actions, ...(summaryUpdate ? { summaryUpdate } : {}) };
  if (isTemplateEligible(input.message)) {
    const cacheable: ChatResponse = { ok: true, reply, source: "cache", actions };
    await setCached(chatCacheKey(input.message, replyLocale), "chat", cacheable);
  }
  return { body, status: "ok", model: result.model, inputTokens: result.usage.inputTokens, outputTokens: result.usage.outputTokens, jsonValid: true };
}

export const chatHandler: AiHandler<ChatInput, ChatResponse> = { action: "chat", schema: chatRequestSchema, maxBytes: 120_000, quick, run };
