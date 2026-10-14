import { afterAll, afterEach, describe, expect, it } from "vitest";
import { POST as startRoute } from "@/app/api/games/[id]/session/route";
import { POST as eventRoute } from "@/app/api/play/[sessionId]/events/route";
import { GET as detailsRoute, PATCH as editRoute, DELETE as deleteRoute } from "@/app/api/games/[id]/route";
import { GET as listRoute } from "@/app/api/games/route";
import { DELETE as resetRoute } from "@/app/api/games/[id]/progress/route";
import { RENDER_PROFILES } from "@/config/graphics";
import { db, disconnectDb } from "@/server/db";
import { setBackendForTests } from "@/server/ai/registry";
import { getSessionResults } from "@/server/games/play";
import type { GameSpec } from "@/lib/game/spec/schema";
import { findArea, stationActive, collectibleIds, type ClientState, type PlayState } from "@/lib/game/state/progress";
import { answerSeed } from "@/server/games/answer-seed";
import { setFeatureTierForTests } from "@/server/games/feature-tier";
import { correctAnswer } from "../unit/helpers";
import { createTestUser, grantSubscription, makeRequest, readJson, type TestUser } from "./helpers";
import { makeGame } from "./helpers-ai";

afterAll(disconnectDb);
afterEach(() => setBackendForTests(null));

interface Started { sessionId: string; resumed: boolean; spec: Record<string, unknown> & { challenges: unknown[]; areas: { id: string }[] }; state: ClientState; render: { tier: string; plan: string; profile: Record<string, unknown> }; maxScore: number }

async function start(user: TestUser, gameId: string, body: object = {}) {
  const res = await startRoute(makeRequest("POST", `/api/games/${gameId}/session`, { cookie: user.cookie, body }), { params: Promise.resolve({ id: gameId }) });
  return { res, data: (res.status === 200 ? await readJson<Started>(res) : await readJson<{ error: { code: string } }>(res)) as Started & { error?: { code: string } } };
}
async function send(user: TestUser, sessionId: string, event: object) {
  const res = await eventRoute(makeRequest("POST", `/api/play/${sessionId}/events`, { cookie: user.cookie, body: event }), { params: Promise.resolve({ sessionId }) });
  return { status: res.status, body: await readJson<Record<string, any>>(res) }; // eslint-disable-line @typescript-eslint/no-explicit-any
}

describe("graphics tiers are decided by the server from the persisted plan", () => {
  it("FREE gets B/C only — a stored preference of A is clamped, C is honoured", async () => {
    const u = await createTestUser();
    const game = await makeGame(u.id);
    await db.userProfile.update({ where: { userId: u.id }, data: { graphicsPreference: "A" } });
    const a = await start(u, game.id);
    expect(a.data.render).toMatchObject({ tier: "B", plan: "FREE" });
    expect(a.data.render.profile).toEqual(RENDER_PROFILES.B);
    await db.userProfile.update({ where: { userId: u.id }, data: { graphicsPreference: "C" } });
    expect((await start(u, game.id)).data.render).toMatchObject({ tier: "C" });
  });

  it("PLUS and PRO both get Tier A with the identical render profile", async () => {
    const plus = await createTestUser();
    const pro = await createTestUser();
    await grantSubscription(plus.id, "PLUS");
    await grantSubscription(pro.id, "PRO");
    await db.userProfile.updateMany({ where: { userId: { in: [plus.id, pro.id] } }, data: { graphicsPreference: "A" } });
    const gp = await makeGame(plus.id);
    const gr = await makeGame(pro.id);
    const p1 = await start(plus, gp.id);
    const p2 = await start(pro, gr.id);
    expect(p1.data.render).toMatchObject({ tier: "A", plan: "PLUS" });
    expect(p2.data.render).toMatchObject({ tier: "A", plan: "PRO" });
    expect(p1.data.render.profile).toEqual(p2.data.render.profile);
  });

  it("downgrading (cancelled subscription) takes Tier A away on the very next session start", async () => {
    const u = await createTestUser();
    await grantSubscription(u.id, "PLUS");
    await db.userProfile.update({ where: { userId: u.id }, data: { graphicsPreference: "A" } });
    const game = await makeGame(u.id);
    expect((await start(u, game.id)).data.render.tier).toBe("A");
    await grantSubscription(u.id, "PLUS", { status: "CANCELED" });
    const after = await start(u, game.id);
    expect(after.data.render).toMatchObject({ tier: "B", plan: "FREE" });
    expect(after.data.render.profile).toEqual(RENDER_PROFILES.B);
  });
});

