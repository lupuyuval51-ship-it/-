import { beforeEach, describe, expect, it, vi } from "vitest";
import { probeWebgl, resetWebglProbe, webglAvailable, type ProbeCanvas } from "@/components/game/webgl";

const canvasWith = (contexts: Record<string, boolean>) => {
  const lose = vi.fn();
  const getContext = vi.fn((id: string) => (contexts[id] ? { getExtension: (name: string) => (name === "WEBGL_lose_context" ? { loseContext: lose } : null) } : null));
  return { canvas: { getContext } as ProbeCanvas, getContext, lose };
};

beforeEach(() => resetWebglProbe());

describe("WebGL probe", () => {
  it("finds WebGL 2, falls back to WebGL 1, and says no without either", () => {
    expect(probeWebgl(() => canvasWith({ webgl2: true }).canvas)).toBe(true);
    const v1 = canvasWith({ webgl: true });
    expect(probeWebgl(() => v1.canvas)).toBe(true);
    expect(v1.getContext).toHaveBeenCalledWith("webgl2");
    expect(v1.getContext).toHaveBeenCalledWith("webgl");
    expect(probeWebgl(() => canvasWith({}).canvas)).toBe(false);
  });

  it("gives its GPU context back at once (browsers keep only a handful alive)", () => {
    const c = canvasWith({ webgl2: true });
    probeWebgl(() => c.canvas);
    expect(c.lose).toHaveBeenCalledTimes(1);
  });

  it("survives a browser that throws", () => {
    expect(probeWebgl(() => { throw new Error("no canvas"); })).toBe(false);
    expect(probeWebgl(() => ({ getContext: () => { throw new Error("blocked"); } }))).toBe(false);
  });

  it("asks only once while the answer is yes, however often the screen renders", () => {
    const make = vi.fn(() => canvasWith({ webgl2: true }).canvas);
    for (let i = 0; i < 50; i++) expect(webglAvailable(make)).toBe(true);
    expect(make).toHaveBeenCalledTimes(1);
  });

  it("keeps asking while the answer is no (nothing is created then, so it is cheap)", () => {
    const make = vi.fn(() => canvasWith({}).canvas);
    webglAvailable(make);
    webglAvailable(make);
    expect(make).toHaveBeenCalledTimes(2);
  });
});
