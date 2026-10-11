import { expect, test } from "./fixtures";
import { apiPost, registerViaUi, setLocaleCookie } from "./helpers";
import { dbCount, dbRows, userIdOf } from "./db";

test.describe("creating a game", () => {
  test("Fast Game: form → live progress → delivered once → credit used → exhausted state explained", async ({ page }) => {
    await setLocaleCookie(page, "en");
    const { email } = await registerViaUi(page, { name: "Maya" });
    const userId = await userIdOf(email);

    await expect(page.getByTestId("dash-empty")).toBeVisible();
    await expect(page.getByTestId("dash-remaining")).toHaveText("2"); // the Free plan: two games a month

    await page.getByTestId("dash-create").click();
    await page.waitForURL("**/create");
    // honesty about what will generate the game
    const banner = page.getByTestId("provider-banner");
    await expect(banner).toHaveAttribute("data-provider-kind", "demo");
    await expect(banner).toContainText("Demo mode");
    await expect(page.getByTestId("create-allowance")).toContainText("2 of 2");

    // empty required fields are explained, nothing is sent
    await page.getByTestId("create-submit").click();
    await expect(page.getByText("This field is required.").first()).toBeVisible();
    expect(await dbCount('SELECT count(*) AS n FROM "GenerationJob" WHERE "userId" = $1', [userId])).toBe(0);

    await page.getByTestId("mode-FAST").check();
    await page.getByTestId("create-subject").fill("Python loops");
    await page.getByTestId("create-goal").fill("Understand variables, conditions and for loops");
    await page.getByTestId("create-language").selectOption("en");
    // the Free plan builds level-C games: exploration and puzzle worlds (the other types are listed as locked)
    await expect(page.getByTestId("create-gametype").locator("option[value=adventure]")).toBeDisabled();
    await expect(page.getByTestId("create-tier-note")).toContainText("level C");
    await expect(page.getByTestId("mode-locked-FULL")).toBeVisible();
    await page.getByTestId("create-gametype").selectOption("puzzle");
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
    await expect(page.getByTestId("dash-remaining")).toHaveText("1");
    await expect(page.getByTestId("game-card")).toHaveCount(1);
    await expect(page.getByTestId("badge-demo")).toBeVisible();

    // the second game of the month uses the last credit
    const second = await apiPost<{ jobId: string }>(page, "/api/generations", { idempotencyKey: "second-game-0123456789abcdef", request: { mode: "FAST", subject: "Fractions", learningGoal: "Add fractions", difficulty: "beginner", gameType: "exploration", contentLanguage: "en" } });
    expect(second.status).toBe(202);
    await expect.poll(async () => (await (await page.request.get(`/api/generations/${second.body.jobId}`)).json()).status, { timeout: 60_000 }).toBe("SUCCEEDED");
    await page.goto("/dashboard");
    await expect(page.getByTestId("dash-remaining")).toHaveText("0");
    await expect(page.getByTestId("game-card")).toHaveCount(2);

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
    // a different key uses the month's second game; the third is refused with a clear code, nothing reserved
    const second = await apiPost<{ jobId: string }>(page, "/api/generations", { idempotencyKey: "another-key-0123456789abc", request });
    expect(second.status).toBe(202);
    await expect.poll(async () => (await (await page.request.get(`/api/generations/${second.body.jobId}`)).json()).status, { timeout: 30_000 }).toBe("SUCCEEDED");
    const third = await apiPost<{ error: { code: string } }>(page, "/api/generations", { idempotencyKey: "third-key-0123456789abcdef", request });
    expect(third.status).toBe(402);
    expect(third.body.error.code).toBe("ALLOWANCE_EXHAUSTED");
    expect(await dbCount('SELECT count(*) AS n FROM "GenerationJob" WHERE "userId" = $1', [userId])).toBe(2);
    // what the plan's tier does not have is refused up front (403) and names the plan that unlocks it, whatever the browser sends
    const locked = await apiPost<{ error: { code: string; details: { requiredPlan: string } } }>(page, "/api/generations", { idempotencyKey: "locked-key-0123456789abcdef", request: { ...request, mode: "FULL", gameType: "adventure" } });
    expect(locked.status).toBe(403);
    expect(locked.body.error.code).toBe("FEATURE_TIER_LOCKED");
    expect(locked.body.error.details.requiredPlan).toBe("PLUS");
    expect(await dbCount('SELECT count(*) AS n FROM "GenerationJob" WHERE "userId" = $1', [userId])).toBe(2);
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
    // Full adventures (several areas) are not part of the Free plan's game features: refused before anything is reserved
    const freeTry = await apiPost<{ error: { code: string } }>(page, "/api/generations", { idempotencyKey: "free-full-0123456789abcdef", request: { mode: "FULL", subject: "Python loops", learningGoal: "Loops", difficulty: "beginner", gameType: "adventure", contentLanguage: "en" } });
    expect(freeTry.status).toBe(403);
    expect(freeTry.body.error.code).toBe("FEATURE_TIER_LOCKED");
    const { setPlan } = await import("./db");
    await setPlan(email, "PRO"); // the way a verified webhook would
    const startRequest = { mode: "FULL", subject: "Python loops", learningGoal: "Variables, conditions and loops", difficulty: "beginner", gameType: "adventure", contentLanguage: "en" };
    const full = await apiPost<{ jobId: string }>(page, "/api/generations", { idempotencyKey: "full-key-0123456789abcdef", request: startRequest });
    expect(full.status).toBe(202);
    await expect.poll(async () => (await (await page.request.get(`/api/generations/${full.body.jobId}`)).json()).status, { timeout: 60_000 }).toBe("SUCCEEDED");
    const [g1] = await dbRows<{ id: string; spec: { areas: unknown[]; missions: unknown[]; challenges: { id: string }[]; meta: { generator: { mode: string } } } }>('SELECT id, spec FROM "Game" WHERE "ownerId" = $1', [userId]);
    expect(g1!.spec.areas.length).toBeGreaterThanOrEqual(2);
    expect(g1!.spec.missions.length).toBeGreaterThanOrEqual(3);
    expect(g1!.spec.meta.generator.mode).toBe("FULL");
    const beforeIds = g1!.spec.challenges.map((c) => c.id);

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