describe("play sessions", () => {
  it("requires auth and ownership; the browser receives the world but no challenge content", async () => {
    const owner = await createTestUser();
    const other = await createTestUser();
    const game = await makeGame(owner.id);
    const anon = await startRoute(makeRequest("POST", `/api/games/${game.id}/session`, { body: {} }), { params: Promise.resolve({ id: game.id }) });
    expect(anon.status).toBe(401);
    expect((await start(other, game.id)).res.status).toBe(404);
    const { data } = await start(owner, game.id);
    expect(data.spec.challenges).toEqual([]);
    expect(data.spec.areas.length).toBeGreaterThan(0);
    const raw = JSON.stringify(data);
    for (const secret of ["correctOptionId", "commonMistakes", "explanation", "feedback", '"solution"']) expect(raw).not.toContain(secret);
  });

  it("opening a station returns the challenge WITHOUT its answer key; hints cost points; wrong then right works", async () => {
    const u = await createTestUser();
    const game = await makeGame(u.id);
    const { data } = await start(u, game.id);
    const opened = await send(u, data.sessionId, { type: "open", stationId: "s-var1" });
    expect(opened.status).toBe(200);
    const challenge = opened.body.data.challenge as { id: string; options: { id: string; text: string }[] };
    // the demo moves the right answer around: find the options by what they say
    const optionId = (text: RegExp) => challenge.options.find((o) => text.test(o.text))!.id;
    expect(challenge.id).toBe("c-var1");
    const dump = JSON.stringify(opened.body);
    for (const secret of ["correctOptionId", "feedback", "explanation", '"hint"']) expect(dump).not.toContain(secret);
    const wrong = await send(u, data.sessionId, { type: "answer", stationId: "s-var1", answer: { type: "choice", optionId: optionId(/repeats code/i) } });
    expect(wrong.body.data.result).toMatchObject({ correct: false, resolved: false, attemptsLeft: 2 });
    expect(wrong.body.data.result.feedback).toMatch(/loop/i);
    const hint = await send(u, data.sessionId, { type: "hint", stationId: "s-var1" });
    expect(hint.body.data.hint).toMatch(/box/i);
    const right = await send(u, data.sessionId, { type: "answer", stationId: "s-var1", answer: { type: "choice", optionId: optionId(/named box/i) } });
    expect(right.body.data.result).toMatchObject({ correct: true, resolved: true });
    expect(right.body.data.result.explanation).toBeTruthy();
    expect(right.body.state.resolvedStations["s-var1"]).toBe("correct");
    expect(right.body.state.score).toBeGreaterThan(0);
    expect(right.body.state.score).toBeLessThan(100); // second attempt + hint: never the full 100
  });

  it("server rejects cheating attempts over HTTP and never trusts client-supplied points", async () => {
    const u = await createTestUser();
    const game = await makeGame(u.id);
    const { data } = await start(u, game.id);
    expect((await send(u, data.sessionId, { type: "answer", stationId: "s-var1", answer: { type: "choice", optionId: "a" } })).body.error.code).toBe("NOT_OPENED");
    expect((await send(u, data.sessionId, { type: "open", stationId: "s-cond1" })).status).toBe(409);
    expect((await send(u, data.sessionId, { type: "collect", itemId: "made-up" })).status).toBe(400);
    expect((await send(u, data.sessionId, { type: "enter_area", areaId: "a-lab" })).status).toBe(409);
    expect((await send(u, data.sessionId, { type: "finish" })).status).toBe(409);
    const withScore = await send(u, data.sessionId, { type: "collect", itemId: "a-plaza:c0", score: 999999 } as object);
    expect(withScore.body.state.score).toBe(10);
    expect((await send(u, data.sessionId, { type: "whatever" })).status).toBe(400);
  });

  it("another user cannot post events into my session", async () => {
    const a = await createTestUser();
    const b = await createTestUser();
    const game = await makeGame(a.id);
    const { data } = await start(a, game.id);
    expect((await send(b, data.sessionId, { type: "collect", itemId: "a-plaza:c0" })).status).toBe(404);
  });

  it("parallel duplicate events can't double-count: 10 simultaneous 'collect' → one success; 6 simultaneous correct answers → one score", async () => {
    const u = await createTestUser();
    const game = await makeGame(u.id);
    const { data } = await start(u, game.id);
    const collects = await Promise.all(Array.from({ length: 10 }, () => send(u, data.sessionId, { type: "collect", itemId: "a-plaza:c1" })));
    expect(collects.filter((r) => r.status === 200)).toHaveLength(1);
    const opened = await send(u, data.sessionId, { type: "open", stationId: "s-var1" });
    const rightId = (opened.body.data.challenge as { options: { id: string; text: string }[] }).options.find((o) => /named box/i.test(o.text))!.id;
    const answers = await Promise.all(Array.from({ length: 6 }, () => send(u, data.sessionId, { type: "answer", stationId: "s-var1", answer: { type: "choice", optionId: rightId } })));
    expect(answers.filter((r) => r.status === 200)).toHaveLength(1);
    const row = await db.playSession.findUniqueOrThrow({ where: { id: data.sessionId } });
    expect((row.state as unknown as PlayState).score).toBe(110); // 100 (first try) + 10 (one coin)
  });

  it("plays a whole game through the HTTP API: completes, aggregates progress, results are retrievable, replay starts fresh", async () => {
    const u = await createTestUser();
    const game = await makeGame(u.id);
    const spec = game.spec as unknown as GameSpec;
    const { data } = await start(u, game.id);
    let state: ClientState = data.state;
    let completed = false;
    for (let guard = 0; guard < 30 && !completed; guard++) {
      const area = findArea(spec, state.areaId)!;
      // A later pass (battle rounds open one after another) may repeat requests the server already accepted: keep the last good state.
      for (const n of area.npcs) state = (await send(u, data.sessionId, { type: "talk", npcId: n.id })).body.state ?? state;
      for (const id of collectibleIds(area)) state = (await send(u, data.sessionId, { type: "collect", itemId: id })).body.state ?? state;
      for (const s of area.stations) {
        if (!stationActive(spec, state, s) || state.resolvedStations[s.id] || state.visited.includes(s.id)) continue;
        if (s.kind === "lore") { state = (await send(u, data.sessionId, { type: "visit", stationId: s.id })).body.state; continue; }
        const opened = await send(u, data.sessionId, { type: "open", stationId: s.id });
        const ch = spec.challenges.find((c) => c.id === opened.body.data.challenge.id)!;
        const r = await send(u, data.sessionId, { type: "answer", stationId: s.id, answer: correctAnswer(ch, answerSeed(data.sessionId)) });
        state = r.body.state;
        if (r.body.completed) { completed = true; expect(r.body.summary).toMatchObject({ completed: true, stars: 3 }); break; }
      }
      if (completed) break;
      if (area.portal) { const r = await send(u, data.sessionId, { type: "enter_area", areaId: area.portal.toAreaId }); if (r.status === 200) state = r.body.state; }
    }
    expect(completed).toBe(true);
    const row = await db.playSession.findUniqueOrThrow({ where: { id: data.sessionId } });
    expect(row).toMatchObject({ status: "COMPLETED", stars: 3 });
    const progress = await db.gameProgress.findUniqueOrThrow({ where: { userId_gameId: { userId: u.id, gameId: game.id } } });
    expect(progress).toMatchObject({ completions: 1, bestStars: 3 });
    expect(progress.bestScore).toBe(row.score);
    expect(progress.achievements).toEqual(expect.arrayContaining(["completed", "flawless"]));
    const results = await getSessionResults(u.id, data.sessionId);
    expect(results!.summary).toMatchObject({ completed: true });
    expect(await getSessionResults((await createTestUser()).id, data.sessionId)).toBeNull();
    // completed sessions accept no new events
    expect((await send(u, data.sessionId, { type: "collect", itemId: "a-plaza:c0" })).body.error.code).toBe("SESSION_COMPLETED");
    // replay → new session, fresh state, progress retained
    const again = await start(u, game.id);
    expect(again.data.sessionId).not.toBe(data.sessionId);
    expect(again.data.state.score).toBe(0);
    expect(again.data.resumed).toBe(false);
  });

  it("resumes where you left off (collected items, position, checkpoint) and 'restart' begins again", async () => {
    const u = await createTestUser();
    const game = await makeGame(u.id);
    const first = await start(u, game.id);
    await send(u, first.data.sessionId, { type: "collect", itemId: "a-plaza:c0" });
    await send(u, first.data.sessionId, { type: "save", position: { x: 3, y: 0, z: -4, yaw: 1.5 } });
    const resumed = await start(u, game.id);
    expect(resumed.data).toMatchObject({ resumed: true, sessionId: first.data.sessionId });
    expect(resumed.data.state.collected).toEqual(["a-plaza:c0"]);
    expect(resumed.data.state.position).toEqual({ x: 3, y: 0, z: -4, yaw: 1.5 });
    const fresh = await start(u, game.id, { restart: true });
    expect(fresh.data.resumed).toBe(false);
    expect(fresh.data.state.collected).toEqual([]);
    expect((await db.playSession.findUniqueOrThrow({ where: { id: first.data.sessionId } })).status).toBe("ABANDONED");
    expect(await db.playSession.count({ where: { userId: u.id, gameId: game.id, status: "ACTIVE" } })).toBe(1);
  });

  it("concurrent starts (double click / two tabs) end with exactly one active session", async () => {
    const u = await createTestUser();
    const game = await makeGame(u.id);
    const results = await Promise.all(Array.from({ length: 6 }, () => start(u, game.id)));
    expect(new Set(results.map((r) => r.data.sessionId)).size).toBe(1);
    expect(await db.playSession.count({ where: { userId: u.id, gameId: game.id, status: "ACTIVE" } })).toBe(1);
  });
});

