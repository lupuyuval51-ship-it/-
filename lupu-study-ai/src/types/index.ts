/**
 * טיפוסי הדומיין של LUPU Study AI.
 * כל המזהים הם UUID שנוצרים בצד הלקוח, כך שאותם אובייקטים מתאימים גם לאחסון מקומי וגם ל-Supabase.
 */

export type ID = string;
/** תאריך בפורמט YYYY-MM-DD (לפי אזור הזמן המקומי של המשתמש) */
export type DateStr = string;
/** חותמת זמן ISO-8601 */
export type IsoStr = string;

export type Goal = "understand" | "homework" | "grades" | "exams";
export type Difficulty = 1 | 2 | 3;
export type TutorMode = "explain" | "practice" | "exam";
export type ExplainLevel = "simple" | "standard" | "advanced";
export type Priority = "low" | "medium" | "high";

export interface Profile {
  id: ID;
  displayName: string;
  grade: number; // 7..12
  goals: Goal[];
  dailyMinutes: number;
  theme: "light" | "dark" | "system";
  onboarded: boolean;
  /** פרופיל קטין פרטי כברירת מחדל – אין פרופיל ציבורי ואין שיתוף בין תלמידים */
  isPrivate: true;
  createdAt: IsoStr;
}

export interface Subject {
  id: ID;
  /** מפתח למקצוע מובנה (math, english...) או undefined למקצוע אישי */
  key?: string;
  name: string;
  icon: string; // שם אייקון מ-lucide
  color: string; // מפתח צבע (violet, cyan...)
  custom: boolean;
  createdAt: IsoStr;
}

export interface Topic {
  id: ID;
  subjectId: ID;
  name: string;
  custom: boolean;
  createdAt: IsoStr;
}

export interface Homework {
  id: ID;
  subjectId: ID | null;
  title: string;
  description: string;
  dueDate: DateStr;
  priority: Priority;
  done: boolean;
  doneAt: IsoStr | null;
  attachmentIds: ID[];
  createdAt: IsoStr;
}

export interface Exam {
  id: ID;
  subjectId: ID;
  title: string;
  date: DateStr;
  topics: string[];
  materialIds: ID[];
  /** דקות לימוד זמינות ביום לצורך הכנה */
  minutesPerDay: number;
  createdAt: IsoStr;
}

export type QuestionType = "mcq" | "open" | "tf" | "fill";

export interface ExamQuestion {
  id: ID;
  /** שאלות יכולות להיות משויכות למבחן או לבנק שאלות של מקצוע */
  examId: ID | null;
  subjectId: ID;
  topic: string;
  type: QuestionType;
  prompt: string;
  options: string[]; // mcq בלבד
  /** mcq: אינדקס התשובה הנכונה כמחרוזת; tf: "true"|"false"; fill: תשובות מקובלות מופרדות ב-|; open: תשובה לדוגמה */
  answerKey: string;
  /** מחוון הערכה לשאלה פתוחה */
  rubric: string;
  explanation: string;
  difficulty: Difficulty;
  source: "manual" | "ai";
  createdAt: IsoStr;
}

export interface AiAssessment {
  /** 0..100 – הערכת AI בלבד, אינה ציון רשמי */
  score: number;
  feedback: string;
}

export interface AnswerSubmission {
  id: ID;
  attemptId: ID;
  questionId: ID;
  response: string;
  /** null = ממתין להערכה (שאלה פתוחה שלא הוערכה) */
  correct: boolean | null;
  /** 0..1 */
  points: number | null;
  assessment: AiAssessment | null;
  /** הערכה עצמית של התלמיד לשאלה פתוחה כשאין AI */
  selfAssessed: boolean;
}

export interface ExamAttempt {
  id: ID;
  examId: ID | null;
  subjectId: ID;
  title: string;
  questionIds: ID[];
  startedAt: IsoStr;
  finishedAt: IsoStr | null;
  timerSeconds: number | null;
  /** אחוז הציון על השאלות שנבדקו; null אם אין שאלות שנבדקו */
  scorePercent: number | null;
  gradedCount: number;
  pendingCount: number;
}

export type MaterialKind = "pdf" | "image" | "text";

export interface MaterialPage {
  page: number;
  text: string;
}

export interface StudyMaterial {
  id: ID;
  subjectId: ID | null;
  topic: string;
  title: string;
  kind: MaterialKind;
  mime: string;
  size: number;
  /** טקסט מחולץ / טקסט שהוקלד. לקבצי PDF מחולק לעמודים. */
  pages: MaterialPage[];
  extraction: "ok" | "none" | "pending" | "not_applicable";
  /** האם הקובץ המקורי שמור (IndexedDB / Supabase Storage) */
  hasBlob: boolean;
  createdAt: IsoStr;
}

export type SummaryKind = "short" | "detailed" | "bullets" | "keywords" | "examSheet" | "qa";

export interface StudyNote {
  id: ID;
  subjectId: ID | null;
  title: string;
  kind: SummaryKind | "manual";
  content: string; // Markdown (+LaTeX)
  materialIds: ID[];
  aiGenerated: boolean;
  createdAt: IsoStr;
  updatedAt: IsoStr;
}

