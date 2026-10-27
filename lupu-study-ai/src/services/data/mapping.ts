import type { AppData, CollectionName } from "@/types";

/** סדר הטבלאות חשוב להכנסה (מפתחות זרים). מחיקות מתבצעות בסדר הפוך. */
export const COLLECTIONS: { name: CollectionName; table: string }[] = [
  { name: "subjects", table: "subjects" },
  { name: "topics", table: "topics" },
  { name: "studyMaterials", table: "study_materials" },
  { name: "homework", table: "homework" },
  { name: "exams", table: "exams" },
  { name: "examQuestions", table: "exam_questions" },
  { name: "examAttempts", table: "exam_attempts" },
  { name: "answerSubmissions", table: "answer_submissions" },
  { name: "studyNotes", table: "study_notes" },
  { name: "flashcards", table: "flashcards" },
  { name: "flashcardReviews", table: "flashcard_reviews" },
  { name: "calendarEvents", table: "calendar_events" },
  { name: "timetable", table: "timetable_slots" },
  { name: "studySessions", table: "study_sessions" },
  { name: "practiceResults", table: "practice_results" },
  { name: "conversations", table: "ai_conversations" },
  { name: "messages", table: "ai_messages" },
  { name: "savedExercises", table: "saved_exercises" },
  { name: "achievements", table: "achievements" },
  { name: "xpEvents", table: "xp_events" },
  { name: "personalGoals", table: "personal_goals" },
];

const snake = (k: string) => k.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`);
const camel = (k: string) => k.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());

/** המרת אובייקט דומיין לשורת טבלה (מפתחות ברמה העליונה בלבד; jsonb נשמר כמות שהוא) */
export function toRow(item: object, userId: string): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(item)) {
    // undefined אינו נשלח; null נשלח כ-null
    if (v !== undefined) row[snake(k)] = v;
  }
  row.user_id = userId;
  return row;
}

export function fromRow<T>(row: Record<string, unknown>): T {
  const item: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    if (k === "user_id") continue;
    item[camel(k)] = v;
  }
  return item as T;
}

/** תאריך Postgres (date) מוחזר כ-YYYY-MM-DD; חותמות זמן כ-ISO עם אזור – מנרמלים לפורמט ISO אחיד */
export function normalizeRemote<T extends object>(item: T): T {
  const out: Record<string, unknown> = { ...(item as Record<string, unknown>) };
  for (const [k, v] of Object.entries(out)) {
    if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(\+00:00|Z)$/.test(v)) out[k] = new Date(v).toISOString();
    // numeric של Postgres מגיע לעיתים כמחרוזת
    if (typeof v === "string" && /^-?\d+(\.\d+)?$/.test(v) && ["ease", "minutes", "correct", "points", "scorePercent"].includes(k)) out[k] = Number(v);
    if (k === "size" && typeof v === "string") out[k] = Number(v);
  }
  return out as T;
}

export interface CollectionDiff<T> {
  upserts: T[];
  deletes: string[];
}

/** משווה הפניות לפי מזהה: פריטים חדשים/ששונו (הפניה שונה) להכנסה, ונעלמים למחיקה */
export function diffCollection<T extends { id: string }>(prev: T[], next: T[]): CollectionDiff<T> {
  if (prev === next) return { upserts: [], deletes: [] };
  const before = new Map(prev.map((x) => [x.id, x]));
  const after = new Set<string>();
  const upserts: T[] = [];
  for (const item of next) {
    after.add(item.id);
    if (before.get(item.id) !== item) upserts.push(item);
  }
  const deletes = prev.filter((x) => !after.has(x.id)).map((x) => x.id);
  return { upserts, deletes };
}

export function mergeById<T extends { id: string }>(local: T[], remote: T[]): T[] {
  const map = new Map(local.map((x) => [x.id, x]));
  for (const r of remote) map.set(r.id, r); // שרת מנצח בקונפליקט
  return [...map.values()];
}

export function totalRecords(d: AppData): number {
  return COLLECTIONS.reduce((n, c) => n + (d[c.name] as unknown[]).length, 0);
}
