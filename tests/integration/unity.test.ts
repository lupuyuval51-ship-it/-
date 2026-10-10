import { afterAll, describe, expect, it } from "vitest";
import { GET as unityRoute } from "@/app/api/games/[id]/unity/route";
import { db, disconnectDb } from "@/server/db";
import type { GameSpec } from "@/lib/game/spec/schema";
import { createTestUser, grantSubscription, makeRequest, readJson } from "./helpers";
import { makeGame } from "./helpers-ai";

afterAll(disconnectDb);

const get = (cookie: string, id: string, query = "") => unityRoute(makeRequest("GET", `/api/games/${id}/unity${query}`, { cookie }), { params: Promise.resolve({ id }) });

describe("GET /api/games/:id/unity", () => {
  it("is Tier A only: FREE is refused with TIER_REQUIRED, decided from the persisted plan", async () => {
    const u = await createTestUser();
    const game = await makeGame(u.id);
    await db.userProfile.update({ where: { userId: u.id }, data: { graphicsPreference: "A" } });
    const res = await get(u.cookie, game.id);
    expect(res.status).toBe(403);
    expect((await readJson<{ error: { code: string } }>(res)).error.code).toBe("TIER_REQUIRED");
  });

  it("PLUS and PRO get the same scene, without any challenge content", async () => {
    const plus = await createTestUser();
    const pro = await createTestUser();
    await grantSubscription(plus.id, "PLUS");
    await grantSubscription(pro.id, "PRO");
    const gp = await makeGame(plus.id);
    const spec = gp.spec as unknown as GameSpec;
    const res = await get(plus.cookie, gp.id);
    expect(res.status).toBe(200);
    const text = await res.text();
    const scene = JSON.parse(text) as { schema: string; stations: unknown[]; areaId: string };
    expect(scene.schema).toBe("levelup.unity-scene");
    expect(scene.stations.length).toBeGreaterThan(0);
    for (const ch of spec.challenges) {
      expect(text).not.toContain(ch.prompt);
      expect(text).not.toContain(ch.explanation);
    }
    const gr = await makeGame(pro.id);
    expect((await get(pro.cookie, gr.id)).status).toBe(200);
  });

  it("other users' games and unknown areas are 404, signed-out is 401", async () => {
    const owner = await createTestUser();
    const other = await createTestUser();
    await grantSubscription(owner.id, "PLUS");
    await grantSubscription(other.id, "PLUS");
    const game = await makeGame(owner.id);
    expect((await get(other.cookie, game.id)).status).toBe(404);
    expect((await get(owner.cookie, game.id, "?area=nope")).status).toBe(404);
    expect((await get("", game.id)).status).toBe(401);
  });
});
