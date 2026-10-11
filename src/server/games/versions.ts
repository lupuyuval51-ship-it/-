import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import type { GameSpec } from "@/lib/game/spec/schema";
import { db, type Tx } from "../db";
import { ApiError, Errors } from "../http/errors";
import { getCapabilities, type Capabilities } from "./capabilities";

export interface RevisionInfo {
  revision: number;
  reason: string;
  note: string | null;
  title: string;
  createdAt: Date;
  current: boolean;
}

/** Keep the newest `keep` versions of a game (the current one included); older ones are removed. */
export async function pruneRevisions(tx: Tx, gameId: string, current: number, keep: number): Promise<void> {
  await tx.gameRevision.deleteMany({ where: { gameId, revision: { lte: current - Math.max(1, keep) } } });
}

/**
 * Version history of one of the caller's games. Plans without version history get `revisions: null` (the UI shows
 * what the feature is and which plan unlocks it) — the list itself is never returned to them.
 */
export async function listRevisions(userId: string, gameId: string): Promise<{ capabilities: Capabilities; revisions: RevisionInfo[] | null }> {
  const game = await db.game.findFirst({ where: { id: gameId, ownerId: userId, deletedAt: null }, select: { id: true, revision: true } });
  if (!game) throw Errors.notFound("Game not found.");
  const { caps, features } = await getCapabilities(userId);
  if (!features.versionHistory) return { capabilities: caps, revisions: null };
  const rows = await db.gameRevision.findMany({ where: { gameId }, orderBy: { revision: "desc" }, take: features.versionsKept });
  return {
    capabilities: caps,
    revisions: rows.map((r) => ({ revision: r.revision, reason: r.reason, note: r.note, title: (r.spec as unknown as GameSpec).meta.title, createdAt: r.createdAt, current: r.revision === game.revision })),
  };
}

/**
 * Restore an earlier version. Never destructive: the old content becomes a NEW latest version, so the version
 * being replaced stays in the history and the restore itself can be undone.
 */
export async function restoreRevision(userId: string, gameId: string, revision: number): Promise<{ revision: number; capabilities: Capabilities }> {
  const { features } = await getCapabilities(userId);
  if (!features.versionHistory) {
    throw new ApiError(403, "FEATURE_LOCKED", "Restoring earlier versions is available on Plus and Pro.", { feature: "versionHistory", requiredPlan: "PLUS" });
  }
  const next = await db.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<{ revision: number; deletedAt: Date | null; ownerId: string }[]>`SELECT "revision", "deletedAt", "ownerId" FROM "Game" WHERE "id" = ${gameId} FOR UPDATE`;
    const row = rows[0];
    if (!row || row.deletedAt || row.ownerId !== userId) throw Errors.notFound("Game not found.");
    if (revision === row.revision) throw Errors.conflict("ALREADY_CURRENT", "That is already the current version.");
    const old = await tx.gameRevision.findUnique({ where: { gameId_revision: { gameId, revision } } });
    if (!old) throw Errors.notFound("That version no longer exists.");
    const spec = old.spec as unknown as GameSpec;
    const json = old.spec as Prisma.InputJsonValue;
    const n = row.revision + 1;
    await tx.game.update({ where: { id: gameId }, data: { spec: json, revision: n, title: spec.meta.title } });
    await tx.gameRevision.create({ data: { gameId, revision: n, reason: "restore", note: `v${revision}`, spec: json } });
    await pruneRevisions(tx, gameId, n, features.versionsKept);
    return n;
  });
  const { caps } = await getCapabilities(userId);
  return { revision: next, capabilities: caps };
}
