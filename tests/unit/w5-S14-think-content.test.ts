import { describe, expect, it } from "vitest";
import type { LevelContent, NumberItem, TopicContent } from "@/lib/game/topics/types";
import resilience from "@/lib/game/topics/content/think-resilience";
import rootCause from "@/lib/game/topics/content/think-root-cause";
import scientificMethod from "@/lib/game/topics/content/think-scientific-method";
import selfControl from "@/lib/game/topics/content/think-self-control";
import sixHats from "@/lib/game/topics/content/think-six-hats";
import strategyGames from "@/lib/game/topics/content/think-strategy-games";
import studySkills from "@/lib/game/topics/content/think-study-skills";
import teamwork from "@/lib/game/topics/content/think-teamwork";
import testTaking from "@/lib/game/topics/content/think-test-taking";
import timeManagement from "@/lib/game/topics/content/think-time-management";

/**
 * Ten thinking-skills topics (resilience, root cause, the scientific method, self-control, the six hats, strategy games,
 * how to study well, teamwork, test taking, time management). Before this wave the right answer was the longest option in
 * 92 % (scientific method), 93 and 100 % (teamwork), 100 % (study skills) and 67 and 83 % (time management) of the
 * questions; "how to study well" and "time management" had only two or three questions a level (six or seven pieces,
 * under the collection's bar of eight), two numeric explanations were shorter than 40 characters ("3 שעות = 180 דקות,
 * ו־180 ÷ 30 = 6 ימים."), and the beginner number of "root cause" asked how many times "the 5 Whys" suggests asking why.
 * The numbers the questions state, and the winning and losing positions of the take-away games, are checked by calculating
 * them.
 */
