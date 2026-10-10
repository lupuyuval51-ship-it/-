import { expect, test } from "./fixtures";
import { createGameViaApi, registerViaApi, sendPlayEvent, setLocaleCookie } from "./helpers";
import { getGameSpec } from "./db";
import { challengeOf, goNear, openGame, snapshot } from "./play-helpers";
import { correctAnswer, PACK_SUBJECT } from "../unit/helpers";
import { collectibleIds, stationActive, type ClientState } from "@/lib/game/state/progress";

/* eslint-disable @typescript-eslint/no-explicit-any */

const guideState = (page: import("@playwright/test").Page) => page.evaluate(() => (window as any).__LEVELUP_TEST__.guide());

test.describe("play-screen guidance and polish", () => {
  test("new players get a hint card, an objective marker, a minimap and a collectible counter; the guide can be switched off", async ({ page, isMobile }) => {
    test.setTimeout(120_000);
    await setLocaleCookie(page, "en");
    await registerViaApi(page, { locale: "en" });
    const gameId = await createGameViaApi(page);
    await openGame(page, gameId);

    // first-run hint card: dismissed once, remembered across reloads
    await expect(page.getByTestId("tutorial-card")).toBeVisible();
    await page.getByTestId("tutorial-ok").click();
    await expect(page.getByTestId("tutorial-card")).toBeHidden();
    await page.reload();
    await openGame(page, gameId);
    await expect(page.getByTestId("tutorial-card")).toBeHidden();

    // the guide always points at something useful, and says what and how far
    await expect.poll(async () => (await guideState(page)).primary?.label ?? null, { timeout: 15_000 }).not.toBeNull();
    await expect(page.getByTestId("guide-marker")).toHaveAttribute("data-show", "1", { timeout: 15_000 });

    // the area title card never adds a second copy of the area name to the page text
    await expect(page.getByTestId("area-banner")).toHaveAttribute("data-title", /.+/);
    const areaName = (await page.getByTestId("area-name").innerText()).trim();
    await expect(page.getByText(areaName, { exact: true })).toHaveCount(1);

    // collectible counter (the demo adventure has pick-ups)
    await expect(page.getByTestId("collect-count")).toContainText(/0\/\d+/);

    if (!isMobile) await expect(page.getByTestId("minimap")).toBeVisible();

    // switching the guide off in the pause menu removes the markers and the map, and the choice is remembered
    await page.getByTestId("pause-button").click();
    await page.getByTestId("guide-toggle").uncheck();
    await page.getByTestId("pause-menu").getByRole("button", { name: /resume/i }).click();
    await expect.poll(async () => (await guideState(page)).enabled).toBe(false);
    await expect(page.getByTestId("guide-marker")).toHaveAttribute("data-show", "0");
    await page.reload();
    await openGame(page, gameId);
    expect((await guideState(page)).enabled).toBe(false);
  });

  test("number keys pick the matching answer of a multiple-choice challenge", async ({ page }) => {
    test.setTimeout(120_000);
    await setLocaleCookie(page, "en");
    await registerViaApi(page, { locale: "en" });
    const gameId = await createGameViaApi(page);
    const spec = await getGameSpec(gameId);
    const station = spec.areas[0]!.stations.find((s) => s.kind === "challenge" && s.challengeId && challengeOf(spec, s.challengeId).type === "choice");
    test.skip(!station, "this demo game has no multiple-choice station in its first area");
    await openGame(page, gameId);
    await goNear(page, "station", station!.id);
    await page.keyboard.press("KeyE");
    const panel = page.getByTestId("challenge-panel");
    await expect(panel).toBeVisible();
    const radios = panel.getByRole("radio");
    await page.keyboard.press("2");
    await expect(radios.nth(1)).toHaveAttribute("aria-checked", "true");
    await page.keyboard.press("1");
    await expect(radios.nth(0)).toHaveAttribute("aria-checked", "true");
    await expect(radios.nth(1)).toHaveAttribute("aria-checked", "false");
    // a correct answer celebrates
    const ch = challengeOf(spec, station!.challengeId!);
    const right = (correctAnswer(ch) as unknown as { optionId: string }).optionId;
    await panel.locator(`[data-option="${right}"]`).click();
    await page.getByTestId("challenge-submit").click();
    await expect(page.getByTestId("result")).toContainText(/correct/i);
    await expect(page.getByTestId("confetti")).toBeVisible();
  });

  test("simulation challenges animate: the lever shows its balance and the cannon fires an animated ball", async ({ page }) => {
    test.setTimeout(240_000);
    await setLocaleCookie(page, "en");
    await registerViaApi(page, { locale: "en" });
    const gameId = await createGameViaApi(page, { subject: PACK_SUBJECT.science, gameType: "simulation", mode: "FULL" });
    const spec = await getGameSpec(gameId);
    const second = spec.areas[1];
    test.skip(!second, "this demo game has a single area");
    const sims = second!.stations.filter((s) => s.kind === "challenge" && s.challengeId && challengeOf(spec, s.challengeId).type === "simulation");
    test.skip(sims.length === 0, "no simulation stations in the second area");
    await openGame(page, gameId);

    // finish the first area through the API (the walk-through is covered elsewhere), then go through the portal
    const sessionId = (await snapshot(page)).sessionId as string;
    const area = spec.areas[0]!;
    let state: ClientState = (await snapshot(page)).client;
    for (const n of area.npcs) state = (await sendPlayEvent(page, sessionId, { type: "talk", npcId: n.id })).body.state ?? state;
    for (const id of collectibleIds(area)) state = (await sendPlayEvent(page, sessionId, { type: "collect", itemId: id })).body.state ?? state;
    for (let round = 0; round < 3; round++) {
      for (const st of area.stations) {
        if (state.resolvedStations[st.id] || state.visited.includes(st.id) || !stationActive(spec, state, st)) continue;
        if (st.kind === "lore") { state = (await sendPlayEvent(page, sessionId, { type: "visit", stationId: st.id })).body.state ?? state; continue; }
        const opened = await sendPlayEvent(page, sessionId, { type: "open", stationId: st.id });
        state = (await sendPlayEvent(page, sessionId, { type: "answer", stationId: st.id, answer: correctAnswer(challengeOf(spec, opened.body.data.challenge.id)) })).body.state ?? state;
      }
    }
    const entered = await sendPlayEvent(page, sessionId, { type: "enter_area", areaId: second!.id });
    expect(entered.status, JSON.stringify(entered.body)).toBeLessThan(300);
    await page.reload();
    await openGame(page, gameId);
    await expect.poll(async () => (await snapshot(page)).areaId).toBe(second!.id);

    const seen = new Set<string>();
    for (const st of sims) {
      const ch = challengeOf(spec, st.challengeId!) as any;
      await goNear(page, "station", st.id);
      await page.keyboard.press("KeyE");
      const panel = page.getByTestId("challenge-panel");
      await expect(panel).toBeVisible();
      if (ch.sim.kind === "lever") {
        const solution = (correctAnswer(ch) as unknown as { params: { distance: number } }).params.distance;
        const slider = panel.locator('input[type="range"]');
        await slider.fill(String(solution));
        await expect(page.getByTestId("lever-state")).toHaveText(/balanced/i);
        await slider.fill(String(Math.min(ch.sim.maxDistance, solution + 2)));
        await expect(page.getByTestId("lever-state")).toHaveText(/heavier/i);
      } else {
        await expect(panel.locator("svg animateMotion")).toHaveCount(1);
      }
      seen.add(ch.sim.kind);
      await page.keyboard.press("Escape");
      await expect(panel).toBeHidden();
    }
    expect(seen.size).toBeGreaterThan(0);
  });
});
