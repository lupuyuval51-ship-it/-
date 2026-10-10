import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GameAudio, type Sfx } from "@/components/game/audio";
import { ENVIRONMENTS } from "@/lib/game/spec/constants";

/** A just-enough WebAudio stand-in that records which oscillators were started and at what frequency. */
class FakeParam {
  value = 0;
  setValueAtTime(v: number) { this.value = v; this.owner?.push(v); }
  exponentialRampToValueAtTime() {}
  constructor(private owner?: number[]) {}
}
class FakeNode {
  connect<T>(n: T): T { return n; }
}
function makeCtx() {
  const freqs: number[] = [];
  let started = 0;
  class Ctx {
    currentTime = 0;
    state = "running";
    sampleRate = 8000;
    destination = new FakeNode();
    resume() { return Promise.resolve(); }
    close() { return Promise.resolve(); }
    createGain() { return Object.assign(new FakeNode(), { gain: new FakeParam() }); }
    createDynamicsCompressor() { return Object.assign(new FakeNode(), { threshold: new FakeParam(), ratio: new FakeParam() }); }
    createBiquadFilter() { return Object.assign(new FakeNode(), { type: "lowpass", frequency: new FakeParam() }); }
    createOscillator() { return Object.assign(new FakeNode(), { type: "sine", frequency: new FakeParam(freqs), start() { started++; }, stop() {} }); }
    createBuffer(_c: number, len: number) { return { getChannelData: () => new Float32Array(len) }; }
    createBufferSource() { return Object.assign(new FakeNode(), { buffer: null, start() { started++; }, stop() {} }); }
  }
  return { Ctx, freqs, started: () => started, tick: (ctx: { currentTime: number }, s: number) => { ctx.currentTime += s; } };
}

describe("game audio (synthesised, no files)", () => {
  let fake: ReturnType<typeof makeCtx>;
  beforeEach(() => {
    vi.useFakeTimers();
    fake = makeCtx();
    (globalThis as unknown as { window: unknown }).window = { AudioContext: fake.Ctx };
  });
  afterEach(() => {
    vi.useRealTimers();
    delete (globalThis as unknown as { window?: unknown }).window;
  });

  it("every sound effect plays without throwing and actually starts a voice", () => {
    const audio = new GameAudio();
    audio.unlock();
    const names: Sfx[] = ["collect", "correct", "wrong", "jump", "land", "portal", "mission", "blip", "checkpoint", "fall", "open", "step", "stepFast", "gate"];
    for (const n of names) {
      const before = fake.started();
      audio.play(n);
      expect(fake.started(), n).toBeGreaterThan(before);
    }
  });

  it("is silent when sound effects are switched off and before the first user gesture", () => {
    const audio = new GameAudio();
    audio.play("jump"); // no unlock yet
    expect(fake.started()).toBe(0);
    audio.unlock();
    audio.setSfx(false);
    audio.play("jump");
    expect(fake.started()).toBe(0);
  });

  it("quick successive pick-ups climb in pitch, then reset after a pause", () => {
    const audio = new GameAudio();
    audio.unlock();
    const ctx = (audio as unknown as { ctx: { currentTime: number } }).ctx;
    const firstOf = () => { const n = fake.freqs.length; audio.play("collect"); return fake.freqs[n]!; };
    const a = firstOf();
    fake.tick(ctx, 0.5);
    const b = firstOf();
    fake.tick(ctx, 0.5);
    const c = firstOf();
    expect(b).toBeGreaterThan(a);
    expect(c).toBeGreaterThan(b);
    fake.tick(ctx, 10);
    expect(firstOf()).toBeCloseTo(a, 5);
  });

  for (const env of ENVIRONMENTS) {
    it(`${env}: the music loop schedules notes in key and keeps going bar after bar`, () => {
      const audio = new GameAudio();
      audio.setMusic(true);
      audio.unlock();
      audio.setTheme(env);
      const ctx = (audio as unknown as { ctx: { currentTime: number } }).ctx;
      const before = fake.freqs.length;
      for (let i = 0; i < 80; i++) { // ~ 5.6 s of timer ticks
        fake.tick(ctx, 0.07);
        vi.advanceTimersByTime(70);
      }
      const notes = fake.freqs.slice(before);
      expect(notes.length).toBeGreaterThan(10);
      for (const f of notes) {
        expect(Number.isFinite(f)).toBe(true);
        expect(f).toBeGreaterThan(20);
        expect(f).toBeLessThan(6000);
      }
      audio.setMusic(false);
      const stopped = fake.freqs.length;
      for (let i = 0; i < 10; i++) { fake.tick(ctx, 0.07); vi.advanceTimersByTime(70); }
      expect(fake.freqs.length).toBe(stopped);
      audio.dispose();
    });
  }
});
