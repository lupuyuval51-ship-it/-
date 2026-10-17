import { describe, expect, it } from "vitest";
import { EDIT_LIMITS, applyEditOps, editResponseSchema, identityChanges, sameContent, type EditOp } from "@/lib/game/spec/edit";
import { validateGameSpec } from "@/lib/game/spec/validate";
import { validDemoSpec } from "./helpers";

const spec = validDemoSpec({ gameType: "adventure", mode: "FULL" });
const apply = (ops: EditOp[], max: number = EDIT_LIMITS.opsA) => applyEditOps(spec, ops, max);
const errorsOf = (ops: EditOp[], max: number = EDIT_LIMITS.opsA) => { const r = apply(ops, max); return r.ok ? [] : r.errors; };

describe("applyEditOps", () => {
  it("replaces, adds and removes, and the result still goes through the normal validator", () => {
    const r = apply([
      { op: "replace", path: "/meta/title", value: "New title" },
      { op: "replace", path: "/areas/0/name", value: "Renamed area" },
      { op: "add", path: "/learning/objectives/-", value: { id: "o-extra", text: "A new objective" } },
    ]);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const raw = r.raw as { meta: { title: string }; areas: { name: string }[]; learning: { objectives: { id: string }[] } };
    expect(raw.meta.title).toBe("New title");
    expect(raw.areas[0]!.name).toBe("Renamed area");
    expect(raw.learning.objectives.at(-1)!.id).toBe("o-extra");
    const checked = validateGameSpec(r.raw, { alignGameType: spec.meta.gameType });
    expect(checked.ok).toBe(true);
  });

  it("never mutates the saved spec", () => {
    const before = JSON.stringify(spec);
    apply([{ op: "replace", path: "/meta/title", value: "x" }, { op: "remove", path: "/missions/0" }]);
    expect(JSON.stringify(spec)).toBe(before);
  });

  it("inserts at an index and appends with '-'", () => {
    const r = apply([{ op: "add", path: "/mechanics/0", value: "hazards" }, { op: "add", path: "/mechanics/-", value: "checkpoints" }]);
    expect(r.ok).toBe(true);
    if (r.ok) {
      const m = (r.raw as { mechanics: string[] }).mechanics;
      expect(m[0]).toBe("hazards");
      expect(m.at(-1)).toBe("checkpoints");
    }
  });

  it("locks the game's identity, schema version and provenance", () => {
    for (const path of ["/meta/subject", "/meta/gameType", "/meta/difficulty", "/meta/language", "/meta/generator", "/schemaVersion"]) {
      expect(errorsOf([{ op: "replace", path, value: "x" }]).length, path).toBe(1);
    }
    expect(errorsOf([{ op: "remove", path: "/meta/title" }])[0]).toMatch(/cannot be removed/);
    expect(errorsOf([{ op: "remove", path: "/areas" }])[0]).toMatch(/whole "areas" section/);
  });

  it("rejects prototype-pollution segments, bad pointers, deep paths and huge values", () => {
    expect(errorsOf([{ op: "add", path: "/areas/0/__proto__/x", value: 1 }])[0]).toMatch(/forbidden/);
    expect(errorsOf([{ op: "add", path: "/challenges/0/constructor", value: 1 }])[0]).toMatch(/forbidden/);
    expect(errorsOf([{ op: "replace", path: "areas/0/name", value: "x" }])[0]).toMatch(/JSON pointer/);
    expect(errorsOf([{ op: "replace", path: "/areas//name", value: "x" }])[0]).toMatch(/JSON pointer/);
    expect(errorsOf([{ op: "replace", path: "/areas/0/a/b/c/d/e/f/g", value: 1 }])[0]).toMatch(/too deep/);
    expect(errorsOf([{ op: "replace", path: "/meta/title", value: "x".repeat(EDIT_LIMITS.valueChars + 1) }])[0]).toMatch(/too large/);
  });

  it("reports precise, addressable errors for paths that do not exist", () => {
    expect(errorsOf([{ op: "replace", path: "/areas/99/name", value: "x" }])[0]).toMatch(/does not exist/);
    expect(errorsOf([{ op: "add", path: "/missions/99", value: {} }])[0]).toMatch(/index out of range/);
    expect(errorsOf([{ op: "remove", path: "/missions/99" }])[0]).toMatch(/index out of range/);
    expect(errorsOf([{ op: "replace", path: "/theme/nope", value: 1 }])[0]).toMatch(/nothing to replace/);
    expect(errorsOf([{ op: "remove", path: "/theme/nope" }])[0]).toMatch(/nothing to remove/);
    expect(errorsOf([{ op: "replace", path: "/secrets/key", value: 1 }])[0]).toMatch(/cannot be edited/);
  });

  it("enforces the per-level operation budget", () => {
    const ops: EditOp[] = Array.from({ length: EDIT_LIMITS.opsB + 1 }, () => ({ op: "replace", path: "/meta/tagline", value: "x" }));
    expect(errorsOf(ops, EDIT_LIMITS.opsB)[0]).toMatch(/too many operations/);
    expect(errorsOf(ops, EDIT_LIMITS.opsA)).toEqual([]);
  });

  it("a validator-breaking edit is caught by validateGameSpec, not applied silently", () => {
    const r = apply([{ op: "remove", path: "/challenges/0" }]);
    expect(r.ok).toBe(true);
    if (r.ok) expect(validateGameSpec(r.raw, { alignGameType: spec.meta.gameType }).ok).toBe(false); // its station now points at a missing challenge
  });
});

describe("edit reply and helpers", () => {
  it("parses only the documented reply shape", () => {
    expect(editResponseSchema.safeParse({ summary: "Renamed it", ops: [{ op: "replace", path: "/meta/title", value: "x" }] }).success).toBe(true);
    expect(editResponseSchema.safeParse({ summary: "x", ops: [] }).success).toBe(false);
    expect(editResponseSchema.safeParse({ summary: "x", ops: [{ op: "move", path: "/a", from: "/b" }] }).success).toBe(false);
    expect(editResponseSchema.safeParse({ summary: "x", ops: Array.from({ length: EDIT_LIMITS.opsA + 1 }, () => ({ op: "remove", path: "/missions/0" })) }).success).toBe(false);
  });

  it("detects identity changes and no-op edits", () => {
    expect(identityChanges(spec, { ...spec, meta: { ...spec.meta, subject: "other" } })).toHaveLength(1);
    expect(identityChanges(spec, spec)).toEqual([]);
    expect(sameContent(spec, structuredClone(spec))).toBe(true);
    expect(sameContent(spec, { ...spec, meta: { ...spec.meta, title: "changed" } })).toBe(false);
  });
});
