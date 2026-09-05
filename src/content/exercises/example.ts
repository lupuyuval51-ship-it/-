/**
 * Reference exercise – the quality bar for every catalog entry.
 * Real drill, concrete numbers, natural Hebrew (not translated English), both languages complete.
 * This entry IS part of the catalog (id "fh-short-gate", manifest part A).
 */
import type { Exercise } from "@/lib/types";

export const fhShortGate: Exercise = {
  id: "fh-short-gate",
  name: { he: "Forehand דרך שער", en: "Forehand accuracy gate" },
  category: "throwing",
  skills: ["forehand", "accuracy", "short_throws"],
  roles: ["handler", "hybrid", "allround"],
  levels: ["beginner", "intermediate", "advanced"],
  phases: ["throwing"],
  goal: { he: "שיפור הדיוק ושחרור ישר ויציב ב-Forehand במרחק קצר.", en: "Improve forehand accuracy and a straight, stable release at short range." },
  participants: ["solo", "pair", "group"],
  equipment: ["cones"],
  optionalEquipment: ["discs"],
  fieldSizes: ["small", "medium", "large", "indoor", "park", "beach", "yard"],
  intensity: "low",
  offenseDefense: "offense",
  wind: "any",
  ageGroups: ["kid", "teen", "adult", "senior"],
  durationMinutes: 8,
  minDurationMinutes: 6,
  maxDurationMinutes: 12,
  sets: 3,
  reps: 10,
  restSeconds: 60,
  setup: {
    he: "הציבו שני קונוסים במרחק של 2 מטרים זה מזה. עמדו במרחק של 10 מטרים מהשער. אם יש כמה דיסקים, הניחו אותם לצדכם כדי לא לרוץ אחרי כל זריקה.",
    en: "Place two cones 2 m apart. Stand 10 m from the gate. If you have several discs, keep them beside you so you don't chase every throw.",
  },
  instructions: [
    { he: "בצעו 3 סטים של 10 זריקות Forehand ונסו להעביר את הדיסק בין הקונוסים.", en: "Throw 3 sets of 10 forehands, aiming to pass the disc between the cones." },
    { he: "התחילו בזריקה רגועה ב-60% כוח והתמקדו בזווית דיסק שטוחה.", en: "Start relaxed at 60% power and focus on a flat disc angle." },
    { he: "ספרו כמה זריקות עברו בשער בכל סט ורשמו את התוצאה בסיום.", en: "Count how many throws passed through the gate in each set and log it at the end." },
  ],
  cues: [
    { he: "שני אצבעות לאורך השפה הפנימית, האגודל לוחץ מלמעלה.", en: "Two fingers along the inside rim, thumb pressing from above." },
    { he: "המרפק קרוב לגוף ושורש כף היד עושה את העבודה, לא הכתף.", en: "Elbow close to the body; the wrist does the work, not the shoulder." },
    { he: "שחררו כשהדיסק מקביל לקרקע וסיימו עם כף היד פונה למטרה.", en: "Release with the disc parallel to the ground and finish with your palm facing the target." },
  ],
  commonMistakes: [
    { he: "שימוש בכוח רב מדי מהכתף במקום תנועה נשלטת של שורש כף היד.", en: "Muscling the throw from the shoulder instead of a controlled wrist snap." },
    { he: "הדיסק מוטה כלפי חוץ בשחרור ולכן בורח ימינה (לימניים).", en: "Outside-in disc angle at release, so the throw drifts right (for right-handers)." },
  ],
  successMetric: { type: "ratio", key: "forehand_accuracy", label: { he: "זריקות שעברו בשער מתוך 30", en: "Throws through the gate out of 30" }, target: 70, attempts: 30 },
  easierVersion: { he: "הרחיבו את המרווח בין הקונוסים ל-3 מטרים או התקרבו ל-7 מטרים.", en: "Widen the gate to 3 m or move in to 7 m." },
  harderVersion: { he: "הצרו את השער ל-1.5 מטר, הגדילו את המרחק ל-15 מטר, או זרקו אחרי Pivot.", en: "Narrow the gate to 1.5 m, move back to 15 m, or throw after a pivot." },
  soloAlternative: { he: "עובד לבד כפי שהוא: זרקו סדרה של דיסקים ואספו אותם בהליכה קלה בין הסטים – זו גם המנוחה.", en: "Works solo as written: throw a series of discs and collect them at an easy walk between sets – that's your rest." },
  partnerAlternative: { he: "השותף עומד מאחורי השער, סופר בקול ומחזיר את הדיסק ב-Backhand קל.", en: "Your partner stands behind the gate, calls the count and returns the disc with an easy backhand." },
  safetyNotes: [
    { he: "ודאו שאין אנשים מאחורי השער בטווח של 20 מטר.", en: "Make sure no one is within 20 m behind the gate." },
  ],
  diagram: {
    field: "lane",
    items: [
      { type: "player", x: 15, y: 50, label: "10m" },
      { type: "cone", x: 75, y: 38 },
      { type: "cone", x: 75, y: 62 },
      { type: "throw", from: [20, 50], to: [78, 50], dashed: true },
    ],
  },
  throwsPerSet: 10,
  catchesPerSet: 0,
};
