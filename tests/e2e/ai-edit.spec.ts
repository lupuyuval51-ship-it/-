import { expect, test } from "./fixtures";
import { apiPost, createGameViaApi, expectNoHorizontalOverflow, registerViaApi, setLocaleCookie } from "./helpers";
import { setPlan } from "./db";

/**
 * The AI robot and version history on the game page. The E2E server runs the labelled demo templates (no model),
 * so these tests cover what a person sees per plan; the edit itself, quota and restore are covered against a
 * scripted model in tests/integration/ai-edit.test.ts.
 */
test.describe("AI robot and version history by plan", () => {
  test("Free: the robot and version history are shown as locked features that point to the plans; manual edits still work", async ({ page }) => {
    await setLocaleCookie(page, "en");
    await registerViaApi(page);
    const gameId = await createGameViaApi(page);
    await page.goto(`/games/${gameId}`);

    await expect(page.getByTestId("ai-locked")).toContainText("Plus includes guided edits");
    await expect(page.getByTestId("ai-edit")).toHaveCount(0);
    await expect(page.getByTestId("history-locked")).toContainText("Plus and Pro");
    await expect(page.getByTestId("revision-row")).toHaveCount(0); // the list itself is not sent to this plan
    await page.getByTestId("ai-locked-cta").click();
    await page.waitForURL("**/pricing");

    await page.goto(`/games/${gameId}`);
    await expect(page.getByTestId("edit-form")).toBeVisible();
    // the server enforces it, not the page: calling the API directly is refused too
    const res = await apiPost<{ error: { code: string } }>(page, `/api/games/${gameId}/edit`, { instruction: "add a boss", idempotencyKey: "e2e-free-edit-1" });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FEATURE_LOCKED");
    const restore = await apiPost<{ error: { code: string } }>(page, `/api/games/${gameId}/revisions/1/restore`, {});
    expect(restore.status).toBe(403);
    expect(restore.body.error.code).toBe("FEATURE_LOCKED");
  });

  test("Plus: robot level B with its quota, the demo game is explained as not editable by the robot, history lists the current version", async ({ page }) => {
    await setLocaleCookie(page, "en");
    const { email } = await registerViaApi(page);
    const gameId = await createGameViaApi(page);
    await setPlan(email, "PLUS");
    await page.goto(`/games/${gameId}`);

    await expect(page.getByTestId("ai-locked")).toHaveCount(0);
    await expect(page.getByTestId("ai-level")).toContainText("level B");
    await expect(page.getByTestId("ai-quota")).toContainText("40 of 40 AI edits left");
    await expect(page.getByTestId("ai-blocked")).toBeVisible(); // demo templates are never edited as if they were AI output
    await expect(page.getByTestId("ai-submit")).toBeDisabled();
    await expect(page.getByTestId("ai-instruction")).toBeDisabled();
    await expect(page.getByTestId("revision-row")).toHaveCount(1);
    await expect(page.getByTestId("revision-row")).toContainText("Current");
    await expect(page.getByTestId("restore-1")).toHaveCount(0); // the current version has nothing to restore
  });

  test("Pro: robot level A; Hebrew page is RTL with the same locked/unlocked content and no horizontal overflow", async ({ page }) => {
    await setLocaleCookie(page, "he");
    const { email } = await registerViaApi(page, { locale: "he" });
    const gameId = await createGameViaApi(page);
    await page.goto(`/games/${gameId}`);
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.getByTestId("ai-locked")).toContainText("רובוט ה-AI");
    await expectNoHorizontalOverflow(page);

    await setPlan(email, "PRO");
    await page.goto(`/games/${gameId}`);
    await expect(page.getByTestId("ai-level")).toContainText("רמה A");
    await expect(page.getByTestId("ai-quota")).toContainText("200");
    await expectNoHorizontalOverflow(page);
  });
});
