/**
 * Regression tests for the study-material engine (parse, text, challenges): answers that collide with Object members,
 * multiple-choice quizzes, Hebrew acronyms and vowelled words, parallel sentences, synonym lists and lists whose first line looks like a heading.
 */
import { describe, expect, it } from "vitest";
import { generateChallenges, type GenerateOptions } from "@/lib/game/material/challenges";
import { parseMaterial } from "@/lib/game/material/parse";
import { sanitizeMaterial, wordsOf } from "@/lib/game/material/text";
import { mulberry32 } from "@/lib/game/util/prng";

type Opt = { id: string; text: string };
type Ch = { type?: string; prompt?: string; options?: Opt[]; correctOptionId?: string };

const gen = (material: string, over: Partial<GenerateOptions> = {}, seed = 7) =>
  generateChallenges(parseMaterial(material), { lang: "en", rnd: mulberry32(seed), max: 24, ...over });
const choices = (g: ReturnType<typeof gen>) => g.challenges.filter((c): c is Ch => (c as Ch).type === "choice");
const rightText = (c: Ch) => c.options!.find((o) => o.id === c.correctOptionId)!.text;

describe("answers that are names of Object members", () => {
  const NOTES = [
    "Q: What is the name of the special method that builds a new object in a class?\nA: constructor",
    "Q: Which keyword makes a name visible to the other files of a module?\nA: export",
    "Q: Which method turns a value into text in every object?\nA: toString",
  ].join("\n");

  it("builds questions instead of throwing, and keeps the answer", () => {
    for (const lang of ["en", "he"] as const) {
      const g = gen(NOTES, { lang });
      const qa = choices(g).filter((c) => /constructor/.test(c.options!.map((o) => o.text).join("|")));
      expect(qa.length).toBeGreaterThan(0);
      for (const c of qa) expect(["constructor", "export", "toString"]).toContain(rightText(c));
    }
  });

  it("also copes with an answer that is the name of Object.prototype itself", () => {
    const k = parseMaterial(NOTES);
    k.qa[0]!.answer = "__proto__";
    const g = generateChallenges(k, { lang: "en", rnd: mulberry32(3), max: 24 });
    // asked like any other answer (the right one and wrong answers of the other questions), not as a yes / no pair
    const asked = choices(g).find((c) => c.options!.some((o) => o.text === "__proto__"))!;
    expect(asked.options!.length).toBeGreaterThanOrEqual(3);
    expect(asked.options!.map((o) => o.text)).not.toContain("[object Object]");
  });

  it("still treats a real yes / no answer as a two-option question", () => {
    const g = gen("Q: Is the sun a star at the centre of our solar system?\nA: yes\nQ: Is the moon a planet that orbits the sun directly?\nA: No");
    const yesNo = choices(g).filter((c) => c.options!.length === 2);
    expect(yesNo.length).toBe(2);
    expect(yesNo.map((c) => c.options!.map((o) => o.text).sort().join("/").toLowerCase()).sort()).toEqual(["no/yes", "no/yes"]);
  });
});

describe("multiple-choice quizzes", () => {
  const QUIZ = `Q: Which planet is closest to the sun?
A) Venus
B) Mercury
C) Earth
D) Mars
Answer: B

Q: Which planet is known as the red planet?
A) Jupiter
B) Saturn
C) Mars
D) Neptune
Answer: C

Q: Which planet is the largest in the solar system?
A) Jupiter
B) Venus
C) Earth
Answer: A`;

  it("takes the option that the answer line names, never the first option", () => {
    const k = parseMaterial(QUIZ);
    expect(k.qa.map((p) => [p.question, p.answer])).toEqual([
      ["Which planet is closest to the sun?", "Mercury"],
      ["Which planet is known as the red planet?", "Mars"],
      ["Which planet is the largest in the solar system?", "Jupiter"],
    ]);
    expect(k.sentences.join(" ")).not.toMatch(/Venus|Saturn/);
  });

  it("handles a question without the Q: prefix, a different letter style and Hebrew letters", () => {
    const k = parseMaterial("Which gas do plants take in from the air?\na. Oxygen\nb. Carbon dioxide\nc. Helium\nCorrect answer: b\n\nמהו הכוכב הקרוב ביותר לשמש?\nא. נוגה\nב. כוכב חמה\nג. מאדים\nתשובה: ב");
    expect(k.qa.map((p) => p.answer)).toEqual(["Carbon dioxide", "כוכב חמה"]);
  });

  it("leaves a quiz without an answer line out rather than teaching the first option", () => {
    const k = parseMaterial("Q: Which planet is closest to the sun?\nA) Venus\nB) Mercury\nC) Earth");
    expect(k.qa).toEqual([]);
  });

  it("does not change an ordinary Q and A, even when the answer is a letter", () => {
    const k = parseMaterial("Q: What grade did the class get in the final test?\nA: B\nQ: Which letter comes before the letter B in the alphabet?\nA. The letter A");
    expect(k.qa.map((p) => p.answer)).toEqual(["B", "The letter A"]);
  });
});

