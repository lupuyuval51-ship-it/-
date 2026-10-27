import { expect, test } from "@playwright/test";
import * as R from "@/services/data/reducers";
import { addDays, collectErrors, makePdf, makePng, MOCK, onboarded, seed, storeData, today } from "./helpers";

const NL = "[role=alert]:not(#__next-route-announcer__)";

test.beforeEach(async ({ request }) => {
  await request.get(`${MOCK}/__reset`);
});

test.describe("ספריית חומרים", () => {
  test("העלאת טקסט ו-PDF עם חילוץ טקסט, חיפוש בתוכן, עריכה ומחיקה", async ({ page }) => {
    const errors = collectErrors(page);
    await seed(page, onboarded());
    await page.goto("/library");
    await expect(page.getByText("הספרייה ריקה")).toBeVisible();
    const input = page.getByTestId("library-file-input");

    await page.getByLabel("שיוך המקצוע להעלאה").selectOption({ label: "מתמטיקה" });
    await input.setInputFiles({ name: "notes.txt", mimeType: "text/plain", buffer: Buffer.from("שברים ואחוזים: אחוז הוא חלק ממאה") });
    await expect(page.getByRole("button", { name: "notes", exact: true })).toBeVisible();

    await input.setInputFiles({ name: "geometry.pdf", mimeType: "application/pdf", buffer: makePdf(["Pythagorean theorem page one", "Triangles and hypotenuse page two"]) });
    await expect(page.getByRole("button", { name: "geometry", exact: true })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText("2 עמודים")).toBeVisible();

    // חיפוש בתוכן החומר (לא רק בשם)
    await page.getByLabel("חיפוש חומרים").fill("hypotenuse");
    await expect(page.getByRole("button", { name: "geometry", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "notes", exact: true })).toHaveCount(0);
    await page.getByLabel("חיפוש חומרים").fill("אחוז");
    await expect(page.getByRole("button", { name: "notes", exact: true })).toBeVisible();
    await page.getByLabel("חיפוש חומרים").fill("");

    const data = await storeData(page);
    const pdf = data.studyMaterials.find((m: { kind: string }) => m.kind === "pdf")!;
    expect(pdf.pages).toHaveLength(2);
    expect(pdf.pages[1].text).toContain("Triangles");
    expect(pdf.extraction).toBe("ok");

    // שינוי שם
    await page.getByRole("button", { name: "עריכת notes" }).click();
    await page.getByLabel("שם", { exact: true }).fill("סיכום אחוזים");
    await page.getByRole("button", { name: "שמירה" }).click();
    await expect(page.getByRole("button", { name: "סיכום אחוזים", exact: true })).toBeVisible();

    // פתיחת טקסט
    await page.getByRole("button", { name: "סיכום אחוזים", exact: true }).click();
    await expect(page.getByRole("dialog")).toContainText("אחוז הוא חלק ממאה");
    await page.getByRole("button", { name: "סגירה" }).first().click();

    // שליחה למורה AI
    await page.getByRole("link", { name: "שלח למורה AI" }).first().click();
    await page.waitForURL(/\/tutor\?.*material=/);
    await expect(page.getByText(/📎/)).toBeVisible();

    await page.goto("/library");
    await page.getByRole("button", { name: "מחיקת סיכום אחוזים" }).click();
    await page.getByRole("button", { name: "מחיקה", exact: true }).click();
    await expect(page.getByRole("button", { name: "סיכום אחוזים", exact: true })).toHaveCount(0);
    expect(errors).toEqual([]);
  });

  test("PDF סרוק (ללא טקסט): הודעה ברורה שהתוכן לא ניתן לקריאה, ולא משמש את ה-AI", async ({ page }) => {
    await seed(page, onboarded());
    await page.goto("/library");
    await page.getByTestId("library-file-input").setInputFiles({ name: "scan.pdf", mimeType: "application/pdf", buffer: makePdf([]) });
    await expect(page.getByText("אין בקובץ טקסט שניתן לקריאה")).toBeVisible({ timeout: 20_000 });
    const data = await storeData(page);
    expect(data.studyMaterials[0].extraction).toBe("none");
    await page.goto("/tutor");
    await page.getByRole("button", { name: /^חומרים/ }).click();
    await expect(page.getByRole("checkbox", { name: /scan/ })).toBeDisabled();
  });

  test("הגבלת סוג וגודל קבצים", async ({ page }) => {
    await seed(page, onboarded());
    await page.goto("/library");
    const input = page.getByTestId("library-file-input");
    await input.setInputFiles({ name: "run.exe", mimeType: "application/octet-stream", buffer: Buffer.from("MZ") });
    await expect(page.getByText("לא הועלה").first()).toBeVisible();
    await input.setInputFiles({ name: "huge.png", mimeType: "image/png", buffer: Buffer.alloc(7 * 1024 * 1024, 1) });
    await expect(page.getByText("גדולה מדי").first()).toBeVisible();
    await input.setInputFiles({ name: "pic.png", mimeType: "image/png", buffer: makePng(16, [1, 2, 3]) });
    await expect(page.getByRole("button", { name: "pic", exact: true })).toBeVisible();
    expect((await storeData(page)).studyMaterials).toHaveLength(1);
  });

  test("טקסט/סיכום ידני נשמר כחומר", async ({ page }) => {
    await seed(page, onboarded());
    await page.goto("/library");
    await page.getByRole("button", { name: "טקסט / סיכום" }).click();
    await page.getByRole("button", { name: "שמירה" }).click();
    await expect(page.locator(NL)).toContainText("כותרת וטקסט");
    await page.getByLabel("כותרת").fill("הערות");
    await page.getByLabel("תוכן").fill("חומר שהקלדתי");
    await page.getByRole("button", { name: "שמירה" }).click();
    await expect(page.getByRole("button", { name: "הערות", exact: true })).toBeVisible();
  });
});

