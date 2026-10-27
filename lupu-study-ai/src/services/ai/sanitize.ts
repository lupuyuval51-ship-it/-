import type { z } from "zod";
import type { questionsResultSchema } from "./schemas";

type Q = z.output<typeof questionsResultSchema>["questions"][number];

/** מסנן שאלות שגויות מבנית (למשל אמריקאית עם אינדקס מחוץ לטווח) – לא מציגים שאלות שבורות */
export function sanitizeQuestions(qs: Q[], allowed: string[]): Q[] {
  return qs.filter((q) => {
    if (!allowed.includes(q.type)) return false;
    if (q.type === "mcq") {
      const idx = Number(q.answerKey);
      return q.options.length >= 2 && Number.isInteger(idx) && idx >= 0 && idx < q.options.length;
    }
    if (q.type === "tf") return q.answerKey === "true" || q.answerKey === "false";
    return q.answerKey.trim().length > 0;
  });
}
