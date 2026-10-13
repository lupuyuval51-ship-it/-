import { expect, test } from "./fixtures";
import { createGameViaApi, registerViaApi, sendPlayEvent, setLocaleCookie, rightFor } from "./helpers";
import { getGameSpec, setPlan } from "./db";
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

    // the area title card shows the area name but is hidden from assistive tech (the top bar already announces it)
    const banner = page.getByTestId("area-banner");
    await expect(banner).toHaveAttribute("aria-hidden", "true");
    const areaName = (await page.getByTestId("area-name").innerText()).trim();
    await expect(banner).toHaveAttribute("data-title", areaName);

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
    const rightText = (ch as { options: { id: string; text: string }[]; correctOptionId: string }).options.find((o) => o.id === (ch as { correctOptionId: string }).correctOptionId)!.text;
    await panel.locator("[data-option]").filter({ has: page.getByText(rightText, { exact: true }) }).click();
    await page.getByTestId("challenge-submit").click();
    await expect(page.getByTestId("result")).toContainText(/correct/i);
    await expect(page.getByTestId("confetti")).toBeVisible();
  });

  test("simulation challenges animate: the lever shows its balance and the cannon fires an animated ball", async ({ page }) => {
    test.setTimeout(240_000);
    await setLocaleCookie(page, "en");
    const { email } = await registerViaApi(page, { locale: "en" });
    await setPlan(email, "PRO"); // simulation labs and physics simulations are tier A
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
        state = (await sendPlayEvent(page, sessionId, { type: "answer", stationId: st.id, answer: rightFor(spec, opened.body.data.challenge) })).body.state ?? state;
      }
    }
    const entered = await sendPlayEvent(page, sessionId, { type: "enter_area", areaId: second!.id });
    expect(entered.status, JSON.stringify(entered.body)).toBeLessThan(300);
    await page.reload();
    await openGame(page, gameId);
    await expect.poll(async () => (await snapshot(page)).areaId).toBe(second!.id);

    const seen = new Set<string>();
    // look at the simulations in the order a boss battle opens them
    const phaseIndex = (id: string) => spec.bosses.flatMap((b) => b.phaseStationIds).indexOf(id);
    const simIds = new Set(sims.map((x) => x.id));
    for (const st of [...sims].sort((a, b) => phaseIndex(a.id) - phaseIndex(b.id))) {
      const ch = challengeOf(spec, st.challengeId!) as any;
      // A boss battle's rounds open one after another: win the other rounds before this one (through the API) so it is open.
      const battle = spec.bosses.find((b) => b.phaseStationIds.includes(st.id));
      for (const before of battle ? battle.phaseStationIds.slice(0, battle.phaseStationIds.indexOf(st.id)).filter((id) => !simIds.has(id)) : []) {
        if (state.resolvedStations[before]) continue;
        const opened = await sendPlayEvent(page, sessionId, { type: "open", stationId: before });
        state = (await sendPlayEvent(page, sessionId, { type: "answer", stationId: before, answer: rightFor(spec, opened.body.data.challenge) })).body.state ?? state;
      }
      if (battle) { await page.reload(); await openGame(page, gameId); }
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
      // the simulation was opened by the player: finish it through the API so the next round of a battle opens
      if (battle) state = (await sendPlayEvent(page, sessionId, { type: "answer", stationId: st.id, answer: correctAnswer(ch) })).body.state ?? state;
    }
    expect(seen.size).toBeGreaterThan(0);
  });
});
