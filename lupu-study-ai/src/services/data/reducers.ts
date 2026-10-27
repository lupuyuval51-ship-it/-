import type {
  AnswerSubmission, AppData, CalendarEvent, Conversation, DateStr, Difficulty, Exam, ExamAttempt, ExamQuestion,
  Flashcard, Goal, Homework, ID, Message, PersonalGoal, PracticeResult, Priority, SavedExercise, StudyMaterial,
  StudyNote, StudySession, Subject, TimetableSlot, Topic, XpEvent,
} from "@/types";
import { buildSubjects, emptyData } from "./defaults";
import { dateToIsoDay, todayStr } from "@/lib/dates";
import { nowIso, uid, clamp } from "@/lib/utils";
import {
  awardXp, flashcardXpToday, levelFromXp, newlyUnlocked, totalXp, XP,
} from "@/services/learning/gamification";
import { newCardSchedule, scheduleReview } from "@/services/learning/spaced";
import { scoreAttempt } from "@/services/learning/scoring";
import { buildExamPlan } from "@/services/learning/planner";
import { topicMasteries } from "@/services/learning/stats";

/** תגמול שמוצג למשתמש (טוסט/אנימציה) – נוצר רק על פעולה אמיתית ופעם אחת */
export interface Reward {
  kind: "xp" | "achievement" | "level";
  title: string;
  detail?: string;
  amount?: number;
}

export interface Out {
  data: AppData;
  rewards: Reward[];
}

const ok = (data: AppData, rewards: Reward[] = []): Out => ({ data, rewards });

export const upsertBy = <T extends { id: ID }>(list: T[], item: T): T[] =>
  list.some((x) => x.id === item.id) ? list.map((x) => (x.id === item.id ? item : x)) : [...list, item];

export const removeBy = <T extends { id: ID }>(list: T[], id: ID): T[] => list.filter((x) => x.id !== id);

/**
 * מעניק XP (פעם אחת לכל dedupeKey), בודק עליית רמה ופותח הישגים חדשים.
 * הפונקציה היחידה שמגדילה XP – כך אי אפשר לצבור נקודות בלחיצות חוזרות.
 */
export function grant(
  data: AppData,
  awards: { key: string; amount: number; reason: string }[],
  today: DateStr = todayStr(),
): Out {
  const before = levelFromXp(totalXp(data.xpEvents)).level;
  const events: XpEvent[] = [];
  const rewards: Reward[] = [];
  let xpEvents = data.xpEvents;
  for (const a of awards) {
    const ev = awardXp(xpEvents, a.key, a.amount, a.reason);
    if (ev) {
      events.push(ev);
      xpEvents = [...xpEvents, ev];
      rewards.push({ kind: "xp", title: `+${ev.amount} XP`, detail: a.reason, amount: ev.amount });
    }
  }
  let next: AppData = events.length ? { ...data, xpEvents } : data;
  const unlocked = newlyUnlocked(next, today);
  if (unlocked.length) {
    next = {
      ...next,
      achievements: [
        ...next.achievements,
        ...unlocked.map((u) => ({ id: uid(), key: u.key, unlockedAt: nowIso() })),
      ],
    };
    for (const u of unlocked) rewards.push({ kind: "achievement", title: `הישג חדש: ${u.title}`, detail: u.description });
  }
  const after = levelFromXp(totalXp(next.xpEvents)).level;
  if (after > before) rewards.push({ kind: "level", title: `עלית לרמה ${after}!`, detail: "כל הכבוד על ההתמדה" });
  return { data: next, rewards };
}

// ───────────────────────── פרופיל והקמה ─────────────────────────

export interface OnboardingInput {
  displayName: string;
  grade: number;
  subjectKeys: string[];
  goals: Goal[];
  dailyMinutes: number;
}

