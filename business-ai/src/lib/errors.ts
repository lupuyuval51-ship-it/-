/**
 * Maps every error the app can encounter (PostgREST, Postgres business rules, Supabase Auth,
 * Edge Functions, network, zod) to a stable `AppError` with a translation key. UI shows
 * `t(error.messageKey)` — never raw server text.
 */
import { AI_ERROR_CODES, type AiErrorCode } from '@domain/ai-api';
import type { TranslationKey } from '@/i18n/translate';

export type AppErrorCode =
  | AiErrorCode
  | 'network'
  | 'offline'
  | 'session_expired'
  | 'validation'
  | 'business_limit_reached'
  | 'forecast_limit_exceeded'
  | 'plan_version_immutable'
  | 'dependency_cycle'
  | 'dependency_self'
  | 'dependency_cross_business'
  | 'immutable_column'
  | 'invalid_credentials'
  | 'email_not_confirmed'
  | 'user_already_exists'
  | 'weak_password'
  | 'same_password'
  | 'email_rate_limited'
  | 'signup_disabled'
  | 'recovery_link_invalid'
  | 'unknown';

export interface AppError {
  code: AppErrorCode;
  messageKey: TranslationKey;
  /** Developer-facing detail. Never render it. */
  message: string;
  /** HTTP status when known. */
  status?: number;
  /** True when retrying the same request may succeed (network, rate limits, AI availability). */
  retryable: boolean;
}

const MESSAGE_KEYS: Record<AppErrorCode, TranslationKey> = {
  unauthorized: 'errors.sessionExpired',
  forbidden: 'errors.forbidden',
  not_found: 'errors.notFound',
  invalid_request: 'errors.invalidRequest',
  conflict: 'errors.conflict',
  precondition_failed: 'errors.preconditionFailed',
  quota_exceeded: 'errors.quotaExceeded',
  cost_cap_reached: 'errors.costCapReached',
  rate_limited: 'errors.rateLimited',
  ai_unavailable: 'errors.aiUnavailable',
  ai_refused: 'errors.aiRefused',
  ai_invalid_output: 'errors.aiInvalidOutput',
  not_configured: 'errors.notConfigured',
  internal: 'errors.unknown',
  network: 'errors.network',
  offline: 'errors.offline',
  session_expired: 'errors.sessionExpired',
  validation: 'errors.invalidRequest',
  business_limit_reached: 'errors.businessLimitReached',
  forecast_limit_exceeded: 'errors.forecastLimitExceeded',
  plan_version_immutable: 'errors.planVersionImmutable',
  dependency_cycle: 'errors.dependencyCycle',
  dependency_self: 'errors.dependencySelf',
  dependency_cross_business: 'errors.dependencyCrossBusiness',
  immutable_column: 'errors.immutableColumn',
  invalid_credentials: 'errors.invalidCredentials',
  email_not_confirmed: 'errors.emailNotConfirmed',
  user_already_exists: 'errors.userAlreadyExists',
  weak_password: 'errors.weakPassword',
  same_password: 'errors.samePassword',
  email_rate_limited: 'errors.emailRateLimited',
  signup_disabled: 'errors.signupDisabled',
  recovery_link_invalid: 'errors.recoveryLinkInvalid',
  unknown: 'errors.unknown',
};

const RETRYABLE: ReadonlySet<AppErrorCode> = new Set<AppErrorCode>(['network', 'offline', 'rate_limited', 'ai_unavailable', 'internal', 'unknown', 'ai_invalid_output']);

/** Business-rule codes raised by SQL (`raise exception '<code>' using errcode = 'P0001'`). */
const SQL_RULE_CODES: Readonly<Record<string, AppErrorCode>> = {
  quota_exceeded: 'quota_exceeded',
  cost_cap_reached: 'cost_cap_reached',
  business_limit_reached: 'business_limit_reached',
  forecast_limit_exceeded: 'forecast_limit_exceeded',
  plan_version_immutable: 'plan_version_immutable',
  dependency_cycle: 'dependency_cycle',
  dependency_self: 'dependency_self',
  dependency_cross_business: 'dependency_cross_business',
  immutable_column: 'immutable_column',
  not_found: 'not_found',
  forbidden: 'forbidden',
  conflict: 'conflict',
  invalid_request: 'invalid_request',
  precondition_failed: 'precondition_failed',
};

