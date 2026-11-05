import { AI_ERROR_CODES } from '@domain/ai-api';
import { hasTranslation } from '@/i18n/translate';
import { AppErrorException, isAppError, makeAppError, toAppError, type AppErrorCode } from '../errors';

describe('toAppError', () => {
  it('maps SQL business-rule errors (P0001, message = code)', () => {
    const cases: [string, AppErrorCode][] = [
      ['quota_exceeded', 'quota_exceeded'],
      ['cost_cap_reached', 'cost_cap_reached'],
      ['business_limit_reached', 'business_limit_reached'],
      ['forecast_limit_exceeded', 'forecast_limit_exceeded'],
      ['plan_version_immutable', 'plan_version_immutable'],
      ['dependency_cycle', 'dependency_cycle'],
      ['dependency_self', 'dependency_self'],
      ['dependency_cross_business', 'dependency_cross_business'],
      ['immutable_column', 'immutable_column'],
      ['not_found', 'not_found'],
      ['precondition_failed', 'precondition_failed'],
      ['something_new', 'invalid_request'],
    ];
    for (const [message, code] of cases) {
      expect(toAppError({ code: 'P0001', message, details: null, hint: null }).code).toBe(code);
    }
    expect(toAppError({ code: 'P0001', message: 'quota_exceeded' }).messageKey).toBe('errors.quotaExceeded');
  });

  it('maps Postgres / PostgREST codes', () => {
    expect(toAppError({ code: '42501', message: 'new row violates row-level security policy for table "tasks"' }).code).toBe('forbidden');
    expect(toAppError({ code: '42501', message: 'permission denied for table profiles' }).messageKey).toBe('errors.forbidden');
    expect(toAppError({ code: '23505', message: 'duplicate key value violates unique constraint' }).code).toBe('conflict');
    expect(toAppError({ code: '23503', message: 'fk' }).code).toBe('not_found');
    expect(toAppError({ code: '23514', message: 'check' }).code).toBe('validation');
    expect(toAppError({ code: '22P02', message: 'invalid input syntax for type uuid' }).code).toBe('validation');
    expect(toAppError({ code: 'PGRST116', message: 'JSON object requested, multiple (or no) rows returned' }).code).toBe('not_found');
    expect(toAppError({ code: 'PGRST301', message: 'JWT expired' }).code).toBe('session_expired');
  });

  it('maps Supabase Auth errors', () => {
    const auth = (code: string, status = 400, name = 'AuthApiError') => ({ __isAuthError: true, name, code, status, message: code });
    expect(toAppError(auth('invalid_credentials')).code).toBe('invalid_credentials');
    expect(toAppError(auth('email_not_confirmed')).code).toBe('email_not_confirmed');
    expect(toAppError(auth('user_already_exists', 422)).code).toBe('user_already_exists');
    expect(toAppError(auth('weak_password', 422)).code).toBe('weak_password');
    expect(toAppError(auth('same_password', 422)).code).toBe('same_password');
    expect(toAppError(auth('over_email_send_rate_limit', 429)).code).toBe('email_rate_limited');
    expect(toAppError(auth('otp_expired', 403)).code).toBe('recovery_link_invalid');
    expect(toAppError(auth('flow_state_not_found', 404)).code).toBe('recovery_link_invalid');
    expect(toAppError({ __isAuthError: true, name: 'AuthRetryableFetchError', status: 0, message: 'Failed to fetch' }).code).toBe('network');
    expect(toAppError({ __isAuthError: true, name: 'AuthSessionMissingError', status: 400, message: 'Auth session missing!' }).code).toBe('session_expired');
    expect(toAppError({ __isAuthError: true, name: 'AuthPKCECodeVerifierMissingError', status: 400, message: 'x' }).code).toBe('recovery_link_invalid');
    // Older servers without error codes.
    expect(toAppError({ __isAuthError: true, name: 'AuthApiError', status: 400, message: 'Invalid login credentials' }).code).toBe('invalid_credentials');
  });

  it('maps Edge Function errors and AiErrorBody payloads', () => {
    for (const code of AI_ERROR_CODES) {
      expect(toAppError({ error: { code, message: 'x' } }).code).toBe(code);
    }
    expect(toAppError({ name: 'FunctionsFetchError', message: 'Failed to send a request', context: {} }).code).toBe('network');
    expect(toAppError({ name: 'FunctionsRelayError', message: 'Relay', context: {} }).code).toBe('ai_unavailable');
    expect(toAppError({ name: 'FunctionsHttpError', message: 'non-2xx', context: { status: 429 } }).code).toBe('rate_limited');
    expect(toAppError({ name: 'FunctionsHttpError', message: 'non-2xx', context: { status: 401 } }).code).toBe('session_expired');
  });

  it('maps network failures from every platform', () => {
    expect(toAppError(new TypeError('Network request failed')).code).toBe('network'); // React Native
    expect(toAppError(new TypeError('Failed to fetch')).code).toBe('network'); // Chrome
    expect(toAppError(new TypeError('Load failed')).code).toBe('network'); // Safari
    expect(toAppError('NetworkError when attempting to fetch resource.').code).toBe('network'); // Firefox
  });

  it('handles junk, zod errors and passthrough', () => {
    expect(toAppError(null).code).toBe('unknown');
    expect(toAppError(undefined).code).toBe('unknown');
    expect(toAppError(42).code).toBe('unknown');
    expect(toAppError(new Error('boom')).code).toBe('unknown');
    expect(toAppError({ name: 'ZodError', issues: [] }).code).toBe('validation');
    const appError = makeAppError('quota_exceeded');
    expect(toAppError(appError)).toBe(appError);
    expect(toAppError(new AppErrorException(appError))).toBe(appError);
    expect(isAppError(appError)).toBe(true);
    expect(isAppError({ code: 'x' })).toBe(false);
  });

  it('flags retryable errors', () => {
    expect(makeAppError('network').retryable).toBe(true);
    expect(makeAppError('rate_limited').retryable).toBe(true);
    expect(makeAppError('quota_exceeded').retryable).toBe(false);
    expect(makeAppError('forbidden').retryable).toBe(false);
  });

  it('every code maps to an existing translation', () => {
    const codes: AppErrorCode[] = [
      ...AI_ERROR_CODES,
      'network',
      'offline',
      'session_expired',
      'validation',
      'business_limit_reached',
      'forecast_limit_exceeded',
      'plan_version_immutable',
      'dependency_cycle',
      'dependency_self',
      'dependency_cross_business',
      'immutable_column',
      'invalid_credentials',
      'email_not_confirmed',
      'user_already_exists',
      'weak_password',
      'same_password',
      'email_rate_limited',
      'signup_disabled',
      'recovery_link_invalid',
      'unknown',
    ];
    for (const code of codes) expect(hasTranslation(makeAppError(code).messageKey)).toBe(true);
  });
});
