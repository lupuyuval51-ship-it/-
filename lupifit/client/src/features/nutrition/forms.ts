import type { ZodError } from 'zod';
import type { I18nValue } from '../../i18n';
import { fieldErrorMessage } from '../../lib/errors';

/** Message codes that zod schemas emit directly (custom refinements, `requiredText`). */
const KNOWN_CODES = new Set(['required', 'grams_or_servings_required', 'macros_exceed_100g', 'invalid_date', 'invalid_barcode']);

/** Maps a zod issue to an `errors.fields.<code>` code. */
export function issueCode(issue: ZodError['issues'][number]): string {
  if (KNOWN_CODES.has(issue.message)) return issue.message;
  switch (issue.code) {
    case 'invalid_type':
      return issue.received === 'undefined' || issue.received === 'null' ? 'required' : 'invalid';
    case 'too_small':
      return issue.type === 'string' ? 'required' : 'too_small';
    case 'too_big':
      return 'too_big';
    default:
      return 'invalid';
  }
}

/** Field path (`per100g.kcal`) → localized message, first issue per field. */
export function zodFieldErrors(err: ZodError, i18n: Pick<I18nValue, 'tx' | 't'>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const path = issue.path.join('.');
    if (!(path in out)) out[path] = fieldErrorMessage(issueCode(issue), i18n) ?? '';
  }
  return out;
}

/** Server validation issues (`details.issues[].path/message`) → localized field messages. */
export function serverFieldErrors(fieldErrors: Record<string, string>, i18n: Pick<I18nValue, 'tx' | 't'>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [path, message] of Object.entries(fieldErrors)) out[path] = fieldErrorMessage(KNOWN_CODES.has(message) ? message : 'invalid', i18n) ?? '';
  return out;
}
