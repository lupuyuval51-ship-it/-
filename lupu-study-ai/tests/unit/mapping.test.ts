import { describe, expect, it } from "vitest";
import { COLLECTIONS, diffCollection, fromRow, mergeById, normalizeRemote, toRow } from "@/services/data/mapping";
import { emptyData } from "@/services/data/defaults";

describe("מיפוי נתונים ל-Supabase", () => {
  it("camelCase ↔ snake_case, הוספת user_id והסרתו", () => {
    const row = toRow({ id: "1", subjectId: "s", dueDate: "2026-03-10", attachmentIds: ["a"], doneAt: null }, "u1");
    expect(row).toEqual({ id: "1", subject_id: "s", due_date: "2026-03-10", attachment_ids: ["a"], done_at: null, user_id: "u1" });
    expect(fromRow(row)).toEqual({ id: "1", subjectId: "s", dueDate: "2026-03-10", attachmentIds: ["a"], doneAt: null });
  });

  it("jsonb מקונן נשמר כמות שהוא (מפתחות פנימיים לא מומרים)", () => {
    const row = toRow({ id: "1", citations: [{ materialId: "m", page: 2 }] }, "u");
    expect((row.citations as { materialId: string }[])[0].materialId).toBe("m");
  });

  it("נרמול ערכים מהשרת: חותמות זמן ו-numeric", () => {
    const n = normalizeRemote({ at: "2026-03-10T10:00:00+00:00", ease: "2.30", minutes: "25.0", title: "123" });
    expect(n).toEqual({ at: "2026-03-10T10:00:00.000Z", ease: 2.3, minutes: 25, title: "123" });
  });

  it("diff: חדש, ששונה, נמחק; ללא שינוי כשההפניה זהה", () => {
    const a = { id: "a", v: 1 }, b = { id: "b", v: 1 };
    const prev = [a, b];
    expect(diffCollection(prev, prev)).toEqual({ upserts: [], deletes: [] });
    const b2 = { id: "b", v: 2 }, c = { id: "c", v: 1 };
    expect(diffCollection(prev, [a, b2, c])).toEqual({ upserts: [b2, c], deletes: [] });
    expect(diffCollection(prev, [b])).toEqual({ upserts: [], deletes: ["a"] });
  });

  it("מיזוג: איחוד לפי מזהה, והשרת מנצח בקונפליקט", () => {
    expect(mergeById([{ id: "1", v: "local" }, { id: "2", v: "local" }], [{ id: "1", v: "remote" }, { id: "3", v: "remote" }]))
      .toEqual([{ id: "1", v: "remote" }, { id: "2", v: "local" }, { id: "3", v: "remote" }]);
  });

  it("כל אוספי הנתונים ממופים לטבלה", () => {
    const d = emptyData();
    for (const c of COLLECTIONS) expect(Array.isArray(d[c.name]), c.name).toBe(true);
    expect(new Set(COLLECTIONS.map((c) => c.table)).size).toBe(COLLECTIONS.length);
  });
});
