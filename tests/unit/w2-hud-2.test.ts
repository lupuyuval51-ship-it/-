import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { I18nProvider } from "@/components/I18nProvider";
import { ChallengePanel, revealSummary, slotVerdicts, watchBelowFold, type AnswerResult } from "@/components/game/hud/ChallengePanel";
import { markerPath } from "@/components/game/hud/Minimap";
import { revealSolution, toPublicChallenge, type PublicChallenge } from "@/lib/game/challenges/grade";
import type { Challenge } from "@/lib/game/spec/schema";
import { DICTIONARIES, makeT, type Locale } from "@/lib/i18n";

/**
 * The challenge panel and the mini-map: a revealed matching solution, maths in a revealed solution, the verdict of a
 * reordered sequence, the scroll cue after the verdict appears, and the mini-map on a browser without `roundRect`.
 */

const SEED = "session-seed-1";
const en = makeT(DICTIONARIES.en);

const base = { title: "T", prompt: "p", concept: "c", level: 1, points: 100, hint: "h", explanation: "an explanation" };
const matchCh = {
  ...base, id: "m1", type: "match",
  pairs: [{ id: "p1", left: "Cat", right: "Meows" }, { id: "p2", left: "Dog", right: "Barks" }, { id: "p3", left: "Cow", right: "Moos" }],
} as unknown as Challenge;

describe("a revealed solution, as the server or the offline backend sends it", () => {
  it("a matching solution names the right answer of every term (left and right carry different opaque ids)", () => {
    const pub = toPublicChallenge(matchCh, SEED);
    if (pub.type !== "match") throw new Error("not a match");
    expect(pub.lefts.every((l) => pub.rights.every((r) => r.id !== l.id))).toBe(true);
    // before: every line was "Cat: " with nothing after the colon
    expect(revealSummary(pub, revealSolution(matchCh, SEED), en)).toBe("Cat: Meows\nDog: Barks\nCow: Moos");
  });

  it("choice and sequence solutions still read their opaque ids", () => {
    const choice = { ...base, id: "c1", type: "choice", correctOptionId: "b", options: [{ id: "a", text: "Two", feedback: "f" }, { id: "b", text: "Four", feedback: "f" }, { id: "c", text: "Six", feedback: "f" }] } as unknown as Challenge;
    expect(revealSummary(toPublicChallenge(choice, SEED), revealSolution(choice, SEED), en)).toBe("Four");
    const seq = { ...base, id: "s1", type: "sequence", items: [{ id: "a", text: "First" }, { id: "b", text: "Second" }, { id: "c", text: "Third" }] } as unknown as Challenge;
    expect(revealSummary(toPublicChallenge(seq, SEED), revealSolution(seq, SEED), en)).toBe("1. First\n2. Second\n3. Third");
  });

  it("a reveal without pairs (or with a broken entry) prints the term with an empty answer instead of throwing", () => {
    const pub = toPublicChallenge(matchCh, SEED);
    expect(revealSummary(pub, {}, en)).toBe("Cat: \nDog: \nCow: ");
    expect(revealSummary(pub, { pairs: [null, 3] }, en)).toBe("Cat: \nDog: \nCow: ");
  });

  const render = (challenge: PublicChallenge, result: AnswerResult, locale: Locale) =>
    renderToStaticMarkup(h(I18nProvider, { locale, dict: DICTIONARIES[locale], children: h(ChallengePanel, { challenge, stationLabel: "S", result, hint: null, busy: false, onSubmit: () => undefined, onHint: () => undefined, onClose: () => undefined }) }));
  const revealedBox = (html: string, locale: Locale) => html.slice(html.indexOf(DICTIONARIES[locale]["challenge.revealed"]));

  it("maths inside a Hebrew line of the revealed solution is drawn left to right, line by line", () => {
    const challenge: PublicChallenge = { id: "c", title: "שברים", prompt: "איזה שבר שווה?", concept: "שברים", level: 1, hasHint: false, type: "choice", options: [{ id: "o1", text: "כי 1/3 = 3/9" }, { id: "o2", text: "כי 1/2 = 3/9" }] };
    const result: AnswerResult = { correct: false, feedback: "לא", resolved: true, revealed: true, pointsAwarded: 0, attemptsLeft: 0, reveal: { optionId: "o1" } };
    const box = revealedBox(render(challenge, result, "he"), "he");
    expect(box).toContain('<bdi dir="ltr">1/3 = 3/9</bdi>');
    // a multi-line solution keeps its line breaks, and every line is isolated on its own
    const seq: PublicChallenge = { id: "s", title: "סדר", prompt: "p", concept: "c", level: 1, hasHint: false, type: "sequence", items: [{ id: "i1", text: "מחסרים 2: 3x = 12" }, { id: "i2", text: "מחלקים ב־3: x = 4" }] };
    const seqBox = revealedBox(render(seq, { ...result, reveal: { order: ["i1", "i2"] } }, "he"), "he");
    expect(seqBox).toContain('<bdi dir="ltr">3x = 12</bdi>');
    expect(seqBox).toContain('<bdi dir="ltr">x = 4</bdi>');
    expect(seqBox).toMatch(/12<\/bdi>\n<bdi dir="ltr">2<\/bdi>\. מחלקים/);
  });

  it("English solutions are unchanged (no isolation added to prose)", () => {
    const challenge: PublicChallenge = { id: "c", title: "Pick", prompt: "Which?", concept: "c", level: 1, hasHint: false, type: "choice", options: [{ id: "o1", text: "Because cats meow" }, { id: "o2", text: "No" }] };
    const result: AnswerResult = { correct: false, feedback: "No", resolved: true, revealed: true, pointsAwarded: 0, attemptsLeft: 0, reveal: { optionId: "o1" } };
    const box = revealedBox(render(challenge, result, "en"), "en");
    expect(box).toMatch(/<pre[^>]*>Because cats meow<\/pre>/);
  });
});

