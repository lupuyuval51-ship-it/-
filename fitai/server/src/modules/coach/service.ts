/**
 * Sending a message to the coach:
 * ownership → per-user rate limit → daily quota + store user message (one transaction)
 * → safety pre-check → context → model or built-in coach (no transaction open)
 * → store reply, touch/auto-title the thread, reward hook (one transaction).
 */
import type { Locale } from '@shared/constants';
import type { CoachMessageDTO, CoachQuotaErrorDetails, SendCoachMessageResponse } from '@shared/types';
import { generateText, isLlmConfigured, LlmError } from '../../ai/llm';
import { config } from '../../config';
import { db } from '../../db/pool';
import { HttpError, notFound } from '../../lib/errors';
import { enforceRateLimit } from '../../middleware/rateLimit';
import { getAllExercises, type ExerciseRecord } from '../exercises/repository';
import { onCoachQuestion } from '../gamification/hooks';
import { aiUnavailableNote, builtinReply, errorText, refusalText } from './builtin';
import { currentWeightKg, formatContext, loadCoachData, type CoachData } from './context';
import { findExercise } from './exerciseMatch';
import { loadFoodCatalog } from './foodData';
import { replyLanguage } from './lang';
import { buildHistory, buildSystemPrompt, HISTORY_LIMIT, REPLY_MAX_TOKENS } from './prompt';
import { coachStatus, insertMessage, recentHistory, requireThread, titleFromMessage, usageToday, type NewMessage } from './repository';
import { checkSafety } from './safety';

/** Messages per user per minute (burst protection on top of the daily quota). */
export const COACH_RATE_LIMIT = { limit: 6, windowMs: 60_000 } as const;
/** Advisory-lock namespace serializing quota checks per user. */
const QUOTA_LOCK_NAMESPACE = 74_610_601;

type Reply = Omit<NewMessage, 'userId' | 'threadId' | 'role'> & { rewarded: boolean };

function quotaExceeded(limit: number, resetsAt: Date): HttpError {
  const details: CoachQuotaErrorDetails = { limit, resetsAt: resetsAt.toISOString() };
  const retryAfter = Math.max(1, Math.ceil((resetsAt.getTime() - Date.now()) / 1000));
  return new HttpError(429, 'quota_exceeded', "Today's coach message limit has been reached", details, { 'Retry-After': String(retryAfter) });
}

async function builtinAnswer(message: string, lang: Locale, data: CoachData, exercises: ExerciseRecord[], note: boolean): Promise<Reply> {
  try {
    const { text } = await builtinReply({ message, lang, data, exercises, loadFoods: () => loadFoodCatalog(db) });
    return { content: note ? `${aiUnavailableNote(lang)}\n\n${text}` : text, source: 'builtin', status: 'ok', rewarded: true };
  } catch (err) {
    console.error('[coach] built-in coach failed', (err as Error)?.name ?? 'Error');
    return { content: errorText(lang), source: 'builtin', status: 'error', rewarded: false };
  }
}

async function produceReply(userId: string, threadId: string, message: string): Promise<Reply> {
  const data = await loadCoachData(db, userId);
  const lang = replyLanguage(message, data.locale);

  const safety = checkSafety(message, {
    lang,
    isMinor: data.profile.isMinor,
    weightKg: currentWeightKg(data),
    calorieTarget: data.profile.targets?.calories ?? null,
    minimumCalories: data.minimumCalories,
  });
  // Safety replies are fixed texts; they never reach the model and earn no reward.
  if (safety) return { content: safety.reply, source: 'builtin', status: 'ok', rewarded: false };

  const exercises = await getAllExercises();
  if (!isLlmConfigured()) return builtinAnswer(message, lang, data, exercises, false);

  const focusExercise = findExercise(message, exercises, {
    userExerciseIds: new Set([...(data.plan?.workouts.flatMap((w) => w.exercises.map((e) => e.exerciseId)) ?? []), ...data.recentSessions.flatMap((s) => s.exercises.map((e) => e.exerciseId))]),
    equipment: data.profile.onboardingCompletedAt ? data.profile.equipment : null,
  });
  const system = buildSystemPrompt({ data, contextText: formatContext(data, lang), exercises, focusExercise, replyLang: lang });
  const history = buildHistory(await recentHistory(db, userId, threadId, HISTORY_LIMIT));
  try {
    const res = await generateText({ system, messages: history, maxTokens: REPLY_MAX_TOKENS });
    return { content: res.text, source: 'llm', status: 'ok', model: res.model, inputTokens: res.inputTokens, outputTokens: res.outputTokens, rewarded: true };
  } catch (err) {
    const kind = err instanceof LlmError ? err.kind : 'unavailable';
    if (kind === 'not_configured') return builtinAnswer(message, lang, data, exercises, false);
    if (kind === 'refused') return { content: refusalText(lang), source: 'llm', status: 'refused', model: config.ai.model, rewarded: false };
    // Never log message content — only the failure kind.
    console.warn(`[coach] AI provider error (${kind}); answering with the built-in coach`);
    return builtinAnswer(message, lang, data, exercises, true);
  }
}

/** `accountLocale` is only used for the error reply if the answer could not be prepared at all. */
export async function sendCoachMessage(userId: string, threadId: string, content: string, accountLocale: Locale): Promise<SendCoachMessageResponse> {
  await requireThread(db, userId, threadId);
  enforceRateLimit('coach', userId, COACH_RATE_LIMIT.limit, COACH_RATE_LIMIT.windowMs);

  const userMessage: CoachMessageDTO = await db.tx(async (tx) => {
    // Serialize concurrent sends of the same user so the quota cannot be exceeded by racing requests.
    await tx.many('SELECT pg_advisory_xact_lock($1::int, hashtext($2::text))', [QUOTA_LOCK_NAMESPACE, userId]);
    const thread = await tx.maybeOne('SELECT id FROM coach_threads WHERE id = $1 AND user_id = $2 FOR UPDATE', [threadId, userId]);
    if (!thread) throw notFound('thread_not_found', 'Conversation not found');
    const limit = config.ai.coachDailyLimit;
    const usage = await usageToday(tx, userId);
    if (usage.used >= limit) throw quotaExceeded(limit, usage.resetsAt);
    return insertMessage(tx, { userId, threadId, role: 'user', content, source: null, status: 'ok' });
  });

  let reply: Reply;
  try {
    reply = await produceReply(userId, threadId, content);
  } catch (err) {
    console.error('[coach] could not prepare a reply', (err as Error)?.name ?? 'Error');
    reply = { content: errorText(replyLanguage(content, accountLocale)), source: 'builtin', status: 'error', rewarded: false };
  }

  const stored = await db.tx(async (tx) => {
    const thread = await tx.maybeOne('SELECT id FROM coach_threads WHERE id = $1 AND user_id = $2 FOR UPDATE', [threadId, userId]);
    if (!thread) throw notFound('thread_not_found', 'Conversation not found');
    const { rewarded, ...fields } = reply;
    const row = await insertMessage(tx, { ...fields, userId, threadId, role: 'assistant' });
    await tx.exec(
      `UPDATE coach_threads SET updated_at = now(), title = CASE WHEN title = '' THEN $3 ELSE title END WHERE id = $1 AND user_id = $2`,
      [threadId, userId, titleFromMessage(content)],
    );
    if (rewarded) await onCoachQuestion(tx, { userId });
    return row;
  });

  return { userMessage, reply: stored, status: await coachStatus(db, userId) };
}
