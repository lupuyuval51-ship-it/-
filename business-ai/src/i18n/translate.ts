import { resources, type Resources } from './locales';
import { intlLocale, type LeafPaths, type Locale, type PluralCategory, type PluralForms, type TranslateVars } from './types';

/** Every valid translation key, e.g. `'common.actions.save'`, `'errors.network'`. */
export type TranslationKey = LeafPaths<Resources>;

const FSI = '⁨';
const PDI = '⁩';

/**
 * CLDR cardinal plural category for the supported locales (Hermes has no Intl.PluralRules).
 * - en: one (exactly 1), other
 * - he: one (1), two (2), other — integers only; fractions are `other`.
 */
export function pluralCategory(locale: Locale, count: number): PluralCategory {
  if (!Number.isFinite(count)) return 'other';
  const integer = Number.isInteger(count);
  if (integer && Math.abs(count) === 1) return 'one';
  if (locale === 'he' && integer && Math.abs(count) === 2) return 'two';
  return 'other';
}

/** Picks the plural form for `count`, falling back to `other`. */
export function selectPlural(locale: Locale, count: number, forms: PluralForms): string {
  if (count === 0 && forms.zero !== undefined) return forms.zero;
  const category = pluralCategory(locale, count);
  return forms[category] ?? forms.other;
}

function isPluralForms(value: unknown): value is PluralForms {
  return typeof value === 'object' && value !== null && typeof (value as { other?: unknown }).other === 'string';
}

function lookup(tree: unknown, key: string): string | PluralForms | undefined {
  let node: unknown = tree;
  for (const part of key.split('.')) {
    if (typeof node !== 'object' || node === null) return undefined;
    node = (node as Record<string, unknown>)[part];
  }
  if (typeof node === 'string' || isPluralForms(node)) return node;
  return undefined;
}

function formatVar(value: string | number, locale: Locale): string {
  if (typeof value === 'number') {
    const text = Number.isFinite(value) ? new Intl.NumberFormat(intlLocale(locale)).format(value) : String(value);
    return `${FSI}${text}${PDI}`;
  }
  // Already isolated (e.g. formatMoney output) — don't nest.
  if (value.startsWith(FSI) && value.endsWith(PDI)) return value;
  return `${FSI}${value}${PDI}`;
}

/**
 * Replaces `{name}` placeholders. Every value is wrapped in Unicode isolates (FSI…PDI) so
 * user content and numbers keep their own direction inside Hebrew/English sentences.
 * Unknown placeholders are left as-is.
 */
export function interpolate(template: string, vars: TranslateVars | undefined, locale: Locale): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) => {
    const value = vars[name];
    return value === undefined ? match : formatVar(value, locale);
  });
}

/**
 * Translates `key` for `locale`. Plural leaves select their form from `vars.count`.
 * A missing key (impossible for typed keys) falls back to Hebrew, then to the key itself.
 */
export function translate(locale: Locale, key: TranslationKey, vars?: TranslateVars): string {
  const value = lookup(resources[locale], key) ?? lookup(resources.he, key);
  if (value === undefined) {
    if (__DEV__) console.warn(`[i18n] Missing translation key "${key}"`);
    return key;
  }
  const template = typeof value === 'string' ? value : selectPlural(locale, typeof vars?.count === 'number' ? vars.count : NaN, value);
  return interpolate(template, vars, locale);
}

/** Runtime check used where keys are computed (e.g. from server error codes). */
export function hasTranslation(key: string): key is TranslationKey {
  return lookup(resources.he, key) !== undefined;
}
