import { describe, expect, it } from "vitest";
import { repairPrompt, systemPrompt } from "@/server/ai/prompts";
import { validateGameSpec } from "@/lib/game/spec/validate";
import { validDemoSpec } from "./helpers";

describe("prompts", () => {
  it("state the id and ordering rules once instead of repeating the id pattern in every field", () => {
    const sys = systemPrompt("spec", "en");
    expect(sys).toContain("letters, digits");
    expect(sys).toMatch(/met in the order they are listed/);
    expect(sys).not.toContain("^[A-Za-z0-9]");
    expect(sys.length).toBeLessThan(21_000);
  });

  it("the blueprint stage carries no challenge examples (it writes no challenge content)", () => {
    expect(systemPrompt("blueprint", "en")).not.toContain("Example challenge objects");
    expect(systemPrompt("spec", "en")).toContain("Example challenge objects");
    expect(systemPrompt("edit", "en")).toContain("Example challenge objects");
  });

  it("repair feedback adds a how-to-fix hint only for the problems that occurred", () => {
    const text = repairPrompt(['challenge "c1" is not placed on any station and is not a variant']);
    expect(text).toContain("How to fix:");
    expect(text).toContain("own station");
    expect(text).not.toContain("remove one \"requires\" link");
    expect(repairPrompt(["meta.title: required"])).not.toContain("How to fix:");
  });
});

describe("objectives that list the same id twice", () => {
  it("are repaired losslessly instead of producing a mission nobody can complete", () => {
    const spec = validDemoSpec({ gameType: "exploration", mode: "FAST" });
    const raw = structuredClone(spec);
    const solve = raw.missions.flatMap((m) => m.objectives).find((o) => o.type === "solve")!;
    if (solve.type !== "solve") throw new Error("no solve objective");
    solve.challengeIds = [...solve.challengeIds, solve.challengeIds[0]!];
    const res = validateGameSpec(raw, { alignGameType: raw.meta.gameType });
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.warnings.join(" ")).toMatch(/duplicate ids removed/);
  });
});
