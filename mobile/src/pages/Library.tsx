import { useState } from "react";
import { useT } from "@/components/I18nProvider";
import { GeneratorBadge } from "@/components/games/GameBadges";
import { Badge, Button, Card, Stars } from "@/components/ui";
import { store } from "../app-state";

export function LibraryPage() {
  const t = useT();
  const [games, setGames] = useState(() => store.listGames());
  const remove = (id: string) => {
    if (!window.confirm(t("mob.delete.confirm"))) return;
    store.deleteGame(id);
    setGames(store.listGames());
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
      <a href="#/create" data-testid="mobile-new" className="flex min-h-14 items-center justify-center rounded-2xl bg-neon text-lg font-bold text-ink-950">+ {t("mob.new")}</a>
      <h2 className="text-lg font-semibold">{t("lib.title")}</h2>
      {games.length === 0 ? (
        <Card className="space-y-1 text-center" data-testid="mobile-empty">
          <p className="font-semibold">{t("lib.empty.title")}</p>
          <p className="text-sm text-muted">{t("lib.empty.text")}</p>
        </Card>
      ) : (
        <ul className="space-y-3">
          {games.map((g) => (
            <li key={g.id}>
              <Card className="space-y-3" data-testid="mobile-game">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 dir="auto" className="me-auto text-lg font-semibold">{g.title}</h3>
                  <GeneratorBadge kind={g.generatorKind} provider={g.generatorKind} t={t} />
                  {g.inProgress && <Badge tone="neon">{t("lib.progress")}</Badge>}
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
