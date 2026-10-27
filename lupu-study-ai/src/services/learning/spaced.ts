import type { DateStr, Flashcard } from "@/types";
import { addDays } from "@/lib/dates";
import { clamp } from "@/lib/utils";

export const MIN_EASE = 1.3;
export const MAX_EASE = 2.8;
export const DEFAULT_EASE = 2.3;

export type CardSchedule = Pick<
  Flashcard,
  "ease" | "intervalDays" | "due" | "reps" | "lapses" | "attempts" | "successes"
>;

/**
 * חזרה מרווחת בסגנון SM-2 מפושט:
 *  - "ידעתי": המרווח גדל (יום, 3 ימים, ואז כפול ה-ease) וה-ease עולה מעט.
 *  - "לא ידעתי": הכרטיס חוזר להיום, ה-ease יורד, ולכן כרטיסים קשים יופיעו בתדירות גבוהה יותר.
 */
export function scheduleReview(card: CardSchedule, known: boolean, today: DateStr): CardSchedule {
  const attempts = card.attempts + 1;
  if (!known) {
    return {
      ease: clamp(card.ease - 0.2, MIN_EASE, MAX_EASE),
      intervalDays: 0,
      due: today,
      reps: 0,
      lapses: card.lapses + 1,
      attempts,
      successes: card.successes,
    };
  }
  const reps = card.reps + 1;
  const intervalDays =
    reps === 1 ? 1 : reps === 2 ? 3 : Math.max(card.intervalDays + 1, Math.round(card.intervalDays * card.ease));
  return {
    ease: clamp(card.ease + 0.05, MIN_EASE, MAX_EASE),
    intervalDays,
    due: addDays(today, intervalDays),
    reps,
    lapses: card.lapses,
    attempts,
    successes: card.successes + 1,
  };
}

export function isDue(card: Pick<Flashcard, "due">, today: DateStr): boolean {
  return card.due <= today;
}

/** כרטיסים לחזרה היום: קודם מי שהכי מאחר, ובשוויון – הקשים (ease נמוך) קודם */
export function dueCards<T extends Pick<Flashcard, "due" | "ease">>(cards: T[], today: DateStr): T[] {
  return cards
    .filter((c) => isDue(c, today))
    .sort((a, b) => (a.due === b.due ? a.ease - b.ease : a.due < b.due ? -1 : 1));
}

export function newCardSchedule(today: DateStr): CardSchedule {
  return { ease: DEFAULT_EASE, intervalDays: 0, due: today, reps: 0, lapses: 0, attempts: 0, successes: 0 };
}

export function cardSuccessRate(card: Pick<Flashcard, "attempts" | "successes">): number | null {
  return card.attempts ? card.successes / card.attempts : null;
}

/** כרטיס "קשה" – ניסיונות מספיקים ושיעור הצלחה נמוך, או ease נמוך */
export function isHardCard(card: Pick<Flashcard, "attempts" | "successes" | "ease">): boolean {
  const rate = cardSuccessRate(card);
  return card.ease <= 1.8 || (card.attempts >= 3 && rate !== null && rate < 0.5);
}
