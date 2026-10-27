import type { ZodType, ZodTypeDef } from "zod";

/** מחלץ אובייקט JSON ראשון מטקסט של מודל (גם אם עטוף בגדרות קוד או בטקסט מקדים) */
export function extractJson(text: string): unknown {
  const cleaned = text.replace(/```(?:json)?/gi, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("no_json");
  return JSON.parse(cleaned.slice(start, end + 1));
}

export function parseModelJson<T>(text: string, schema: ZodType<T, ZodTypeDef, unknown>): T {
  return schema.parse(extractJson(text));
}
