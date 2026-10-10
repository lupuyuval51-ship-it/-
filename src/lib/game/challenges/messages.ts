/**
 * Feedback produced by the ENGINE (not the spec author) in the game's content language.
 * Spec-authored explanations come straight from the spec; these cover automatically graded details.
 * Languages without a catalog fall back to English.
 */
import type { ContentLanguage } from "../spec/constants";

type Params = Record<string, string | number>;

const en = {
  correct: "Correct!",
  notQuite: "Not quite — look at the hint and try again.",
  invalidAnswer: "That answer could not be checked.",
  seqPartial: "{n} of {total} items are in the right place.",
  seqRight: "That is the right order.",
  matchPartial: "{n} of {total} pairs are matched correctly.",
  matchRight: "Every pair is matched.",
  numericClose: "Close, but not within the allowed margin.",
  numericRight: "Right on target.",
  progGoal: "The robot reached the goal using {n} blocks.",
  progTooMany: "Your program uses {n} blocks but only {max} are allowed. Is there a way to repeat instead of copying?",
  progDisallowed: "Your program uses a block that is not available in this puzzle.",
  progDeep: "Blocks are nested too deeply (at most 3 levels).",
  progStepLimit: "The robot ran for too long. Check your loops.",
  progMissed: "The robot stopped at column {x}, row {y} but the goal is at column {gx}, row {gy}.",
  simProjLong: "The projectile landed {d} m past the target ({r} m).",
  simProjShort: "The projectile landed {d} m short of the target ({r} m).",
  simProjHit: "Direct hit: it landed {r} m away, right at the target.",
  simLevHeavyLeft: "The left side is still heavier — the lever tips left.",
  simLevHeavyRight: "The right side is too heavy — the lever tips right.",
  simLevBalanced: "Balanced! Torque on both sides is equal.",
  revealed: "The answer is shown so you can learn from it. You can keep going.",
} as const;

const he: Record<keyof typeof en, string> = {
  correct: "נכון!",
  notQuite: "כמעט — הסתכלו ברמז ונסו שוב.",
  invalidAnswer: "לא ניתן היה לבדוק את התשובה.",
  seqPartial: "{n} מתוך {total} פריטים במקום הנכון.",
  seqRight: "זה הסדר הנכון.",
  matchPartial: "{n} מתוך {total} זוגות הותאמו נכון.",
  matchRight: "כל הזוגות הותאמו.",
  numericClose: "קרוב, אבל לא בטווח המותר.",
  numericRight: "בול.",
  progGoal: "הרובוט הגיע ליעד באמצעות {n} בלוקים.",
  progTooMany: "התוכנית שלכם משתמשת ב-{n} בלוקים אבל מותר רק {max}. אולי אפשר לחזור על פעולה במקום להעתיק אותה?",
  progDisallowed: "התוכנית משתמשת בבלוק שאינו זמין בחידה הזו.",
  progDeep: "הבלוקים מקוננים עמוק מדי (עד 3 רמות).",
  progStepLimit: "הרובוט רץ יותר מדי זמן. בדקו את הלולאות.",
  progMissed: "הרובוט נעצר בעמודה {x}, שורה {y}, אבל היעד בעמודה {gx}, שורה {gy}.",
  simProjLong: "הקליע נחת {d} מ' אחרי המטרה ({r} מ').",
  simProjShort: "הקליע נחת {d} מ' לפני המטרה ({r} מ').",
  simProjHit: "פגיעה ישירה: הקליע נחת במרחק {r} מ', בדיוק במטרה.",
  simLevHeavyLeft: "הצד השמאלי עדיין כבד יותר — המנוף נוטה שמאלה.",
  simLevHeavyRight: "הצד הימני כבד מדי — המנוף נוטה ימינה.",
  simLevBalanced: "מאוזן! המומנט בשני הצדדים שווה.",
  revealed: "התשובה מוצגת כדי שתוכלו ללמוד ממנה. אפשר להמשיך.",
};

const catalogs: Partial<Record<ContentLanguage, Record<keyof typeof en, string>>> = { en, he };

export type MessageKey = keyof typeof en;

export function msg(lang: ContentLanguage, key: MessageKey, params: Params = {}): string {
  const template = (catalogs[lang] ?? en)[key];
  return template.replace(/\{(\w+)\}/g, (_, k: string) => String(params[k] ?? ""));
}
