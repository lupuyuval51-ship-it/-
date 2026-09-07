import { describe, expect, it } from "vitest";
import { LEVEL_TITLES } from "@/lib/types";
import { MAX_LEVEL, levelFromXp, titleForLevel, xpRequiredForLevel } from "@/content/levels";

describe("xpRequiredForLevel", () => {
  it("matches the cumulative 50·L·(L−1) thresholds from the spec", () => {
    expect(xpRequiredForLevel(1)).toBe(0);
    expect(xpRequiredForLevel(2)).toBe(100);
    expect(xpRequiredForLevel(5)).toBe(1000);
    expect(xpRequiredForLevel(10)).toBe(4500);
    expect(xpRequiredForLevel(20)).toBe(19000);
    expect(xpRequiredForLevel(50)).toBe(122500);
  });

  it("is monotonic and never negative for odd inputs", () => {
    expect(xpRequiredForLevel(0)).toBe(0);
    expect(xpRequiredForLevel(-3)).toBe(0);
    for (let l = 1; l < 60; l += 1) expect(xpRequiredForLevel(l + 1)).toBeGreaterThan(xpRequiredForLevel(l));
  });
});

describe("levelFromXp", () => {
  it("starts at level 1 with 0 XP and the Rookie title", () => {
    const info = levelFromXp(0);
    expect(info.level).toBe(1);
    expect(info.title).toEqual(LEVEL_TITLES[0].title);
    expect(info.xpIntoLevel).toBe(0);
    expect(info.xpForNextLevel).toBe(100);
    expect(info.progressPct).toBe(0);
  });

  it("crosses exactly at the thresholds", () => {
    expect(levelFromXp(99).level).toBe(1);
    expect(levelFromXp(100).level).toBe(2);
    expect(levelFromXp(999).level).toBe(4);
    expect(levelFromXp(1000).level).toBe(5);
    expect(levelFromXp(4499).level).toBe(9);
    expect(levelFromXp(4500).level).toBe(10);
    expect(levelFromXp(19000).level).toBe(20);
    expect(levelFromXp(122500).level).toBe(50);
  });

  it("reports progress inside the level", () => {
    // Level 2 spans 100 → 300 (200 XP). 150 XP is 50 into the level = 25 %.
    const info = levelFromXp(150);
    expect(info.level).toBe(2);
    expect(info.xpIntoLevel).toBe(50);
    expect(info.xpForNextLevel).toBe(200);
    expect(info.progressPct).toBe(25);
  });

  it("keeps the last title reached between title levels", () => {
    expect(levelFromXp(xpRequiredForLevel(7)).title.en).toBe("Disc Learner");
    expect(levelFromXp(xpRequiredForLevel(12)).title.en).toBe("Skilled Thrower");
    expect(levelFromXp(xpRequiredForLevel(49)).title.en).toBe("Ultimate Expert");
    expect(levelFromXp(xpRequiredForLevel(50)).title.en).toBe("Frisbee Legend");
    expect(titleForLevel(3)).toEqual(LEVEL_TITLES[0].title);
  });

  it("treats invalid or negative XP as 0 and caps at MAX_LEVEL", () => {
    expect(levelFromXp(-50).level).toBe(1);
    expect(levelFromXp(Number.NaN).level).toBe(1);
    const top = levelFromXp(xpRequiredForLevel(MAX_LEVEL) + 100_000);
    expect(top.level).toBe(MAX_LEVEL);
    expect(top.xpForNextLevel).toBe(0);
    expect(top.progressPct).toBe(100);
  });
});
