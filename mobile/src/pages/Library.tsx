import { useState } from "react";
import { useT } from "@/components/I18nProvider";
import { GeneratorBadge } from "@/components/games/GameBadges";
import { RotateCcw } from "lucide-react";
import { Arrow, Badge, Button, Card, Stars } from "@/components/ui";
import { primaryLink, StateView } from "@/components/ui/StateView";
import { store } from "../app-state";

export function LibraryPage() {
  const t = useT();
  const [games, setGames] = useState(() => store.listGames());
  const [deck, setDeck] = useState(() => store.deckSummary());
  const remove = (id: string) => {
    if (!window.confirm(t("mob.delete.confirm"))) return;
    store.deleteGame(id);
    setGames(store.listGames());
    setDeck(store.deckSummary());
  };
  return (
    <div className="space-y-5" data-testid="mobile-library">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">LEVEL UP</h1>
          <p className="text-sm text-muted">{t("mob.tagline")}</p>
        </div>
        <a href="#/settings" className="inline-flex min-h-11 shrink-0 items-center rounded-xl border border-line px-3 text-sm font-semibold" data-testid="mobile-settings">{t("mob.settings")}</a>
      </header>
      <div className="space-y-5 md:grid md:grid-cols-2 md:items-stretch md:gap-3 md:space-y-0" data-testid="mobile-actions">
      <a href="#/create" data-testid="mobile-new" className="flex min-h-14 items-center justify-center rounded-2xl bg-neon text-lg font-bold text-ink-950 md:min-h-16">+ {t("mob.new")}</a>
      {deck.total > 0 && (
        <a href="#/review" data-testid="deck-open" data-due={deck.due} className="flex min-h-14 items-center gap-3 rounded-2xl border border-violet/50 bg-violet/10 px-4 shadow-e1 transition hover:border-violet active:scale-[0.99]">
          <RotateCcw aria-hidden className="size-5 shrink-0 text-violet-soft" />
          <span className="me-auto">
            <span className="block font-semibold">{t("mob.deck.title")}</span>
            <span className="block text-sm text-muted">{deck.due > 0 ? t("mob.deck.due", { n: deck.due }) : t("mob.deck.later", { n: deck.total })}</span>
          </span>
          <Arrow />
        </a>
      )}
      </div>
      <h2 className="text-lg font-semibold">{t("lib.title")}</h2>
      {games.length === 0 ? (
        <Card elevation="flat" className="py-0">
          <StateView kind="empty" data-testid="mobile-empty" title={t("lib.empty.title")} text={t("lib.empty.text")} actions={<a href="#/create" className={primaryLink}>{t("lib.empty.cta")}</a>} />
        </Card>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2" data-testid="mobile-games">
          {games.map((g) => (
            <li key={g.id} className="flex">
              <Card interactive className="w-full space-y-3" data-testid="mobile-game">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 dir="auto" className="me-auto text-lg font-semibold">{g.title}</h3>
                  <GeneratorBadge kind={g.generatorKind} provider={g.generatorKind} t={t} />
                  {g.inProgress && <Badge tone="neon">{t("lib.progress", { n: g.percent })}</Badge>}
                </div>
                <p dir="auto" className="text-sm text-muted">{g.subject}</p>
                {g.bestStars > 0 && <div className="flex items-center gap-2 text-sm"><Stars n={g.bestStars} size="sm" /><span className="ltr-num text-muted">{g.bestScore}/{g.maxScore}</span></div>}
                <div className="flex flex-wrap gap-2">
                  <a href={`#/play/${g.id}`} data-testid="mobile-play" className="inline-flex min-h-11 items-center rounded-xl bg-neon px-5 font-semibold text-ink-950">{g.inProgress ? t("lib.continue") : t("lib.play")}</a>
                  {g.lastSessionId && <a href={`#/games/${g.id}/results/${g.lastSessionId}`} className="inline-flex min-h-11 items-center rounded-xl border border-line px-4 text-sm font-semibold">{t("mob.results")}</a>}
                  <Button variant="ghost" size="sm" className="ms-auto" onClick={() => remove(g.id)}>{t("mob.delete")}</Button>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
      <p className="text-center text-xs text-muted">{t("mob.offline")}</p>
    </div>
  );
}
