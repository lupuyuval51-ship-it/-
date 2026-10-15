import { game } from "../game";

/**
 * Spanish (game). Every key of the English dictionary must be here (checked at compile time). Until a key is translated
 * it falls back to the English text through the spread below; translated entries are written out after it.
 */
export const gameEs: Record<keyof typeof game.en, string> = {
  ...game.en,
};
