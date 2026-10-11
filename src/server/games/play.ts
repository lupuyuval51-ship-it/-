import { buildReview } from "@/lib/game/state/review";
import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { RENDER_PROFILES, type RenderProfile } from "@/config/graphics";
import { PLANS, resolveGraphicsTier, type GraphicsTier, type PlanId } from "@/config/plans";
import { toPublicSpec, type PublicSpec } from "@/lib/game/spec/public";
import type { GameSpec } from "@/lib/game/spec/schema";
import { processEvent, GameEventError, type GameEvent } from "@/lib/game/state/events";
import { initialState, maxScore, recompute, summarize, toClientState, type ClientState, type LearningSummary, type PlayState } from "@/lib/game/state/progress";
import { resolveEntitlement } from "../allowance/entitlement";
import { db, type Tx } from "../db";
import { getEnv } from "../env";
import { ApiError, Errors } from "../http/errors";

export interface PlaySessionStart {
  sessionId: string;
  resumed: boolean;
  game: { id: string; title: string; revision: number; generator: { kind: string; provider: string } };
  spec: PublicSpec;
  state: ClientState;
  maxScore: number;
  render: { tier: GraphicsTier; plan: PlanId; profile: RenderProfile; requested: GraphicsTier };
  testHooks: boolean;
}

/**
 * The tier a player gets is decided HERE from the persisted plan — never from anything the browser sends.
 * A stored preference above the plan's entitlement (e.g. after a downgrade) is clamped.
 */
export async function resolveRender(userId: string, now = new Date()): Promise<PlaySessionStart["render"]> {
  const [ent, profile] = await Promise.all([resolveEntitlement(userId, now), db.userProfile.findUnique({ where: { userId } })]);
  const requested: GraphicsTier = profile?.graphicsPreference ?? PLANS[ent.plan].graphics.defaultTier;
  const tier = resolveGraphicsTier(ent.plan, requested);
  return { tier, plan: ent.plan, requested, profile: RENDER_PROFILES[tier] };
}

async function completeSession(tx: Tx, session: { id: string; userId: string; gameId: string }, state: PlayState, summary: LearningSummary, now: Date): Promise<void> {
  await tx.playSession.update({
    where: { id: session.id },
    data: { status: "COMPLETED", finishedAt: now, score: summary.score, stars: summary.stars, state: state as unknown as Prisma.InputJsonValue },
  });
  const existing = await tx.gameProgress.findUnique({ where: { userId_gameId: { userId: session.userId, gameId: session.gameId } } });
  const achievements = [...new Set([...(existing?.achievements ?? []), ...summary.achievements])];
  await tx.gameProgress.upsert({
    where: { userId_gameId: { userId: session.userId, gameId: session.gameId } },
    create: { userId: session.userId, gameId: session.gameId, bestScore: summary.score, bestStars: summary.stars, completions: 1, achievements, lastPlayedAt: now },
    update: {
      bestScore: Math.max(existing?.bestScore ?? 0, summary.score), bestStars: Math.max(existing?.bestStars ?? 0, summary.stars),
      completions: { increment: 1 }, achievements, lastPlayedAt: now,
    },
  });
}

export async function startPlaySession(userId: string, gameId: string, opts: { restart?: boolean; now?: Date } = {}): Promise<PlaySessionStart> {
  const now = opts.now ?? new Date();
  const game = await db.game.findFirst({ where: { id: gameId, ownerId: userId, deletedAt: null } });
  if (!game) throw Errors.notFound("Game not found.");
  const spec = game.spec as unknown as GameSpec;
  const render = await resolveRender(userId, now);

  const session = await db.$transaction(async (tx) => {
    // Serialise concurrent starts for the same game (double-clicks, two tabs).
    await tx.$queryRaw`SELECT "id" FROM "Game" WHERE "id" = ${gameId} FOR UPDATE`;
    const active = await tx.playSession.findFirst({ where: { userId, gameId, status: "ACTIVE" } });
    if (active && opts.restart) await tx.playSession.update({ where: { id: active.id }, data: { status: "ABANDONED", finishedAt: now } });
    if (active && !opts.restart) {
      let state = active.state as unknown as PlayState;
      // The game may have been extended or edited since: progress ids stay valid, the session just follows the new revision.
      if (active.revision !== game.revision) {
        state = structuredClone(state);
        recompute(spec, state);
      }
      const updated = await tx.playSession.update({
        where: { id: active.id },
        data: { tier: render.tier, revision: game.revision, maxScore: maxScore(spec), state: state as unknown as Prisma.InputJsonValue },
      });
      if (state.finished) {
        await completeSession(tx, updated, state, summarize(spec, state, now.getTime()), now);
        return { row: await tx.playSession.create({ data: await freshSessionData(userId, gameId, game.revision, render.tier, spec, now) }), resumed: false };
      }
      return { row: updated, resumed: true };
    }
    await tx.gameProgress.upsert({ where: { userId_gameId: { userId, gameId } }, create: { userId, gameId }, update: { lastPlayedAt: now } });
    return { row: await tx.playSession.create({ data: await freshSessionData(userId, gameId, game.revision, render.tier, spec, now) }), resumed: false };
  });

  const state = session.row.state as unknown as PlayState;
  return {
    sessionId: session.row.id,
    resumed: session.resumed,
    game: { id: game.id, title: game.title, revision: game.revision, generator: { kind: game.generatorKind, provider: game.generatorProvider } },
    spec: toPublicSpec(spec),
    state: toClientState(state),
    maxScore: session.row.maxScore,
    render,
    testHooks: getEnv().ENABLE_TEST_HOOKS,
  };
}

