import { useState } from "react";
import { DECK_SESSION } from "@/components/game/offlineTransport";
import { PracticeClient } from "@/components/game/PracticeClient";
import { useLocale, useT } from "@/components/I18nProvider";
import { Arrow, Card } from "@/components/ui";
import { primaryLink, StateView } from "@/components/ui/StateView";
import { store, transport } from "../app-state";

/** "Review my mistakes": due questions from every game, spaced repetition, nothing scored. */
export function DeckPage() {
  const t = useT();
  const locale = useLocale();
  const [summary] = useState(() => store.deckSummary());
  if (summary.due === 0) {
    const next = summary.nextDue ? new Date(summary.nextDue).toLocaleString(locale === "he" ? "he-IL" : "en-GB", { weekday: "long", hour: "2-digit", minute: "2-digit" }) : null;
    return (
      <div className="space-y-4" data-testid="deck-empty">
        <a href="#/" className="text-sm text-muted"><Arrow back /> {t("mob.back")}</a>
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
