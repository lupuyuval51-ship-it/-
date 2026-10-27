import type { Difficulty, PracticeResult } from "@/types";
import { clamp } from "@/lib/utils";

const HALF_LIFE_DAYS = 14;
const MS_DAY = 86_400_000;

export interface Mastery {
  /** 0..100, או null כשאין נתונים – לא מציגים מספר מומצא */
  percent: number | null;
  attempts: number;
  /** 0..1: כמה אפשר לסמוך על האומדן (עולה עם מספר התרגילים) */
  confidence: number;
}

/**
 * אחוז שליטה משוער: ממוצע דיוק משוקלל שבו תוצאות ישנות מאבדות משקל (מחצית חיים של 14 יום).
 * זהו אומדן מביצועי התרגול בלבד ואינו ציון רשמי.
 */
export function computeMastery(results: PracticeResult[], now: Date = new Date()): Mastery {
  let wCorrect = 0;
  let wTotal = 0;
  let attempts = 0;
  for (const r of results) {
    if (r.total <= 0) continue;
    const age = Math.max(0, (now.getTime() - new Date(r.at).getTime()) / MS_DAY);
    const w = Math.pow(0.5, age / HALF_LIFE_DAYS);
    wCorrect += w * r.correct;
    wTotal += w * r.total;
    attempts += r.total;
  }
  if (wTotal === 0) return { percent: null, attempts: 0, confidence: 0 };
  return {
    percent: Math.round((wCorrect / wTotal) * 100),
    attempts,
    confidence: clamp(attempts / 10, 0, 1),
  };
}

export type MasteryLevel = "unknown" | "weak" | "developing" | "strong";

export function masteryLevel(m: Mastery): MasteryLevel {
  if (m.percent === null) return "unknown";
  if (m.percent < 60) return "weak";
  if (m.percent < 80) return "developing";
  return "strong";
}

export interface DifficultyAdvice {
  difficulty: Difficulty;
  action: "decrease" | "increase" | "keep";
  reason: string;
}

/**
 * התאמת קושי לפי 3 התוצאות האחרונות בנושא:
 *  - מתקשה (<50%) → מורידים קושי ומציעים הסבר נוסף.
 *  - מצליח עקבי (≥85% בשלוש תוצאות) → מעלים בהדרגה.
 */
export function adviseDifficulty(results: PracticeResult[]): DifficultyAdvice {
  const sorted = [...results].filter((r) => r.total > 0).sort((a, b) => a.at.localeCompare(b.at));
  const last = sorted.slice(-3);
  const current: Difficulty = (sorted.at(-1)?.difficulty ?? 2) as Difficulty;
  if (last.length < 2) {
    return { difficulty: current, action: "keep", reason: "עדיין אין מספיק תרגול בנושא כדי להתאים את רמת הקושי." };
  }
  const rate = last.reduce((a, r) => a + r.correct, 0) / last.reduce((a, r) => a + r.total, 0);
  if (rate < 0.5) {
    const d = Math.max(1, current - 1) as Difficulty;
    return {
      difficulty: d,
      action: d < current ? "decrease" : "keep",
      reason: `ההצלחה בתרגולים האחרונים עומדת על ${Math.round(rate * 100)}%, לכן מומלץ לחזור לשאלות קלות יותר ולקבל הסבר נוסף.`,
    };
  }
  if (rate >= 0.85 && last.length >= 3) {
    const d = Math.min(3, current + 1) as Difficulty;
    return {
      difficulty: d,
      action: d > current ? "increase" : "keep",
      reason: `ההצלחה בשלושת התרגולים האחרונים עומדת על ${Math.round(rate * 100)}%, אפשר להעלות את הרמה בהדרגה.`,
    };
  }
  return { difficulty: current, action: "keep", reason: `ההצלחה האחרונה (${Math.round(rate * 100)}%) מתאימה לרמת הקושי הנוכחית.` };
}

export const DIFFICULTY_LABEL: Record<Difficulty, string> = { 1: "קל", 2: "בינוני", 3: "מאתגר" };
