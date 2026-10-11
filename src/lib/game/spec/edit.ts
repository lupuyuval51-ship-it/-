/**
 * Natural-language game edits, as DATA.
 *
 * The model never writes code and never rewrites the game. It answers with a short list of JSON-Patch style
 * operations (add / replace / remove) over the saved game document. This module applies them to a copy and
 * returns the raw result, which the caller then runs through the normal `validateGameSpec` gate (schema,
 * cross-references, solvability, sanitising). Nothing in an operation is executable.
 *
 * Only parts of the document that describe the game's content may be touched: the game's identity (subject,
 * type, difficulty, language), its schema version and its provenance are locked.
 */
import { z } from "zod";
import type { GameSpec } from "./schema";

export const EDIT_LIMITS = {
  /** Operations per reply, by robot level (B = small guided edits, A = larger multi-part changes). */
  opsB: 15,
  opsA: 40,
  /** Serialized size of one operation value. */
  valueChars: 20_000,
  pathDepth: 8,
  instructionChars: 1_000,
} as const;

export const editOpSchema = z.discriminatedUnion("op", [
  z.object({ op: z.literal("add"), path: z.string().min(1).max(200), value: z.unknown() }),
  z.object({ op: z.literal("replace"), path: z.string().min(1).max(200), value: z.unknown() }),
  z.object({ op: z.literal("remove"), path: z.string().min(1).max(200) }),
]);
export type EditOp = z.infer<typeof editOpSchema>;

export const editResponseSchema = z.object({
  /** One sentence for the player describing what changed, in the game's language. */
  summary: z.string().trim().min(1).max(240),
  ops: z.array(editOpSchema).min(1).max(EDIT_LIMITS.opsA),
});
export type EditResponse = z.infer<typeof editResponseSchema>;

/** Top-level sections an edit may touch, and (for `meta`) the only fields inside it. */
const EDITABLE_SECTIONS = new Set(["meta", "learning", "theme", "mechanics", "areas", "missions", "challenges"]);
const EDITABLE_META = new Set(["title", "tagline", "estimatedMinutes", "subjectCategory"]);
const FORBIDDEN_SEGMENTS = new Set(["__proto__", "constructor", "prototype"]);

type Json = unknown;
const isObj = (v: Json): v is Record<string, Json> => typeof v === "object" && v !== null && !Array.isArray(v);

function parsePointer(path: string): string[] | null {
  if (!path.startsWith("/")) return null;
  const parts = path.slice(1).split("/").map((p) => p.replace(/~1/g, "/").replace(/~0/g, "~"));
  return parts.every((p) => p.length > 0) ? parts : null;
}

function checkPath(parts: string[], op: EditOp["op"]): string | null {
  if (parts.length > EDIT_LIMITS.pathDepth) return "path is too deep";
  if (parts.some((p) => FORBIDDEN_SEGMENTS.has(p))) return "path contains a forbidden segment";
  const [section, field] = parts as [string, string | undefined];
  if (!EDITABLE_SECTIONS.has(section)) return `"${section}" cannot be edited (editable: ${[...EDITABLE_SECTIONS].join(", ")})`;
  if (section === "meta") {
    if (!field || !EDITABLE_META.has(field)) return `meta.${field ?? ""} cannot be edited (editable: ${[...EDITABLE_META].join(", ")})`;
    if (op === "remove") return "meta fields cannot be removed";
  }
  if (parts.length === 1 && op === "remove") return `the whole "${section}" section cannot be removed`;
  return null;
}

/**
 * Apply the operations to a deep copy of `spec`. Returns precise, path-addressed errors (fed back to the model
 * in the repair loop) or the edited raw document, which still has to pass `validateGameSpec`.
 */
export function applyEditOps(spec: GameSpec, ops: readonly EditOp[], maxOps: number): { ok: true; raw: unknown } | { ok: false; errors: string[] } {
  if (ops.length > maxOps) return { ok: false, errors: [`too many operations (${ops.length}); at most ${maxOps} are allowed — make a smaller, focused edit`] };
  const doc = structuredClone(spec) as unknown as Record<string, Json>;
  const errors: string[] = [];

  ops.forEach((o, i) => {
    const label = `ops[${i}] (${o.op} ${o.path})`;
    const parts = parsePointer(o.path);
    if (!parts) return errors.push(`${label}: path must be a JSON pointer like /areas/0/name`);
    const bad = checkPath(parts, o.op);
    if (bad) return errors.push(`${label}: ${bad}`);
    if (o.op !== "remove" && JSON.stringify(o.value ?? null).length > EDIT_LIMITS.valueChars) return errors.push(`${label}: value is too large`);

    // Walk to the parent container.
    let parent: Json = doc;
    for (const seg of parts.slice(0, -1)) {
      if (Array.isArray(parent)) {
        const idx = /^\d+$/.test(seg) ? Number(seg) : -1;
        parent = parent[idx];
      } else if (isObj(parent)) parent = Object.hasOwn(parent, seg) ? parent[seg] : undefined;
      else parent = undefined;
      if (parent === undefined) return errors.push(`${label}: path does not exist in the game`);
    }
    const last = parts[parts.length - 1]!;

    if (Array.isArray(parent)) {
      if (o.op === "add") {
        const idx = last === "-" ? parent.length : /^\d+$/.test(last) ? Number(last) : -1;
        if (idx < 0 || idx > parent.length) return errors.push(`${label}: index out of range (the list has ${parent.length} items; use "-" to append)`);
        parent.splice(idx, 0, structuredClone(o.value));
      } else {
        const idx = /^\d+$/.test(last) ? Number(last) : -1;
        if (idx < 0 || idx >= parent.length) return errors.push(`${label}: index out of range (the list has ${parent.length} items)`);
        if (o.op === "replace") parent[idx] = structuredClone(o.value);
        else parent.splice(idx, 1);
      }
    } else if (isObj(parent)) {
      const exists = Object.hasOwn(parent, last);
      if (o.op === "replace" && !exists) return errors.push(`${label}: nothing to replace there (use "add" to create it)`);
      if (o.op === "remove" && !exists) return errors.push(`${label}: nothing to remove there`);
      if (o.op === "remove") delete parent[last];
      else parent[last] = structuredClone(o.value);
    } else {
      errors.push(`${label}: parent is not a container`);
    }
  });

  return errors.length ? { ok: false, errors } : { ok: true, raw: doc };
}

/** Fields that identify the game and must come out of an edit unchanged. */
export function identityChanges(before: GameSpec, after: GameSpec): string[] {
  const out: string[] = [];
  for (const k of ["subject", "gameType", "difficulty", "language"] as const) {
    if (before.meta[k] !== after.meta[k]) out.push(`meta.${k} must stay "${before.meta[k]}"`);
  }
  return out;
}

/** Content that the edit changed, ignoring the server-assigned provenance. */
export function sameContent(a: GameSpec, b: GameSpec): boolean {
  const strip = (s: GameSpec) => JSON.stringify({ ...s, meta: { ...s.meta, generator: undefined } });
  return strip(a) === strip(b);
}
