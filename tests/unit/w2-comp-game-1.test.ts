import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GameAudio } from "@/components/game/audio";
import { NOISE_SECONDS, noiseOffset } from "@/components/game/audioModel";

/**
 * Robustness of the synthesised game audio: a stalled main thread, a page restored from the back/forward cache, a
 * browser that refuses a voice, the noise bursts and the music switching areas. A small WebAudio stand-in records
 * when every voice starts and how long a noise burst has left in its buffer.
 */
class FakeParam {
  value = 0;
  setValueAtTime(v: number) { this.value = v; }
  exponentialRampToValueAtTime() {}
  cancelScheduledValues() {}
  setTargetAtTime() {}
}
class FakeNode {
  connect<T>(n: T): T { return n; }
}
interface Log { voices: { at: number; now: number }[]; noise: { left: number; needed: number }[]; closes: number }
function makeCtx(log: Log, opts: { failOscillator?: () => boolean; closeRejects?: boolean } = {}) {
  return class Ctx {
    currentTime = 0;
    state = "running";
    sampleRate = 8000;
    destination = new FakeNode();
    resume() { this.state = "running"; return Promise.resolve(); }
    suspend() { this.state = "suspended"; return Promise.resolve(); }
    close() { log.closes++; return opts.closeRejects ? Promise.reject(new Error("InvalidStateError")) : Promise.resolve(); }
    createGain() { return Object.assign(new FakeNode(), { gain: new FakeParam() }); }
    createDynamicsCompressor() { return Object.assign(new FakeNode(), { threshold: new FakeParam(), ratio: new FakeParam() }); }
    createBiquadFilter() { return Object.assign(new FakeNode(), { type: "lowpass", frequency: new FakeParam() }); }
    createOscillator() {
      if (opts.failOscillator?.()) throw new Error("NotSupportedError");
      return Object.assign(new FakeNode(), { type: "sine", frequency: new FakeParam(), start: (at: number) => { log.voices.push({ at, now: this.currentTime }); }, stop() {} });
    }
    createBuffer(_c: number, len: number) { return { getChannelData: () => new Float32Array(len) }; }
    createBufferSource() {
      let from = 0, offset = 0;
      return Object.assign(new FakeNode(), {
        buffer: null,
        start(at: number, off = 0) { from = at; offset = off; },
        stop(at: number) { log.noise.push({ left: NOISE_SECONDS - offset, needed: at - from }); },
      });
    }
  };
}

type Listener = () => void;
function fakePage() {
  const doc: Record<string, Listener[]> = {};
  const win: Record<string, Listener[]> = {};
  const document = {
    visibilityState: "visible" as "visible" | "hidden",
    addEventListener: (n: string, f: Listener) => { (doc[n] ??= []).push(f); },
    removeEventListener: (n: string, f: Listener) => { doc[n] = (doc[n] ?? []).filter((g) => g !== f); },
  };
  const fire = (target: Record<string, Listener[]>, n: string) => { for (const f of [...(target[n] ?? [])]) f(); };
  return { document, doc, win, fireDoc: (n: string) => fire(doc, n), fireWin: (n: string) => fire(win, n) };
}

const ctxOf = (a: GameAudio) => (a as unknown as { ctx: { currentTime: number } }).ctx;
const g = globalThis as unknown as { window?: unknown; document?: unknown };