export function completeOnboarding(d: AppData, input: OnboardingInput): Out {
  const { subjects, topics } = buildSubjects(input.subjectKeys);
  return ok({
    ...d,
    profile: {
      id: d.profile?.id ?? uid(),
      displayName: input.displayName.trim().slice(0, 40),
      grade: input.grade,
      goals: input.goals,
      dailyMinutes: input.dailyMinutes,
      theme: d.profile?.theme ?? "system",
      onboarded: true,
      isPrivate: true,
      createdAt: d.profile?.createdAt ?? nowIso(),
    },
    // לא מוחקים מקצועות קיימים אם ההקמה נעשית שוב
    subjects: d.subjects.length ? d.subjects : subjects,
    topics: d.subjects.length ? d.topics : topics,
  });
}

export function updateProfile(d: AppData, patch: Partial<NonNullable<AppData["profile"]>>): Out {
  if (!d.profile) return ok(d);
  return ok({ ...d, profile: { ...d.profile, ...patch, isPrivate: true } });
}

// ───────────────────────── מקצועות ונושאים ─────────────────────────

export function addSubject(d: AppData, input: { name: string; icon: string; color: string }): Out {
  const s: Subject = {
    id: uid(), name: input.name.trim().slice(0, 40), icon: input.icon, color: input.color, custom: true, createdAt: nowIso(),
  };
  return ok({ ...d, subjects: [...d.subjects, s] });
}

export function updateSubject(d: AppData, id: ID, patch: Partial<Pick<Subject, "name" | "icon" | "color">>): Out {
  return ok({ ...d, subjects: d.subjects.map((s) => (s.id === id ? { ...s, ...patch, name: (patch.name ?? s.name).trim().slice(0, 40) } : s)) });
}

/** מחיקת מקצוע: נושאים, מבחנים ושאלות שלו נמחקים; שיעורי בית, חומרים וכרטיסיות נשארים ללא שיוך */
export function removeSubject(d: AppData, id: ID): Out {
  const examIds = new Set(d.exams.filter((e) => e.subjectId === id).map((e) => e.id));
  const attemptIds = new Set(d.examAttempts.filter((a) => a.subjectId === id || (a.examId && examIds.has(a.examId))).map((a) => a.id));
  return ok({
    ...d,
    subjects: removeBy(d.subjects, id),
    topics: d.topics.filter((t) => t.subjectId !== id),
    exams: d.exams.filter((e) => e.subjectId !== id),
    examQuestions: d.examQuestions.filter((q) => q.subjectId !== id),
    examAttempts: d.examAttempts.filter((a) => !attemptIds.has(a.id)),
    answerSubmissions: d.answerSubmissions.filter((s) => !attemptIds.has(s.attemptId)),
    calendarEvents: d.calendarEvents.filter((e) => !(e.refId && examIds.has(e.refId))),
    homework: d.homework.map((h) => (h.subjectId === id ? { ...h, subjectId: null } : h)),
    studyMaterials: d.studyMaterials.map((m) => (m.subjectId === id ? { ...m, subjectId: null } : m)),
    studyNotes: d.studyNotes.map((n) => (n.subjectId === id ? { ...n, subjectId: null } : n)),
    flashcards: d.flashcards.map((c) => (c.subjectId === id ? { ...c, subjectId: null } : c)),
    conversations: d.conversations.map((c) => (c.subjectId === id ? { ...c, subjectId: null } : c)),
    timetable: d.timetable.map((t) => (t.subjectId === id ? { ...t, subjectId: null } : t)),
    studySessions: d.studySessions.map((s) => (s.subjectId === id ? { ...s, subjectId: null } : s)),
    practiceResults: d.practiceResults.map((r) => (r.subjectId === id ? { ...r, subjectId: null } : r)),
    savedExercises: d.savedExercises.map((s) => (s.subjectId === id ? { ...s, subjectId: null } : s)),
  });
}

export function addTopic(d: AppData, subjectId: ID, name: string): Out {
  const n = name.trim().slice(0, 80);
  if (!n || d.topics.some((t) => t.subjectId === subjectId && t.name === n)) return ok(d);
  const t: Topic = { id: uid(), subjectId, name: n, custom: true, createdAt: nowIso() };
  return ok({ ...d, topics: [...d.topics, t] });
}

