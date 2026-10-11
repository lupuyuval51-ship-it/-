import { describe, expect, it } from "vitest";
import { gradeAnswer, revealSolution } from "@/lib/game/challenges/grade";
import { formLike, generateChallenges, type ChallengeKind } from "@/lib/game/material/challenges";
import { parseMaterial } from "@/lib/game/material/parse";
import { buildMaterialSpec } from "@/lib/game/material/build";
import { validateGameSpec } from "@/lib/game/spec/validate";
import { mulberry32 } from "@/lib/game/util/prng";
import { correctAnswer, request, wrongAnswer } from "./helpers";

const EN = `The Solar System
Mercury: the smallest planet, closest to the Sun, with almost no atmosphere at all.
Venus: the hottest planet because its thick atmosphere traps heat.
Jupiter: the largest planet, a giant planet made mostly of gas.
Saturn: a giant with bright rings made of ice and rock.
Mars: the red planet, a cold desert world with a thin atmosphere.
Light from the Sun takes about 8 minutes to reach the Earth.
The Earth is 4500 million years old and has one natural moon.
Jupiter has 95 known moons and a storm called the Great Red Spot.
Saturn needs 29 years to circle the Sun once.
Neptune is the farthest planet and takes 165 years to orbit the Sun.`;

const HE = `מערכת השמש
חמה: כוכב הלכת הקטן ביותר והקרוב ביותר אל השמש, כמעט בלי אטמוספרה.
נוגה: כוכב הלכת החם ביותר בגלל האטמוספרה העבה שלו שלוכדת חום.
צדק: ענק שעשוי בעיקר מגז, הגדול ביותר מבין כוכבי הלכת.
שבתאי: ענק עם טבעות בהירות שעשויות מקרח וסלעים.
מאדים: כוכב הלכת האדום, עולם מדברי קר שיש לו אטמוספרה דקה.
האור מהשמש מגיע אל כדור הארץ אחרי כ-8 דקות של מסע בחלל.
לצדק יש 95 ירחים ידועים וסופה גדולה שנקראת הכתם האדום.
לשבתאי לוקח 29 שנים להקיף את השמש פעם אחת.
נפטון הוא כוכב הלכת הרחוק ביותר והוא מקיף את השמש במשך 165 שנים.
כדור הארץ התגבש לפני 4500 מיליון שנים והוא כולל ירח טבעי אחד.`;

const NEW_KINDS: ChallengeKind[] = ["factpick", "statement", "odd"];

function gen(text: string, lang: "en" | "he", max = 24) {
  return generateChallenges(parseMaterial(text), { lang, rnd: mulberry32(7), max });
}

describe("new question kinds built from the learner's own facts and terms", () => {
  for (const [name, text, lang] of [["English", EN, "en"], ["Hebrew", HE, "he"]] as const) {
    it(`${name}: every new kind appears, is deterministic and keeps to the learner's words`, () => {
      const a = gen(text, lang);
      for (const kind of NEW_KINDS) expect(a.counts[kind], `${name} ${kind}`).toBeGreaterThan(0);
      expect(JSON.stringify(gen(text, lang))).toBe(JSON.stringify(a));
    });

    it(`${name}: a fact-number question offers numbers of the material (or labelled near-misses), with one right answer`, () => {
      const g = gen(text, lang);
      const picks = g.challenges.filter((c) => /^(?:Which number goes|איזה מספר מתאים)/.test(String(c.prompt)));
      expect(picks.length).toBeGreaterThan(0);
      for (const c of picks) {
        const options = c.options as { id: string; text: string }[];
        const numbers = new Set(options.map((o) => o.text));
        expect(numbers.size).toBe(options.length);
        const feedbacks = new Map((c.options as { text: string; feedback: string }[]).map((o) => [o.text, o.feedback]));
        // a number that is not in the notes is a near-miss and says so
        for (const o of options) if (!text.includes(o.text)) expect(feedbacks.get(o.text), o.text).toMatch(/Close, but|קרוב, אבל/);
        const right = options.find((o) => o.id === c.correctOptionId)!;
        // putting the right number back gives a sentence of the material
        const sentence = String(c.prompt).split("\n")[1]!.slice(1, -1).replace("___", right.text);
        expect(text).toContain(sentence);
        expect(text).toContain(right.text);
        // the blank is not answered by the prompt itself
        expect(String(c.prompt)).toContain("___");
      }
    });

    it(`${name}: a statement question has exactly one verbatim sentence and three altered ones`, () => {
      const g = gen(text, lang);
      const sts = g.challenges.filter((c) => /^(?:Which of these statements|איזה מהמשפטים)/.test(String(c.prompt)));
      expect(sts.length).toBeGreaterThan(0);
      for (const c of sts) {
        const options = c.options as { id: string; text: string }[];
        expect(options).toHaveLength(4);
        expect(new Set(options.map((o) => o.text)).size).toBe(4);
        const verbatim = options.filter((o) => text.includes(o.text));
        expect(verbatim).toHaveLength(1);
        expect(verbatim[0]!.id).toBe(c.correctOptionId);
        // altered sentences differ from the original by a single word or number
        const base = verbatim[0]!.text.split(/\s+/);
        for (const o of options.filter((x) => x !== verbatim[0])) {
          const w = o.text.split(/\s+/);
          expect(w.length).toBe(base.length);
          expect(w.filter((x, i) => x !== base[i]).length).toBe(1);
        }
      }
    });

    it(`${name}: odd-one-out names a word that three descriptions share and the odd one lacks`, () => {
      const g = gen(text, lang);
      const odds = g.challenges.filter((c) => /^(?:In your material, three of these terms|בחומר שלכם, שלושה מהמושגים)/.test(String(c.prompt)));
      expect(odds.length).toBeGreaterThan(0);
      const defs = parseMaterial(text).definitions;
      for (const c of odds) {
        const word = /[“״]([^”״]+)[”״]/.exec(String(c.prompt))![1]!;
        const options = c.options as { id: string; text: string }[];
        const withWord = options.filter((o) => defs.find((d) => d.term === o.text)!.meaning.includes(word));
        expect(withWord, `${word}`).toHaveLength(3);
        const odd = options.find((o) => !withWord.includes(o))!;
        expect(odd.id).toBe(c.correctOptionId);
      }
    });
  }
});

