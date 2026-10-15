import { app } from "../app";

/**
 * Spanish (app). Every key of the English dictionary must be here (checked at compile time). Until a key is translated
 * it falls back to the English text through the spread below; translated entries are written out after it.
 */
export const appEs: Record<keyof typeof app.en, string> = {
  ...app.en,
};