export function renameTopic(d: AppData, id: ID, name: string): Out {
  const n = name.trim().slice(0, 80);
  if (!n) return ok(d);
  return ok({ ...d, topics: d.topics.map((t) => (t.id === id ? { ...t, name: n } : t)) });
}

export function removeTopic(d: AppData, id: ID): Out {
  return ok({ ...d, topics: removeBy(d.topics, id) });
}

// ───────────────────────── שיעורי בית ─────────────────────────

export interface HomeworkInput {
  subjectId: ID | null;
  title: string;
  description: string;
  dueDate: DateStr;
  priority: Priority;
  attachmentIds?: ID[];
}

export function addHomework(d: AppData, input: HomeworkInput): Out {
  const h: Homework = {
    id: uid(), subjectId: input.subjectId, title: input.title.trim().slice(0, 120), description: input.description.trim().slice(0, 2000),
    dueDate: input.dueDate, priority: input.priority, done: false, doneAt: null, attachmentIds: input.attachmentIds ?? [], createdAt: nowIso(),
  };
  return ok({ ...d, homework: [...d.homework, h] });
}

export function updateHomework(d: AppData, id: ID, patch: Partial<HomeworkInput>): Out {
  return ok({ ...d, homework: d.homework.map((h) => (h.id === id ? { ...h, ...patch } : h)) });
}

/** סימון השלמה. XP ניתן פעם אחת בלבד לכל משימה, גם אם מסמנים ומבטלים שוב ושוב. */
export function setHomeworkDone(d: AppData, id: ID, done: boolean): Out {
  const hw = d.homework.find((h) => h.id === id);
  if (!hw || hw.done === done) return ok(d);
  const next = {
    ...d,
    homework: d.homework.map((h) => (h.id === id ? { ...h, done, doneAt: done ? nowIso() : null } : h)),
  };
  return done ? grant(next, [{ key: `hw:${id}`, amount: XP.homework, reason: "השלמת שיעורי בית" }]) : ok(next);
}

export function removeHomework(d: AppData, id: ID): Out {
  return ok({ ...d, homework: removeBy(d.homework, id) });
}

// ───────────────────────── מבחנים ─────────────────────────

export interface ExamInput {
  subjectId: ID;
  title: string;
  date: DateStr;
  topics: string[];
  materialIds: ID[];
  minutesPerDay: number;
}

const examEvent = (e: Exam): CalendarEvent => ({
  id: uid(), kind: "exam", title: e.title, subjectId: e.subjectId, date: e.date, startTime: "", endTime: "", notes: "",
  refId: e.id, done: false, createdAt: nowIso(),
});

export function addExam(d: AppData, input: ExamInput): Out {
  const exam: Exam = {
    id: uid(), subjectId: input.subjectId, title: input.title.trim().slice(0, 120), date: input.date,
    topics: input.topics.map((t) => t.trim()).filter(Boolean), materialIds: input.materialIds,
    minutesPerDay: clamp(input.minutesPerDay, 10, 300), createdAt: nowIso(),
  };
  return ok({ ...d, exams: [...d.exams, exam], calendarEvents: [...d.calendarEvents, examEvent(exam)] });
}

export function updateExam(d: AppData, id: ID, patch: Partial<ExamInput>): Out {
  const exams = d.exams.map((e) => (e.id === id ? { ...e, ...patch, topics: (patch.topics ?? e.topics).map((t) => t.trim()).filter(Boolean) } : e));
  const exam = exams.find((e) => e.id === id);
  if (!exam) return ok(d);
  return ok({
    ...d,
    exams,
    calendarEvents: d.calendarEvents.map((ev) =>
      ev.refId === id && ev.kind === "exam" ? { ...ev, title: exam.title, date: exam.date, subjectId: exam.subjectId } : ev,
    ),
  });
}

