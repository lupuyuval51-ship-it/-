import { ApiError } from '../api/client';
import type { I18nValue } from '../i18n';

/** Human-readable, localized message for any thrown error. */
export function errorMessage(err: unknown, i18n: Pick<I18nValue, 'tx' | 't'>): string {
  if (err instanceof ApiError) return i18n.tx(`errors.${err.code}`, undefined, i18n.t('errors.generic'));
  return i18n.t('errors.generic');
}

/** Localized message for a zod/server field error code (e.g. `password_too_short`). */
export function fieldErrorMessage(code: string | undefined, i18n: Pick<I18nValue, 'tx' | 't'>): string | undefined {
  if (!code) return undefined;
  return i18n.tx(`errors.fields.${code}`, undefined, i18n.t('errors.fields.invalid'));
}
