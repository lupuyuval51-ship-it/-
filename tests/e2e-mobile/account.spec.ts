import { expect, test, type Page, type Route } from "@playwright/test";

/**
 * Account + cloud sync UI against a fake Supabase (all requests to the project URL are answered here, nothing leaves
 * the machine). The sync merge logic itself is covered by tests/unit/sync.test.ts; this checks the wiring:
 * sign-in, what gets pushed, the sync status, sign-out and account deletion.
 */
const PROJECT = "https://dytftgtyugvzfumdcoep.supabase.co";
const USER_ID = "11111111-2222-3333-4444-555555555555";

function fakeJwt(): string {
  const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const now = Math.floor(Date.now() / 1000);
  return `${b64({ alg: "HS256", typ: "JWT" })}.${b64({ sub: USER_ID, role: "authenticated", aud: "authenticated", email: "kid@example.test", exp: now + 3600, iat: now })}.sig`;
}

interface FakeState { pushed: Record<string, unknown[]>; deleted: boolean; signedOut: boolean; auth: string[] }

async function fakeSupabase(page: Page): Promise<FakeState> {
  const state: FakeState = { pushed: {}, deleted: false, signedOut: false, auth: [] };
  const user = { id: USER_ID, aud: "authenticated", role: "authenticated", email: "kid@example.test", app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString() };
  const cors = { "access-control-allow-origin": "*", "access-control-allow-headers": "*", "access-control-allow-methods": "*" };
  await page.route(`${PROJECT}/**`, async (route: Route) => {
    const req = route.request();
    const url = new URL(req.url());
    if (req.method() === "OPTIONS") return route.fulfill({ status: 204, headers: cors });
    if (url.pathname === "/auth/v1/token") {
      state.auth.push(req.postDataJSON()?.email ?? "");
      return route.fulfill({ status: 200, headers: cors, contentType: "application/json", body: JSON.stringify({ access_token: fakeJwt(), token_type: "bearer", expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, refresh_token: "r1", user }) });
    }
    if (url.pathname === "/auth/v1/user") return route.fulfill({ status: 200, headers: cors, contentType: "application/json", body: JSON.stringify(user) });
    if (url.pathname === "/auth/v1/logout") { state.signedOut = true; return route.fulfill({ status: 204, headers: cors }); }
    if (url.pathname === "/functions/v1/delete-account") { state.deleted = true; return route.fulfill({ status: 200, headers: cors, contentType: "application/json", body: '{"deleted":true}' }); }
    if (url.pathname.startsWith("/rest/v1/")) {
      const table = url.pathname.split("/").pop()!;
      if (req.method() === "GET") return route.fulfill({ status: 200, headers: { ...cors, "content-range": "*/0" }, contentType: "application/json", body: "[]" });
      const body = req.postDataJSON();
      (state.pushed[table] ??= []).push(...(Array.isArray(body) ? body : [body]));
      return route.fulfill({ status: 201, headers: cors, contentType: "application/json", body: "[]" });
    }
    return route.fulfill({ status: 404, headers: cors, body: "{}" });
  });
  return state;
}

test("sign in backs up the games, shows the sync status, sign-out keeps games on the phone, account can be deleted", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const cloud = await fakeSupabase(page);

  // a game on the phone before signing in
  await page.goto("/#/create");
  await page.locator("#subject").fill("Fractions");
  await page.getByTestId("mobile-create-submit").click();
  await expect(page.getByTestId("play-root")).toBeVisible();

  await page.goto("/#/settings");
  await expect(page.getByTestId("account-signed-out")).toBeVisible();
  // validation before any network call
  await page.locator("#acc-email").fill("not-an-email");
  await page.locator("#acc-password").fill("short");
  await page.getByTestId("sign-in").click();
  await expect(page.getByTestId("account-signed-out").getByRole("alert")).toBeVisible();
  expect(cloud.auth).toEqual([]);

  await page.locator("#acc-email").fill("kid@example.test");
  await page.locator("#acc-password").fill("long-enough-password");
  await page.getByTestId("sign-in").click();
  await expect(page.getByTestId("account-signed-in")).toBeVisible();
  await expect(page.getByTestId("sync-status")).toHaveAttribute("data-status", "ok", { timeout: 15_000 });
  expect(cloud.auth).toEqual(["kid@example.test"]);
  expect(cloud.pushed.games?.length).toBe(1);
  expect((cloud.pushed.games![0] as { title: string }).title).toMatch(/Fraction/i);
  expect(cloud.pushed.sessions?.length).toBe(1);
  // the user id is never sent by the app: the database sets it from the token
  expect(JSON.stringify(cloud.pushed)).not.toContain(USER_ID);

  // sign out: games stay on the phone
  await page.getByTestId("sign-out").click();
  await expect(page.getByTestId("account-signed-out")).toBeVisible();
  await page.goto("/#/");
  await expect(page.getByTestId("mobile-game")).toHaveCount(1);

  // sign in again and delete the account
  await page.goto("/#/settings");
  await page.locator("#acc-email").fill("kid@example.test");
  await page.locator("#acc-password").fill("long-enough-password");
  await page.getByTestId("sign-in").click();
  await expect(page.getByTestId("account-signed-in")).toBeVisible();
  await page.getByTestId("delete-account").click();
  await page.getByTestId("delete-account-confirm").click();
  await expect(page.getByTestId("account-signed-out")).toBeVisible();
  expect(cloud.deleted).toBe(true);
  expect(errors).toEqual([]);
});