export function removeExam(d: AppData, id: ID): Out {
  const attemptIds = new Set(d.examAttempts.filter((a) => a.examId === id).map((a) => a.id));
  return ok({
    ...d,
    exams: removeBy(d.exams, id),
    examQuestions: d.examQuestions.filter((q) => q.examId !== id),
    examAttempts: d.examAttempts.filter((a) => !attemptIds.has(a.id)),
    answerSubmissions: d.answerSubmissions.filter((s) => !attemptIds.has(s.attemptId)),
    calendarEvents: d.calendarEvents.filter((e) => e.refId !== id),
  });
}

/** יוצר תוכנית חזרה יומית כאירועי יומן. מחליף משימות חזרה קודמות שטרם הושלמו. */
export function generatePlanEvents(d: AppData, examId: ID, today: DateStr = todayStr()): Out {
  const exam = d.exams.find((e) => e.id === examId);
  if (!exam) return ok(d);
  const weakTopics = topicMasteries(d)
    .filter((t) => t.subjectId === exam.subjectId && (t.mastery.percent ?? 100) < 60)
    .map((t) => t.topic);
  const items = buildExamPlan(exam, { today, weakTopics });
  const events: CalendarEvent[] = items.map((it) => ({
    id: uid(),
    kind: "review",
    title: it.activity === "review" || it.activity === "simulation" ? `${exam.title}: ${it.topic === "כל הנושאים" ? (it.activity === "review" ? "חזרה כללית" : "סימולציית מבחן") : it.topic}` : `${exam.title}: ${it.topic}`,
    subjectId: exam.subjectId,
    date: it.date,
    startTime: "",
    endTime: "",
    notes: `${it.minutes} דקות · ${it.activity === "learn" ? "לימוד" : it.activity === "practice" ? "תרגול" : it.activity === "review" ? "חזרה כללית" : "סימולציה"}`,
    refId: examId,
    done: false,
    createdAt: nowIso(),
  }));
  return ok({
    ...d,
    calendarEvents: [
      ...d.calendarEvents.filter((e) => !(e.refId === examId && e.kind === "review" && !e.done)),
      ...events,
    ],
  });
}

export type QuestionInput = Omit<ExamQuestion, "id" | "createdAt">;

export function addQuestions(d: AppData, inputs: QuestionInput[]): Out {
  const qs: ExamQuestion[] = inputs.map((q) => ({ ...q, id: uid(), createdAt: nowIso() }));
  return ok({ ...d, examQuestions: [...d.examQuestions, ...qs] });
}

export function updateQuestion(d: AppData, id: ID, patch: Partial<QuestionInput>): Out {
  return ok({ ...d, examQuestions: d.examQuestions.map((q) => (q.id === id ? { ...q, ...patch } : q)) });
}

export function removeQuestion(d: AppData, id: ID): Out {
  return ok({ ...d, examQuestions: removeBy(d.examQuestions, id) });
}

export interface FinishAttemptInput {
  attempt: ExamAttempt;
  submissions: AnswerSubmission[];
}

/** שומר ניסיון מבחן, מחשב תוצאות תרגול לפי נושא ומעניק XP פעם אחת לכל ניסיון */
export function finishAttempt(d: AppData, input: FinishAttemptInput): Out {
  const score = scoreAttempt(input.submissions);
  const attempt: ExamAttempt = {
    ...input.attempt,
    finishedAt: input.attempt.finishedAt ?? nowIso(),
    scorePercent: score.scorePercent,
    gradedCount: score.gradedCount,
    pendingCount: score.pendingCount,
  };
  const byTopic = new Map<string, { correct: number; total: number; difficulty: Difficulty }>();
  for (const sub of input.submissions) {
    if (sub.points === null) continue;
    const q = d.examQuestions.find((x) => x.id === sub.questionId);
    if (!q) continue;
    const g = byTopic.get(q.topic) ?? { correct: 0, total: 0, difficulty: q.difficulty };
    g.correct += sub.points;
    g.total += 1;
    byTopic.set(q.topic, g);
  }
  const results: PracticeResult[] = [...byTopic.entries()].map(([topic, g]) => ({
    id: uid(), subjectId: attempt.subjectId, topic, correct: Math.round(g.correct * 100) / 100, total: g.total,
    difficulty: g.difficulty, source: "exam", at: nowIso(),
  }));
  const base: AppData = {
    ...d,
    examAttempts: upsertBy(d.examAttempts, attempt),
    answerSubmissions: [...d.answerSubmissions.filter((s) => s.attemptId !== attempt.id), ...input.submissions],
    practiceResults: [...d.practiceResults, ...results],
  };
  const bonus = score.scorePercent === null ? 0 : Math.floor(score.scorePercent / 10);
  return grant(base, [{ key: `attempt:${attempt.id}`, amount: XP.attemptBase + bonus, reason: "השלמת סימולציית מבחן" }]);
}

