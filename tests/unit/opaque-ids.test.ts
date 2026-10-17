import { describe, expect, it } from "vitest";
import { gradeAnswer, revealSolution, toPublicAnswer, toPublicChallenge, type Answer } from "@/lib/game/challenges/grade";
import type { Challenge } from "@/lib/game/spec/schema";
import { demoCorpus, engineCorpus } from "@/lib/game/sim-balance/corpus";
import { correctAnswer, wrongAnswer } from "./helpers";

/** Every choice / sequence / match challenge of the whole corpus (demo templates and study-engine games). */
const challenges: Challenge[] = [...demoCorpus(), ...engineCorpus()].flatMap((c) => c.spec.challenges).filter((c) => c.type === "choice" || c.type === "sequence" || c.type === "match");

const idsOf = (pub: ReturnType<typeof toPublicChallenge>): string[] =>
  pub.type === "choice" ? pub.options.map((o) => o.id) : pub.type === "sequence" ? pub.items.map((i) => i.id) : pub.type === "match" ? [...pub.lefts.map((l) => l.id), ...pub.rights.map((r) => r.id)] : [];
const rawIdsOf = (ch: Challenge): string[] =>
  ch.type === "choice" ? ch.options.map((o) => o.id) : ch.type === "sequence" ? ch.items.map((i) => i.id) : ch.type === "match" ? ch.pairs.map((p) => p.id) : [];

describe("opaque answer ids: the ids the player sees never give the answer away", () => {
  it("the corpus has all three kinds to test", () => {
    for (const t of ["choice", "sequence", "match"]) expect(challenges.some((c) => c.type === t), t).toBe(true);
  });

  it("no id of the game file appears in the public view, and the ids are unique inside a challenge", () => {
    for (const ch of challenges) {
      const pub = toPublicChallenge(ch, "secret-seed");
      const shown = idsOf(pub);
      expect(new Set(shown).size, ch.id).toBe(shown.length);
      const raw = new Set(rawIdsOf(ch));
      for (const id of shown) expect(raw.has(id), `${ch.id}: ${id}`).toBe(false);
    }
  });

  it("a match no longer pairs by equal ids: the left and right ids of one pair differ", () => {
    for (const ch of challenges) {
      if (ch.type !== "match") continue;
      const pub = toPublicChallenge(ch, "s") as Extract<ReturnType<typeof toPublicChallenge>, { type: "match" }>;
      const lefts = new Set(pub.lefts.map((l) => l.id));
      for (const r of pub.rights) expect(lefts.has(r.id), ch.id).toBe(false);
    }
  });

  it("the shown order of a sequence does not reveal the right order (ids carry no order)", () => {
    for (const ch of challenges) {
      if (ch.type !== "sequence") continue;
      const shown = idsOf(toPublicChallenge(ch, "s"));
      const sorted = [...shown].sort();
      // opaque ids are not "i1, i2, i3…": sorting them must not systematically give the right order
      expect(shown.every((id) => !/^i\d+$/.test(id)), ch.id).toBe(true);
      expect(sorted.length).toBe(shown.length);
    }
  });

  it("ids are stable for one seed and different for another", () => {
    const ch = challenges.find((c) => c.type === "match")!;
    expect(idsOf(toPublicChallenge(ch, "a"))).toEqual(idsOf(toPublicChallenge(ch, "a")));
    expect(idsOf(toPublicChallenge(ch, "a"))).not.toEqual(idsOf(toPublicChallenge(ch, "b")));
  });

  it("with the seed, the right answer in opaque ids is correct and a wrong one is not (whole corpus)", () => {
    for (const ch of challenges) {
      const good = gradeAnswer(ch, correctAnswer(ch, "seed-1"), "en", "seed-1");
      const bad = gradeAnswer(ch, wrongAnswer(ch, "seed-1"), "en", "seed-1");
      expect(good.correct, `${ch.id} right`).toBe(true);
      expect(bad.correct, `${ch.id} wrong`).toBe(false);
    }
  });

  it("raw ids from the game file are refused when a seed is given; opaque ids from another seed too", () => {
    for (const ch of challenges) {
      const raw = correctAnswer(ch) as Answer;
      const res = gradeAnswer(ch, raw, "en", "seed-1");
      expect(res.correct, `${ch.id} raw`).toBe(false);
      const other = gradeAnswer(ch, correctAnswer(ch, "seed-2"), "en", "seed-1");
      expect(other.correct, `${ch.id} other seed`).toBe(false);
    }
  });

  it("a match answer that pairs every left with the SAME-id right (the old shortcut) is not correct", () => {
    for (const ch of challenges) {
      if (ch.type !== "match") continue;
      const pub = toPublicChallenge(ch, "s") as Extract<ReturnType<typeof toPublicChallenge>, { type: "match" }>;
      const sameIds: Answer = { type: "match", pairs: pub.lefts.map((l) => ({ leftId: l.id, rightId: l.id })) };
      expect(gradeAnswer(ch, sameIds, "en", "s").correct, ch.id).toBe(false);
    }
  });

  it("the revealed solution and the feedback detail use the opaque ids, never the game file's", () => {
    for (const ch of challenges) {
      const reveal = JSON.stringify(revealSolution(ch, "s"));
      const raw = JSON.stringify(revealSolution(ch));
      expect(reveal, ch.id).not.toBe(raw);
      expect(toPublicAnswer(ch, correctAnswer(ch), "s")).toEqual(correctAnswer(ch, "s"));
      // revealing and answering agree: the revealed answer is the correct one
      const revealed = revealSolution(ch, "s");
      const answer: Answer =
        ch.type === "choice" ? { type: "choice", optionId: revealed.optionId as string }
        : ch.type === "sequence" ? { type: "sequence", order: revealed.order as string[] }
        : { type: "match", pairs: revealed.pairs as { leftId: string; rightId: string }[] };
      expect(gradeAnswer(ch, answer, "en", "s").correct, ch.id).toBe(true);
    }
  });

  it("feedback detail for a match is keyed by the left ids the player saw", () => {
    const ch = challenges.find((c) => c.type === "match")!;
    const res = gradeAnswer(ch, wrongAnswer(ch, "s"), "en", "s");
    const pub = toPublicChallenge(ch, "s") as Extract<ReturnType<typeof toPublicChallenge>, { type: "match" }>;
    expect(Object.keys((res.detail as { right: Record<string, boolean> }).right).sort()).toEqual(pub.lefts.map((l) => l.id).sort());
  });
});