/** Supabase Auth error codes (AuthApiError.code). */
const AUTH_CODES: Readonly<Record<string, AppErrorCode>> = {
  invalid_credentials: 'invalid_credentials',
  email_not_confirmed: 'email_not_confirmed',
  user_already_exists: 'user_already_exists',
  email_exists: 'user_already_exists',
  weak_password: 'weak_password',
  same_password: 'same_password',
  over_email_send_rate_limit: 'email_rate_limited',
  over_request_rate_limit: 'rate_limited',
  over_sms_send_rate_limit: 'rate_limited',
  signup_disabled: 'signup_disabled',
  email_provider_disabled: 'signup_disabled',
  email_address_invalid: 'validation',
  validation_failed: 'validation',
  session_not_found: 'session_expired',
  session_expired: 'session_expired',
  refresh_token_not_found: 'session_expired',
  refresh_token_already_used: 'session_expired',
  bad_jwt: 'session_expired',
  user_not_found: 'session_expired',
  flow_state_not_found: 'recovery_link_invalid',
  flow_state_expired: 'recovery_link_invalid',
  otp_expired: 'recovery_link_invalid',
  bad_code_verifier: 'recovery_link_invalid',
};

const AI_CODES: ReadonlySet<string> = new Set(AI_ERROR_CODES);

export function makeAppError(code: AppErrorCode, message: string = code, status?: number): AppError {
  return { code, messageKey: MESSAGE_KEYS[code], message, status, retryable: RETRYABLE.has(code) };
}

/** Thrown by app code (invokeAi, auth helpers) so callers can `catch (e) { toAppError(e) }`. */
export class AppErrorException extends Error {
  readonly appError: AppError;
  constructor(appError: AppError) {
    super(appError.message);
    this.name = 'AppErrorException';
    this.appError = appError;
  }
}

export function isAppError(value: unknown): value is AppError {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Partial<AppError>;
  return typeof v.code === 'string' && typeof v.messageKey === 'string' && typeof v.retryable === 'boolean';
}

type Loose = Record<string, unknown>;

function str(v: unknown): string | undefined {
  return typeof v === 'string' ? v : undefined;
}

function isNetworkMessage(message: string): boolean {
  return /network request failed|failed to fetch|networkerror|load failed|fetch failed|network error|timed? ?out|ECONNREFUSED|ENOTFOUND/i.test(message);
}

function fromPostgres(code: string, message: string, status?: number): AppError | null {
  if (code === 'P0001') {
    const rule = SQL_RULE_CODES[message.trim()];
    return makeAppError(rule ?? 'invalid_request', message, status);
  }
  switch (code) {
    case '42501': // insufficient_privilege / RLS violation
      return makeAppError('forbidden', message, status);
    case '23505': // unique_violation
      return makeAppError('conflict', message, status);
    case '23503': // foreign_key_violation
      return makeAppError('not_found', message, status);
    case '23502': // not_null_violation
    case '23514': // check_violation
    case '22P02': // invalid_text_representation (bad uuid etc.)
    case '22001': // string_data_right_truncation
    case '22003': // numeric_value_out_of_range
    case '22023': // invalid_parameter_value
      return makeAppError('validation', message, status);
    case '40001': // serialization_failure
    case '40P01': // deadlock_detected
    case '57014': // query_canceled (statement timeout)
      return makeAppError('unknown', message, status);
    case 'PGRST116': // .single() with 0 rows
      return makeAppError('not_found', message, status);
    case 'PGRST301': // JWT expired
    case 'PGRST302':
    case 'PGRST303':
      return makeAppError('session_expired', message, status);
    default:
      return null;
  }
}