describe("Hebrew words", () => {
  it("keeps gershayim and geresh inside the word", () => {
    expect(wordsOf('צה״ל ארה״ב תנ"ך מע״מ ג׳ירפה').map((w) => w.text)).toEqual(["צה״ל", "ארה״ב", 'תנ"ך', "מע״מ", "ג׳ירפה"]);
  });

  it("does not take a quotation mark at the edge of a word, or a trailing geresh, for a part of it", () => {
    expect(wordsOf('אמר "שלום" לפרופ׳ כהן').map((w) => w.text)).toEqual(["אמר", "שלום", "לפרופ", "כהן"]);
    expect(wordsOf('He said "hello"').map((w) => w.text)).toEqual(["He", "said", "hello"]);
  });

  it("keeps niqqud inside the word", () => {
    expect(wordsOf("שָׁלוֹם עוֹלָם").map((w) => w.text)).toEqual(["שָׁלוֹם", "עוֹלָם"]);
  });

  it("removes soft hyphens and zero-width spaces that a PDF paste leaves in a word", () => {
    const text = sanitizeMaterial("Photo­synthesis and chloro​phyll﻿ are words");
    expect(text).toBe("Photosynthesis and chlorophyll are words");
    expect(wordsOf(text).map((w) => w.text)).toEqual(["Photosynthesis", "and", "chlorophyll", "are", "words"]);
  });

  it("never offers a fragment of an acronym as a word of a question", () => {
    const he = [
      "צה״ל הוא צבא ההגנה לישראל והוא הוקם בשנת 1948 על ידי דוד בן גוריון.",
      "ארה״ב היא מדינה גדולה מאוד בצפון אמריקה והבירה שלה היא וושינגטון.",
      "הרמטכ״ל הוא הקצין הבכיר ביותר בצה״ל והוא מדווח לשר הביטחון.",
      "נשיא ארה״ב נבחר אחת לארבע שנים בבחירות כלליות בכל המדינה.",
    ].join("\n");
    const k = parseMaterial(he);
    const fragments = new Set(["צה", "ארה", "ל", "ב", "הרמטכ"]);
    expect(k.keywords.filter((w) => fragments.has(w.text)).map((w) => w.text)).toEqual([]);
    const g = gen(he, { lang: "he" });
    for (const c of choices(g)) for (const o of c.options!) expect(o.text).not.toMatch(/(?:^|\s)(?:ארה|צה)(?:\s|$)|אמריקה״ב|בצה״ב/);
  });
});

describe("fill-the-gap questions", () => {
  // parallel sentences: filling a wrong word into the gap gives another sentence of the notes
  const PARALLEL = [
    "The great river flows through Egypt before it ends in the northern sea.",
    "The great river flows through Sudan before it ends in the northern sea.",
    "The great river flows through Uganda before it ends in the northern sea.",
    "The ancient city lies in Greece beside the sunny southern coast.",
    "The ancient city lies in Turkey beside the sunny southern coast.",
    "The ancient city lies in Italy beside the sunny southern coast.",
    "Farmers near the delta grow wheat and barley during the cool winter season.",
    "Traders near the harbour sell pottery and spices during the busy summer season.",
  ].join("\n");

  it("never offers a word that makes another sentence of the notes", () => {
    const k = parseMaterial(PARALLEL);
    const sentences = new Set(k.all.map((s) => s.toLowerCase()));
    let seen = 0;
    for (let seed = 1; seed <= 12; seed++) {
      const g = generateChallenges(k, { lang: "en", rnd: mulberry32(seed), max: 24 });
      g.challenges.forEach((c, i) => {
        const ch = c as Ch & { title?: string };
        if (g.kinds[i] !== "cloze") return;
        seen++;
        const m = /“([^”]*_____[^”]*)”/.exec(String(ch.prompt))!;
        for (const o of ch.options!) {
          if (o.id === ch.correctOptionId) continue;
          expect(sentences.has(m[1]!.replace("_____", o.text).toLowerCase()), `${m[1]} / ${o.text}`).toBe(false);
        }
      });
    }
    expect(seen).toBeGreaterThan(0);
  });
});

