/**
 * Rule-based fallbacks used when Claude is unavailable (no key, error, timeout, refusal, invalid output).
 * Every sentence is built from the supplied numbers only – nothing is invented.
 */
import type { CoachContext, CompletedSession, ExerciseResult, Locale, MetricKey, Skill } from "@/lib/types";
import { SKILL_LABELS } from "@/engine/phaseTemplates";
import type { AnalyzeSessionResponse, GeneratePlanResponse, ReplaceExerciseCandidate, ReplaceExerciseResponse, WeeklyAdjustment, WeeklyReviewResponse } from "@/lib/serverTypes";

export const FALLBACK_NOTICE: Record<Locale, string> = {
  he: "המאמן החכם אינו זמין כרגע, לכן הכנו לך אימון מתאים מתוך ספריית האימונים. כל ההתקדמות שלך תמשיך להישמר.",
  en: "The AI coach isn't available right now, so we prepared a suitable workout for you from the training library. All your progress keeps being saved.",
};

export const RATE_LIMIT_MESSAGE: Record<Locale, string> = {
  he: "המאמן החכם עמוס כרגע, נסו שוב בעוד כמה דקות. האימון שלכם ממשיך כרגיל.",
  en: "The AI coach is busy right now – try again in a few minutes. Your training continues as usual.",
};

function pct(n: number | undefined): string | null {
  return typeof n === "number" && Number.isFinite(n) ? `${Math.round(n)}%` : null;
}

function skillLabel(skill: Skill, locale: Locale): string {
  return SKILL_LABELS[skill]?.[locale] ?? skill;
}

