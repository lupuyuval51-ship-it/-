import { expect, test } from "./fixtures";
import { apiPost, createGameViaApi, registerViaApi, rightFor, sendPlayEvent, setLocaleCookie } from "./helpers";
import { dbRows, getGameSpec, setPlan, userIdOf } from "./db";

test.describe("library, details and modification", () => {
  test("details never show answers; rename, edit mechanics (new version), progress, reset and delete all work", async ({ page }) => {
    test.setTimeout(120_000);
    await setLocaleCookie(page, "en");
    const { email } = await registerViaApi(page, { locale: "en" });
    const userId = await userIdOf(email);
    const gameId = await createGameViaApi(page);
    const spec = await getGameSpec(gameId);

    await page.goto("/games");
    await expect(page.getByTestId("game-card")).toHaveCount(1);
    await page.getByRole("link", { name: "Details" }).click();
    await page.waitForURL(`**/games/${gameId}`);
    const body = await page.locator("main").innerText();
    await expect(page.getByTestId("game-title")).toContainText(spec.meta.title);
    await expect(page.getByTestId("badge-demo")).toBeVisible();
    for (const ch of spec.challenges) {
      if (ch.type === "choice") for (const o of ch.options) expect(body, "answer option text must not be on the details page").not.toContain(o.text);
    }
    expect(body).toContain(spec.learning.goal);

    // rename = cosmetic (no new version)
    await page.getByTestId("edit-title").fill("My Loops Quest");
    await page.getByTestId("edit-save").click();
    await expect(page.getByTestId("edit-message")).toContainText("Saved");
    await expect(page.getByTestId("game-title")).toHaveText("My Loops Quest");
    expect(await dbRows('SELECT revision FROM "GameRevision" WHERE "gameId" = $1', [gameId])).toHaveLength(1);

    // a mechanic outside the game's own level cannot be switched on (this Free game is level B; adaptive difficulty is level A): the server refuses, whatever the form shows
    expect(spec.meta.featureTier).toBe("B");
    const locked = await page.request.patch(`/api/games/${gameId}`, { data: { mechanics: { adaptive_difficulty: true } }, headers: { origin: new URL(page.url()).origin } });
    expect(locked.status()).toBe(403);
    expect(((await locked.json()) as { error: { code: string } }).error.code).toBe("FEATURE_TIER_LOCKED");
    await setPlan(email, "PLUS");

    // changing gameplay (optional mechanic) creates version 2 and keeps history
    await page.getByLabel("Timed bonus").check();
    await page.getByTestId("edit-save").click();
    await expect(page.getByTestId("edit-message")).toContainText("Saved");
    await expect.poll(async () => (await dbRows<{ revision: number }>('SELECT revision FROM "Game" WHERE id = $1', [gameId]))[0]!.revision).toBe(2);
    await expect(page.getByText("Version 2").first()).toBeVisible();
    expect((await dbRows<{ reason: string }>('SELECT reason FROM "GameRevision" WHERE "gameId" = $1 ORDER BY revision', [gameId])).map((r) => r.reason)).toEqual(["create", "edit"]);

    // an invalid edit is rejected by validation
    expect((await apiPost(page, `/api/games/${gameId}`, {})).status).toBe(405); // POST not allowed on the resource
    const bad = await page.request.patch(`/api/games/${gameId}`, { data: { title: "" }, headers: { origin: new URL(page.url()).origin } });
    expect(bad.status()).toBe(400);

    // play a bit through the API (browser play is covered elsewhere), then see progress on the details page
    const start = await apiPost<{ sessionId: string }>(page, `/api/games/${gameId}/session`, {});
    const sessionId = start.body.sessionId;
    const opened = await sendPlayEvent(page, sessionId, { type: "open", stationId: "s-var1" });
    await sendPlayEvent(page, sessionId, { type: "answer", stationId: "s-var1", answer: rightFor(spec, opened.body.data.challenge) });
    await page.goto(`/games/${gameId}`);
    await expect(page.getByTestId("details-progress")).toContainText("In progress");
    await expect(page.getByRole("link", { name: "Continue" }).first()).toBeVisible();

    // reset progress
    page.once("dialog", (d) => d.accept());
    await page.getByTestId("reset-progress").click();
    await expect(page.getByTestId("details-progress")).toContainText("not finished");
    expect((await dbRows<{ status: string }>('SELECT status FROM "PlaySession" WHERE id = $1', [sessionId]))[0]!.status).toBe("ABANDONED");

    // the extend shortcut preselects the right mode and game (extending adds areas: a Plus feature, locked on the Free plan)
    await setPlan(email, "PLUS");
    await page.getByTestId("extend-link").click();
    await page.waitForURL(/\/create\?mode=EXTEND/);
    await expect(page.getByTestId("mode-EXTEND")).toBeChecked();
    await expect(page.getByTestId("extend-game")).toHaveValue(gameId);

    // delete
    await page.goto(`/games/${gameId}`);
    page.once("dialog", (d) => d.accept());
    await page.getByTestId("delete-game").click();
    await page.waitForURL("**/games");
    await expect(page.getByTestId("lib-empty")).toBeVisible();
    expect((await dbRows<{ deletedAt: string | null }>('SELECT "deletedAt" FROM "Game" WHERE id = $1', [gameId]))[0]!.deletedAt).not.toBeNull();
    expect((await page.request.get(`/api/games/${gameId}`)).status()).toBe(404);
    await page.goto(`/play/${gameId}`);
    await expect(page.getByTestId("not-found")).toBeVisible();
    // deleting a game does not refund the generation credit (it was delivered)
    const usage = await dbRows<{ kind: string }>('SELECT kind FROM "UsageRecord" WHERE "userId" = $1 ORDER BY "createdAt"', [userId]);
    expect(usage.map((u) => u.kind)).toEqual(["RESERVE", "COMMIT"]);
  });

  test("account settings: profile, language, region (changes the price shown), password change and account deletion", async ({ page, browser }) => {
    test.setTimeout(120_000);
    await setLocaleCookie(page, "en");
    const { email, password } = await registerViaApi(page, { locale: "en", country: "US" });
    await page.goto("/account");
    await expect(page.getByTestId("account-plan")).toHaveText("Free");
    await expect(page.getByTestId("usage-ledger")).toContainText("No generations yet");

    await page.locator("#displayName").fill("Renamed Player");
    await page.getByTestId("account-region").selectOption("IL");
    await page.getByTestId("profile-save").click();
    await expect(page.getByTestId("profile-message")).toContainText("Saved");
    await page.goto("/pricing");
    await expect(page.getByTestId("price-PLUS")).toContainText("₪5");

    await page.goto("/account");
    await page.locator("#current").fill(password);
    await page.locator("#next").fill("an entirely new passphrase");
    // the other device (a second browser) is signed out when the password changes
    const other = await browser.newContext();
    const otherPage = await other.newPage();
    await otherPage.goto("/api/ai/status");
    const login = await apiPost(otherPage, "/api/auth/login", { email, password });
    expect(login.status).toBe(200);
    expect((await otherPage.request.get("/api/games")).status()).toBe(200);
    await page.getByTestId("password-form").getByRole("button").click();
    await expect(page.getByText("Password changed")).toBeVisible();
    expect((await otherPage.request.get("/api/games")).status()).toBe(401);
    expect((await page.request.get("/api/games")).status()).toBe(200); // this device stays signed in
    await other.close();

    // deletion requires the password and removes the account
    await page.locator("#del-password").fill("wrong password");
    page.once("dialog", (d) => d.accept());
    await page.getByTestId("delete-form").getByRole("button").click();
    await expect(page.getByTestId("delete-form").getByRole("alert")).toContainText("incorrect");
    await page.locator("#del-password").fill("an entirely new passphrase");
    page.once("dialog", (d) => d.accept());
    await page.getByTestId("delete-form").getByRole("button").click();
    await page.waitForURL("**/");
    expect(await dbRows('SELECT id FROM "User" WHERE email = $1', [email])).toHaveLength(0);
  });
});
