import { describe, expect, it } from "vitest";
import { dispatchScreenBack, SCREEN_BACK_EVENT } from "../../mobile/src/back";

describe("Back is offered to the open screen first", () => {
  it("is not taken when no screen listens (the route decides)", () => {
    expect(dispatchScreenBack(new EventTarget())).toBe(false);
  });

  it("is taken when a screen with steps of its own cancels it", () => {
    const target = new EventTarget();
    let steps = 0;
    target.addEventListener(SCREEN_BACK_EVENT, (e) => { e.preventDefault(); steps++; });
    expect(dispatchScreenBack(target)).toBe(true);
    expect(steps).toBe(1);
  });

  it("the native wiring asks the screen before the route", async () => {
    const { readFileSync } = await import("node:fs");
    const src = readFileSync(new URL("../../mobile/src/native.ts", import.meta.url), "utf8");
    const listener = src.slice(src.indexOf('addListener("backButton"'));
    expect(listener.indexOf("dispatchScreenBack()")).toBeGreaterThan(-1);
    expect(listener.indexOf("dispatchScreenBack()")).toBeLessThan(listener.indexOf("backAction("));
  });
});
