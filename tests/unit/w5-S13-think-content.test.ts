import { describe, expect, it } from "vitest";
import type { LevelContent, TopicContent } from "@/lib/game/topics/types";
import mindMaps from "@/lib/game/topics/content/think-mind-maps";
import noteTaking from "@/lib/game/topics/content/think-note-taking";
import numberPuzzles from "@/lib/game/topics/content/think-number-puzzles";
import observation from "@/lib/game/topics/content/think-observation-inference";
import philosophy from "@/lib/game/topics/content/think-philosophy";
import problemSolving from "@/lib/game/topics/content/think-problem-solving";
import procrastination from "@/lib/game/topics/content/think-procrastination";
import publicSpeaking from "@/lib/game/topics/content/think-public-speaking";
import readingStrategies from "@/lib/game/topics/content/think-reading-strategies";
import researchProjects from "@/lib/game/topics/content/think-research-projects";

/**
 * Ten thinking-skills topics (mind maps, note taking, number puzzles, observation and inference, philosophy, problem
 * solving, procrastination, public speaking, reading strategies, research projects). Problem solving had only two
 * questions a level (six or seven pieces, under the collection's bar of eight) and now has questions, numbers and an
 * ordering at every level; the Hebrew spelling of "art" and of the KWL chart is the same everywhere; one question had an
 * exact answer behind an "about", and one wrong option now names the real misconception.
 */
const TOPICS: Record<string, TopicContent> = {
  "think-mind-maps": mindMaps,
  "think-note-taking": noteTaking,
  "think-number-puzzles": numberPuzzles,
  "think-observation-inference": observation,
  "think-philosophy": philosophy,
  "think-problem-solving": problemSolving,
  "think-procrastination": procrastination,
  "think-public-speaking": publicSpeaking,
  "think-reading-strategies": readingStrategies,
  "think-research-projects": researchProjects,
};
const LEVELS = ["b", "i", "a"] as const;
const levelsOf = (c: TopicContent): LevelContent[] => LEVELS.map((l) => c[l]);
const questions = (c: TopicContent) => LEVELS.flatMap((l) => c[l].q ?? []);
const hebrewTexts = (c: TopicContent): string[] =>
  levelsOf(c).flatMap((lv) => [
    ...(lv.t ?? []).flatMap(([, , term, meaning]) => [term, meaning]),
    ...(lv.q ?? []).flatMap(([, [q, a, w, e, h]]) => [q, a, ...w, e, ...(h ? [h] : [])]),
    ...(lv.n ?? []).flatMap(([, , [q, unit, e, h]]) => [q, unit, e, ...(h ? [h] : [])]),
    ...(lv.s ?? []).flatMap(([, he]) => [...he]),
  ]);
const englishTexts = (c: TopicContent): string[] =>
  levelsOf(c).flatMap((lv) => [
    ...(lv.t ?? []).flatMap(([term, meaning]) => [term, meaning]),
    ...(lv.q ?? []).flatMap(([[q, a, w, e, h]]) => [q, a, ...w, e, ...(h ? [h] : [])]),
    ...(lv.n ?? []).flatMap(([, [q, unit, e, h]]) => [q, unit, e, ...(h ? [h] : [])]),
    ...(lv.s ?? []).flatMap(([en]) => [...en]),
  ]);

describe("S13 topics: answer length is not a tell", () => {
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

describe("S13 topics: the collection's quality bar", () => {
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
      // a right-to-left line mirrors "<" and ">"; only the Hebrew halves are read here
      for (const s of hebrewTexts(content)) expect(/[<>]/.test(s), `${id}: ${s}`).toBe(false);
    });
  }
});

describe("S13 topics: problem solving is no longer thin", () => {
  it("has questions at every level, a number or two, and an ordering at every level, so a game has real variety", () => {
    for (const l of LEVELS) {
      const lv = problemSolving[l];
      expect(lv.q?.length ?? 0, `think-problem-solving/${l} questions`).toBeGreaterThanOrEqual(3);
      expect(lv.s?.length ?? 0, `think-problem-solving/${l} orderings`).toBeGreaterThanOrEqual(1);
      expect(lv.n?.length ?? 0, `think-problem-solving/${l} numbers`).toBeGreaterThanOrEqual(1);
    }
    expect(questions(problemSolving).length).toBeGreaterThanOrEqual(12);
  });

  it("the two first questions no longer hide the right answer by being the longest, and the throw-away 'Hide it' is gone", () => {
    const [first, second] = problemSolving.b.q!;
    for (const [, answer, wrong] of [...first!, ...second!]) expect(answer.length > Math.max(...wrong.map((w) => w.length)), answer).toBe(false);
    expect(first![0][2].join("|") + second![0][2].join("|")).not.toMatch(/Hide it/);
  });
});

