import { describe, expect, it } from "vitest";
import { parseMaterial } from "@/lib/game/material/parse";
import { generateOffline } from "@/lib/offline/generate";
import { request } from "./helpers";

const QA = `שאלות לחזרה – גוף האדם
ש: כמה עצמות יש בגוף של אדם מבוגר?
ת: 206
ש: איזה איבר שואב דם לכל הגוף?
ת: הלב
ש: איפה מתרחש עיקר עיכול המזון?
ת: במעי הדק
ש: מה תפקיד הריאות?
ת: להכניס חמצן לגוף ולהוציא פחמן דו-חמצני
ש: מהו האיבר הגדול ביותר בגוף?
ת: העור`;

describe("a first line that names the notes is their title", () => {
  it("'שאלות לחזרה – גוף האדם' is the title, not a term with a meaning", () => {
    const k = parseMaterial(QA);
    expect(k.title).toBe("שאלות לחזרה – גוף האדם");
    expect(k.definitions.map((d) => d.term)).not.toContain("שאלות לחזרה");
  });

  it("so it is never offered as an answer to another question", () => {
    const { spec } = generateOffline(request({ material: QA, subject: "גוף האדם", mode: "FAST", contentLanguage: "he" }));
    for (const c of spec.challenges) if (c.type === "choice") for (const o of c.options) expect(o.text, c.id).not.toContain("שאלות לחזרה");
  });

  it("an ordinary first definition stays a definition", () => {
    const k = parseMaterial("Photosynthesis: the process plants use to turn light into energy.\nChlorophyll: the green pigment that absorbs light.\nStomata: small pores in leaves.");
    expect(k.definitions.map((d) => d.term)).toContain("Photosynthesis");
  });

  it("a word list's heading written with another separator ('Spanish words – week 3' over 'hola = hello') is the title, not a pair", () => {
    const k = parseMaterial("Spanish words – week 3\nhola = hello\nadiós = goodbye\ngracias = thank you\npor favor = please\nperro = dog");
    expect(k.title).toBe("Spanish words – week 3");
    expect(k.definitions.map((d) => d.term)).toEqual(["hola", "adiós", "gracias", "por favor", "perro"]);
  });

  it("a first line above a bulleted list, or ending in 'key ideas' / 'מושגים מרכזיים', is the title", () => {
    const bullets = "Ecosystems – key ideas\n• Producer — an organism that makes its own food, like a plant.\n• Consumer — an organism that eats other living things.\n• Decomposer — an organism that breaks down dead material, like fungi.";
    expect(parseMaterial(bullets).title).toBe("Ecosystems – key ideas");
    expect(parseMaterial(bullets).definitions.map((d) => d.term)).toEqual(["Producer", "Consumer", "Decomposer"]);
    expect(parseMaterial("Plants - overview\nRoot: the part that takes in water.\nLeaf: the part that makes food.\nStem: the part that holds the plant up.").title).toBe("Plants - overview");
    expect(parseMaterial("התא – מושגים מרכזיים\nגרעין: מרכז הבקרה של התא.\nקרום: השכבה שעוטפת את התא.\nמיטוכונדריה: תחנת הכוח של התא.").title).toBe("התא – מושגים מרכזיים");
  });

  it("'Chapter 3 - Cells' heads English notes", () => {
    expect(parseMaterial("Chapter 3 - Cells\nCell: the smallest unit of life.\nNucleus: the control centre of the cell.\nMembrane: the thin layer around a cell.").title).toBe("Chapter 3 - Cells");
  });
});
