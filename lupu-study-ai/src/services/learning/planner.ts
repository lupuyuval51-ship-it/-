import type { AppData, DateStr, Exam } from "@/types";
import { addDays, diffDays, todayStr, weekday } from "@/lib/dates";
import { strongAndWeak, studyMinutesToday, activeDays, computeStreak } from "./stats";
import { dueCards } from "./spaced";

export type PlanActivity = "learn" | "practice" | "review" | "simulation";

export interface PlanItem {
  date: DateStr;
  topic: string;
  minutes: number;
  activity: PlanActivity;
}

export const ACTIVITY_LABEL: Record<PlanActivity, string> = {
  learn: "לימוד הנושא",
  practice: "תרגול",
  review: "חזרה כללית",
  simulation: "סימולציית מבחן",
};

export interface PlanOptions {
  today?: DateStr;
  /** נושאים חלשים – יקבלו תרגול נוסף */
  weakTopics?: string[];
  /** ימי מנוחה בשבוע (0=ראשון). ברירת מחדל: שבת, ורק אם נשארים מספיק ימים */
  restWeekdays?: number[];
}

/**
 * תוכנית חזרה יומית עד המבחן:
 *  1. לימוד כל נושא, 2. תרגול כל נושא (נושאים חלשים פעמיים), 3. יומיים לפני – סימולציה, ערב המבחן – חזרה כללית.
 * ימי מנוחה מדולגים רק אם נשארים מספיק ימים לכל הנושאים.
 */
export function buildExamPlan(exam: Pick<Exam, "date" | "topics" | "minutesPerDay">, opts: PlanOptions = {}): PlanItem[] {
  const today = opts.today ?? todayStr();
  const topics = exam.topics.map((t) => t.trim()).filter(Boolean);
  const daysUntil = diffDays(today, exam.date);
  if (daysUntil <= 0 || topics.length === 0) return [];

  const allDays: DateStr[] = Array.from({ length: Math.min(daysUntil, 60) }, (_, i) => addDays(today, i));
  const rest = new Set(opts.restWeekdays ?? [6]);
  const minTarget = topics.length * 2 + 2;
  const workable = allDays.filter((d) => !rest.has(weekday(d)));
  const days = workable.length >= Math.min(minTarget, allDays.length) ? workable : allDays;

  const plan: PlanItem[] = [];
  const minutes = Math.max(10, exam.minutesPerDay);

  // ימים אחרונים שמורים לסימולציה וחזרה כללית
  const lastDay = days[days.length - 1];
  const reserved = new Set<DateStr>();
  if (days.length >= 2) {
    plan.push({ date: lastDay, topic: "כל הנושאים", minutes, activity: "review" });
    reserved.add(lastDay);
  }
  if (days.length >= 4) {
    const simDay = days[days.length - 2];
    plan.push({ date: simDay, topic: "כל הנושאים", minutes, activity: "simulation" });
    reserved.add(simDay);
  }

  const free = days.filter((d) => !reserved.has(d));
  const weak = new Set((opts.weakTopics ?? []).map((t) => t.trim()));
  const queue: { topic: string; activity: PlanActivity }[] = [
    ...topics.map((topic) => ({ topic, activity: "learn" as const })),
    ...topics.map((topic) => ({ topic, activity: "practice" as const })),
    ...topics.filter((t) => weak.has(t)).map((topic) => ({ topic, activity: "practice" as const })),
  ];

  if (free.length === 0) return plan.sort((a, b) => a.date.localeCompare(b.date));

  // חלוקה שווה של התור על הימים הפנויים, תוך שמירה על הסדר (לימוד לפני תרגול)
  const perDay = Math.ceil(queue.length / free.length);
  free.forEach((date, i) => {
    const slice = queue.slice(i * perDay, (i + 1) * perDay);
    if (slice.length === 0) return;
    const each = Math.max(5, Math.round(minutes / slice.length));
    for (const s of slice) plan.push({ date, topic: s.topic, minutes: each, activity: s.activity });
  });
  return plan.sort((a, b) => a.date.localeCompare(b.date));
}

export interface Suggestion {
  id: string;
  title: string;
  /** מדוע המערכת ממליצה על זה – מוצג למשתמש */
  reason: string;
  href: string;
  tone: "urgent" | "normal" | "gentle";
}

