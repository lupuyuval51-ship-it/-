import { expect, test, type Page } from "@playwright/test";
import { EXAMPLES } from "../../mobile/src/pages/examples";

/** The New game screen of the offline app: examples, the local draft, pasted text, language hint, phone layout. */

const DRAFT_KEY = "levelup.mobile.createDraft";
const readDraft = (page: Page) => page.evaluate((k) => localStorage.getItem(k), DRAFT_KEY);
const water = EXAMPLES[0]!;
const fractions = EXAMPLES.find((e) => e.id === "fractions")!;

test("an unfinished draft is kept when the learner leaves the screen, restored on return and after a restart, and dropped once the game is built", async ({ page }) => {
  await page.goto("/#/create");
  await page.locator("#subject").fill("הנושא שלי");
  await page.locator("#goal").fill("להבין את החומר");
  await page.locator("#difficulty").selectOption("advanced");
  await page.getByTestId("mobile-create").getByRole("link", { name: "חזרה" }).click();
  await expect(page.getByTestId("mobile-library")).toBeVisible();
  expect(await readDraft(page)).toContain("הנושא שלי"); // written when the screen was left

  await page.getByTestId("mobile-new").click();
  await expect(page.locator("#subject")).toHaveValue("הנושא שלי");
  await expect(page.locator("#goal")).toHaveValue("להבין את החומר");
  await expect(page.locator("#difficulty")).toHaveValue("advanced");
  await expect(page.getByTestId("create-restored")).toBeVisible();

  await page.reload(); // an app restart
  await expect(page.locator("#subject")).toHaveValue("הנושא שלי");

  // an example never throws the learner's own text away: it can be brought back
  await page.getByTestId("example-notes").click();
  await expect(page.locator("#subject")).toHaveValue(water.he.subject);
  await expect(page.getByTestId("create-undo")).toBeVisible();
  await page.getByTestId("create-undo").getByRole("button").click();
  await expect(page.locator("#subject")).toHaveValue("הנושא שלי");

  await page.getByTestId("example-notes").click();
  await page.getByTestId("mobile-create-submit").click();
  await expect(page.getByTestId("play-root")).toHaveAttribute("data-source", "engine", { timeout: 60_000 });
  expect(await readDraft(page)).toBeNull(); // a game exists now, so the draft is gone
});

test("every example is a button that fills the form and builds a game", async ({ page }) => {
  await page.goto("/#/create");
  await expect(page.getByTestId("example-list").getByRole("button")).toHaveCount(EXAMPLES.length);
  await page.getByTestId("example-notes-fractions").click();
  await expect(page.locator("#subject")).toHaveValue(fractions.he.subject);
  await expect(page.locator("#material")).toHaveValue(fractions.he.notes);
  await expect(page.getByTestId("material-preview")).toHaveAttribute("data-ok", "1");
  await page.getByTestId("mobile-create-submit").click();
  await expect(page.getByTestId("play-root")).toHaveAttribute("data-source", "engine", { timeout: 60_000 });
});

test("text pasted from a PDF or a word processor (control characters) still builds a game", async ({ page }) => {
  await page.goto("/#/create");
  await page.locator("#subject").fill(water.he.subject);
  await page.locator("#material").fill(water.he.notes.replace("\n", "\u000B").replace("\n", "\u000C"));
  await page.getByTestId("mobile-create-submit").click();
  await expect(page.getByTestId("play-root")).toHaveAttribute("data-source", "engine", { timeout: 60_000 });
});

test("a text file on the phone can be loaded as the notes, and a file that is not text is explained", async ({ page }) => {
  await page.goto("/#/create");
  await page.getByTestId("material-file").setInputFiles({ name: "מחזור-המים.txt", mimeType: "text/plain", buffer: Buffer.from(water.he.notes, "utf-8") });
  await expect(page.locator("#material")).toHaveValue(water.he.notes);
  await expect(page.locator("#subject")).toHaveValue("מחזור המים"); // named after the file
  await expect(page.getByTestId("material-file-note")).toContainText("מחזור-המים.txt");
  await expect(page.getByTestId("material-preview")).toHaveAttribute("data-ok", "1");

  const binary = Buffer.alloc(80);
  for (let i = 0; i < binary.length; i++) binary[i] = i % 2 === 0 ? 0x00 : 0xff;
  await page.getByTestId("material-file").setInputFiles({ name: "scan.pdf", mimeType: "application/pdf", buffer: binary });
  await expect(page.getByTestId("material-file-note")).toContainText("לא ניתן לקרוא את הקובץ כטקסט");
  await expect(page.locator("#material")).toHaveValue(water.he.notes); // unchanged
});

test("a missing subject is explained next to the field, which gets the focus", async ({ page }) => {
  await page.goto("/#/create");
  await page.getByTestId("mobile-create-submit").click();
  await expect(page.getByTestId("mobile-create-error")).toBeVisible();
  await expect(page.locator("#subject")).toHaveAttribute("aria-invalid", "true");
  await expect(page.locator("#subject")).toBeFocused();
  await page.locator("#subject").fill("x");
  await expect(page.locator("#subject")).not.toHaveAttribute("aria-invalid", "true");
});

test("notes the engine cannot use are explained at the material field and keep the learner's text", async ({ page }) => {
  await page.goto("/#/create");
  await page.locator("#subject").fill("x");
  await page.locator("#material").fill("hello there, this is not really a lesson at all ok");
  await page.getByTestId("mobile-create-submit").click();
  await expect(page.getByTestId("mobile-create-error")).toBeVisible();
  await expect(page.locator("#material")).toHaveAttribute("aria-invalid", "true");
  await expect(page.locator("#material")).toHaveValue("hello there, this is not really a lesson at all ok");
  await expect(page.locator("#subject")).toHaveValue("x");
});

test("notes in another language than the game get a suggestion to switch, which can be taken or kept", async ({ page }) => {
  await page.goto("/#/create");
  await page.locator("#material").fill(water.en.notes);
  const hint = page.getByTestId("create-lang-hint");
  await expect(hint).toBeVisible();
  await hint.getByRole("button", { name: "החלפה" }).click();
  await expect(page.locator("#language")).toHaveValue("en");
  await expect(hint).toHaveCount(0);
  await page.locator("#language").selectOption("he");
  await expect(hint).toBeVisible();
  await hint.getByRole("button", { name: "להשאיר" }).click();
  await expect(hint).toHaveCount(0);
});

test.describe("on a 360px phone", () => {
  test.use({ viewport: { width: 360, height: 740 } });

  test("the screen does not scroll sideways and every control is a comfortable touch target", async ({ page }) => {
    await page.goto("/#/create");
    await page.locator("#material").fill(water.he.notes);
    await expect(page.getByTestId("material-preview")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    const targets = page.getByTestId("mobile-create").locator("button, a[href], select, input, summary");
    const count = await targets.count();
    expect(count).toBeGreaterThan(8);
    for (let i = 0; i < count; i++) {
      // a radio wrapped in a label is tapped through the (44px) label
      const target = targets.nth(i);
      const wrapped = target.locator("xpath=ancestor::label[1]");
      const box = (await wrapped.count()) ? await wrapped.boundingBox() : await target.boundingBox();
      if (!box) continue; // hidden inside the closed help
      expect(box.height, `control ${i}`).toBeGreaterThanOrEqual(43);
      expect(box.x + box.width, `control ${i} inside the screen`).toBeLessThanOrEqual(360.5);
    }
  });
});
