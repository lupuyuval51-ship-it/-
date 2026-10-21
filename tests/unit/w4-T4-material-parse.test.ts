import { describe, expect, it } from "vitest";
import { parseMaterial, type Knowledge } from "@/lib/game/material/parse";
import { mulberry32 } from "@/lib/game/util/prng";
import { allFixtures } from "./material-quality";

/**
 * What the parser makes of a learner's notes. The existing material tests check named cases; these check the contract of the
 * `Knowledge` it returns (every number sits where it says it does, every list is a list the engine can ask about) on all the
 * fixture notes and on random mixes of the shapes people write, and pin the rules for what is and is not a number fact.
 */

const key = (s: string) => s.toLowerCase().replace(/[\p{P}\p{S}\s]+/gu, " ").trim();

function checkKnowledge(k: Knowledge, label: string): void {
  const all = new Set(k.all.map(key));
  for (const f of k.facts) {
    expect(f.source.slice(f.numAt, f.numAt + f.numText.length), `${label}: numText at numAt in "${f.source}"`).toBe(f.numText);
    expect(f.blanked, label).toBe(`${f.source.slice(0, f.numAt)}___${f.source.slice(f.numAt + f.numText.length)}`);
    const plain = f.numText.replace(/,/g, "").replace("−", "-");
    expect(f.value, `${label}: ${f.numText}`).toBe(Number(plain));
    expect(f.decimals, f.numText).toBe(plain.includes(".") ? plain.split(".")[1]!.length : 0);
    expect(f.isYear, f.numText).toBe(Number.isInteger(f.value) && f.value >= 1000 && f.value <= 2100);
    expect(Number.isFinite(f.value) && Math.abs(f.value) <= 1e12, f.numText).toBe(true);
    expect(f.blanked.match(/___/g), "one gap per fact").toHaveLength(1);
    expect(all.has(key(f.source)), `${label}: fact "${f.source}" is part of the reading-order text`).toBe(true);
  }
  expect(k.stepTitles, label).toHaveLength(k.steps.length);
  for (const steps of k.steps) {
    expect(steps.length, `${label}: a list of steps has 3 to 6`).toBeGreaterThanOrEqual(3);
    expect(steps.length).toBeLessThanOrEqual(6);
    for (const s of steps) {
      expect(s.trim(), label).not.toBe("");
      expect(s.length, label).toBeLessThanOrEqual(170);
    }
  }
  for (const d of k.definitions) {
    expect(d.term.trim(), label).not.toBe("");
    expect(d.meaning.trim(), label).not.toBe("");
    expect(d.source.trim(), label).not.toBe("");
  }
  expect(new Set(k.definitions.map((d) => d.term.toLowerCase())).size, `${label}: one definition per term`).toBe(k.definitions.length);
  expect(new Set(k.qa.map((q) => q.question.toLowerCase())).size, `${label}: one answer per question`).toBe(k.qa.length);
  for (const q of k.qa) {
    expect(q.question.length, label).toBeGreaterThanOrEqual(8);
    expect(q.answer.length, label).toBeLessThanOrEqual(140);
    if (q.value !== undefined) expect(Number.isFinite(q.value), label).toBe(true);
    if (q.wrong) expect(q.wrong.length, label).toBeGreaterThanOrEqual(2);
  }
  expect(new Set(k.keywords.map((w) => w.lower)).size, `${label}: one keyword per word`).toBe(k.keywords.length);
  for (const w of k.keywords) {
    expect(w.count, w.text).toBeGreaterThanOrEqual(1);
    expect(w.text.toLowerCase(), w.text).toBe(w.lower);
  }
  const prose = new Set(k.prose.map(key));
  for (const s of k.sentences) expect(prose.has(key(s)), `${label}: a plain statement is prose`).toBe(true);
  expect(new Set(k.all.map(key)).size, `${label}: no sentence twice`).toBe(k.all.length);
}

describe("the Knowledge of every fixture notes keeps its contract", () => {
  for (const f of allFixtures()) {
    it(f.id, () => {
      const k = parseMaterial(f.text);
      checkKnowledge(k, f.id);
      expect(parseMaterial(f.text)).toEqual(k); // and it is the same every time
    });
  }
});

