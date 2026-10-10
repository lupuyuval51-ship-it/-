import { expect, test } from "./fixtures";
import { apiPost, registerViaUi, setLocaleCookie } from "./helpers";
import { dbCount, dbRows, userIdOf } from "./db";

test.describe("creating a game", () => {
  test("Fast Game: form → live progress → delivered once → credit used → exhausted state explained", async ({ page }) => {
    await setLocaleCookie(page, "en");
    const { email } = await registerViaUi(page, { name: "Maya" });
    const userId = await userIdOf(email);

    await expect(page.getByTestId("dash-empty")).toBeVisible();
    await expect(page.getByTestId("dash-remaining")).toHaveText("1");

    await page.getByTestId("dash-create").click();
    await page.waitForURL("**/create");
    // honesty about what will generate the game
    const banner = page.getByTestId("provider-banner");
    await expect(banner).toHaveAttribute("data-provider-kind", "demo");
    await expect(banner).toContainText("Demo mode");
    await expect(page.getByTestId("create-allowance")).toContainText("1 of 1");

    // empty required fields are explained, nothing is sent
    await page.getByTestId("create-submit").click();
    await expect(page.getByText("This field is required.").first()).toBeVisible();
    expect(await dbCount('SELECT count(*) AS n FROM "GenerationJob" WHERE "userId" = $1', [userId])).toBe(0);

    await page.getByTestId("mode-FAST").check();
    await page.getByTestId("create-subject").fill("Python loops");
    await page.getByTestId("create-goal").fill("Understand variables, conditions and for loops");
    await page.getByTestId("create-language").selectOption("en");
    await page.getByTestId("create-gametype").selectOption("adventure");
    // a double click must create exactly one job and consume exactly one credit
    await page.getByTestId("create-submit").dblclick();
    await page.waitForURL(/\/generate\/[a-z0-9]+$/);
    await expect(page.getByTestId("gen-success")).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId("gen-source")).toContainText("demo template");

    expect(await dbCount('SELECT count(*) AS n FROM "GenerationJob" WHERE "userId" = $1', [userId])).toBe(1);
    const usage = await dbRows<{ kind: string }>('SELECT kind FROM "UsageRecord" WHERE "userId" = $1 ORDER BY "createdAt"', [userId]);
    expect(usage.map((u) => u.kind)).toEqual(["RESERVE", "COMMIT"]);
    const [game] = await dbRows<{ id: string; generatorKind: string; revision: number; createdVia: string }>('SELECT id, "generatorKind", revision, "createdVia" FROM "Game" WHERE "ownerId" = $1', [userId]);
    expect(game).toMatchObject({ generatorKind: "demo", revision: 1, createdVia: "FAST" });

    await page.goto("/dashboard");
    await expect(page.getByTestId("dash-remaining")).toHaveText("0");
    await expect(page.getByTestId("game-card")).toHaveCount(1);
    await expect(page.getByTestId("badge-demo")).toBeVisible();

    // the exhausted state is explained and the form cannot be submitted
    await page.goto("/create");
    await expect(page.getByTestId("create-allowance")).toContainText("used all generated games");
    await expect(page.getByTestId("create-submit")).toBeDisabled();
  });

  test("the server enforces the allowance even when the browser is bypassed; retries with one key never double-charge", async ({ page }) => {
    await setLocaleCookie(page, "en");
    const { email } = await registerViaUi(page);
    const userId = await userIdOf(email);
    const request = { mode: "FAST", subject: "Fractions", learningGoal: "Add fractions", difficulty: "beginner", gameType: "puzzle", contentLanguage: "en" };
    const key = "idem-key-0123456789abcdef";
    const first = await apiPost<{ jobId: string; created: boolean }>(page, "/api/generations", { idempotencyKey: key, request });
    const retry = await apiPost<{ jobId: string; created: boolean }>(page, "/api/generations", { idempotencyKey: key, request });
    expect(first.status).toBe(202);
    expect(retry.status).toBe(200);
    expect(retry.body.jobId).toBe(first.body.jobId);
    await expect.poll(async () => (await (await page.request.get(`/api/generations/${first.body.jobId}`)).json()).status, { timeout: 30_000 }).toBe("SUCCEEDED");
    // a different key, with the credit spent: refused with a clear code, nothing reserved
    const second = await apiPost<{ error: { code: string } }>(page, "/api/generations", { idempotencyKey: "another-key-0123456789abc", request });
    expect(second.status).toBe(402);
    expect(second.body.error.code).toBe("ALLOWANCE_EXHAUSTED");
    expect(await dbCount('SELECT count(*) AS n FROM "GenerationJob" WHERE "userId" = $1', [userId])).toBe(1);
    // malformed input is rejected by validation, not passed to the generator
    const bad = await apiPost(page, "/api/generations", { idempotencyKey: "bad-key-0123456789abcdefg", request: { ...request, subject: "" } });
    expect(bad.status).toBe(400);
    // another account cannot read this job
    const other = await page.context().browser()!.newContext();
    const otherPage = await other.newPage();
    await otherPage.goto("/api/ai/status");
    expect((await otherPage.request.get(`/api/generations/${first.body.jobId}`)).status()).toBe(401);
    await other.close();
  });

  test("Full Adventure builds a multi-area game, and Extend adds a new area while preserving the original content", async ({ page }) => {
    test.setTimeout(180_000);
    await setLocaleCookie(page, "en");
    const { email } = await registerViaUi(page);
    const userId = await userIdOf(email);
    const startRequest = { mode: "FULL", subject: "Python loops", learningGoal: "Variables, conditions and loops", difficulty: "beginner", gameType: "adventure", contentLanguage: "en" };
    const full = await apiPost<{ jobId: string }>(page, "/api/generations", { idempotencyKey: "full-key-0123456789abcdef", request: startRequest });
    expect(full.status).toBe(202);
    await expect.poll(async () => (await (await page.request.get(`/api/generations/${full.body.jobId}`)).json()).status, { timeout: 60_000 }).toBe("SUCCEEDED");
    const [g1] = await dbRows<{ id: string; spec: { areas: unknown[]; missions: unknown[]; challenges: { id: string }[]; meta: { generator: { mode: string } } } }>('SELECT id, spec FROM "Game" WHERE "ownerId" = $1', [userId]);
    expect(g1!.spec.areas.length).toBeGreaterThanOrEqual(2);
    expect(g1!.spec.missions.length).toBeGreaterThanOrEqual(3);
    expect(g1!.spec.meta.generator.mode).toBe("FULL");
    const beforeIds = g1!.spec.challenges.map((c) => c.id);

    // Free plan = one generation per month, so give the account a Plus subscription the way a verified webhook would.
    const { setPlan } = await import("./db");
    await setPlan(email, "PLUS");
    await page.goto(`/create?mode=EXTEND&game=${g1!.id}`);
    await expect(page.getByTestId("mode-EXTEND")).toBeChecked();
    await page.getByTestId("create-goal").fill("Practise nested loops");
    await page.getByTestId("create-submit").click();
    await page.waitForURL(/\/generate\//);
    await expect(page.getByTestId("gen-success")).toBeVisible({ timeout: 60_000 });

    const [g2] = await dbRows<{ revision: number; spec: { areas: unknown[]; challenges: { id: string }[] } }>('SELECT revision, spec FROM "Game" WHERE id = $1', [g1!.id]);
    expect(g2!.revision).toBe(2);
    expect(g2!.spec.areas.length).toBe(g1!.spec.areas.length + 1);
    for (const id of beforeIds) expect(g2!.spec.challenges.map((c) => c.id)).toContain(id);
    const revs = await dbRows<{ revision: number; reason: string }>('SELECT revision, reason FROM "GameRevision" WHERE "gameId" = $1 ORDER BY revision', [g1!.id]);
    expect(revs.map((r) => r.reason)).toEqual(["create", "extend"]);
    // Extend does not create a second game
    expect(await dbCount('SELECT count(*) AS n FROM "Game" WHERE "ownerId" = $1', [userId])).toBe(1);
  });
});
