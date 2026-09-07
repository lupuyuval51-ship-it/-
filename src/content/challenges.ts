/**
 * Daily and weekly challenge definitions.
 * Progress is tracked from recorded session data only (see src/engine/challenges.ts). Challenges give XP and a
 * badge name – nothing in the app is ever locked behind them.
 *
 * `role_challenge` with role "allround" means "the player's own role challenge" (any ch-role-* drill counts).
 */
import type { ChallengeDefinition, Role } from "@/lib/types";

const MOVERS: Role[] = ["runner", "cutter", "wing", "hybrid", "allround"];
const DEFENDERS: Role[] = ["defender", "hybrid", "allround"];
const THROWERS: Role[] = ["handler", "wing", "hybrid", "allround"];

export const DAILY_CHALLENGES: ChallengeDefinition[] = [
  {
    id: "d-8of10",
    period: "daily",
    title: { he: "8 מתוך 10", en: "8 of 10" },
    description: { he: "פגעו במטרה ב-8 זריקות לפחות מתוך 10 – בכל סוג זריקה שתבחרו.", en: "Hit the target with at least 8 of 10 throws – any throw type you like." },
    metric: { kind: "metric", key: "throw_accuracy", target: 80, comparison: "gte" },
    xp: 20,
    badge: "sharpshooter",
    encouragement: { he: "דיוק נבנה זריקה אחרי זריקה. 8 מתוך 10 – זה בהישג יד.", en: "Accuracy is built one throw at a time. 8 of 10 is within reach." },
  },
  {
    id: "d-catch-20",
    period: "daily",
    title: { he: "20 תפיסות ברצף", en: "20-catch streak" },
    description: { he: "תפסו 20 דיסקים ברצף בלי להפיל.", en: "Catch 20 discs in a row without a drop." },
    metric: { kind: "catch_streak", target: 20 },
    xp: 20,
    badge: "safe-hands",
    encouragement: { he: "עיניים על הדיסק עד הסוף – הרצף יגיע.", en: "Eyes on the disc all the way in – the streak will come." },
  },
  {
    id: "d-forehand-50",
    period: "daily",
    title: { he: "50 זריקות Forehand", en: "50 forehand throws" },
    description: { he: "זרקו היום 50 זריקות Forehand בסך הכול.", en: "Throw 50 forehands in total today." },
    metric: { kind: "throws", skill: "forehand", target: 50 },
    xp: 15,
    badge: "forehand-fifty",
    encouragement: { he: "כל Forehand נוסף עושה את הזריקה הבאה טבעית יותר.", en: "Every extra forehand makes the next one feel more natural." },
  },
  {
    id: "d-90min",
    period: "daily",
    title: { he: "אימון מלא של 90 דקות", en: "A full 90-minute workout" },
    description: { he: "השלימו היום אימון של 90 דקות לפחות.", en: "Complete a workout of at least 90 minutes today." },
    metric: { kind: "sessions", target: 1, minMinutes: 90 },
    xp: 25,
    badge: "full-session",
    encouragement: { he: "אימון מלא הוא הבסיס לכל השאר. קחו את הזמן.", en: "A full workout is the base for everything else. Take your time." },
  },
  {
    id: "d-cuts-10",
    period: "daily",
    title: { he: "10 Cuts חדים", en: "10 explosive cuts" },
    description: { he: "בצעו את תרגיל ה-Cuts החדים ורשמו את התוצאה.", en: "Do the explosive-cuts drill and log the result." },
    metric: { kind: "exercise", exerciseId: "rn-explosive-cuts" },
    xp: 15,
    badge: "sharp-cuts",
    roles: MOVERS,
    encouragement: { he: "Cut חד מתחיל בעצירה טובה. עשרה כאלה – ואתם על המסלול.", en: "A sharp cut starts with a good stop. Ten of those and you're on track." },
  },
  {
    id: "d-mirror",
    period: "daily",
    title: { he: "Mirror Drill", en: "Mirror drill" },
    description: { he: "בצעו את תרגיל ה-Mirror ורשמו ציון.", en: "Do the mirror drill and log a score." },
    metric: { kind: "exercise", exerciseId: "df-mirror-drill" },
    xp: 15,
    badge: "shadow",
    roles: DEFENDERS,
    encouragement: { he: "להישאר צמודים זה עניין של רגליים ועיניים. קדימה.", en: "Staying tight is all feet and eyes. Go for it." },
  },
  {
    id: "d-5bh5fh",
    period: "daily",
    title: { he: "5 Backhand + 5 Forehand ברצף", en: "5 backhand + 5 forehand in a row" },
    description: { he: "השלימו את אתגר 5 Backhand ו-5 Forehand ברצף למטרה.", en: "Complete the 5-backhand + 5-forehand-in-a-row target challenge." },
    metric: { kind: "exercise", exerciseId: "ch-5-bh-5-fh" },
    xp: 20,
    badge: "both-hands",
    roles: THROWERS,
    encouragement: { he: "שתי הזריקות באותו יום – ככה בונים Handler שקשה לסגור.", en: "Both throws in one day – that's how you build a handler who's hard to shut down." },
  },
  {
    id: "d-role",
    period: "daily",
    title: { he: "אתגר התפקיד שלכם", en: "Your role challenge" },
    description: { he: "השלימו את אתגר התפקיד שלכם ורשמו ציון.", en: "Complete your role challenge and log a score." },
    metric: { kind: "role_challenge", role: "allround" },
    xp: 25,
    badge: "role-hero",
    encouragement: { he: "אתגר התפקיד מראה בדיוק איפה אתם היום. כל ציון הוא נקודת פתיחה.", en: "The role challenge shows exactly where you are today. Every score is a starting point." },
  },
  {
    id: "d-distance-pb",
    period: "daily",
    title: { he: "שיא מרחק חדש", en: "New distance PB" },
    description: { he: "קבעו היום שיא אישי חדש בזריקה הארוכה ביותר.", en: "Set a new personal best for your longest throw today." },
    metric: { kind: "personal_best", key: "longest_throw_m" },
    xp: 25,
    badge: "long-arm",
    encouragement: { he: "שיא נשבר כשהגוף חם והזריקה רגועה. חממו היטב.", en: "Records fall when the body is warm and the throw is relaxed. Warm up well." },
  },
  {
    id: "d-three-throws",
    period: "daily",
    title: { he: "שלוש זריקות תחת לחץ", en: "Three throws under pressure" },
    description: { he: "השלימו את אתגר שלוש הזריקות תחת לחץ ורשמו את התוצאה.", en: "Complete the three-throws-under-pressure challenge and log the result." },
    metric: { kind: "exercise", exerciseId: "ch-pressure-three" },
    xp: 20,
    badge: "clutch",
    encouragement: { he: "שלוש זריקות, ספירה רצה. נשימה אחת לפני כל אחת.", en: "Three throws, the count is running. One breath before each." },
  },
];