function fromStatus(status: number, message: string): AppError {
  if (status === 401) return makeAppError('session_expired', message, status);
  if (status === 403) return makeAppError('forbidden', message, status);
  if (status === 404) return makeAppError('not_found', message, status);
  if (status === 409) return makeAppError('conflict', message, status);
  if (status === 422 || status === 400) return makeAppError('invalid_request', message, status);
  if (status === 429) return makeAppError('rate_limited', message, status);
  if (status === 503) return makeAppError('ai_unavailable', message, status);
  return makeAppError('unknown', message, status);
}

/**
 * Normalizes anything thrown into an AppError. Safe on `null`, strings, Errors, PostgrestError,
 * AuthError, FunctionsError, AppErrorException, AiErrorBody and zod errors.
 */
export function toAppError(error: unknown): AppError {
  if (error instanceof AppErrorException) return error.appError;
  if (isAppError(error)) return error;
  if (error === null || error === undefined) return makeAppError('unknown', 'Unknown error');
  if (typeof error === 'string') return isNetworkMessage(error) ? makeAppError('network', error) : makeAppError('unknown', error);
  if (typeof error !== 'object') return makeAppError('unknown', String(error));

  const e = error as Loose;
  const name = str(e.name) ?? '';
  const message = str(e.message) ?? '';
  const status = typeof e.status === 'number' ? e.status : undefined;

  // AiErrorBody: { error: { code, message } } (edge function response bodies).
  const body = e.error;
  if (typeof body === 'object' && body !== null) {
    const code = str((body as Loose).code);
    if (code && AI_CODES.has(code)) return makeAppError(code as AiErrorCode, str((body as Loose).message) ?? code, status);
  }

  // Edge function transport errors (the HTTP error body is parsed in invokeAi).
  if (name === 'FunctionsFetchError') return makeAppError('network', message);
  if (name === 'FunctionsRelayError') return makeAppError('ai_unavailable', message);
  if (name === 'FunctionsHttpError') {
    const ctx = e.context as Loose | undefined;
    const ctxStatus = ctx && typeof ctx.status === 'number' ? ctx.status : status;
    return ctxStatus ? fromStatus(ctxStatus, message) : makeAppError('unknown', message);
  }

  // Supabase Auth.
  if (e.__isAuthError === true || name.startsWith('Auth')) {
    if (name === 'AuthRetryableFetchError' || (status === 0 && isNetworkMessage(message))) return makeAppError('network', message, status);
    if (name === 'AuthSessionMissingError') return makeAppError('session_expired', message, status);
    if (name === 'AuthPKCECodeVerifierMissingError' || name === 'AuthPKCEGrantCodeExchangeError')
      return makeAppError('recovery_link_invalid', message, status);
    if (name === 'AuthWeakPasswordError') return makeAppError('weak_password', message, status);
    const code = str(e.code);
    const mapped = code ? AUTH_CODES[code] : undefined;
    if (mapped) return makeAppError(mapped, message, status);
    if (/invalid login credentials/i.test(message)) return makeAppError('invalid_credentials', message, status);
    if (status === 429) return makeAppError('rate_limited', message, status);
    if (isNetworkMessage(message)) return makeAppError('network', message, status);
    return status ? fromStatus(status, message) : makeAppError('unknown', message);
  }

  // PostgREST / Postgres: { code, message, details, hint }.
  const pgCode = str(e.code);
  if (pgCode) {
    const mapped = fromPostgres(pgCode, message, status);
    if (mapped) return mapped;
    if (AI_CODES.has(pgCode)) return makeAppError(pgCode as AiErrorCode, message, status);
  }

  // zod
  if (name === 'ZodError' || Array.isArray(e.issues)) return makeAppError('validation', message || 'Validation failed');

  if (isNetworkMessage(message)) return makeAppError('network', message, status);
  if (name === 'AbortError') return makeAppError('network', message);
  if (status) return fromStatus(status, message);
  return makeAppError('unknown', message || name || 'Unknown error');
}

/** Convenience for UI: whether to show a retry affordance. */
export function isRetryable(error: unknown): boolean {
  return toAppError(error).retryable;
}
