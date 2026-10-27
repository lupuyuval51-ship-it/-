/**
 * קטלוג מקצועות ונושאים מוצעים. אלו הצעות התחלתיות בלבד ולא תוכנית לימודים רשמית –
 * התלמיד יכול להוסיף, לערוך ולמחוק נושאים בכל מקצוע.
 */

export interface SubjectTemplate {
  key: string;
  name: string;
  icon: string;
  color: SubjectColor;
  topics: string[];
}

export type SubjectColor = "violet" | "cyan" | "blue" | "emerald" | "amber" | "rose" | "orange" | "indigo" | "teal" | "pink";

export const SUBJECT_COLORS: Record<SubjectColor, { label: string; text: string; bg: string; ring: string; hex: string }> = {
  violet: { label: "סגול", text: "text-violet-600 dark:text-violet-300", bg: "bg-violet-500/12", ring: "ring-violet-500/30", hex: "#8b5cf6" },
  cyan: { label: "תכלת", text: "text-cyan-600 dark:text-cyan-300", bg: "bg-cyan-500/12", ring: "ring-cyan-500/30", hex: "#06b6d4" },
  blue: { label: "כחול", text: "text-blue-600 dark:text-blue-300", bg: "bg-blue-500/12", ring: "ring-blue-500/30", hex: "#3b82f6" },
  emerald: { label: "ירוק", text: "text-emerald-600 dark:text-emerald-300", bg: "bg-emerald-500/12", ring: "ring-emerald-500/30", hex: "#10b981" },
  amber: { label: "ענבר", text: "text-amber-600 dark:text-amber-300", bg: "bg-amber-500/12", ring: "ring-amber-500/30", hex: "#f59e0b" },
  rose: { label: "ורוד כהה", text: "text-rose-600 dark:text-rose-300", bg: "bg-rose-500/12", ring: "ring-rose-500/30", hex: "#f43f5e" },
  orange: { label: "כתום", text: "text-orange-600 dark:text-orange-300", bg: "bg-orange-500/12", ring: "ring-orange-500/30", hex: "#f97316" },
  indigo: { label: "אינדיגו", text: "text-indigo-600 dark:text-indigo-300", bg: "bg-indigo-500/12", ring: "ring-indigo-500/30", hex: "#6366f1" },
  teal: { label: "טורקיז", text: "text-teal-600 dark:text-teal-300", bg: "bg-teal-500/12", ring: "ring-teal-500/30", hex: "#14b8a6" },
  pink: { label: "ורוד", text: "text-pink-600 dark:text-pink-300", bg: "bg-pink-500/12", ring: "ring-pink-500/30", hex: "#ec4899" },
};

export function colorOf(color: string) {
  return SUBJECT_COLORS[color as SubjectColor] ?? SUBJECT_COLORS.violet;
}

export const SUBJECT_TEMPLATES: SubjectTemplate[] = [
  {
    key: "math", name: "מתמטיקה", icon: "Sigma", color: "violet",
    topics: ["משוואות ואי-שוויונות", "פונקציות לינאריות", "שברים ואחוזים", "גיאומטריה – משולשים ומרובעים", "פיתגורס", "בעיות מילוליות", "סטטיסטיקה והסתברות", "חזקות ושורשים"],
  },
  {
    key: "english", name: "אנגלית", icon: "Languages", color: "blue",
    topics: ["Grammar – Tenses", "Vocabulary", "Reading Comprehension", "Writing", "Conditionals", "Passive Voice"],
  },
  {
    key: "hebrew", name: "עברית", icon: "BookOpenText", color: "rose",
    topics: ["הבנת הנקרא", "כתיבה והבעה", "סוגות ספרותיות", "ניתוח סיפור", "ניתוח שיר"],
  },
  {
    key: "language", name: "לשון", icon: "SpellCheck", color: "pink",
    topics: ["חלקי דיבור", "בניינים וגזרות", "תחביר – נושא ונשוא", "הטיית פעלים", "סימני פיסוק"],
  },
  {
    key: "science", name: "מדעים", icon: "FlaskConical", color: "emerald",
    topics: ["מבנה החומר", "תאים ורקמות", "אנרגיה וכוחות", "מערכות בגוף האדם", "חשמל", "מערכות אקולוגיות"],
  },
  {
    key: "history", name: "היסטוריה", icon: "Landmark", color: "amber",
    topics: ["מהפכות במאה ה-18 וה-19", "התעשייה והחברה", "לאומיות והתעוררות לאומית", "ההגירה והעלייה", "מלחמת העולם הראשונה"],
  },
  {
    key: "geography", name: "גיאוגרפיה", icon: "Globe2", color: "teal",
    topics: ["מפות וקנה מידה", "אקלים", "אוכלוסייה והגירה", "עיור", "משאבי טבע"],
  },
  {
    key: "bible", name: 'תנ"ך', icon: "ScrollText", color: "orange",
    topics: ["ספר שמואל", "ספר מלכים", "ספר ירמיהו", "הנביאים", "ניתוח פרק"],
  },
];

export const GRADES = [
  { value: 7, label: "כיתה ז׳" },
  { value: 8, label: "כיתה ח׳" },
  { value: 9, label: "כיתה ט׳" },
  { value: 10, label: "כיתה י׳" },
  { value: 11, label: "כיתה י״א" },
  { value: 12, label: "כיתה י״ב" },
];

export function gradeLabel(grade: number): string {
  return GRADES.find((g) => g.value === grade)?.label ?? `כיתה ${grade}`;
}

export const GOALS: { value: "understand" | "homework" | "grades" | "exams"; label: string; description: string; icon: string }[] = [
  { value: "understand", label: "הבנת חומר", description: "להבין לעומק, לא רק לשנן", icon: "Lightbulb" },
  { value: "homework", label: "שיעורי בית", description: "עזרה בהכנת שיעורים בזמן", icon: "NotebookPen" },
  { value: "grades", label: "שיפור ציונים", description: "תרגול עקבי ומעקב התקדמות", icon: "TrendingUp" },
  { value: "exams", label: "הכנה למבחנים", description: "תוכנית חזרה וסימולציות", icon: "GraduationCap" },
];

export const DAILY_MINUTES_OPTIONS = [15, 30, 45, 60, 90];

export const ICON_CHOICES = [
  "Sigma", "Languages", "BookOpenText", "SpellCheck", "FlaskConical", "Landmark", "Globe2", "ScrollText",
  "Music", "Palette", "Code2", "Atom", "Dna", "Calculator", "Brain", "BookMarked",
];
