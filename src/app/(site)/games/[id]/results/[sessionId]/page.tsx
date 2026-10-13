import { notFound } from "next/navigation";
import { ResultsView } from "@/components/games/ResultsView";
import { requireUser } from "@/server/auth/current";
import { getSessionResults } from "@/server/games/play";
import { getT } from "@/server/i18n";
import { titleFor } from "@/components/layout/pageTitle";

export const generateMetadata = titleFor("res.title");
export const dynamic = "force-dynamic";

export default async function ResultsPage({ params }: { params: Promise<{ id: string; sessionId: string }> }) {
  const { id, sessionId } = await params;
  const user = await requireUser(`/games/${id}/results/${sessionId}`);
  const { t } = await getT();
  const r = await getSessionResults(user.id, sessionId);
  if (!r || r.game.id !== id) notFound();
  const { summary: s, spec, game } = r;
  return <ResultsView t={t} s={s} game={game} sessionId={sessionId} conclusion={spec.learning.conclusion} review={r.review} />;
}
