import { describe, expect, it } from "vitest";
import { numericInputMode, typedNumber } from "@/components/game/hud/ChallengePanel";

describe("the keyboard for a numeric answer", () => {
  it("iPhone and iPad get the text keyboard (their decimal keypad has no minus); others keep the decimal keypad", () => {
    expect(numericInputMode({ userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)" })).toBe("text");
    expect(numericInputMode({ userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", platform: "MacIntel", maxTouchPoints: 5 })).toBe("text"); // iPadOS
    expect(numericInputMode({ userAgent: "Mozilla/5.0 (Linux; Android 15; Pixel 8)", platform: "Linux armv8l", maxTouchPoints: 5 })).toBe("decimal");
    expect(numericInputMode({ userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", platform: "MacIntel", maxTouchPoints: 0 })).toBe("decimal"); // a Mac
    expect(numericInputMode(undefined)).toBe("decimal");
  });

  it("a typed answer reads with a decimal comma or the typographic minus", () => {
    expect(typedNumber("-5")).toBe(-5);
    expect(typedNumber("−5")).toBe(-5);
    expect(typedNumber("2,5")).toBe(2.5);
    expect(typedNumber(" 12 ")).toBe(12);
    expect(typedNumber("")).toBeNull();
    expect(typedNumber("abc")).toBeNull();
  });
});
