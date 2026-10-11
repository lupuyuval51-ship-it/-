import { expect, type Page } from "@playwright/test";
import { correctAnswer } from "../unit/helpers";
import type { Challenge, GameSpec } from "@/lib/game/spec/schema";

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Reads the debug snapshot the game exposes ONLY when the server was started with ENABLE_TEST_HOOKS=true. */
export const snapshot = (page: Page): Promise<any> => page.evaluate(() => (window as any).__LEVELUP_TEST__.snapshot());

export async function openGame(page: Page, gameId: string) {
  await page.goto(`/play/${gameId}`);
  await expect(page.getByTestId("play-root")).toBeVisible();
  await page.waitForFunction(() => (document.querySelector("canvas") as HTMLCanvasElement | null)?.dataset.ready === "1" && Boolean((window as any).__LEVELUP_TEST__), undefined, { timeout: 60_000 });
}

/**
 * Put the player next to an entity using the test hook (walking to every station is covered separately by the
 * keyboard-movement test). Tries four offsets because decoration can block one side.
 */
export async function goNear(page: Page, kind: "station" | "npc" | "boss" | "collectible", id: string) {
  const snap = await snapshot(page);
  const list = kind === "station" ? snap.stations : kind === "npc" ? snap.npcs : kind === "boss" ? snap.bosses : snap.collectibles;
  const key = kind === "station" ? "stationId" : kind === "npc" ? "npcId" : kind === "boss" ? "bossId" : "itemId";
  const target = list.find((e: any) => e[key] === id);
  if (!target) throw new Error(`${kind} ${id} is not in the current area`);
  for (const [dx, dz] of [[0, 1.7], [1.7, 0], [0, -1.7], [-1.7, 0]] as const) {
    await page.evaluate(([x, y, z]) => (window as any).__LEVELUP_TEST__.teleport(x, y, z), [target.x + dx, target.y + 0.2, target.z + dz]);
    try {
      await page.waitForFunction(([k, i]) => { const n = (window as any).__LEVELUP_TEST__.snapshot().nearby; return Boolean(n) && n.id === i && (k !== "collectible"); }, [kind, id] as const, { timeout: 1500 });
      return;
    } catch {
      /* try the next side */
    }
  }
  throw new Error(`could not reach ${kind} ${id}`);
}

export const challengeOf = (spec: GameSpec, id: string): Challenge => {
  const ch = spec.challenges.find((c) => c.id === id);
  if (!ch) throw new Error(`unknown challenge ${id}`);
  return ch;
};

/** Enter an answer through the real UI controls (what a person would click or type). */
export async function answerInUi(page: Page, ch: Challenge, mode: "right" | "wrong" = "right") {
  const panel = page.getByTestId("challenge-panel");
  const answer = correctAnswer(ch);
  if (ch.type === "choice") {
    const wrongId = ch.options.find((o) => o.id !== ch.correctOptionId)!.id;
    await panel.locator(`[data-option="${mode === "right" ? ch.correctOptionId : wrongId}"]`).click();
  } else if (ch.type === "numeric") {
    await page.getByTestId("numeric-input").fill(String(mode === "right" ? ch.answer : ch.answer + ch.tolerance + 9999));
  } else if (ch.type === "sequence" && answer.type === "sequence") {
    const order = mode === "right" ? answer.order : [...answer.order].reverse();
    for (const id of order) await panel.locator(`[data-item="${id}"]`).click();
  } else if (ch.type === "match" && answer.type === "match") {
    // A previous (wrong) attempt leaves its pairs in place; clear them like a player would.
    const reset = panel.getByTestId("match-reset");
    if (await reset.isVisible().catch(() => false)) await reset.click();
    for (const [i, p] of answer.pairs.entries()) {
      const rightId = mode === "right" ? p.rightId : answer.pairs[(i + 1) % answer.pairs.length]!.rightId;
      await panel.locator(`[data-left="${p.leftId}"]`).click();
      await panel.locator(`[data-right="${rightId}"]`).click();
    }
  } else {
    throw new Error(`answerInUi does not drive ${ch.type} challenges`);
  }
  await page.getByTestId("challenge-submit").click();
}