/** מנוע ההמלצות היומי. כל המלצה מגיעה עם נימוק והתבססות על נתוני המשתמש בלבד. */
export function buildSuggestions(data: AppData, today: DateStr = todayStr(), now = new Date()): Suggestion[] {
  const out: Suggestion[] = [];
  const subjectName = (id: string | null) => data.subjects.find((s) => s.id === id)?.name ?? "";

  const overdue = data.homework.filter((h) => !h.done && h.dueDate < today);
  if (overdue.length) {
    out.push({
      id: "overdue",
      title: `${overdue.length} שיעורי בית באיחור`,
      reason: "משימות שעבר מועד ההגשה שלהן. כדאי לטפל בהן ראשונות.",
      href: "/homework",
      tone: "urgent",
    });
  }
  const soon = data.homework.filter((h) => !h.done && h.dueDate >= today && diffDays(today, h.dueDate) <= 1);
  if (soon.length) {
    out.push({
      id: "hw-soon",
      title: `${soon.length} שיעורי בית להיום או למחר`,
      reason: "מועד ההגשה קרוב מאוד.",
      href: "/homework",
      tone: "urgent",
    });
  }

  const upcoming = data.exams
    .filter((e) => e.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 2);
  for (const e of upcoming) {
    const left = diffDays(today, e.date);
    if (left > 14) continue;
    const todays = data.calendarEvents.filter((ev) => ev.refId === e.id && ev.kind === "review" && ev.date === today && !ev.done);
    out.push({
      id: `exam-${e.id}`,
      title: todays.length ? `חזרה להיום: ${todays[0].title}` : `${e.title} בעוד ${left} ימים`,
      reason: todays.length
        ? `מתוך תוכנית ההכנה ל${e.title}.`
        : `מבחן ב${subjectName(e.subjectId)} מתקרב. אפשר ליצור תוכנית חזרה יומית.`,
      href: todays.length ? "/exams" : `/exams/${e.id}`,
      tone: left <= 3 ? "urgent" : "normal",
    });
  }

  const due = dueCards(data.flashcards, today);
  if (due.length) {
    out.push({
      id: "cards",
      title: `${due.length} כרטיסיות מחכות לחזרה`,
      reason: "חזרה מרווחת בזמן הנכון מחזקת את הזיכרון לטווח ארוך.",
      href: "/flashcards",
      tone: "normal",
    });
  }

  const { weak } = strongAndWeak(data, now);
  for (const w of weak.slice(0, 2)) {
    out.push({
      id: `weak-${w.topic}`,
      title: `תרגול ב"${w.topic}"`,
      reason: `שיעור ההצלחה המשוער בנושא הוא ${w.mastery.percent}% (מתוך ${w.mastery.attempts} תרגילים). מומלץ להתחיל בהסבר ואז לתרגל שאלות קלות.`,
      href: `/tutor?mode=explain&subject=${w.subjectId ?? ""}&topic=${encodeURIComponent(w.topic)}`,
      tone: "normal",
    });
  }

  if (studyMinutesToday(data, today) === 0 && data.profile) {
    const streak = computeStreak(activeDays(data), today);
    out.push({
      id: "focus",
      title: `מפגש ריכוז של ${Math.min(data.profile.dailyMinutes, 25)} דקות`,
      reason: streak.current >= 2 ? `יש לך רצף של ${streak.current} ימים. מפגש קצר ישמור עליו.` : "עוד לא למדת היום. התחלה קטנה עדיפה על לא להתחיל.",
      href: "/focus",
      tone: "gentle",
    });
  }
  return out;
}


export interface StudyBlock {
  id: string;
  date: DateStr;
  title: string;
  minutes: number;
  subjectId: string | null;
  /** מדוע המערכת מציעה את המפגש הזה */
  reason: string;
}

/** עומס יומי: שיעורי בית פתוחים שמועדם ביום, אירועי יומן, וחזרות מתוכננות */
export function dayLoad(data: AppData, day: DateStr): number {
  const hw = data.homework.filter((h) => !h.done && h.dueDate === day).length;
  const ev = data.calendarEvents.filter((e) => e.date === day && !e.done && e.kind !== "exam").length;
  const sessions = data.studySessions.filter((s) => s.day === day).reduce((a, s) => a + s.minutes, 0);
  return hw * 2 + ev + Math.floor(sessions / 30);
}

/**
 * מנוע תכנון: מציע מפגשי לימוד ל-7 הימים הקרובים לפי מבחנים קרובים (בלי תוכנית), נושאים חלשים והתקדמות בפועל,
 * ומשבץ כל מפגש ביום הכי פנוי (עומס נמוך, בלי שבת) כדי לא להעמיס. כל הצעה מגיעה עם נימוק.
 */
export function planStudyBlocks(data: AppData, today: DateStr = todayStr(), now = new Date()): StudyBlock[] {
  const minutes = Math.min(45, Math.max(15, data.profile?.dailyMinutes ?? 30));
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i)).filter((d) => weekday(d) !== 6);
  const load = new Map(days.map((d) => [d, dayLoad(data, d)]));
  const blocks: StudyBlock[] = [];
  const pick = (before?: DateStr) => {
    const options = days.filter((d) => !before || d < before).sort((a, b) => (load.get(a)! - load.get(b)!) || a.localeCompare(b));
    const day = options[0] ?? days[0];
    load.set(day, (load.get(day) ?? 0) + 1);
    return day;
  };
  const exists = (title: string) => data.calendarEvents.some((e) => e.kind === "session" && e.title === title && e.date >= today);

  for (const e of data.exams.filter((x) => x.date > today && diffDays(today, x.date) <= 14).sort((a, b) => a.date.localeCompare(b.date))) {
    const hasPlan = data.calendarEvents.some((ev) => ev.refId === e.id && ev.kind === "review");
    if (hasPlan) continue;
    const title = `הכנה: ${e.title}`;
    if (exists(title)) continue;
    blocks.push({ id: `exam-${e.id}`, date: pick(e.date), title, minutes, subjectId: e.subjectId, reason: `המבחן בעוד ${diffDays(today, e.date)} ימים ועדיין אין תוכנית חזרה.` });
  }
  for (const w of strongAndWeak(data, now).weak.slice(0, 3)) {
    const title = `חיזוק: ${w.topic}`;
    if (exists(title)) continue;
    blocks.push({ id: `weak-${w.topic}`, date: pick(), title, minutes: Math.min(minutes, 25), subjectId: w.subjectId, reason: `שיעור ההצלחה המשוער בנושא הוא ${w.mastery.percent}% (מתוך ${w.mastery.attempts} תרגילים).` });
  }
  const dueCardsCount = dueCards(data.flashcards, today).length;
  if (dueCardsCount >= 5 && !exists("חזרה על כרטיסיות")) {
    blocks.push({ id: "cards", date: pick(), title: "חזרה על כרטיסיות", minutes: 10, subjectId: null, reason: `${dueCardsCount} כרטיסיות מחכות לחזרה.` });
  }
  return blocks.sort((a, b) => a.date.localeCompare(b.date));
}
