import type { AppData, Subject, Topic } from "@/types";
import { SUBJECT_TEMPLATES } from "@/lib/catalog";
import { nowIso, uid } from "@/lib/utils";

export const SCHEMA_VERSION = 1;

export function emptyData(): AppData {
  return {
    profile: null,
    subjects: [],
    topics: [],
    homework: [],
    exams: [],
    examQuestions: [],
    examAttempts: [],
    answerSubmissions: [],
    studyMaterials: [],
    studyNotes: [],
    flashcards: [],
    flashcardReviews: [],
    calendarEvents: [],
    timetable: [],
    studySessions: [],
    practiceResults: [],
    conversations: [],
    messages: [],
    savedExercises: [],
    achievements: [],
    xpEvents: [],
    personalGoals: [],
    meta: {
      schemaVersion: SCHEMA_VERSION,
      demoLoaded: false,
      demoIds: [],
      guestAiDay: "",
      guestAiCount: 0,
      notificationsEnabled: false,
    },
  };
}

/** יוצר מקצועות ונושאים מוצעים עבור מפתחות המקצועות שנבחרו בהקמה */
export function buildSubjects(keys: string[]): { subjects: Subject[]; topics: Topic[] } {
  const subjects: Subject[] = [];
  const topics: Topic[] = [];
  const createdAt = nowIso();
  for (const tpl of SUBJECT_TEMPLATES.filter((t) => keys.includes(t.key))) {
    const id = uid();
    subjects.push({ id, key: tpl.key, name: tpl.name, icon: tpl.icon, color: tpl.color, custom: false, createdAt });
    for (const name of tpl.topics) topics.push({ id: uid(), subjectId: id, name, custom: false, createdAt });
  }
  return { subjects, topics };
}

/** משלים שדות חסרים מנתונים שמורים מגרסה ישנה או פגומה, בלי לזרוק שגיאה */
export function normalizeData(raw: unknown): AppData {
  const base = emptyData();
  if (!raw || typeof raw !== "object") return base;
  const src = raw as Record<string, unknown>;
  const out: Record<string, unknown> = { ...base };
  for (const key of Object.keys(base)) {
    if (key === "profile") {
      out.profile = src.profile && typeof src.profile === "object" ? src.profile : null;
    } else if (key === "meta") {
      out.meta = { ...base.meta, ...(typeof src.meta === "object" && src.meta ? (src.meta as object) : {}) };
    } else if (Array.isArray(src[key])) {
      out[key] = src[key];
    }
  }
  return out as unknown as AppData;
}
