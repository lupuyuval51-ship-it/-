import Link from "next/link";
import { GameTypeIcon } from "@/components/ui/icons";
import { Badge, Card, ProgressBar, Stars } from "@/components/ui";
import type { GameCard } from "@/server/games/library";
import type { DictKey, TFn } from "@/lib/i18n";
import { GeneratorBadge } from "./GameBadges";


/** What a card needs. Deliberately without provider/model names, so it can also be handed to client components. */
export type GameCardData = Pick<GameCard, "id" | "title" | "subject" | "gameType" | "difficulty" | "areas" | "missions" | "challenges"> & {
  generator: { kind: string };
  progress: Pick<NonNullable<GameCard["progress"]>, "bestScore" | "bestStars" | "inProgress" | "percent"> | null;
};

export function toCardData(g: GameCard): GameCardData {
  return {
    id: g.id, title: g.title, subject: g.subject, gameType: g.gameType, difficulty: g.difficulty, areas: g.areas, missions: g.missions, challenges: g.challenges,
    generator: { kind: g.generator.kind },
    progress: g.progress && { bestScore: g.progress.bestScore, bestStars: g.progress.bestStars, inProgress: g.progress.inProgress, percent: g.progress.percent },
  };
}

export function GameCardView({ game, t }: { game: GameCardData; t: TFn }) {
  const p = game.progress;
  return (
    <Card interactive className="flex h-full flex-col gap-3" data-testid="game-card">
      <div className="flex items-start gap-3">
        <span aria-hidden className="grid size-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-neon/20 to-violet/30 text-neon"><GameTypeIcon type={game.gameType} className="size-6" /></span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold" title={game.title}>{game.title}</h3>
          <p className="truncate text-sm text-muted">{game.subject}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        <Badge>{t(`gameType.${game.gameType}` as DictKey)}</Badge>
        <Badge>{t(`difficulty.${game.difficulty}` as DictKey)}</Badge>
        <GeneratorBadge kind={game.generator.kind} t={t} />
      </div>
      <p className="text-xs text-muted">{t("lib.meta", { areas: game.areas, missions: game.missions, challenges: game.challenges })}</p>
      {p && (
        <div className="space-y-1.5">
          {p.inProgress && <ProgressBar value={p.percent} label={t("lib.progress", { n: p.percent })} />}
          <div className="flex items-center justify-between text-xs text-muted">
            <span>{p.inProgress ? t("lib.progress", { n: p.percent }) : t("lib.best", { score: p.bestScore })}</span>
            {p.bestStars > 0 && <Stars n={p.bestStars} size="sm" label={t("common.stars", { n: p.bestStars })} />}
          </div>
        </div>
      )}
      <div className="mt-auto flex gap-2 pt-1">
        <Link href={`/play/${game.id}`} data-testid="game-play" aria-label={`${p?.inProgress ? t("lib.continue") : t("lib.play")}: ${game.title}`} className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl bg-neon px-4 text-sm font-semibold text-ink-950 hover:brightness-110">
          {p?.inProgress ? t("lib.continue") : t("lib.play")}
        </Link>
        <Link href={`/games/${game.id}`} aria-label={`${t("lib.details")}: ${game.title}`} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-line px-4 text-sm font-semibold hover:bg-text/10">
          {t("lib.details")}
        </Link>
      </div>
    </Card>
  );
}
