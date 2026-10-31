import "server-only";
import { toPublicSpec } from "@/lib/game/spec/public";
import type { GameSpec } from "@/lib/game/spec/schema";
import { buildUnityScene, type UnityScene } from "@/lib/game/unity/scene";
import { db } from "../db";
import { Errors } from "../http/errors";
import { resolveRender } from "./play";

/**
 * Scene description for the optional Unity renderer. The Unity client is a Tier A view: access is decided here from the
 * persisted plan, never from the client. The scene is built from the public spec (no challenge content).
 */
export async function getUnityScene(userId: string, gameId: string, areaId: string | null): Promise<UnityScene> {
  const game = await db.game.findFirst({ where: { id: gameId, ownerId: userId, deletedAt: null } });
  if (!game) throw Errors.notFound("Game not found.");
  const render = await resolveRender(userId);
  if (render.tier !== "A") throw Errors.forbidden("The Unity renderer is part of the highest graphics tier.", "TIER_REQUIRED");
  const spec = toPublicSpec(game.spec as unknown as GameSpec);
  const area = areaId ? spec.areas.find((a) => a.id === areaId) : spec.areas[0];
  if (!area) throw Errors.notFound("Area not found.");
  return buildUnityScene(spec, area.id);
}
