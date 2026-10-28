import { createClient } from "@supabase/supabase-js";
import { expect, test, type Browser, type Page } from "@playwright/test";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const A = process.env.LIVE_USER_A!;
const B = process.env.LIVE_USER_B!;
const PW = process.env.LIVE_PASSWORD!;

test.skip(!URL || !KEY || !A || !B || !PW, "חסרים משתני סביבה לבדיקות live");

const client = async (email: string) => {
  const sb = createClient(URL, KEY, { auth: { persistSession: false } });
  const { error } = await sb.auth.signInWithPassword({ email, password: PW });
  if (error) throw error;
  return sb;
};

async function login(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("שם משתמש").fill(email.split("@")[0]);
  await page.getByLabel("סיסמה").fill(PW);
  await page.getByRole("button", { name: "התחברות", exact: true }).click();
  await page.waitForURL(/\/(dashboard|onboarding)/);
}

async function device(browser: Browser, email: string) {
  const ctx = await browser.newContext({ locale: "he-IL" });
  const page = await ctx.newPage();
  await login(page, email);
  return { ctx, page };
}

const synced = (page: Page) => expect(page.getByRole("status").filter({ hasText: "מסונכרן" })).toBeVisible({ timeout: 30_000 });

async function cleanup() {
  for (const email of [A, B]) {
    const sb = await client(email);
    const { data: u } = await sb.auth.getUser();
    for (const t of ["answer_submissions", "exam_attempts", "exam_questions", "exams", "flashcard_reviews", "flashcards", "homework", "topics", "study_materials", "xp_events", "achievements", "study_sessions", "practice_results", "calendar_events", "subjects"]) {
      await sb.from(t).delete().eq("user_id", u.user!.id);
    }
    await sb.from("profiles").delete().eq("id", u.user!.id);
    const { data: files } = await sb.storage.from("study-files").list(u.user!.id);
    if (files?.length) await sb.storage.from("study-files").remove(files.map((f) => `${u.user!.id}/${f.name}`));
  }
}

test.beforeAll(cleanup);
test.afterAll(cleanup);