async function freshSessionData(userId: string, gameId: string, revision: number, tier: GraphicsTier, spec: GameSpec, now: Date) {
  return { gameId, userId, revision, tier, maxScore: maxScore(spec), state: initialState(spec, now.getTime()) as unknown as Prisma.InputJsonValue };
}

const STATE_ERRORS = new Set(["WRONG_AREA", "STATION_LOCKED", "PORTAL_LOCKED", "ALREADY_RESOLVED", "ALREADY_COLLECTED", "NOT_OPENED", "NOT_COMPLETE", "NO_PORTAL"]);

export interface PlayEventResponse {
  data: Record<string, unknown>;
  state: ClientState;
  newlyCompletedMissions: string[];
  newlyDefeatedBosses: string[];
  newAchievements: string[];
  completed: boolean;
  summary?: LearningSummary;
}

/** Apply one validated player event under a row lock so concurrent requests can never lose an update. */
export async function applyPlayEvent(userId: string, sessionId: string, event: GameEvent, now = new Date()): Promise<PlayEventResponse> {
  return db.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<{ id: string }[]>`SELECT "id" FROM "PlaySession" WHERE "id" = ${sessionId} AND "userId" = ${userId} FOR UPDATE`;
    if (rows.length === 0) throw Errors.notFound("Play session not found.");
    const session = await tx.playSession.findUniqueOrThrow({ where: { id: sessionId } });
    const game = await tx.game.findFirst({ where: { id: session.gameId, deletedAt: null } });
    if (!game) throw Errors.notFound("Game not found.");
    const spec = game.spec as unknown as GameSpec;
    const state = session.state as unknown as PlayState;

    if (session.status === "COMPLETED") {
      if (event.type === "finish") return { data: {}, state: toClientState(state), newlyCompletedMissions: [], newlyDefeatedBosses: [], newAchievements: [], completed: true, summary: summarize(spec, state, session.finishedAt?.getTime() ?? now.getTime()) };
      throw Errors.conflict("SESSION_COMPLETED", "This game session is already finished.");
    }
    if (session.status !== "ACTIVE") throw Errors.conflict("SESSION_ENDED", "This game session has ended. Start a new one.");
    if (session.revision !== game.revision) throw Errors.conflict("SESSION_STALE", "The game was changed. Reload to continue.");

    let result;
    try {
      result = processEvent(spec, state, event, { now: now.getTime(), seed: session.id });
    } catch (err) {
      if (err instanceof GameEventError) throw new ApiError(STATE_ERRORS.has(err.code) ? 409 : 400, err.code, err.message);
      throw err;
    }

    const next = result.state;
    await tx.playSession.update({
      where: { id: session.id },
      data: { state: next as unknown as Prisma.InputJsonValue, score: next.score, eventSeq: { increment: 1 } },
    });
    let summary: LearningSummary | undefined;
    if (next.finished) {
      summary = summarize(spec, next, now.getTime());
      await completeSession(tx, session, next, summary, now);
    }
    return {
      data: result.data, state: result.client, newlyCompletedMissions: result.newlyCompletedMissions, newlyDefeatedBosses: result.newlyDefeatedBosses, newAchievements: result.newAchievements,
      completed: next.finished, summary,
    };
  });
}

/** Results for a finished (or in-progress) session owned by the user. */
export async function getSessionResults(userId: string, sessionId: string) {
  const session = await db.playSession.findFirst({ where: { id: sessionId, userId }, include: { game: true } });
  if (!session || session.game.deletedAt) return null;
  const spec = session.game.spec as unknown as GameSpec;
  const state = session.state as unknown as PlayState;
  return { session, game: session.game, spec, summary: summarize(spec, state, (session.finishedAt ?? session.updatedAt).getTime()), review: buildReview(spec, state) };
}
