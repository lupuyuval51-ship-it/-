/** Plural forms accepted for any pluralized key (languages need different subsets, e.g. Hebrew "two"). */
export interface PluralForms {
  zero?: string;
  one?: string;
  two?: string;
  few?: string;
  many?: string;
  other: string;
}

/**
 * Shape a translation must have, derived from the English dictionary: same keys, string
 * leaves, and any `{ ..., other }` object may use any plural forms.
 */
export type Translations<T> = T extends string
  ? string
  : T extends { other: string }
    ? PluralForms
    : { [K in keyof T]: Translations<T[K]> };
