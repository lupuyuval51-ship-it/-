import { describe, expect, it } from "vitest";
import type { LevelContent, Question, TopicContent } from "@/lib/game/topics/types";
import speed from "@/lib/game/topics/content/math-speed-distance-time";
import time from "@/lib/game/topics/content/math-time";
import transformations from "@/lib/game/topics/content/math-transformations";
import units from "@/lib/game/topics/content/math-units";
import conditions from "@/lib/game/topics/content/prog-conditions";
import javascript from "@/lib/game/topics/content/prog-javascript";
import loops from "@/lib/game/topics/content/prog-loops";
import oop from "@/lib/game/topics/content/prog-oop";
import variables from "@/lib/game/topics/content/prog-variables";

/**
 * Wave 7, G5: nine topics (speed, time, transformations, units, conditions, JavaScript, loops, objects, variables) had items
 * that showed the answer of a choice question of the same level, which a game shows together: number prompts that named it
 * ("60 km/h for 3 hours" next to "how long … 4 km/h? 3 hours", "function double(n) { return … }" next to "which keyword sends
 * a value back?", "for i in range(1, 11)" next to "which range prints 1 to 10?"), and term meanings that spelled it out
 * (the kilogram "equal to 1,000 grams", the centimetre "one hundredth of a metre", "1 m² = 10,000 cm²", the else branch "runs
 * when the condition of the if is False", a Boolean "can only be True or False", the float "such as 3.0", assignment "written
 * with =", the constructor "runs when a new object is created", self "the object it is working on", type coercion "into a
 * string", a string "between quotes", const "creates a variable"). In objects, the class/object questions answered each other
 * ("Every object of the class Car", "A Car object", "Objects: the cars themselves"), so the "Rex is an object" question now asks
 * how an object is made. Those items were rephrased or replaced in both languages; every fact was re-checked.
 *
 * Kept on purpose (a mention that does not answer the question): see KEPT below.
 */
const TOPICS: Record<string, TopicContent> = {
  "math-speed-distance-time": speed,
  "math-time": time,
  "math-transformations": transformations,
  "math-units": units,
  "prog-conditions": conditions,
  "prog-javascript": javascript,
  "prog-loops": loops,
  "prog-oop": oop,
  "prog-variables": variables,
};
const LEVELS = ["b", "i", "a"] as const;
type Level = (typeof LEVELS)[number];

/** Mentions of an answer in another item of its level that stay, because they do not tell which option is right. */
const KEPT: readonly string[] = [
  // an item of the "shortest to longest" ordering, which has no 100 hours, 1,000 minutes or 2 days (w5-S2 pins the ordering)
  "math-time/b/en/1 week", "math-time/b/he/שבוע אחד",
  // the year 2000 asked by century, and 12:00 UTC as the start of a time-zone sum: neither says which year is a leap year
  // or what time it is in London
  "math-time/a/en/2000", "math-time/a/he/2000", "math-time/a/en/12:00", "math-time/a/he/12:00",
  // both century questions offer the 20th and the 21st century; seeing the option in the other question tells nothing
  "math-time/a/en/The 20th century",
  // the direction asked for in a turn and in a sum of turns, not the order of a reflected triangle's corners
  "math-transformations/i/en/Anticlockwise", "math-transformations/i/he/נגד כיוון השעון",
  // "How many grams are in 1 kilogram?" names the unit but not what an apple is best weighed in (tonnes are a mass too)
  "math-units/b/en/Grams", "math-units/b/he/גרמים",
  // True and False are the vocabulary of every condition and always named together; no item says what an expression gives
  ...["i", "a"].flatMap((l) => ["en", "he"].flatMap((lang) => [`prog-conditions/${l}/${lang}/True`, `prog-conditions/${l}/${lang}/False`])),
  // the weekend example of the and/or mix-up says nothing about what the or condition prints
  "prog-conditions/i/en/weekend", "prog-conditions/i/he/weekend",
  // true, false and undefined are options of nearly every question of the level, always side by side
  ...["en", "he"].flatMap((lang) => ["true", "false", "undefined"].map((a) => `prog-javascript/a/${lang}/${a}`)),
  // "Methods: the actions each car can carry out" is a wrong option of the attribute question; it says no more than the
  // level's own Method term ("an action an object can do"), which the drive()/honk() question asks the learner to apply
  "prog-oop/b/en/Methods", "prog-oop/b/he/שיטות",
  // the stored name is part of its own question (Dog("Rex"), Dog("Bo")); the other mentions do not say what d.name or b.name is
  "prog-oop/i/en/Rex", "prog-oop/i/he/Rex", "prog-oop/i/en/Bo", "prog-oop/i/he/Bo",
  // the four type names (int, str, bool, float) are all terms of the level, the four options of the 3.0 question
  "prog-variables/i/en/float", "prog-variables/i/he/float",
];