const TOPICS: Record<string, TopicContent> = {
  "think-resilience": resilience,
  "think-root-cause": rootCause,
  "think-scientific-method": scientificMethod,
  "think-self-control": selfControl,
  "think-six-hats": sixHats,
  "think-strategy-games": strategyGames,
  "think-study-skills": studySkills,
  "think-teamwork": teamwork,
  "think-test-taking": testTaking,
  "think-time-management": timeManagement,
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
const numbers = (c: TopicContent) => LEVELS.map((l) => c[l].n?.map(([answer]) => answer) ?? []);
const numberItem = (c: TopicContent, l: (typeof LEVELS)[number], text: string): NumberItem => {
  const item = (c[l].n ?? []).find(([, en]) => en[0].includes(text));
  if (!item) throw new Error(`no number "${text}" at ${l}`);
  return item;
};

describe("S14 topics: answer length is not a tell", () => {
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

describe("S14 topics: the collection's quality bar", () => {
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

    it(`${id}: the options are shuffled, so no explanation may point at one by its place`, () => {
      const explanations = [
        ...questions(content).flatMap(([[, , , e, h]]) => [e, ...(h ? [h] : [])]),
        ...levelsOf(content).flatMap((lv) => (lv.n ?? []).flatMap(([, [, , e, h]]) => [e, ...(h ? [h] : [])])),
      ];
      expect(explanations.length, id).toBeGreaterThan(10);
      for (const s of explanations) expect(s, `${id}: ${s}`).not.toMatch(/\b(first|second|third|fourth|last) wrong (option|answer)\b|\bthe (first|second|third) option\b/i);
    });
  }
});

describe("S14 topics: study skills and time management are no longer thin", () => {
  it("have at least four questions at every level, a number or an ordering to vary the game, and a lesson in every kind of item", () => {
    for (const [id, c] of [["think-study-skills", studySkills], ["think-time-management", timeManagement]] as const) {
      for (const l of LEVELS) {
        expect(c[l].q?.length ?? 0, `${id}/${l} questions`).toBeGreaterThanOrEqual(4);
        expect((c[l].n?.length ?? 0) + (c[l].s?.length ?? 0), `${id}/${l} numbers and orderings`).toBeGreaterThanOrEqual(1);
      }
      expect(questions(c).length, id).toBeGreaterThanOrEqual(15);
    }
  });

  it("every level of both topics has an ordering of its own steps, he and en with the same number of steps", () => {
    expect(studySkills.b.s?.length).toBe(1);
    expect(studySkills.i.s?.length).toBe(1);
    expect(studySkills.a.s?.length).toBe(1);
    expect(timeManagement.b.s?.length).toBe(1);
    expect(timeManagement.i.s?.length).toBe(1);
    expect(timeManagement.a.s?.length).toBe(1);
  });

  it("the two number explanations that were too short (45 minutes, 6 days) now show the working", () => {
    for (const [, en, he] of [numberItem(timeManagement, "b", "16:15"), numberItem(timeManagement, "i", "3 hours in total")]) {
      expect(en[2].length).toBeGreaterThanOrEqual(40);
      expect(he[2].length).toBeGreaterThanOrEqual(40);
    }
  });
});

describe("S14 topics: root cause no longer asks how many times the 5 Whys asks why", () => {
  it("the beginner number is the cost of pumping a leaking tyre again and again", () => {
    const [answer, en, he] = rootCause.b.n![0]!;
    expect(en[0]).not.toMatch(/5 Whys/);
    expect(he[0]).not.toMatch(/חמשת הלמה/);
    expect(answer).toBe(3 * 10);
    expect(en[0]).toContain("10 minutes");
    expect(en[0]).toContain("3 times a week");
  });
});

describe("S14 topics: every number is the arithmetic of its own question", () => {
  it("resilience, root cause and self-control", () => {
    expect(numbers(resilience)).toEqual([[7 * 15], [5 * (4 + 6)], []]);
    expect(numbers(rootCause)).toEqual([[3 * 10], [24 / 12], [300 / 50]]);
    expect(numbers(selfControl)).toEqual([[3 - 1], [150 / 10], [(32 - 20) / 4]]);
  });

  it("scientific method, six hats, teamwork and test taking", () => {
    expect(numbers(scientificMethod)).toEqual([[], [(4 + 5 + 6) / 3], [(40 / 200) * 100]]);
    expect(numbers(sixHats)).toEqual([[6 * 5], [], [(40 - 5 - 5) / 5]]);
    expect(numbers(teamwork)).toEqual([[], [], [(5 * 4) / 2]]);
    expect(numbers(testTaking)).toEqual([[60 / 20], [(1 / 2) * 100], [(25 * (90 - 10)) / 100]]);
  });

  it("study skills and time management", () => {
    expect(numbers(studySkills)).toEqual([[3 * 20 + 2 * 5], [1 + 2 + 4], []]);
    expect(numbers(timeManagement)).toEqual([
      [17 * 60 - (16 * 60 + 15), 25 + 15],
      [(3 * 60) / 30, (4 * 45) / 60],
      [4 * 25 + 3 * 5, 120 * 1.5],
    ]);
  });

  it("the facts the time-management numbers state are as the questions say", () => {
    expect(numberItem(timeManagement, "a", "50% longer")[1][2]).toContain("120 + 60 = 180");
    expect(numberItem(timeManagement, "b", "School starts at 8:00")[1][2]).toContain("7:20");
    expect(numberItem(studySkills, "i", "twice as long")[1][2]).toContain("1 + 2 + 4 = 7");
  });
});

/** The take-away games of the strategy topic, solved by brute force: the player to move wins when a move leaves a lost position. */
function playerToMoveWins(max: number, moves: number[], misere: boolean): boolean[] {
  const win: boolean[] = [];
  for (let n = 0; n <= max; n++) win[n] = n === 0 ? misere : moves.some((m) => m <= n && !win[n - m]);
  return win;
}
const lostOf = (win: boolean[]) => win.map((w, n) => (w ? -1 : n)).filter((n) => n >= 0);
const winningMoves = (n: number, moves: number[], misere: boolean) => moves.filter((m) => m <= n && !playerToMoveWins(n, moves, misere)[n - m]);

describe("S14 topics: the strategy-game answers are the game-theory truth", () => {
  it("take 1, 2 or 3 (the last counter wins): 4 is lost, the multiples of 4 are the lost positions, from 10 take 2", () => {
    const win = playerToMoveWins(40, [1, 2, 3], false);
    expect(win[4]).toBe(false);
    expect(lostOf(win)).toEqual(Array.from({ length: 11 }, (_, i) => i * 4));
    expect(winningMoves(10, [1, 2, 3], false)).toEqual([2]);
    expect(strategyGames.i.q![1]![0][1]).toBe("2");
  });

  it("take 1 or 2 (the last counter wins): the multiples of 3 are lost; from 7 take 1", () => {
    expect(lostOf(playerToMoveWins(30, [1, 2], false))).toEqual(Array.from({ length: 11 }, (_, i) => i * 3));
    expect(winningMoves(7, [1, 2], false)).toEqual([1]);
    expect(numbers(strategyGames)[1]).toEqual([1]);
  });

  it("take 1 to 4 (the last counter wins): the multiples of 5 are lost; from 23 take 3", () => {
    expect(lostOf(playerToMoveWins(40, [1, 2, 3, 4], false))).toEqual(Array.from({ length: 9 }, (_, i) => i * 5));
    expect(winningMoves(23, [1, 2, 3, 4], false)).toEqual([3]);
    expect(numbers(strategyGames)[2]![1]).toBe(3);
  });

  it("take 1, 2 or 3 and the last counter LOSES: the lost positions are 1, 5, 9, 13 and so on", () => {
    const lost = lostOf(playerToMoveWins(40, [1, 2, 3], true)).filter((n) => n > 0);
    expect(lost.every((n) => n % 4 === 1)).toBe(true);
    expect(lost.slice(0, 4)).toEqual([1, 5, 9, 13]);
  });

  it("the nim-sums of the questions: 3, 4, 5 gives 2 and 1, 2, 3 gives 0", () => {
    const nimSum = (piles: number[]) => piles.reduce((a, b) => a ^ b, 0);
    expect(nimSum([3, 4, 5])).toBe(2);
    expect(numbers(strategyGames)[2]![0]).toBe(2);
    expect(nimSum([1, 2, 3])).toBe(0);
    expect(numbers(strategyGames)[0]).toEqual([3 + 3 + 2]);
  });
});

describe("S14 topics: the misconceptions that were hidden by short wrong options are now real options", () => {
  it("the scientific method's first questions no longer give the answer away by length", () => {
    for (const q of [scientificMethod.b.q![0]!, scientificMethod.b.q![1]!, scientificMethod.i.q![0]!, scientificMethod.i.q![1]!, scientificMethod.i.q![3]!]) {
      for (const [, answer, wrong] of q) expect(answer.length > Math.max(...wrong.map((w) => w.length)), answer).toBe(false);
    }
  });

  it("teamwork's first questions name real mistakes (a confident person doing it all, a loud voice deciding, a harsh comment)", () => {
    const wrongs = [teamwork.b.q![0]![0][2], teamwork.b.q![1]![0][2], teamwork.b.q![2]![0][2]].flat().join(" | ");
    expect(wrongs).toMatch(/confident student does most of it/);
    expect(wrongs).toMatch(/speaks loudest/);
    expect(wrongs).toMatch(/mess/);
  });

  it("a topic for ages 8 and up gives a card game for children (Uno), not poker, as its example of hidden information", () => {
    const text = JSON.stringify(strategyGames);
    expect(text).not.toMatch(/poker|פוקר/i);
    expect(text).toMatch(/Uno/);
  });

  it("the Hebrew volcano text says the magma flows out 'as lava' without a word that reads as 'a female dog'", () => {
    expect(JSON.stringify(studySkills)).not.toContain("כלבה");
  });

  it("the Hebrew and English recycling-bin options agree about wasps and bees", () => {
    const [en, he] = sixHats.i.q![2]!;
    expect(en[2].join(" ")).toMatch(/wasps and bees/);
    expect(he[2].join(" ")).toMatch(/צרעות ודבורים/);
  });
});
