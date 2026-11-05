/**
 * `advisor` Edge Function handler: POST JSON (AdvisorRequest) → text/event-stream of AdvisorEvent
 * (meta, delta*, actions, done | error). Exported separately from the Deno.serve entrypoint so tests
 * can call it directly.
 *
 * Flow: auth → validate → business ownership (user client, RLS) → conversation (user client) →
 * reserve advisor_message usage → insert the user message (service role, after the ownership check)
 * → SSE: stream the reply (text deltas), validate proposed actions, persist the assistant message
 * (service role) → finalize usage in `finally`.
 */
import { AiCallError } from '../_shared/ai/errors.ts';
import type { FunctionConfig } from '../_shared/config.ts';
import type { AiProvider } from '../_shared/ai/provider.ts';
import { createServiceClient, type Db, requireUser } from '../_shared/auth.ts';
import { loadBusiness, loadBusinessContext, renderBusinessContext } from '../_shared/context.ts';
import type { AdvisorAction, AdvisorRequest } from '../_shared/domain/ai-api.ts';
import { AdvisorRequestSchema } from '../_shared/domain/ai-api.ts';
import { AppError, fromPostgrestError, logError, toAppError } from '../_shared/errors.ts';
import {
  appErrorResponse,
  corsHeaders,
  errorResponse,
  issueDetails,
  preflight,
  readJsonBody,
} from '../_shared/http.ts';
import { type IdFactory, parseProposeActionsInput, randomId } from '../_shared/outputs.ts';
import {
  advisorSystemPrompt,
  advisorUserTurn,
  MAX_HISTORY_MESSAGES,
  PROPOSE_ACTIONS_TOOL,
  PROPOSE_ACTIONS_TOOL_SPEC,
  renderHistory,
  type StoredMessage,
} from '../_shared/prompts/advisor.ts';
import { todayUtc, toJson } from '../_shared/runtime.ts';
import { SSE_HEADERS, SseWriter } from '../_shared/sse.ts';
import { finalizeUsage, loadTierLimits, reserveUsage, runReserved } from '../_shared/usage.ts';
import { ZERO_USAGE } from '../_shared/ai/pricing.ts';
import { type HandlerDeps, resolveConfig, resolveProvider } from '../_shared/deps.ts';

export type { HandlerDeps };

export const ADVISOR_BUDGET = Object.freeze({ effort: 'low', maxTokens: 8_000 } as const);
/** Interval of SSE keep-alive comments while the model is thinking. */
export const KEEPALIVE_MS = 15_000;
const MAX_STORED_CONTENT = 40_000;

export async function handleAdvisor(req: Request, deps: HandlerDeps = {}): Promise<Response> {
  const started = Date.now();
  let cfg: FunctionConfig;
  try {
    cfg = resolveConfig(deps);
  } catch (err) {
    logError('advisor.config', err);
    return appErrorResponse(toAppError(err), corsHeaders(req));
  }
  const cors = corsHeaders(req, cfg.corsAllowedOrigins);
  if (req.method === 'OPTIONS') return preflight(req, cfg.corsAllowedOrigins);
  if (req.method !== 'POST') {
    return errorResponse('invalid_request', 405, 'Use POST.', { ...cors, Allow: 'POST, OPTIONS' });
  }

  let prepared: Prepared;
  try {
    prepared = await prepare(req, cfg, deps);
  } catch (err) {
    const appErr = toAppError(err);
    if (appErr.status >= 500) logError('advisor.prepare', err);
    logRequest(appErr.status, started, appErr.code);
    return appErrorResponse(appErr, cors);
  }

  const abort = new AbortController();
  let writer: SseWriter | null = null;
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      writer = new SseWriter(controller);
      const w = writer;
      void streamReply(prepared, w, abort.signal, deps).finally(() => {
        w.close();
        logRequest(200, started);
      });
    },
    cancel() {
      writer?.markCancelled();
      abort.abort();
    },
  });
  return new Response(body, { status: 200, headers: { ...SSE_HEADERS, ...cors } });
}

interface Prepared {
  request: AdvisorRequest;
  db: Db;
  svc: Db;
  provider: AiProvider;
  businessCurrency: string;
  conversationId: string;
  userMessageId: string;
  reservationId: string;
}

async function prepare(req: Request, cfg: FunctionConfig, deps: HandlerDeps): Promise<Prepared> {
  const auth = await requireUser(req, cfg);
  const parsed = AdvisorRequestSchema.safeParse(await readJsonBody(req));
  if (!parsed.success) throw new AppError('invalid_request', undefined, { details: issueDetails(parsed.error.issues) });
  const request = parsed.data;
  if (!cfg.ai.apiKey) throw new AppError('not_configured');

  // Ownership through RLS: another user's business (or conversation) is simply not found.
  const business = await loadBusiness(auth.db, request.businessId);
  let conversationId = request.conversationId ?? null;
  if (conversationId) {
    const conv = await auth.db
      .from('ai_conversations')
      .select('id')
      .eq('id', conversationId)
      .eq('business_id', business.id)
      .maybeSingle();
    if (conv.error) throw fromPostgrestError(conv.error, 'ai_conversations.select');
    if (!conv.data) throw new AppError('not_found', 'Conversation not found.');
  }

  const provider = resolveProvider(deps, cfg.ai);
  const svc = createServiceClient(cfg);
  const { limits } = await loadTierLimits(auth.db);
  const reservationId = await reserveUsage({
    svc,
    userId: auth.user.id,
    businessId: business.id,
    feature: 'advisor_message',
    model: provider.model,
    limits,
  });

  try {
    if (!conversationId) {
      const title = request.message.replace(/\s+/g, ' ').trim().slice(0, 60);
      const conv = await auth.db.from('ai_conversations').insert({ business_id: business.id, title }).select('id')
        .single();
      if (conv.error) throw fromPostgrestError(conv.error, 'ai_conversations.insert');
      conversationId = conv.data.id;
    }
    const msg = await svc
      .from('ai_messages')
      .insert({ conversation_id: conversationId, role: 'user', content: request.message, status: 'complete' })
      .select('id')
      .single();
    if (msg.error) throw fromPostgrestError(msg.error, 'ai_messages.insert_user');
    return {
      request,
      db: auth.db,
      svc,
      provider,
      businessCurrency: business.currency,
      conversationId,
      userMessageId: msg.data.id,
      reservationId,
    };
  } catch (err) {
    await finalizeUsage(svc, reservationId, 'error', { ...ZERO_USAGE }, toAppError(err).code);
    throw err;
  }
}

