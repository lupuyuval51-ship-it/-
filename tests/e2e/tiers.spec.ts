import { expect, test } from "./fixtures";
import { apiPost, createGameViaApi, registerViaApi, setLocaleCookie } from "./helpers";
import { dbRows, setGraphicsPreference, setPlan, userIdOf } from "./db";
import { openGame, snapshot } from "./play-helpers";

/* eslint-disable @typescript-eslint/no-explicit-any */

interface Look {
  tier: string;
  profile: any;
  stats: Record<string, string | undefined>;
  shot: Buffer;
}

/** Load the same game for the account as it is configured right now and capture what is actually rendered. */
async function capture(page: import("@playwright/test").Page, gameId: string): Promise<Look> {
  await openGame(page, gameId);
  // identical vantage point for every tier: same spot, same yaw, same time on screen
  await page.evaluate(() => (window as any).__LEVELUP_TEST__.teleport(0, 0.1, 2));
  await page.waitForFunction(() => Number((document.querySelector("canvas") as HTMLCanvasElement).dataset.frames) > 40, undefined, { timeout: 60_000 });
  await page.waitForTimeout(1500);
  const snap = await snapshot(page);
  const stats = await page.evaluate(() => ({ ...(document.querySelector("canvas") as HTMLCanvasElement).dataset }));
  const shot = await page.screenshot({ clip: (await page.locator("canvas").first().boundingBox())! });
  return { tier: snap.tier, profile: snap.profile, stats, shot };
}

/** Pixel statistics computed in a throw-away page (no image libraries needed). */
async function compare(page: import("@playwright/test").Page, a: Buffer, b: Buffer) {
  const scratch = await page.context().newPage();
  try {
    await scratch.setContent("<canvas id=c></canvas>");
    return await scratch.evaluate(
      async ([x, y]) => {
        const load = (b64: string) => new Promise<HTMLImageElement>((res) => { const i = new Image(); i.onload = () => res(i); i.src = `data:image/png;base64,${b64}`; });
        const [ia, ib] = await Promise.all([load(x!), load(y!)]);
        const w = 320, h = 200;
        const c = document.getElementById("c") as HTMLCanvasElement;
        c.width = w; c.height = h;
        const ctx = c.getContext("2d", { willReadFrequently: true })!;
        const px = (img: HTMLImageElement) => { ctx.clearRect(0, 0, w, h); ctx.drawImage(img, 0, 0, w, h); return ctx.getImageData(0, 0, w, h).data; };
        const da = px(ia), db = px(ib);
        let diff = 0;
        const lum = (d: Uint8ClampedArray) => { let s = 0, s2 = 0; const n = d.length / 4; for (let i = 0; i < d.length; i += 4) { const l = 0.2126 * d[i]! + 0.7152 * d[i + 1]! + 0.0722 * d[i + 2]!; s += l; s2 += l * l; } return { mean: s / n, std: Math.sqrt(Math.max(0, s2 / n - (s / n) ** 2)) }; };
        for (let i = 0; i < da.length; i += 4) diff += (Math.abs(da[i]! - db[i]!) + Math.abs(da[i + 1]! - db[i + 1]!) + Math.abs(da[i + 2]! - db[i + 2]!)) / 3;
        return { mad: diff / (da.length / 4), a: lum(da), b: lum(db) };
      },
      [a.toString("base64"), b.toString("base64")] as const,
    );
  } finally {
    await scratch.close();
  }
}

