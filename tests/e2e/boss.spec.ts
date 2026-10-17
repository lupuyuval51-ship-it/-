import { expect, test } from "./fixtures";
import { createGameViaApi, registerViaApi, sendPlayEvent, setLocaleCookie, rightFor } from "./helpers";
import { getGameSpec, setPlan } from "./db";
import { answerInUi, challengeOf, goNear, openGame, snapshot } from "./play-helpers";
import { collectibleIds, findArea, stationActive, type ClientState } from "@/lib/game/state/progress";
import type { GameSpec } from "@/lib/game/spec/schema";
import type { Page } from "@playwright/test";

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Do everything the server allows before the boss battle (through the real API, like a fast player), area by area. */
async function advanceToBoss(page: Page, sessionId: string, spec: GameSpec): Promise<ClientState> {
  const boss = spec.bosses[0]!;
  const phases = new Set(boss.phaseStationIds);
  let state: ClientState = (await snapshot(page)).client;
  for (let pass = 0; pass < 30; pass++) {
    const area = findArea(spec, state.areaId)!;
    const before = JSON.stringify([state.areaId, state.resolvedStations, state.visited, state.talked, state.collected]);
    for (const n of area.npcs) if (!state.talked.includes(n.id)) state = (await sendPlayEvent(page, sessionId, { type: "talk", npcId: n.id })).body.state ?? state;
    for (const id of collectibleIds(area)) if (!state.collected.includes(id)) state = (await sendPlayEvent(page, sessionId, { type: "collect", itemId: id })).body.state ?? state;
    for (const s of area.stations) {
      if (state.areaId === boss.areaId && phases.has(s.id)) continue; // the battle itself is fought in the UI
      if (state.resolvedStations[s.id] || state.visited.includes(s.id) || !stationActive(spec, state, s)) continue;
      if (s.kind === "lore") { state = (await sendPlayEvent(page, sessionId, { type: "visit", stationId: s.id })).body.state ?? state; continue; }
      const opened = await sendPlayEvent(page, sessionId, { type: "open", stationId: s.id });
      state = (await sendPlayEvent(page, sessionId, { type: "answer", stationId: s.id, answer: rightFor(spec, opened.body.data.challenge) })).body.state ?? state;
    }
    if (state.areaId === boss.areaId) return state;
    if (area.portal) {
      const r = await sendPlayEvent(page, sessionId, { type: "enter_area", areaId: area.portal.toAreaId });
      if (r.status < 400) state = r.body.state ?? state;
    }
    if (JSON.stringify([state.areaId, state.resolvedStations, state.visited, state.talked, state.collected]) === before) break;
  }
  return state;
}