describe("random mixes of the shapes people write", () => {
  const lines = [
    "Mitosis: the process of cell division that makes two identical cells.",
    "- Venus - the hottest planet because of its thick atmosphere",
    "* Earth = the only planet known to have life on it",
    "• פה – המקום שבו מתחיל העיכול והמזון נלעס",
    "הלב הוא שריר שמזרים דם לכל הגוף והוא פועם כשבעים פעמים בדקה.",
    "The sun holds 99.8 percent of the mass of the solar system.",
    "The first moon landing was in 1969 and it was watched by millions of people.",
    "In 1948 the state was declared after a long and difficult period of struggle.",
    "The temperature fell to -30 degrees at night in the northern winter season.",
    "How to boil an egg:",
    "1. Fill a pot with water",
    "2. Bring the water to the boil",
    "3. Lower the egg in for seven minutes",
    "4) Cool it down in cold water",
    "Q: How many moons does Mars have?",
    "A: 2",
    "What is the capital of France? Paris",
    "Which planet is the largest?",
    "A) Venus",
    "B) Jupiter",
    "Answer: B",
    "# A heading",
    "| Planet | Moons |",
    "| --- | --- |",
    "| Mars | 2 |",
    "hola = hello",
    "gato = cat",
    "perro = dog",
    "**Bold** statements are only text styled with two stars in the notes.",
    "",
    "",
    "💧 Water covers most of the surface of the Earth, as the oceans are very big.",
    "x = 3",
    "...",
    "|",
    "   ",
    "מספר 3,500 הוא גדול מ-100 ומ-2,000 גם יחד בכל מקרה.",
  ];

  it("never throws, and every part of what it returns keeps the contract (400 random notes)", () => {
    const rnd = mulberry32(11);
    for (let n = 0; n < 400; n++) {
      const text = Array.from({ length: 3 + Math.floor(rnd() * 14) }, () => lines[Math.floor(rnd() * lines.length)]!).join(rnd() < 0.2 ? "\n\n" : "\n");
      const k = parseMaterial(text);
      checkKnowledge(k, JSON.stringify(text));
    }
  });

  it("whatever is pasted, the result is the same when the notes are pasted again with different line ends", () => {
    const rnd = mulberry32(12);
    for (let n = 0; n < 100; n++) {
      const text = Array.from({ length: 4 + Math.floor(rnd() * 8) }, () => lines[Math.floor(rnd() * lines.length)]!).join("\n");
      expect(parseMaterial(text.replace(/\n/g, "\r\n"))).toEqual(parseMaterial(text));
    }
  });

  it("empty and nearly empty input gives an empty Knowledge, not an error", () => {
    for (const text of ["", " ", "\n\n", "|", "...", "###", "- ", "1."]) {
      const k = parseMaterial(text);
      expect(k.definitions).toEqual([]);
      expect(k.steps).toEqual([]);
      expect(k.facts).toEqual([]);
      expect(k.qa).toEqual([]);
    }
  });
});

