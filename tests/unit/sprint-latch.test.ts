import { describe, expect, it } from "vitest";
import { SPRINT_IDLE, SPRINT_TAP_MS, isSprinting, sprintCancel, sprintPress, sprintRelease, sprintStickReleased, sprintToggle } from "@/components/game/hud/sprintLatch";

describe("run button", () => {
  it("runs while it is held and stops when it is let go", () => {
    let s = sprintPress(SPRINT_IDLE, 1000);
    expect(isSprinting(s)).toBe(true);
    s = sprintRelease(s, 1000 + SPRINT_TAP_MS + 50);
    expect(isSprinting(s)).toBe(false);
    expect(s.latched).toBe(false);
  });

  it("a quick tap keeps running after the finger is lifted", () => {
    let s = sprintPress(SPRINT_IDLE, 1000);
    s = sprintRelease(s, 1100);
    expect(s).toEqual({ latched: true, downAt: null });
    expect(isSprinting(s)).toBe(true);
  });

  it("a second tap stops it", () => {
    let s = sprintRelease(sprintPress(SPRINT_IDLE, 0), 80);
    s = sprintRelease(sprintPress(s, 500), 560);
    expect(isSprinting(s)).toBe(false);
  });

  it("holding while latched ends the latch on release (hold means 'only while held')", () => {
    let s = sprintRelease(sprintPress(SPRINT_IDLE, 0), 80);
    s = sprintPress(s, 500);
    expect(isSprinting(s)).toBe(true);
    s = sprintRelease(s, 500 + SPRINT_TAP_MS + 1);
    expect(isSprinting(s)).toBe(false);
  });

  it("a latched run ends when the stick is let go, a plain hold is unaffected", () => {
    const latched = sprintRelease(sprintPress(SPRINT_IDLE, 0), 50);
    expect(isSprinting(sprintStickReleased(latched))).toBe(false);
    const held = sprintPress(SPRINT_IDLE, 0);
    expect(sprintStickReleased(held)).toBe(held);
  });

  it("a cancelled press stops the hold but keeps an existing latch", () => {
    expect(isSprinting(sprintCancel(sprintPress(SPRINT_IDLE, 0)))).toBe(false);
    const latched = sprintRelease(sprintPress(SPRINT_IDLE, 0), 50);
    expect(isSprinting(sprintCancel(sprintPress(latched, 100)))).toBe(true);
  });

  it("a release without a press changes nothing", () => {
    expect(sprintRelease(SPRINT_IDLE, 10)).toBe(SPRINT_IDLE);
    expect(sprintCancel(SPRINT_IDLE)).toBe(SPRINT_IDLE);
  });

  it("a keyboard or screen-reader activation toggles the latch", () => {
    const on = sprintToggle(SPRINT_IDLE);
    expect(isSprinting(on)).toBe(true);
    expect(isSprinting(sprintToggle(on))).toBe(false);
  });
});
