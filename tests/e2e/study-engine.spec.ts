import { expect, test } from "./fixtures";
import { registerViaUi, setLocaleCookie } from "./helpers";
import { dbRows, getGameSpec, userIdOf } from "./db";
import { answerInUi, challengeOf, goNear, openGame } from "./play-helpers";

const NOTES = `The Nile Valley
The Nile is the longest river in Africa and flows north into the Mediterranean Sea.
Pharaoh: the ruler of ancient Egypt, seen as a god on earth.
Hieroglyphs - the picture writing used by the ancient Egyptians.
Papyrus = a paper-like material made from a reed that grows along the river.
Delta: the fan-shaped area where the Nile meets the sea.
The Great Pyramid of Giza was built around 2560 BC for the pharaoh Khufu.
The Nile floods every year, and the flood leaves rich black soil that farmers use for wheat and barley.
How a mummy was made:
1. Remove the organs from the body
2. Dry the body with natron salt for forty days
3. Wrap the body in linen bandages
4. Place the mummy in a decorated coffin`;

test.describe("the study engine: a game made from the learner's own material", () => {
  test("paste notes → a labelled game made from them → play it and get a quoted explanation", async ({ page }) => {
    test.setTimeout(240_000);
    await setLocaleCookie(page, "en");
    const { email } = await registerViaUi(page, { name: "Noa" });
    const userId = await userIdOf(email);

    await page.goto("/create");
    await expect(page.getByTestId("provider-banner")).toContainText(/study material/i);
    await expect(page.getByTestId("create-material")).toBeVisible();
    await page.getByTestId("create-subject").fill("Ancient Egypt");
    await page.getByTestId("create-goal").fill("Know the main words and facts about the Nile");
    await page.getByTestId("create-material").fill(NOTES);
    await expect(page.getByText(new RegExp(`${NOTES.length} of 8000`))).toBeVisible();
    // the live preview runs the same engine and says what it found before anything is spent
    await expect(page.getByTestId("material-preview")).toHaveAttribute("data-ok", "1");
    await expect(page.getByTestId("material-preview")).toContainText("Terms: 5");
    await expect(page.getByTestId("material-preview-verdict")).toContainText(/about \d+ challenges/);
    await page.getByTestId("create-submit").click();
    await page.waitForURL(/\/generate\/[a-z0-9]+$/);
    await expect(page.getByTestId("gen-success")).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId("gen-source")).toContainText(/study engine, not AI/i);

    const [game] = await dbRows<{ id: string; generatorKind: string; generatorProvider: string }>('SELECT id, "generatorKind", "generatorProvider" FROM "Game" WHERE "ownerId" = $1', [userId]);
    expect(game).toMatchObject({ generatorKind: "engine", generatorProvider: "study-engine" });

    // honest labels everywhere: library, details, play screen
    await page.goto("/games");
    await expect(page.getByTestId("badge-engine")).toBeVisible();
    await expect(page.getByTestId("badge-demo")).toHaveCount(0);
    await page.goto(`/games/${game!.id}`);
    await expect(page.getByTestId("badge-engine")).toBeVisible();
    // the details page never shows answers, even for engine-built games
    const html = await page.content();
    expect(html).not.toContain("correctOptionId");

    // the questions are made of the learner's own words
    const spec = await getGameSpec(game!.id);
    expect(JSON.stringify(spec)).toContain("Pharaoh");
    expect(spec.challenges.length).toBeGreaterThanOrEqual(3);

    // play: the first challenge, answered correctly through the real UI, explains itself with the notes
    await openGame(page, game!.id);
    await expect(page.getByTestId("play-root")).toHaveAttribute("data-source", "engine");
    await expect(page.getByText("From your material").first()).toBeVisible();
    const first = spec.areas[0]!.stations.find((s) => s.kind === "challenge")!;
    await goNear(page, "station", first.id);
    await page.keyboard.press("KeyE");
    const panel = page.getByTestId("challenge-panel");
    await expect(panel).toBeVisible();
    const served = challengeOf(spec, (await panel.getAttribute("data-challenge"))!);
    if (served.type === "program" || served.type === "simulation") throw new Error("the engine never builds these kinds");
    await answerInUi(page, served, "right");
    await expect(page.getByTestId("result")).toContainText(/correct/i);
    await expect(page.getByTestId("result")).toContainText(/Nile|Pharaoh|Hieroglyphs|Papyrus|Delta|mummy|Pyramid|linen|natron/i);
  });

  test("material that is too short is explained and costs nothing", async ({ page }) => {
    test.setTimeout(120_000);
    await setLocaleCookie(page, "en");
    const { email } = await registerViaUi(page, { name: "Noa" });
    const userId = await userIdOf(email);
    await page.goto("/create");
    await page.getByTestId("create-subject").fill("Bees");
    await page.getByTestId("create-goal").fill("Know bees");
    await page.getByTestId("create-material").fill("Bees are nice. They fly around and make honey in summer.");
    await expect(page.getByTestId("material-preview")).toHaveAttribute("data-ok", "0");
    await expect(page.getByTestId("material-preview-verdict")).toContainText(/Not enough yet/);
    await page.getByTestId("create-submit").click();
    await page.waitForURL(/\/generate\/[a-z0-9]+$/);
    await expect(page.getByTestId("gen-failed")).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId("gen-failed")).toContainText(/too short|at least/i);
    await expect(page.getByTestId("gen-not-charged")).toBeVisible();
    const usage = await dbRows<{ kind: string }>('SELECT kind FROM "UsageRecord" WHERE "userId" = $1 ORDER BY "createdAt"', [userId]);
    expect(usage.map((u) => u.kind)).toEqual(["RESERVE", "RELEASE"]);
  });

  test("Hebrew: notes in Hebrew become a Hebrew game, with Hebrew labels", async ({ page }) => {
    test.setTimeout(180_000);
    await setLocaleCookie(page, "he");
    const { email } = await registerViaUi(page, { name: "נועה" });
    const userId = await userIdOf(email);
    await page.goto("/create");
    await page.getByTestId("create-subject").fill("פוטוסינתזה");
    await page.getByTestId("create-goal").fill("להבין איך צמחים מייצרים סוכר");
    await page.getByTestId("create-material").fill(
      "פוטוסינתזה: תהליך שבו צמחים הופכים אור שמש ומים לסוכר ולחמצן.\nכלורופיל - הצבע הירוק בעלים שקולט את אור השמש.\nסטומה: פתח קטן בעלה שדרכו נכנס פחמן דו-חמצני.\nשורשים: החלק בצמח שסופג מים ומינרלים מהאדמה.\nהצמח מייצר סוכר בעלים ומעביר אותו לשאר חלקי הצמח.",
    );
    await page.getByTestId("create-submit").click();
    await page.waitForURL(/\/generate\/[a-z0-9]+$/);
    await expect(page.getByTestId("gen-success")).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId("gen-source")).toContainText("מנוע לימוד");
    const [game] = await dbRows<{ id: string }>('SELECT id FROM "Game" WHERE "ownerId" = $1', [userId]);
    const spec = await getGameSpec(game!.id);
    expect(spec.meta.language).toBe("he");
    expect(JSON.stringify(spec)).toContain("כלורופיל");
    await openGame(page, game!.id);
    await expect(page.getByTestId("area-name")).toContainText(/[֐-׿]/);
  });

  test("a text file of questions and answers can be loaded into the box and becomes a game", async ({ page }) => {
    test.setTimeout(180_000);
    await setLocaleCookie(page, "en");
    const { email } = await registerViaUi(page, { name: "Noa" });
    const userId = await userIdOf(email);
    await page.goto("/create");
    await expect(page.getByTestId("create-form")).toHaveAttribute("data-hydrated", "1"); // a file picked before hydration would have no handler
    const quiz = "# European capitals\nQ: What is the capital of France?\nA: Paris\nQ: What is the capital of Italy?\nA: Rome\nQ: What is the capital of Spain?\nA: Madrid\nQ: What is the capital of Germany?\nA: Berlin\nQ: How many countries are in the European Union?\nA: 27 countries";
    await page.getByTestId("material-file").setInputFiles({ name: "capitals.md", mimeType: "text/markdown", buffer: Buffer.from(quiz) });
    await expect(page.getByTestId("create-material")).toHaveValue(quiz);
    await expect(page.getByTestId("material-preview")).toContainText("Questions: 5");
    await page.getByTestId("mode-FULL").check(); // all five questions fit only in a Full game (a Fast game asks four)
    await page.getByTestId("create-subject").fill("European capitals");
    await page.getByTestId("create-goal").fill("Remember the capitals");
    await page.getByTestId("create-submit").click();
    await page.waitForURL(/\/generate\/[a-z0-9]+$/);
    await expect(page.getByTestId("gen-success")).toBeVisible({ timeout: 60_000 });
    const [game] = await dbRows<{ id: string }>('SELECT id FROM "Game" WHERE "ownerId" = $1', [userId]);
    const spec = await getGameSpec(game!.id);
    expect(spec.challenges.some((c) => c.type === "numeric" && c.answer === 27)).toBe(true);
    expect(spec.challenges.some((c) => c.type === "choice" && c.options.some((o) => o.text === "Paris"))).toBe(true);
  });
});