function cap(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`;
}

/* ------------------------------------------------------------------ */
/* Analyze session                                                     */
/* ------------------------------------------------------------------ */

export function analyzeSessionFallback(session: CompletedSession, results: ExerciseResult[], previous: CompletedSession | undefined, locale: Locale): Omit<AnalyzeSessionResponse, "ok"> {
  const he = locale === "he";
  const parts: string[] = [];
  const focus: string[] = [];
  const minutes = Math.round(session.actualMinutes || 0);
  const done = session.exercisesCompleted;
  const total = session.exercisesCount;

  parts.push(
    he
      ? `סיימת אימון של ${minutes} דקות עם ${done} מתוך ${total} תרגילים${session.throws ? `, ${session.throws} זריקות` : ""}${session.catches ? ` ו-${session.catches} תפיסות` : ""}.`
      : `You finished a ${minutes}-minute session with ${done} of ${total} drills${session.throws ? `, ${session.throws} throws` : ""}${session.catches ? ` and ${session.catches} catches` : ""}.`,
  );

  const acc = pct(session.accuracyPct);
  const bh = pct(session.backhandAccuracy);
  const fh = pct(session.forehandAccuracy);
  const hm = pct(session.hammerAccuracy);
  const accBits: string[] = [];
  if (acc) accBits.push(he ? `דיוק כללי ${acc}` : `overall accuracy ${acc}`);
  if (bh) accBits.push(`Backhand ${bh}`);
  if (fh) accBits.push(`Forehand ${fh}`);
  if (hm) accBits.push(`Hammer ${hm}`);
  if (accBits.length) parts.push(he ? `${accBits.join(", ")}.` : `${accBits.join(", ")}.`);

  if (previous) {
    const deltas: string[] = [];
    if (typeof session.accuracyPct === "number" && typeof previous.accuracyPct === "number") {
      const d = Math.round(session.accuracyPct - previous.accuracyPct);
      if (d !== 0) deltas.push(he ? `דיוק ${d > 0 ? "עלה" : "ירד"} ב-${Math.abs(d)} נקודות לעומת האימון הקודם` : `accuracy ${d > 0 ? "up" : "down"} ${Math.abs(d)} points vs. the previous session`);
    }
    if (session.throws && previous.throws) {
      const d = session.throws - previous.throws;
      if (d !== 0) deltas.push(he ? `${Math.abs(d)} זריקות ${d > 0 ? "יותר" : "פחות"}` : `${Math.abs(d)} ${d > 0 ? "more" : "fewer"} throws`);
    }
    if (deltas.length) parts.push(`${deltas.join(he ? ", " : ", ")}.`);
  }

  if (session.difficulty !== undefined || session.feeling !== undefined) {
    const bits: string[] = [];
    if (session.difficulty !== undefined) bits.push(he ? `קושי ${session.difficulty}/5` : `difficulty ${session.difficulty}/5`);
    if (session.feeling !== undefined) bits.push(he ? `הרגשה ${session.feeling}/5` : `feeling ${session.feeling}/5`);
    parts.push(`${bits.join(", ")}.`);
  }

  // Next focus from the weakest measured throw and low ratio results.
  const throwTypes: [string, number | undefined, string][] = [
    ["backhand", session.backhandAccuracy, "Backhand"],
    ["forehand", session.forehandAccuracy, "Forehand"],
    ["hammer", session.hammerAccuracy, "Hammer"],
  ];
  const measured = throwTypes.filter(([, v]) => typeof v === "number").sort((a, b) => (a[1] as number) - (b[1] as number));
  const weakest = measured[0];
  if (weakest && (weakest[1] as number) < 70) focus.push(he ? `${weakest[2]}: לעבוד על דיוק במרחק קצר עד 8 מתוך 10` : `${weakest[2]}: short-range accuracy until 8 of 10`);
  const lowRatio = results
    .filter((r) => r.metricType === "ratio" && typeof r.accuracyPct === "number" && (r.attempts ?? 0) >= 5)
    .sort((a, b) => (a.accuracyPct as number) - (b.accuracyPct as number))[0];
  if (lowRatio && (lowRatio.accuracyPct as number) < 60) focus.push(he ? `${lowRatio.exerciseName.he}: ${Math.round(lowRatio.accuracyPct as number)}% – לחזור בגרסה הקלה` : `${lowRatio.exerciseName.en}: ${Math.round(lowRatio.accuracyPct as number)}% – repeat the easier version`);
  if (done < total) focus.push(he ? "להשלים את כל התרגילים – אפשר לקצר מרחקים אבל לא לדלג" : "Complete every drill – shorten distances rather than skipping");
  if (session.difficulty !== undefined && session.difficulty >= 4 && session.feeling !== undefined && session.feeling <= 2) focus.push(he ? "אימון הבא בעצימות נמוכה יותר ויום מנוחה לפניו" : "Lower intensity next session and a rest day before it");
  if (focus.length === 0) focus.push(he ? "לשמור על אותו קצב ולהוסיף 10% חזרות בתרגיל החזק ביותר" : "Keep the same rhythm and add 10% reps to your strongest drill");

  const summary = cap(parts.join(" "), 700);
  return { summary, nextFocus: focus.slice(0, 4), source: "fallback" };
}

/* ------------------------------------------------------------------ */
/* Weekly review                                                       */
/* ------------------------------------------------------------------ */

export function weeklyReviewFallback(weekSessions: CompletedSession[], context: CoachContext, locale: Locale): Omit<WeeklyReviewResponse, "ok"> {
  const he = locale === "he";
  const n = weekSessions.length;
  const minutes = Math.round(weekSessions.reduce((s, x) => s + (x.actualMinutes || 0), 0));
  const throws = weekSessions.reduce((s, x) => s + (x.throws || 0), 0);
  const planned = context.weeklyLoad?.plannedThisWeek;
  const avg = (vals: (number | undefined)[]) => {
    const xs = vals.filter((v): v is number => typeof v === "number");
    return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : undefined;
  };
  const avgDifficulty = avg(weekSessions.map((s) => s.difficulty));
  const avgFeeling = avg(weekSessions.map((s) => s.feeling));
  const avgAccuracy = avg(weekSessions.map((s) => s.accuracyPct));

  const parts: string[] = [];
  if (n === 0) {
    parts.push(he ? "השבוע לא נרשמו אימונים. זה בסדר – השבוע הבא מתחיל מאימון קל אחד." : "No sessions were logged this week. That's fine – next week starts with one easy session.");
  } else {
    parts.push(he ? `השבוע השלמת ${n} אימונים, ${minutes} דקות${throws ? ` ו-${throws} זריקות` : ""}.` : `This week you completed ${n} session${n === 1 ? "" : "s"}, ${minutes} minutes${throws ? ` and ${throws} throws` : ""}.`);
    if (typeof planned === "number" && planned > 0) {
      parts.push(n >= planned ? (he ? `עמדת בתוכנית (${planned} מתוכננים).` : `You met the plan (${planned} planned).`) : he ? `מתוך ${planned} מתוכננים.` : `Out of ${planned} planned.`);
    }
    if (avgAccuracy !== undefined) parts.push(he ? `דיוק ממוצע ${Math.round(avgAccuracy)}%.` : `Average accuracy ${Math.round(avgAccuracy)}%.`);
    if (avgDifficulty !== undefined && avgFeeling !== undefined) parts.push(he ? `קושי ממוצע ${avgDifficulty.toFixed(1)}/5, הרגשה ${avgFeeling.toFixed(1)}/5.` : `Average difficulty ${avgDifficulty.toFixed(1)}/5, feeling ${avgFeeling.toFixed(1)}/5.`);
  }

  const adjustments: WeeklyAdjustment[] = [];
  if (avgDifficulty !== undefined && avgFeeling !== undefined && avgDifficulty >= 4 && avgFeeling <= 2.5) {
    adjustments.push({ kind: "intensity", note: he ? "האימונים היו קשים וההרגשה נמוכה – הורידו עצימות לשבוע אחד." : "Sessions felt hard and the mood was low – drop the intensity for one week." });
    adjustments.push({ kind: "rest", note: he ? "הוסיפו יום מנוחה נוסף בין האימונים." : "Add one more rest day between sessions." });
  } else if (avgDifficulty !== undefined && avgDifficulty <= 2 && n >= 2) {
    adjustments.push({ kind: "intensity", note: he ? "האימונים הרגישו קלים – אפשר להעלות עצימות או חזרות ב-10%." : "Sessions felt easy – raise intensity or reps by about 10%." });
  }
  if (typeof planned === "number" && planned > 0 && n < planned) {
    adjustments.push({ kind: "volume", note: he ? `הושלמו ${n} מתוך ${planned} אימונים – עדיף אימון קצר מאשר לדלג.` : `${n} of ${planned} sessions done – a shorter session beats skipping one.` });
  } else if (n > 4) {
    adjustments.push({ kind: "volume", note: he ? "יותר מ-4 אימונים בשבוע – ודאו לפחות יום מנוחה מלא." : "More than 4 sessions this week – make sure you take at least one full rest day." });
  }
  const weak = context.stats?.weakSkills?.slice(0, 2) ?? [];
  if (weak.length) adjustments.push({ kind: "focus", note: he ? `מיקוד לשבוע הבא: ${weak.map((s) => skillLabel(s, "he")).join(", ")}.` : `Focus next week: ${weak.map((s) => skillLabel(s, "en")).join(", ")}.` });
  if (adjustments.length === 0) adjustments.push({ kind: "focus", note: he ? "להמשיך באותו מבנה ולמדוד את אותם תרגילים כדי לראות מגמה." : "Keep the same structure and measure the same drills to see a trend." });

  return { review: cap(parts.join(" "), 900), adjustments: adjustments.slice(0, 4), source: "fallback" };
}

/* ------------------------------------------------------------------ */
/* Plan / replace                                                      */
/* ------------------------------------------------------------------ */

export function planFallback(locale: Locale): Omit<GeneratePlanResponse, "ok"> {
  return {
    source: "engine",
    weekThemes: [],
    coachMessage: locale === "he" ? "התוכנית נבנתה מספריית האימונים לפי התפקיד והמטרות שלך. המאמן החכם יעדכן את הנושאים כשיהיה זמין." : "Your plan was built from the training library based on your role and goals. The AI coach will refresh the weekly themes when it is available.",
  };
}

export function replaceFallback(candidates: ReplaceExerciseCandidate[], locale: Locale): Omit<ReplaceExerciseResponse, "ok"> {
  const first = candidates[0];
  if (!first) {
    return { rationale: locale === "he" ? "לא נמצא תרגיל חלופי מתאים – אפשר לדלג על התרגיל ולהמשיך." : "No suitable alternative was found – you can skip this drill and continue.", source: "fallback" };
  }
  return {
    choiceId: first.id,
    rationale: locale === "he" ? `${first.name} עובד על אותן מיומנויות ומתאים לתנאים שלך.` : `${first.name} trains the same skills and fits your conditions.`,
    source: "fallback",
  };
}

/** Metric keys present in a session – used by prompts and fallbacks. */
export function metricEntries(m: Partial<Record<MetricKey, number>> | undefined): [MetricKey, number][] {
  return Object.entries(m ?? {}).filter((e): e is [MetricKey, number] => typeof e[1] === "number");
}