export function updateSubmission(d: AppData, subId: ID, patch: Partial<AnswerSubmission>, attemptId: ID): Out {
  const answerSubmissions = d.answerSubmissions.map((s) => (s.id === subId ? { ...s, ...patch } : s));
  const subs = answerSubmissions.filter((s) => s.attemptId === attemptId);
  const score = scoreAttempt(subs);
  return ok({
    ...d,
    answerSubmissions,
    examAttempts: d.examAttempts.map((a) => (a.id === attemptId ? { ...a, scorePercent: score.scorePercent, gradedCount: score.gradedCount, pendingCount: score.pendingCount } : a)),
  });
}

export function removeAttempt(d: AppData, id: ID): Out {
  return ok({
    ...d,
    examAttempts: removeBy(d.examAttempts, id),
    answerSubmissions: d.answerSubmissions.filter((s) => s.attemptId !== id),
  });
}

// ───────────────────────── חומרים וסיכומים ─────────────────────────

export function addMaterial(d: AppData, m: StudyMaterial): Out {
  return ok({ ...d, studyMaterials: [...d.studyMaterials, m] });
}

export function updateMaterial(d: AppData, id: ID, patch: Partial<StudyMaterial>): Out {
  return ok({ ...d, studyMaterials: d.studyMaterials.map((m) => (m.id === id ? { ...m, ...patch } : m)) });
}

export function removeMaterial(d: AppData, id: ID): Out {
  return ok({
    ...d,
    studyMaterials: removeBy(d.studyMaterials, id),
    exams: d.exams.map((e) => ({ ...e, materialIds: e.materialIds.filter((x) => x !== id) })),
    studyNotes: d.studyNotes.map((n) => ({ ...n, materialIds: n.materialIds.filter((x) => x !== id) })),
  });
}

export type NoteInput = Omit<StudyNote, "id" | "createdAt" | "updatedAt">;

export function addNote(d: AppData, input: NoteInput): Out & { id: ID } {
  const note: StudyNote = { ...input, id: uid(), createdAt: nowIso(), updatedAt: nowIso() };
  const r = grant({ ...d, studyNotes: [...d.studyNotes, note] }, [{ key: `note:${note.id}`, amount: XP.summary, reason: "יצירת סיכום" }]);
  return { ...r, id: note.id };
}

export function updateNote(d: AppData, id: ID, patch: Partial<NoteInput>): Out {
  return ok({ ...d, studyNotes: d.studyNotes.map((n) => (n.id === id ? { ...n, ...patch, updatedAt: nowIso() } : n)) });
}

export function removeNote(d: AppData, id: ID): Out {
  return ok({ ...d, studyNotes: removeBy(d.studyNotes, id) });
}

// ───────────────────────── כרטיסיות ─────────────────────────

export interface CardInput {
  subjectId: ID | null;
  topic: string;
  front: string;
  back: string;
  source: "manual" | "ai";
}

export function addFlashcards(d: AppData, inputs: CardInput[], today: DateStr = todayStr()): Out {
  const cards: Flashcard[] = inputs
    .filter((i) => i.front.trim() && i.back.trim())
    .map((i) => ({
      id: uid(), subjectId: i.subjectId, topic: i.topic.trim(), front: i.front.trim().slice(0, 600), back: i.back.trim().slice(0, 1200),
      ...newCardSchedule(today), lastReviewedAt: null, source: i.source, createdAt: nowIso(),
    }));
  return ok({ ...d, flashcards: [...d.flashcards, ...cards] });
}

