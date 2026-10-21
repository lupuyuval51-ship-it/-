import { describe, expect, it } from "vitest";
import type { LevelContent, TopicContent } from "@/lib/game/topics/types";
import attention from "@/lib/game/topics/content/think-attention";
import biases from "@/lib/game/topics/content/think-biases";
import causeEffect from "@/lib/game/topics/content/think-cause-effect";
import chess from "@/lib/game/topics/content/think-chess";
import classicPuzzles from "@/lib/game/topics/content/think-classic-puzzles";
import classifying from "@/lib/game/topics/content/think-classifying";
import creativity from "@/lib/game/topics/content/think-creativity";
import criticalThinking from "@/lib/game/topics/content/think-critical-thinking";
import debate from "@/lib/game/topics/content/think-debate";
import decisionMaking from "@/lib/game/topics/content/think-decision-making";

/**
 * Ten thinking-skills topics. Five of them (creativity, debate, critical thinking, decision making, biases) gave the right
 * answer away by its length in 46 to 100 % of their questions, and critical thinking and decision making had only two
 * questions a level. They now have longer, plausible wrong options, more questions, orderings and numbers, and the
 * right answer is the strictly longest option in at most 40 % of the choice questions of every topic, in each language.
 */
const TOPICS: Record<string, TopicContent> = {
  "think-attention": attention,
  "think-biases": biases,
  "think-cause-effect": causeEffect,
  "think-chess": chess,
  "think-classic-puzzles": classicPuzzles,
  "think-classifying": classifying,
  "think-creativity": creativity,
  "think-critical-thinking": criticalThinking,
  "think-debate": debate,
  "think-decision-making": decisionMaking,
};
const LEVELS = ["b", "i", "a"] as const;
const levelsOf = (c: TopicContent): LevelContent[] => LEVELS.map((l) => c[l]);
const questions = (c: TopicContent) => LEVELS.flatMap((l) => c[l].q ?? []);
const everyText = (c: TopicContent): string[] =>
  levelsOf(c).flatMap((lv) => [
    ...(lv.t ?? []).flat(),
    ...(lv.q ?? []).flatMap((pair) => pair.flatMap(([q, a, w, e, h]) => [q, a, ...w, e, ...(h ? [h] : [])])),
    ...(lv.n ?? []).flatMap(([, en, he]) => [...en, ...he]),
    ...(lv.s ?? []).flatMap(([en, he]) => [...en, ...he]),
  ]).filter((s): s is string => typeof s === "string");

describe("S11 topics: answer length is not a tell", () => {
  for (const [id, content] of Object.entries(TOPICS)) {
    it(`${id}: the right answer is the strictly longest option in at most 40 % of the questions, in each language`, () => {
      const longest = [0, 0];
      let all = 0;
      for (const pair of questions(content)) {
        all++;
        pair.forEach(([, answer, wrong], lang) => {
          if (answer.length > Math.max(...wrong.map((w) => w.length))) longest[lang]!++;
        });
      }
      expect(all, id).toBeGreaterThanOrEqual(12);
      expect(longest[0]! / all, `${id} en`).toBeLessThanOrEqual(0.4);
      expect(longest[1]! / all, `${id} he`).toBeLessThanOrEqual(0.4);
    });
  }
});

