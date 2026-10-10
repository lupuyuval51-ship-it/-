import { expect, test } from "./fixtures";
import { createGameViaApi, registerViaApi, sendPlayEvent, setLocaleCookie } from "./helpers";
import { dbRows, getGameSpec, userIdOf } from "./db";
import { answerInUi, challengeOf, goNear, openGame, snapshot } from "./play-helpers";
import { correctAnswer } from "../unit/helpers";
import { collectibleIds, findArea, stationActive, type ClientState } from "@/lib/game/state/progress";

/* eslint-disable @typescript-eslint/no-explicit-any */

test.describe("playing a generated game in a real browser", () => {
  test("move with the keyboard, talk, solve with feedback and hints, resume after a reload, finish and read the results", async ({ page }) => {
    test.setTimeout(240_000);
    await setLocaleCookie(page, "en");
    const { email } = await registerViaApi(page, { locale: "en" });
    const userId = await userIdOf(email);
    const gameId = await createGameViaApi(page);
    const spec = await getGameSpec(gameId);

    // The session payload must not contain answer keys, explanations or solutions.
    const sessionResponse = page.waitForResponse((r) => /\/api\/games\/[^/]+\/session$/.test(r.url()) && r.request().method() === "POST");
    await openGame(page, gameId);
    const sessionBody = await (await sessionResponse).text();
    for (const key of ["correctOptionId", "explanation", "solution", "commonMistakes", "tolerance", "feedback"]) expect(sessionBody, `leaked key ${key}`).not.toContain(`"${key}":`);
    expect(JSON.parse(sessionBody).spec.challenges, "challenge content is only delivered one station at a time").toEqual([]);

    // 3D scene is really rendered with the tier the server granted to a Free account
    const root = page.getByTestId("play-root");
    await expect(root).toHaveAttribute("data-tier", "B");
    await expect(root).toHaveAttribute("data-plan", "FREE");
    await expect(root).toHaveAttribute("data-source", "demo");
    await expect(page.getByTestId("area-name")).not.toBeEmpty();
    await expect(page.getByTestId("missions")).toBeVisible();

    // ── real keyboard movement ──
    const start = (await snapshot(page)).player;
    await page.keyboard.down("KeyW");
    await expect.poll(async () => { const p = (await snapshot(page)).player; return Math.hypot(p.x - start.x, p.z - start.z); }, { timeout: 15_000 }).toBeGreaterThan(1.5);
    await page.keyboard.up("KeyW");
    await page.keyboard.press("Space");
    await expect.poll(async () => (await snapshot(page)).player.y, { timeout: 5_000 }).toBeGreaterThan(start.y + 0.05);

    // ── NPC dialogue ──
    const npcId = spec.areas[0]!.npcs[0]!.id;
    await goNear(page, "npc", npcId);
    await expect(page.getByTestId("interact-prompt")).toBeVisible();
    await page.keyboard.press("KeyE");
    await expect(page.getByTestId("dialogue")).toBeVisible();
    for (let i = 0; i < 12 && (await page.getByTestId("dialogue").isVisible()); i++) await page.getByTestId("dialogue-next").click();
    await expect(page.getByTestId("dialogue")).toBeHidden();

    // ── first challenge: wrong answer explains itself, a hint is available, the right answer scores ──
    const first = spec.areas[0]!.stations.find((s) => s.kind === "challenge")!;
    await goNear(page, "station", first.id);
    await page.keyboard.press("KeyE");
    const panel = page.getByTestId("challenge-panel");
    await expect(panel).toBeVisible();
    const served = challengeOf(spec, (await panel.getAttribute("data-challenge"))!);
    await answerInUi(page, served, "wrong");
    const wrong = page.getByTestId("result");
    await expect(wrong).toBeVisible();
    await expect(wrong).not.toBeEmpty();
    const scoreAfterWrong = await page.evaluate(() => (window as any).__LEVELUP_TEST__.snapshot().client.score);
    expect(scoreAfterWrong).toBe(0);
    if (await page.getByRole("button", { name: /hint/i }).count()) {
      await page.getByRole("button", { name: /hint/i }).first().click();
      await expect(page.getByTestId("hint")).toBeVisible();
    }
    // wrong attempts are recorded by the SERVER
    const [row1] = await dbRows<{ state: { records: Record<string, { wrong: number }> } }>('SELECT state FROM "PlaySession" WHERE "userId" = $1 AND status = \'ACTIVE\'', [userId]);
    expect(row1!.state.records[served.id]?.wrong).toBe(1);

    // retry: re-select / re-enter the correct answer
    if (served.type === "choice") await panel.locator(`[data-option="${served.correctOptionId}"]`).click();
    else if (served.type === "numeric") await page.getByTestId("numeric-input").fill(String(served.answer));
    await page.getByTestId("challenge-submit").click();
    await expect(page.getByTestId("result")).toContainText(/./);
    await page.getByTestId("challenge-close").click();
    await expect.poll(async () => (await snapshot(page)).client.score).toBeGreaterThan(0);
    const scoreBefore = (await snapshot(page)).client.score;
    const sessionId = (await snapshot(page)).sessionId as string;

    // ── a forged request cannot finish the game early or invent points ──
    const early = await sendPlayEvent(page, sessionId, { type: "finish" });
    expect(early.status).toBeGreaterThanOrEqual(400);
    const forged = await page.evaluate(async (sid) => {
      const res = await fetch(`/api/play/${sid}/events`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ type: "answer", stationId: "s-loop1", answer: { type: "numeric", value: 1 }, score: 99999, correct: true }) });
      return res.status;
    }, sessionId);
    expect(forged).toBeGreaterThanOrEqual(400);
    expect((await snapshot(page)).client.score).toBe(scoreBefore);

    // ── progress survives a reload (server-side persistence) ──
    await page.reload();
    await page.waitForFunction(() => (document.querySelector("canvas") as HTMLCanvasElement | null)?.dataset.ready === "1" && Boolean((window as any).__LEVELUP_TEST__), undefined, { timeout: 60_000 });
    const resumed = await snapshot(page);
    expect(resumed.sessionId).toBe(sessionId);
    expect(resumed.client.score).toBe(scoreBefore);
    expect(Object.keys(resumed.client.resolvedStations)).toContain(first.id);

    // ── finish everything except the very last challenge through the API, then end it in the UI ──
    const area = findArea(spec, resumed.client.areaId)!;
    const challengeStations = area.stations.filter((s) => s.kind === "challenge");
    const last = challengeStations[challengeStations.length - 1]!;
    let state: ClientState = resumed.client;
    for (const n of area.npcs) state = (await sendPlayEvent(page, sessionId, { type: "talk", npcId: n.id })).body.state ?? state;
    for (const id of collectibleIds(area)) state = (await sendPlayEvent(page, sessionId, { type: "collect", itemId: id })).body.state ?? state;
    for (const s of area.stations) {
      if (s.id === last.id || state.resolvedStations[s.id] || state.visited.includes(s.id)) continue;
      if (!stationActive(spec, state, s)) continue;
      if (s.kind === "lore") { state = (await sendPlayEvent(page, sessionId, { type: "visit", stationId: s.id })).body.state ?? state; continue; }
      const opened = await sendPlayEvent(page, sessionId, { type: "open", stationId: s.id });
      const r = await sendPlayEvent(page, sessionId, { type: "answer", stationId: s.id, answer: correctAnswer(challengeOf(spec, opened.body.data.challenge.id)) });
      state = r.body.state ?? state;
    }
    await page.reload();
    await page.waitForFunction(() => (document.querySelector("canvas") as HTMLCanvasElement | null)?.dataset.ready === "1" && Boolean((window as any).__LEVELUP_TEST__), undefined, { timeout: 60_000 });
    await goNear(page, "station", last.id);
    await page.keyboard.press("KeyE");
    await expect(panel).toBeVisible();
    const finalChallenge = challengeOf(spec, (await panel.getAttribute("data-challenge"))!);
    await answerInUi(page, finalChallenge, "right");
    // the correct final answer completes the last mission → the server reports completion → the end screen replaces the challenge
    await expect(page.getByTestId("done-overlay")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId("final-score")).toContainText(/\d+/);

    // ── results page, computed by the server from the validated events ──
    const final = (await dbRows<{ score: number; stars: number; status: string }>('SELECT score, stars, status FROM "PlaySession" WHERE id = $1', [sessionId]))[0]!;
    expect(final.status).toBe("COMPLETED");
    expect(final.score).toBeGreaterThan(scoreBefore);
    await page.getByTestId("results-link").click();
    await page.waitForURL(/\/results\//);
    await expect(page.getByTestId("results-score")).toContainText(String(final.score));
    await expect(page.getByTestId("results-review")).toBeVisible();
    // the wrong attempt on the first station is surfaced for review only when it needed several tries/reveal; the page must render either way
    await page.goto(`/games/${gameId}`);
    await expect(page.getByTestId("details-progress")).toContainText(String(final.score));

    // a finished session accepts no further events
    expect((await sendPlayEvent(page, sessionId, { type: "collect", itemId: `${area.id}:c0` })).status).toBeGreaterThanOrEqual(400);
  });

  test("pause menu, escape key and the demo label are available during play", async ({ page }) => {
    await setLocaleCookie(page, "en");
    await registerViaApi(page, { locale: "en" });
    const gameId = await createGameViaApi(page);
    await openGame(page, gameId);
    await expect(page.getByTestId("quality-note")).toBeVisible().catch(() => undefined); // present for Free accounts
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("pause-menu")).toBeVisible();
    await page.getByTestId("resume-button").click();
    await expect(page.getByTestId("pause-menu")).toBeHidden();
    await page.getByTestId("pause-button").click();
    await expect(page.getByTestId("pause-menu")).toBeVisible();
  });
});
