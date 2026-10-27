import { expect, test } from "@playwright/test";
import * as R from "@/services/data/reducers";
import { collectErrors, LIMITED, MOCK, onboarded, seed, storeData } from "./helpers";

const GOOD = { "x-lupu-client": "web", "content-type": "application/json" };
const BODY = { messages: [{ role: "user", content: "שלום" }], mode: "explain", level: "standard", grade: 8 };

test.describe("אבטחת API", () => {
  test("חסימת בקשות לא מורשות, קלט לא תקין וגוף גדול", async ({ request }) => {
    expect((await request.post("/api/ai/chat", { headers: { "content-type": "application/json" }, data: BODY })).status()).toBe(403);
    expect((await request.post("/api/ai/chat", { headers: { ...GOOD, origin: "https://evil.example" }, data: BODY })).status()).toBe(403);
    expect((await request.post("/api/ai/chat", { headers: GOOD, data: { ...BODY, mode: "hack" } })).status()).toBe(400);
    expect((await request.post("/api/ai/chat", { headers: GOOD, data: "{not json" })).status()).toBe(400);
    expect((await request.post("/api/ai/vision", { headers: GOOD, data: { grade: 8 } })).status()).toBe(400);
    expect((await request.post("/api/ai/generate", { headers: GOOD, data: { kind: "nope" } })).status()).toBe(400);
    const huge = await request.post("/api/ai/chat", { headers: GOOD, data: { ...BODY, messages: [{ role: "user", content: "א".repeat(9000) }] } });
    expect(huge.status()).toBe(400);
    const tooLarge = await request.post("/api/ai/vision", { headers: GOOD, data: { image: { mediaType: "image/png", data: "A".repeat(11_000_000) }, grade: 8 } });
    expect([400, 413]).toContain(tooLarge.status());
    // GET אינו נתמך על נתיבי ה-AI שמבצעים פעולה
    expect((await request.get("/api/ai/chat")).status()).toBe(405);
  });

  test("מגבלת קצב: אחרי המכסה 429 עם Retry-After והודעה בעברית", async ({ request }) => {
    const statuses: number[] = [];
    let last: Awaited<ReturnType<typeof request.post>> | null = null;
    for (let i = 0; i < 5; i++) {
      last = await request.post(`${LIMITED}/api/ai/chat`, { headers: GOOD, data: BODY });
      statuses.push(last.status());
    }
    expect(statuses.slice(0, 3)).toEqual([200, 200, 200]);
    expect(statuses.slice(3)).toEqual([429, 429]);
    expect(last!.headers()["retry-after"]).toBeTruthy();
    expect(((await last!.json()) as { error: { message: string } }).error.message).toContain("יותר מדי בקשות");
  });

  test("מפתח ה-API לעולם לא נחשף בדפדפן: לא ב-HTML, לא בחבילות JS ולא ב-/api/ai/status", async ({ page, request }) => {
    const bodies: string[] = [];
    page.on("response", async (r) => {
      const t = r.headers()["content-type"] ?? "";
      if (/javascript|html|json/.test(t)) bodies.push(await r.text().catch(() => ""));
    });
    await seed(page, onboarded());
    await page.goto("/tutor");
    await page.getByLabel("הודעה למורה").fill("בדיקה");
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("msg-ai").first()).toBeVisible({ timeout: 15_000 });
    const status = await (await request.get("/api/ai/status")).text();
    bodies.push(status);
    const all = bodies.join("\n");
    // הערך הסודי עצמו לעולם לא מגיע לדפדפן (שם המשתנה מופיע רק בטקסט ההסבר למשתמש)
    expect(all).not.toContain("e2e-test-key");
    expect(all).not.toMatch(/sk-ant-[A-Za-z0-9_-]{10,}/);
    expect(status).toContain('"configured":true');
    // הקריאה לספק מתבצעת מהשרת בלבד: הדפדפן פנה רק ל-/api/ai/chat בתוך האתר
    const reqs = await (await request.get(`${MOCK}/__requests`)).json();
    expect(reqs.length).toBeGreaterThan(0);
  });

  test("כותרות אבטחה ובדיקת בריאות", async ({ request }) => {
    const res = await request.get("/dashboard");
    const h = res.headers();
    expect(h["x-content-type-options"]).toBe("nosniff");
    expect(h["x-frame-options"]).toBe("DENY");
    expect(h["referrer-policy"]).toBeTruthy();
    expect(h["permissions-policy"]).toContain("camera=(self)");
    expect(h["x-powered-by"]).toBeUndefined();
    expect((await (await request.get("/api/health")).json()).ok).toBe(true);
  });
});