describe("library & modification workflows", () => {
  it("lists only my games, shows details without any answers, renames, edits mechanics (new revision + history), resets progress, deletes", async () => {
    const u = await createTestUser();
    const other = await createTestUser();
    const game = await makeGame(u.id);
    await makeGame(other.id);
    const list = await readJson<{ games: { id: string }[] }>(await listRoute(makeRequest("GET", "/api/games", { cookie: u.cookie })));
    expect(list.games.map((g) => g.id)).toEqual([game.id]);

    const detail = await readJson<Record<string, any>>(await detailsRoute(makeRequest("GET", `/api/games/${game.id}`, { cookie: u.cookie }), { params: Promise.resolve({ id: game.id }) })); // eslint-disable-line @typescript-eslint/no-explicit-any
    expect(detail.game).toMatchObject({ id: game.id, revision: 1, generator: { kind: "demo" } });
    expect(detail.overview.objectives.length).toBeGreaterThan(0);
    expect(JSON.stringify(detail)).not.toMatch(/correctOptionId|commonMistakes|"solution"/);
    expect((await detailsRoute(makeRequest("GET", `/api/games/${game.id}`, { cookie: other.cookie }), { params: Promise.resolve({ id: game.id }) })).status).toBe(404);

    // cosmetic rename: no new revision
    const renamed = await editRoute(makeRequest("PATCH", `/api/games/${game.id}`, { cookie: u.cookie, body: { title: "My Renamed Quest" } }), { params: Promise.resolve({ id: game.id }) });
    expect(await readJson(renamed)).toMatchObject({ revision: 1 });
    expect((await db.game.findUniqueOrThrow({ where: { id: game.id } })).title).toBe("My Renamed Quest");

    // gameplay edit: time of day + mechanic toggle → revision 2, history kept, session follows
    const session = await start(u, game.id);
    await send(u, session.data.sessionId, { type: "collect", itemId: "a-plaza:c0" });
    const edit = await editRoute(makeRequest("PATCH", `/api/games/${game.id}`, { cookie: u.cookie, body: { timeOfDay: "day", mechanics: { timed_bonus: true } } }), { params: Promise.resolve({ id: game.id }) });
    expect(await readJson(edit)).toMatchObject({ revision: 2 });
    expect(await db.gameRevision.count({ where: { gameId: game.id } })).toBe(2);
    expect((await send(u, session.data.sessionId, { type: "collect", itemId: "a-plaza:c1" })).body.error.code).toBe("SESSION_STALE");
    const follow = await start(u, game.id);
    expect(follow.data).toMatchObject({ resumed: true, sessionId: session.data.sessionId });
    expect(follow.data.state.collected).toEqual(["a-plaza:c0"]);
    expect((await send(u, follow.data.sessionId, { type: "collect", itemId: "a-plaza:c1" })).status).toBe(200);

    expect((await editRoute(makeRequest("PATCH", `/api/games/${game.id}`, { cookie: u.cookie, body: { title: "" } }), { params: Promise.resolve({ id: game.id }) })).status).toBe(400);
    expect((await editRoute(makeRequest("PATCH", `/api/games/${game.id}`, { cookie: other.cookie, body: { title: "hijack" } }), { params: Promise.resolve({ id: game.id }) })).status).toBe(404);

    expect((await resetRoute(makeRequest("DELETE", `/api/games/${game.id}/progress`, { cookie: u.cookie }), { params: Promise.resolve({ id: game.id }) })).status).toBe(200);
    expect(await db.playSession.count({ where: { gameId: game.id, userId: u.id, status: "ACTIVE" } })).toBe(0);

    expect((await deleteRoute(makeRequest("DELETE", `/api/games/${game.id}`, { cookie: other.cookie }), { params: Promise.resolve({ id: game.id }) })).status).toBe(404);
    expect((await deleteRoute(makeRequest("DELETE", `/api/games/${game.id}`, { cookie: u.cookie }), { params: Promise.resolve({ id: game.id }) })).status).toBe(200);
    expect((await start(u, game.id)).res.status).toBe(404);
    expect((await readJson<{ games: unknown[] }>(await listRoute(makeRequest("GET", "/api/games", { cookie: u.cookie })))).games).toHaveLength(0);
  });
});