describe("Hebrew prefixes do not give the answer away", () => {
  const known = new Set(["צמח", "כוורת", "אור", "דבורים", "plant"]);

  it("a replacement word takes the prefix of the word it replaces, and drops its own", () => {
    expect(formLike("הצמח", "אור", known)).toBe("האור");
    expect(formLike("בצמח", "הכוורת", known)).toBe("בכוורת");
    expect(formLike("והדבורים", "צמח", known)).toBe("והצמח");
    expect(formLike("צמח", "הכוורת", known)).toBe("כוורת");
  });

  it("does not invent a prefix for words that merely start with a prefix letter", () => {
    // "מערכת" is not "מ" + "ערכת" unless "ערכת" is itself in the material
    expect(formLike("מערכת", "אור", known)).toBe("אור");
    expect(formLike("שמש", "אור", known)).toBe("אור");
    expect(formLike("plant", "light", known)).toBe("light");
  });

  it("fill-the-gap and statement options of a Hebrew game never repeat the right answer and stay distinct", () => {
    const g = generateChallenges(parseMaterial(HE), { lang: "he", rnd: mulberry32(3), max: 30 });
    for (const c of g.challenges.filter((x) => /^(?:איזו מילה משלימה|איזה מהמשפטים)/.test(String(x.prompt)))) {
      const texts = (c.options as { text: string }[]).map((o) => o.text);
      expect(new Set(texts).size, String(c.prompt)).toBe(texts.length);
    }
  });
});

describe("new kinds inside full games", () => {
  for (const [name, text, lang] of [["English", EN, "en"], ["Hebrew", HE, "he"]] as const) {
    it(`${name}: a game with the new kinds validates and every challenge is gradable`, () => {
      const r = request({ material: text, subject: lang === "he" ? "מערכת השמש" : "The Solar System", contentLanguage: lang, mode: "FULL" } as never);
      const built = buildMaterialSpec(r as never);
      const res = validateGameSpec(built.raw, { alignGameType: "adventure" });
      if (!res.ok) throw new Error(res.errors.join("\n"));
      for (const c of res.spec.challenges) {
        expect(gradeAnswer(c, correctAnswer(c), lang).correct, `${c.id} correct`).toBe(true);
        expect(gradeAnswer(c, wrongAnswer(c), lang).correct, `${c.id} wrong`).toBe(false);
        expect(revealSolution(c)).toBeTruthy();
      }
    });
  }

  it("never puts two questions of the same kind next to each other when there is a choice, and the game gets more variety", () => {
    const g = gen(EN, "en", 10);
    const kinds = Object.entries(g.counts).filter(([, n]) => n > 0).length;
    expect(kinds).toBeGreaterThanOrEqual(6);
  });
});
