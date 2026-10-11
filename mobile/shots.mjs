// Store screenshots: serves nothing itself. Run `npm run mobile:build && npx vite preview --config mobile/vite.config.mts --port 4173`, then `node mobile/shots.mjs`.
import { chromium, devices } from "playwright";
const out = new URL("./store/screenshots/", import.meta.url).pathname;
const HE = `פוטוסינתזה: התהליך שבו צמחים הופכים אור לאנרגיה כימית.
כלורופיל: הצבען הירוק בעלים שקולט אור.
פיוניות: נקבוביות קטנות בעלה שמאפשרות כניסה ויציאה של גזים.
קסילם: הרקמה שמובילה מים מהשורשים לצמח.
פלואם: הרקמה שמובילה סוכר בצמח.
גלוקוז: הסוכר שהצמחים מייצרים בפוטוסינתזה.`;
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--enable-webgl"] });
// Google Play rejects screenshots whose longer side is more than twice the shorter side. Pixel 7 is 412x839 (ratio 2.04), so trim
// the height: 412x820 css px at 2.625 = 1082x2153 px.
const ctx = await b.newContext({ ...devices["Pixel 7"], viewport: { width: 412, height: 820 }, reducedMotion: "reduce" });
const p = await ctx.newPage();
const base = "http://127.0.0.1:4173/";
await p.goto(base + "#/create");
await p.locator("#subject").fill("פוטוסינתזה");
await p.locator("#material").fill(HE);
await p.waitForTimeout(600);
await p.screenshot({ path: out + "2-create.png" });
await p.getByTestId("mobile-create-submit").click();
await p.waitForFunction(() => document.querySelector("canvas")?.dataset.ready === "1", undefined, { timeout: 60000 });
await p.waitForTimeout(4500);
await p.screenshot({ path: out + "1-play.png" });
await p.goto(base + "#/");
await p.waitForTimeout(500);
await p.screenshot({ path: out + "3-library.png" });
// pause menu
await p.getByTestId("mobile-play").click();
await p.waitForFunction(() => document.querySelector("canvas")?.dataset.ready === "1", undefined, { timeout: 60000 });
await p.waitForTimeout(1500);
await p.getByTestId("pause-button").click();
await p.waitForTimeout(600);
await p.screenshot({ path: out + "4-pause.png" });
await b.close();