export function updateFlashcard(d: AppData, id: ID, patch: Partial<Pick<Flashcard, "front" | "back" | "topic" | "subjectId">>): Out {
  return ok({ ...d, flashcards: d.flashcards.map((c) => (c.id === id ? { ...c, ...patch } : c)) });
}

export function removeFlashcard(d: AppData, id: ID): Out {
  return ok({ ...d, flashcards: removeBy(d.flashcards, id), flashcardReviews: d.flashcardReviews.filter((r) => r.cardId !== id) });
}

/**
 * סקירת כרטיס: מעדכן את מועד החזרה הבא, שומר ניסיון, ומוסיף תוצאת תרגול.
 * XP: נקודה לכרטיס פעם ביום, עם תקרה יומית.
 */
export function reviewFlashcard(d: AppData, id: ID, known: boolean, today: DateStr = todayStr()): Out {
  const card = d.flashcards.find((c) => c.id === id);
  if (!card) return ok(d);
  const sched = scheduleReview(card, known, today);
  const at = nowIso();
  const next: AppData = {
    ...d,
    flashcards: d.flashcards.map((c) => (c.id === id ? { ...c, ...sched, lastReviewedAt: at } : c)),
    flashcardReviews: [...d.flashcardReviews, { id: uid(), cardId: id, known, at, intervalAfter: sched.intervalDays }],
    practiceResults: [
      ...d.practiceResults,
      { id: uid(), subjectId: card.subjectId, topic: card.topic, correct: known ? 1 : 0, total: 1, difficulty: 2, source: "flashcards", at },
    ],
  };
  const capLeft = XP.flashcardDailyCap - flashcardXpToday(next.xpEvents, today);
  const amount = known && capLeft > 0 ? Math.min(XP.flashcardEach, capLeft) : 0;
  return grant(next, [{ key: `card:${id}:${today}`, amount, reason: "חזרה על כרטיסייה" }], today);
}

// ───────────────────────── יומן ומערכת שעות ─────────────────────────

export type EventInput = Omit<CalendarEvent, "id" | "createdAt" | "done" | "refId"> & { refId?: ID | null };

export function addEvent(d: AppData, input: EventInput): Out {
  const ev: CalendarEvent = { ...input, title: input.title.trim().slice(0, 120), refId: input.refId ?? null, done: false, id: uid(), createdAt: nowIso() };
  return ok({ ...d, calendarEvents: [...d.calendarEvents, ev] });
}

export function updateEvent(d: AppData, id: ID, patch: Partial<CalendarEvent>): Out {
  return ok({ ...d, calendarEvents: d.calendarEvents.map((e) => (e.id === id ? { ...e, ...patch } : e)) });
}

export function removeEvent(d: AppData, id: ID): Out {
  return ok({ ...d, calendarEvents: removeBy(d.calendarEvents, id) });
}

export function setEventDone(d: AppData, id: ID, done: boolean): Out {
  const ev = d.calendarEvents.find((e) => e.id === id);
  if (!ev || ev.done === done) return ok(d);
  return ok({ ...d, calendarEvents: d.calendarEvents.map((e) => (e.id === id ? { ...e, done } : e)) });
}

export function upsertSlot(d: AppData, slot: Omit<TimetableSlot, "id"> & { id?: ID }): Out {
  const s: TimetableSlot = { ...slot, id: slot.id ?? uid() };
  return ok({ ...d, timetable: upsertBy(d.timetable, s) });
}

export function removeSlot(d: AppData, id: ID): Out {
  return ok({ ...d, timetable: removeBy(d.timetable, id) });
}

// ───────────────────────── מפגשי לימוד ─────────────────────────

export interface SessionInput {
  subjectId: ID | null;
  minutes: number;
  plannedMinutes: number;
  kind: "focus" | "manual";
  completed: boolean;
  startedAt?: string;
}

