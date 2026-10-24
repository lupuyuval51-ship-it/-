import { describe, expect, it } from "vitest";
import { gradeAnswer } from "@/lib/game/challenges/grade";
import { buildMaterialSpec } from "@/lib/game/material/build";
import { generateChallenges, leastPlausible } from "@/lib/game/material/challenges";
import { parseMaterial } from "@/lib/game/material/parse";
import { NOTE_SETS } from "@/lib/game/sim-balance/corpus";
import { validateGameSpec } from "@/lib/game/spec/validate";
import { mulberry32 } from "@/lib/game/util/prng";
import { correctAnswer, request, wrongAnswer } from "./helpers";

const EN = `The first flights
In 1903 the Wright brothers made the first powered flight.
In 1927 Charles Lindbergh flew alone across the Atlantic Ocean.
In 1947 Chuck Yeager flew faster than the speed of sound.
In 1969 the Boeing jumbo jet made its first flight.
Aileron: a hinged part of the wing that rolls the plane.`;

const HE = `תחילת התעופה
בשנת 1903 האחים רייט ביצעו את הטיסה הממונעת הראשונה.
בשנת 1927 צ׳רלס לינדברג טס לבדו מעל האוקיינוס האטלנטי.
בשנת 1947 צ׳אק ייגר טס מהר יותר ממהירות הקול.
בשנת 1969 מטוס הג׳מבו הגדול ביצע את טיסתו הראשונה.
מאזן: חלק מסתובב בכנף שמטה את המטוס.`;

const YEAR = /\b(?:1[0-9]{3}|20[0-9]{2})\b/;

function timelines(text: string, lang: "en" | "he", max = 20) {
  const g = generateChallenges(parseMaterial(text), { lang, rnd: mulberry32(5), max });
  return g.challenges.filter((c, i) => g.kinds[i] === "timeline");
}

describe("timeline questions from dated events in the learner's notes", () => {
  for (const [name, text, lang] of [["English", EN, "en"], ["Hebrew", HE, "he"]] as const) {
    it(`${name}: events are listed oldest first with the year hidden`, () => {
      const [c, ...rest] = timelines(text, lang);
      expect(rest).toHaveLength(0);
      expect(c!.type).toBe("sequence");
      const items = (c!.items as { text: string }[]).map((i) => i.text);
      expect(items).toHaveLength(4);
      const years = [...text.matchAll(/\b(1[0-9]{3})\b/g)].map((m) => Number(m[1]));
      // the explanation names the years in order and the items, put back together, are sentences of the notes in that order
      expect(String(c!.explanation).startsWith(years.join(" → "))).toBe(true);
      items.forEach((item, i) => {
        expect(item).not.toMatch(YEAR);
        expect(item).toContain("___");
        expect(text).toContain(item.replace("___", String(years[i])));
      });
      expect(String(c!.hint)).toContain(String(years[0]));
      expect(String(c!.hint)).not.toContain(String(years[1]));
    });

    it(`${name}: a game with it validates, and the sequence is graded in date order`, () => {
      const built = buildMaterialSpec(request({ material: text, subject: lang === "he" ? "תעופה" : "Flight", contentLanguage: lang, mode: "FULL" }) as never);
      const res = validateGameSpec(built.raw, { alignGameType: "adventure" });
      if (!res.ok) throw new Error(res.errors.join("\n"));
      const c = res.spec.challenges.find((x) => x.type === "sequence" && /1903|___/.test(JSON.stringify(x)) && x.items.some((i) => i.text.includes("___")));
      expect(c, "the timeline challenge is in the game").toBeTruthy();
      expect(gradeAnswer(c!, correctAnswer(c!), lang).correct).toBe(true);
      expect(gradeAnswer(c!, wrongAnswer(c!), lang).correct).toBe(false);
    });
  }

  it("needs three different years: fewer, or the same year twice, make no timeline", () => {
    expect(timelines("In 1903 the Wright brothers made the first powered flight.\nIn 1927 Charles Lindbergh flew alone across the Atlantic Ocean.", "en")).toHaveLength(0);
    const sameYear = `In 1903 the Wright brothers made the first powered flight.
In 1903 the Wright brothers made the second powered flight that day.
In 1927 Charles Lindbergh flew alone across the Atlantic Ocean.`;
    expect(timelines(sameYear, "en")).toHaveLength(0);
  });

  it("a sentence with two years is left out (its order would be ambiguous)", () => {
    const text = `${EN}\nBetween 1914 and 1918 aeroplanes were used in a war for the first time.`;
    const [c] = timelines(text, "en");
    expect(String((c!.items as { text: string }[]).map((i) => i.text))).not.toContain("war");
  });

  it("an amount that looks like a year is not an event: only numbers used as dates make a timeline", () => {
    const amounts = `The old tower is 1500 metres tall and very famous.
The trip took 1200 years in total according to the book.
The school has 1800 students in many different classes.
The bridge carries 2000 cars across the river every day.`;
    expect(timelines(amounts, "en")).toHaveLength(0);
    const [c] = timelines(`${EN}\n${amounts}`, "en");
    const items = (c!.items as { text: string }[]).map((i) => i.text).join(" ");
    expect(items).not.toMatch(/tower|trip|school|bridge/);
    const he = `בשנת 1948 הוקמה מדינת ישראל בתל אביב.
ב-1967 פרצה מלחמת ששת הימים באזור כולו.
1973 הייתה השנה שבה פרצה מלחמת יום הכיפורים.
בבית הספר הגדול הזה לומדים 1500 תלמידים בכל שנה.`;
    const [h] = timelines(he, "he");
    const hs = (h!.items as { text: string }[]).map((i) => i.text);
    expect(hs).toHaveLength(3);
    expect(hs.join(" ")).not.toMatch(/תלמידים/);
  });

  it("a long list is cut into stretches of time of at most five events, two questions at most", () => {
    const lines = Array.from({ length: 12 }, (_, i) => `In ${1900 + i * 7} the ${["first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth", "ninth", "tenth", "eleventh", "twelfth"][i]} great bridge of the old city opened.`);
    const cs = timelines(lines.join("\n"), "en", 30);
    expect(cs.length).toBe(2);
    for (const c of cs) {
      const n = (c.items as unknown[]).length;
      expect(n).toBeGreaterThanOrEqual(3);
      expect(n).toBeLessThanOrEqual(5);
    }
    // the second question is about later years than the first
    const first = Number(/^(\d{4})/.exec(String(cs[0]!.explanation))![1]);
    const second = Number(/^(\d{4})/.exec(String(cs[1]!.explanation))![1]);
    expect(second).toBeGreaterThan(first);
  });

  it("the corpus has dated notes in both languages, and both give a timeline in the full and the fast game", () => {
    for (const lang of ["en", "he"] as const) {
      const n = NOTE_SETS[lang].find((x) => x.id.endsWith("-history"))!;
      expect(timelines(n.text, lang).length, n.id).toBeGreaterThan(0);
      for (const mode of ["FULL", "FAST"] as const) {
        const built = buildMaterialSpec(request({ material: n.text, subject: n.subject, contentLanguage: lang, mode }) as never);
        const res = validateGameSpec(built.raw, { alignGameType: "adventure" });
        if (!res.ok) throw new Error(res.errors.join("\n"));
      }
    }
  });
});