test.describe("פרטיות ונתונים", () => {
  test("פרופיל קטין פרטי: אין שדות ציבוריים, ואין מידע אישי מעבר לנחוץ", async ({ page }) => {
    await seed(page, onboarded());
    await page.goto("/dashboard");
    const d = await storeData(page);
    expect(d.profile!.isPrivate).toBe(true);
    expect(Object.keys(d.profile!).sort()).toEqual(["createdAt", "dailyMinutes", "displayName", "goals", "grade", "id", "isPrivate", "onboarded", "theme"]);
    // אין בממשק שיתוף, צ׳אט בין תלמידים או מיקום
    await page.goto("/settings");
    await expect(page.getByText(/אין פרופיל ציבורי/)).toBeVisible();
  });

  test("ייצוא נתונים אישיים כקובץ JSON", async ({ page }) => {
    const d = onboarded((x) => R.addHomework(x, { subjectId: null, title: "לייצוא", description: "", dueDate: "2030-01-01", priority: "low" }).data);
    await seed(page, d);
    await page.goto("/settings");
    const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "ייצוא" }).click()]);
    expect(download.suggestedFilename()).toMatch(/^lupu-study-ai-export-\d{4}-\d{2}-\d{2}\.json$/);
    const content = JSON.parse(await (await import("node:fs/promises")).readFile((await download.path())!, "utf8"));
    expect(content.app).toBe("LUPU Study AI");
    expect(content.data.homework[0].title).toBe("לייצוא");
    expect(content.data.profile.displayName).toBe("נועה");
  });

  test("מחיקת היסטוריית AI ומחיקת כל הנתונים (כולל קבצים) מחזירה להקמה", async ({ page }) => {
    const errors = collectErrors(page);
    await seed(page, onboarded());
    await page.goto("/tutor");
    await page.getByLabel("הודעה למורה").fill("שאלה");
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("msg-ai").first()).toBeVisible({ timeout: 15_000 });
    await page.goto("/settings");
    await expect(page.getByText(/1 שיחות ו-2 הודעות יימחקו/)).toBeVisible();
    await page.getByRole("button", { name: "מחיקה", exact: true }).click();
    await page.getByRole("button", { name: "מחיקה", exact: true }).last().click();
    const data = await storeData(page);
    expect(data.conversations).toHaveLength(0);
    expect(data.messages).toHaveLength(0);
    expect(data.profile).not.toBeNull(); // שאר הנתונים נשארו

    // שמירת קובץ ואז מחיקה מלאה
    await page.goto("/library");
    await page.getByTestId("library-file-input").setInputFiles({ name: "n.txt", mimeType: "text/plain", buffer: Buffer.from("תוכן") });
    await expect(page.getByRole("button", { name: "n", exact: true })).toBeVisible();
    await page.goto("/settings");
    await page.getByRole("button", { name: "מחיקת הכול" }).click();
    await page.getByRole("button", { name: "מחק הכול" }).click();
    await page.waitForURL("**/onboarding");
    const cleared = await page.evaluate(async () => ({
      data: JSON.parse(localStorage.getItem("lupu:data:v1") ?? "{}"),
      keys: await new Promise<number>((res) => { const r = indexedDB.open("lupu-blobs"); r.onsuccess = () => { const tx = r.result.transaction("files"); const c = tx.objectStore("files").count(); c.onsuccess = () => res(c.result); }; r.onerror = () => res(-1); }),
    }));
    expect(cleared.data.profile ?? null).toBeNull();
    expect(cleared.data.studyMaterials ?? []).toHaveLength(0);
    expect(cleared.keys).toBe(0);
    expect(errors).toEqual([]);
  });
});

test.describe("אורח, התחברות ורשת", () => {
  test("מסך התחברות במצב מקומי מסביר מה חסר ומאפשר להמשיך כאורח", async ({ page }) => {
    await seed(page, onboarded());
    await page.goto("/login");
    await expect(page.getByTestId("auth-unconfigured")).toContainText("התחברות עדיין לא הוגדרה");
    await page.getByRole("link", { name: "המשך במצב מקומי" }).click();
    await page.waitForURL("**/dashboard");
  });

  test("ניתוק רשת: הודעה ברורה, העבודה המקומית ממשיכה והנתונים נשמרים", async ({ page, context }) => {
    const errors = collectErrors(page);
    await seed(page, onboarded());
    await page.goto("/homework");
    await context.setOffline(true);
    await expect(page.getByText("אין חיבור לאינטרנט")).toBeVisible();
    await page.getByRole("button", { name: "משימה חדשה" }).first().click();
    await page.getByLabel("כותרת").fill("נוצרה offline");
    await page.getByRole("button", { name: "שמירה" }).click();
    await expect(page.locator("ul.space-y-3").getByText("נוצרה offline")).toBeVisible();
    await context.setOffline(false);
    await expect(page.getByText("אין חיבור לאינטרנט")).toHaveCount(0);
    expect((await storeData(page)).homework.some((h: { title: string }) => h.title === "נוצרה offline")).toBe(true);
    expect(errors).toEqual([]);
  });

  test("ניתוק רשת בזמן שיחה עם ה-AI: הודעת שגיאה מובנית עם 'נסה שוב', וההתאוששות עובדת", async ({ page, context }) => {
    await seed(page, onboarded());
    await page.goto("/tutor");
    await context.setOffline(true);
    await page.getByLabel("הודעה למורה").fill("שאלה offline");
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("msg-error")).toContainText("אין חיבור לאינטרנט", { timeout: 15_000 });
    await context.setOffline(false);
    await page.getByRole("button", { name: "נסה שוב" }).click();
    await expect(page.getByTestId("msg-ai").first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("msg-error")).toHaveCount(0);
  });

  test("נתונים פגומים באחסון המקומי לא מקריסים את האפליקציה", async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("lupu:data:v1", "{broken json"));
    await page.goto("/dashboard");
    await page.waitForURL("**/onboarding");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("LUPU Study AI");
  });
});
