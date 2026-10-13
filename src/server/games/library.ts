import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { planUnlocking } from "@/config/plans";
import type { Mechanic } from "@/lib/game/spec/constants";
import { mechanicsForArea } from "@/lib/game/spec/mechanics";
import type { GameSpec } from "@/lib/game/spec/schema";
import { mechanicAllowed, mechanicFeature } from "@/lib/game/spec/tier";
import { validateGameSpec } from "@/lib/game/spec/validate";
import { toPublicSpec } from "@/lib/game/spec/public";
import { maxScore, type PlayState } from "@/lib/game/state/progress";
import { stableStringify } from "@/lib/game/util/stable";
import { db } from "../db";
import { ApiError, Errors } from "../http/errors";
import { getCapabilities } from "./capabilities";
import { featureTierForPlan } from "./feature-tier";

export interface GameCard {
  id: string;
  title: string;
  subject: string;
  gameType: string;
  difficulty: string;
  language: string;
  createdVia: string;
  generator: { kind: string; provider: string; model: string };
  revision: number;
  createdAt: Date;
  updatedAt: Date;
  areas: number;
  missions: number;
  challenges: number;
  progress: { bestScore: number; bestStars: number; completions: number; lastPlayedAt: Date; inProgress: boolean; percent: number } | null;
}

export async function listGames(userId: string): Promise<GameCard[]> {
  const games = await db.game.findMany({
    where: { ownerId: userId, deletedAt: null }, orderBy: { updatedAt: "desc" },
    include: { progress: { where: { userId } }, playSessions: { where: { userId, status: "ACTIVE" }, take: 1 } },
  });
  return games.map((g) => {
    const spec = g.spec as unknown as GameSpec;
    const p = g.progress[0];
    const active = g.playSessions[0];
    const st = active?.state as unknown as PlayState | undefined;
    const done = st ? st.missionsDone.length / Math.max(1, spec.missions.length) : 0;
    return {
      id: g.id, title: g.title, subject: g.subject, gameType: g.gameType, difficulty: g.difficulty, language: g.language, createdVia: g.createdVia,
      generator: { kind: g.generatorKind, provider: g.generatorProvider, model: g.generatorModel }, revision: g.revision, createdAt: g.createdAt, updatedAt: g.updatedAt,
      areas: spec.areas.length, missions: spec.missions.length, challenges: spec.challenges.length,
      progress: p ? { bestScore: p.bestScore, bestStars: p.bestStars, completions: p.completions, lastPlayedAt: p.lastPlayedAt, inProgress: Boolean(active), percent: Math.round(done * 100) } : null,
    };
  });
}

/** Details for the owner. Never includes challenge content, answers or solutions. */
export async function getGameDetails(userId: string, gameId: string) {
  const game = await db.game.findFirst({ where: { id: gameId, ownerId: userId, deletedAt: null }, include: { progress: { where: { userId } }, revisions: { orderBy: { revision: "desc" }, select: { revision: true, reason: true, createdAt: true } } } });
  if (!game) throw Errors.notFound("Game not found.");
  const spec = game.spec as unknown as GameSpec;
  const active = await db.playSession.findFirst({ where: { userId, gameId, status: "ACTIVE" } });
  const recent = await db.playSession.findMany({ where: { userId, gameId, status: "COMPLETED" }, orderBy: { finishedAt: "desc" }, take: 5, select: { id: true, score: true, maxScore: true, stars: true, finishedAt: true } });
  return {
    game: {
      id: game.id, title: game.title, subject: game.subject, gameType: game.gameType, difficulty: game.difficulty, language: game.language, createdVia: game.createdVia,
      generator: { kind: game.generatorKind, provider: game.generatorProvider, model: game.generatorModel }, revision: game.revision, createdAt: game.createdAt, updatedAt: game.updatedAt,
      featureTier: spec.meta.featureTier ?? null,
    },
    overview: {
      tagline: spec.meta.tagline, estimatedMinutes: spec.meta.estimatedMinutes, environment: spec.theme.environment, timeOfDay: spec.theme.timeOfDay,
      goal: spec.learning.goal, objectives: spec.learning.objectives, mechanics: spec.mechanics,
      areas: spec.areas.map((a) => ({ id: a.id, name: a.name, layout: a.layout, stations: a.stations.length, mechanics: [...mechanicsForArea(spec, a.id)] })),
      missions: spec.missions.map((m) => ({ id: m.id, title: m.title, areaId: m.areaId, objectives: m.objectives.map((o) => o.text) })),
      concepts: [...new Set(spec.challenges.map((c) => c.concept))],
      challengeTypes: [...new Set(spec.challenges.map((c) => c.type))],
      maxScore: maxScore(spec),
    },
    progress: game.progress[0] ?? null,
    inProgress: active ? { sessionId: active.id, score: active.score, missionsDone: (active.state as unknown as PlayState).missionsDone.length, totalMissions: spec.missions.length } : null,
    recent,
    revisions: game.revisions,
    preview: { areas: toPublicSpec(spec).areas.length },
  };
}