describe("what is a number fact", () => {
  const facts = (sentence: string) => parseMaterial(sentence).facts;
  const only = (sentence: string) => {
    const f = facts(sentence);
    expect(f, sentence).toHaveLength(1);
    return f[0]!;
  };

  it("a sentence with one number, long enough to be about something, is a fact with the number blanked", () => {
    const f = only("In 1969 humans landed on the moon for the very first time in all of history.");
    expect(f).toMatchObject({ value: 1969, numText: "1969", decimals: 0, isYear: true });
    expect(f.blanked).toBe("In ___ humans landed on the moon for the very first time in all of history.");
  });

  it("a year is a whole number from 1000 to 2100", () => {
    const at = (n: number) => only(`The city was founded in ${n} by the early settlers who crossed the river.`).isYear;
    expect([999, 1000, 2100, 2101].map(at)).toEqual([false, true, true, false]);
  });

  it("keeps the number as it was written: thousands separators, decimals, percent and a minus sign", () => {
    expect(only("The population of the town reached 1,200 people in the year after the war ended.")).toMatchObject({ value: 1200, numText: "1,200", decimals: 0 });
    expect(only("Ice melts at 0.5 degrees above zero in this experiment for the whole class.")).toMatchObject({ value: 0.5, numText: "0.5", decimals: 1 });
    expect(only("Water makes up about 60% of the human body weight in an adult person today.").blanked).toContain("___% of");
    expect(only("The temperature fell to -30 degrees at night in the northern winter season.")).toMatchObject({ value: -30, numText: "-30" });
    expect(only("The temperature fell to −30.5 degrees at night in the northern winter season.")).toMatchObject({ value: -30.5, numText: "−30.5", decimals: 1 });
  });

  it("is not a fact when the blank would be ambiguous or the number is not a quantity", () => {
    for (const sentence of [
      "Between 5 and 10 students attend the early class every single week of term.", // two numbers
      "The population grew from 1,200 to 3,400 over the next ten years in the town.",
      "The class runs from 10:30 until noon every day of the working school week.", // a time
      "About 1/2 of the class walks to school every day of the working school week.", // a fraction
      "The war began on 14/05/1948 and ended a long time after the first battle.", // a date
      "Read pages 3-5 of the chapter about the digestive system before the next class.", // a range
      "The tank holds 14,000,000,000,000 litres of water at the top of the tower.", // beyond a trillion
      "The tank holds 123456789012345678901234567890 grains of sand on the beach.",
      "Python 3 is fine.", // too short a sentence to ask about
    ]) expect(facts(sentence), sentence).toEqual([]);
  });

  it("a number glued to a letter is part of a name (H2O, B12, 3D, v2) and is never taken out of it", () => {
    for (const sentence of ["The formula of water is H2O and every student must learn it by heart.", "Vitamin B12 is found mostly in animal food and in some special products.", "The 3D printer builds objects layer after layer from a digital model file."]) {
      expect(facts(sentence), sentence).toEqual([]);
    }
  });

  it("the same fact written twice is one fact", () => {
    const line = "In 1969 humans landed on the moon for the very first time in all of history.";
    expect(parseMaterial(`${line}\n${line}\n${line.toUpperCase()}`).facts).toHaveLength(1);
  });
});

describe("what is a list of steps", () => {
  it("needs three numbered lines in a row (1. 2) 3: and 'Step 1:' all count), and names the list after the line above it", () => {
    for (const marker of ["1.", "1)", "1:", "Step 1:", "שלב 1:"]) {
      const text = `How to boil an egg:\n${[0, 1, 2].map((i) => `${marker.replace("1", String(i + 1))} Do the number ${i + 1} part of the recipe`).join("\n")}`;
      const k = parseMaterial(text);
      expect(k.steps, marker).toHaveLength(1);
      expect(k.steps[0], marker).toHaveLength(3);
      expect(k.stepTitles, marker).toEqual(["How to boil an egg"]);
    }
    expect(parseMaterial("How to boil an egg:\n1. Fill a pot with water\n2. Bring the water to the boil").steps).toEqual([]);
  });

  it("a year at the start of a line is not a step number (1948: …)", () => {
    const k = parseMaterial("1947: The United Nations voted on a plan\n1948: The state was declared in May\n1949: Armistice agreements were signed\n1950: The Law of Return was passed");
    expect(k.steps).toEqual([]);
  });

  it("two separate lists stay two lists, each with its own title", () => {
    const k = parseMaterial("Making tea:\n1. Boil the water in a kettle\n2. Put a tea bag in a cup\n3. Pour the hot water over it\n\nMaking toast:\n1. Slice the bread into pieces\n2. Put the slices in the toaster\n3. Wait until they turn golden");
    expect(k.steps).toHaveLength(2);
    expect(k.stepTitles).toEqual(["Making tea", "Making toast"]);
  });
});