describe("the verdict of a sequence after the player starts reordering", () => {
  it("a slot keeps its verdict only while it still holds the item that was graded there", () => {
    const graded = ["a", "b", "c", "d"];
    const inPlace = [false, true, true, false];
    // unchanged: every slot keeps its verdict
    expect(slotVerdicts(graded, graded, inPlace)).toEqual([false, true, true, false]);
    // "a" taken out: "b" moves to slot 1 and used to be painted red (slot 1's verdict was about "a"); now it has none
    expect(slotVerdicts(["b", "c", "d"], graded, inPlace)).toEqual([undefined, undefined, undefined]);
    // the last item taken out: the first three slots still hold what was graded there
    expect(slotVerdicts(["a", "b", "c"], graded, inPlace)).toEqual([false, true, true]);
    // nothing graded yet, or no per-slot detail
    expect(slotVerdicts(["a", "b"], [], [])).toEqual([undefined, undefined]);
    expect(slotVerdicts(["a", "b"], ["a", "b"], [])).toEqual([undefined, undefined]);
  });
});

describe("the scroll cue follows what is added below the fold", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("watches the answer column too, so the verdict appearing under the last option shows the cue", () => {
    const observed: unknown[] = [];
    let fire = () => undefined as void;
    vi.stubGlobal("ResizeObserver", class {
      constructor(cb: () => void) { fire = cb; }
      observe(el: unknown) { observed.push(el); }
      disconnect() { observed.length = 0; }
    });
    const winListeners = new Map<string, unknown>();
    vi.stubGlobal("window", { addEventListener: (k: string, f: unknown) => winListeners.set(k, f), removeEventListener: (k: string) => winListeners.delete(k) });
    const question = { id: "question" }, answer = { id: "answer" };
    const listeners = new Map<string, unknown>();
    // scrolled to the bottom: nothing is hidden yet
    const body = {
      scrollTop: 300, clientHeight: 400, scrollHeight: 700, children: [question, answer],
      addEventListener: (k: string, f: unknown) => listeners.set(k, f), removeEventListener: (k: string) => listeners.delete(k),
    };
    const seen: boolean[] = [];
    const stop = watchBelowFold(body as unknown as HTMLElement, (b) => seen.push(b));
    expect(seen).toEqual([false]);
    expect(observed).toEqual([body, question, answer]);
    // the result box is added to the answer column: the body keeps its size, its content grows
    body.scrollHeight = 900;
    fire();
    expect(seen.at(-1)).toBe(true);
    stop();
    expect(listeners.size).toBe(0);
    expect(winListeners.size).toBe(0);
    expect(observed).toEqual([]);
  });

  it("works without ResizeObserver (scroll and resize only)", () => {
    vi.stubGlobal("ResizeObserver", undefined);
    vi.stubGlobal("window", { addEventListener: () => undefined, removeEventListener: () => undefined });
    const body = { scrollTop: 0, clientHeight: 400, scrollHeight: 900, children: [], addEventListener: () => undefined, removeEventListener: () => undefined };
    const seen: boolean[] = [];
    watchBelowFold(body as unknown as HTMLElement, (b) => seen.push(b))();
    expect(seen).toEqual([true]);
  });
});

describe("mini-map markers", () => {
  const ctx = () => ({ calls: [] as string[], rect(..._a: number[]) { this.calls.push("rect"); }, roundRect(..._a: number[]) { this.calls.push("roundRect"); } });

  it("are rounded where the browser can, and square instead of missing where it cannot (older WebView / Safari 15)", () => {
    const modern = ctx();
    markerPath(modern as unknown as CanvasRenderingContext2D, 0, 0, 8, 8, 2);
    expect(modern.calls).toEqual(["roundRect"]);
    const old = ctx() as Partial<ReturnType<typeof ctx>>;
    delete (old as { roundRect?: unknown }).roundRect;
    expect(() => markerPath(old as unknown as CanvasRenderingContext2D, 0, 0, 8, 8, 2)).not.toThrow();
    expect(old.calls).toEqual(["rect"]);
  });
});
