import { describe, expect, it } from "vitest";
import {
  DROPPABLE, SILENT, VOICE_CAP, clamp, cuesForEvent, envelopeAt, gapAllows, nextStreak, resyncNextNote, safeGain, streakLevel, streakNotes, voiceAllowed, volumeToGain,
} from "@/components/game/audioModel";

describe("event to sound mapping", () => {
  it("a single right answer is just the chime; streaks add a flourish that grows", () => {
    expect(cuesForEvent({ type: "answer", correct: true, streak: 1 }).map((c) => c.sfx)).toEqual(["correct"]);
    const two = cuesForEvent({ type: "answer", correct: true, streak: 2 });
    expect(two.map((c) => c.sfx)).toEqual(["correct", "streak"]);
    expect(two[1]!.delay).toBeGreaterThan(0.2); // after the chime, not on top of it
    expect(cuesForEvent({ type: "answer", correct: true, streak: 9 })[1]!.level).toBe(3);
  });

  it("a wrong answer is only ever the gentle sound, whatever the streak was", () => {
    for (const streak of [0, 1, 5, 20]) expect(cuesForEvent({ type: "answer", correct: false, streak }).map((c) => c.sfx)).toEqual(["wrong"]);
  });

  it("game events map to their own sounds", () => {
    expect(cuesForEvent({ type: "complete" })[0]!.sfx).toBe("victory");
    expect(cuesForEvent({ type: "mission" })[0]!.sfx).toBe("mission");
    expect(cuesForEvent({ type: "area" })[0]!.sfx).toBe("areaEnter");
    expect(cuesForEvent({ type: "checkpoint" })[0]!.sfx).toBe("checkpoint");
    expect(cuesForEvent({ type: "collect" })[0]!.sfx).toBe("collect");
    expect(cuesForEvent({ type: "respawn" })[0]!.sfx).toBe("fall");
  });

  it("streak levels step up at 2, 4 and 6 and ignore garbage", () => {
    expect([0, 1, 2, 3, 4, 5, 6, 40].map(streakLevel)).toEqual([0, 0, 1, 1, 2, 2, 3, 3]);
    expect(streakLevel(Number.NaN)).toBe(0);
    expect(streakLevel(-3)).toBe(0);
  });

  it("nextStreak counts right answers and resets on a wrong one", () => {
    expect(nextStreak(0, true)).toBe(1);
    expect(nextStreak(4, true)).toBe(5);
    expect(nextStreak(4, false)).toBe(0);
    expect(nextStreak(99, true)).toBe(99);
  });

  it("the streak flourish gets longer and higher, never leaves a sane range", () => {
    const a = streakNotes(1), b = streakNotes(2), c = streakNotes(3);
    expect(a.length).toBeLessThan(b.length);
    expect(b.length).toBeLessThanOrEqual(c.length);
    expect(Math.max(...c)).toBeGreaterThan(Math.max(...a));
    expect(streakNotes(0)).toEqual(streakNotes(1));
    expect(streakNotes(99)).toEqual(streakNotes(3));
    for (const n of [...a, ...b, ...c]) expect(n).toBeLessThanOrEqual(14);
  });
});

describe("volume and envelope maths", () => {
  it("clamp handles NaN and infinities", () => {
    expect(clamp(5, 0, 1)).toBe(1);
    expect(clamp(-5, 0, 1)).toBe(0);
    expect(clamp(Number.NaN, 0, 1)).toBe(0);
    expect(clamp(Number.POSITIVE_INFINITY, 0, 1)).toBe(0);
  });

  it("volume maps to gain monotonically, silent at 0 and at the ceiling at 1", () => {
    expect(volumeToGain(0)).toBe(0);
    expect(volumeToGain(1, 0.55)).toBeCloseTo(0.55, 10);
    expect(volumeToGain(2, 0.55)).toBeCloseTo(0.55, 10);
    expect(volumeToGain(-1, 0.55)).toBe(0);
    let prev = -1;
    for (let v = 0; v <= 1.0001; v += 0.1) {
      const g = volumeToGain(v);
      expect(g).toBeGreaterThan(prev);
      prev = g;
    }
    expect(volumeToGain(0.5)).toBeLessThan(0.5); // perceptual curve: the middle of the slider is quieter than half the gain
  });

  it("safeGain keeps ramps legal (never 0, never above the peak)", () => {
    expect(safeGain(0)).toBe(SILENT);
    expect(safeGain(-1)).toBe(SILENT);
    expect(safeGain(3, 0.5)).toBe(0.5);
    expect(safeGain(0.2)).toBe(0.2);
  });

  it("the envelope starts and ends at the floor, peaks at the attack and decays monotonically after", () => {
    const peak = 0.2, attack = 0.02, dur = 0.5;
    expect(envelopeAt(0, peak, attack, dur)).toBe(SILENT);
    expect(envelopeAt(dur, peak, attack, dur)).toBe(SILENT);
    expect(envelopeAt(attack, peak, attack, dur)).toBeCloseTo(peak, 10);
    let prev = Infinity;
    for (let t = attack; t < dur; t += 0.02) {
      const g = envelopeAt(t, peak, attack, dur);
      expect(g).toBeLessThanOrEqual(prev + 1e-12);
      expect(g).toBeLessThanOrEqual(peak + 1e-12);
      expect(g).toBeGreaterThan(0);
      prev = g;
    }
    let up = 0;
    for (let t = 0.001; t <= attack; t += 0.002) {
      const g = envelopeAt(t, peak, attack, dur);
      expect(g).toBeGreaterThanOrEqual(up);
      up = g;
    }
  });

  it("an attack longer than the sound still produces a finite, bounded envelope", () => {
    for (const t of [0.01, 0.05, 0.09]) {
      const g = envelopeAt(t, 0.3, 5, 0.1);
      expect(Number.isFinite(g)).toBe(true);
      expect(g).toBeLessThanOrEqual(0.3 + 1e-12);
    }
  });
});

describe("voice limiting and scheduling recovery", () => {
  it("repeats are throttled per sound but never block after a clock rewind", () => {
    expect(gapAllows("step", undefined, 5)).toBe(true);
    expect(gapAllows("step", 5, 5.03)).toBe(false);
    expect(gapAllows("step", 5, 5.2)).toBe(true);
    expect(gapAllows("victory", 5, 6)).toBe(false);
    expect(gapAllows("correct", 5, 5)).toBe(true); // no gap configured
    expect(gapAllows("step", 5, 1)).toBe(true);
  });

  it("only footsteps and similar tiny sounds are dropped when voices run out", () => {
    expect(voiceAllowed("step", VOICE_CAP - 1)).toBe(true);
    expect(voiceAllowed("step", VOICE_CAP)).toBe(false);
    expect(voiceAllowed("victory", VOICE_CAP + 10)).toBe(true);
    expect(voiceAllowed("wrong", VOICE_CAP + 10)).toBe(true);
    for (const s of DROPPABLE) expect(["step", "stepFast", "blip", "land", "jump"]).toContain(s);
  });

  it("after the background the music jumps ahead instead of replaying a backlog", () => {
    expect(resyncNextNote(10, 100)).toBeCloseTo(100.1, 10);
    expect(resyncNextNote(100.2, 100)).toBe(100.2);
  });
});
