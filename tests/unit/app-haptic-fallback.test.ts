import { afterEach, describe, expect, it, vi } from "vitest";
import { vibrationPattern, type Feedback } from "@/components/game/haptics";

// The app outside a native shell (the e2e build in a browser) vibrates with the website's table, not a second copy of it.
vi.mock("@capacitor/core", () => ({ Capacitor: { isNativePlatform: () => false }, registerPlugin: () => ({}) }));
vi.mock("@capacitor/app", () => ({ App: { addListener: () => Promise.resolve({ remove: () => undefined }) } }));
vi.mock("@capacitor/haptics", () => ({ Haptics: {}, ImpactStyle: {}, NotificationType: {} }));
vi.mock("../../mobile/src/app-state", () => ({ getSettings: () => ({ vibration: true }) }));

const { haptic } = await import("../../mobile/src/native");

afterEach(() => vi.unstubAllGlobals());

describe("app haptic web fallback", () => {
  it("uses the shared pattern for every event", () => {
    const vibrate = vi.fn(() => true);
    vi.stubGlobal("navigator", { vibrate, userActivation: { hasBeenActive: true } });
    const kinds: Feedback[] = ["correct", "wrong", "collect", "mission", "gate", "streak", "victory", "area", "checkpoint"];
    for (const k of kinds) haptic(k);
    expect(vibrate.mock.calls.map((c) => (c as unknown[])[0])).toEqual(kinds.map(vibrationPattern));
    expect(vibrationPattern("checkpoint")).toBe(15);
  });

  it("stays quiet before the first tap", () => {
    const vibrate = vi.fn(() => true);
    vi.stubGlobal("navigator", { vibrate, userActivation: { hasBeenActive: false } });
    haptic("correct");
    expect(vibrate).not.toHaveBeenCalled();
  });
});
