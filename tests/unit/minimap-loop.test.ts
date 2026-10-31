import { describe, expect, it } from "vitest";
import { MINIMAP_INTERVAL_MS, startMinimapLoop } from "@/components/game/hud/minimapLoop";

/** A display that calls back once per `frameMs` of fake time. */
function display(frameMs = 1000 / 60) {
  let queue: { id: number; cb: (now: number) => void }[] = [];
  let next = 1;
  let now = 1000;
  return {
    raf: (cb: (now: number) => void) => { queue.push({ id: next, cb }); return next++; },
    cancel: (id: number) => { queue = queue.filter((q) => q.id !== id); },
    /** Runs the display for `ms` and returns how many frames it showed. */
    run(ms: number) {
      let frames = 0;
      for (const end = now + ms; now < end; ) {
        now += frameMs;
        const due = queue;
        queue = [];
        for (const q of due) { q.cb(now); frames++; }
      }
      return frames;
    },
    pending: () => queue.length,
  };
}

describe("the mini-map's draw loop", () => {
  it("draws about 15 times a second while the canvas is shown", () => {
    const d = display();
    const el = { clientWidth: 132 };
    let drawn = 0;
    const stop = startMinimapLoop(el, () => { drawn++; }, d.raf, d.cancel);
    d.run(1000);
    expect(drawn).toBeGreaterThanOrEqual(12);
    expect(drawn).toBeLessThanOrEqual(Math.ceil(1000 / MINIMAP_INTERVAL_MS));
    stop();
  });

  it("draws nothing while the canvas is hidden (a phone held upright), and starts again when it is shown", () => {
    // Below the `sm` breakpoint the canvas is `display: none` (clientWidth 0): walking the floor plan for it was wasted work.
    const d = display();
    const el = { clientWidth: 0 };
    let drawn = 0;
    startMinimapLoop(el, () => { drawn++; }, d.raf, d.cancel);
    d.run(2000);
    expect(drawn).toBe(0);
    el.clientWidth = 132; // the phone is turned to a wide screen
    d.run(500);
    expect(drawn).toBeGreaterThan(0);
  });

  it("stops for good when it is told to", () => {
    const d = display();
    let drawn = 0;
    const stop = startMinimapLoop({ clientWidth: 132 }, () => { drawn++; }, d.raf, d.cancel);
    d.run(300);
    const seen = drawn;
    expect(seen).toBeGreaterThan(0);
    stop();
    expect(d.pending()).toBe(0);
    d.run(1000);
    expect(drawn).toBe(seen);
  });
});