const norm = (s: string) => s.toLowerCase().replace(/^(the|a|an)\s+/, "").replace(/[.,;:!?"“”״׳']/g, "").replace(/\s+/g, " ").trim();
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Every text a learner sees in a level besides the choice question `skip`, in one language. */
function shownBesides(lv: LevelContent, lang: 0 | 1, skip = -1): string[] {
  return [
    ...(lv.q ?? []).filter((_, i) => i !== skip).flatMap((pair) => [pair[lang][0], pair[lang][1], ...pair[lang][2]]),
    ...(lv.n ?? []).map((n) => (lang === 0 ? n[1] : n[2])[0]),
    ...(lv.s ?? []).flatMap((s) => s[lang]),
    ...(lv.t ?? []).flatMap((t) => (lang === 0 ? [t[0], t[1]] : [t[2], t[3]])),
  ];
}

function question(c: TopicContent, l: Level, start: string): Question {
  const found = (c[l].q ?? []).filter(([en]) => en[0].startsWith(start));
  expect(found.length, `"${start}"`).toBe(1);
  return found[0]!;
}
function term(c: TopicContent, l: Level, name: string): [string, string] {
  const t = (c[l].t ?? []).find((x) => x[0] === name);
  if (!t) throw new Error(`no term ${name}`);
  return [t[1], t[3]];
}
const visible = (c: TopicContent, l: Level, lang: 0 | 1, skip?: string) => {
  const at = skip === undefined ? -1 : (c[l].q ?? []).findIndex(([en]) => en[0].startsWith(skip));
  return shownBesides(c[l], lang, at).join(" | ");
};
const pyRange = (start: number, stop: number): number[] => Array.from({ length: Math.max(0, stop - start) }, (_, i) => start + i);

describe("G5 topics: full levels, both languages in step", () => {
  it.each(Object.keys(TOPICS))("%s: 8+ items and 4+ questions, numbers or orderings per level; he and en have the same shape", (id) => {
    const c = TOPICS[id]!;
    for (const l of LEVELS) {
      const lv = c[l];
      const active = (lv.q?.length ?? 0) + (lv.n?.length ?? 0) + (lv.s?.length ?? 0);
      expect(active + (lv.t?.length ?? 0), `${id}/${l}`).toBeGreaterThanOrEqual(8);
      expect(active, `${id}/${l}`).toBeGreaterThanOrEqual(4);
      for (const [en, he] of lv.q ?? []) {
        expect(he[2].length, en[0]).toBe(en[2].length);
        for (const [q, , , explanation] of [en, he]) expect(explanation.length, q).toBeGreaterThanOrEqual(40);
      }
      for (const [answer, en, he] of lv.n ?? []) for (const [q, , explanation] of [en, he]) {
        expect(explanation.length, q).toBeGreaterThanOrEqual(40);
        expect([String(answer), answer.toLocaleString("en-US")].some((w) => explanation.includes(w)), q).toBe(true);
      }
      for (const [en, he] of lv.s ?? []) expect(he.length, en[0]).toBe(en.length);
    }
  });

  it.each(Object.keys(TOPICS))("%s: the right answer is strictly the longest option in at most 40 %% of the questions", (id) => {
    const qs = LEVELS.flatMap((l) => TOPICS[id]![l].q ?? []);
    for (const lang of [0, 1] as const) {
      const longest = qs.filter((p) => p[lang][1].length > Math.max(...p[lang][2].map((w) => w.length))).length;
      expect(longest / qs.length, `${id} ${lang ? "he" : "en"}`).toBeLessThanOrEqual(0.4);
    }
  });
});

describe("G5 topics: no item spells out the answer of a choice question of its level", () => {
  it.each(Object.keys(TOPICS))("%s: a worded answer is not repeated in another item of the same level (except KEPT)", (id) => {
    const c = TOPICS[id]!;
    const found: string[] = [];
    for (const l of LEVELS) for (const lang of [0, 1] as const) {
      (c[l].q ?? []).forEach((pair, qi) => {
        const answer = pair[lang][1];
        if (!/\p{L}/u.test(answer)) return; // bare numbers and symbols ("5", "==") recur in code and sums without telling anything
        const re = new RegExp(`(^|[^\\p{L}\\p{N}])${escape(norm(answer))}($|[^\\p{L}\\p{N}])`, "u");
        if (shownBesides(c[l], lang, qi).some((t) => re.test(norm(t)))) found.push(`${id}/${l}/${lang ? "he" : "en"}/${answer}`);
      });
    }
    expect(found.filter((f) => !KEPT.includes(f))).toEqual([]);
  });

  it("speed: the car drives for 2 hours, the cars apart drive at 55 and 65 km/h, the journeys no longer say 2 hours", () => {
    expect(question(speed, "b", "How long does it take to walk 12 km")[0][1]).toBe("3 hours");
    expect(visible(speed, "b", 0, "How long does it take")).not.toMatch(/3 hours/);
    expect(visible(speed, "b", 1, "How long does it take")).not.toMatch(/3 שעות/);
    expect(speed.b.n![0]![0]).toBe(60 * 2);
    const apart = question(speed, "i", "Two cars leave the same town");
    expect(apart[0][1]).toBe(`${(55 + 65) * 2} km`);
    expect(apart[0][2][0]).toBe(`${(65 - 55) * 2} km`); // the same-direction slip
    expect(visible(speed, "i", 0, "A bus travels 120 km")).not.toMatch(/50 km\/h/);
    expect(visible(speed, "a", 0, "Two trains 300 km apart")).not.toMatch(/2 hours/);
    expect(question(speed, "a", "Two trains 300 km apart")[0][1]).toBe(`${300 / (70 + 80)} hours`);
  });

  it("units: the beginner terms no longer give 1,000 grams or a hundredth of a metre, the area term not 10,000 cm²", () => {
    expect(question(units, "b", "How many grams are in 1 kilogram")[0][1]).toBe("1,000");
    expect(question(units, "b", "How many centimetres are in 1 metre")[0][1]).toBe("100");
    for (const name of ["Kilogram", "Centimetre", "Litre"]) {
      const [en, he] = term(units, "b", name);
      expect(en, name).not.toMatch(/1,000|100|hundredth|gram/);
      expect(he, name).not.toMatch(/1,000|100|מאית|גרם/);
    }
    const [areaEn, areaHe] = term(units, "a", "Area unit conversion");
    expect(areaEn + areaHe).not.toContain("10,000");
    expect(areaEn).toContain("1 cm² = 100 mm²");
    expect(10 * 10).toBe(100); // 1 cm = 10 mm
    expect(question(units, "a", "How many square centimetres are in 1 square metre")[0][1]).toBe((100 * 100).toLocaleString("en-US"));
    // the floating question no longer offers aluminium at 2.7 g/cm³, the answer of the density question
    expect(question(units, "a", "A 200 cm³ block has a mass of 540 g")[0][1]).toBe(`${540 / 200} g/cm³`);
    const [floats, floatsHe] = question(units, "a", "Water has a density of 1 g/cm³");
    expect([...floats[2], ...floatsHe[2]].join(" ")).not.toMatch(/2\.7|Aluminium|אלומיניום/);
    expect(floats[2]).toContain("Gold with a density of 19.3 g/cm³");
  });

  it("conditions: the else term does not say when else runs; the Boolean question became 'which of these is a condition'", () => {
    const [elseEn, elseHe] = term(conditions, "b", "else branch");
    expect(elseEn).not.toMatch(/False|True|runs when/);
    expect(elseHe).not.toMatch(/False|True|שרץ/);
    expect(question(conditions, "b", "What does the else part")[0][1]).toBe("It runs only when the condition of the if is False");
    const [en, he] = question(conditions, "b", "In Python 3, after  age = 9");
    expect([en[1], he[1]]).toEqual(["age < 12", "age < 12"]);
    expect(en[2]).toContain("age = 12");
    const age = 9;
    expect(age < 12).toBe(true);
    expect(visible(conditions, "b", 0)).not.toMatch(/Which two values can a Boolean have/);
  });

  it("JavaScript: no item shows return, quotes making a string, const making a variable, or 'string' as an example type", () => {
    const keyword = question(javascript, "i", "Which keyword sends a value back");
    expect(keyword[0][1]).toBe("return");
    expect(visible(javascript, "i", 0, "Which keyword sends a value back")).not.toMatch(/\breturn\b/);
    expect(visible(javascript, "i", 1, "Which keyword sends a value back")).not.toMatch(/\breturn\b/);
    const double = (n: number) => n * 2;
    expect(javascript.i.n!.find(([, en]) => en[0].startsWith("function double(n)"))![0]).toBe(double(7));
    const [stringEn, stringHe] = term(javascript, "b", "String");
    expect(stringEn + stringHe).not.toMatch(/quote|מירכאות|"/);
    expect(question(javascript, "b", "In JavaScript, which of these values is a string")[0][1]).toBe('"42"');
    const [constEn] = term(javascript, "b", "const");
    const maya = question(javascript, "b", 'After  const name = "Maya"');
    expect(maya[0][1]).toBe("Maya");
    expect(constEn).toMatch(/creates a variable/); // the const term is unchanged, so the question no longer asks what const does
    expect(visible(javascript, "b", 0)).not.toMatch(/Makes a variable called name/);
    const [coercionEn, coercionHe] = term(javascript, "a", "Type coercion");
    expect(coercionEn).not.toMatch(/string/);
    expect(coercionHe).not.toMatch(/מחרוזת/);
    expect(coercionEn).toContain("null + 1");
    expect((null as unknown as number) + 1).toBe(1); // null is turned into 0
    expect(question(javascript, "a", 'What does  console.log(typeof "hello")')[0][1]).toBe(typeof "hello");
  });

  it("loops: the range question asks for 1 to 20, which no other item of the level writes; the while answer is reworded", () => {
    const [en, he] = question(loops, "a", "You want a loop to print the numbers 1 to 20");
    expect([en[1], he[1]]).toEqual(["range(1, 21)", "range(1, 21)"]);
    expect(pyRange(1, 21)[0]).toBe(1);
    expect(pyRange(1, 21).at(-1)).toBe(20);
    expect(pyRange(1, 20).at(-1)).toBe(19);
    expect(pyRange(0, 20).at(-1)).toBe(19);
    expect(visible(loops, "a", 0, "You want a loop")).not.toContain("range(1, 21)");
    // the number item still counts the even numbers of range(1, 11) (w5-S4 pins it)
    expect(loops.a.n!.find(([, e]) => e[0].startsWith("In Python 3, count starts at 0"))![0]).toBe(pyRange(1, 11).filter((i) => i % 2 === 0).length);
    const [whileEn, whileHe] = term(loops, "i", "while loop");
    const password = question(loops, "i", "A program must keep asking for a password");
    expect(password[0][1]).toMatch(/^A while loop/);
    expect(password[0][1]).not.toContain("as long as its condition is True");
    expect(password[1][1]).not.toContain("כל עוד התנאי שלה True");
    expect(whileEn).toContain("as long as its condition is True");
    expect(whileHe).toContain("כל עוד התנאי שלו True");
  });

  it("objects: beginner items no longer call a thing made from a class an object, outside the class/object question", () => {
    const counting = "A class Cat is used to make three cats";
    for (const [lang, word] of [[0, /\bobject/i], [1, /עצם|עצמים/]] as const) {
      const others = (oop.b.q ?? []).filter(([en]) => !en[0].startsWith(counting)).flatMap((p) => [p[lang][0], p[lang][1], ...p[lang][2]]);
      expect(others.filter((s) => word.test(s) && !/^(Objects|עצמים)$/.test(s))).toEqual([]);
    }
    expect(question(oop, "b", counting)[0][1]).toBe("1 class and 3 objects");
    const [make, makeHe] = question(oop, "b", "In Python 3, which line makes a new dog");
    expect([make[1], makeHe[1]]).toEqual(['rex = Dog("Rex")', 'rex = Dog("Rex")']);
    expect(make[2]).toContain('rex = new Dog("Rex")');
    const [attrEn, attrHe] = term(oop, "b", "Attribute");
    expect(attrEn).not.toMatch(/dog/i);
    expect(attrHe).not.toContain("כלב");
    const [initEn, initHe] = term(oop, "i", "Constructor (__init__)");
    expect(initEn).not.toMatch(/created|runs/);
    expect(initHe).not.toMatch(/נוצר|שרצה/);
    const [selfEn, selfHe] = term(oop, "i", "self");
    expect(selfEn).not.toMatch(/object/);
    expect(selfHe).not.toContain("עצם");
    expect(question(oop, "i", "In a Python 3 method, what does self refer to")[0][1]).toBe("The object the method was called on");
  });

  it("variables: assignment is not 'written with =', the float example is not 3.0, the Boolean term does not list True", () => {
    const [assignEn, assignHe] = term(variables, "b", "Assignment");
    expect(assignEn + assignHe).not.toContain("=");
    expect(question(variables, "b", "In Python, what does the = sign")[0][1]).toBe("It stores 0 in the variable score");
    const [floatEn, floatHe] = term(variables, "i", "Float");
    expect(floatEn + floatHe).not.toContain("3.0");
    const [intEn, intHe] = term(variables, "i", "Integer (int)");
    expect(intEn + intHe).not.toMatch(/(^|\D)7(\D|$)/);
    expect(question(variables, "i", 'In Python 3, what does  print(int("5") + 2)')[0][1]).toBe(String(5 + 2));
    const [boolEn, boolHe] = term(variables, "i", "Boolean (bool)");
    expect(boolEn + boolHe).not.toMatch(/True|False/);
    expect(question(variables, "i", "Which of these values is a Boolean")[0][1]).toBe("True");
  });
});