test("סנכרון בין שני מכשירים, בידוד בין משתמשים, offline וקבצים", async ({ browser }) => {
  // ───── מכשיר 1: הקמה ויצירת נתונים ─────
  const d1 = await device(browser, A);
  await d1.page.waitForURL("**/onboarding");
  await d1.page.locator("#name").fill("נועה סנכרון");
  for (let i = 0; i < 5; i++) await d1.page.getByTestId("onboarding-next").click();
  await d1.page.waitForURL("**/dashboard");
  await synced(d1.page);

  await d1.page.goto("/homework");
  await d1.page.getByRole("button", { name: "משימה חדשה" }).first().click();
  await d1.page.getByLabel("כותרת").fill("משימה מהמכשיר הראשון");
  await d1.page.getByRole("button", { name: "שמירה" }).click();
  await d1.page.getByRole("checkbox", { name: /סמן משימה מהמכשיר הראשון/ }).click(); // XP
  await d1.page.waitForTimeout(2000); // מאפשר לדחיפה לסיים לפני מעבר דף

  await d1.page.goto("/flashcards");
  await d1.page.getByRole("button", { name: "כרטיסייה חדשה" }).first().click();
  await d1.page.getByLabel("שאלה (צד קדמי)").fill("שאלת סנכרון");
  await d1.page.getByLabel("תשובה (צד אחורי)").fill("תשובת סנכרון");
  await d1.page.getByRole("button", { name: "שמירה", exact: true }).click();
  await d1.page.waitForTimeout(2000);

  await d1.page.goto("/library");
  await d1.page.getByTestId("library-file-input").setInputFiles({ name: "sync.txt", mimeType: "text/plain", buffer: Buffer.from("תוכן קובץ לסנכרון") });
  await expect(d1.page.getByRole("button", { name: "sync", exact: true })).toBeVisible();
  await d1.page.waitForTimeout(3000);
  await synced(d1.page);

  // ───── אימות ישיר בענן ─────
  const sbA = await client(A);
  const uid = (await sbA.auth.getUser()).data.user!.id;
  const hw = await sbA.from("homework").select("title,done,user_id").eq("user_id", uid);
  expect(hw.data).toEqual([{ title: "משימה מהמכשיר הראשון", done: true, user_id: uid }]);
  expect((await sbA.from("flashcards").select("front")).data).toEqual([{ front: "שאלת סנכרון" }]);
  expect((await sbA.from("subjects").select("id")).data!.length).toBeGreaterThan(0);
  expect((await sbA.from("profiles").select("display_name,is_private").eq("id", uid)).data).toEqual([{ display_name: "נועה סנכרון", is_private: true }]);
  const xp = await sbA.from("xp_events").select("dedupe_key");
  expect(xp.data!.some((x) => x.dedupe_key.startsWith("hw:"))).toBe(true);
  const files = await sbA.storage.from("study-files").list(uid);
  expect(files.data!.length).toBe(1);

  // ───── מכשיר 2: ריק, אותו משתמש – מושך הכול (אין הקמה מחדש) ─────
  const d2 = await device(browser, A);
  await d2.page.waitForURL("**/dashboard", { timeout: 30_000 });
  await expect(d2.page.getByRole("heading", { level: 1 })).toContainText("נועה סנכרון");
  await d2.page.goto("/homework");
  await d2.page.getByRole("tab", { name: /הכול/ }).click();
  await expect(d2.page.locator("ul.space-y-3").getByText("משימה מהמכשיר הראשון")).toBeVisible();
  await d2.page.goto("/flashcards");
  await expect(d2.page.getByText("1 כרטיסיות מוכנות לחזרה")).toBeVisible();
  // קובץ: נשלף מהענן למכשיר 2 ונפתח בתצוגה
  await d2.page.goto("/library");
  await d2.page.getByRole("button", { name: "sync", exact: true }).click();
  await expect(d2.page.getByRole("dialog")).toContainText("תוכן קובץ לסנכרון");
  await d2.page.keyboard.press("Escape");

  // ───── עדכון ממכשיר 2 → מופיע במכשיר 1 אחרי רענון ─────
  await d2.page.goto("/homework");
  await d2.page.getByRole("button", { name: "משימה חדשה" }).first().click();
  await d2.page.getByLabel("כותרת").fill("משימה מהמכשיר השני");
  await d2.page.getByRole("button", { name: "שמירה" }).click();
  await synced(d2.page);
  await d2.page.waitForTimeout(2500);
  await d1.page.reload();
  await d1.page.goto("/homework");
  await d1.page.getByRole("tab", { name: /הכול/ }).click();
  await expect(d1.page.locator("ul.space-y-3").getByText("משימה מהמכשיר השני")).toBeVisible({ timeout: 30_000 });

  // ───── מחיקה במכשיר 1 → נמחקת בענן ─────
  await d1.page.getByRole("button", { name: "מחיקת משימה מהמכשיר השני" }).click();
  await d1.page.getByRole("button", { name: "מחיקה", exact: true }).click();
  await d1.page.waitForTimeout(3000);
  expect((await sbA.from("homework").select("title")).data!.map((r) => r.title)).toEqual(["משימה מהמכשיר הראשון"]);

  // ───── offline: יצירה בלי רשת, וסנכרון אחרי חזרת החיבור ─────
  await d1.page.goto("/homework");
  await d1.ctx.setOffline(true);
  await d1.page.getByRole("button", { name: "משימה חדשה" }).first().click();
  await d1.page.getByLabel("כותרת").fill("נוצרה בלי רשת");
  await d1.page.getByRole("button", { name: "שמירה" }).click();
  await d1.ctx.setOffline(false);
  await expect.poll(async () => (await sbA.from("homework").select("title").eq("title", "נוצרה בלי רשת")).data?.length ?? 0, { timeout: 60_000, intervals: [2000] }).toBe(1);

  // ───── בידוד: משתמש אחר לא רואה ולא יכול לכתוב לנתוני A ─────
  const sbB = await client(B);
  expect((await sbB.from("homework").select("id")).data).toEqual([]);
  expect((await sbB.from("profiles").select("id")).data).toEqual([]);
  const forged = await sbB.from("homework").insert({ id: crypto.randomUUID(), user_id: uid, title: "פריצה", due_date: "2030-01-01" });
  expect(forged.error?.message).toMatch(/row-level security/i);
  const tamper = await sbB.from("homework").update({ title: "שונה" }).eq("user_id", uid).select();
  expect(tamper.data).toEqual([]);
  expect((await sbB.storage.from("study-files").list(uid)).data ?? []).toEqual([]);
  const d3 = await device(browser, B);
  await d3.page.waitForURL("**/onboarding", { timeout: 30_000 }); // משתמש B חדש: אין לו שום נתון של A
  await d1.ctx.close(); await d2.ctx.close(); await d3.ctx.close();

  // XP לא נצבר פעמיים בענן (אילוץ unique)
  const dup = await sbA.from("xp_events").insert({ id: crypto.randomUUID(), dedupe_key: xp.data![0].dedupe_key, amount: 5, reason: "כפול" });
  expect(dup.error?.message).toMatch(/duplicate|unique/i);
});