export interface GameEdit {
  title?: string;
  timeOfDay?: "day" | "dusk" | "night";
  /** Toggle optional mechanics that don't need new content. */
  mechanics?: Partial<Record<"adaptive_difficulty" | "timed_bonus" | "hazards" | "checkpoints", boolean>>;
}

/**
 * Supported no-AI modification workflow: rename, change time of day, toggle optional mechanics.
 * Renaming is cosmetic (no new revision). Anything that changes gameplay bumps the revision and keeps history,
 * and the edited spec goes through the same full validation as a generated one.
 */
export async function editGame(userId: string, gameId: string, edit: GameEdit) {
  // Switching a mechanic ON is a feature of the plan's tier like any other: the saved game must not gain what the plan lacks.
  const switchingOn = Object.entries(edit.mechanics ?? {}).filter(([, on]) => on).map(([m]) => m as Mechanic);
  const planTier = switchingOn.length ? featureTierForPlan((await getCapabilities(userId)).ent.plan) : "A";
  return db.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<{ id: string }[]>`SELECT "id" FROM "Game" WHERE "id" = ${gameId} AND "ownerId" = ${userId} AND "deletedAt" IS NULL FOR UPDATE`;
    if (rows.length === 0) throw Errors.notFound("Game not found.");
    const game = await tx.game.findUniqueOrThrow({ where: { id: gameId } });
    const spec = structuredClone(game.spec as unknown as GameSpec);
    let gameplayChanged = false;

    if (edit.title !== undefined) spec.meta.title = edit.title;
    if (edit.timeOfDay && edit.timeOfDay !== spec.theme.timeOfDay) {
      spec.theme.timeOfDay = edit.timeOfDay;
    }
    for (const [mech, on] of Object.entries(edit.mechanics ?? {}) as [keyof NonNullable<GameEdit["mechanics"]>, boolean][]) {
      const has = spec.mechanics.includes(mech);
      if (on && !has) {
        if (!mechanicAllowed(planTier, mech)) {
          const feature = mechanicFeature(mech)!;
          throw new ApiError(403, "FEATURE_TIER_LOCKED", `The "${mech}" mechanic is not part of your plan's game features.`, { feature, requiredPlan: planUnlocking(feature), tier: planTier });
        }
        spec.mechanics.push(mech);
        gameplayChanged = true;
      }
      if (!on && has) {
        spec.mechanics = spec.mechanics.filter((m) => m !== mech);
        gameplayChanged = true;
      }
    }
    const res = validateGameSpec(spec);
    if (!res.ok) throw Errors.badRequest("That change would make the game invalid.", res.errors);
    const final = res.spec;
    final.meta.generator = spec.meta.generator;
    const json = final as unknown as Prisma.InputJsonValue;
    const themeChanged = stableStringify(final.theme) !== stableStringify((game.spec as unknown as GameSpec).theme);
    if (!gameplayChanged && !themeChanged) {
      await tx.game.update({ where: { id: gameId }, data: { title: final.meta.title, spec: json } });
      return { revision: game.revision };
    }
    const next = game.revision + 1;
    await tx.game.update({ where: { id: gameId }, data: { title: final.meta.title, spec: json, revision: next } });
    await tx.gameRevision.create({ data: { gameId, revision: next, reason: "edit", spec: json } });
    return { revision: next };
  });
}

export async function deleteGame(userId: string, gameId: string): Promise<void> {
  const { count } = await db.game.updateMany({ where: { id: gameId, ownerId: userId, deletedAt: null }, data: { deletedAt: new Date() } });
  if (count === 0) throw Errors.notFound("Game not found.");
  await db.playSession.updateMany({ where: { gameId, userId, status: "ACTIVE" }, data: { status: "ABANDONED", finishedAt: new Date() } });
}

export async function resetProgress(userId: string, gameId: string): Promise<void> {
  const game = await db.game.findFirst({ where: { id: gameId, ownerId: userId, deletedAt: null }, select: { id: true } });
  if (!game) throw Errors.notFound("Game not found.");
  await db.$transaction([
    db.playSession.updateMany({ where: { gameId, userId, status: "ACTIVE" }, data: { status: "ABANDONED", finishedAt: new Date() } }),
    db.gameProgress.deleteMany({ where: { gameId, userId } }),
  ]);
}
