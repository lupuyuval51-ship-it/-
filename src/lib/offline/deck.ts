/**
 * "Review my mistakes" across every game on the device, with spaced repetition (Leitner boxes).
 * A question you missed enters box 1. Each time you get it right on the first try it moves up a box and comes back
 * later (1 → 3 → 7 → 16 days). A miss sends it back to box 1. After the last box it is mastered and leaves the deck.
 */
import { z } from "zod";
import { MAX_ATTEMPTS_PER_CHALLENGE } from "@/config/limits";
import { answerSchema } from "../game/challenges/grade";

const DAY = 24 * 60 * 60 * 1000;
/** Days until a card in box N (1-based) is due again after a first-try success. */
export const BOX_INTERVAL_DAYS = [1, 3, 7, 16] as const;
export const MASTERED_AFTER_BOX = BOX_INTERVAL_DAYS.length + 1;
/** A missed card comes back in the same day's next session, not in the same sitting. */
export const RETRY_DELAY_MS = 10 * 60 * 1000;
export const MAX_PER_SESSION = 10;

export interface DeckCard {
  key: string;
  gameId: string;
  challengeId: string;
  box: number;
  due: number;
  added: number;
  reviews: number;
}

export const deckKey = (gameId: string, challengeId: string) => `${gameId}.${challengeId}`;

export function newCard(gameId: string, challengeId: string, now: number): DeckCard {
  return { key: deckKey(gameId, challengeId), gameId, challengeId, box: 1, due: now, added: now, reviews: 0 };
}

/** Result of one review. Returns null when the card is mastered (it leaves the deck). */
export function review(card: DeckCard, firstTryCorrect: boolean, now: number): DeckCard | null {
  if (!firstTryCorrect) return { ...card, box: 1, due: now + RETRY_DELAY_MS, reviews: card.reviews + 1 };
  if (card.box >= MASTERED_AFTER_BOX) return null;
  const days = BOX_INTERVAL_DAYS[card.box - 1]!;
  return { ...card, box: card.box + 1, due: now + days * DAY, reviews: card.reviews + 1 };
}

/** The cards to ask now: due ones, oldest first, at most one session's worth. */
export function dueCards(cards: readonly DeckCard[], now: number, max = MAX_PER_SESSION): DeckCard[] {
  return cards.filter((c) => c.due <= now).sort((a, b) => a.due - b.due || a.added - b.added).slice(0, max);
}

export const deckBodySchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("start") }),
  z.object({ action: z.literal("answer"), challengeId: z.string().max(120), answer: answerSchema, attempt: z.number().int().min(1).max(MAX_ATTEMPTS_PER_CHALLENGE) }),
  z.object({ action: z.literal("hint"), challengeId: z.string().max(120) }),
]);