test.describe("סיכומים וכרטיסיות מ-AI", () => {
  test("סיכום חכם מטקסט: נוצר, עם נוסחאות, ניתן לעריכה, להעתקה, להדפסה ולהפיכה לכרטיסיות", async ({ page, context }) => {
    const errors = collectErrors(page);
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await seed(page, onboarded());
    await page.addInitScript(() => { (window as unknown as { __printed: number }).__printed = 0; window.print = () => { (window as unknown as { __printed: number }).__printed++; }; });
    await page.goto("/summaries");
    await expect(page.getByText("אין עדיין סיכומים")).toBeVisible();
    await page.getByRole("button", { name: "סיכום חכם" }).first().click();
    await page.getByRole("button", { name: "צור סיכום" }).click();
    await expect(page.locator(NL)).toContainText("בחר חומר לימוד או הדבק טקסט");
    await page.getByLabel("סוג סיכום").selectOption("examSheet");
    await page.getByLabel("או הדבק טקסט").fill("משפט פיתגורס קובע שבמשולש ישר זווית סכום ריבועי הניצבים שווה לריבוע היתר.");
    await page.getByRole("button", { name: "צור סיכום" }).click();
    await expect(page.getByRole("heading", { name: "סיכום מדומה: משפט פיתגורס" })).toBeVisible({ timeout: 15_000 });
    await expect(page.locator(".katex").first()).toBeVisible();
    await expect(page.getByText("נוצר באמצעות AI")).toBeVisible();

    await page.getByRole("button", { name: "העתק" }).click();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toContain("משפט פיתגורס");
    await page.getByRole("button", { name: /הדפס \/ PDF/ }).click();
    expect(await page.evaluate(() => (window as unknown as { __printed: number }).__printed)).toBe(1);

    await page.getByRole("button", { name: "עריכה" }).click();
    await page.getByLabel("תוכן (Markdown, נוסחאות LaTeX בין $)").fill("## תוכן ערוך\n\nשורה חדשה");
    await page.getByRole("button", { name: "שמירה" }).click();
    await expect(page.getByRole("heading", { name: "תוכן ערוך" })).toBeVisible();

    // הפיכה לכרטיסיות
    await page.getByRole("button", { name: "לכרטיסיות" }).click();
    await page.getByRole("button", { name: "צור כרטיסיות" }).click();
    await expect(page.getByText("מהו משפט פיתגורס?")).toBeVisible({ timeout: 15_000 });
    await page.getByRole("button", { name: /הוסף 2 כרטיסיות/ }).click();

    await page.reload();
    const data = await storeData(page);
    expect(data.studyNotes).toHaveLength(1);
    expect(data.studyNotes[0]).toMatchObject({ aiGenerated: true, kind: "examSheet" });
    expect(data.studyNotes[0].content).toContain("תוכן ערוך");
    expect(data.flashcards).toHaveLength(2);
    expect(data.flashcards[0].source).toBe("ai");
    expect(errors).toEqual([]);
  });

  test("יצירת כרטיסיות AI מנושא בדף הכרטיסיות, עם בחירת הכרטיסים לשמירה", async ({ page }) => {
    await seed(page, onboarded());
    await page.goto("/flashcards");
    await page.getByRole("button", { name: "צור עם AI" }).first().click();
    await page.getByRole("button", { name: "צור כרטיסיות" }).click();
    await expect(page.locator(NL)).toContainText("בחר חומר");
    await page.getByLabel("נושא (אופציונלי)").fill("פיתגורס");
    await page.getByRole("button", { name: "צור כרטיסיות" }).click();
    await expect(page.getByText("מהו היתר?")).toBeVisible({ timeout: 15_000 });
    await page.getByLabel("שמור כרטיסייה 2").uncheck();
    await page.getByRole("button", { name: /הוסף 1 כרטיסיות/ }).click();
    expect((await storeData(page)).flashcards).toHaveLength(1);
  });

  test("שאלות AI למבחן: שאלה שבורה מסוננת, והשאר נוספות כשאלות AI; הערכת AI לשאלה פתוחה מסומנת כהערכה", async ({ page }) => {
    const d = onboarded((x) => R.addExam(x, { subjectId: x.subjects[0].id, title: "מבחן AI", date: addDays(today(), 7), topics: ["פיתגורס"], materialIds: [], minutesPerDay: 30 }).data);
    await seed(page, d);
    await page.goto(`/exams/${d.exams[0].id}`);
    await page.getByRole("tab", { name: /בנק שאלות/ }).click();
    await page.getByRole("button", { name: "צור עם AI" }).click();
    await page.getByRole("button", { name: "צור שאלות" }).click();
    await expect(page.getByText("כמה הוא")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("שאלה שבורה")).toHaveCount(0); // מסוננת בשרת
    await page.getByRole("button", { name: /הוסף 2 שאלות/ }).click();
    const data = await storeData(page);
    expect(data.examQuestions).toHaveLength(2);
    expect(data.examQuestions.every((q: { source: string }) => q.source === "ai")).toBe(true);

    // שאלה פתוחה: הערכת AI
    await page.goto(`/exams/${d.exams[0].id}`);
    await page.getByRole("tab", { name: /בנק שאלות/ }).click();
    await page.getByRole("button", { name: "שאלה חדשה" }).click();
    await page.getByLabel("סוג שאלה").selectOption("open");
    await page.getByLabel("נוסח השאלה").fill("הסבר מהו יתר");
    await page.getByLabel("תשובה לדוגמה").fill("הצלע מול הזווית הישרה");
    await page.getByRole("button", { name: "שמירה" }).click();
    await page.getByRole("button", { name: "התחל סימולציה" }).click();
    await page.getByLabel("מספר שאלות", { exact: false }).fill("3");
    await page.getByRole("button", { name: "התחל מבחן" }).click();
    await page.waitForURL(/\/exams\/run\//);
    for (let i = 0; i < 3; i++) {
      const q = await page.getByTestId("exam-question").innerText();
      if (q.includes("הסבר מהו יתר")) await page.getByLabel("תשובה").fill("זו הצלע הארוכה");
      if (i < 2) await page.getByRole("button", { name: "הבאה" }).click();
    }
    await page.getByRole("button", { name: "לסיום" }).click();
    await page.getByTestId("final-submit").click();
    await page.getByRole("button", { name: "הגשה", exact: true }).click();
    await page.waitForURL(/\/exams\/attempt\//);
    await page.getByRole("button", { name: "הערכת AI" }).click();
    await expect(page.getByText("הערכת AI · 80/100")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("זו הערכה של מודל AI ולא ציון רשמי")).toBeVisible();
  });
});
