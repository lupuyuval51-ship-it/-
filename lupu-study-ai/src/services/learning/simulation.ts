import type { AnswerSubmission, ExamAttempt, ExamQuestion, ID, QuestionType } from "@/types";
import { shuffle, uid } from "@/lib/utils";
import { gradeQuestion, scoreAttempt } from "./scoring";

export interface SimOptions {
  count: number;
  difficulties: (1 | 2 | 3)[];
  types: QuestionType[];
  topics?: string[];
  /** 0 = ללא טיימר */
  timerMinutes: number;
}

export function selectQuestions(pool: ExamQuestion[], opts: SimOptions, rnd: () => number = Math.random): ExamQuestion[] {
  const filtered = pool.filter(
    (q) => opts.difficulties.includes(q.difficulty) && opts.types.includes(q.type) && (!opts.topics?.length || opts.topics.includes(q.topic)),
  );
  return shuffle(filtered, rnd).slice(0, Math.max(1, opts.count));
}

/** מצב מבחן בתהליך – נשמר ב-localStorage כדי לשרוד רענון, ולא מזהם את הנתונים עד ההגשה */
export interface RunState {
  attemptId: ID;
  examId: ID | null;
  subjectId: ID;
  title: string;
  questionIds: ID[];
  /** אפשרויות מעורבבות לכל שאלה אמריקאית (אינדקסים מקוריים לפי הסדר המוצג) */
  optionOrder: Record<ID, number[]>;
  answers: Record<ID, string>;
  flagged: ID[];
  current: number;
  startedAt: string;
  /** חותמת זמן (ms) לסיום, או null */
  deadline: number | null;
  timerSeconds: number | null;
}

export function createRun(args: { examId: ID | null; subjectId: ID; title: string; questions: ExamQuestion[]; timerMinutes: number; now?: number }): RunState {
  const now = args.now ?? Date.now();
  const optionOrder: Record<ID, number[]> = {};
  for (const q of args.questions) if (q.type === "mcq") optionOrder[q.id] = shuffle(q.options.map((_, i) => i));
  return {
    attemptId: uid(),
    examId: args.examId,
    subjectId: args.subjectId,
    title: args.title,
    questionIds: args.questions.map((q) => q.id),
    optionOrder,
    answers: {},
    flagged: [],
    current: 0,
    startedAt: new Date(now).toISOString(),
    deadline: args.timerMinutes > 0 ? now + args.timerMinutes * 60_000 : null,
    timerSeconds: args.timerMinutes > 0 ? args.timerMinutes * 60 : null,
  };
}

/**
 * בדיקת המבחן. תשובה אמריקאית נשמרת כאינדקס שהוצג (אחרי ערבוב) ולכן ממירים אותה לאינדקס המקורי לפני ההשוואה למפתח.
 * שאלות פתוחות נשארות ממתינות (points = null).
 */
export function gradeRun(run: RunState, questions: ExamQuestion[]): { attempt: ExamAttempt; submissions: AnswerSubmission[] } {
  const byId = new Map(questions.map((q) => [q.id, q]));
  const submissions: AnswerSubmission[] = [];
  for (const qid of run.questionIds) {
    const q = byId.get(qid);
    if (!q) continue;
    const response = run.answers[qid] ?? "";
    let normalized = response;
    if (q.type === "mcq" && response !== "") {
      const original = run.optionOrder[qid]?.[Number(response)];
      normalized = original === undefined ? "" : String(original);
    }
    const g = gradeQuestion(q, normalized);
    submissions.push({
      id: uid(), attemptId: run.attemptId, questionId: qid,
      // שומרים את התשובה כמו שהוצגה לתלמיד (אינדקס מקורי) כדי שהסקירה תהיה עקבית
      response: q.type === "mcq" ? normalized : response,
      correct: g.correct, points: g.points, assessment: null, selfAssessed: false,
    });
  }
  const score = scoreAttempt(submissions);
  return {
    submissions,
    attempt: {
      id: run.attemptId, examId: run.examId, subjectId: run.subjectId, title: run.title, questionIds: run.questionIds,
      startedAt: run.startedAt, finishedAt: new Date().toISOString(), timerSeconds: run.timerSeconds,
      scorePercent: score.scorePercent, gradedCount: score.gradedCount, pendingCount: score.pendingCount,
    },
  };
}

const KEY = (id: string) => `lupu:run:${id}`;

export function saveRun(run: RunState) {
  try {
    localStorage.setItem(KEY(run.attemptId), JSON.stringify(run));
  } catch {
    /* אחסון מלא – ממשיכים בלי שמירה */
  }
}

export function loadRun(id: string): RunState | null {
  try {
    const raw = localStorage.getItem(KEY(id));
    return raw ? (JSON.parse(raw) as RunState) : null;
  } catch {
    return null;
  }
}

export function clearRun(id: string) {
  try {
    localStorage.removeItem(KEY(id));
  } catch {
    /* מתעלמים */
  }
}

export interface Recommendation {
  topic: string;
  percent: number;
  correct: number;
  total: number;
}

/** המלצות לתרגול נוסף: נושאים בהם הציון בסימולציה נמוך מ-70% */
export function recommendFromAttempt(questions: ExamQuestion[], submissions: AnswerSubmission[]): Recommendation[] {
  const byTopic = new Map<string, { correct: number; total: number }>();
  for (const s of submissions) {
    if (s.points === null) continue;
    const q = questions.find((x) => x.id === s.questionId);
    if (!q) continue;
    const g = byTopic.get(q.topic) ?? { correct: 0, total: 0 };
    g.correct += s.points;
    g.total += 1;
    byTopic.set(q.topic, g);
  }
  return [...byTopic.entries()]
    .map(([topic, g]) => ({ topic, correct: g.correct, total: g.total, percent: Math.round((g.correct / g.total) * 100) }))
    .filter((r) => r.percent < 70)
    .sort((a, b) => a.percent - b.percent);
}