async function loadHistory(db: Db, conversationId: string, excludeId: string): Promise<StoredMessage[]> {
  const { data, error } = await db
    .from('ai_messages')
    .select('id,role,content,actions,status,created_at')
    .eq('conversation_id', conversationId)
    .neq('id', excludeId)
    .order('created_at', { ascending: false })
    .limit(MAX_HISTORY_MESSAGES);
  if (error) throw fromPostgrestError(error, 'ai_messages.history');
  return (data ?? [])
    .reverse()
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content, actions: m.actions, status: m.status }));
}

async function insertAssistant(
  p: Prepared,
  fields: {
    content: string;
    actions: AdvisorAction[];
    followUps: string[];
    status: 'complete' | 'error';
    model: string;
    inputTokens: number;
    outputTokens: number;
  },
): Promise<string> {
  const { data, error } = await p.svc
    .from('ai_messages')
    .insert({
      conversation_id: p.conversationId,
      role: 'assistant',
      content: fields.content.slice(0, MAX_STORED_CONTENT),
      actions: toJson(fields.actions),
      follow_ups: toJson(fields.followUps),
      status: fields.status,
      model: fields.model.slice(0, 100),
      input_tokens: fields.inputTokens,
      output_tokens: fields.outputTokens,
    })
    .select('id')
    .single();
  if (error) throw fromPostgrestError(error, 'ai_messages.insert_assistant');
  return data.id;
}

async function streamReply(p: Prepared, writer: SseWriter, signal: AbortSignal, deps: HandlerDeps): Promise<void> {
  const now = (deps.now ?? (() => new Date()))();
  const newId: IdFactory = deps.newId ?? randomId;
  let streamed = '';
  const keepAlive = setInterval(() => writer.keepAlive(), KEEPALIVE_MS);
  writer.send({ event: 'meta', data: { conversationId: p.conversationId, userMessageId: p.userMessageId } });
  try {
    await runReserved(p.svc, p.reservationId, async (meter) => {
      const [ctx, history] = await Promise.all([
        loadBusinessContext(p.db, p.request.businessId, {
          plan: true,
          finance: true,
          roadmap: true,
          goals: true,
          actuals: true,
          now,
        }),
        loadHistory(p.db, p.conversationId, p.userMessageId),
      ]);
      const result = await meter.track(() =>
        p.provider.streamChat({
          system: advisorSystemPrompt(p.request.locale, p.businessCurrency, todayUtc(now)),
          messages: [...renderHistory(history), {
            role: 'user',
            content: advisorUserTurn(renderBusinessContext(ctx), p.request.message),
          }],
          tools: [PROPOSE_ACTIONS_TOOL_SPEC],
          ...ADVISOR_BUDGET,
          signal,
          onText: (delta) => {
            streamed += delta;
            writer.send({ event: 'delta', data: { text: delta } });
          },
        })
      );
      const call = result.toolCalls.find((c) => c.name === PROPOSE_ACTIONS_TOOL);
      const { actions, followUps } = call
        ? parseProposeActionsInput(call.input, newId)
        : { actions: [], followUps: [] };
      const text = result.text.trim() === '' ? streamed : result.text;
      writer.send({ event: 'actions', data: { actions, followUps } });
      const assistantMessageId = await insertAssistant(p, {
        content: text,
        actions,
        followUps,
        status: 'complete',
        model: result.model,
        inputTokens: result.usage.inputTokens + result.usage.cacheReadTokens + result.usage.cacheWriteTokens,
        outputTokens: result.usage.outputTokens,
      });
      writer.send({ event: 'done', data: { assistantMessageId } });
    });
  } catch (err) {
    const appErr = toAppError(err);
    logError('advisor.stream', err);
    writer.send({ event: 'error', data: { code: appErr.code, message: appErr.message } });
    const partial = streamed.trim() !== '' ? streamed : err instanceof AiCallError ? err.partialText : '';
    if (partial.trim() !== '') {
      try {
        const usage = err instanceof AiCallError ? err.usage : null;
        await insertAssistant(p, {
          content: partial,
          actions: [],
          followUps: [],
          status: 'error',
          model: p.provider.model,
          inputTokens: usage ? usage.inputTokens + usage.cacheReadTokens + usage.cacheWriteTokens : 0,
          outputTokens: usage?.outputTokens ?? 0,
        });
      } catch (persistErr) {
        logError('advisor.persist_partial', persistErr);
      }
    }
  } finally {
    clearInterval(keepAlive);
  }
}

function logRequest(status: number, started: number, code?: string): void {
  console.log(JSON.stringify({ level: 'info', fn: 'advisor', status, code, ms: Date.now() - started }));
}
