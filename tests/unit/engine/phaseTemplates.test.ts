import { describe, expect, it } from "vitest";
import { DURATIONS, ROLES, SKILLS } from "@/lib/types";
import {
  CHALLENGE_REDISTRIBUTION, PHASE_ORDER, PHASE_SPLITS, PHASE_TEMPLATES, ROLE_FOCUS, SECONDARY_ROLE_SHARE, TRAINING_SPLIT,
  phaseTemplatesFor,
} from "@/engine/phaseTemplates";

describe("PHASE_TEMPLATES", () => {
  it("has the spec minute splits and sums to the duration", () => {
    expect(PHASE_SPLITS[90]).toEqual({ checkin: 3, warmup: 12, throwing: 20, movement: 15, role: 20, game: 10, challenge: 5, cooldown: 5 });
    expect(PHASE_SPLITS[105]).toEqual({ checkin: 3, warmup: 12, throwing: 25, movement: 15, role: 25, game: 15, challenge: 5, cooldown: 5 });
    expect(PHASE_SPLITS[120]).toEqual({ checkin: 5, warmup: 15, throwing: 30, movement: 15, role: 30, game: 15, challenge: 5, cooldown: 5 });
    for (const d of DURATIONS) {
      const sum = PHASE_TEMPLATES[d].reduce((a, p) => a + p.minutes, 0);
      expect(sum).toBe(d);
      expect(PHASE_TEMPLATES[d].map((p) => p.type)).toEqual(PHASE_ORDER);
      for (const p of PHASE_TEMPLATES[d]) {
        expect(p.name.he.length).toBeGreaterThan(0);
        expect(p.name.en.length).toBeGreaterThan(0);
        expect(p.goal.he.length).toBeGreaterThan(0);
        expect(p.goal.en.length).toBeGreaterThan(0);
      }
    }
  });

  it("redistributes the challenge minutes (3 to game, 2 to cool-down) when the challenge is skipped", () => {
    expect(CHALLENGE_REDISTRIBUTION).toEqual({ game: 3, cooldown: 2 });
    for (const d of DURATIONS) {
      const withChallenge = phaseTemplatesFor(d, true);
      const without = phaseTemplatesFor(d, false);
      expect(without.reduce((a, p) => a + p.minutes, 0)).toBe(d);
      expect(without.some((p) => p.type === "challenge")).toBe(false);
      const game = (list: typeof without) => list.find((p) => p.type === "game")!.minutes;
      const cooldown = (list: typeof without) => list.find((p) => p.type === "cooldown")!.minutes;
      expect(game(without)).toBe(game(withChallenge) + 3);
      expect(cooldown(without)).toBe(cooldown(withChallenge) + 2);
    }
  });

  it("returns fresh copies so callers cannot mutate the templates", () => {
    const a = phaseTemplatesFor(90);
    a[0].minutes = 99;
    expect(PHASE_TEMPLATES[90][0].minutes).toBe(3);
  });
});

describe("ROLE_FOCUS and split constants", () => {
  it("covers every role with valid skills and both languages", () => {
    for (const role of ROLES) {
      const focus = ROLE_FOCUS[role];
      expect(focus.skills.length).toBeGreaterThanOrEqual(5);
      for (const s of focus.skills) expect(SKILLS).toContain(s);
      expect(new Set(focus.skills).size).toBe(focus.skills.length);
      expect(focus.description.he.length).toBeGreaterThan(10);
      expect(focus.description.en.length).toBeGreaterThan(10);
    }
    expect(ROLE_FOCUS.wing.skills).toEqual(expect.arrayContaining(["width", "deep_runs", "timing", "catch_moving"]));
    expect(ROLE_FOCUS.runner.skills).toEqual(expect.arrayContaining(["acceleration", "speed", "cutting", "reaction"]));
    expect(ROLE_FOCUS.defender.skills).toEqual(expect.arrayContaining(["defense", "footwork", "mirror", "marking"]));
    expect(ROLE_FOCUS.handler.skills).toEqual(expect.arrayContaining(["backhand", "forehand", "pivot", "fakes", "break_throws", "decision_making", "give_and_go", "release_speed"]));
    expect(ROLE_FOCUS.cutter.skills).toEqual(expect.arrayContaining(["cutting", "separation", "timing", "catch_moving", "change_of_direction", "communication"]));
  });

  it("uses the 30/40/15/15 training split", () => {
    expect(TRAINING_SPLIT).toEqual({ fundamentals: 0.3, primaryRole: 0.4, secondaryRole: 0.15, fitnessAndGame: 0.15 });
    const total = Object.values(TRAINING_SPLIT).reduce((a, b) => a + b, 0);
    expect(Math.round(total * 100)).toBe(100);
    expect(SECONDARY_ROLE_SHARE).toBe(0.15);
  });
});