describe("S13 topics: every number is the arithmetic of its own question", () => {
  const numbers = (c: TopicContent) => LEVELS.map((l) => c[l].n?.map(([answer]) => answer) ?? []);

  it("mind maps, note taking and number puzzles", () => {
    expect(numbers(mindMaps)).toEqual([[], [18 - 7], [3 + 3 + 1]]);
    expect(numbers(noteTaking)).toEqual([[3], [(30 / 120) * 100], [1 + 2 + 4 + 8]]);
    expect(numbers(numberPuzzles)).toEqual([[15 - 8 - 1, 8 / 2], [45 / 3, 56 / 2], [136 / 4, 121 / 11]]);
  });

  it("observation, philosophy, procrastination and public speaking", () => {
    expect(numbers(observation)).toEqual([[], [(20 - 14) / 2], [2020 - 48]]);
    expect(numbers(philosophy)).toEqual([[], [399 - 322], []]);
    expect(numbers(procrastination)).toEqual([[60 / 15], [4 * 25], []]);
    expect(numbers(publicSpeaking)).toEqual([[120 * 2], [130 * 5], [(15 - 1 - 2) / 3]]);
  });

  it("reading strategies and research projects", () => {
    expect(numbers(readingStrategies)).toEqual([[1800 / 600], [], [(240 * 300) / 200 / 60, (6 / 8) * 100]]);
    expect(numbers(researchProjects)).toEqual([[(12 / 30) * 100], [0.4 * 5], [(18 / 50) * 250]]);
  });

  it("problem solving: legs on a farm, two numbers that add to 20 and differ by 4, the square numbers, Gauss's sum and the party handshakes", () => {
    expect(numbers(problemSolving)).toEqual([[4 * 4 + 3 * 2], [(20 + 4) / 2, 6 * 6], [(100 * 101) / 2, 8]]);
    // the guests: n(n - 1) / 2 handshakes, and 8 is the only whole number of guests that gives 28
    const guests = Array.from({ length: 30 }, (_, i) => i + 1).filter((n) => (n * (n - 1)) / 2 === 28);
    expect(guests).toEqual([8]);
    const en = problemSolving.a.n![1]![1];
    for (const [n, shakes] of [[2, 1], [3, 3], [4, 6], [5, 10], [6, 15], [7, 21]] as const) expect((n * (n - 1)) / 2).toBe(shakes);
    expect(en[2]).toContain("2 guests make 1, 3 make 3, 4 make 6, 5 make 10, 6 make 15, 7 make 21");
    // the squares: the gaps 3, 5, 7, 9 grow by 2, so the next gap is 11
    expect([1, 2, 3, 4, 5].map((n) => n * n)).toEqual([1, 4, 9, 16, 25]);
    expect(25 + 11).toBe(36);
  });

  it("observation: the tree-ring question gives an exact rule (one year per ring) instead of asking for 'about' a year", () => {
    const [en, he] = [observation.a.n![0]![1], observation.a.n![0]![2]];
    expect(en[0]).toContain("Counting one year for each ring");
    expect(en[0]).not.toMatch(/\babout\b/);
    expect(he[0]).not.toContain("בערך");
    expect(en[2]).not.toMatch(/\babout\b/);
    expect(he[2]).not.toContain("בערך");
  });
});

