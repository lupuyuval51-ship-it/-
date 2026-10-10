import { notFound, redirect } from "next/navigation";
import { PracticeClient } from "@/components/game/PracticeClient";
import { requireUser } from "@/server/auth/current";
import { getSessionResults } from "@/server/games/play";

export const metadata = { title: "Practise your mistakes" };
export const dynamic = "force-dynamic";

export default async function PracticePage({ params }: { params: Promise<{ id: string; sessionId: string }> }) {
  const { id, sessionId } = await params;
  const user = await requireUser(`/games/${id}/results/${sessionId}/practice`);
  const r = await getSessionResults(user.id, sessionId);
  if (!r || r.game.id !== id) notFound();
  if (r.review.length === 0) redirect(`/games/${id}/results/${sessionId}/review`);
  return <PracticeClient gameId={id} sessionId={sessionId} />;
}
