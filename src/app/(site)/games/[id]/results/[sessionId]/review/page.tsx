import { notFound } from "next/navigation";
import { ReviewView } from "@/components/games/ReviewView";
import { requireUser } from "@/server/auth/current";
import { getSessionResults } from "@/server/games/play";
import { getT } from "@/server/i18n";

export const metadata = { title: "Review your mistakes" };
export const dynamic = "force-dynamic";

export default async function ReviewPage({ params }: { params: Promise<{ id: string; sessionId: string }> }) {
  const { id, sessionId } = await params;
  const user = await requireUser(`/games/${id}/results/${sessionId}/review`);
  const { t } = await getT();
  const r = await getSessionResults(user.id, sessionId);
  if (!r || r.game.id !== id) notFound();
  return <ReviewView t={t} id={id} sessionId={sessionId} review={r.review} />;
}
