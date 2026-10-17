import { expect, test } from "./fixtures";
import { PASSWORD, apiPost, createGameViaApi, randomIp, registerViaApi, registerViaUi, setLocaleCookie } from "./helpers";

test.describe("access control and sessions", () => {
  test("every signed-in screen redirects anonymous visitors to sign-in and returns them afterwards", async ({ page }) => {
    for (const path of ["/dashboard", "/create", "/games", "/account", "/generate/abc", "/games/abc", "/play/abc", "/billing/success"]) {
      await page.goto(path);
      await expect(page, path).toHaveURL(new RegExp(`/login\\?next=${encodeURIComponent(path).replace(/%2F/g, "%2F")}`));
    }
    // next= is honoured after signing in (and only for same-site paths)
    const { email } = await registerViaApi(page);
    await page.context().clearCookies();
    await page.goto("/account");
    await page.locator("#email").fill(email);
    await page.locator("#password").fill(PASSWORD);
    await page.getByTestId("auth-submit").click();
    await expect(page).toHaveURL(/\/account$/);
  });

  test("open-redirect attempts through ?next= are neutralised", async ({ page }) => {
    const { email } = await registerViaApi(page);
    await page.context().clearCookies();
    await page.goto("/login?next=https://evil.example/steal");
    await page.locator("#email").fill(email);
    await page.locator("#password").fill(PASSWORD);
    await page.getByTestId("auth-submit").click();
    await expect(page).toHaveURL(/127\.0\.0\.1:\d+\/dashboard$/);
  });

  test("API rejects anonymous callers and cross-origin mutations", async ({ page, request }) => {
    expect((await request.get("/api/games")).status()).toBe(401);
    expect((await request.get("/api/allowance")).status()).toBe(401);
    expect((await request.post("/api/generations", { data: {}, headers: { origin: "http://127.0.0.1:3100" } })).status()).toBe(401);
    const forged = await request.post("/api/auth/login", { data: { email: "a@b.co", password: "whatever-whatever" }, headers: { origin: "https://evil.example", "x-forwarded-for": randomIp() } });
    expect(forged.status()).toBe(403);
    await registerViaApi(page);
    const crossSite = await page.request.post("/api/generations", {
      data: { idempotencyKey: "x".repeat(20), request: { mode: "FAST", subject: "a", learningGoal: "b", difficulty: "beginner", gameType: "adventure", contentLanguage: "en" } },
      headers: { origin: "https://evil.example" },
    });
    expect(crossSite.status()).toBe(403);
  });

  test("session cookie is HttpOnly and SameSite=Lax; logging out invalidates it server-side", async ({ page, context }) => {
    await registerViaUi(page);
    const cookie = (await context.cookies()).find((c) => c.name === "levelup_session")!;
    expect(cookie).toMatchObject({ httpOnly: true, sameSite: "Lax" });
    const stolen = cookie.value;
    await page.getByTestId("logout").first().click();
    await page.waitForURL("**/");
    // replaying the old token after logout must not work
    await context.addCookies([{ name: "levelup_session", value: stolen, url: page.url() }]);
    expect((await page.request.get("/api/games")).status()).toBe(401);
  });

  test("users cannot see or play each other's games", async ({ browser, page }) => {
    await registerViaApi(page);
    const gameId = await createGameViaApi(page);
    await page.goto(`/games/${gameId}`);
    await expect(page.getByTestId("game-title")).toBeVisible();

    const other = await browser.newContext();
    const otherPage = await other.newPage();
    await registerViaApi(otherPage);
    expect((await otherPage.request.get(`/api/games/${gameId}`)).status()).toBe(404);
    expect((await otherPage.request.delete(`/api/games/${gameId}`, { headers: { origin: new URL(otherPage.url()).origin } })).status()).toBe(404);
    // The pages stream (root loading UI), so the HTTP status may already be 200 — what matters is that no data is shown.
    await otherPage.goto(`/games/${gameId}`);
    await expect(otherPage.getByTestId("not-found")).toBeVisible();
    await expect(otherPage.getByTestId("game-title")).toHaveCount(0);
    await otherPage.goto(`/play/${gameId}`);
    await expect(otherPage.getByTestId("not-found")).toBeVisible();
    await expect(otherPage.getByTestId("play-root")).toHaveCount(0);
    const start = await apiPost(otherPage, `/api/games/${gameId}/session`, {});
    expect(start.status).toBe(404);
    await other.close();
  });
});

test.describe("registration, sign-in and language", () => {
  test("Hebrew/RTL is the default; English/LTR works and persists", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.locator("html")).toHaveAttribute("lang", "he");
    await expect(page.getByTestId("hero-title")).toContainText("משחק");
    await page.getByTestId("language-switch").click();
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
    await expect(page.getByTestId("hero-title")).toContainText("3D game");
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
  });

  test("register in Hebrew through the form, sign out, sign in again; wrong password and duplicates are explained", async ({ page }) => {
    const { email, password } = await registerViaUi(page, { name: "דנה" });
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.getByTestId("dash-greeting")).toContainText("דנה");
    await expect(page.getByTestId("allowance-pill")).toBeVisible();
    await page.getByTestId("logout").first().click();
    await page.waitForURL("**/");

    await page.goto("/login");
    await page.locator("#email").fill(email);
    await page.locator("#password").fill("not the right password");
    await page.getByTestId("auth-submit").click();
    await expect(page.getByTestId("auth-error")).toContainText("סיסמה");
    await page.locator("#password").fill(password);
    await page.getByTestId("auth-submit").click();
    await page.waitForURL("**/dashboard");

    await page.context().clearCookies();
    await setLocaleCookie(page, "en");
    await page.route("**/api/auth/register", (route) => route.continue({ headers: { ...route.request().headers(), "x-forwarded-for": randomIp() } }));
    await page.goto("/register");
    await page.locator("#displayName").fill("Copy Cat");
    await page.locator("#email").fill(email);
    await page.locator("#password").fill(password);
    await page.getByTestId("auth-submit").click();
    await expect(page.getByTestId("auth-error")).toContainText("already exists");
  });

  test("short passwords and invalid emails are rejected before anything is sent", async ({ page }) => {
    await setLocaleCookie(page, "en");
    let sent = 0;
    await page.route("**/api/auth/register", (route) => {
      sent++;
      return route.continue();
    });
    await page.goto("/register");
    await page.locator("#displayName").fill("Short Pass");
    await page.locator("#email").fill("not-an-email");
    await page.locator("#password").fill("short");
    await page.getByTestId("auth-submit").click();
    await expect(page.getByText("Enter a valid email address.")).toBeVisible();
    await expect(page.getByText("At least 10 characters.").or(page.getByText("Please choose a longer password"))).toBeVisible();
    expect(sent).toBe(0);
  });
});
