import { z } from "zod";

/** Localized text as stored in data: both languages present, bounded length. */
export const localizedSchema = (max = 600) =>
  z.object({ he: z.string().max(max), en: z.string().max(max) }).refine((v) => v.he.trim().length > 0 || v.en.trim().length > 0, { message: "empty_localized" });

export const localizedListSchema = (max = 600, maxItems = 12) => z.array(localizedSchema(max)).max(maxItems);