describe("S13 topics: the new problem-solving questions have one right answer", () => {
  const find = (level: LevelContent, start: string) => level.q!.find(([en]) => en[0].startsWith(start))!;

  it("Mia's number: 15 is the only number that fits all three clues, and each wrong option breaks one of them", () => {
    const [en, he] = find(problemSolving.b, "Mia is thinking");
    const clue1 = (n: number) => n % 3 === 0;
    const clue2 = (n: number) => n > 10 && n < 20;
    const clue3 = (n: number) => n % 2 === 1;
    const fits = (n: number) => clue1(n) && clue2(n) && clue3(n);
    expect(Array.from({ length: 40 }, (_, i) => i + 1).filter(fits)).toEqual([15]);
    for (const [, answer, wrong] of [en, he]) {
      expect(fits(Number(answer))).toBe(true);
      for (const w of wrong) expect(fits(Number(w)), w).toBe(false);
    }
    expect(he[0]).toContain("רמז 3");
  });

  it("Dan's check: 8 + 5 is 13, and subtracting 5 from his 12 gives 7, not 8", () => {
    const [en, he] = find(problemSolving.b, "Dan says");
    expect(8 + 5).toBe(13);
    expect(12 - 5).toBe(7);
    expect(en[1]).toContain("12 − 5 gives 7");
    expect(he[1]).toContain("12 − 5 נותן 7");
    for (const text of [en[3], he[3]]) expect(text).toContain("13");
    // the wrong options are not valid checks: adding 5 to 12 does not test anything about 8 + 5
    expect(en[2][0]).toContain("12 + 5");
  });

  it("the heights: only one order fits the clues, Ava is above Dana in it, and the wrong statements all fail", () => {
    const [en, he] = find(problemSolving.i, "Ava is taller");
    const heights = [1, 2, 3, 4];
    const orders: number[][] = [];
    const permute = (rest: number[], taken: number[]) => {
      if (!rest.length) { orders.push(taken); return; }
      rest.forEach((v, i) => permute(rest.filter((_, j) => j !== i), [...taken, v]));
    };
    permute(heights, []);
    // [Ava, Ben, Carl, Dana] heights: Ava > Ben, Ben > Carl, Dana < Carl
    const consistent = orders.filter(([a, b, c, d]) => a! > b! && b! > c! && d! < c!);
    expect(consistent).toEqual([[4, 3, 2, 1]]);
    const [a, b, c, d] = consistent[0]!;
    expect(a! > d!).toBe(true);
    expect(d! > b!).toBe(false);
    expect(c! > b!).toBe(false);
    expect(a === c).toBe(false);
    expect(en[1]).toBe("Ava is taller than Dana");
    expect(he[1]).toBe("אווה גבוהה מדנה");
    expect(en[2]).toEqual(["Dana is taller than Ben", "Carl is taller than Ben", "Ava and Carl are the same height"]);
    expect(he[2]).toHaveLength(3);
  });

  it("the matchsticks: a row of n squares needs 3n + 1 sticks, so 5 squares need 16, and the wrong options are the real slips", () => {
    const [en, he] = find(problemSolving.i, "Matchsticks");
    const sticks = (n: number) => 3 * n + 1;
    expect([1, 2, 3].map(sticks)).toEqual([4, 7, 10]);
    for (const [, answer, wrong] of [en, he]) {
      expect(Number(answer)).toBe(sticks(5));
      expect(wrong.map(Number).sort((x, y) => x - y)).toEqual([sticks(4), 3 * 5, 4 * 5]);
    }
  });

  it("the pets: with the fish taken by Ben and the dog refused by Ana, Cal is the only possible owner of the dog", () => {
    const [en, he] = find(problemSolving.a, "Ana, Ben and Cal");
    const pets = ["cat", "dog", "fish"] as const;
    const owners: Record<string, string>[] = [];
    for (const ana of pets) for (const ben of pets) for (const cal of pets) {
      if (new Set([ana, ben, cal]).size === 3 && ben === "fish" && ana !== "dog") owners.push({ ana, ben, cal });
    }
    expect(owners).toEqual([{ ana: "cat", ben: "fish", cal: "dog" }]);
    expect(en[1]).toBe("Cal");
    expect(en[2]).toContain("It cannot be worked out from the clues");
    expect(he[2]).toContain("אי אפשר לדעת לפי הרמזים");
  });

  it("the odd numbers: the first n odd numbers add up to n × n, so the new test case (n = 5) gives 25 and a few cases are not a proof", () => {
    const [en, he] = find(problemSolving.a, "You notice that 1 + 3");
    const sumOdd = (n: number) => Array.from({ length: n }, (_, i) => 2 * i + 1).reduce((x, y) => x + y, 0);
    expect([2, 3, 4].map(sumOdd)).toEqual([4, 9, 16]);
    expect(sumOdd(5)).toBe(25);
    expect(en[3]).toContain("1 + 3 + 5 + 7 + 9 = 25 = 5 × 5");
    expect(he[3]).toContain("1 + 3 + 5 + 7 + 9 = 25 = 5 × 5");
    expect(en[1]).toMatch(/^Test it on a new case/);
    expect(en[2].some((w) => /^Nothing/.test(w))).toBe(true);
  });

  it("Gauss: 50 pairs of 101 make 5,050, and the same pairing works for 1 to 10 (5 pairs of 11 make 55)", () => {
    const sum = (n: number) => (n * (n + 1)) / 2;
    expect(sum(100)).toBe(50 * 101);
    expect(sum(10)).toBe(5 * 11);
    const [en, he] = [problemSolving.a.n![0]![1], problemSolving.a.n![0]![2]];
    expect(en[3]).toContain("1 + 2 + … + 10");
    expect(he[3]).toContain("1 + 2 + … + 10");
  });

  it("the new orderings are in a sensible order: undo from the end and check forwards, simplify first and use the pattern last", () => {
    const [back, hebBack] = problemSolving.i.s![0]!;
    expect(back[1]).toMatch(/^Write down the final result/);
    expect(back[back.length - 1]).toMatch(/^Check by doing the steps forwards/);
    expect(hebBack).toHaveLength(back.length);
    const [simplify, hebSimplify] = problemSolving.a.s![0]!;
    expect(simplify[1]).toMatch(/simpler version/);
    expect(simplify[simplify.length - 1]).toMatch(/^Use the pattern to solve the original problem/);
    expect(simplify[simplify.length - 2]).toMatch(/^Test the pattern/);
    expect(hebSimplify).toHaveLength(simplify.length);
  });
});