export interface Flashcard {
  id: ID;
  subjectId: ID | null;
  topic: string;
  front: string;
  back: string;
  /** SM-2 מפושט */
  ease: number;
  intervalDays: number;
  due: DateStr;
  reps: number;
  lapses: number;
  attempts: number;
  successes: number;
  lastReviewedAt: IsoStr | null;
  source: "manual" | "ai";
  createdAt: IsoStr;
}

export interface FlashcardReview {
  id: ID;
  cardId: ID;
  known: boolean;
  at: IsoStr;
  intervalAfter: number;
}

export type EventKind = "exam" | "homework" | "project" | "review" | "session";

export interface CalendarEvent {
  id: ID;
  kind: EventKind;
  title: string;
  subjectId: ID | null;
  date: DateStr;
  startTime: string; // HH:mm או ""
  endTime: string;
  notes: string;
  /** מזהה ישות מקושרת (למשל מבחן שממנו נוצרה משימת חזרה) */
  refId: ID | null;
  done: boolean;
  createdAt: IsoStr;
}

export interface TimetableSlot {
  id: ID;
  weekday: number; // 0 = ראשון ... 6 = שבת
  startTime: string;
  endTime: string;
  subjectId: ID | null;
  label: string;
  room: string;
}

export interface StudySession {
  id: ID;
  subjectId: ID | null;
  startedAt: IsoStr;
  minutes: number;
  plannedMinutes: number;
  kind: "focus" | "manual";
  completed: boolean;
  /** תאריך מקומי YYYY-MM-DD – נשמר כדי להימנע מבעיות אזורי זמן בחישובי סטטיסטיקה */
  day: DateStr;
}

export interface PracticeResult {
  id: ID;
  subjectId: ID | null;
  topic: string;
  correct: number;
  total: number;
  difficulty: Difficulty;
  source: "exam" | "flashcards" | "tutor" | "scan";
  at: IsoStr;
}

export interface Conversation {
  id: ID;
  title: string;
  subjectId: ID | null;
  topic: string;
  mode: TutorMode;
  level: ExplainLevel;
  createdAt: IsoStr;
  updatedAt: IsoStr;
}

export interface Citation {
  materialId: ID;
  page: number | null;
}

export interface Message {
  id: ID;
  conversationId: ID;
  role: "user" | "assistant";
  content: string;
  imageIds: ID[];
  citations: Citation[];
  /** הודעת שגיאה במקום תשובה – לא נשלחת בחזרה למודל */
  isError: boolean;
  createdAt: IsoStr;
}

export interface SavedExercise {
  id: ID;
  subjectId: ID | null;
  questionText: string;
  detected: string;
  hint: string;
  steps: string[];
  finalAnswer: string;
  imageId: ID | null;
  createdAt: IsoStr;
}

export interface AchievementRecord {
  id: ID;
  key: string;
  unlockedAt: IsoStr;
}

export interface XpEvent {
  id: ID;
  /** מפתח ייחודי לפעולה – מונע צבירת XP כפולה על אותה פעולה */
  dedupeKey: string;
  amount: number;
  reason: string;
  at: IsoStr;
}

export interface PersonalGoal {
  id: ID;
  title: string;
  metric: "studyMinutesWeek" | "practiceWeek" | "cardsWeek";
  target: number;
  createdAt: IsoStr;
}

export interface Meta {
  schemaVersion: number;
  /** האם נתוני הדמו נטענו – מוצג בבירור במסך */
  demoLoaded: boolean;
  /** מזהי כל הרשומות שנוצרו כנתוני דמו – כדי שאפשר יהיה להסיר אותן בלחיצה */
  demoIds: ID[];
  /** מונה שימוש יומי של אורח בשירותי AI (לאכיפה מקומית בצד הלקוח, האכיפה האמיתית בשרת) */
  guestAiDay: DateStr;
  guestAiCount: number;
  /** שעה/יום בו התלמיד אישר תזכורות מערכת */
  notificationsEnabled: boolean;
}

/** כל המידע של המשתמש – מבנה האחסון המקומי */
export interface AppData {
  profile: Profile | null;
  subjects: Subject[];
  topics: Topic[];
  homework: Homework[];
  exams: Exam[];
  examQuestions: ExamQuestion[];
  examAttempts: ExamAttempt[];
  answerSubmissions: AnswerSubmission[];
  studyMaterials: StudyMaterial[];
  studyNotes: StudyNote[];
  flashcards: Flashcard[];
  flashcardReviews: FlashcardReview[];
  calendarEvents: CalendarEvent[];
  timetable: TimetableSlot[];
  studySessions: StudySession[];
  practiceResults: PracticeResult[];
  conversations: Conversation[];
  messages: Message[];
  savedExercises: SavedExercise[];
  achievements: AchievementRecord[];
  xpEvents: XpEvent[];
  personalGoals: PersonalGoal[];
  meta: Meta;
}

export type CollectionName = Exclude<keyof AppData, "profile" | "meta">;

export type CollectionItem<K extends CollectionName> = AppData[K][number];
