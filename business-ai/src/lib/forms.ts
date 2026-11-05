/**
 * zod ⇄ i18n bridge for react-hook-form. Schemas carry translation keys (optionally with vars)
 * as their messages; `useFieldError()` turns a field error into translated text.
 *
 *   const schema = z.object({ name: z.string().max(100, fieldMessage('errors.field.tooLong', { max: 100 })) });
 *   const fieldError = useFieldError();
 *   <TextField error={fieldError(formState.errors.name)} … />
 */
import { useCallback } from 'react';
import { useT } from '@/i18n/I18nProvider';
import { hasTranslation, type TranslationKey } from '@/i18n/translate';

const SEP = '?';

/** Encodes a translation key and its vars into a zod message string. */
export function fieldMessage(key: TranslationKey, vars?: Readonly<Record<string, string | number>>): string {
  if (!vars) return key;
  const query = Object.entries(vars)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');
  return `${key}${SEP}${query}`;
}

export interface DecodedFieldMessage {
  key: TranslationKey;
  vars?: Record<string, string | number>;
}

export function decodeFieldMessage(message: string): DecodedFieldMessage | null {
  const [rawKey, query] = message.split(SEP, 2);
  if (!rawKey || !hasTranslation(rawKey)) return null;
  if (!query) return { key: rawKey };
  const vars: Record<string, string | number> = {};
  for (const pair of query.split('&')) {
    const [k, v] = pair.split('=');
    if (!k || v === undefined) continue;
    const value = decodeURIComponent(v);
    vars[decodeURIComponent(k)] = /^-?\d+(\.\d+)?$/.test(value) ? Number(value) : value;
  }
  return { key: rawKey, vars };
}

/** Returns a function mapping an RHF FieldError (or undefined) to translated text. */
export function useFieldError(): (error: { message?: string } | undefined) => string | undefined {
  const t = useT();
  return useCallback(
    (error) => {
      if (!error) return undefined;
      const decoded = error.message ? decodeFieldMessage(error.message) : null;
      return decoded ? t(decoded.key, decoded.vars) : t('errors.invalidRequest');
    },
    [t],
  );
}
