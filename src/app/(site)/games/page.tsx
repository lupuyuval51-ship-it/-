import Link from "next/link";
import { primaryLink, StateView } from "@/components/ui/StateView";
import { Card } from "@/components/ui";
import { toCardData } from "@/components/games/GameCardView";
import { LibraryGrid } from "@/components/games/LibraryGrid";
import { requireUser } from "@/server/auth/current";
import { listGames } from "@/server/games/library";
import { getT } from "@/server/i18n";
import { titleFor } from "@/components/layout/pageTitle";

export const generateMetadata = titleFor("lib.title");
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
        <Link href="/create" className="inline-flex min-h-11 items-center rounded-xl bg-neon px-5 text-sm font-semibold text-ink-950 hover:brightness-110">{t("nav.create")}</Link>
      </header>
      {games.length === 0 ? (
        <Card elevation="flat" className="py-2">
          <StateView kind="empty" data-testid="lib-empty" title={t("lib.empty.title")} text={t("lib.empty.text")} actions={<Link href="/create" className={primaryLink}>{t("lib.empty.cta")}</Link>} />
        </Card>
      ) : (
        <LibraryGrid games={games.map(toCardData)} />
      )}
    </div>
  );
}