export const WEEKLY_CHALLENGES: ChallengeDefinition[] = [
  {
    id: "wk-sessions-3",
    period: "weekly",
    title: { he: "3 אימונים השבוע", en: "3 workouts this week" },
    description: { he: "השלימו 3 אימונים במהלך השבוע.", en: "Complete 3 workouts during the week." },
    metric: { kind: "sessions", target: 3 },
    xp: 60,
    badge: "week-warrior",
    encouragement: { he: "שלושה אימונים בשבוע – זה הקצב שבו רואים שינוי.", en: "Three workouts a week is the pace where change shows." },
  },
  {
    id: "wk-accuracy-8of10",
    period: "weekly",
    title: { he: "8 מתוך 10 השבוע", en: "8 of 10 this week" },
    description: { he: "השיגו 8 פגיעות מתוך 10 באחד מאימוני השבוע.", en: "Hit 8 of 10 in one of this week's workouts." },
    metric: { kind: "metric", key: "throw_accuracy", target: 80, comparison: "gte" },
    xp: 40,
    badge: "sharpshooter-week",
    encouragement: { he: "יש שבוע שלם – מספיק אימון אחד מדויק.", en: "You have the whole week – one accurate workout is enough." },
  },
  {
    id: "wk-catch-streak-20",
    period: "weekly",
    title: { he: "רצף 20 תפיסות השבוע", en: "20-catch streak this week" },
    description: { he: "הגיעו לרצף של 20 תפיסות באחד מאימוני השבוע.", en: "Reach a 20-catch streak in one of this week's workouts." },
    metric: { kind: "catch_streak", target: 20 },
    xp: 40,
    badge: "safe-hands-week",
    encouragement: { he: "רצף תפיסות טוב מתחיל בריכוז, לא בכוח.", en: "A good catch streak starts with focus, not force." },
  },
  {
    id: "wk-role-challenge",
    period: "weekly",
    title: { he: "אתגר התפקיד השבועי", en: "Weekly role challenge" },
    description: { he: "השלימו את אתגר התפקיד שלכם פעם אחת השבוע.", en: "Complete your role challenge once this week." },
    metric: { kind: "role_challenge", role: "allround" },
    xp: 50,
    badge: "role-hero-week",
    encouragement: { he: "אתגר התפקיד הוא המדד הכי ישיר להתקדמות שלכם.", en: "The role challenge is the most direct measure of your progress." },
  },
  {
    id: "wk-forehand-50",
    period: "weekly",
    title: { he: "50 זריקות Forehand השבוע", en: "50 forehand throws this week" },
    description: { he: "זרקו 50 זריקות Forehand במצטבר השבוע.", en: "Throw 50 forehands in total this week." },
    metric: { kind: "throws", skill: "forehand", target: 50 },
    xp: 30,
    badge: "forehand-week",
    encouragement: { he: "Forehand משתפר בכמות. השבוע – 50.", en: "Forehand improves with volume. This week – 50." },
  },
  {
    id: "wk-distance-pb",
    period: "weekly",
    title: { he: "שיא מרחק השבוע", en: "Distance PB this week" },
    description: { he: "קבעו שיא אישי חדש בזריקה הארוכה ביותר במהלך השבוע.", en: "Set a new longest-throw personal best during the week." },
    metric: { kind: "personal_best", key: "longest_throw_m" },
    xp: 50,
    badge: "long-arm-week",
    encouragement: { he: "בחרו יום עם רוח נוחה ורגליים רעננות.", en: "Pick a day with friendly wind and fresh legs." },
  },
  {
    id: "wk-90min",
    period: "weekly",
    title: { he: "אימון מלא השבוע", en: "A full workout this week" },
    description: { he: "השלימו אימון של 90 דקות לפחות במהלך השבוע.", en: "Complete a workout of at least 90 minutes during the week." },
    metric: { kind: "sessions", target: 1, minMinutes: 90 },
    xp: 40,
    badge: "full-session-week",
    encouragement: { he: "אימון מלא אחד בשבוע נותן לגוף זמן ללמוד.", en: "One full workout a week gives the body time to learn." },
  },
  {
    id: "wk-cuts-10",
    period: "weekly",
    title: { he: "Cuts חדים השבוע", en: "Explosive cuts this week" },
    description: { he: "בצעו את תרגיל ה-Cuts החדים פעם אחת השבוע.", en: "Do the explosive-cuts drill once this week." },
    metric: { kind: "exercise", exerciseId: "rn-explosive-cuts" },
    xp: 30,
    badge: "sharp-cuts-week",
    roles: MOVERS,
    encouragement: { he: "רגליים חדות = הפרדה מהמגן. שווה את זה.", en: "Sharp legs mean separation from the defender. Worth it." },
  },
  {
    id: "wk-mirror",
    period: "weekly",
    title: { he: "Mirror Drill השבוע", en: "Mirror drill this week" },
    description: { he: "בצעו את תרגיל ה-Mirror פעם אחת השבוע ורשמו ציון.", en: "Do the mirror drill once this week and log a score." },
    metric: { kind: "exercise", exerciseId: "df-mirror-drill" },
    xp: 30,
    badge: "shadow-week",
    roles: DEFENDERS,
    encouragement: { he: "הגנה טובה נבנית מחזרות קצרות ואיכותיות.", en: "Good defense is built from short, quality reps." },
  },
  {
    id: "wk-5bh5fh",
    period: "weekly",
    title: { he: "5 Backhand + 5 Forehand השבוע", en: "5 backhand + 5 forehand this week" },
    description: { he: "השלימו את אתגר 5 Backhand ו-5 Forehand ברצף פעם אחת השבוע.", en: "Complete the 5-backhand + 5-forehand-in-a-row challenge once this week." },
    metric: { kind: "exercise", exerciseId: "ch-5-bh-5-fh" },
    xp: 40,
    badge: "both-hands-week",
    roles: THROWERS,
    encouragement: { he: "עשר זריקות, שני סוגים, בלי לפספס. אתם קרובים.", en: "Ten throws, two types, no misses. You're close." },
  },
];

export const CHALLENGES: ChallengeDefinition[] = [...DAILY_CHALLENGES, ...WEEKLY_CHALLENGES];

export const CHALLENGE_MAP: Record<string, ChallengeDefinition> = Object.fromEntries(CHALLENGES.map((c) => [c.id, c]));

export function getChallenge(id: string): ChallengeDefinition | undefined {
  return CHALLENGE_MAP[id];
}
