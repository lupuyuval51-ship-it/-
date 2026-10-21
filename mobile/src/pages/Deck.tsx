import { useEffect, useRef, useState } from "react";
import { DECK_SESSION } from "@/components/game/offlineTransport";
import { PracticeClient } from "@/components/game/PracticeClient";
import { useLocale, useT } from "@/components/I18nProvider";
import { Arrow, Card } from "@/components/ui";
import { primaryLink, StateView } from "@/components/ui/StateView";
import { useAccount } from "../cloud/account";
import { formatNextReview } from "../format";
import type { DeckSummary } from "../library-model";
import { store, transport } from "../app-state";

/** The longest a browser timer can wait: a longer delay overflows and the timer fires at once. */
const MAX_TIMER_MS = 2_147_483_647;

/** What the screen shows: the deck count (null when it could not be read) and the time it was read at. */
export interface DeckView { summary: DeckSummary | null; now: number }

/** Counts the cards now. Counting can write new ones to the phone, which throws when it is full. */
function countDeck(): DeckView {
  const summary = store.deckSummary();
  return { summary, now: Date.now() };
}

/** A count again, for a screen that is already showing one: null when it fails (a full phone), and the screen stays as it is. */
function recount(): DeckView | null {
  try { return countDeck(); } catch { return null; }
}

/** True while the screen says there is nothing to review yet: only then can it still turn into a round. */
export const waitingForCards = (v: DeckView): boolean => v.summary !== null && v.summary.due === 0;

/**
 * Keeps a "nothing to review" screen current: `onRecount` runs a little after the next card falls due (never sooner than a second,
 * never later than a timer can wait) and whenever the app comes back to the front (timers do not run while it is in the background,
 * and the clock moved on meanwhile). Returns the cleanup.
 */
export function watchDeck(nextDue: number | null, now: number, onRecount: () => void, doc: Pick<Document, "visibilityState" | "addEventListener" | "removeEventListener"> = document): () => void {
  const onShow = () => { if (doc.visibilityState === "visible") onRecount(); };
  doc.addEventListener("visibilitychange", onShow);
  const timer = nextDue === null ? undefined : setTimeout(onRecount, Math.min(MAX_TIMER_MS, Math.max(1_000, nextDue - now + 500)));
  return () => {
    doc.removeEventListener("visibilitychange", onShow);
    clearTimeout(timer);
  };
}

/** "Review my mistakes": due questions from every game, spaced repetition, nothing scored. */
export function DeckPage() {
  const t = useT();
  const locale = useLocale();
  const { lastSyncAt } = useAccount();
  // Counting the cards can write new ones to the phone, which fails when it is full. The practice below has its own failure message,
  // so a failed count opens it (instead of ending in the crash screen) and lets it say what went wrong.
  const [view, setView] = useState<DeckView>(() => {
    try { return countDeck(); } catch { return { summary: null, now: Date.now() }; }
  });
  const { summary, now } = view;
  const waiting = waitingForCards(view);
  const nextDue = summary?.nextDue ?? null;
  // "All caught up" is true only when it was counted: the screen counts again when the next card falls due or the app comes back
  // to the front, so it never keeps saying "next review: 14:40" at 15:00. A cloud sync can bring missed questions from another
  // phone while it is open (its merges are silent for the store's own change listeners), so it also counts again whenever a sync
  // finishes, like the library. Once a round is on screen it is never replaced (the practice keeps its own questions).
  const syncMark = useRef(lastSyncAt);
  useEffect(() => {
    if (!waiting) return;
    const update = () => { const v = recount(); if (v) setView(v); };
    const stop = watchDeck(nextDue, Date.now(), update);
    const synced = syncMark.current === lastSyncAt ? undefined : setTimeout(() => { syncMark.current = lastSyncAt; update(); }, 0);
    return () => {
      stop();
      clearTimeout(synced);
    };
  }, [waiting, nextDue, now, lastSyncAt]);
  if (summary && summary.due === 0) {
    const next = summary.nextDue ? formatNextReview(summary.nextDue, now, locale) : null;
    return (
      <div className="space-y-4" data-testid="deck-empty">
        <a href="#/" className="inline-flex min-h-11 items-center gap-1 text-sm text-muted"><Arrow back /> {t("mob.back")}</a>
        {/* like every other screen, one h1 names where the learner is (the state card below only says what there is to do) */}
        <h1 className="text-2xl font-extrabold">{t("mob.deck.title")}</h1>
        <Card elevation="flat" className="py-0">
          <StateView
            kind="empty"
            title={summary.total === 0 ? t("mob.deck.none.title") : t("mob.deck.done.title")}
            text={summary.total === 0 ? t("mob.deck.none.text") : next ? t("mob.deck.next", { when: next }) : undefined}
            actions={<a href="#/" className={primaryLink}>{t("mob.back")}</a>}
          />
        </Card>
      </div>
    );
  }
  return (
    <div className="space-y-3" data-testid="deck">
      <h1 className="text-2xl font-extrabold">{t("mob.deck.title")}</h1>
      <p className="text-sm text-muted">{t("mob.deck.intro")}</p>
      <PracticeClient gameId={DECK_SESSION} sessionId={DECK_SESSION} transport={transport} backHref="/" reviewHref={null} />
    </div>
  );
}
