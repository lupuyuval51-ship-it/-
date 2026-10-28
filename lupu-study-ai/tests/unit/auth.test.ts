import { describe, expect, it } from "vitest";
import { emailToUsername, usernameToEmail, validateUsername } from "@/lib/auth";

describe("שם משתמש (בלי אימייל)", () => {
  it("מאמת פורמט", () => {
    for (const ok of ["noa", "Noa_8", "dan.cohen", "a-b-c", "123abc"]) expect(validateUsername(ok), ok).toBeNull();
    for (const bad of ["ab", "", "נועה", "_noa", "a b", "x".repeat(21), "no@a", "a..b", "abc."]) expect(validateUsername(bad), bad).not.toBeNull();
  });
  it("ממיר הלוך ושוב ומנרמל אותיות גדולות", () => {
    expect(usernameToEmail(" Noa_8 ")).toBe("noa_8@users.lupu-study.app");
    expect(emailToUsername("noa_8@users.lupu-study.app")).toBe("noa_8");
    expect(emailToUsername(null)).toBe("");
  });
});
