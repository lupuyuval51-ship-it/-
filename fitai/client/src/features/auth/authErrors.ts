import { ApiError } from '../../api/client';
import type { I18nValue } from '../../i18n';
import { errorMessage } from '../../lib/errors';

type I18n = Pick<I18nValue, 't' | 'tx'>;

/** Whole minutes to wait (at least 1) from a lockout / rate-limit error, or null when unknown. */
export function retryAfterMinutes(err: unknown): number | null {
  if (!(err instanceof ApiError)) return null;
  const details = err.details as { retryAfterSeconds?: unknown } | undefined;
  const seconds = Number(details?.retryAfterSeconds);
  return Number.isFinite(seconds) && seconds > 0 ? Math.max(1, Math.ceil(seconds / 60)) : null;
}

/** Login failure copy: lockouts and rate limits say how long to wait. */
export function loginErrorMessage(err: unknown, i18n: I18n): string {
  if (err instanceof ApiError && (err.code === 'account_locked' || err.code === 'rate_limited')) {
    const minutes = retryAfterMinutes(err);
    if (minutes != null) return i18n.t(err.code === 'account_locked' ? 'auth.login.lockedFor' : 'auth.login.rateLimitedFor', { count: minutes });
  }
  return errorMessage(err, i18n);
}
