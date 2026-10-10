import { expect, test } from "./fixtures";
import { createGameViaApi, registerViaApi, sendPlayEvent, setLocaleCookie } from "./helpers";
import { getGameSpec } from "./db";
import { challengeOf, openGame, snapshot } from "./play-helpers";
import { correctAnswer, wrongAnswer } from "../unit/helpers";

 
for (const locale of ["en", "he"] as const) {
  test(`review of mistakes (${locale}): shows what was missed with the right answer, and only to the owner`, async ({ page, browser }) => {
    test.setTimeout(180_000);
    await setLocaleCookie(page, locale);
    await registerViaApi(page, { locale });
    const gameId = await createGameViaApi(page, { contentLanguage: locale });
    const spec = await getGameSpec(gameId);
    await openGame(page, gameId);
    const { sessionId, client } = await snapshot(page);
    const area = spec.areas[0]!;
    const st = area.stations.find((s) => s.kind === "challenge")!;
    // before any mistake the results page offers no review link
    await page.goto(`/games/${gameId}/results/${sessionId}`);
    await expect(page.getByTestId("review-open")).toHaveCount(0);
    // a miss on an OPEN challenge does not release the answer anywhere yet
    const opened = await sendPlayEvent(page, sessionId, { type: "open", stationId: st.id });
    const ch = challengeOf(spec, opened.body.data.challenge.id);
    if (ch.type === "program" || ch.type === "simulation") test.skip(true, "first station is not a plain question");
    await sendPlayEvent(page, sessionId, { type: "answer", stationId: st.id, answer: wrongAnswer(ch) });
    await page.goto(`/games/${gameId}/results/${sessionId}/review`);
    await expect(page.getByTestId("review-empty")).toBeVisible();
    // once resolved, the miss is reviewable with the right answer and the explanation
    await sendPlayEvent(page, sessionId, { type: "answer", stationId: st.id, answer: correctAnswer(ch) });
    await page.goto(`/games/${gameId}/results/${sessionId}`);
    await page.getByTestId("review-open").click();
    await page.waitForURL(/\/review$/);
    const item = page.getByTestId("review-item");
    await expect(item).toHaveCount(1);
    await expect(item).toContainText(ch.title);
    await expect(item).toContainText(ch.explanation);
    await expect(page.getByTestId("review-answer")).not.toBeEmpty();
    void client;
    // another account cannot see it
    const other = await browser.newContext();
    const op = await other.newPage();
    const res = await op.goto(`${new URL(page.url()).origin}/games/${gameId}/results/${sessionId}/review`);
    expect(res?.url()).toMatch(/login/);
    await other.close();
  });
}
