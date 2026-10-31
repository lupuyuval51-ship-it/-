/**
 * Station holograms (wave 2, scene-6): drawn on WebViews without `ctx.roundRect` instead of taking the scene down, and one
 * texture per picture and colour shared by the stations of a canvas, freed only when the last station lets go of it.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import type * as THREE from "three";
import { makeScreenTexture, releaseScreen, retainScreen, screenFor, type ScreenState } from "@/components/game/scene/Stations";

const STATES: ScreenState[] = ["challenge", "lore", "done", "locked"];

/** A 2D context that records the names of the calls made on it. */
function stubDocument(withRoundRect: boolean) {
  const calls: string[] = [];
  let canvases = 0;
  const rec = (name: string) => () => {
    calls.push(name);
  };
  vi.stubGlobal("document", {
    createElement: () => {
      canvases += 1;
      const ctx: Record<string, unknown> = {
        fillStyle: "", strokeStyle: "", lineWidth: 1, globalAlpha: 1, lineCap: "butt", lineJoin: "miter",
        clearRect: rec("clearRect"), beginPath: rec("beginPath"), moveTo: rec("moveTo"), lineTo: rec("lineTo"), arcTo: rec("arcTo"),
        arc: rec("arc"), closePath: rec("closePath"), fill: rec("fill"), stroke: rec("stroke"), fillRect: rec("fillRect"),
        createLinearGradient: () => ({ addColorStop: () => {} }),
      };
      if (withRoundRect) ctx.roundRect = rec("roundRect");
      return { width: 0, height: 0, getContext: () => ctx };
    },
  });
  return { calls, canvases: () => canvases };
}

afterEach(() => vi.unstubAllGlobals());

/** Lets the deferred release run (it waits for the effects of the same commit). */
const settle = () => new Promise<void>((r) => setTimeout(r, 0));

function watchDispose(material: THREE.MeshBasicMaterial) {
  const seen = { material: 0, texture: 0 };
  material.addEventListener("dispose", () => { seen.material += 1; });
  material.map!.addEventListener("dispose", () => { seen.texture += 1; });
  return seen;
}

describe("station hologram on an old WebView", () => {
  it("every picture is drawn without roundRect (before Chrome 99) instead of throwing while the first station is drawn", () => {
    for (const state of STATES) {
      const { calls } = stubDocument(false);
      expect(() => makeScreenTexture(state, "#33ccff"), state).not.toThrow();
      expect(calls, state).not.toContain("roundRect");
      expect(calls.filter((c) => c === "arcTo").length % 4, state).toBe(0); // whole rounded rectangles, four corners each
      expect(calls.filter((c) => c === "arcTo").length, state).toBeGreaterThanOrEqual(12); // the panel twice and the header strip
      expect(calls, state).toContain("fill");
    }
  });

  it("still uses roundRect where it exists, with the same number of rounded shapes", () => {
    for (const state of STATES) {
      const old = stubDocument(false);
      makeScreenTexture(state, "#33ccff");
      const corners = old.calls.filter((c) => c === "arcTo").length;
      const now = stubDocument(true);
      makeScreenTexture(state, "#33ccff");
      expect(now.calls.filter((c) => c === "roundRect").length, state).toBe(corners / 4);
      expect(now.calls, state).not.toContain("arcTo");
    }
  });
});

describe("shared station screens", () => {
  it("stations of one canvas that show the same picture in the same colour share one material and one drawn canvas", () => {
    const doc = stubDocument(true);
    const owner = {};
    const a = screenFor(owner, "locked", "#7b8499");
    const b = screenFor(owner, "locked", "#7b8499");
    expect(b).toBe(a);
    expect(b.material).toBe(a.material);
    expect(doc.canvases()).toBe(1);
    expect(screenFor(owner, "challenge", "#7b8499")).not.toBe(a);
    expect(screenFor(owner, "locked", "#34d399")).not.toBe(a);
    expect(doc.canvases()).toBe(3);
  });

  it("another canvas (another material set) never reuses them", () => {
    stubDocument(true);
    const a = screenFor({}, "done", "#34d399");
    const b = screenFor({}, "done", "#34d399");
    expect(b).not.toBe(a);
    expect(b.material).not.toBe(a.material);
  });

  it("is freed only when the last station lets go of it, texture included", async () => {
    stubDocument(true);
    const owner = {};
    const s = screenFor(owner, "challenge", "#ffaa00");
    const seen = watchDispose(s.material);
    retainScreen(s);
    retainScreen(s);
    releaseScreen(s);
    await settle();
    expect(seen).toEqual({ material: 0, texture: 0 });
    expect(s.disposed).toBe(false);
    releaseScreen(s);
    await settle();
    expect(seen).toEqual({ material: 1, texture: 1 });
    expect(s.disposed).toBe(true);
    // the next station to show it draws a fresh one
    expect(screenFor(owner, "challenge", "#ffaa00")).not.toBe(s);
    // a second release changes nothing
    releaseScreen(s);
    await settle();
    expect(seen).toEqual({ material: 1, texture: 1 });
  });

  it("a station that turns to the picture another one is leaving in the same commit takes it over (cleanups run first)", async () => {
    stubDocument(true);
    const owner = {};
    const done = screenFor(owner, "done", "#34d399");
    const seen = watchDispose(done.material);
    retainScreen(done); // station A shows "done"
    const next = screenFor(owner, "done", "#34d399"); // station B renders with "done"
    releaseScreen(done); // A's cleanup (A was reset, or unmounted)
    retainScreen(next); // B's effect
    await settle();
    expect(next).toBe(done);
    expect(seen).toEqual({ material: 0, texture: 0 });
    expect(screenFor(owner, "done", "#34d399")).toBe(done);
  });

  it("an effect run twice (StrictMode: mount, cleanup, mount) keeps the screen", async () => {
    stubDocument(true);
    const s = screenFor({}, "lore", "#a855f7");
    const seen = watchDispose(s.material);
    retainScreen(s);
    releaseScreen(s);
    retainScreen(s);
    await settle();
    expect(seen).toEqual({ material: 0, texture: 0 });
    expect(s.users).toBe(1);
  });

  it("a screen freed between a station's render and its effect is taken back into the pool", async () => {
    stubDocument(true);
    const owner = {};
    const s = screenFor(owner, "locked", "#7b8499");
    retainScreen(s);
    releaseScreen(s);
    await settle();
    expect(s.disposed).toBe(true);
    retainScreen(s); // a station that had looked it up before it was freed
    expect(s.disposed).toBe(false);
    expect(screenFor(owner, "locked", "#7b8499")).toBe(s);
  });
});
