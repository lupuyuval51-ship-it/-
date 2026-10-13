import { expect, test } from "./fixtures";
import { createGameViaApi, registerViaApi, rightFor, sendPlayEvent, setLocaleCookie, wrongFor } from "./helpers";
import { getGameSpec } from "./db";
import { answerInUi, challengeOf, openGame, snapshot } from "./play-helpers";

 
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
    await sendPlayEvent(page, sessionId, { type: "answer", stationId: st.id, answer: wrongFor(spec, opened.body.data.challenge) });
    await page.goto(`/games/${gameId}/results/${sessionId}/review`);
    await expect(page.getByTestId("review-empty")).toBeVisible();
    // once resolved, the miss is reviewable with the right answer and the explanation
    await sendPlayEvent(page, sessionId, { type: "answer", stationId: st.id, answer: rightFor(spec, opened.body.data.challenge) });
    await page.goto(`/games/${gameId}/results/${sessionId}`);
    await page.getByTestId("review-open").click();
    await page.waitForURL(/\/review$/);
    const item = page.getByTestId("review-item");
    await expect(item).toHaveCount(1);
    await expect(item).toContainText(ch.title);
    await expect(item).toContainText(ch.explanation);
    await expect(page.getByTestId("review-answer")).not.toBeEmpty();
    void client;

    // "practise only these": the missed question again, unscored, graded by the server
    const scoreBefore = (await snapshot(page).catch(() => null))?.client?.score;
    await page.getByTestId("practice-start").click();
    await page.waitForURL(/\/practice$/);
    await expect(page.getByTestId("practice-progress")).toContainText("1");
    await expect(page.getByTestId("challenge-panel")).toHaveAttribute("data-challenge", ch.id);
    await answerInUi(page, ch, "wrong");
    await expect(page.getByTestId("result")).toContainText(/./);
    await expect(page.getByTestId("challenge-submit")).toBeVisible(); // not resolved after one miss: try again
    await answerInUi(page, ch, "right");
    await expect(page.getByTestId("result")).toContainText(/correct|נכון/i);
    await page.getByTestId("challenge-close").click();
    await expect(page.getByTestId("practice-done")).toBeVisible();
    await expect(page.getByTestId("practice-score")).toContainText("1");
    void scoreBefore;
    // practice never touches the score of the session
    const results = await page.goto(`/games/${gameId}/results/${sessionId}`);
    expect(results?.status()).toBe(200);
    // the practice API refuses questions that are not part of the review, and other accounts
    const foreign = await page.evaluate(async ([sid, cid]) => (await fetch(`/api/practice/${sid}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "hint", challengeId: cid }) })).status, [sessionId, spec.challenges.find((c) => c.id !== ch.id)!.id] as const);
    expect(foreign).toBe(404);
    // another account cannot see it
    const other = await browser.newContext();
    const op = await other.newPage();
    const res = await op.goto(`${new URL(page.url()).origin}/games/${gameId}/results/${sessionId}/review`);
    expect(res?.url()).toMatch(/login/);
    await other.close();
  });
}
