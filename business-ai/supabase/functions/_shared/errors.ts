/**
 * Application error type shared by both Edge Functions, plus mapping of PostgREST / Postgres
 * errors (see docs/DATA_MODEL.md "Error codes") onto the public `AiErrorCode` contract.
 */
import { AI_ERROR_CODES, type AiErrorCode } from './domain/ai-api.ts';

/** Default HTTP status per public error code. */
export const STATUS_BY_CODE: Readonly<Record<AiErrorCode, number>> = Object.freeze({
  unauthorized: 401,
  forbidden: 403,
  not_found: 404,
  invalid_request: 400,
  conflict: 409,
  precondition_failed: 412,
  quota_exceeded: 429,
  cost_cap_reached: 429,
  rate_limited: 429,
  ai_unavailable: 503,
  ai_refused: 422,
  ai_invalid_output: 502,
  not_configured: 503,
  internal: 500,
});

/** Default (English, developer-facing) message per code. The app shows its own translated text. */
const DEFAULT_MESSAGES: Readonly<Record<AiErrorCode, string>> = Object.freeze({
  unauthorized: 'Authentication required.',
  forbidden: 'You do not have access to this resource.',
  not_found: 'Not found.',
  invalid_request: 'The request is invalid.',
  conflict: 'The request conflicts with the current state.',
  precondition_failed: 'A precondition for this request is not met.',
  quota_exceeded: 'Monthly AI quota for this feature is used up.',
  cost_cap_reached: 'Monthly AI spending limit reached.',
  rate_limited: 'The AI service is busy. Try again shortly.',
  ai_unavailable: 'The AI service is temporarily unavailable.',
  ai_refused: 'The AI declined this request.',
  ai_invalid_output: 'The AI returned an unusable answer. Try again.',
  not_configured: 'The AI service is not configured.',
  internal: 'Something went wrong.',
});

export class AppError extends Error {
  readonly code: AiErrorCode;
  readonly status: number;
  readonly details?: Record<string, unknown>;

  constructor(
    code: AiErrorCode,
    message?: string,
    options?: { status?: number; details?: Record<string, unknown>; cause?: unknown },
  ) {
    super(message ?? DEFAULT_MESSAGES[code], options?.cause === undefined ? undefined : { cause: options.cause });
    this.name = 'AppError';
    this.code = code;
    this.status = options?.status ?? STATUS_BY_CODE[code];
    if (options?.details) this.details = options.details;
  }
}

export function isAiErrorCode(value: unknown): value is AiErrorCode {
  return typeof value === 'string' && (AI_ERROR_CODES as readonly string[]).includes(value);
}

/** Minimal structural shape of a PostgREST error (supabase-js `PostgrestError`). */
export interface PostgrestLikeError {
  code?: string | null;
  message: string;
  details?: string | null;
  hint?: string | null;
}

/** Business-rule codes raised by our SQL (SQLSTATE P0001, message = code) mapped to public codes. */
const SQL_RULE_CODES: Readonly<Record<string, AiErrorCode>> = Object.freeze({
  not_found: 'not_found',
  forbidden: 'forbidden',
  invalid_request: 'invalid_request',
  precondition_failed: 'precondition_failed',
  conflict: 'conflict',
  immutable_column: 'conflict',
  plan_version_immutable: 'conflict',
  business_limit_reached: 'precondition_failed',
  forecast_limit_exceeded: 'precondition_failed',
  dependency_self: 'invalid_request',
  dependency_cross_business: 'invalid_request',
  dependency_cycle: 'invalid_request',
  quota_exceeded: 'quota_exceeded',
  cost_cap_reached: 'cost_cap_reached',
});

/**
 * Maps a PostgREST error to an AppError. `context` names the failing operation for logs; it is
 * never shown to end users. Unknown errors become `internal` (and should be logged by the caller).
 */
export function fromPostgrestError(err: PostgrestLikeError, context: string): AppError {
  const sqlCode = err.code ?? '';
  const details: Record<string, unknown> = { op: context };
  if (sqlCode === 'P0001') {
    const mapped = SQL_RULE_CODES[err.message];
    if (mapped) {
      if (err.details) details.reason = err.details;
      return new AppError(mapped, undefined, { details });
    }
  }
  switch (sqlCode) {
    case '42501': // insufficient_privilege (RLS / column grants)
      return new AppError('forbidden', undefined, { details });
    case '23514': // check_violation
    case '22P02': // invalid_text_representation (bad uuid etc.)
    case '23502': // not_null_violation
    case '22001': // string_data_right_truncation
      return new AppError('invalid_request', undefined, { details });
    case '23505': // unique_violation
      return new AppError('conflict', undefined, { details });
    case '23503': // foreign_key_violation
      return new AppError('not_found', undefined, { details });
    case 'PGRST116': // .single() returned zero (or many) rows
      return new AppError('not_found', undefined, { details });
    default:
      return new AppError('internal', undefined, {
        details,
        cause: new Error(`${context}: ${sqlCode} ${err.message}`),
      });
  }
}

/** Normalizes any thrown value to an AppError (unknown errors become `internal`). */
export function toAppError(err: unknown): AppError {
  if (err instanceof AppError) return err;
  return new AppError('internal', undefined, { cause: err });
}

/** Logs an error without user content or secrets: code, status, operation and cause message only. */
export function logError(scope: string, err: unknown): void {
  const appErr = err instanceof AppError ? err : null;
  const cause = appErr ? appErr.cause : err;
  const causeMessage = cause instanceof Error
    ? `${cause.name}: ${cause.message}`
    : cause === undefined
    ? undefined
    : String(cause);
  console.error(
    JSON.stringify({
      level: 'error',
      scope,
      code: appErr?.code ?? 'internal',
      status: appErr?.status ?? 500,
      op: appErr?.details?.op,
      cause: causeMessage?.slice(0, 500),
    }),
  );
}
