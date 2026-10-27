import type { AppData, ExamQuestion, Flashcard, Homework, PracticeResult, StudySession, Exam, CalendarEvent, ID } from "@/types";
import { addDays, todayStr } from "@/lib/dates";
import { newCardSchedule } from "@/services/learning/spaced";
import { nowIso, uid } from "@/lib/utils";
import type { Out } from "./reducers";

/**
 * נתוני דוגמה לצורך היכרות עם המערכת. כל הרשומות מסומנות ב-meta.demoIds,
 * מוצג באנר "מצב דמו" כל עוד הן קיימות, ואפשר להסיר אותן בלחיצה אחת.
 * התוכן (שאלות ותשובות) נכון מתמטית, אך הפעילות וההתקדמות המדומות אינן פעילות אמיתית.
 */
export function loadDemoData(d: AppData, today: string = todayStr()): Out {
  if (d.meta.demoLoaded) return { data: d, rewards: [] };
  const math = d.subjects.find((s) => s.key === "math") ?? d.subjects[0];
  if (!math) return { data: d, rewards: [] };
  const english = d.subjects.find((s) => s.key === "english") ?? math;
  const ids: ID[] = [];
  const track = <T extends { id: ID }>(x: T): T => {
    ids.push(x.id);
    return x;
  };
  const createdAt = nowIso();

  const homework: Homework[] = [
    { subjectId: math.id, title: "תרגילי משוואות – עמ׳ 45", description: "תרגילים 1–8", dueDate: addDays(today, -1), priority: "high" as const },
    { subjectId: english.id, title: "Vocabulary – unit 6", description: "ללמוד 20 מילים", dueDate: today, priority: "medium" as const },
    { subjectId: math.id, title: "בעיות מילוליות", description: "", dueDate: addDays(today, 3), priority: "low" as const },
  ].map((h) => track({ ...h, id: uid(), done: false, doneAt: null, attachmentIds: [], createdAt }));

  const exam: Exam = track({
    id: uid(), subjectId: math.id, title: "מבחן במתמטיקה – שברים ואחוזים", date: addDays(today, 9),
    topics: ["שברים ואחוזים", "משוואות ואי-שוויונות", "פיתגורס"], materialIds: [], minutesPerDay: 30, createdAt,
  });
  const examEvent: CalendarEvent = track({
    id: uid(), kind: "exam", title: exam.title, subjectId: math.id, date: exam.date, startTime: "", endTime: "", notes: "", refId: exam.id, done: false, createdAt,
  });

  const q = (
    topic: string, type: ExamQuestion["type"], prompt: string, answerKey: string, explanation: string,
    options: string[] = [], difficulty: 1 | 2 | 3 = 2, rubric = "",
  ): ExamQuestion =>
    track({ id: uid(), examId: exam.id, subjectId: math.id, topic, type, prompt, options, answerKey, rubric, explanation, difficulty, source: "manual", createdAt });

  const questions: ExamQuestion[] = [
    q("שברים ואחוזים", "mcq", "כמה הם $25\\%$ מ-$80$?", "1", "25% = רבע. רבע מ-80 הוא 20.", ["10", "20", "25", "40"], 1),
    q("שברים ואחוזים", "fill", "השלם: $\\frac{3}{4}$ בכתיב עשרוני הוא ___", "0.75|0,75", "3 ÷ 4 = 0.75", [], 1),
    q("שברים ואחוזים", "tf", "הטענה: $\\frac{1}{3}$ גדול מ-$\\frac{1}{2}$", "false", "1/3 ≈ 0.33 ו-1/2 = 0.5, ולכן 1/3 קטן מ-1/2.", [], 2),
    q("משוואות ואי-שוויונות", "mcq", "מהו הפתרון של $3x + 5 = 20$?", "2", "3x = 15 ולכן x = 5.", ["$x = 3$", "$x = 4$", "$x = 5$", "$x = \\frac{25}{3}$"], 2),
    q("משוואות ואי-שוויונות", "fill", "פתור את המשוואה $2x - 6 = 10$. התשובה: $x =$ ___", "8", "2x = 16 ולכן x = 8.", [], 2),
    q("פיתגורס", "mcq", "במשולש ישר-זווית ניצבים באורך $3$ ו-$4$. מהו אורך היתר?", "2", "3² + 4² = 25, ולכן היתר הוא 5.", ["4", "6", "5", "7"], 2),
    q("פיתגורס", "tf", "במשולש ישר-זווית היתר הוא תמיד הצלע הארוכה ביותר.", "true", "היתר מול הזווית הגדולה ביותר (90°) ולכן הוא הארוך ביותר.", [], 1),
    q("בעיות מילוליות", "open", "מחיר חולצה לפני הנחה הוא 120 ₪. אחרי הנחה של 25% כמה היא עולה? הסבר את הפתרון.", "90 ₪", "25% מ-120 הם 30, ולכן המחיר 90 ₪.", [], 2,
      "תשובה נכונה: 90 ₪. מחוון: חישוב ההנחה (30 ₪) – 40%; חיסור מהמחיר המקורי – 40%; תשובה סופית ויחידות – 20%."),
  ];

  const cards: Flashcard[] = [
    ["שברים ואחוזים", "כיצד מחשבים אחוז ממספר?", "מכפילים את המספר באחוז ומחלקים ב-100."],
    ["שברים ואחוזים", "מהו 50% בשבר?", "1/2"],
    ["שברים ואחוזים", "מהו 3/5 באחוזים?", "60%"],
    ["פיתגורס", "מהי נוסחת משפט פיתגורס?", "a² + b² = c² כאשר c הוא היתר."],
    ["פיתגורס", "מהו היתר?", "הצלע שמול הזווית הישרה, והארוכה ביותר במשולש ישר-זווית."],
    ["משוואות ואי-שוויונות", "מה עושים כשמעבירים אגף במשוואה?", "משנים את הסימן של האיבר שעבר."],
    ["משוואות ואי-שוויונות", "מה קורה כשמכפילים אי-שוויון במספר שלילי?", "כיוון אי-השוויון מתהפך."],
    ["חזקות ושורשים", "כמה הוא 2⁵?", "32"],
  ].map(([topic, front, back]) => track({ id: uid(), subjectId: math.id, topic, front, back, ...newCardSchedule(today), lastReviewedAt: null, source: "manual" as const, createdAt }));

  // פעילות לימוד מדומה ב-8 הימים האחרונים (מתועדת כדמו)
  const minutesPlan = [25, 0, 30, 20, 0, 35, 25, 15];
  const sessions: StudySession[] = minutesPlan
    .map((minutes, i) => ({ minutes, day: addDays(today, -(minutesPlan.length - 1 - i) - 1) }))
    .filter((x) => x.minutes > 0)
    .map(({ minutes, day }) =>
      track({ id: uid(), subjectId: math.id, startedAt: new Date(`${day}T16:00:00`).toISOString(), minutes, plannedMinutes: minutes, kind: "focus" as const, completed: true, day }),
    );

  const pr = (topic: string, correct: number, total: number, daysAgo: number): PracticeResult =>
    track({ id: uid(), subjectId: math.id, topic, correct, total, difficulty: 2, source: "exam", at: new Date(`${addDays(today, -daysAgo)}T17:00:00`).toISOString() });
  const results = [
    pr("שברים ואחוזים", 6, 10, 6), pr("שברים ואחוזים", 5, 10, 3),
    pr("פיתגורס", 9, 10, 5), pr("פיתגורס", 10, 10, 2),
    pr("משוואות ואי-שוויונות", 7, 10, 4),
  ];

  return {
    rewards: [],
    data: {
      ...d,
      homework: [...d.homework, ...homework],
      exams: [...d.exams, exam],
      calendarEvents: [...d.calendarEvents, examEvent],
      examQuestions: [...d.examQuestions, ...questions],
      flashcards: [...d.flashcards, ...cards],
      studySessions: [...d.studySessions, ...sessions],
      practiceResults: [...d.practiceResults, ...results],
      meta: { ...d.meta, demoLoaded: true, demoIds: ids },
    },
  };
}

/** מסיר את כל הרשומות שנוצרו כנתוני דמו, ומשאיר נתונים אמיתיים של המשתמש */
export function removeDemoData(d: AppData): Out {
  if (!d.meta.demoLoaded) return { data: d, rewards: [] };
  const demo = new Set(d.meta.demoIds);
  const examIds = new Set(d.exams.filter((e) => demo.has(e.id)).map((e) => e.id));
  const keep = <T extends { id: ID }>(l: T[]) => l.filter((x) => !demo.has(x.id));
  return {
    rewards: [],
    data: {
      ...d,
      homework: keep(d.homework),
      exams: keep(d.exams),
      calendarEvents: d.calendarEvents.filter((e) => !demo.has(e.id) && !(e.refId && examIds.has(e.refId))),
      examQuestions: keep(d.examQuestions),
      flashcards: keep(d.flashcards),
      flashcardReviews: d.flashcardReviews.filter((r) => d.flashcards.some((c) => c.id === r.cardId && !demo.has(c.id))),
      studySessions: keep(d.studySessions),
      practiceResults: keep(d.practiceResults),
      meta: { ...d.meta, demoLoaded: false, demoIds: [] },
    },
  };
}