/** שומר זמן לימוד שהושלם בפועל. XP לפי דקות, עם תקרה למפגש, ופעם אחת לכל מפגש. */
export function recordSession(d: AppData, input: SessionInput): Out & { session: StudySession | null } {
  const minutes = Math.round(input.minutes * 10) / 10;
  if (minutes < 1) return { ...ok(d), session: null };
  const startedAt = input.startedAt ?? nowIso();
  const session: StudySession = {
    id: uid(), subjectId: input.subjectId, startedAt, minutes, plannedMinutes: input.plannedMinutes,
    kind: input.kind, completed: input.completed, day: dateToIsoDay(startedAt),
  };
  const base = { ...d, studySessions: [...d.studySessions, session] };
  // XP רק על ריכוז שנמדד בפועל בטיימר; זמן שהוזן ידנית נספר בסטטיסטיקה אבל לא מזכה בנקודות (מניעת "חקלאות" XP)
  const xp = input.kind === "focus" ? Math.min(XP.sessionCap, Math.floor(minutes / 2) * XP.sessionPerTwoMinutes) : 0;
  const r = grant(base, [{ key: `session:${session.id}`, amount: xp, reason: `${Math.round(minutes)} דקות לימוד` }]);
  return { ...r, session };
}

export function removeSession(d: AppData, id: ID): Out {
  return ok({ ...d, studySessions: removeBy(d.studySessions, id) });
}

// ───────────────────────── שיחות AI ─────────────────────────

export function addConversation(d: AppData, c: Conversation): Out {
  return ok({ ...d, conversations: [...d.conversations, c] });
}

export function updateConversation(d: AppData, id: ID, patch: Partial<Conversation>): Out {
  return ok({ ...d, conversations: d.conversations.map((c) => (c.id === id ? { ...c, ...patch } : c)) });
}

export function removeConversation(d: AppData, id: ID): Out {
  return ok({
    ...d,
    conversations: removeBy(d.conversations, id),
    messages: d.messages.filter((m) => m.conversationId !== id),
  });
}

export function addMessage(d: AppData, m: Message): Out {
  return ok({
    ...d,
    messages: upsertBy(d.messages, m),
    conversations: d.conversations.map((c) => (c.id === m.conversationId ? { ...c, updatedAt: nowIso() } : c)),
  });
}

export function removeMessage(d: AppData, id: ID): Out {
  return ok({ ...d, messages: removeBy(d.messages, id) });
}

/** מחיקת כל היסטוריית ה-AI (שיחות והודעות) */
export function clearAiHistory(d: AppData): Out {
  return ok({ ...d, conversations: [], messages: [] });
}

export function saveExercise(d: AppData, ex: Omit<SavedExercise, "id" | "createdAt">): Out {
  const saved: SavedExercise = { ...ex, id: uid(), createdAt: nowIso() };
  return grant({ ...d, savedExercises: [...d.savedExercises, saved] }, [{ key: `scan:${saved.id}`, amount: XP.scan, reason: "שמירת תרגיל" }]);
}

export function removeExercise(d: AppData, id: ID): Out {
  return ok({ ...d, savedExercises: removeBy(d.savedExercises, id) });
}

// ───────────────────────── יעדים והגדרות ─────────────────────────

export function addGoal(d: AppData, g: Omit<PersonalGoal, "id" | "createdAt">): Out {
  return ok({ ...d, personalGoals: [...d.personalGoals, { ...g, id: uid(), createdAt: nowIso() }] });
}

export function removeGoal(d: AppData, id: ID): Out {
  return ok({ ...d, personalGoals: removeBy(d.personalGoals, id) });
}

export function setNotifications(d: AppData, enabled: boolean): Out {
  return ok({ ...d, meta: { ...d.meta, notificationsEnabled: enabled } });
}

/** מחיקה מלאה של כל נתוני המשתמש במכשיר */
export function eraseAll(): Out {
  return ok(emptyData());
}