describe("S11 topics: the collection's quality bar", () => {
  for (const [id, content] of Object.entries(TOPICS)) {
    it(`${id}: 8+ pieces and 4+ items per level, explanations of 40+ characters, no "<" or ">" in Hebrew, both languages in step`, () => {
      const prompts = [new Set<string>(), new Set<string>()];
      for (const [at, lv] of levelsOf(content).entries()) {
        const where = `${id}/${LEVELS[at]}`;
        const items = (lv.q?.length ?? 0) + (lv.n?.length ?? 0) + (lv.s?.length ?? 0);
        expect((lv.t?.length ?? 0) + items, where).toBeGreaterThanOrEqual(8);
        expect(items, where).toBeGreaterThanOrEqual(4);
        for (const pair of lv.q ?? []) {
          for (const [q, answer, wrong, explanation] of pair) {
            expect(explanation.length, `${where}: ${q}`).toBeGreaterThanOrEqual(40);
            expect(new Set([answer, ...wrong].map((o) => o.trim().toLowerCase())).size, `${where}: options of ${q}`).toBe(wrong.length + 1);
          }
          expect(pair[0][2].length, `${where}: ${pair[0][0]}`).toBe(pair[1][2].length);
          pair.forEach(([q], lang) => {
            expect(prompts[lang]!.has(q), `${where}: repeated question ${q}`).toBe(false);
            prompts[lang]!.add(q);
          });
        }
        for (const [answer, en, he] of lv.n ?? []) {
          for (const [q, , explanation] of [en, he]) expect(explanation.length, `${where}: ${q}`).toBeGreaterThanOrEqual(40);
          expect(Boolean(en[1]), `${where}: unit in one language only: ${en[0]}`).toBe(Boolean(he[1]));
          const written = [String(answer), answer.toLocaleString("en-US")];
          for (const text of [en[2], he[2]]) expect(written.some((w) => text.includes(w)), `${where}: the answer ${answer} is in its explanation`).toBe(true);
        }
        for (const [en, he] of lv.s ?? []) {
          expect(en.length, `${where}: ${en[0]}`).toBe(he.length);
          expect(en.length - 1, `${where}: ${en[0]}`).toBeGreaterThanOrEqual(3);
          expect(en.length - 1, `${where}: ${en[0]}`).toBeLessThanOrEqual(6);
        }
      }
      for (const s of everyText(content)) {
        // a right-to-left line mirrors them; English may use them, so only the Hebrew halves are read here
        if (/\p{Script=Hebrew}/u.test(s)) expect(/[<>]/.test(s), `${id}: ${s}`).toBe(false);
      }
    });
  }

  it("critical thinking and decision making are no longer thin: four or more questions at every level and fifteen or more in the topic", () => {
    for (const [id, content] of [["think-critical-thinking", criticalThinking], ["think-decision-making", decisionMaking]] as const) {
      for (const l of LEVELS) expect(content[l].q?.length ?? 0, `${id}/${l}`).toBeGreaterThanOrEqual(4);
      expect(questions(content).length, id).toBeGreaterThanOrEqual(15);
    }
  });
});

describe("S11 topics: wording fit for learners aged 7 to 17", () => {
  it("no real-money gambling (casino, roulette, betting) in the thinking topics: the gambler's fallacy is taught with coin tosses", () => {
    const gambling = /casino|roulette|\bbet(s|ting)?\b|wager|gambling|קזינו|רולטה|הימור|הימרו|מהמרים/i;
    for (const [id, content] of Object.entries(TOPICS)) {
      for (const s of everyText(content)) {
        // the name of the fallacy itself ("gambler's fallacy", "כשל המהמר") is a term, not a scene of gambling
        const plain = s.replace(/gambler['’]s fallacy/gi, "").replace(/כשל המהמר/g, "");
        expect(gambling.test(plain), `${id}: ${s}`).toBe(false);
      }
    }
    const coin = JSON.stringify(biases.a.q);
    expect(coin).toContain("fair coin");
    expect(coin).toContain("מטבע הוגן");
  });

  it("the example of a plain fact in critical thinking is one that nobody disputes", () => {
    const [en, he] = criticalThinking.b.q![0]!;
    expect(en[1]).toBe("The Earth goes around the Sun.");
    expect(he[1]).toBe("כדור הארץ מקיף את השמש.");
    expect(/Jerusalem|ירושלים/.test(JSON.stringify(criticalThinking))).toBe(false);
  });

  it("the question about the Second World War bombers keeps the survivorship reason as its only right answer", () => {
    const [en] = biases.a.q![0]!;
    expect(en[1]).toMatch(/never came back.*never counted/);
    expect(en[2].some((w) => /came back|never counted/.test(w))).toBe(false);
  });
});