test.describe("graphics tiers are enforced by the server and really render differently", () => {
  test.setTimeout(300_000);

  test("Free: B by default, may choose C, can never obtain A (UI, API and forged session requests)", async ({ page }) => {
    await setLocaleCookie(page, "en");
    const { email } = await registerViaApi(page, { locale: "en" });
    const userId = await userIdOf(email);
    const gameId = await createGameViaApi(page);

    // Account UI: Tier A is locked and explained
    await page.goto("/account");
    await expect(page.getByTestId("tier-A")).toBeDisabled();
    await expect(page.getByTestId("tier-B")).toBeEnabled();
    await expect(page.getByTestId("tier-C")).toBeEnabled();
    await expect(page.getByTestId("tier-auto")).toBeChecked();

    // API: a hand-crafted request for A is refused and nothing is stored
    const forged = await page.request.patch("/api/account", { data: { graphicsPreference: "A" }, headers: { origin: new URL(page.url()).origin, "x-forwarded-for": "10.9.9.9" } });
    expect(forged.status()).toBe(403);
    expect((await forged.json()).error.code).toBe("TIER_NOT_ALLOWED");
    expect((await dbRows<{ graphicsPreference: string | null }>('SELECT "graphicsPreference" FROM "UserProfile" WHERE "userId" = $1', [userId]))[0]!.graphicsPreference).toBeNull();

    // A hand-crafted session start cannot ask for a tier either (the server ignores it)
    const start = await apiPost<{ render: { tier: string } }>(page, `/api/games/${gameId}/session`, { restart: true, tier: "A", graphicsTier: "A", plan: "PRO" });
    expect(start.status).toBe(200);
    expect(start.body.render.tier).toBe("B");

    // Even a stale "A" in the database (e.g. after a downgrade) is clamped when playing
    await setGraphicsPreference(email, "A");
    await openGame(page, gameId);
    await expect(page.getByTestId("play-root")).toHaveAttribute("data-tier", "B");

    // Choosing C through the UI works and is what gets rendered
    await page.goto("/account");
    await page.getByTestId("tier-C").check();
    await page.getByTestId("profile-save").click();
    await expect(page.getByTestId("profile-message")).toContainText("Saved");
    await openGame(page, gameId);
    await expect(page.getByTestId("play-root")).toHaveAttribute("data-tier", "C");
    expect((await page.evaluate(() => (document.querySelector("canvas") as HTMLCanvasElement).dataset.tier))).toBe("C");
  });

  test("Tier A for Plus and Pro, identical for both; B and C are lighter; the rendered image and GPU work differ", async ({ page }) => {
    await setLocaleCookie(page, "en");
    const { email } = await registerViaApi(page, { locale: "en" });
    const gameId = await createGameViaApi(page);

    const looks: Record<string, Look> = {};
    await setGraphicsPreference(email, "C");
    looks.C = await capture(page, gameId);
    await setGraphicsPreference(email, "B");
    looks.B = await capture(page, gameId);

    // upgrading changes the result WITHOUT touching any setting (preference is "automatic")
    await setGraphicsPreference(email, null);
    await setPlan(email, "PLUS");
    looks.plus = await capture(page, gameId);
    await setPlan(email, "PRO");
    looks.pro = await capture(page, gameId);

    expect(looks.C!.tier).toBe("C");
    expect(looks.B!.tier).toBe("B");
    expect(looks.plus!.tier).toBe("A");
    expect(looks.pro!.tier).toBe("A");

    // Plus and Pro receive exactly the same render profile and the same renderer configuration
    expect(looks.pro!.profile).toEqual(looks.plus!.profile);
    // The live renderer is compared at the same fallback level only: under load a software renderer is slow enough for the frame
    // governor to step one run down (a smaller pixel ratio) and not the other. The profile above is what the server granted.
    expect(looks.pro!.stats.toneMapping).toBe(looks.plus!.stats.toneMapping);
    if (looks.pro!.stats.qualityLevel === looks.plus!.stats.qualityLevel) for (const k of ["shadowMap", "pixelRatio"]) expect(looks.pro!.stats[k], k).toBe(looks.plus!.stats[k]);

    // The tiers genuinely configure the renderer differently
    const s = (l: Look, k: string) => l.stats[k];
    expect(s(looks.plus!, "shadowMap")).not.toBe("off");
    expect(s(looks.C!, "shadowMap")).toBe("off");
    expect(new Set([s(looks.C!, "shadowMap"), s(looks.B!, "shadowMap"), s(looks.plus!, "shadowMap")]).size).toBe(3);
    expect(looks.plus!.profile.materials).not.toBe(looks.B!.profile.materials);
    expect(looks.plus!.profile.shadows.mapSize).toBeGreaterThan(looks.B!.profile.shadows.mapSize);
    expect(looks.plus!.profile.particles.ambient).toBeGreaterThan(looks.B!.profile.particles.ambient);
    expect(looks.B!.profile.particles.ambient).toBeGreaterThan(looks.C!.profile.particles.ambient);
    expect(Number(s(looks.plus!, "triangles"))).toBeGreaterThan(Number(s(looks.C!, "triangles")));
    expect(Number(s(looks.plus!, "calls"))).toBeGreaterThan(Number(s(looks.C!, "calls")));
    // Live texture counts are only comparable at the same fallback level: a software renderer is slow enough for the frame governor
    // to step Tier A down (fewer textures) while Tier C keeps its level. The profile always says A gets the larger textures.
    expect(looks.plus!.profile.textureSize).toBeGreaterThan(looks.C!.profile.textureSize);
    if (s(looks.plus!, "qualityLevel") === s(looks.C!, "qualityLevel")) expect(Number(s(looks.plus!, "textures"))).toBeGreaterThanOrEqual(Number(s(looks.C!, "textures")));

    // ...and the actual pixels differ between tiers, but Plus vs Pro is the same picture
    const aVsB = await compare(page, looks.plus!.shot, looks.B!.shot);
    const aVsC = await compare(page, looks.plus!.shot, looks.C!.shot);
    const bVsC = await compare(page, looks.B!.shot, looks.C!.shot);
    const plusVsPro = await compare(page, looks.plus!.shot, looks.pro!.shot);
    const report = { meanAbsPixelDiff: { A_vs_B: aVsB.mad, A_vs_C: aVsC.mad, B_vs_C: bVsC.mad, Plus_vs_Pro: plusVsPro.mad }, luminance: { A: aVsB.a, B: aVsB.b, C: bVsC.b }, stats: Object.fromEntries(Object.entries(looks).map(([k, l]) => [k, { calls: l.stats.calls, triangles: l.stats.triangles, shadowMap: l.stats.shadowMap, pixelRatio: l.stats.pixelRatio }])) };
    console.log(`[tiers] ${JSON.stringify(report)}`);
    test.info().annotations.push({ type: "pixel-diff", description: JSON.stringify(report) });
    for (const [name, buf] of Object.entries(looks)) await test.info().attach(`tier-${name}.png`, { body: buf.shot, contentType: "image/png" });
    expect(aVsB.mad).toBeGreaterThan(plusVsPro.mad * 3);
    expect(aVsC.mad).toBeGreaterThan(plusVsPro.mad * 3);
    expect(aVsB.mad).toBeGreaterThan(2);
    expect(aVsC.mad).toBeGreaterThan(2);
  });

  test("a downgrade is applied immediately: the stored preference cannot keep Tier A", async ({ page }) => {
    await setLocaleCookie(page, "en");
    const { email } = await registerViaApi(page, { locale: "en" });
    const gameId = await createGameViaApi(page);
    await setPlan(email, "PLUS");
    await setGraphicsPreference(email, "A");
    await openGame(page, gameId);
    await expect(page.getByTestId("play-root")).toHaveAttribute("data-tier", "A");
    await setPlan(email, "FREE");
    await openGame(page, gameId);
    await expect(page.getByTestId("play-root")).toHaveAttribute("data-tier", "B");
    await setPlan(email, "PLUS", "PAST_DUE"); // failed payment → no paid features either
    await openGame(page, gameId);
    await expect(page.getByTestId("play-root")).toHaveAttribute("data-tier", "B");
  });
});
