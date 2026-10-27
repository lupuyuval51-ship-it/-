import type { AppData, DateStr, PracticeResult } from "@/types";
import { addDays, dateToIsoDay, lastNDays, todayStr } from "@/lib/dates";
import { computeMastery, type Mastery } from "./mastery";
import { avg, pct, sum } from "@/lib/utils";

/** תאריכים בהם הייתה פעילות לימודית אמיתית (לצורך רצף ימים) */
export function activeDays(data: AppData): Set<DateStr> {
  const days = new Set<DateStr>();
  for (const s of data.studySessions) if (s.minutes >= 1) days.add(s.day);
  for (const r of data.flashcardReviews) days.add(dateToIsoDay(r.at));
  for (const a of data.examAttempts) if (a.finishedAt) days.add(dateToIsoDay(a.finishedAt));
  for (const h of data.homework) if (h.doneAt) days.add(dateToIsoDay(h.doneAt));
  for (const p of data.practiceResults) days.add(dateToIsoDay(p.at));
  for (const m of data.messages) if (m.role === "user") days.add(dateToIsoDay(m.createdAt));
  return days;
}

/**
 * רצף ימי לימוד עם סלחנות לימי מנוחה: יום ללא פעילות לא שובר את הרצף
 * כל עוד לא היה יום מנוחה סלחני נוסף ב-6 הימים שלפניו (עד יום מנוחה אחד בשבוע).
 * היום הנוכחי לא נספר כהפסד – עדיין יש זמן ללמוד.
 */
export function computeStreak(active: Set<DateStr>, today: DateStr = todayStr()): { current: number; best: number; todayDone: boolean } {
  const todayDone = active.has(today);
  const walk = (start: DateStr) => {
    let count = 0;
    let lastForgiven: DateStr | null = null;
    let day = start;
    for (let i = 0; i < 400; i++) {
      if (active.has(day)) {
        count++;
      } else {
        const canForgive =
          (lastForgiven === null || dayGap(day, lastForgiven) > 6) &&
          active.has(addDays(day, -1)) && // חייב להיות יום פעיל לפני יום המנוחה
          active.has(addDays(day, 1)); // ושאחריו (ולכן לא מסיימים ביום מנוחה)
        if (!canForgive) break;
        lastForgiven = day;
      }
      day = addDays(day, -1);
    }
    return count;
  };
  const current = todayDone ? walk(today) : active.has(addDays(today, -1)) ? walk(addDays(today, -1)) : 0;

  // רצף שיא: סריקה על כל הימים הפעילים
  let best = 0;
  for (const d of active) {
    if (!active.has(addDays(d, 1))) best = Math.max(best, walk(d));
  }
  return { current, best: Math.max(best, current), todayDone };
}

function dayGap(a: DateStr, b: DateStr): number {
  return Math.abs((new Date(a).getTime() - new Date(b).getTime()) / 86_400_000);
}

export function minutesByDay(data: AppData, days: DateStr[]): { day: DateStr; minutes: number }[] {
  const map = new Map<DateStr, number>();
  for (const s of data.studySessions) map.set(s.day, (map.get(s.day) ?? 0) + s.minutes);
  return days.map((day) => ({ day, minutes: Math.round(map.get(day) ?? 0) }));
}

export function studyMinutesLast(data: AppData, n: number, today: DateStr = todayStr()): number {
  return sum(minutesByDay(data, lastNDays(n, today)).map((d) => d.minutes));
}

export function studyMinutesToday(data: AppData, today: DateStr = todayStr()): number {
  return minutesByDay(data, [today])[0].minutes;
}

export function resultsFor(data: AppData, subjectId: string | null, topic?: string): PracticeResult[] {
  return data.practiceResults.filter(
    (r) => (subjectId === null || r.subjectId === subjectId) && (topic === undefined || r.topic === topic),
  );
}

export function subjectMastery(data: AppData, subjectId: string, now = new Date()): Mastery {
  return computeMastery(resultsFor(data, subjectId), now);
}

export interface TopicMastery {
  subjectId: string | null;
  topic: string;
  mastery: Mastery;
}

export function topicMasteries(data: AppData, now = new Date()): TopicMastery[] {
  const groups = new Map<string, PracticeResult[]>();
  for (const r of data.practiceResults) {
    if (!r.topic) continue;
    const key = `${r.subjectId ?? ""}::${r.topic}`;
    groups.set(key, [...(groups.get(key) ?? []), r]);
  }
  return [...groups.entries()].map(([key, list]) => ({
    subjectId: key.split("::")[0] || null,
    topic: key.split("::")[1],
    mastery: computeMastery(list, now),
  }));
}

export function strongAndWeak(data: AppData, now = new Date()) {
  const all = topicMasteries(data, now).filter((t) => t.mastery.percent !== null && t.mastery.attempts >= 3);
  return {
    strong: all.filter((t) => (t.mastery.percent ?? 0) >= 80).sort((a, b) => (b.mastery.percent ?? 0) - (a.mastery.percent ?? 0)),
    weak: all.filter((t) => (t.mastery.percent ?? 0) < 60).sort((a, b) => (a.mastery.percent ?? 0) - (b.mastery.percent ?? 0)),
  };
}

export function exercisesSolved(data: AppData): number {
  return sum(data.practiceResults.map((r) => r.total));
}

export function practiceAccuracy(data: AppData): number | null {
  const total = exercisesSolved(data);
  if (!total) return null;
  return pct(sum(data.practiceResults.map((r) => r.correct)), total);
}

export function averageSimulationScore(data: AppData): number | null {
  const scores = data.examAttempts.filter((a) => a.finishedAt && a.scorePercent !== null).map((a) => a.scorePercent as number);
  const v = avg(scores);
  return v === null ? null : Math.round(v);
}

export function weeklyGoalProgress(data: AppData, metric: "studyMinutesWeek" | "practiceWeek" | "cardsWeek", today: DateStr = todayStr()): number {
  const days = new Set(lastNDays(7, today));
  switch (metric) {
    case "studyMinutesWeek":
      return sum(data.studySessions.filter((s) => days.has(s.day)).map((s) => s.minutes));
    case "practiceWeek":
      return sum(data.practiceResults.filter((p) => days.has(dateToIsoDay(p.at))).map((p) => p.total));
    case "cardsWeek":
      return data.flashcardReviews.filter((r) => days.has(dateToIsoDay(r.at))).length;
  }
}
