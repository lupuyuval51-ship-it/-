import Link from "next/link";
import { Badge, Card, ProgressBar, Stars } from "@/components/ui";
import type { GameCard } from "@/server/games/library";
import type { DictKey, TFn } from "@/lib/i18n";
import { GeneratorBadge } from "./GameBadges";

const ICON: Record<string, string> = { exploration: "🧭", puzzle: "🧩", platformer: "🦘", simulation: "🧪", adventure: "🗺️" };

export function GameCardView({ game, t }: { game: GameCard; t: TFn }) {
  const p = game.progress;
  return (
    <Card className="flex h-full flex-col gap-3" data-testid="game-card">
      <div className="flex items-start gap-3">
        <span aria-hidden className="grid size-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-neon/20 to-violet/30 text-2xl">{ICON[game.gameType] ?? "🎮"}</span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold" title={game.title}>{game.title}</h3>
          <p className="truncate text-sm text-muted">{game.subject}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        <Badge>{t(`gameType.${game.gameType}` as DictKey)}</Badge>
        <Badge>{t(`difficulty.${game.difficulty}` as DictKey)}</Badge>
        <GeneratorBadge kind={game.generator.kind} provider={game.generator.provider} t={t} />
      </div>
      <p className="text-xs text-muted">{t("lib.meta", { areas: game.areas, missions: game.missions, challenges: game.challenges })}</p>
      {p && (
        <div className="space-y-1.5">
          {p.inProgress && <ProgressBar value={p.percent} label={t("lib.progress", { n: p.percent })} />}
          <div className="flex items-center justify-between text-xs text-muted">
            <span>{p.inProgress ? t("lib.progress", { n: p.percent }) : t("lib.best", { score: p.bestScore })}</span>
            {p.bestStars > 0 && <Stars n={p.bestStars} size="sm" />}
          </div>
        </div>
      )}
      <div className="mt-auto flex gap-2 pt-1">
        <Link href={`/play/${game.id}`} data-testid="game-play" className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl bg-neon px-4 text-sm font-semibold text-ink-950 hover:bg-white">
          {p?.inProgress ? t("lib.continue") : t("lib.play")}
        </Link>
        <Link href={`/games/${game.id}`} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-line px-4 text-sm font-semibold hover:bg-white/10">
          {t("lib.details")}
        </Link>
      </div>
    </Card>
  );
}
