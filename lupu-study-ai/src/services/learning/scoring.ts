import type { AnswerSubmission, ExamQuestion } from "@/types";

/** ניקוי ניקוד, פיסוק ורווחים כדי להשוות תשובות טקסט בצורה סלחנית */
export function normalizeText(s: string): string {
  return s
    .normalize("NFKD")
    .replace(/[֑-ׇ]/g, "") // ניקוד וטעמי מקרא
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/["'`´׳״.,;:!?()[\]{}־\-–—_]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** מנסה לפרש מחרוזת כמספר: 0.5, 0,5, 1/2, 50%, -3 */
export function parseNumber(s: string): number | null {
  const t = s.trim().replace(/\s+/g, "").replace(",", ".").replace(/%$/, "");
  if (!t) return null;
  const frac = /^(-?\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)$/.exec(t);
  if (frac) {
    const den = Number(frac[2]);
    return den === 0 ? null : Number(frac[1]) / den;
  }
  if (/^-?\d+(?:\.\d+)?$/.test(t)) return Number(t);
  return null;
}

export function answersMatch(response: string, acceptable: string): boolean {
  const r = normalizeText(response);
  if (!r) return false;
  const rn = parseNumber(response);
  return acceptable
    .split("|")
    .map((a) => a.trim())
    .filter(Boolean)
    .some((a) => {
      if (normalizeText(a) === r) return true;
      const an = parseNumber(a);
      return rn !== null && an !== null && Math.abs(rn - an) < 1e-9;
    });
}

export interface GradeResult {
  correct: boolean | null;
  points: number | null;
}

/**
 * בדיקה דטרמיניסטית באמצעות מפתח תשובות לשאלות אמריקאיות, נכון/לא נכון והשלמה.
 * שאלה פתוחה מחזירה null (ממתינה להערכה – AI או הערכה עצמית), לעולם לא "נכון" אוטומטי.
 */
export function gradeQuestion(q: Pick<ExamQuestion, "type" | "answerKey">, response: string): GradeResult {
  switch (q.type) {
    case "mcq":
    case "tf": {
      if (response === "") return { correct: false, points: 0 };
      const ok = response.trim() === q.answerKey.trim();
      return { correct: ok, points: ok ? 1 : 0 };
    }
    case "fill": {
      const ok = answersMatch(response, q.answerKey);
      return { correct: ok, points: ok ? 1 : 0 };
    }
    case "open":
      return { correct: null, points: null };
  }
}

export interface AttemptScore {
  scorePercent: number | null;
  gradedCount: number;
  pendingCount: number;
}

/** ציון באחוזים על השאלות שנבדקו בלבד. שאלות פתוחות ללא הערכה לא נספרות ומדווחות כממתינות. */
export function scoreAttempt(subs: Pick<AnswerSubmission, "points">[]): AttemptScore {
  const graded = subs.filter((s) => s.points !== null);
  const pending = subs.length - graded.length;
  if (graded.length === 0) return { scorePercent: null, gradedCount: 0, pendingCount: pending };
  const total = graded.reduce((acc, s) => acc + (s.points ?? 0), 0);
  return {
    scorePercent: Math.round((total / graded.length) * 100),
    gradedCount: graded.length,
    pendingCount: pending,
  };
}

export function scoreLabel(percent: number | null): string {
  if (percent === null) return "טרם נבדק";
  if (percent >= 90) return "מצוין";
  if (percent >= 75) return "טוב מאוד";
  if (percent >= 60) return "טוב";
  if (percent >= 45) return "דורש חיזוק";
  return "דורש תרגול נוסף";
}
