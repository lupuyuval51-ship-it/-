/**
 * Text helpers for the study-material engine. Everything here is language-agnostic (Unicode property escapes,
 * `Intl.Segmenter` when available) so it works for Hebrew, English and any other script the learner pastes.
 */

export const MATERIAL_MAX_CHARS = 8000;

const CONTROL_AND_BIDI = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F‎‏‪-‮⁦-⁩]/g;
/** Emoji used as bullets or decoration ("💧 Water: …"): they would end up in options, hints ("starts with 💧") and gaps. */
const EMOJI = /(?:\p{Emoji_Presentation}|\p{Extended_Pictographic}\uFE0F)(?:\u200D(?:\p{Emoji_Presentation}|\p{Extended_Pictographic}\uFE0F?))*\uFE0F?/gu;

/** Strip control, bidi-override and emoji characters, unify newlines and spaces, and cap the length. */
export function sanitizeMaterial(raw: string): string {
  return raw
    .normalize("NFC")
    .replace(CONTROL_AND_BIDI, "")
    .replace(EMOJI, " ")
    .replace(/\r\n?/g, "\n")
    // a tab separates columns (pasted from a spreadsheet): keep it as a visible column separator
    .replace(/[ \u00A0]*\t+[ \u00A0]*/g, " | ")
    .replace(/[\u00A0 ]+/g, " ")
    .split("\n")
    .map((l) => l.trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, MATERIAL_MAX_CHARS);
}

export function clip(s: string, max: number): string {
  const t = s.trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max - 1);
  const sp = cut.lastIndexOf(" ");
  return `${(sp > max * 0.6 ? cut.slice(0, sp) : cut).replace(/[\s,;:–—-]+$/, "")}…`;
}

const ABBREVIATION = /(?:\b(?:[A-Za-z]|Dr|Mr|Mrs|Ms|St|vs|e\.g|i\.e|etc|No|Fig|approx|ca)\.|ד״ר|פרופ׳?|וכו׳?|למשל)$/;

/** Split prose into sentences, keeping abbreviations such as "e.g." or "Dr." intact. */
export function splitSentences(text: string): string[] {
  const out: string[] = [];
  for (const line of text.split("\n")) {
    const parts = line.split(/(?<=[.!?…。؟])\s+/u);
    let carry = "";
    for (const part of parts) {
      const piece = carry ? `${carry} ${part}` : part;
      if (ABBREVIATION.test(piece.trim())) {
        carry = piece;
        continue;
      }
      carry = "";
      if (piece.trim()) out.push(piece.trim());
    }
    if (carry.trim()) out.push(carry.trim());
  }
  return out;
}

export interface Word {
  text: string;
  start: number;
  end: number;
}

const WORD = /[\p{L}\p{N}][\p{L}\p{N}'’\-־]*/gu;

export function wordsOf(s: string): Word[] {
  const out: Word[] = [];
  for (const m of s.matchAll(WORD)) out.push({ text: m[0].replace(/[-־'’]+$/, ""), start: m.index!, end: m.index! + m[0].length });
  return out;
}

const STOP: Record<string, string> = {
  en: "the a an and or but if then than that this these those with without into onto from for of to in on at by as is are was were be been being it its they them their there here which who whom whose what when where why how can could may might will would shall should do does did done have has had not no nor also very more most much many some any each every other such only own same too just about over under between during before after above below up down out off again further once both few all both because while through against among within along across around including called known used using use made make makes often usually mostly like".replace(/\s+/g, " "),
  he: "של את על הוא היא הם הן אני אתה את אנחנו אתם אתן זה זו זאת אלה אלו עם כי אל או גם כל לא אם אבל יש אין מן כך אשר היה היתה היו להיות הוא כאשר לפני אחרי בין תוך כמו רק עוד מאוד יותר פחות כדי לכן אז שם פה מה מי איך למה מתי איפה אשר ידי עד מעל מתחת לאחר בעת בגלל בכל ככל כלל כולל נקרא נקראת משמש משמשת",
  es: "el la los las un una unos unas y o pero si que de del en con sin por para como es son fue fueron ser está están muy más menos también cada otro otra este esta estos estas ese esa eso al lo su sus se",
  fr: "le la les un une des et ou mais si que de du en avec sans pour par comme est sont été être très plus moins aussi chaque autre ce cette ces au aux son sa ses se qui dans sur",
  de: "der die das ein eine und oder aber wenn dass von mit ohne für durch wie ist sind war waren sein sehr mehr weniger auch jede andere dieser diese dieses zu im am auf aus bei nach über unter",
};
const STOPSET = new Set(Object.values(STOP).flatMap((s) => s.split(" ")));

export const isStop = (w: string) => STOPSET.has(w.toLowerCase());

/** Deterministic hash of the material, used to seed the shuffles so the same text always gives the same game. */
export function hashText(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

export function shuffled<T>(arr: readonly T[], rnd: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

/**
 * What tells the right option apart by its start: "It starts with “M”." is only a hint when no other option starts with
 * "M" too. Gives the shortest start (up to 3 letters) of the right option's first word, or of a later word when the first
 * words are the same ("מעי דק" / "מעי גס" → the second word starts with “ד”), that none of the other options share
 * (`at` is the word's position, 0 for the first). Null when no start tells them apart: the caller then picks another hint.
 */
export function distinctStart(correct: string, others: readonly string[]): { at: number; prefix: string } | null {
  const mine = wordsOf(correct).map((w) => w.text);
  const theirs = others.map((o) => wordsOf(o).map((w) => w.text.toLowerCase()));
  for (let i = 0; i < Math.min(mine.length, 4); i++) {
    const same = mine.slice(0, i).map((w) => w.toLowerCase()).join(" ");
    for (let n = 1; n <= Math.min(3, mine[i]!.length); n++) {
      const p = mine[i]!.slice(0, n);
      if (!theirs.some((o) => o.slice(0, i).join(" ") === same && (o[i] ?? "").startsWith(p.toLowerCase()))) return { at: i, prefix: p };
    }
  }
  return null;
}

const ORDINAL: [string, string][] = [["first", "הראשונה"], ["second", "השנייה"], ["third", "השלישית"], ["fourth", "הרביעית"]];

/** "It starts with “M”." in the right language, naming the word when it is not the first ("Its second word starts with “D”."). */
export function startHintText(s: { at: number; prefix: string }, t: (en: string, he: string) => string, kind: "letter" | "prefix" = "letter"): string {
  const [en, he] = ORDINAL[s.at] ?? ORDINAL[0]!;
  if (s.at === 0) return kind === "letter" ? t(`It starts with “${s.prefix}”.`, `זה מתחיל ${s.prefix.length > 1 ? "באותיות" : "באות"} ״${s.prefix}״.`) : t(`It starts with “${s.prefix}”.`, `הוא מתחיל ב״${s.prefix}״.`);
  return t(`Its ${en} word starts with “${s.prefix}”.`, `המילה ${he} שלו מתחילה ב״${s.prefix}״.`);
}