describe("switching mechanics on is limited by the game's own level", () => {
  it("a level C game cannot gain a mechanic outside level C, whatever the plan; a level A game can, and either can switch one off", async () => {
    const u = await createTestUser();
    await grantSubscription(u.id, "PRO");
    setFeatureTierForTests(null); // the real levels apply
    try {
      const small = await makeGame(u.id, { mode: "FAST", gameType: "exploration", level: "C" });
      const full = await makeGame(u.id, { level: "A" });
      const patch = (id: string, body: unknown) => editRoute(makeRequest("PATCH", `/api/games/${id}`, { cookie: u.cookie, body }), { params: Promise.resolve({ id }) });
      // an edit never loses the level (validation strips it from the spec; the game keeps the level it was made at)
      expect((await patch(small.id, { title: "Renamed small game" })).status).toBe(200);
      const locked = await patch(small.id, { mechanics: { timed_bonus: true } });
      expect(locked.status).toBe(403);
      expect((await locked.json()).error).toMatchObject({ code: "FEATURE_TIER_LOCKED", details: { requiredLevel: "B", tier: "C" } });
      expect((await patch(full.id, { mechanics: { timed_bonus: true } })).status).toBe(200);
      expect((await patch(full.id, { mechanics: { timed_bonus: false } })).status).toBe(200);
    } finally {
      setFeatureTierForTests("A");
    }
  });
});
