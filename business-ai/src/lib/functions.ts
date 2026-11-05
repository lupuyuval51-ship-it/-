/**
 * Typed client for the `ai` Edge Function (JSON actions) + helpers for the `advisor` SSE client.
 * Contracts: supabase/functions/_shared/domain/ai-api.ts.
 */
import { AI_ERROR_CODES, type AiAction, type AiErrorCode, type AiRequest, type AiResponse } from '@domain/ai-api';
import { AppErrorException, makeAppError, toAppError, type AppError } from './errors';
import { getSupabaseAnonKey, getSupabaseUrl, supabase } from './supabase';

export type AiRequestFor<A extends AiAction> = Extract<AiRequest, { action: A }>;

const AI_CODES: ReadonlySet<string> = new Set(AI_ERROR_CODES);

function isAiErrorCode(value: unknown): value is AiErrorCode {
  return typeof value === 'string' && AI_CODES.has(value);
}

/**
 * Extracts the typed `AiErrorBody` from a FunctionsHttpError (whose `context` is the fetch
 * Response). Falls back to the HTTP status, then to toAppError().
 */
export async function aiErrorFrom(error: unknown): Promise<AppError> {
  const e = error as { name?: string; context?: unknown } | null;
  if (e && e.name === 'FunctionsHttpError' && e.context && typeof (e.context as Response).json === 'function') {
    const response = e.context as Response;
    try {
      const body = (await response.clone().json()) as { error?: { code?: unknown; message?: unknown } };
      const code = body?.error?.code;
      if (isAiErrorCode(code)) {
        return makeAppError(code, typeof body.error?.message === 'string' ? body.error.message : code, response.status);
      }
    } catch {
      // not JSON — fall through to status mapping
    }
    return toAppError({ name: 'FunctionsHttpError', message: `HTTP ${response.status}`, context: { status: response.status } });
  }
  return toAppError(error);
}

/**
 * Calls `POST /functions/v1/ai` with the user's JWT. Resolves with the typed response for the
 * action; rejects with `AppErrorException` (use `toAppError(e)` → `t(appError.messageKey)`).
 *
 * @example
 *   const { planVersionId } = await invokeAi({ action: 'plan.generate', businessId, locale });
 */
export async function invokeAi<A extends AiAction>(request: AiRequestFor<A>): Promise<AiResponse<A>> {
  let result: { data: unknown; error: unknown };
  try {
    result = await supabase.functions.invoke('ai', { body: request });
  } catch (thrown) {
    throw new AppErrorException(await aiErrorFrom(thrown));
  }
  if (result.error) throw new AppErrorException(await aiErrorFrom(result.error));
  if (result.data === null || result.data === undefined || typeof result.data !== 'object') {
    throw new AppErrorException(makeAppError('ai_invalid_output', 'Empty response from ai function'));
  }
  return result.data as AiResponse<A>;
}

/** `https://<project>/functions/v1` — base URL for direct (SSE) function calls. */
export function getFunctionsUrl(): string {
  return `${getSupabaseUrl()}/functions/v1`;
}

/**
 * Headers for direct function calls (the advisor SSE stream): the current user's access token
 * (refreshed if needed by supabase-js) and the project's anon key.
 * Rejects with AppErrorException('session_expired') when signed out.
 */
export async function authHeaders(): Promise<Record<string, string>> {
  const { data, error } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (error || !token) throw new AppErrorException(makeAppError('session_expired', error?.message ?? 'No session'));
  return {
    Authorization: `Bearer ${token}`,
    apikey: getSupabaseAnonKey(),
  };
}