describe("S13 topics: spelling and wording fixes", () => {
  it("art is spelled אמנות in every Hebrew text (אומנות means a craft or trade), as in the rest of the library", () => {
    for (const [id, content] of Object.entries(TOPICS)) for (const s of hebrewTexts(content)) expect(s, id).not.toContain("אומנות");
    const art = hebrewTexts(philosophy).filter((s) => s.includes("אמנות"));
    expect(art.length).toBeGreaterThanOrEqual(3);
    expect(hebrewTexts(mindMaps).some((s) => s.includes("שיעורי אמנות"))).toBe(true);
  });

  it("the KWL chart has one Hebrew name in both topics that teach it", () => {
    const name = "טבלת יודע־רוצה לדעת־למדתי";
    expect(mindMaps.a.t!.some(([en, , he]) => en === "KWL chart" && he === name)).toBe(true);
    expect(readingStrategies.i.t!.some(([en, , he]) => en === "KWL chart" && he === name)).toBe(true);
  });

  it("procrastination: the plausible wrong answer is the real misconception (it is a time-management problem), the right one is about feelings", () => {
    const [en, he] = procrastination.a.q!.find(([q]) => q[0].startsWith("Many psychologists"))!;
    expect(en[1]).toMatch(/feelings/);
    expect(en[2][0]).toMatch(/^Managing time/);
    expect(he[2][0]).toMatch(/^בניהול זמן/);
    expect(en[2].some((w) => /feelings/.test(w))).toBe(false);
  });

  it("observation and inference: the 'probably' explanation no longer calls 'yesterday' something you notice with your senses", () => {
    const [en, he] = observation.b.q!.find(([q]) => q[0].startsWith("Which word often shows"))!;
    expect(en[1]).toBe("probably");
    expect(en[3]).toContain("'Yesterday' says when something happened");
    expect(he[3]).toContain("״אתמול״ אומר מתי משהו קרה");
    expect(en[3]).not.toContain("describe what is noticed");
  });

  it("English texts have no Hebrew letters and Hebrew texts are Hebrew", () => {
    for (const [id, content] of Object.entries(TOPICS)) {
      for (const s of englishTexts(content)) expect(/\p{Script=Hebrew}/u.test(s), `${id}: ${s}`).toBe(false);
      for (const s of hebrewTexts(content)) if (/\p{L}/u.test(s.replace(/[A-Za-z]+/g, (w) => (w.length <= 6 ? "" : w)))) expect(/\p{Script=Hebrew}/u.test(s), `${id}: ${s}`).toBe(true);
    }
  });
});
