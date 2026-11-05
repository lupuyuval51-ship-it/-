/**
 * `ai` Edge Function handler: POST JSON → JSON for every action of AiRequestSchema.
 * Exported separately from the Deno.serve entrypoint (index.ts) so tests can call it directly.
 */
import { createServiceClient, requireUser } from '../_shared/auth.ts';
import type { FunctionConfig } from '../_shared/config.ts';
import { type HandlerDeps, resolveConfig, resolveProvider } from '../_shared/deps.ts';
import { AiRequestSchema } from '../_shared/domain/ai-api.ts';
import { AppError, logError, toAppError } from '../_shared/errors.ts';
import {
  appErrorResponse,
  corsHeaders,
  errorResponse,
  issueDetails,
  json,
  preflight,
  readJsonBody,
} from '../_shared/http.ts';
import { randomId } from '../_shared/outputs.ts';
import { defaultWaitUntil } from '../_shared/runtime.ts';
import { loadTierLimits } from '../_shared/usage.ts';
import {
  type ActionContext,
  financePropose,
  marketingGenerate,
  planGenerate,
  planRegenerateSection,
  roadmapGenerate,
  roadmapRecommend,
} from './actions.ts';

export type { HandlerDeps };

export async function handleAi(req: Request, deps: HandlerDeps = {}): Promise<Response> {
  const started = Date.now();
  let cfg: FunctionConfig;
  try {
    cfg = resolveConfig(deps);
  } catch (err) {
    logError('ai.config', err);
    return appErrorResponse(toAppError(err), corsHeaders(req));
  }
  const cors = corsHeaders(req, cfg.corsAllowedOrigins);
  if (req.method === 'OPTIONS') return preflight(req, cfg.corsAllowedOrigins);
  if (req.method !== 'POST') {
    return errorResponse('invalid_request', 405, 'Use POST.', { ...cors, Allow: 'POST, OPTIONS' });
  }

  let action = 'unknown';
  try {
    const auth = await requireUser(req, cfg);
    const body = await readJsonBody(req);
    const parsed = AiRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw new AppError('invalid_request', undefined, { details: issueDetails(parsed.error.issues) });
    }
    const request = parsed.data;
    action = request.action;
    if (!cfg.ai.apiKey) throw new AppError('not_configured');

    const provider = resolveProvider(deps, cfg.ai);
    const { limits } = await loadTierLimits(auth.db);
    const ctx: ActionContext = {
      db: auth.db,
      svc: createServiceClient(cfg),
      user: auth.user,
      provider,
      limits,
      waitUntil: deps.waitUntil ?? defaultWaitUntil,
      now: deps.now ?? (() => new Date()),
      newId: deps.newId ?? randomId,
    };

    let result: { status: number; body: unknown };
    switch (request.action) {
      case 'plan.generate':
        result = await planGenerate(ctx, request);
        break;
      case 'plan.regenerateSection':
        result = await planRegenerateSection(ctx, request);
        break;
      case 'roadmap.generate':
        result = await roadmapGenerate(ctx, request);
        break;
      case 'roadmap.recommend':
        result = await roadmapRecommend(ctx, request);
        break;
      case 'marketing.generate':
        result = await marketingGenerate(ctx, request);
        break;
      case 'finance.propose':
        result = await financePropose(ctx, request);
        break;
    }
    logRequest(action, result.status, started);
    return json(result.body, result.status, cors);
  } catch (err) {
    const appErr = toAppError(err);
    if (appErr.status >= 500 || appErr.code === 'ai_invalid_output' || appErr.code === 'ai_refused') {
      logError(`ai.${action}`, err);
    }
    logRequest(action, appErr.status, started, appErr.code);
    return appErrorResponse(appErr, cors);
  }
}

function logRequest(action: string, status: number, started: number, code?: string): void {
  console.log(JSON.stringify({ level: 'info', fn: 'ai', action, status, code, ms: Date.now() - started }));
}
