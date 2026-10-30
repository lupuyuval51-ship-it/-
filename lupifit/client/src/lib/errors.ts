import { ApiError } from '../api/client';
import type { I18nValue } from '../i18n';

/**
 * Human-readable, localized message for any thrown error. Looks up
 * `<namespace>.errors.<code>` first (module-specific messages), then `errors.<code>`,
 * then a generic message.
 */
export function errorMessage(err: unknown, i18n: Pick<I18nValue, 'tx' | 't'>, namespace?: string): string {
  if (err instanceof ApiError) {
    const generic = i18n.t('errors.generic');
    const global = i18n.tx(`errors.${err.code}`, undefined, generic);
    return namespace ? i18n.tx(`${namespace}.errors.${err.code}`, undefined, global) : global;
  }
  return i18n.t('errors.generic');
}

/** Localized message for a zod/server field error code (e.g. `password_too_short`). */
export function fieldErrorMessage(code: string | undefined, i18n: Pick<I18nValue, 'tx' | 't'>): string | undefined {
  if (!code) return undefined;
  return i18n.tx(`errors.fields.${code}`, undefined, i18n.t('errors.fields.invalid'));
}