describe("vocabulary lists and definitions", () => {
  it("three short pairs in a row are a vocabulary list (asked as translations); two are only two lines", () => {
    const three = parseMaterial("hola = hello\ngato = cat\nperro = dog");
    expect(three.definitions.map((d) => [d.term, d.meaning, d.short])).toEqual([["hola", "hello", true], ["gato", "cat", true], ["perro", "dog", true]]);
    const two = parseMaterial("hola = hello\ngato = cat");
    expect(two.definitions.every((d) => d.short === undefined)).toBe(true);
  });

  it("a term written twice keeps the first meaning", () => {
    const k = parseMaterial("Photosynthesis: the process by which plants make food from light.\nPhotosynthesis: a different meaning for the same term here.\nRespiration: the process that releases energy from food in the cell.");
    expect(k.definitions.map((d) => [d.term, d.meaning])).toEqual([["Photosynthesis", "the process by which plants make food from light"], ["Respiration", "the process that releases energy from food in the cell"]]);
  });

  it("**bold** and `code` marks are dropped from a term, and 'X is a Y' sentences are definitions too", () => {
    const k = parseMaterial("**Mitosis** is the process of cell division that makes two identical cells.\n`print` is a function in Python that shows text on the screen.");
    expect(k.definitions.map((d) => d.term)).toEqual(["Mitosis", "print"]);
  });

  it("a label such as Note or Example is never a term", () => {
    const k = parseMaterial("Note: the exam is on Monday morning in the big hall of the school.\nExample: take the number three and double it to get six every time.\nMitosis: the process of cell division that makes two identical cells.");
    expect(k.definitions.map((d) => d.term)).toEqual(["Mitosis"]);
  });
});

describe("questions the learner already wrote", () => {
  it("an answer that is a number (with a unit, a thousands separator or a minus) is read as a number", () => {
    const k = parseMaterial("Q: How many moons does Mars have?\nA: 2\nQ: What is the largest planet in our solar system?\nA: Jupiter\nQ: How far is the Sun in km?\nA: 149,600,000 km\nQ: What is the temperature?\nA: -30 degrees");
    expect(k.qa.map((q) => [q.answer, q.value])).toEqual([["2", 2], ["Jupiter", undefined], ["149,600,000 km", 149600000], ["-30 degrees", -30]]);
  });

  it("a question line with its answer on the same line, or on the next, is a pair", () => {
    const k = parseMaterial("What is the capital of France? Paris\nWhat is the capital of Italy?\nRome");
    expect(k.qa.map((q) => [q.question, q.answer])).toEqual([["What is the capital of France?", "Paris"], ["What is the capital of Italy?", "Rome"]]);
  });
});

describe("known gaps in reading notes (skipped until the parser is fixed)", () => {
  // BUG (src/lib/game/material/parse.ts, step 1 "numbered lists"): the group of numbered lines stops at the first blank line, so a list
  // written with a blank line between the items (a Markdown "loose" list, most pastes from a web page or a document) is no list of steps:
  // no ordering question is made, and the lines are left as one odd statement.
  it("a numbered list with a blank line between its items is still a list of steps", () => {
    const k = parseMaterial("How to boil an egg:\n\n1. Fill a pot with water\n\n2. Bring the water to the boil\n\n3. Lower the egg in for seven minutes\n\n4. Cool the egg in cold water");
    expect(k.steps).toEqual([["Fill a pot with water", "Bring the water to the boil", "Lower the egg in for seven minutes", "Cool the egg in cold water"]]);
  });

  // BUG (parse.ts, NUMBER / asFact): a decimal comma ("36,6 grados", "3,5 degrees") is read as the whole number 36 followed by ",6", so the
  // question shows "___,6 grados" and its right answer is 36: a question that cannot be answered as the learner wrote the number.
  it("a decimal comma never leaves half of the number in the question", () => {
    for (const sentence of ["La temperatura media de la habitación fue de 36,6 grados durante todo el invierno.", "The average temperature of the room was 3,5 degrees in the winter months."]) {
      for (const f of parseMaterial(sentence).facts) expect(f.blanked, sentence).not.toMatch(/___,\d/);
    }
  });

  // BUG (parse.ts, NUMBER / asFact): the marker of a list written "(1) …" or "1 - …" is taken for a number fact ("(___) Fill a pot with
  // water", answer 1), and the list is not steps either. Reading these markers as steps, or leaving the lines out, would both be fine.
  it("the number of a list marker is not a number fact", () => {
    for (const text of [
      "(1) Fill a pot with water\n(2) Bring the water to the boil\n(3) Lower the egg in for seven minutes",
      "1 - Fill a pot with water\n2 - Bring the water to the boil\n3 - Lower the egg in for seven minutes",
    ]) expect(parseMaterial(text).facts, text).toEqual([]);
  });
});
