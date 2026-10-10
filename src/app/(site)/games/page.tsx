import Link from "next/link";
import { Card } from "@/components/ui";
import { GameCardView } from "@/components/games/GameCardView";
import { requireUser } from "@/server/auth/current";
import { listGames } from "@/server/games/library";
import { getT } from "@/server/i18n";

export const metadata = { title: "My games" };
export const dynamic = "force-dynamic";

export default async function LibraryPage() {
  const user = await requireUser("/games");
  const { t } = await getT();
  const games = await listGames(user.id);
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold">{t("lib.title")}</h1>
          <p className="text-muted">{t("lib.subtitle")}</p>
        </div>
        <Link href="/create" className="inline-flex min-h-11 items-center rounded-xl bg-neon px-5 text-sm font-semibold text-ink-950 hover:bg-white">{t("nav.create")}</Link>
      </header>
      {games.length === 0 ? (
        <Card className="space-y-3 py-12 text-center" data-testid="lib-empty">
          <p className="text-lg font-semibold">{t("lib.empty.title")}</p>
          <p className="text-sm text-muted">{t("lib.empty.text")}</p>
          <div><Link href="/create" className="inline-flex min-h-11 items-center rounded-xl bg-neon px-5 text-sm font-semibold text-ink-950 hover:bg-white">{t("lib.empty.cta")}</Link></div>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" data-testid="lib-grid">{games.map((g) => <GameCardView key={g.id} game={g} t={t} />)}</div>
      )}
    </div>
  );
}