test.describe("final boss battle", () => {
  test("a Full Adventure ends with a boss: rounds open in order, each win wounds it, the last one defeats it and finishes the game", async ({ page }) => {
    test.setTimeout(240_000);
    await setLocaleCookie(page, "en");
    const { email } = await registerViaApi(page, { locale: "en" });
    await setPlan(email, "PRO"); // boss battles are a tier-A (Pro) feature
    const gameId = await createGameViaApi(page, { mode: "FULL", subject: "Fractions", gameType: "adventure" });
    const spec = await getGameSpec(gameId);
    expect(spec.bosses.length, "Full demo games end with a boss").toBe(1);
    const boss = spec.bosses[0]!;

    await openGame(page, gameId);
    const sessionId = (await snapshot(page)).sessionId as string;
    await advanceToBoss(page, sessionId, spec);
    await page.reload();
    await page.waitForFunction(() => (document.querySelector("canvas") as HTMLCanvasElement | null)?.dataset.ready === "1" && Boolean((window as any).__LEVELUP_TEST__), undefined, { timeout: 60_000 });
    const snap = await snapshot(page);
    expect(snap.areaId).toBe(boss.areaId);
    expect(snap.bosses.map((b: any) => b.bossId)).toEqual([boss.id]);

    // the boss is there: walk up, the card explains the battle (round 1) and the health bar is not shown before the fight starts
    await expect(page.getByTestId("boss-health")).toHaveCount(0);
    await goNear(page, "boss", boss.id);
    await expect(page.getByTestId("interact-prompt")).toHaveAttribute("data-kind", "boss");
    await page.keyboard.press("KeyE");
    const card = page.getByTestId("boss-card");
    await expect(card).toBeVisible();
    await expect(card).toContainText(boss.name);
    await expect(page.getByTestId("boss-progress")).toHaveAttribute("data-done", "0");
    await expect(page.getByTestId("boss-progress")).toHaveAttribute("data-total", String(boss.phaseStationIds.length));
    await page.getByTestId("boss-close").click();
    await expect(card).toBeHidden();

    // round 2 cannot be fought before round 1: the prompt says why, and the server refuses a forged request too
    const [first, second] = boss.phaseStationIds as [string, string];
    await goNear(page, "station", second);
    await expect(page.getByTestId("interact-prompt")).toContainText("earlier rounds");
    const forged = await sendPlayEvent(page, sessionId, { type: "open", stationId: second });
    expect(forged.status).toBeGreaterThanOrEqual(400);
    expect(JSON.stringify(forged.body)).toContain("STATION_LOCKED");

    // fight the rounds in the UI
    for (const [i, stationId] of boss.phaseStationIds.entries()) {
      await goNear(page, "station", stationId);
      await page.keyboard.press("KeyE");
      const panel = page.getByTestId("challenge-panel");
      await expect(panel).toBeVisible();
      const served = challengeOf(spec, (await panel.getAttribute("data-challenge"))!);
      await answerInUi(page, served, "right");
      const last = i === boss.phaseStationIds.length - 1;
      if (!last) {
        await expect(page.getByTestId("result")).toContainText(/./);
        await page.getByTestId("challenge-close").click();
        // the health bar shows what is left of the boss: one segment per round still to win
        await expect(page.getByTestId("boss-health")).toHaveAttribute("data-left", String(boss.phaseStationIds.length - 1 - i));
      }
    }
    // the last round defeats the boss; being the last mission, it also ends the game
    await expect(page.getByTestId("done-overlay")).toBeVisible({ timeout: 20_000 });
    const final = await snapshot(page);
    expect(final.client.bossesDefeated).toEqual([boss.id]);
    expect(final.client.achievements).toContain("boss_slayer");
    expect(first).toBeTruthy();
  });

  test("the boss card and health bar work in Hebrew (RTL) too", async ({ page }) => {
    test.setTimeout(240_000);
    await setLocaleCookie(page, "he");
    const { email } = await registerViaApi(page, { locale: "he" });
    await setPlan(email, "PRO");
    const gameId = await createGameViaApi(page, { mode: "FULL", subject: "Fractions", gameType: "adventure", contentLanguage: "he" });
    const spec = await getGameSpec(gameId);
    const boss = spec.bosses[0]!;
    expect(boss.name).toBe("השומר האחרון");
    await openGame(page, gameId);
    const sessionId = (await snapshot(page)).sessionId as string;
    await advanceToBoss(page, sessionId, spec);
    await page.reload();
    await page.waitForFunction(() => (document.querySelector("canvas") as HTMLCanvasElement | null)?.dataset.ready === "1" && Boolean((window as any).__LEVELUP_TEST__), undefined, { timeout: 60_000 });
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await goNear(page, "boss", boss.id);
    await expect(page.getByTestId("interact-prompt")).toContainText("התמודדות");
    await page.keyboard.press("KeyE");
    await expect(page.getByTestId("boss-card")).toContainText("סיבוב 1");
    await page.getByTestId("boss-close").click();
    // win round 1 → the health chip appears
    await goNear(page, "station", boss.phaseStationIds[0]!);
    await page.keyboard.press("KeyE");
    const panel = page.getByTestId("challenge-panel");
    await expect(panel).toBeVisible();
    await answerInUi(page, challengeOf(spec, (await panel.getAttribute("data-challenge"))!), "right");
    await page.getByTestId("challenge-close").click();
    await expect(page.getByTestId("boss-health")).toBeVisible();
  });
});
