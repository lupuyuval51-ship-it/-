import { describe, expect, it } from "vitest";
import type { LevelContent, TopicContent } from "@/lib/game/topics/types";
import singingVoice from "@/lib/game/topics/content/arts-singing-voice";
import songwriting from "@/lib/game/topics/content/arts-songwriting";
import soundRecording from "@/lib/game/topics/content/arts-sound-recording";
import theatre from "@/lib/game/topics/content/arts-theatre";
import courts from "@/lib/game/topics/content/civics-courts";
import democracy from "@/lib/game/topics/content/civics-democracy";
import humanRights from "@/lib/game/topics/content/civics-human-rights";
import israelGovernment from "@/lib/game/topics/content/civics-israel-government";

/**
 * Topics arts-singing-voice … civics-israel-government (original library and Plus/Pro collection alike) held to the
 * collection's quality bar (scripts/check-topics.ts): enough items per level, real explanations, the right answer not given
 * away by being the longest option, no mirrored < or > in Hebrew — plus the content fixes made to them.
 */
const TOPICS: Record<string, TopicContent> = {
  "arts-singing-voice": singingVoice,
  "arts-songwriting": songwriting,
  "arts-sound-recording": soundRecording,
  "arts-theatre": theatre,
  "civics-courts": courts,
  "civics-democracy": democracy,
  "civics-human-rights": humanRights,
  "civics-israel-government": israelGovernment,
};
const LEVELS = ["b", "i", "a"] as const;
const hebrewTexts = (lv: LevelContent): string[] => [
  ...(lv.t ?? []).map((t) => t[3]),
  ...(lv.q ?? []).flatMap(([, he]) => [he[0], he[1], ...he[2], he[3]]),
  ...(lv.n ?? []).flatMap(([, , he]) => [he[0], he[2]]),
  ...(lv.s ?? []).flatMap(([, he]) => he),
];
const question = (c: TopicContent, answer: string) => LEVELS.flatMap((l) => c[l].q ?? []).find(([en]) => en[1] === answer);

describe.each(Object.entries(TOPICS))("%s", (_id, c) => {
  it.each(LEVELS)("level %s has 8+ items, 4+ of them questions, numbers or orderings", (l) => {
    const lv = c[l];
    const items = (lv.q?.length ?? 0) + (lv.n?.length ?? 0) + (lv.s?.length ?? 0);
    expect(items).toBeGreaterThanOrEqual(4);
    expect((lv.t?.length ?? 0) + items).toBeGreaterThanOrEqual(8);
  });

  it("explains every answer in 40+ characters, and every numeric explanation shows the answer", () => {
    for (const l of LEVELS) {
      for (const pair of c[l].q ?? []) for (const [q, , , explanation] of pair) expect(explanation.length, q).toBeGreaterThanOrEqual(40);
      for (const [answer, en, he] of c[l].n ?? []) {
        for (const text of [en[2], he[2]]) {
          expect(text.length, en[0]).toBeGreaterThanOrEqual(40);
          expect([String(answer), answer.toLocaleString("en-US")].some((w) => text.includes(w)), en[0]).toBe(true);
        }
      }
    }
  });

  it("does not make the right answer the longest option in more than 40 % of the questions", () => {
    for (const lang of [0, 1] as const) {
      const qs = LEVELS.flatMap((l) => c[l].q ?? []).map((p) => p[lang]);
      const longest = qs.filter(([, a, w]) => a.length > Math.max(...w.map((x) => x.length))).length;
      expect(longest / qs.length, lang ? "he" : "en").toBeLessThanOrEqual(0.4);
    }
  });

  it("gives every question the same number of wrong options in both languages, and never repeats an option", () => {
    for (const l of LEVELS) {
      for (const [en, he] of c[l].q ?? []) {
        expect(en[2].length, en[0]).toBe(he[2].length);
        for (const [, a, w] of [en, he]) expect(new Set([a, ...w]).size, en[0]).toBe(w.length + 1);
      }
    }
  });

  it("never uses < or > in Hebrew text", () => {
    for (const l of LEVELS) for (const s of hebrewTexts(c[l])) expect(/[<>]/.test(s), s).toBe(false);
  });
});

describe("content fixes", () => {
  it("the witness question's wrong options have the same grammatical form as the answer, so the form does not give it away", () => {
    const q = question(courts, "Tell the truth")!;
    for (const w of q[0][2]) expect(w, w).not.toMatch(/^To /);
  });

  it("the court-levels number question does not list the three levels it asks the learner to count", () => {
    const levels = (courts.b.n ?? []).find(([answer]) => answer === 3)!;
    expect(levels[1][0]).not.toMatch(/magistrates'.*district.*Supreme/i);
    expect(levels[2][0]).not.toMatch(/השלום.*המחוזיים.*העליון/);
    expect(levels[1][2]).toMatch(/magistrates' courts.*district courts.*Supreme Court/);
  });

  it("Human Rights Day is not the only two-digit date, so its length does not give it away", () => {
    const q = question(humanRights, "10 December")!;
    expect(q[0][2]).toEqual(expect.arrayContaining(["24 October", "21 September"]));
    expect(q[1][2]).toEqual(expect.arrayContaining(["24 באוקטובר", "21 בספטמבר"]));
  });

  it("a child under the Convention on the Rights of the Child is anyone below 18 (Article 1)", () => {
    expect((humanRights.i.n ?? []).map(([answer]) => answer)).toContain(18);
  });

  it("the Knesset is elected for four years and the President by the Knesset, not by the citizens", () => {
    expect((israelGovernment.b.n ?? []).map(([answer]) => answer)).toContain(4);
    const president = question(israelGovernment, "The Knesset, in a secret vote")!;
    expect(president[0][3]).toMatch(/single seven-year term/);
    expect(president[1][3]).toMatch(/כהונה אחת של שבע שנים/);
  });

  it("coalition arithmetic: 120 seats minus a 64-seat coalition leaves 56 for the opposition", () => {
    const n = (israelGovernment.i.n ?? []).find(([answer]) => answer === 56)!;
    expect(120 - 64).toBe(n[0]);
  });

  it("the Globe question offers real London theatres instead of the Sydney Opera House", () => {
    const q = question(theatre, "The Globe")!;
    expect(q[0][2]).toEqual(expect.arrayContaining(["The Rose", "The Old Vic"]));
    expect(q[0][2]).not.toContain("The Sydney Opera House");
  });

  it("Aristotle's tragedy question offers comedy's joy and laughter as the tempting wrong answer", () => {
    const q = question(theatre, "Pity and fear")!;
    expect(q[0][2][0]).toBe("Joy and laughter");
    expect(q[1][2][0]).toBe("שמחה וצחוק");
  });

  it("the phonautograph explanation says it worked without electricity, so that distractor is explained", () => {
    const q = question(soundRecording, "Play the recorded sound back")!;
    expect(q[0][3]).toMatch(/no electricity/);
    expect(q[1][3]).toMatch(/לא נזקק לחשמל/);
  });
});
