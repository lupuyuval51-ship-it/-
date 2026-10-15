import { common } from "../common";

/**
 * Spanish (common). Every key of the English dictionary must be here (checked at compile time). Until a key is translated
 * it falls back to the English text through the spread below; translated entries are written out after it.
 */
export const commonEs: Record<keyof typeof common.en, string> = {
  ...common.en,
};
