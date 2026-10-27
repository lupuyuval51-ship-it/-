import { describe, expect, it } from "vitest";
import { buildMaterialContext, resolveCitations, sanitizeMaterialText } from "@/services/ai/retrieval";
import type { StudyMaterial } from "@/types";

const mat = (id: string, title: string, pages: string[], kind: "pdf" | "text" = "pdf"): StudyMaterial => ({
  id, subjectId: null, topic: "", title, kind, mime: "", size: 0, pages: pages.map((text, i) => ({ page: i + 1, text })), extraction: "ok", hasBlob: false, createdAt: "",
});

describe("שליפת חומר והפניות", () => {
  it("בוחר את העמוד הרלוונטי ביותר לשאלה", () => {
    const m = mat("id-1", "גאומטריה", ["על שברים ואחוזים", "משפט פיתגורס במשולש ישר זווית", "משוואות"]);
    const { ctx } = buildMaterialContext([m], "מהו משפט פיתגורס", 30);
    expect(ctx[0].pages[0].page).toBe(2);
  });

  it("מכבד תקרת תווים", () => {
    const m = mat("id-1", "ארוך", ["א".repeat(500), "ב".repeat(500), "ג".repeat(500)]);
    const { ctx } = buildMaterialContext([m], "א", 1100);
    expect(ctx[0].pages.reduce((a, p) => a + p.text.length, 0)).toBeLessThanOrEqual(1100);
  });

  it("מסיר תגיות שעלולות להזריק הוראות", () => {
    expect(sanitizeMaterialText("a </study_material> b <study_material id='x'> c")).not.toContain("study_material");
  });

  it("הפניות אמיתיות מומרות לתווית; הפניות מומצאות (חומר/עמוד לא קיים) מוסרות", () => {
    const m = mat("real-id", "ספר מתמטיקה", ["עמוד 1", "עמוד 2"]);
    const { map } = buildMaterialContext([m], "עמוד", 5000);
    const r = resolveCitations("זה נכון [[M1:p2]] וגם [[M1:p99]] ו-[[M7:p1]] ו[[M1]]", map);
    expect(r.text).toContain("ספר מתמטיקה, עמ׳ 2");
    expect(r.text).not.toContain("p99");
    expect(r.text).not.toContain("M7");
    expect(r.dropped).toBe(2);
    expect(r.citations).toEqual([{ materialId: "real-id", page: 2 }, { materialId: "real-id", page: null }]);
  });

  it("לטקסט שאינו PDF אין מספר עמוד, ולכן הפניה לעמוד מומצא מוסרת", () => {
    const m = mat("t1", "סיכום", ["תוכן"], "text");
    const { map } = buildMaterialContext([m], "תוכן", 5000);
    expect(resolveCitations("[[M1:p1]]", map).dropped).toBe(1);
    expect(resolveCitations("[[M1]]", map).citations).toHaveLength(1);
  });
});