describe("the easier version of a question rules out the most obvious wrong answer", () => {
  it("picks the option least like the right one and least tied to the question", () => {
    const correct = { text: "The heart pumps blood around the body" };
    const near = { text: "The heart pumps oxygen around the body" };
    const far = { text: "Plants make food from sunlight" };
    expect(leastPlausible(correct, [near, far], "What does the heart do?")).toBe(far);
    expect(leastPlausible(correct, [far, near], "What does the heart do?")).toBe(far);
    // a name next to names: the odd shape (a number) is the one to drop
    expect(leastPlausible({ text: "Paris" }, [{ text: "Lyon" }, { text: "1,200 metres" }], "What is the capital of France?").text).toBe("1,200 metres");
    // nothing to tell them apart: the first stays
    expect(leastPlausible({ text: "Paris" }, [{ text: "Lyon" }, { text: "Rome" }], "Which city?").text).toBe("Lyon");
  });

  it("every easier variant of the corpus keeps the right answer and a wrong one no closer than the others", () => {
    let checked = 0;
    for (const lang of ["en", "he"] as const) {
      for (const n of NOTE_SETS[lang]) {
        const g = generateChallenges(parseMaterial(n.text), { lang, rnd: mulberry32(11), max: 20, variants: true });
        for (const v of g.variants.filter((x) => x.type === "choice")) {
          const parent = g.challenges.find((c) => c.easierId === v.id)!;
          const all = parent.options as { id: string; text: string }[];
          const wrongs = all.filter((o) => o.id !== parent.correctOptionId);
          const kept = (v.options as { id: string; text: string }[]).filter((o) => o.id !== v.correctOptionId);
          expect(v.correctOptionId).toBe(parent.correctOptionId);
          expect(kept).toHaveLength(1);
          const right = all.find((o) => o.id === parent.correctOptionId)!;
          expect(kept[0]).toBe(leastPlausible(right, wrongs, String(parent.prompt)));
          checked++;
        }
      }
    }
    expect(checked).toBeGreaterThan(10);
  });
});