describe("game audio robustness", () => {
  let log: Log;
  beforeEach(() => {
    vi.useFakeTimers();
    log = { voices: [], noise: [], closes: 0 };
  });
  afterEach(() => {
    vi.useRealTimers();
    delete g.window;
    delete g.document;
  });

  it("a stalled main thread (a new area being built) never makes the music play a pile of late notes at once", () => {
    g.window = { AudioContext: makeCtx(log) };
    const audio = new GameAudio();
    audio.setMusic(true);
    audio.unlock();
    const ctx = ctxOf(audio);
    for (let i = 0; i < 20; i++) { ctx.currentTime += 0.07; vi.advanceTimersByTime(70); }
    log.voices.length = 0;
    ctx.currentTime += 2; // two seconds without a timer tick, the audio clock kept running
    vi.advanceTimersByTime(70);
    expect(log.voices.length).toBeGreaterThan(0); // the music goes on
    for (const v of log.voices) expect(v.at).toBeGreaterThanOrEqual(v.now); // ... from now, not from two seconds ago
    audio.dispose();
  });

  it("a page restored from the back/forward cache plays sound again", () => {
    const page = fakePage();
    g.document = page.document;
    g.window = {
      AudioContext: makeCtx(log),
      addEventListener: (n: string, f: Listener) => { (page.win[n] ??= []).push(f); },
      removeEventListener: (n: string, f: Listener) => { page.win[n] = (page.win[n] ?? []).filter((x) => x !== f); },
    };
    const audio = new GameAudio();
    audio.unlock();
    const ctx = ctxOf(audio);
    page.fireWin("pagehide"); // some browsers hide the page without a visibilitychange
    ctx.currentTime += 1;
    audio.play("jump");
    expect(log.voices.length).toBe(0);
    page.fireWin("pageshow"); // ... and show it again without one
    ctx.currentTime += 1;
    audio.play("jump");
    expect(log.voices.length).toBeGreaterThan(0);
    audio.dispose();
    expect(page.win.pageshow ?? []).toHaveLength(0);
    expect(page.win.pagehide ?? []).toHaveLength(0);
    expect(page.doc.visibilitychange ?? []).toHaveLength(0);
  });

  it("a browser that refuses a voice never breaks the game code that asked for the sound", () => {
    let fail = true;
    g.window = { AudioContext: makeCtx(log, { failOscillator: () => fail }) };
    const audio = new GameAudio();
    audio.setMusic(true);
    audio.unlock();
    const ctx = ctxOf(audio);
    expect(() => audio.play("collect")).not.toThrow();
    expect(() => audio.playEvent({ type: "answer", correct: true, streak: 6 })).not.toThrow();
    expect(() => { for (let i = 0; i < 10; i++) { ctx.currentTime += 0.07; vi.advanceTimersByTime(70); } }).not.toThrow();
    fail = false;
    log.voices.length = 0;
    ctx.currentTime += 0.07;
    vi.advanceTimersByTime(70);
    // the music did not get stuck retrying the failed step: it keeps going from now
    for (let i = 0; i < 20; i++) { ctx.currentTime += 0.07; vi.advanceTimersByTime(70); }
    expect(log.voices.length).toBeGreaterThan(0);
    audio.dispose();
  });

  it("closing the audio never leaves an unhandled rejection and works without close()", async () => {
    const onUnhandled = vi.fn();
    process.on("unhandledRejection", onUnhandled);
    try {
      g.window = { AudioContext: makeCtx(log, { closeRejects: true }) };
      const audio = new GameAudio();
      audio.unlock();
      expect(() => audio.dispose()).not.toThrow();
      expect(log.closes).toBe(1);
      const Old = makeCtx(log);
      (Old.prototype as unknown as { close?: unknown }).close = undefined; // an old WebKit context
      g.window = { AudioContext: Old };
      const old = new GameAudio();
      old.unlock();
      expect(() => old.dispose()).not.toThrow();
      vi.useRealTimers();
      await new Promise((r) => setTimeout(r, 10));
      expect(onUnhandled).not.toHaveBeenCalled();
    } finally {
      process.off("unhandledRejection", onUnhandled);
    }
  });

  it("noise bursts always have enough noise left in the buffer for their whole length", () => {
    for (const dur of [0.03, 0.05, 0.09, 0.35, 0.4, 0.55, 0.7, 0.9]) {
      for (const r of [0, 0.25, 0.5, 0.999]) {
        const off = noiseOffset(dur, r);
        expect(off).toBeGreaterThanOrEqual(0);
        expect(off + dur + 0.05).toBeLessThanOrEqual(NOISE_SECONDS + 1e-9);
      }
    }
    expect(noiseOffset(0.05, 0.999)).toBeGreaterThan(0.4); // short sounds still start at a random place
    expect(noiseOffset(5, 0.5)).toBe(0); // longer than the buffer: from the start
    expect(noiseOffset(0.1, Number.NaN)).toBe(0);

    // and the synth uses it: the portal swoosh, the victory shimmer and the rest are never cut off mid-sound
    g.window = { AudioContext: makeCtx(log) };
    const audio = new GameAudio();
    audio.unlock();
    const ctx = ctxOf(audio);
    const random = vi.spyOn(Math, "random").mockReturnValue(0.999);
    try {
      for (const s of ["portal", "victory", "gate", "areaEnter", "fall", "mission", "correct", "step"] as const) { ctx.currentTime += 4; audio.play(s); }
    } finally {
      random.mockRestore();
    }
    expect(log.noise.length).toBeGreaterThan(5);
    for (const n of log.noise) expect(n.needed).toBeLessThanOrEqual(n.left + 1e-9);
    audio.dispose();
  });

  it("a new area's music starts on the next bar, from the first chord, never in the middle of a bar", () => {
    g.window = { AudioContext: makeCtx(log) };
    const audio = new GameAudio();
    const steps: { beat: number; bpm: number }[] = [];
    const inner = audio as unknown as { scheduleStep: (beat: number, t: number) => void; mood: { bpm: number } };
    const orig = inner.scheduleStep.bind(audio);
    inner.scheduleStep = (beat, t) => { steps.push({ beat, bpm: inner.mood.bpm }); orig(beat, t); };
    audio.setTheme("neon-city");
    audio.setMusic(true);
    audio.unlock();
    const ctx = ctxOf(audio);
    const tick = (n: number) => { for (let i = 0; i < n; i++) { ctx.currentTime += 0.07; vi.advanceTimersByTime(70); } };
    tick(45); // a bar and a bit at 108 bpm
    expect(steps.length % 8).not.toBe(0);
    const before = steps.length;
    audio.setTheme("forest");
    tick(80);
    const switched = steps.findIndex((s, i) => i >= before && s.bpm !== 108);
    expect(switched).toBeGreaterThan(before - 1);
    expect(switched % 8).toBe(0); // the old bar was finished
    expect(steps[switched]!.beat).toBe(0); // and the new music starts at the top of its progression
    for (const s of steps.slice(switched)) expect(s.bpm).toBe(84);
    audio.dispose();
  });

  it("with the music off, the theme is simply remembered for when it starts", () => {
    g.window = { AudioContext: makeCtx(log) };
    const audio = new GameAudio();
    const inner = audio as unknown as { mood: { bpm: number } };
    audio.unlock();
    audio.setTheme("ocean-floor");
    audio.setMusic(true);
    expect(inner.mood.bpm).toBe(66);
    audio.dispose();
  });
});
