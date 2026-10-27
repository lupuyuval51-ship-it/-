import type { AppData, XpEvent } from "@/types";
import { uid, nowIso } from "@/lib/utils";
import { activeDays, computeStreak, exercisesSolved, topicMasteries } from "./stats";
import { sum } from "@/lib/utils";
import { todayStr } from "@/lib/dates";

/** רמה n דורשת 50·n·(n−1) XP מצטבר: 100, 300, 600, 1000 ... */
export function xpForLevel(level: number): number {
  return 50 * level * (level - 1);
}

export function levelFromXp(xp: number): { level: number; current: number; next: number; progress: number } {
  let level = 1;
  while (xpForLevel(level + 1) <= xp) level++;
  const base = xpForLevel(level);
  const next = xpForLevel(level + 1);
  return { level, current: xp - base, next: next - base, progress: (xp - base) / (next - base) };
}

export const XP = {
  homework: 15,
  summary: 5,
  flashcardEach: 1,
  flashcardDailyCap: 30,
  sessionPerTwoMinutes: 1,
  sessionCap: 60,
  attemptBase: 20,
  scan: 5,
  dailyGoal: 10,
} as const;

export interface XpAward {
  event: XpEvent;
}

/**
 * מעניק XP פעם אחת בלבד לכל dedupeKey. לחיצה חוזרת על אותה פעולה לא מוסיפה נקודות.
 * מחזיר null אם הפעולה כבר קיבלה נקודות או שהכמות אפסית.
 */
export function awardXp(
  existing: XpEvent[],
  dedupeKey: string,
  amount: number,
  reason: string,
  at: string = nowIso(),
): XpEvent | null {
  const amt = Math.floor(amount);
  if (amt <= 0) return null;
  if (existing.some((e) => e.dedupeKey === dedupeKey)) return null;
  return { id: uid(), dedupeKey, amount: amt, reason, at };
}

/** כמה XP של כרטיסיות נצבר היום (לצורך תקרה יומית נגד "חקלאות" נקודות) */
export function flashcardXpToday(events: XpEvent[], today = todayStr()): number {
  // היום מקודד במפתח הייחודי (card:{id}:{YYYY-MM-DD}), כך שהתקרה לא תלויה בשעון המכשיר בעת הכתיבה
  return sum(events.filter((e) => e.dedupeKey.startsWith("card:") && e.dedupeKey.endsWith(`:${today}`)).map((e) => e.amount));
}

export function totalXp(events: XpEvent[]): number {
  return sum(events.map((e) => e.amount));
}

export interface AchievementDef {
  key: string;
  title: string;
  description: string;
  icon: string;
  check: (ctx: AchievementContext) => boolean;
}

export interface AchievementContext {
  data: AppData;
  streak: number;
  xp: number;
  level: number;
  exercises: number;
  studyMinutes: number;
  homeworkDone: number;
  cardsReviewed: number;
  finishedAttempts: number;
  bestAttempt: number | null;
  strongTopics: number;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { key: "first_session", title: "מתחילים!", description: "השלמת מפגש לימוד ראשון", icon: "Rocket", check: (c) => c.data.studySessions.some((s) => s.kind === "focus") },
  { key: "focus_120", title: "שעתיים של ריכוז", description: "צברת 120 דקות לימוד", icon: "Timer", check: (c) => c.studyMinutes >= 120 },
  { key: "focus_600", title: "מרתוניסט", description: "צברת 10 שעות לימוד", icon: "Flame", check: (c) => c.studyMinutes >= 600 },
  { key: "streak_3", title: "שלושה ימים ברצף", description: "למדת 3 ימים ברצף", icon: "CalendarCheck", check: (c) => c.streak >= 3 },
  { key: "streak_7", title: "שבוע שלם", description: "רצף של 7 ימי לימוד", icon: "CalendarHeart", check: (c) => c.streak >= 7 },
  { key: "hw_5", title: "אחראי על השיעורים", description: "השלמת 5 שיעורי בית", icon: "CheckCheck", check: (c) => c.homeworkDone >= 5 },
  { key: "cards_50", title: "זיכרון חד", description: "סקרת 50 כרטיסיות", icon: "Layers", check: (c) => c.cardsReviewed >= 50 },
  { key: "exam_first", title: "סימולציה ראשונה", description: "השלמת סימולציית מבחן", icon: "ClipboardCheck", check: (c) => c.finishedAttempts >= 1 },
  { key: "exam_90", title: "ציון גבוה", description: "קיבלת 90% ומעלה בסימולציה", icon: "Trophy", check: (c) => (c.bestAttempt ?? 0) >= 90 },
  { key: "practice_50", title: "50 תרגילים", description: "פתרת 50 תרגילים", icon: "Target", check: (c) => c.exercises >= 50 },
  { key: "strong_topic", title: "שליטה בנושא", description: "הגעת ל-80% שליטה בנושא (לפחות 5 תרגילים)", icon: "Medal", check: (c) => c.strongTopics >= 1 },
  { key: "level_5", title: "רמה 5", description: "הגעת לרמה 5", icon: "Crown", check: (c) => c.level >= 5 },
  { key: "tutor_first", title: "שאלה ראשונה למורה", description: "שאלת את המורה AI", icon: "Sparkles", check: (c) => c.data.messages.some((m) => m.role === "user") },
];

export function buildAchievementContext(data: AppData, today = todayStr()): AchievementContext {
  const xp = totalXp(data.xpEvents);
  const streak = computeStreak(activeDays(data), today).current;
  const best = data.examAttempts
    .filter((a) => a.finishedAt && a.scorePercent !== null)
    .map((a) => a.scorePercent as number);
  return {
    data,
    streak,
    xp,
    level: levelFromXp(xp).level,
    exercises: exercisesSolved(data),
    studyMinutes: sum(data.studySessions.map((s) => s.minutes)),
    homeworkDone: data.homework.filter((h) => h.done).length,
    cardsReviewed: data.flashcardReviews.length,
    finishedAttempts: data.examAttempts.filter((a) => a.finishedAt).length,
    bestAttempt: best.length ? Math.max(...best) : null,
    strongTopics: topicMasteries(data).filter((t) => (t.mastery.percent ?? 0) >= 80 && t.mastery.attempts >= 5).length,
  };
}

/** מחזיר מפתחות הישגים שהתקבלו כעת ועדיין לא נשמרו */
export function newlyUnlocked(data: AppData, today = todayStr()): AchievementDef[] {
  const have = new Set(data.achievements.map((a) => a.key));
  const ctx = buildAchievementContext(data, today);
  return ACHIEVEMENTS.filter((a) => !have.has(a.key) && a.check(ctx));
}

