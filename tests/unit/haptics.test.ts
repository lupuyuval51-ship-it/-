import { describe, expect, it, vi } from "vitest";
import { canVibrate, vibrationPattern, webHaptic, type Feedback } from "@/components/game/haptics";

const ALL: Feedback[] = ["correct", "wrong", "collect", "mission", "gate", "streak", "victory", "area", "checkpoint"];

describe("vibration patterns", () => {
  it("has a short, valid pattern for every event", () => {
    for (const kind of ALL) {
      const p = vibrationPattern(kind);
      const parts = Array.isArray(p) ? p : [p];
      expect(parts.length, kind).toBeGreaterThan(0);
      expect(parts.every((n) => Number.isInteger(n) && n > 0 && n <= 100), kind).toBe(true);
      expect(parts.reduce((a, b) => a + b, 0), kind).toBeLessThanOrEqual(250); // never a long buzz
    }
  });

  it("tells good from bad and small from big", () => {
    expect(vibrationPattern("wrong")).toEqual([25, 50, 25]);
    expect(vibrationPattern("collect")).toBe(15);
    expect(vibrationPattern("checkpoint")).toBe(15);
    expect(vibrationPattern("gate")).toBe(15);
    const total = (k: Feedback) => [vibrationPattern(k)].flat().reduce((a, b) => a + b, 0);
    expect(total("victory")).toBeGreaterThan(total("correct"));
    expect(total("correct")).toBeGreaterThan(total("collect"));
  });
});

describe("web haptics", () => {
  it("does nothing where the browser cannot vibrate", () => {
    expect(canVibrate(undefined)).toBe(false);
    expect(canVibrate({})).toBe(false);
    expect(webHaptic("collect", {})).toBe(false);
    expect(webHaptic("collect", undefined)).toBe(false);
  });

  it("vibrates with the pattern of the event", () => {
    const vibrate = vi.fn(() => true);
    expect(canVibrate({ vibrate })).toBe(true);
    expect(webHaptic("wrong", { vibrate })).toBe(true);
    expect(vibrate).toHaveBeenCalledWith([25, 50, 25]);
  });

  it("waits for the first tap instead of triggering the browser's intervention warning", () => {
    const vibrate = vi.fn(() => true);
    expect(webHaptic("collect", { vibrate, userActivation: { hasBeenActive: false } })).toBe(false);
    expect(vibrate).not.toHaveBeenCalled();
    expect(webHaptic("collect", { vibrate, userActivation: { hasBeenActive: true } })).toBe(true);
  });

  it("never throws", () => {
    const vibrate = vi.fn(() => { throw new Error("blocked"); });
    expect(webHaptic("collect", { vibrate })).toBe(false);
  });
});
