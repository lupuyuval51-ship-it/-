import { notFound } from "next/navigation";
import PlayClient from "@/components/game/PlayClient";
import { db } from "@/server/db";
import { requireUser } from "@/server/auth/current";

export const metadata = { title: "Play" };
export const dynamic = "force-dynamic";

export default async function PlayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(`/play/${id}`);
  const game = await db.game.findFirst({ where: { id, ownerId: user.id, deletedAt: null }, select: { id: true } });
  if (!game) notFound();
  return <PlayClient gameId={game.id} soundDefault={user.soundEnabled} musicDefault={user.musicEnabled} />;
}
