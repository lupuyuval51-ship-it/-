import type { Difficulty } from "@/types";

export interface Verdict {
  /** 1 = נכון, 0.5 = חלקי, 0 = שגוי */
  points: 0 | 0.5 | 1;
  topic: string;
  difficulty: Difficulty;
}

const TAG = /\[\[RESULT:(correct|partial|incorrect)(?:\|topic=([^|\]]{0,80}))?(?:\|difficulty=([123]))?\]\]/g;
const MAX_PER_MESSAGE = 10;

/**
 * מחלץ "פסקי דין" שהמורה מצרף לבדיקת תשובת תלמיד במצב תרגול/מבחן, ומסיר אותם מהטקסט המוצג.
 * רק תגיות במבנה המדויק מתקבלות, עד 10 להודעה. כל השאר (כולל תגיות פגומות) מוסר בלי להירשם.
 */
export function parseVerdicts(text: string): { text: string; verdicts: Verdict[] } {
  const verdicts: Verdict[] = [];
  const clean = text.replace(TAG, (_m, v: string, topic?: string, diff?: string) => {
    if (verdicts.length < MAX_PER_MESSAGE) {
      verdicts.push({
        points: v === "correct" ? 1 : v === "partial" ? 0.5 : 0,
        topic: (topic ?? "").trim(),
        difficulty: (diff ? Number(diff) : 2) as Difficulty,
      });
    }
    return "";
  });
  return { text: clean.replace(/\[\[RESULT:[^\]]*\]\]/g, "").replace(/\n{3,}/g, "\n\n").trim(), verdicts };
}

/** בזמן סטרימינג: מסתיר תגית תוצאה שעדיין לא הושלמה */
export function stripPartialTag(text: string): string {
  return text.replace(TAG, "").replace(/\[\[(?:RESULT)?[^\]]*$/, "");
}
