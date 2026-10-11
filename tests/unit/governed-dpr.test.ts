import { describe, expect, it } from "vitest";
import { governedDprFor } from "@/components/game/scene/governor";

describe("pixel ratio chosen by the frame governor", () => {
  it("is handed back to the canvas as a plain number for the canvas it was chosen for", () => {
    expect(governedDprFor({ key: "area1-B", dpr: 1.2 }, "area1-B")).toBe(1.2);
  });

  it("is not used before the governor chose anything, so the profile's own range applies", () => {
    expect(governedDprFor(null, "area1-B")).toBeNull();
  });

  it("is dropped for a new canvas (another area or tier starts from its own default)", () => {
    expect(governedDprFor({ key: "area1-B", dpr: 1.2 }, "area2-B")).toBeNull();
    expect(governedDprFor({ key: "area1-B", dpr: 1.2 }, "area1-A")).toBeNull();
  });

  it("ignores nonsense", () => {
    expect(governedDprFor({ key: "k", dpr: 0 }, "k")).toBeNull();
    expect(governedDprFor({ key: "k", dpr: Number.NaN }, "k")).toBeNull();
    expect(governedDprFor({ key: "k", dpr: -1 }, "k")).toBeNull();
  });
});