describe("vocabulary and synonym lists", () => {
  const SYNONYMS = ["big = large", "huge = large", "tiny = small", "little = small", "fast = quick", "rapid = quick", "happy = glad", "joyful = glad", "sad = gloomy", "unhappy = gloomy"].join("\n");

  it("never shows a second right answer or the same option twice", () => {
    const k = parseMaterial(SYNONYMS);
    const meaningOf = new Map(k.definitions.map((d) => [d.term, d.meaning]));
    let questions = 0;
    for (let seed = 1; seed <= 25; seed++) {
      const g = generateChallenges(k, { lang: "en", rnd: mulberry32(seed), max: 24 });
      g.challenges.forEach((c, i) => {
        const ch = c as Ch;
        if (ch.type !== "choice") return;
        const texts = ch.options!.map((o) => o.text);
        expect(new Set(texts).size, texts.join(" | ")).toBe(texts.length);
        if (g.kinds[i] === "term") {
          questions++;
          // the options are terms of the list: only the right one goes with the meaning in the prompt
          const meaning = meaningOf.get(rightText(ch))!;
          expect(texts.filter((x) => meaningOf.get(x) === meaning), `${ch.prompt} ${texts.join(" | ")}`).toHaveLength(1);
        }
      });
    }
    expect(questions).toBeGreaterThan(0);
  });

  it("does not offer two translations of the same word as options of that word", () => {
    const g = gen("house = בית\nhome = בית\ndog = כלב\ncat = חתול\nbird = ציפור\nfish = דג");
    for (const c of choices(g)) {
      const texts = c.options!.map((o) => o.text);
      expect(new Set(texts).size).toBe(texts.length);
      if (/בית/.test(String(c.prompt))) expect(texts.filter((x) => x === "house" || x === "home")).toHaveLength(1);
    }
  });
});

describe("a first line that is an item of a list is not the title", () => {
  it("keeps the first event of a timeline", () => {
    const k = parseMaterial("1947 – החלטת החלוקה של האו״ם על ארץ ישראל\n1948 – הכרזת העצמאות והקמת מדינת ישראל\n1949 – חתימת הסכמי שביתת הנשק עם מדינות ערב\n1956 – מבצע קדש בחצי האי סיני\n1967 – מלחמת ששת הימים בין ישראל למדינות ערב");
    expect(k.title).toBeUndefined();
    expect(k.facts.map((f) => f.value)).toEqual([1947, 1948, 1949, 1956, 1967]);
  });

  it("keeps the first term of a glossary without full stops", () => {
    const k = parseMaterial("Venus - the hottest planet because of its thick atmosphere\nEarth - the only planet known to have life on it\nMars - the red planet with the tallest volcano\nJupiter - the largest planet of the solar system");
    expect(k.title).toBeUndefined();
    expect(k.definitions.map((d) => d.term)).toEqual(["Venus", "Earth", "Mars", "Jupiter"]);
    const he = parseMaterial("אידוי: מים הופכים לאדים כשהם מתחממים בשמש\nהתעבות: אדים הופכים לטיפות מים כשהם מתקררים\nמשקעים: מים שיורדים מהעננים לאדמה");
    expect(he.definitions.map((d) => d.term)).toEqual(["אידוי", "התעבות", "משקעים"]);
  });

  it("keeps the first of several statements", () => {
    const k = parseMaterial("מים הם חומר שקוף שאפשר לשתות\nהאדמה היא כוכב הלכת השלישי מהשמש\nהירח הוא הלוויין הטבעי היחיד של כדור הארץ");
    expect(k.title).toBeUndefined();
    expect(k.definitions.map((d) => d.term)).toEqual(["מים", "האדמה", "הירח"]);
  });

  it("still takes a real heading, also one that looks like a definition", () => {
    expect(parseMaterial("מערכת העיכול\nהקיבה היא איבר שרירי שבו המזון מתפרק לחלקים קטנים.\nהמעי הדק קולט את החומרים המזינים אל הדם.").title).toBe("מערכת העיכול");
    const chapter = parseMaterial("Chapter 3: The Roman Empire\nRome was founded in 753 BC by its legendary first king.\nThe senate governed the republic for almost five hundred years.");
    expect(chapter.title).toBe("Chapter 3: The Roman Empire");
  });
});
